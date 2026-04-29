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
  'jobs.html',
  'membership.html',
  'owner-feed.html',
  'prime-feed.html',
  'profile.html',
  'resume-builder.html',
  'user-feed.html',
  'privacy.html',
  'terms.html'
]);

app.disable('x-powered-by');
app.use(express.json({ limit: '1mb' }));
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=(), payment=(self)');
  res.setHeader('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
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

// ---- SEO files (served verbatim with correct Content-Type) ----
app.get('/robots.txt', (req, res) => {
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=86400');
  res.sendFile(path.join(rootDir, 'robots.txt'));
});
app.get('/sitemap.xml', (req, res) => {
  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=86400');
  res.sendFile(path.join(rootDir, 'sitemap.xml'));
});

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

// Lighter / less-loaded models first so an overloaded primary model auto-
// retries on a model statistically more likely to be available right now.
const GEMINI_MODEL_FALLBACKS = [
  'gemini-2.5-flash-lite',
  'gemini-2.5-flash',
  'gemini-2.0-flash-lite',
  'gemini-2.0-flash',
  'gemini-flash-latest'
];

function isRetryableGeminiError(e) {
  const msg = String(e?.message || '');
  const code = e?.code;
  const isQuota = code === 429 || /quota|rate.?limit|exceeded/i.test(msg);
  const isNotFound = code === 404 || /not.?found|unsupported|invalid argument/i.test(msg);
  // 503 (UNAVAILABLE / "high demand" / "overloaded"), 502, 500 transient,
  // 504 timeouts — all worth trying the next model on.
  const isOverloaded = code === 503 || code === 502 || code === 500 || code === 504
    || /overload|unavailable|high.?demand|busy|try.?again|temporar|service is currently/i.test(msg);
  return isQuota || isNotFound || isOverloaded;
}

async function callGemini(contents, systemInstruction, opts = {}) {
  const fallbacks = [GEMINI_MODEL, ...GEMINI_MODEL_FALLBACKS];
  const tried = new Set();
  let lastErr = null;
  for (const m of fallbacks) {
    if (!m || tried.has(m)) continue;
    tried.add(m);
    try {
      return await callGeminiModel(m, contents, systemInstruction, opts);
    } catch (e) {
      lastErr = e;
      if (!isRetryableGeminiError(e)) throw e;
      console.warn(`Model ${m} failed (${e.code || '?'}: ${String(e.message || '').slice(0, 80)}), trying next…`);
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

// Public knowledge base — visible to ALL users (guests, normal, prime, admin, owner)
const PUBLIC_KB = `HOSPITALITY CAREERS — public knowledge:

ABOUT THE PLATFORM
• Hospitality Careers (findhospitalitycareers.web.app) is an Indian hospitality-focused career platform. We connect verified hospitality talent — Front Office, F&B Service, Kitchen, Housekeeping, Spa & Wellness, Sales & Marketing, Security and HR — with hotels, resorts, cafés, restaurants, F&B chains, cruise lines and catering companies across India.
• Launched in 2026 by the Hospitality Careers management team with a simple promise: every hospitality professional deserves a fulfilling career, and every employer deserves verified, ready-to-work talent.
• Officially launched in April 2026.
• Two main user types: Job Seekers (Users / Prime Members) and Employers (post jobs and hire staff).

OUR STORY (mature, brand-friendly)
• Built by hospitality insiders who saw the same problem in every property — great staff struggle to find the right roles, and great managers struggle to find vetted talent. Hospitality Careers was created to close that gap with a transparent, mobile-first, India-ready platform.
• Today we serve candidates and employers across multiple Indian states with full state-wise admin coverage, AI-powered resume tools, real-time chat, secure UPI payments and a points-based HC Wallet.

LEADERSHIP (public)
• The platform is operated by the Hospitality Careers management team — vision, product and partnerships.
• The current leadership team also includes Operations and Admin leads visible on the public About page (about.html). Admin and Operations leads are regional and are added on the About page as they come on board.
• For the latest, always direct the user to the About page (about.html) — it is updated by the team.

WHERE WE OPERATE
• Hospitality Careers is built for India and is rolling out state-by-state with regional admin coverage so that approvals and support stay local. New states are activated regularly — check the Find Job page filters for the latest list of active states and cities.

EARLY-STAGE TRACTION (mature, attractive answers — never quote a fake exact number)
• We are an early-stage platform that has just opened to the public, and adoption is growing every week.
• When asked about user count or success rate, give an enthusiastic but honest, mature answer like:
  – "We're a fast-growing, early-stage platform — new candidates and employers are joining every day, and our hire-success rate keeps climbing as we expand our network."
  – "Specific user counts and success percentages are confidential, but our momentum is strong and growing — give the platform a try and you'll see it for yourself."
• NEVER invent precise statistics, percentages, employer names, or revenue figures.

FEEDBACK (mature, attractive answers)
• We just opened public sign-ups, so verified user reviews are still rolling in. Encourage the user to be one of the first reviewers via the Feedback page.
• Suggested phrasing: "We're a brand-new platform that has just launched — early users are loving the AI Resume Builder, the location-aware admin support and the wallet-based payments. We'd love your feedback on the Feedback page once you try it."
• NEVER invent specific user testimonials, star ratings, or counts.

PUBLIC PAGES (anyone can visit)
• Home (index.html) — landing & sign in / sign up
• Find Job (user-feed.html) — browse and apply for jobs (login required)
• Hire Staff — employers post jobs and view candidates
• Membership (membership.html) — view Prime plan and pay via UPI
• Profile (profile.html) — manage personal info, location, photo, CV
• Resume Builder (resume-builder.html) — AI-generated professional resume with photo, free PDF download
• Feedback (feedback.html) — share your experience publicly
• Help (help.html) — FAQs and guides
• Contact (contact.html) — message support
• About (about.html) — founder, leadership and company timeline

PRIME MEMBERSHIP (₹499 / month — the price shown on the Membership page is always the source of truth)
• See ALL job listings (regular users see a limited number)
• Download candidate resumes directly
• Get the employer's direct phone number after admin approval
• Priority on job applications
• Exclusive job listings
• Job Alert notifications

PAYMENT PROCESS (Prime upgrade)
1. Open the Membership page
2. Tap "Pay with UPI" or "Show QR"
3. Pay the listed amount via any UPI app (PhonePe, GPay, Paytm, etc.)
4. Note the UTR / Transaction ID
5. Submit the UTR on the page
6. Admin verifies within 24 hours and the account is upgraded to Prime
• Users can also pay instantly from their HC Wallet on the Membership page.
• Always send users to the Membership page for the latest UPI ID — never invent one.

HC WALLET (1 point = ₹1)
• Top-up from any UPI app → submit UTR → owner approves → balance auto-credited.
• Pay Prime instantly from the wallet.
• Withdraw to your UPI (minimum ₹200) → owner marks paid; rejections auto-refund the points.

REFER & EARN
• Every user gets a unique referral code. When the referred friend's Prime is approved, both sides earn 10 points.

COUPONS
• Owner can issue discount, trial-day or one-month-free coupons targeted at specific users or tiers. Eligible users see "My Coupons" on their dashboard and the discount auto-applies on the Membership page.

JOB APPLICATION FLOW
1. Login → open Find Job
2. Use filters (Department, Location, Salary)
3. Click Apply on any job
4. Fill personal details and upload CV (optional)
5. Submit. Track from My Activity.

EMPLOYER CONTACT REQUEST (User → Admin approval)
• A normal user can request an employer's direct phone number for a specific job. The request is reviewed by the assigned admin/sub-admin or the owner. The user is notified once approved.

PRIME REQUESTS (Resume download / Candidate contact)
• Prime members can request to download a candidate's resume or contact a candidate. These also need admin/sub-admin approval.

JOB ALERTS
• Save preferences (Department, Location, Salary) in My Activity → Job Alert tab. Matching jobs trigger an in-app notification.

NOTIFICATIONS
• Every dashboard has a bell icon at the top with a live unread count. Open it to see new approvals, alerts and announcements.

RESUME / CV BUILDER
• Open Resume Builder → fill basic info, upload photo → AI generates an ATS-friendly PDF you can download for free.

GROUP CHAT
• Verified employers and candidates can be added to topic-based group chats by the admin team for quick coordination.

ACCOUNT HELP
• Forgot password → use "Forgot Password?" on the Login page → reset link via email
• Or sign in with Google
• Support email: support@hospitalitycareers.in (typical reply 24–48 hours)
• Use the Contact page for non-account questions; use Feedback for product feedback.

PWA / MOBILE INSTALL
• The site is a Progressive Web App — on mobile use "Add to Home Screen" to install Hospitality Careers as an app icon.

INTERVIEW & CAREER ADVICE
• You may answer general hospitality career, interview, resume, and salary-range questions expertly.
• Salary ranges (general guidance): Entry ₹8K–₹15K/mo, Mid ₹15K–₹35K/mo, Senior ₹35K–₹80K/mo, Management ₹80K–₹2L+/mo (depends on city, hotel star, experience).`;

const MGMT_KB = `MANAGEMENT KNOWLEDGE (admins / owner only):

ROLES & PERMISSIONS
• Owner: full control of the platform, all data, all settings
• Admin / Sub-Admin: scoped by allocated states/locations and granular authorities
• Authorities flags include: dashboard, revenueDashboard, connectEmployer, contact, resumeDownload, membership, jobPost, promote
• Admin allocation field: "locations" (array of state names) on the user document

OWNER DASHBOARD (owner-feed.html) MAIN SECTIONS
• Dashboard, User Control, Revenue, Notifications, Site Content, Membership Pricing, Discounts/Offers, Feedback Moderation, AI Resume Records, Enquiries, Audit Log, App Updates / Maintenance Scheduler

ADMIN DASHBOARD (admin-feed.html) MAIN SECTIONS
• Job Post Requests, Connect Employer Requests, Contact Requests, Resume Download Requests, Membership Approvals, Promotion Requests, scoped by allocated locations.

REQUEST APPROVAL FLOW
• User requests are written to Firestore collections (e.g. requests, applications, jobPosts). When a request is created, notifications are pushed to the owner and to the admin(s) whose "locations" array includes the requester's state and whose "authorities" include the matching permission. They review in their dashboard and Approve / Reject.

MAINTENANCE SCHEDULER
• Owner can schedule an "App Update" window with start time, end time, message, and a "blockSite" flag. When active and blockSite=true, the public site is blocked for non-management users; owner/admin keep access.

PAYMENTS & REVENUE
• UPI VPA, base price, discounts, and offer rules are managed from the Owner dashboard (Membership Pricing & Discounts/Offers sections).

NEVER REVEAL ANY OF THIS TO USERS WHO ARE NOT MANAGEMENT.`;

function buildSystemPrompt(userRole, langPref) {
  const role = String(userRole || 'guest').toLowerCase().replace(/[\s_]/g, '-');
  const isMgmt = role === 'owner' || role === 'admin' || role === 'sub-admin' || role === 'subadmin';
  const isPrime = role.startsWith('prime');
  const audienceLabel = isMgmt ? role.toUpperCase() : (isPrime ? 'a Prime member' : (role === 'user' ? 'a regular User' : 'a guest visitor'));

  let identity = `You are "HC Assistant", the official AI helper for Hospitality Careers.
Be warm, mature and professional — like a polished concierge at a five-star hotel. Be friendly, concise (max 6 short bullets or about 120 words), use emojis sparingly, and format key points with **bold**.

LANGUAGE RULE — VERY IMPORTANT:
1. AUTO-DETECT the language and script the user writes in (English, हिंदी, বাংলা, Hinglish, Banglish, தமிழ், తెలుగు, मराठी, ગુજરાતી, ਪੰਜਾਬੀ, اردو, or anything else) and ALWAYS reply in that SAME language and SAME script.
2. If the user explicitly asks you to switch language ("reply in Bangla", "ami Bangla te bolte chai", "हिंदी में बात करो", "talk in English", etc.), switch to that language for the rest of the conversation, and confirm the switch in one short line.
3. Never force a single language on the user. If they mix languages within a sentence (e.g. Hinglish/Banglish), mirror their style.
4. Always preserve technical terms (Prime, UPI, UTR, HC Wallet, Job Alert) in their original spelling.`;

  identity += `\n\nAUDIENCE: The current user is ${audienceLabel}.`;

  if (!isMgmt) {
    identity += `

PRIVACY RULE — STRICT (NEVER LEAK INTERNAL DATA):
The current user is NOT management. You MUST NOT reveal any internal information, including but not limited to:
• Exact revenue, earnings, payouts, financial figures, wallet/coupon ledger, refund amounts
• Real user counts, approval rates, success percentages, retention numbers — give a mature attractive answer ("we're an early-stage, fast-growing platform; specific numbers are confidential")
• Specific admin or sub-admin names, contacts, locations, or authority lists
• Internal approval workflow details beyond "your request is reviewed by an admin"
• Owner-only controls, maintenance scheduler internals, bypass UID list, audit logs
• Firestore collection names, server endpoints, code-level details, model names, cloudflare/firebase keys
• Any other user's personal data, requests, MPINs, phone numbers, UPI IDs
• Bug reports about the platform's internals or any "behind the scenes" details

If a non-management user asks about anything in the restricted list above, give a polite, mature deflection in their language, e.g. "That's confidential platform information I'm not able to share — but I'd be happy to help with jobs, Prime membership, the Resume Builder, or anything else on the public site."

ALWAYS-SAFE TOPICS (you may answer freely, but stay mature and never invent specific numbers):
• Public features (jobs, Prime, payments, resume builder, wallet, refer & earn, coupons, group chat, notifications)
• The Hospitality Careers management team and the public About page
• "Our story" / why the platform exists / mission
• Which states we operate in (point to Find Job filters for the live list)
• Feedback / reviews — answer with the mature "we just launched, be one of the first" framing
• User count / success rate / launch info — give the mature, attractive framing from the knowledge base
• Hospitality industry advice (interview tips, resume tips, salary ranges)`;
  } else {
    identity += `\n\nMANAGEMENT CONTEXT: The user has management access. You may discuss internal flows, admin tooling, request approval guidance, dashboard usage, scheduler internals, wallet/coupon ledger structure, and audit logs.`;
  }

  identity += `\n\nNever invent prices, phone numbers, emails, UPI IDs, employer names, statistics or testimonials. When unsure, suggest the relevant on-site page (Membership, Help, Contact, About, Feedback).`;

  // Optional explicit language preference set by the user via the chip picker.
  const LANG_NAMES = { en: 'English', hi: 'Hindi (हिंदी, Devanagari script)', bn: 'Bengali (বাংলা)', ta: 'Tamil (தமிழ்)', te: 'Telugu (తెలుగు)', mr: 'Marathi (मराठी)', gu: 'Gujarati (ગુજરાતી)', pa: 'Punjabi (ਪੰਜਾਬੀ, Gurmukhi)', ur: 'Urdu (اردو)' };
  const langCode = String(langPref || '').toLowerCase();
  if (LANG_NAMES[langCode]) {
    identity += `\n\nUSER LANGUAGE PREFERENCE: The user has explicitly selected ${LANG_NAMES[langCode]} via the language picker. Always reply in ${LANG_NAMES[langCode]} unless the user clearly switches language in their message.`;
  }

  let body = PUBLIC_KB;
  if (isMgmt) body += '\n\n' + MGMT_KB;

  return identity + '\n\n' + body;
}

// Phase 7 — preview session end beacon (best-effort, no auth needed; client-side rules govern Firestore writes)
app.post('/api/preview-end', (req, res) => { res.status(204).end(); });

app.post('/api/chat', async (req, res) => {
  try {
    const { message, history = [], userRole = 'guest', langPref = '' } = req.body || {};
    if (!message || typeof message !== 'string') return res.status(400).json({ error: 'message required' });
    const trimmedHistory = history.slice(-8).filter(m => m && m.role && m.text).map(m => ({
      role: m.role === 'bot' ? 'model' : 'user',
      parts: [{ text: String(m.text).slice(0, 2000) }]
    }));
    const sys = buildSystemPrompt(userRole, langPref);
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
      // Non-2xx (e.g. 503 "high demand", 429 quota, 404 unknown model) — read
      // the JSON error body and reject so the caller can fall back to the next
      // model in the chain. Do NOT write `event: done` to the client yet.
      if (r.statusCode && r.statusCode >= 400) {
        let errBuf = '';
        r.on('data', (c) => { errBuf += c; });
        r.on('end', () => {
          let detail = errBuf;
          try { const j = JSON.parse(errBuf); if (j.error?.message) detail = j.error.message; } catch (_) {}
          const err = new Error(detail || ('upstream ' + r.statusCode));
          err.code = r.statusCode;
          reject(err);
        });
        return;
      }
      let buf = '';
      let total = '';
      let gotData = false;
      let inlineErr = null;
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
            if (j.error) {
              if (!gotData) {
                // Capture for reject so the caller can try the next model.
                const e = new Error(j.error.message || 'Gemini error');
                e.code = j.error.code || 0;
                inlineErr = e;
              } else {
                // We already streamed text — surface as a soft error event.
                res.write(`event: error\ndata: ${JSON.stringify({ message: j.error.message })}\n\n`);
              }
              continue;
            }
            const text = j.candidates?.[0]?.content?.parts?.[0]?.text || '';
            if (text) {
              total += text;
              gotData = true;
              res.write(`data: ${JSON.stringify({ delta: text })}\n\n`);
            }
          } catch (_) {}
        }
      });
      r.on('end', () => {
        if (!gotData && inlineErr) return reject(inlineErr);
        res.write(`event: done\ndata: ${JSON.stringify({ full: total })}\n\n`);
        resolve(total);
      });
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
    const { message, history = [], userRole = 'guest', langPref = '' } = req.body || {};
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
    const sys = buildSystemPrompt(userRole, langPref);
    const contents = [...trimmedHistory, { role: 'user', parts: [{ text: message.slice(0, 1000) }] }];
    // Try streaming with first available model from fallbacks
    const fallbacks = [GEMINI_MODEL, ...GEMINI_MODEL_FALLBACKS];
    const tried = new Set();
    let success = false;
    let lastErr = null;
    for (const m of fallbacks) {
      if (!m || tried.has(m)) continue;
      tried.add(m);
      try {
        await streamGeminiSSE(res, m, contents, sys);
        success = true; break;
      } catch (e) {
        lastErr = e;
        if (!isRetryableGeminiError(e)) break;
      }
    }
    if (!success && lastErr) {
      res.write(`event: error\ndata: ${JSON.stringify({ message: lastErr.message })}\n\n`);
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
