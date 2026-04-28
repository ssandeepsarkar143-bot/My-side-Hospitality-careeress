/**
 * Hospitality Careers — Gemini AI Proxy (Cloudflare Worker)
 *
 * Free-tier replacement for the Express /api/* endpoints in server.js.
 * Holds the Gemini API key as an encrypted Worker secret (`GEMINI_KEY`)
 * so it is never exposed to the browser.
 *
 * Endpoints (all POST, JSON):
 *   /api/chat          → { reply }
 *   /api/chat-stream   → text/event-stream (SSE)
 *   /api/resume        → { profile, resume, fallback?, notice? }
 *   /api/job-match     → { matches:[{id,score,reason}], fallback? }
 *   /api/translate     → { translations }
 *   /api/preview-end   → 204 (no-op beacon)
 *
 * Required Worker variables (Settings → Variables):
 *   GEMINI_KEY        (Secret, encrypted)   — your Gemini API key (AIza...)
 *   GEMINI_MODEL      (Plain text, optional) — defaults to "gemini-flash-latest"
 *   ALLOWED_ORIGINS   (Plain text, optional) — comma-separated list of allowed
 *                                              origins. Use "*" or leave empty
 *                                              to allow any origin.
 */

const DEFAULT_MODEL = 'gemini-flash-latest';
const MODEL_FALLBACKS = ['gemini-2.5-flash', 'gemini-flash-latest', 'gemini-2.0-flash'];

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

// ---------- CORS ----------
function corsHeaders(req, env) {
  const origin = req.headers.get('Origin') || '';
  const allowed = (env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
  let allowOrigin = '*';
  if (allowed.length && !allowed.includes('*')) {
    allowOrigin = allowed.includes(origin) ? origin : allowed[0];
  }
  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Accept',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin'
  };
}
function jsonResponse(req, env, obj, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders(req, env), ...extraHeaders }
  });
}

// ---------- Gemini call (non-streaming) ----------
async function callGeminiModel(env, model, contents, systemInstruction, opts = {}) {
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
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${env.GEMINI_KEY}`;
  const r = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body
  });
  const text = await r.text();
  let j;
  try { j = JSON.parse(text); } catch { throw new Error('Invalid Gemini response'); }
  if (j.error) {
    const err = new Error(j.error.message || 'Gemini error');
    err.code = j.error.code || r.status;
    throw err;
  }
  return j.candidates?.[0]?.content?.parts?.[0]?.text || '';
}
async function callGemini(env, contents, systemInstruction, opts = {}) {
  const primary = env.GEMINI_MODEL || DEFAULT_MODEL;
  const order = [primary, ...MODEL_FALLBACKS];
  const tried = new Set();
  let lastErr = null;
  for (const m of order) {
    if (!m || tried.has(m)) continue;
    tried.add(m);
    try {
      return await callGeminiModel(env, m, contents, systemInstruction, opts);
    } catch (e) {
      lastErr = e;
      const msg = String(e.message || '');
      const isQuota = e.code === 429 || /quota|rate.?limit|exceeded/i.test(msg);
      const isNotFound = e.code === 404 || /not.?found|unsupported|invalid/i.test(msg);
      if (!isQuota && !isNotFound) throw e;
    }
  }
  throw lastErr || new Error('All Gemini models unavailable');
}

// ---------- Local fallback resume (used when Gemini is unavailable) ----------
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
      'Delivered consistent, high-quality service while handling guest queries and requests promptly.',
      'Coordinated with team members to maintain smooth daily operations and uphold service standards.',
      'Adhered to hygiene, safety, and brand-quality protocols at all times.'
    ]
  })) : [{
    title: role, company: 'Hospitality Establishment', period: `${yrs} years`,
    bullets: [
      'Delivered warm, attentive service to guests, maintaining high satisfaction scores.',
      'Collaborated with cross-functional teams to ensure smooth daily operations.',
      'Followed all hygiene, safety, and brand-quality standards consistently.'
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

// ---------- /api/chat ----------
async function handleChat(req, env) {
  const body = await req.json().catch(() => ({}));
  const { message, history = [], lang = 'en' } = body || {};
  if (!message || typeof message !== 'string') {
    return jsonResponse(req, env, { error: 'message required' }, 400);
  }
  const trimmedHistory = history.slice(-8).filter(m => m && m.role && m.text).map(m => ({
    role: m.role === 'bot' ? 'model' : 'user',
    parts: [{ text: String(m.text).slice(0, 2000) }]
  }));
  const langMap = { en: 'English', hi: 'Hindi', bn: 'Bangla' };
  const sys = `${ASSISTANT_SYSTEM}\nUser preferred language: ${langMap[lang] || 'English'}.`;
  const contents = [...trimmedHistory, { role: 'user', parts: [{ text: message.slice(0, 1000) }] }];
  try {
    const reply = await callGemini(env, contents, sys);
    return jsonResponse(req, env, { reply: reply || 'Sorry, I could not generate a reply. Please try again.' });
  } catch (e) {
    return jsonResponse(req, env, { error: 'AI unavailable', detail: e.message }, 500);
  }
}

// ---------- /api/chat-stream (SSE) ----------
async function handleChatStream(req, env) {
  const body = await req.json().catch(() => ({}));
  const { message, history = [], lang = 'en' } = body || {};
  const enc = new TextEncoder();
  const cors = corsHeaders(req, env);
  const sseHeaders = {
    ...cors,
    'Content-Type': 'text/event-stream; charset=utf-8',
    'Cache-Control': 'no-cache, no-transform',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no'
  };

  if (!message || typeof message !== 'string') {
    const body = enc.encode(`event: error\ndata: ${JSON.stringify({ message: 'message required' })}\n\n`);
    return new Response(body, { status: 200, headers: sseHeaders });
  }
  if (!env.GEMINI_KEY) {
    const body = enc.encode(`event: error\ndata: ${JSON.stringify({ message: 'AI not configured' })}\n\n`);
    return new Response(body, { status: 200, headers: sseHeaders });
  }

  const trimmedHistory = history.slice(-8).filter(m => m && m.role && m.text).map(m => ({
    role: m.role === 'bot' ? 'model' : 'user',
    parts: [{ text: String(m.text).slice(0, 2000) }]
  }));
  const langMap = { en: 'English', hi: 'Hindi', bn: 'Bangla' };
  const sys = `${ASSISTANT_SYSTEM}\nUser preferred language: ${langMap[lang] || 'English'}.`;
  const contents = [...trimmedHistory, { role: 'user', parts: [{ text: message.slice(0, 1000) }] }];

  const { readable, writable } = new TransformStream();
  const writer = writable.getWriter();
  const write = (s) => writer.write(enc.encode(s));

  (async () => {
    const primary = env.GEMINI_MODEL || DEFAULT_MODEL;
    const order = [primary, ...MODEL_FALLBACKS];
    const tried = new Set();
    let success = false;
    let total = '';
    let lastErr = null;
    for (const model of order) {
      if (!model || tried.has(model)) continue;
      tried.add(model);
      try {
        const upstream = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${env.GEMINI_KEY}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents,
              systemInstruction: { parts: [{ text: sys }] },
              generationConfig: { temperature: 0.7, maxOutputTokens: 1024 }
            })
          }
        );
        if (!upstream.ok || !upstream.body) {
          const errTxt = await upstream.text().catch(() => '');
          lastErr = new Error(errTxt || ('upstream ' + upstream.status));
          continue;
        }
        const reader = upstream.body.getReader();
        const decoder = new TextDecoder();
        let buf = '';
        let gotData = false;
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buf += decoder.decode(value, { stream: true });
          const lines = buf.split('\n');
          buf = lines.pop() || '';
          for (const ln of lines) {
            if (!ln.startsWith('data:')) continue;
            const payload = ln.slice(5).trim();
            if (!payload || payload === '[DONE]') continue;
            try {
              const j = JSON.parse(payload);
              if (j.error) {
                await write(`event: error\ndata: ${JSON.stringify({ message: j.error.message })}\n\n`);
                continue;
              }
              const text = j.candidates?.[0]?.content?.parts?.[0]?.text || '';
              if (text) {
                gotData = true;
                total += text;
                await write(`data: ${JSON.stringify({ delta: text })}\n\n`);
              }
            } catch (_) { /* ignore malformed line */ }
          }
        }
        if (gotData) { success = true; break; }
      } catch (e) {
        lastErr = e;
      }
    }
    if (!success && lastErr) {
      await write(`event: error\ndata: ${JSON.stringify({ message: lastErr.message })}\n\n`);
    } else {
      await write(`event: done\ndata: ${JSON.stringify({ full: total })}\n\n`);
    }
    await writer.close();
  })().catch(async (e) => {
    try {
      await write(`event: error\ndata: ${JSON.stringify({ message: e.message })}\n\n`);
      await writer.close();
    } catch (_) {}
  });

  return new Response(readable, { status: 200, headers: sseHeaders });
}

// ---------- /api/resume ----------
async function handleResume(req, env) {
  const body = await req.json().catch(() => ({}));
  const { profile = {} } = body || {};
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
  if (!data.fullName || !data.jobTitle) {
    return jsonResponse(req, env, { error: 'fullName and jobTitle required' }, 400);
  }
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
    const text = await callGemini(env,
      [{ role: 'user', parts: [{ text: prompt }] }],
      'You are a professional CV writer for the hospitality industry. Output ONLY raw JSON. No markdown, no commentary, no code fences.',
      { temperature: 0.6, maxOutputTokens: 2500, responseMimeType: 'application/json' }
    );
    let cleaned = text.replace(/^[\s\S]*?(\{)/, '$1').replace(/```/g, '').trim();
    const lastBrace = cleaned.lastIndexOf('}');
    if (lastBrace > 0) cleaned = cleaned.slice(0, lastBrace + 1);
    try { parsed = JSON.parse(cleaned); }
    catch (_err) {
      parsed = buildFallbackResume(data);
      usedFallback = true;
    }
  } catch (genErr) {
    const msg = String(genErr.message || '');
    const isQuota = /quota|rate.?limit|exceeded|429/i.test(msg);
    parsed = buildFallbackResume(data);
    return jsonResponse(req, env, {
      profile: { ...data, photo },
      resume: parsed,
      fallback: true,
      notice: isQuota
        ? 'Our smart writer is busy right now (daily limit reached). We built your resume with our built-in template — fully editable & downloadable.'
        : 'Built using our built-in template. You can still download and edit it freely.'
    });
  }
  return jsonResponse(req, env, { profile: { ...data, photo }, resume: parsed, fallback: usedFallback });
}

// ---------- /api/job-match ----------
// Score a candidate's profile/resume against a list of open jobs and return
// the top picks with a 0-100 score and a one-line reason.
//
// POST body:
//   { profile: { jobTitle, skills, experience, city, state, languages, ... },
//     jobs:    [ { id, title, position, department, location, state, salary,
//                  experience, accommodation, description } ... ] }   (max 30)
//   topK?:    number (default 5)
//
// Returns: { matches: [ { id, score, reason } ] } sorted by score desc.
function trimJob(j) {
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
function trimProfile(p) {
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
function fallbackScoreJobs(profile, jobs, topK) {
  // Lightweight keyword/score fallback when Gemini is unavailable or returns garbage.
  const tokens = (s) => String(s || '').toLowerCase().split(/[^a-z0-9+]+/i).filter(t => t.length > 2);
  const profTokens = new Set([
    ...tokens(profile.jobTitle),
    ...tokens(profile.skills),
    ...tokens(profile.experience),
    ...tokens(profile.department)
  ]);
  const profCity = (profile.city || '').toLowerCase();
  const profState = (profile.state || '').toLowerCase();
  const scored = jobs.map(j => {
    const jt = new Set([
      ...tokens(j.title), ...tokens(j.department), ...tokens(j.description), ...tokens(j.experience)
    ]);
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
  }).sort((a, b) => b.score - a.score);
  return scored.slice(0, topK);
}
async function handleJobMatch(req, env) {
  const body = await req.json().catch(() => ({}));
  const rawJobs = Array.isArray(body?.jobs) ? body.jobs : [];
  const topK = Math.max(1, Math.min(10, parseInt(body?.topK, 10) || 5));
  if (!rawJobs.length) {
    return jsonResponse(req, env, { error: 'jobs[] required' }, 400);
  }
  const profile = trimProfile(body?.profile || {});
  const jobs = rawJobs.slice(0, 30).map(trimJob).filter(j => j.id && j.title);
  if (!jobs.length) {
    return jsonResponse(req, env, { error: 'no usable jobs' }, 400);
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
    const text = await callGemini(env,
      [{ role: 'user', parts: [{ text: prompt }] }],
      'You are a precise JSON-only job-matching engine. Output ONLY raw JSON. No markdown, no commentary.',
      { temperature: 0.4, maxOutputTokens: 2048, responseMimeType: 'application/json' }
    );
    let cleaned = String(text || '').replace(/^[\s\S]*?(\{)/, '$1').replace(/```/g, '').trim();
    const lastBrace = cleaned.lastIndexOf('}');
    if (lastBrace > 0) cleaned = cleaned.slice(0, lastBrace + 1);
    const obj = JSON.parse(cleaned);
    if (obj && Array.isArray(obj.matches)) parsed = obj.matches;
  } catch (_e) { /* fall through to fallback */ }
  let matches;
  let fallback = false;
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
    if (!matches.length) { matches = fallbackScoreJobs(profile, jobs, topK); fallback = true; }
  } else {
    matches = fallbackScoreJobs(profile, jobs, topK);
    fallback = true;
  }
  return jsonResponse(req, env, { matches, fallback });
}

// ---------- /api/translate ----------
// In-memory cache (per-isolate). Cloudflare may run multiple isolates so this
// is best-effort; the client also caches locally in localStorage.
const TR_CACHE = new Map();
const TR_KEY = (lang, txt) => lang + '|' + (txt.length > 80 ? txt.slice(0, 80) + '#' + txt.length : txt);

async function handleTranslate(req, env) {
  const body = await req.json().catch(() => ({}));
  const { texts = [], lang = 'en' } = body || {};
  if (!Array.isArray(texts) || !texts.length) return jsonResponse(req, env, { translations: [] });
  if (texts.length > 80) return jsonResponse(req, env, { error: 'Max 80 texts per batch' }, 400);
  if (lang === 'en') return jsonResponse(req, env, { translations: texts });
  const langName = ({ hi: 'Hindi', bn: 'Bangla' })[lang];
  if (!langName) return jsonResponse(req, env, { translations: texts });

  const result = new Array(texts.length);
  const missIdx = [];
  const missTexts = [];
  texts.forEach((t, i) => {
    if (typeof t !== 'string' || !t.trim()) { result[i] = t; return; }
    const k = TR_KEY(lang, t);
    if (TR_CACHE.has(k)) result[i] = TR_CACHE.get(k);
    else { missIdx.push(i); missTexts.push(t); }
  });
  if (!missTexts.length) return jsonResponse(req, env, { translations: result, fromCache: true });
  if (!env.GEMINI_KEY) {
    missIdx.forEach((idx, j) => { result[idx] = missTexts[j]; });
    return jsonResponse(req, env, { translations: result, fallback: true });
  }
  const prompt = `Translate the following UI strings to ${langName}. Preserve placeholders like {name}, %s, $\{var\}, line breaks, leading/trailing whitespace, emoji, numbers, brand names ("Hospitality Careers"), and HTML entities. Do NOT translate proper names (people, brands), code identifiers, URLs, or email addresses. Keep the same array length and ORDER. Respond with ONLY a JSON array of translated strings — no commentary, no markdown.

Input JSON array:
${JSON.stringify(missTexts)}`;
  let translated = null;
  try {
    const out = await callGemini(env,
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
  } catch (_err) { /* fall through to echo */ }
  if (!translated) translated = missTexts;
  missIdx.forEach((idx, j) => {
    result[idx] = translated[j];
    TR_CACHE.set(TR_KEY(lang, missTexts[j]), translated[j]);
  });
  if (TR_CACHE.size > 5000) {
    const keys = [...TR_CACHE.keys()].slice(0, 1000);
    keys.forEach(k => TR_CACHE.delete(k));
  }
  return jsonResponse(req, env, { translations: result });
}

// ---------- Main fetch handler ----------
export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    const cors = corsHeaders(req, env);

    if (req.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cors });
    }

    if (req.method === 'GET' && url.pathname === '/') {
      return new Response(
        'Hospitality Careers — Gemini Worker. Endpoints: /api/chat, /api/chat-stream, /api/resume, /api/translate, /api/preview-end',
        { status: 200, headers: { 'Content-Type': 'text/plain', ...cors } }
      );
    }

    if (req.method === 'POST' && url.pathname === '/api/preview-end') {
      return new Response(null, { status: 204, headers: cors });
    }

    if (req.method !== 'POST') {
      return jsonResponse(req, env, { error: 'Method not allowed' }, 405);
    }
    if (!env.GEMINI_KEY && url.pathname !== '/api/preview-end') {
      return jsonResponse(req, env, { error: 'GEMINI_KEY not configured on the worker' }, 500);
    }

    try {
      switch (url.pathname) {
        case '/api/chat':        return await handleChat(req, env);
        case '/api/chat-stream': return await handleChatStream(req, env);
        case '/api/resume':      return await handleResume(req, env);
        case '/api/job-match':   return await handleJobMatch(req, env);
        case '/api/translate':   return await handleTranslate(req, env);
        default:                 return jsonResponse(req, env, { error: 'Not found' }, 404);
      }
    } catch (e) {
      return jsonResponse(req, env, { error: 'Worker error', detail: e.message }, 500);
    }
  }
};
