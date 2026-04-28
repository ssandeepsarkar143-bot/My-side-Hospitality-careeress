/**
 * Hospitality Careers — AI Job Match (client module)
 *
 * Renders a "Top AI Job Matches" card on the user dashboard. It pulls the
 * candidate's profile from Firestore + the latest live job posts, ships them
 * to the AI scoring endpoint (`/api/job-match` on the local Express server or
 * the Cloudflare Worker depending on environment via `window.hcApiUrl`), and
 * shows the top 5 picks with a 0-100 score badge and a one-line reason.
 *
 * Usage from the page module (after auth is ready):
 *   import { attachJobMatch } from './js/job-match.js';
 *   attachJobMatch({
 *     db, user, userData,           // Firebase deps
 *     mountId: 'aiMatchMount',
 *     accent:  '#d4af37',           // gold for User, '#a78bfa' purple for Prime
 *     extraJobs: predefinedJobs     // optional: include the page's predefined demo jobs
 *   });
 */
import {
  collection, query, where, getDocs, limit
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const MAX_JOBS = 30;
const TOP_K = 5;
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 min — avoid re-hitting Gemini on every page load

function el(tag, attrs = {}, ...kids) {
  const e = document.createElement(tag);
  Object.entries(attrs || {}).forEach(([k, v]) => {
    if (v == null || v === false) return;
    if (k === 'style' && typeof v === 'object') Object.assign(e.style, v);
    else if (k === 'class') e.className = v;
    else if (k.startsWith('on') && typeof v === 'function') e.addEventListener(k.slice(2).toLowerCase(), v);
    else e.setAttribute(k, v);
  });
  kids.flat().forEach(k => {
    if (k == null || k === false) return;
    e.appendChild(typeof k === 'string' ? document.createTextNode(k) : k);
  });
  return e;
}

function fmtSalary(n) {
  if (!n || isNaN(n)) return '';
  return '₹' + Number(n).toLocaleString('en-IN') + '/mo';
}

function scoreBadgeStyle(score, accent) {
  // Excellent → green, good → accent, ok → amber, low → gray
  if (score >= 85) return { bg: 'rgba(34,197,94,0.15)', border: 'rgba(34,197,94,0.35)', color: '#22c55e' };
  if (score >= 70) return { bg: 'rgba(212,175,55,0.15)', border: 'rgba(212,175,55,0.35)', color: accent || '#d4af37' };
  if (score >= 55) return { bg: 'rgba(245,158,11,0.15)', border: 'rgba(245,158,11,0.35)', color: '#f59e0b' };
  return { bg: 'rgba(148,163,184,0.15)', border: 'rgba(148,163,184,0.35)', color: '#94a3b8' };
}

function buildProfileFromUserData(userData) {
  const ud = userData || {};
  return {
    jobTitle: ud.jobTitle || ud.position || ud.preferredRole || '',
    department: ud.department || '',
    skills: Array.isArray(ud.skills) ? ud.skills.join(', ') : (ud.skills || ud.expertise || ''),
    experience: ud.experience || ud.yearsExperience || '',
    city: ud.city || ud.preferredCity || '',
    state: ud.state || '',
    languages: Array.isArray(ud.languages) ? ud.languages.join(', ') : (ud.languages || ''),
    education: ud.education || '',
    preferredSalary: Number(ud.expectedSalary || ud.salary || 0) || 0
  };
}

function profileLooksUseful(p) {
  return !!(p.jobTitle || p.skills || p.experience || p.department);
}

function cardShell(accent) {
  // Uses existing global `.card` styles from each dashboard so look-and-feel
  // matches HC Wallet / My Activity blocks already on the page.
  const card = el('div', { class: 'card mb-16', id: 'aiJobMatchCard' });
  card.style.borderTop = `2px solid ${accent || '#d4af37'}`;
  return card;
}

function renderEmpty(card, accent, message, ctaLabel, ctaHref) {
  card.innerHTML = '';
  card.appendChild(el('div', { class: 'card-title' },
    el('i', { class: 'fas fa-wand-magic-sparkles', style: { color: accent } }),
    ' AI Job Match',
    el('span', {
      style: 'font-size:10px;background:rgba(212,175,55,0.15);border:1px solid rgba(212,175,55,0.35);color:' + accent + ';padding:2px 7px;border-radius:10px;margin-left:8px;font-weight:700'
    }, 'NEW')
  ));
  const body = el('div', { style: 'padding:8px 0' });
  body.appendChild(el('div', { style: 'font-size:13px;color:var(--gray);line-height:1.55;margin-bottom:12px' }, message));
  if (ctaLabel) {
    const btn = el('a', {
      href: ctaHref || '#',
      class: 'btn btn-sm',
      style: `display:inline-block;background:${accent};color:#0b0b0b;font-weight:700;text-decoration:none;padding:8px 14px;border-radius:8px;font-size:12px`
    }, ctaLabel);
    body.appendChild(btn);
  }
  card.appendChild(body);
}

function renderLoading(card, accent) {
  card.innerHTML = '';
  card.appendChild(el('div', { class: 'card-title' },
    el('i', { class: 'fas fa-wand-magic-sparkles', style: { color: accent } }),
    ' AI Job Match',
    el('span', {
      style: 'font-size:10px;background:rgba(212,175,55,0.15);border:1px solid rgba(212,175,55,0.35);color:' + accent + ';padding:2px 7px;border-radius:10px;margin-left:8px;font-weight:700'
    }, 'NEW')
  ));
  card.appendChild(el('div', {
    style: 'text-align:center;color:var(--gray);padding:20px;font-size:13px'
  }, el('i', { class: 'fas fa-spinner fa-spin', style: { marginRight: '8px', color: accent } }), 'Scoring open jobs against your profile…'));
}

function renderResults(card, accent, matches, jobsById, info) {
  card.innerHTML = '';
  const header = el('div', { class: 'card-title', style: 'display:flex;align-items:center;gap:8px;flex-wrap:wrap' },
    el('i', { class: 'fas fa-wand-magic-sparkles', style: { color: accent } }),
    ' AI Job Match',
    el('span', {
      style: 'font-size:10px;background:rgba(212,175,55,0.15);border:1px solid rgba(212,175,55,0.35);color:' + accent + ';padding:2px 7px;border-radius:10px;font-weight:700'
    }, 'NEW'),
    el('span', { style: 'flex:1' }),
    el('button', {
      id: 'aiMatchRefresh',
      class: 'btn btn-sm btn-outline',
      style: 'font-size:11px;color:var(--gray);padding:4px 10px',
      title: 'Re-score with the latest jobs'
    }, el('i', { class: 'fas fa-rotate' }), ' Refresh')
  );
  card.appendChild(header);
  card.appendChild(el('div', {
    style: 'font-size:12px;color:var(--gray);margin-bottom:12px;line-height:1.5'
  }, info?.fallback
    ? 'Showing best-fit jobs based on a quick keyword match (AI temporarily unavailable).'
    : 'Top 5 jobs ranked by AI from your skills, role, and location.'));

  if (!matches.length) {
    card.appendChild(el('div', { style: 'color:var(--gray);font-size:13px;padding:14px 0' }, 'No live jobs yet — check back soon.'));
    return;
  }

  const list = el('div', { style: 'display:flex;flex-direction:column;gap:10px' });
  matches.forEach(m => {
    const job = jobsById.get(String(m.id));
    if (!job) return;
    const sb = scoreBadgeStyle(m.score, accent);
    const row = el('div', {
      style: `display:flex;gap:12px;align-items:flex-start;padding:12px;border:1px solid rgba(255,255,255,0.06);border-radius:12px;background:rgba(255,255,255,0.02)`
    });
    const badge = el('div', {
      style: `flex-shrink:0;width:54px;height:54px;border-radius:12px;display:flex;flex-direction:column;align-items:center;justify-content:center;background:${sb.bg};border:1px solid ${sb.border};color:${sb.color}`
    },
      el('div', { style: 'font-size:18px;font-weight:800;line-height:1' }, String(m.score)),
      el('div', { style: 'font-size:9px;letter-spacing:0.5px;font-weight:700;opacity:0.85;margin-top:2px' }, 'MATCH')
    );
    const info = el('div', { style: 'flex:1;min-width:0' });
    const titleRow = el('div', { style: 'display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:4px' },
      el('div', { style: 'font-size:14px;font-weight:700;color:#fff' }, job.title || job.position || 'Role'),
      job.salary ? el('span', { style: `font-size:11px;color:${accent};font-weight:700` }, fmtSalary(job.salary)) : null
    );
    info.appendChild(titleRow);
    const meta = [
      job.location || job.state ? `📍 ${[job.location, job.state].filter(Boolean).join(', ')}` : null,
      job.department ? `🏷️ ${job.department}` : null,
      job.experience ? `⏳ ${job.experience}` : null,
      job.accommodation && job.accommodation.toLowerCase() === 'yes' ? '🏠 Accommodation' : null
    ].filter(Boolean).join(' · ');
    if (meta) info.appendChild(el('div', { style: 'font-size:11px;color:var(--gray);margin-bottom:6px' }, meta));
    if (m.reason) info.appendChild(el('div', { style: 'font-size:12px;color:rgba(255,255,255,0.78);line-height:1.45' },
      el('i', { class: 'fas fa-sparkles', style: `color:${accent};margin-right:6px;font-size:10px` }),
      m.reason
    ));
    const actions = el('div', { style: 'margin-top:10px;display:flex;gap:8px;flex-wrap:wrap' });
    const isPredefined = String(m.id).startsWith('j') && /^j\d+$/.test(String(m.id));
    if (isPredefined) {
      // Predefined demo jobs don't have apply pages; offer to scroll to filter.
      actions.appendChild(el('button', {
        class: 'btn btn-sm',
        style: `background:${accent};color:#0b0b0b;font-weight:700;border:none;padding:6px 14px;border-radius:8px;font-size:12px;cursor:pointer`,
        onclick: () => {
          const list = document.getElementById('jobsList') || document.querySelector('.filter-section');
          if (list) list.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, el('i', { class: 'fas fa-eye' }), ' View'));
    } else {
      actions.appendChild(el('a', {
        href: `apply-now.html?jobId=${encodeURIComponent(m.id)}`,
        class: 'btn btn-sm',
        style: `background:${accent};color:#0b0b0b;font-weight:700;text-decoration:none;padding:6px 14px;border-radius:8px;font-size:12px`
      }, el('i', { class: 'fas fa-paper-plane' }), ' Apply'));
    }
    info.appendChild(actions);
    row.appendChild(badge);
    row.appendChild(info);
    list.appendChild(row);
  });
  card.appendChild(list);

  const refreshBtn = card.querySelector('#aiMatchRefresh');
  if (refreshBtn) refreshBtn.addEventListener('click', () => card.dispatchEvent(new CustomEvent('hc-jm-refresh')));
}

async function fetchLiveJobs(db, extraJobs) {
  const jobs = [];
  if (Array.isArray(extraJobs)) jobs.push(...extraJobs);
  try {
    const snap = await getDocs(query(
      collection(db, 'jobPosts'),
      where('status', '==', 'live'),
      limit(MAX_JOBS)
    ));
    snap.docs.forEach(d => jobs.push({ id: d.id, ...d.data() }));
  } catch (e) {
    console.warn('[AIJobMatch] fetch jobPosts failed:', e.message);
  }
  // De-dupe by id, keep first occurrence (predefined first).
  const seen = new Set();
  const out = [];
  for (const j of jobs) {
    const id = String(j.id || '');
    if (!id || seen.has(id)) continue;
    seen.add(id);
    out.push(j);
    if (out.length >= MAX_JOBS) break;
  }
  return out;
}

function readCache(uid) {
  try {
    const raw = localStorage.getItem('hc.jobMatch.' + uid);
    if (!raw) return null;
    const obj = JSON.parse(raw);
    if (!obj || !obj.t || Date.now() - obj.t > CACHE_TTL_MS) return null;
    return obj;
  } catch (_) { return null; }
}
function writeCache(uid, payload) {
  try { localStorage.setItem('hc.jobMatch.' + uid, JSON.stringify({ ...payload, t: Date.now() })); } catch (_) {}
}

export async function attachJobMatch({ db, user, userData, mountId = 'aiMatchMount', accent = '#d4af37', extraJobs = [] } = {}) {
  if (!db || !user) return;
  const mount = document.getElementById(mountId);
  if (!mount) return;
  mount.innerHTML = '';
  const card = cardShell(accent);
  mount.appendChild(card);

  const profile = buildProfileFromUserData(userData);
  if (!profileLooksUseful(profile)) {
    renderEmpty(card, accent,
      'Complete your profile (job title + skills + experience) to get personalised AI job recommendations.',
      'Complete Profile', 'profile.html');
    return;
  }

  async function run(force = false) {
    renderLoading(card, accent);
    const cached = !force && readCache(user.uid);
    let jobs = await fetchLiveJobs(db, extraJobs);
    if (!jobs.length) {
      renderEmpty(card, accent, 'No live job posts available right now. Check back in a bit.');
      return;
    }
    const jobsById = new Map(jobs.map(j => [String(j.id), j]));

    if (cached && cached.matches && cached.profileFP === JSON.stringify(profile)) {
      // Serve from cache when the same profile + recent timestamp.
      const filtered = cached.matches.filter(m => jobsById.has(String(m.id)));
      if (filtered.length) {
        renderResults(card, accent, filtered.slice(0, TOP_K), jobsById, { fallback: cached.fallback });
        card.addEventListener('hc-jm-refresh', () => run(true), { once: true });
        return;
      }
    }

    let data = null;
    try {
      const url = (typeof window.hcApiUrl === 'function') ? window.hcApiUrl('/api/job-match') : '/api/job-match';
      const r = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile, jobs, topK: TOP_K })
      });
      data = await r.json().catch(() => null);
      if (!r.ok || !data) throw new Error((data && data.error) || ('HTTP ' + r.status));
    } catch (e) {
      console.warn('[AIJobMatch] API failed, using local fallback:', e.message);
      // Local degraded fallback so the card still shows something useful.
      data = { matches: localFallback(profile, jobs, TOP_K), fallback: true };
    }
    const matches = Array.isArray(data.matches) ? data.matches : [];
    writeCache(user.uid, { matches, fallback: !!data.fallback, profileFP: JSON.stringify(profile) });
    renderResults(card, accent, matches.slice(0, TOP_K), jobsById, { fallback: !!data.fallback });
    card.addEventListener('hc-jm-refresh', () => run(true), { once: true });
  }

  run(false);
}

// Pure-JS keyword fallback if even the network call fails (offline, etc.)
function localFallback(profile, jobs, topK) {
  const tokens = (s) => String(s || '').toLowerCase().split(/[^a-z0-9+]+/i).filter(t => t.length > 2);
  const profTokens = new Set([
    ...tokens(profile.jobTitle), ...tokens(profile.skills),
    ...tokens(profile.experience), ...tokens(profile.department)
  ]);
  const profCity = (profile.city || '').toLowerCase();
  const profState = (profile.state || '').toLowerCase();
  return jobs.map(j => {
    const jt = new Set([
      ...tokens(j.title || j.position), ...tokens(j.department),
      ...tokens(j.description), ...tokens(j.experience)
    ]);
    let overlap = 0;
    profTokens.forEach(t => { if (jt.has(t)) overlap++; });
    let score = Math.min(95, 35 + overlap * 12);
    if (profCity && (j.location || '').toLowerCase().includes(profCity)) score += 8;
    if (profState && (j.state || '').toLowerCase().includes(profState)) score += 4;
    if (profile.preferredSalary && j.salary && j.salary >= profile.preferredSalary) score += 4;
    score = Math.max(35, Math.min(98, score));
    const reason = overlap > 0
      ? `${overlap} skill keyword${overlap > 1 ? 's' : ''} overlap with ${j.title || j.position || 'this role'}.`
      : `Open ${j.title || j.position || 'role'} in ${j.location || 'India'} matching your hospitality profile.`;
    return { id: String(j.id), score, reason };
  }).sort((a, b) => b.score - a.score).slice(0, topK);
}

// Tiny global fallback so plain-script pages can also call it without imports.
if (typeof window !== 'undefined') {
  window.hcAttachJobMatch = attachJobMatch;
}
