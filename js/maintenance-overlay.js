// Maintenance window overlay / banner — site-wide
// Reads `app_maintenance/current` from Firestore in realtime.
// Behaviour:
//   • If active && now is inside [startAt, endAt]:
//       – Owner / Admin / Sub-Admin always keep full access (silent).
//       – Other users see a small top banner.
//       – If blockSite=true, non-management users see a fullscreen overlay.
//   • If only scheduled (start in the future) — small advisory banner for everyone.

import { auth, db } from '/js/firebase-config.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import { doc, getDoc, onSnapshot } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

const MGMT_ROLES = new Set(['owner', 'admin', 'sub-admin', 'subadmin']);

let _userIsManagement = false;
let _maintenanceData = null;
let _renderTimer = null;

function fmt(ts) {
  if (!ts) return '';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleString();
}

function ensureStyles() {
  if (document.getElementById('hcMaintStyles')) return;
  const s = document.createElement('style');
  s.id = 'hcMaintStyles';
  s.textContent = `
    #hcMaintBanner { position:fixed; top:0; left:0; right:0; z-index:99998;
      background:linear-gradient(90deg,#7f1d1d,#b91c1c);
      color:#fff; font-family:'Poppins',sans-serif; font-size:13px; font-weight:600;
      padding:9px 16px; display:flex; align-items:center; justify-content:center;
      gap:10px; box-shadow:0 3px 14px rgba(0,0,0,.4); text-align:center;
      animation:hcMaintSlide .35s ease; }
    #hcMaintBanner.scheduled { background:linear-gradient(90deg,#92400e,#d97706); }
    #hcMaintBanner i.fa-tools { font-size:14px; }
    @keyframes hcMaintSlide { from{transform:translateY(-100%);opacity:0} to{transform:translateY(0);opacity:1} }
    body.hc-maint-banner { padding-top:42px !important; }
    #hcMaintOverlay { position:fixed; inset:0; z-index:99999;
      background:radial-gradient(circle at 50% 35%,#1f2937,#0b0f1a 75%);
      color:#fff; font-family:'Poppins',sans-serif;
      display:flex; align-items:center; justify-content:center; flex-direction:column;
      padding:24px; text-align:center; }
    #hcMaintOverlay .hc-maint-card {
      max-width:520px; background:rgba(15,23,42,.85);
      border:1px solid rgba(212,175,55,.35); border-radius:18px;
      padding:36px 28px; box-shadow:0 20px 60px rgba(0,0,0,.7); }
    #hcMaintOverlay .hc-maint-icon {
      width:78px; height:78px; border-radius:50%;
      background:radial-gradient(circle at 35% 25%,#fff8cc,#d4af37 60%,#8a6a12);
      margin:0 auto 18px; display:flex; align-items:center; justify-content:center;
      font-size:36px; color:#1a1a2e; box-shadow:0 0 30px rgba(212,175,55,.55);
      animation:hcMaintPulse 2.2s ease-in-out infinite; }
    @keyframes hcMaintPulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.06)} }
    #hcMaintOverlay h1 { font-size:22px; margin:0 0 10px; color:#d4af37; font-weight:700; }
    #hcMaintOverlay p { font-size:14px; line-height:1.6; opacity:.9; margin:8px 0; }
    #hcMaintOverlay .hc-maint-meta {
      margin-top:18px; padding-top:14px; border-top:1px solid rgba(255,255,255,.08);
      font-size:12px; opacity:.7; }
    #hcMaintOverlay .hc-maint-eta {
      display:inline-block; margin-top:10px; padding:6px 14px;
      background:rgba(212,175,55,.15); border:1px solid rgba(212,175,55,.35);
      border-radius:20px; font-size:12px; color:#d4af37; font-weight:600; }
  `;
  document.head.appendChild(s);
}

function removeUI() {
  const b = document.getElementById('hcMaintBanner');
  if (b) b.remove();
  const o = document.getElementById('hcMaintOverlay');
  if (o) o.remove();
  document.body?.classList?.remove('hc-maint-banner');
}

function render() {
  if (_renderTimer) { clearTimeout(_renderTimer); _renderTimer = null; }
  ensureStyles();
  const m = _maintenanceData;
  if (!m || m.active === false) { removeUI(); return; }
  const now = Date.now();
  const startMs = m.startAt?.toDate?.()?.getTime?.() || (m.startAt instanceof Date ? m.startAt.getTime() : 0);
  const endMs = m.endAt?.toDate?.()?.getTime?.() || (m.endAt instanceof Date ? m.endAt.getTime() : 0);
  if (!startMs || !endMs || now >= endMs) { removeUI(); return; }
  const isActiveNow = now >= startMs && now < endMs;
  const message = (m.message || 'We are performing scheduled maintenance. Please check back shortly.').toString();
  // Schedule a re-render at the next state-change boundary (start or end).
  const nextEdgeMs = isActiveNow ? (endMs - now) : (startMs - now);
  if (nextEdgeMs > 0 && nextEdgeMs < 24 * 3600 * 1000) {
    _renderTimer = setTimeout(render, nextEdgeMs + 250);
  }

  // Management always keeps full access — small banner only, even when active.
  if (_userIsManagement) {
    removeUI();
    const b = document.createElement('div');
    b.id = 'hcMaintBanner';
    b.className = isActiveNow ? '' : 'scheduled';
    b.innerHTML = `<i class="fas fa-tools"></i> ${isActiveNow ? 'Maintenance is ACTIVE NOW' : 'Maintenance scheduled at ' + fmt(m.startAt)} · You have management override (full access).`;
    document.body.appendChild(b);
    document.body.classList.add('hc-maint-banner');
    return;
  }

  // Non-management: full overlay if blockSite & active. Else small advisory banner.
  if (isActiveNow && m.blockSite) {
    removeUI();
    const o = document.createElement('div');
    o.id = 'hcMaintOverlay';
    o.innerHTML = `
      <div class="hc-maint-card">
        <div class="hc-maint-icon"><i class="fas fa-tools"></i></div>
        <h1>We'll be right back</h1>
        <p>${message.replace(/[<>]/g, c => ({ '<':'&lt;','>':'&gt;' }[c]))}</p>
        <div class="hc-maint-eta"><i class="fas fa-clock"></i> Back online by ${fmt(m.endAt)}</div>
        <div class="hc-maint-meta">Hospitality Careers · Scheduled maintenance window</div>
      </div>`;
    document.body.appendChild(o);
    return;
  }

  // Soft banner (active but not blocking, OR scheduled-future for everyone)
  removeUI();
  const b = document.createElement('div');
  b.id = 'hcMaintBanner';
  b.className = isActiveNow ? '' : 'scheduled';
  b.innerHTML = isActiveNow
    ? `<i class="fas fa-tools"></i> Maintenance in progress — some features may be slow. Ends ${fmt(m.endAt)}.`
    : `<i class="fas fa-tools"></i> Scheduled maintenance: ${fmt(m.startAt)} → ${fmt(m.endAt)}. Plan ahead.`;
  document.body.appendChild(b);
  document.body.classList.add('hc-maint-banner');
}

// Resolve user role (best effort) so we can decide management override.
async function resolveRole(user) {
  if (!user) { _userIsManagement = false; return; }
  try {
    const { getDoc, doc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
    const snap = await getDoc(doc(db, 'users', user.uid));
    const role = String(snap.data()?.role || '').toLowerCase();
    _userIsManagement = MGMT_ROLES.has(role);
  } catch { _userIsManagement = false; }
}

(async function start() {
  if (!document.body) {
    await new Promise(r => document.addEventListener('DOMContentLoaded', r, { once: true }));
  }
  // First fetch (one-shot) so the overlay can render even before auth resolves.
  try {
    const snap = await getDoc(doc(db, 'app_maintenance', 'current'));
    if (snap.exists()) { _maintenanceData = snap.data(); render(); }
  } catch {}
  // Live subscribe so changes from owner-feed propagate immediately.
  try {
    onSnapshot(doc(db, 'app_maintenance', 'current'), (snap) => {
      _maintenanceData = snap.exists() ? snap.data() : null;
      render();
    });
  } catch {}
  // Track auth state for management override.
  try {
    onAuthStateChanged(auth, async (user) => {
      await resolveRole(user);
      render();
    });
  } catch {}
})();
