/**
 * Cloud Functions for Hospitality Careers
 * Provides /api/chat and /api/resume (Gemini AI) endpoints
 * when the site is deployed on Firebase Hosting.
 *
 * Set the secret first:
 *   firebase functions:secrets:set GEMINI_API_KEY
 */
const { onRequest } = require('firebase-functions/v2/https');
const { defineSecret } = require('firebase-functions/params');
const https = require('https');

const GEMINI_API_KEY = defineSecret('GEMINI_API_KEY');

function callGeminiModel(model, contents, systemInstruction, opts, key) {
  return new Promise((resolve, reject) => {
    const generationConfig = {
      temperature: opts.temperature ?? 0.7,
      maxOutputTokens: opts.maxOutputTokens ?? 1024,
      ...(opts.responseMimeType ? { responseMimeType: opts.responseMimeType } : {})
    };
    const body = JSON.stringify({
      contents,
      ...(systemInstruction ? { systemInstruction: { parts: [{ text: systemInstruction }] } } : {}),
      generationConfig
    });
    const r = https.request({
      hostname: 'generativelanguage.googleapis.com',
      path: `/v1beta/models/${model}:generateContent?key=${key}`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }
    }, (resp) => {
      let data = '';
      resp.on('data', c => data += c);
      resp.on('end', () => {
        try {
          const j = JSON.parse(data);
          if (j.error) { const e = new Error(j.error.message || 'Gemini error'); e.code = j.error.code || resp.statusCode; return reject(e); }
          resolve(j.candidates?.[0]?.content?.parts?.[0]?.text || '');
        } catch (e) { reject(e); }
      });
    });
    r.on('error', reject);
    r.write(body); r.end();
  });
}

async function callGemini(contents, systemInstruction, opts, key) {
  const fallbacks = [process.env.GEMINI_MODEL || 'gemini-flash-latest', 'gemini-2.5-flash', 'gemini-2.0-flash'];
  const tried = new Set();
  let lastErr = null;
  for (const m of fallbacks) {
    if (!m || tried.has(m)) continue;
    tried.add(m);
    try { return await callGeminiModel(m, contents, systemInstruction, opts, key); }
    catch (e) {
      lastErr = e;
      const msg = String(e.message || '');
      const isQuota = e.code === 429 || /quota|rate.?limit|exceeded/i.test(msg);
      const isNotFound = e.code === 404 || /not.?found|unsupported|invalid/i.test(msg);
      if (!isQuota && !isNotFound) throw e;
    }
  }
  throw lastErr || new Error('All Gemini models unavailable');
}

function buildFallbackResume(d) {
  const role = d.jobTitle || 'Hospitality Professional';
  const yrs = d.yearsExperience || '2+';
  const city = d.city ? ` based in ${d.city}` : '';
  const summary = `Dedicated ${role}${city} with ${yrs} years of hands-on hospitality experience. Known for warm guest interaction, attention to detail, and reliable team collaboration.`;
  const baseSkills = ['Guest Relations','Customer Service','Communication','Teamwork','Hospitality Standards','Problem Solving','Time Management','Attention to Detail','Multitasking','Hygiene & Safety'];
  const userSkills = (d.skills || '').split(/[,\n;]+/).map(s => s.trim()).filter(Boolean);
  const skills = Array.from(new Set([...userSkills, ...baseSkills])).slice(0, 12);
  const expRaw = (d.experience || '').split(/\n{2,}|\n/).map(s => s.trim()).filter(Boolean);
  const experience = expRaw.length ? expRaw.slice(0,4).map(line => ({
    title: role, company: line.split(/[@,–-]/)[1]?.trim() || 'Hospitality Establishment',
    period: 'Recent', bullets: [
      'Delivered consistent, high-quality service while handling guest queries promptly.',
      'Coordinated with team members to maintain smooth daily operations.',
      'Adhered to hygiene, safety, and brand-quality protocols at all times.'
    ]
  })) : [{ title: role, company: 'Hospitality Establishment', period: `${yrs} years`, bullets: [
    'Delivered warm, attentive service to guests, maintaining high satisfaction scores.',
    'Collaborated with cross-functional teams for smooth daily operations.',
    'Followed all hygiene, safety, and brand-quality standards consistently.'
  ]}];
  const eduRaw = (d.education || '').split(/\n+/).map(s => s.trim()).filter(Boolean);
  const education = eduRaw.length ? eduRaw.map(line => ({
    degree: line.split(/[—–-]/)[0]?.trim() || 'Diploma',
    institution: line.split(/[—–-]/)[1]?.trim() || 'Hospitality Institute',
    period: 'Completed'
  })) : [{ degree: 'Diploma in Hospitality / Hotel Management', institution: 'Hospitality Institute', period: 'Completed' }];
  return {
    summary, skills, experience, education,
    certifications: (d.certifications||'').split(/[,\n;]+/).map(s=>s.trim()).filter(Boolean),
    languages: (d.languages||'English, Hindi').split(/[,\n;]+/).map(s=>s.trim()).filter(Boolean),
    hobbies: (d.hobbies||'').split(/[,\n;]+/).map(s=>s.trim()).filter(Boolean)
  };
}

const ASSISTANT_SYSTEM = `You are "HC Assistant", the official AI helper for Hospitality Careers — an Indian hospitality job portal (hotels, resorts, restaurants, F&B, kitchen, front office, housekeeping, spa).
Be friendly, concise (max 6 short bullet points or 120 words), use emojis sparingly, and format with **bold** for key points.
Always reply in the user's language: English, Hindi (हिन्दी), or Bangla (বাংলা) — match what the user writes.
Site facts you MUST use:
- Roles: User, Prime (₹499/month), Admin, Owner
- Pages: Find Job, Hire Staff, Membership (UPI payment), Profile, Feedback, Help, Contact
- Prime benefits: see all jobs, download resumes, direct employer contact, priority applications, job alerts
- Payment: UPI to ssandeepsarkar143-2@okhdfcbank, enter UTR after paying, admin verifies in 24h
- HC Wallet: 1 point = ₹1; top up via UPI (owner approves); use to pay Prime membership
- Refer & Earn: share your referral link; both you and your friend get 10 HC points when they buy Prime
- Resume Builder: AI-powered, available at /resume-builder.html
- App install: site is a PWA — tap "Add to Home Screen" on Android/iOS browser to install
For job/career/interview/CV questions answer expertly.
Never invent prices, phone numbers, or emails. If unsure, suggest visiting the Contact page.`;

const COMMON = { secrets: [GEMINI_API_KEY], cors: true, region: 'us-central1' };

exports.chat = onRequest({ ...COMMON, timeoutSeconds: 30, memory: '256MiB' }, async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  try {
    const { message, history = [], lang = 'en' } = req.body || {};
    if (!message || typeof message !== 'string') return res.status(400).json({ error: 'message required' });
    const trimmedHistory = history.slice(-8).filter(m => m && m.role && m.text).map(m => ({
      role: m.role === 'bot' ? 'model' : 'user',
      parts: [{ text: String(m.text).slice(0, 2000) }]
    }));
    const langMap = { en: 'English', hi: 'Hindi', bn: 'Bangla' };
    const sys = `${ASSISTANT_SYSTEM}\nUser preferred language: ${langMap[lang] || 'English'}.`;
    const contents = [...trimmedHistory, { role: 'user', parts: [{ text: message.slice(0, 1000) }] }];
    const reply = await callGemini(contents, sys, {}, GEMINI_API_KEY.value());
    res.json({ reply: reply || 'Sorry, I could not generate a reply. Please try again.' });
  } catch (e) {
    console.error('chat error', e.message);
    res.status(500).json({ error: 'AI unavailable', detail: e.message });
  }
});

exports.resume = onRequest({ ...COMMON, timeoutSeconds: 60, memory: '512MiB' }, async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  try {
    const { profile = {} } = req.body || {};
    const safe = (v, max = 500) => String(v || '').slice(0, max);
    const data = {
      fullName: safe(profile.fullName, 100), email: safe(profile.email, 100),
      phone: safe(profile.phone, 30), city: safe(profile.city, 80),
      jobTitle: safe(profile.jobTitle, 100), yearsExperience: safe(profile.yearsExperience, 10),
      experience: safe(profile.experience, 2000), education: safe(profile.education, 800),
      skills: safe(profile.skills, 500), certifications: safe(profile.certifications, 500),
      languages: safe(profile.languages, 200), hobbies: safe(profile.hobbies, 200)
    };
    if (!data.fullName || !data.jobTitle) return res.status(400).json({ error: 'fullName and jobTitle required' });
    const photo = typeof profile.photo === 'string' && profile.photo.startsWith('data:image/') ? profile.photo : '';
    const prompt = `Build a polished, ATS-friendly hospitality-industry resume in JSON for the candidate below.
Return ONLY valid JSON (no markdown fences) with this exact shape:
{
  "summary": "3-4 line professional summary",
  "skills": ["skill1","skill2", ...8-12 items, hospitality-relevant],
  "experience": [{"title":"","company":"","period":"","bullets":["",""]} ...],
  "education": [{"degree":"","institution":"","period":""} ...],
  "certifications": ["..."],
  "languages": ["..."],
  "hobbies": ["..."]
}
Candidate raw data:
${JSON.stringify(data, null, 2)}
Rules: keep bullets action-oriented & quantified where possible; reflect hospitality; if a field is empty, infer reasonable defaults from job title; max 4 experience entries.`;
    let parsed = null, usedFallback = false;
    try {
      const text = await callGemini([{ role: 'user', parts: [{ text: prompt }] }],
        'You are a professional CV writer for the hospitality industry. Output ONLY raw JSON. No markdown, no commentary, no code fences.',
        { temperature: 0.6, maxOutputTokens: 2500, responseMimeType: 'application/json' }, GEMINI_API_KEY.value());
      let cleaned = text.replace(/^[\s\S]*?(\{)/, '$1').replace(/```/g, '').trim();
      const lastBrace = cleaned.lastIndexOf('}');
      if (lastBrace > 0) cleaned = cleaned.slice(0, lastBrace + 1);
      try { parsed = JSON.parse(cleaned); }
      catch { parsed = buildFallbackResume(data); usedFallback = true; }
    } catch (genErr) {
      const msg = String(genErr.message || '');
      const isQuota = /quota|rate.?limit|exceeded|429/i.test(msg);
      parsed = buildFallbackResume(data); usedFallback = true;
      return res.json({ profile: { ...data, photo }, resume: parsed, fallback: true,
        notice: isQuota
          ? 'Our smart writer is busy right now (daily limit reached). We built your resume with our built-in template — fully editable & downloadable.'
          : 'Built using our built-in template. You can still download and edit it freely.'
      });
    }
    res.json({ profile: { ...data, photo }, resume: parsed, fallback: usedFallback });
  } catch (e) {
    console.error('resume error', e.message);
    res.status(500).json({ error: 'Resume generation failed', detail: e.message });
  }
});
