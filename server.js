const express = require('express');
const path = require('path');
const https = require('https');

const app = express();
const PORT = process.env.PORT || 5000;
const rootDir = __dirname;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-flash-latest';

const htmlPages = new Set([
  'about.html',
  'admin-feed.html',
  'contact.html',
  'feedback.html',
  'help.html',
  'index.html',
  'job-post-from.html',
  'membership.html',
  'owner-feed.html',
  'prime-feed.html',
  'profile.html',
  'resume-builder.html',
  'user-feed.html'
]);

app.disable('x-powered-by');
app.use(express.json({ limit: '1mb' }));
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

app.use('/css', express.static(path.join(rootDir, 'css')));
app.use('/js', express.static(path.join(rootDir, 'js')));
app.use('/attached_assets', express.static(path.join(rootDir, 'attached_assets')));
app.use('/public', express.static(path.join(rootDir, 'public')));

app.get('/', (req, res) => res.sendFile(path.join(rootDir, 'index.html')));
app.get('/logo.png', (req, res) => res.sendFile(path.join(rootDir, 'logo.png')));

app.get('/manifest.webmanifest', (req, res) => {
  res.setHeader('Content-Type', 'application/manifest+json');
  res.sendFile(path.join(rootDir, 'manifest.webmanifest'));
});
app.get('/sw.js', (req, res) => {
  res.setHeader('Content-Type', 'application/javascript');
  res.setHeader('Service-Worker-Allowed', '/');
  res.sendFile(path.join(rootDir, 'sw.js'));
});
app.get('/offline.html', (req, res) => res.sendFile(path.join(rootDir, 'offline.html')));

function callGeminiModel(model, contents, systemInstruction, opts = {}) {
  return new Promise((resolve, reject) => {
    if (!GEMINI_API_KEY) return reject(new Error('GEMINI_API_KEY missing'));
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
    const req = https.request({
      hostname: 'generativelanguage.googleapis.com',
      path: `/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }
    }, (r) => {
      let data = '';
      r.on('data', (c) => data += c);
      r.on('end', () => {
        try {
          const j = JSON.parse(data);
          if (j.error) {
            const err = new Error(j.error.message || 'Gemini error');
            err.code = j.error.code || r.statusCode;
            return reject(err);
          }
          const text = j.candidates?.[0]?.content?.parts?.[0]?.text || '';
          resolve(text);
        } catch (e) { reject(e); }
      });
    });
    req.on('error', reject);
    req.write(body); req.end();
  });
}

async function callGemini(contents, systemInstruction, opts = {}) {
  const fallbacks = [GEMINI_MODEL, 'gemini-2.5-flash', 'gemini-flash-latest', 'gemini-2.0-flash'];
  const tried = new Set();
  let lastErr = null;
  for (const m of fallbacks) {
    if (!m || tried.has(m)) continue;
    tried.add(m);
    try {
      return await callGeminiModel(m, contents, systemInstruction, opts);
    } catch (e) {
      lastErr = e;
      const msg = String(e.message || '');
      const isQuota = e.code === 429 || /quota|rate.?limit|exceeded/i.test(msg);
      const isNotFound = e.code === 404 || /not.?found|unsupported|invalid/i.test(msg);
      if (!isQuota && !isNotFound) throw e;
      console.warn(`Model ${m} failed (${isQuota ? 'quota' : 'unavailable'}), trying next…`);
    }
  }
  throw lastErr || new Error('All Gemini models unavailable');
}

// Local fallback resume builder — used when AI quota is exhausted.
function buildFallbackResume(d) {
  const role = d.jobTitle || 'Hospitality Professional';
  const yrs = d.yearsExperience || '2+';
  const city = d.city ? ` based in ${d.city}` : '';
  const summary = `Dedicated ${role}${city} with ${yrs} years of hands-on hospitality experience. Known for warm guest interaction, attention to detail, and reliable team collaboration. Proven ability to maintain service standards in fast-paced hotel and F&B environments while consistently exceeding guest expectations.`;
  const baseSkills = ['Guest Relations', 'Customer Service', 'Communication', 'Teamwork', 'Hospitality Standards', 'Problem Solving', 'Time Management', 'Attention to Detail', 'Multitasking', 'Hygiene & Safety'];
  const userSkills = (d.skills || '').split(/[,\n;]+/).map(s => s.trim()).filter(Boolean);
  const skills = Array.from(new Set([...userSkills, ...baseSkills])).slice(0, 12);
  const expRaw = (d.experience || '').split(/\n{2,}|\n/).map(s => s.trim()).filter(Boolean);
  const experience = expRaw.length ? expRaw.slice(0, 4).map(line => ({
    title: role, company: line.split(/[@,–-]/)[1]?.trim() || 'Hospitality Establishment',
    period: 'Recent', bullets: [
      `Delivered consistent, high-quality service while handling guest queries and requests promptly.`,
      `Coordinated with team members to maintain smooth daily operations and uphold service standards.`,
      `Adhered to hygiene, safety, and brand-quality protocols at all times.`
    ]
  })) : [{
    title: role, company: 'Hospitality Establishment', period: `${yrs} years`,
    bullets: [
      `Delivered warm, attentive service to guests, maintaining high satisfaction scores.`,
      `Collaborated with cross-functional teams to ensure smooth daily operations.`,
      `Followed all hygiene, safety, and brand-quality standards consistently.`
    ]
  }];
  const eduRaw = (d.education || '').split(/\n+/).map(s => s.trim()).filter(Boolean);
  const education = eduRaw.length ? eduRaw.map(line => ({
    degree: line.split(/[—–-]/)[0]?.trim() || 'Diploma',
    institution: line.split(/[—–-]/)[1]?.trim() || 'Hospitality Institute',
    period: 'Completed'
  })) : [{ degree: 'Diploma in Hospitality / Hotel Management', institution: 'Hospitality Institute', period: 'Completed' }];
  const certifications = (d.certifications || '').split(/[,\n;]+/).map(s => s.trim()).filter(Boolean);
  const languages = (d.languages || 'English, Hindi').split(/[,\n;]+/).map(s => s.trim()).filter(Boolean);
  const hobbies = (d.hobbies || '').split(/[,\n;]+/).map(s => s.trim()).filter(Boolean);
  return { summary, skills, experience, education, certifications, languages, hobbies };
}

const ASSISTANT_SYSTEM = `You are "HC Assistant", the official AI helper for Hospitality Careers — an Indian hospitality job portal (hotels, resorts, restaurants, F&B, kitchen, front office, housekeeping, spa).
Be friendly, concise (max 6 short bullet points or 120 words), use emojis sparingly, and format with **bold** for key points.
Always reply in the user's language: English, Hindi (हिन्दी), or Bangla (বাংলা) — match what the user writes.
Site facts you MUST use:
- Roles: User, Prime (₹499/month), Admin, Owner
- Pages: Find Job, Hire Staff, Membership (UPI payment), Profile, Feedback, Help, Contact
- Prime benefits: see all jobs, download resumes, direct employer contact, priority applications, job alerts
- Payment: UPI to ssandeepsarkar143-2@okhdfcbank, enter UTR after paying, admin verifies in 24h
- Resume Builder: AI-powered, available at /resume-builder.html — collects user info & generates pro PDF
- App install: site is a PWA — tap "Add to Home Screen" on Android/iOS browser to install as app
For job/career/interview/CV questions answer expertly.
Never invent prices, phone numbers, or emails. If unsure, suggest visiting the Contact page.`;

// Phase 7 — preview session end beacon (best-effort, no auth needed; client-side rules govern Firestore writes)
app.post('/api/preview-end', (req, res) => { res.status(204).end(); });

app.post('/api/chat', async (req, res) => {
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
    const reply = await callGemini(contents, sys);
    res.json({ reply: reply || 'Sorry, I could not generate a reply. Please try again.' });
  } catch (e) {
    console.error('chat error', e.message);
    res.status(500).json({ error: 'AI unavailable', detail: e.message });
  }
});

// Phase 6 — Gemini Live AI mix: Server-Sent Events streaming chat endpoint
function streamGeminiSSE(res, model, contents, systemInstruction) {
  return new Promise((resolve, reject) => {
    if (!GEMINI_API_KEY) return reject(new Error('GEMINI_API_KEY missing'));
    const body = JSON.stringify({
      contents,
      ...(systemInstruction ? { systemInstruction: { parts: [{ text: systemInstruction }] } } : {}),
      generationConfig: { temperature: 0.7, maxOutputTokens: 1024 }
    });
    const req2 = https.request({
      hostname: 'generativelanguage.googleapis.com',
      path: `/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${GEMINI_API_KEY}`,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) }
    }, (r) => {
      let buf = '';
      let total = '';
      r.on('data', (chunk) => {
        buf += chunk.toString('utf8');
        const lines = buf.split('\n');
        buf = lines.pop() || '';
        for (const line of lines) {
          if (!line.startsWith('data:')) continue;
          const payload = line.slice(5).trim();
          if (!payload || payload === '[DONE]') continue;
          try {
            const j = JSON.parse(payload);
            if (j.error) { res.write(`event: error\ndata: ${JSON.stringify({ message: j.error.message })}\n\n`); continue; }
            const text = j.candidates?.[0]?.content?.parts?.[0]?.text || '';
            if (text) {
              total += text;
              res.write(`data: ${JSON.stringify({ delta: text })}\n\n`);
            }
          } catch (_) {}
        }
      });
      r.on('end', () => { res.write(`event: done\ndata: ${JSON.stringify({ full: total })}\n\n`); resolve(total); });
    });
    req2.on('error', reject);
    req2.write(body); req2.end();
  });
}

app.post('/api/chat-stream', async (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders?.();
  try {
    const { message, history = [], lang = 'en' } = req.body || {};
    if (!message || typeof message !== 'string') {
      res.write(`event: error\ndata: ${JSON.stringify({ message: 'message required' })}\n\n`);
      return res.end();
    }
    if (!GEMINI_API_KEY) {
      res.write(`event: error\ndata: ${JSON.stringify({ message: 'AI not configured' })}\n\n`);
      return res.end();
    }
    const trimmedHistory = history.slice(-8).filter(m => m && m.role && m.text).map(m => ({
      role: m.role === 'bot' ? 'model' : 'user',
      parts: [{ text: String(m.text).slice(0, 2000) }]
    }));
    const langMap = { en: 'English', hi: 'Hindi', bn: 'Bangla' };
    const sys = `${ASSISTANT_SYSTEM}\nUser preferred language: ${langMap[lang] || 'English'}.`;
    const contents = [...trimmedHistory, { role: 'user', parts: [{ text: message.slice(0, 1000) }] }];
    // Try streaming with first available model from fallbacks
    const fallbacks = [GEMINI_MODEL, 'gemini-2.5-flash', 'gemini-flash-latest', 'gemini-2.0-flash'];
    const tried = new Set();
    let success = false;
    for (const m of fallbacks) {
      if (!m || tried.has(m)) continue;
      tried.add(m);
      try {
        await streamGeminiSSE(res, m, contents, sys);
        success = true; break;
      } catch (e) {
        if (m === fallbacks[fallbacks.length - 1]) {
          res.write(`event: error\ndata: ${JSON.stringify({ message: e.message })}\n\n`);
        }
      }
    }
    res.end();
  } catch (e) {
    console.error('chat-stream error', e.message);
    try { res.write(`event: error\ndata: ${JSON.stringify({ message: e.message })}\n\n`); res.end(); } catch (_) {}
  }
});

app.post('/api/resume', async (req, res) => {
  try {
    const { profile = {} } = req.body || {};
    const safe = (v, max = 500) => String(v || '').slice(0, max);
    const data = {
      fullName: safe(profile.fullName, 100),
      email: safe(profile.email, 100),
      phone: safe(profile.phone, 30),
      city: safe(profile.city, 80),
      jobTitle: safe(profile.jobTitle, 100),
      yearsExperience: safe(profile.yearsExperience, 10),
      experience: safe(profile.experience, 2000),
      education: safe(profile.education, 800),
      skills: safe(profile.skills, 500),
      certifications: safe(profile.certifications, 500),
      languages: safe(profile.languages, 200),
      hobbies: safe(profile.hobbies, 200)
    };
    if (!data.fullName || !data.jobTitle) return res.status(400).json({ error: 'fullName and jobTitle required' });
    // Echo photo back to client (kept out of `data` for size safety)
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
Rules: keep bullets action-oriented & quantified where possible; reflect hospitality (hotels, F&B, front office, housekeeping, etc.); if a field is empty, infer reasonable defaults from job title; max 4 experience entries.`;
    let parsed = null;
    let usedFallback = false;
    try {
      const text = await callGemini([{ role: 'user', parts: [{ text: prompt }] }],
        'You are a professional CV writer for the hospitality industry. Output ONLY raw JSON. No markdown, no commentary, no code fences.',
        { temperature: 0.6, maxOutputTokens: 2500, responseMimeType: 'application/json' });
      let cleaned = text.replace(/^[\s\S]*?(\{)/, '$1').replace(/```/g, '').trim();
      const lastBrace = cleaned.lastIndexOf('}');
      if (lastBrace > 0) cleaned = cleaned.slice(0, lastBrace + 1);
      try { parsed = JSON.parse(cleaned); }
      catch (err) {
        console.error('JSON parse failed, using fallback. Raw:', text.slice(0, 200));
        parsed = buildFallbackResume(data);
        usedFallback = true;
      }
    } catch (genErr) {
      const msg = String(genErr.message || '');
      const isQuota = /quota|rate.?limit|exceeded|429/i.test(msg);
      console.warn('Gemini failed, building local resume:', msg.slice(0, 120));
      parsed = buildFallbackResume(data);
      usedFallback = true;
      // Surface a friendly notice but still return a usable resume
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

// ===== AI JOB MATCH (Gemini-powered) =====
// POST { profile:{...}, jobs:[...], topK?:number } → { matches:[{id,score,reason}], fallback? }
function __jmTrimJob(j) {
  return {
    id: String(j.id || ''),
    title: String(j.title || j.position || '').slice(0, 80),
    department: String(j.department || '').slice(0, 40),
    location: String(j.location || '').slice(0, 60),
    state: String(j.state || '').slice(0, 40),
    salary: Number(j.salary || 0) || 0,
    experience: String(j.experience || '').slice(0, 40),
    accommodation: String(j.accommodation || '').slice(0, 10),
    description: String(j.description || '').slice(0, 220)
  };
}
function __jmTrimProfile(p) {
  return {
    jobTitle: String(p.jobTitle || p.position || '').slice(0, 80),
    skills: String(p.skills || '').slice(0, 400),
    experience: String(p.experience || p.yearsExperience || '').slice(0, 400),
    city: String(p.city || '').slice(0, 60),
    state: String(p.state || '').slice(0, 40),
    languages: String(p.languages || '').slice(0, 120),
    education: String(p.education || '').slice(0, 200),
    department: String(p.department || '').slice(0, 40),
    preferredSalary: Number(p.preferredSalary || p.salary || 0) || 0
  };
}
function __jmFallback(profile, jobs, topK) {
  const tokens = (s) => String(s || '').toLowerCase().split(/[^a-z0-9+]+/i).filter(t => t.length > 2);
  const profTokens = new Set([...tokens(profile.jobTitle), ...tokens(profile.skills), ...tokens(profile.experience), ...tokens(profile.department)]);
  const profCity = (profile.city || '').toLowerCase();
  const profState = (profile.state || '').toLowerCase();
  return jobs.map(j => {
    const jt = new Set([...tokens(j.title), ...tokens(j.department), ...tokens(j.description), ...tokens(j.experience)]);
    let overlap = 0;
    profTokens.forEach(t => { if (jt.has(t)) overlap++; });
    let score = Math.min(95, 35 + overlap * 12);
    if (profCity && (j.location || '').toLowerCase().includes(profCity)) score += 8;
    if (profState && (j.state || '').toLowerCase().includes(profState)) score += 4;
    if (profile.preferredSalary && j.salary && j.salary >= profile.preferredSalary) score += 4;
    score = Math.max(35, Math.min(98, score));
    const reason = overlap > 0
      ? `${overlap} skill keyword${overlap > 1 ? 's' : ''} overlap with ${j.title || 'this role'}.`
      : `Open ${j.title || 'role'} in ${j.location || 'India'} matching your hospitality profile.`;
    return { id: j.id, score, reason };
  }).sort((a, b) => b.score - a.score).slice(0, topK);
}
app.post('/api/job-match', async (req, res) => {
  try {
    const rawJobs = Array.isArray(req.body?.jobs) ? req.body.jobs : [];
    const topK = Math.max(1, Math.min(10, parseInt(req.body?.topK, 10) || 5));
    if (!rawJobs.length) return res.status(400).json({ error: 'jobs[] required' });
    const profile = __jmTrimProfile(req.body?.profile || {});
    const jobs = rawJobs.slice(0, 30).map(__jmTrimJob).filter(j => j.id && j.title);
    if (!jobs.length) return res.status(400).json({ error: 'no usable jobs' });
    if (!GEMINI_API_KEY) {
      return res.json({ matches: __jmFallback(profile, jobs, topK), fallback: true });
    }
    const prompt = `You are an AI job-matching engine for an Indian hospitality job portal.
Score each job (0-100) against the candidate based on skills overlap, role/department fit, location proximity, experience level, and salary fit.
Return ONLY raw JSON of the shape:
{"matches":[{"id":"<jobId>","score":<0-100 integer>,"reason":"<one short sentence, max 18 words>"} ...]}
Include EVERY job from the input list (same id strings). Do NOT reorder — the client will sort. Reason must be specific to that job (mention skill, location, or experience match).

Candidate profile:
${JSON.stringify(profile)}

Open jobs:
${JSON.stringify(jobs)}`;
    let parsed = null;
    try {
      const text = await callGemini(
        [{ role: 'user', parts: [{ text: prompt }] }],
        'You are a precise JSON-only job-matching engine. Output ONLY raw JSON. No markdown, no commentary.',
        { temperature: 0.4, maxOutputTokens: 2048, responseMimeType: 'application/json' }
      );
      let cleaned = String(text || '').replace(/^[\s\S]*?(\{)/, '$1').replace(/```/g, '').trim();
      const lastBrace = cleaned.lastIndexOf('}');
      if (lastBrace > 0) cleaned = cleaned.slice(0, lastBrace + 1);
      const obj = JSON.parse(cleaned);
      if (obj && Array.isArray(obj.matches)) parsed = obj.matches;
    } catch (err) { console.warn('job-match Gemini fail:', err.message); }
    let matches; let fallback = false;
    if (parsed && parsed.length) {
      const byId = new Map(jobs.map(j => [j.id, j]));
      matches = parsed
        .filter(m => m && byId.has(String(m.id)))
        .map(m => ({
          id: String(m.id),
          score: Math.max(0, Math.min(100, parseInt(m.score, 10) || 0)),
          reason: String(m.reason || '').slice(0, 200)
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, topK);
      if (!matches.length) { matches = __jmFallback(profile, jobs, topK); fallback = true; }
    } else {
      matches = __jmFallback(profile, jobs, topK);
      fallback = true;
    }
    res.json({ matches, fallback });
  } catch (e) {
    console.error('job-match err:', e.message);
    res.status(500).json({ error: 'Job match failed', detail: e.message });
  }
});

// ===== TRANSLATION (Gemini-powered, batch, cached server-side in-memory) =====
const __TR_CACHE = new Map(); // key: lang|hashedText -> string
const __TR_KEY = (lang, txt) => lang + '|' + (txt.length > 80 ? txt.slice(0,80)+'#'+txt.length : txt);
app.post('/api/translate', async (req, res) => {
  try {
    const { texts = [], lang = 'en' } = req.body || {};
    if (!Array.isArray(texts) || !texts.length) return res.json({ translations: [] });
    if (texts.length > 80) return res.status(400).json({ error: 'Max 80 texts per batch' });
    if (lang === 'en') return res.json({ translations: texts });
    const langName = ({ hi: 'Hindi', bn: 'Bangla' })[lang];
    if (!langName) return res.json({ translations: texts });
    // Determine cache hits + misses
    const result = new Array(texts.length);
    const missIdx = [];
    const missTexts = [];
    texts.forEach((t, i) => {
      if (typeof t !== 'string' || !t.trim()) { result[i] = t; return; }
      const k = __TR_KEY(lang, t);
      if (__TR_CACHE.has(k)) { result[i] = __TR_CACHE.get(k); }
      else { missIdx.push(i); missTexts.push(t); }
    });
    if (!missTexts.length) return res.json({ translations: result, fromCache: true });
    if (!GEMINI_API_KEY) {
      // Fallback: echo originals
      missIdx.forEach((idx, j) => { result[idx] = missTexts[j]; });
      return res.json({ translations: result, fallback: true });
    }
    // Translate with Gemini (one call, JSON array out)
    const prompt = `Translate the following UI strings to ${langName}. Preserve placeholders like {name}, %s, $\{var\}, line breaks, leading/trailing whitespace, emoji, numbers, brand names ("Hospitality Careers"), and HTML entities. Do NOT translate proper names (people, brands), code identifiers, URLs, or email addresses. Keep the same array length and ORDER. Respond with ONLY a JSON array of translated strings — no commentary, no markdown.

Input JSON array:
${JSON.stringify(missTexts)}`;
    let translated = null;
    try {
      const out = await callGemini(
        [{ role: 'user', parts: [{ text: prompt }] }],
        'You are a precise translation engine. Output ONLY a valid JSON array of strings, same length and order as the input.',
        { temperature: 0.1, maxOutputTokens: 4096, responseMimeType: 'application/json' }
      );
      let cleaned = out.replace(/^[\s\S]*?(\[)/, '$1').replace(/```/g, '').trim();
      const lastBracket = cleaned.lastIndexOf(']');
      if (lastBracket > 0) cleaned = cleaned.slice(0, lastBracket + 1);
      const parsed = JSON.parse(cleaned);
      if (Array.isArray(parsed) && parsed.length === missTexts.length) {
        translated = parsed.map(x => typeof x === 'string' ? x : String(x ?? ''));
      }
    } catch (err) {
      console.warn('translate fail:', err.message);
    }
    if (!translated) translated = missTexts; // last-resort fallback
    missIdx.forEach((idx, j) => {
      result[idx] = translated[j];
      __TR_CACHE.set(__TR_KEY(lang, missTexts[j]), translated[j]);
    });
    // Cap cache memory
    if (__TR_CACHE.size > 5000) {
      const keys = [...__TR_CACHE.keys()].slice(0, 1000);
      keys.forEach(k => __TR_CACHE.delete(k));
    }
    res.json({ translations: result });
  } catch (e) {
    console.error('translate err:', e.message);
    res.status(500).json({ error: e.message, translations: req.body?.texts || [] });
  }
});

app.get('/:page', (req, res, next) => {
  const { page } = req.params;
  if (!htmlPages.has(page)) return next();
  res.sendFile(path.join(rootDir, page));
});

app.use((req, res) => res.status(404).send('Not found'));

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Hospitality Careers server running on port ${PORT}`);
  console.log(`Gemini AI: ${GEMINI_API_KEY ? 'enabled' : 'DISABLED (no key)'}`);
});
