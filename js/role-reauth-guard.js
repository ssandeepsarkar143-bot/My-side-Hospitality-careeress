// role-reauth-guard.js — shows a fullscreen "Your access has been updated" overlay
// and forces a clean sign-out whenever the Owner saves a change in the
// "Edit Promoted User" dialog (writes `users/{uid}.forceReauth.at`).
// Loaded from owner-feed.html, user-feed.html, prime-feed.html, admin-feed.html
// so the admin gets the prompt no matter which page they're on.
import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, doc, onSnapshot, updateDoc, deleteField } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const cfg = window.__FIREBASE_CFG__ || {
  apiKey: "AIzaSyCuAuc9qhA7D_-Lqt-69pbG81KTIiDFVpg",
  authDomain: "hospitality-careers-e662f.firebaseapp.com",
  projectId: "hospitality-careers-e662f",
  storageBucket: "hospitality-careers-e662f.firebasestorage.app",
  messagingSenderId: "45029895717",
  appId: "1:45029895717:web:f54f86f608b98751cad9cc"
};
const app = getApps().length ? getApp() : initializeApp(cfg);
const auth = getAuth(app);
const db = getFirestore(app);

const AUTH_LABELS = {
  dashboard: 'User Control', adminWorking: 'Admin Working Dashboard', revenueDashboard: 'Revenue Dashboard',
  connectEmployer: 'Approve Connect Employer', resumeDownload: 'Approve Resume Download',
  contact: 'Approve Contact Requests', membership: 'Approve Membership', jobPost: 'Approve Job Posts',
  jobList: 'Manage Job List', candidates: 'Candidate List & Hiring',
  walletTopups: 'Wallet Top-ups', walletWithdrawals: 'Wallet Withdrawals', walletRecords: 'Wallet Records',
  coupons: 'Coupons', discounts: 'Discounts & Offers', referrals: 'Refer & Earn',
  enquiries: 'Enquiries', feedback: 'Feedback', resumeRecords: 'AI Resume Records',
  engagement: 'Engagement Tools', content: 'Site Content',
  settings: 'Settings', promote: 'Promote / Demote Admins'
};

let _shown = false;
let _unsub = null;

function attach(user) {
  if (_unsub) { try { _unsub(); } catch(_){} _unsub = null; }
  // Skip on owner preview-as-admin sessions (admin-feed sets this flag)
  if (window.__PREVIEW_MODE__) { console.info('[ReauthGuard] skipped (preview mode)'); return; }
  // Owner is never edited
  if ((user.email || '').toLowerCase() === 'ssandeepsarkar143@gmail.com') {
    console.info('[ReauthGuard] skipped (owner account)'); return;
  }
  // Establish session anchor: the first time we see the user this load, remember NOW.
  // We use the larger of (Firebase lastSignInTime) and (this-session anchor) — that way
  // a stale local clock or a long-persisted session won't keep re-prompting after the
  // admin has already re-logged-in once.
  const lsKey = `hc_reauth_session_${user.uid}`;
  let sessionAnchor = parseInt(sessionStorage.getItem(lsKey) || '0', 10);
  if (!sessionAnchor) {
    const t = user.metadata?.lastSignInTime;
    sessionAnchor = t ? new Date(t).getTime() : Date.now();
    sessionStorage.setItem(lsKey, String(sessionAnchor));
  }
  console.info('[ReauthGuard] watching users/' + user.uid + ' · session anchor:', new Date(sessionAnchor).toISOString());

  try {
    _unsub = onSnapshot(doc(db, 'users', user.uid), (snap) => {
      if (!snap.exists()) return;
      const d = snap.data();
      const fr = d.forceReauth;
      if (!fr) return;
      // serverTimestamp may be unresolved on the very first local-cache snapshot — the
      // listener will fire again with the resolved server value, so just bail this round.
      const atMs = fr.at?.toMillis?.();
      if (!atMs) { console.info('[ReauthGuard] forceReauth.at not yet resolved, waiting…'); return; }
      console.info('[ReauthGuard] forceReauth detected · at:', new Date(atMs).toISOString(), 'session anchor:', new Date(sessionAnchor).toISOString());
      // 1.5s grace covers small client/server clock skew
      if (atMs > sessionAnchor + 1500) {
        showOverlay(fr);
      } else {
        console.info('[ReauthGuard] forceReauth is older than current session — ignoring (admin already re-logged-in).');
      }
    }, (err) => {
      console.warn('[ReauthGuard] snapshot error:', err?.message || err);
    });
  } catch(e) {
    console.warn('[ReauthGuard] attach failed:', e?.message || e);
  }
}

function showOverlay(fr) {
  if (_shown) return;
  _shown = true;
  const ch = fr.changes || {};
  // Privacy: never expose the editor's personal name to the admin — show a
  // generic, professional label instead. The actual editor (uid + name) is
  // already saved in audit logs and the roleUpdated notification's metadata.
  const editor = 'Management';
  const when = fr.at?.toDate?.()?.toLocaleString?.() || 'just now';
  const grantedTxt = (ch.grantedAuths || []).map(k => AUTH_LABELS[k] || k);
  const revokedTxt = (ch.revokedAuths || []).map(k => AUTH_LABELS[k] || k);
  const rows = [];
  if (ch.roleChanged) rows.push(`<div style="margin:6px 0"><span style="color:#f59e0b">Role:</span> <strong>${(fr.prev?.role) || '—'}</strong> → <strong>${(fr.next?.role) || '—'}</strong></div>`);
  if (grantedTxt.length) rows.push(`<div style="margin:6px 0"><span style="color:#22c55e">+ Granted:</span> ${grantedTxt.map(x => `<span style="display:inline-block;background:rgba(34,197,94,0.15);color:#86efac;padding:2px 8px;border-radius:10px;font-size:11px;margin:2px">${esc(x)}</span>`).join('')}</div>`);
  if (revokedTxt.length) rows.push(`<div style="margin:6px 0"><span style="color:#ef4444">− Removed:</span> ${revokedTxt.map(x => `<span style="display:inline-block;background:rgba(239,68,68,0.15);color:#fca5a5;padding:2px 8px;border-radius:10px;font-size:11px;margin:2px">${esc(x)}</span>`).join('')}</div>`);
  if ((ch.addedLocations || []).length) rows.push(`<div style="margin:6px 0"><span style="color:#22c55e">+ New locations:</span> ${ch.addedLocations.map(x => `<span style="display:inline-block;background:rgba(34,197,94,0.15);color:#86efac;padding:2px 8px;border-radius:10px;font-size:11px;margin:2px">${esc(x)}</span>`).join('')}</div>`);
  if ((ch.removedLocations || []).length) rows.push(`<div style="margin:6px 0"><span style="color:#ef4444">− Locations removed:</span> ${ch.removedLocations.map(x => `<span style="display:inline-block;background:rgba(239,68,68,0.15);color:#fca5a5;padding:2px 8px;border-radius:10px;font-size:11px;margin:2px">${esc(x)}</span>`).join('')}</div>`);
  if (!rows.length) rows.push('<div style="color:rgba(255,255,255,0.7)">Your administrator profile has been refreshed.</div>');

  const wrap = document.createElement('div');
  wrap.id = 'forceReauthOverlay';
  wrap.style.cssText = 'position:fixed;inset:0;background:rgba(8,15,30,0.96);z-index:2147483646;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(8px);padding:20px;font-family:system-ui,sans-serif;color:#fff';
  wrap.innerHTML = `
    <div style="max-width:560px;width:100%;background:linear-gradient(135deg,rgba(245,158,11,0.18),rgba(245,158,11,0.04));border:1px solid rgba(245,158,11,0.45);border-radius:18px;padding:32px 26px;box-shadow:0 18px 60px rgba(245,158,11,0.25)">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:14px">
        <div style="width:46px;height:46px;border-radius:50%;background:rgba(245,158,11,0.2);display:flex;align-items:center;justify-content:center;font-size:22px">🔐</div>
        <div>
          <div style="font-size:18px;font-weight:800">Your access has been updated</div>
          <div style="font-size:12px;color:rgba(255,255,255,0.65)">Updated by ${esc(editor)} · ${esc(when)}</div>
        </div>
      </div>
      <p style="font-size:13.5px;line-height:1.6;color:rgba(255,255,255,0.85);margin:6px 0 14px">
        Please sign in again so your new permissions take effect. Your existing data
        and history are <strong>safe</strong> — only what you can <em>see</em> changes
        based on your new role and allocated locations below.
      </p>
      <div style="background:rgba(0,0,0,0.25);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:14px 16px;margin:10px 0 18px;font-size:13px">
        ${rows.join('')}
      </div>
      <div style="display:flex;gap:10px;justify-content:flex-end">
        <button id="forceReauthLogoutBtn" style="background:linear-gradient(135deg,#f59e0b,#d97706);color:#1a1a1a;border:none;padding:11px 22px;border-radius:10px;font-weight:800;font-size:14px;cursor:pointer;display:inline-flex;align-items:center;gap:8px">
          <i class="fas fa-sign-in-alt"></i> Re-Login Now
        </button>
      </div>
      <p style="font-size:11px;color:rgba(255,255,255,0.5);text-align:center;margin:14px 0 0">
        Auto-logout in <span id="forceReauthCountdown">10</span>s…
      </p>
    </div>`;
  document.body.appendChild(wrap);
  document.documentElement.style.overflow = 'hidden';

  const doSignOut = async () => {
    try {
      // Clear the forceReauth marker so the next sign-in starts a fresh session
      if (auth.currentUser?.uid) {
        try { await updateDoc(doc(db, 'users', auth.currentUser.uid), { forceReauth: deleteField() }); } catch(_){}
      }
    } catch(_){}
    try { await signOut(auth); } catch(_){}
    window.location.href = 'index.html';
  };
  document.getElementById('forceReauthLogoutBtn').onclick = doSignOut;

  let secs = 10;
  const cd = document.getElementById('forceReauthCountdown');
  const tick = setInterval(() => {
    secs -= 1;
    if (cd) cd.textContent = String(Math.max(0, secs));
    if (secs <= 0) { clearInterval(tick); doSignOut(); }
  }, 1000);
}

function esc(s) {
  return String(s == null ? '' : s).replace(/[<>&"']/g, c => ({ '<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;',"'":'&#39;' }[c]));
}

onAuthStateChanged(auth, (user) => {
  if (!user) {
    if (_unsub) { try { _unsub(); } catch(_){} _unsub = null; }
    return;
  }
  attach(user);
});

window.__roleReauthGuardLoaded = true;
console.info('[ReauthGuard] module loaded');
