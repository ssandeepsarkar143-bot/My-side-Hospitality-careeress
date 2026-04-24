// freeze-guard.js — blocks any frozen account from using the site or logging out.
// Loaded from owner-feed.html, user-feed.html, prime-feed.html, admin-feed.html.
import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, doc, onSnapshot, deleteDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

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

let overlay = null;
let timer = null;

function showFrozenOverlay(data) {
  if (overlay) {
    update();
    return;
  }
  overlay = document.createElement('div');
  overlay.id = 'frozenOverlay';
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(8,15,30,0.96);z-index:2147483647;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(8px);padding:20px;font-family:system-ui,sans-serif;color:#fff';
  overlay.innerHTML = `
    <div style="max-width:520px;text-align:center;background:linear-gradient(135deg,rgba(14,165,233,0.18),rgba(14,165,233,0.06));border:1px solid rgba(14,165,233,0.4);border-radius:18px;padding:40px 28px;box-shadow:0 16px 60px rgba(14,165,233,0.3)">
      <div style="font-size:64px;margin-bottom:14px">❄️</div>
      <h1 style="font-size:24px;margin:0 0 12px">Account Temporarily Frozen</h1>
      <p style="color:rgba(255,255,255,0.85);font-size:14px;line-height:1.6;margin:8px 0 18px">
        Your Hospitality Careers account is on a temporary hold. You cannot use the website until the freeze is lifted.
      </p>
      <div style="background:rgba(255,255,255,0.05);border-radius:12px;padding:14px;margin:14px 0;text-align:left;font-size:13px">
        <div style="margin:4px 0"><strong>Reason:</strong> <span id="frzGuardReason">—</span></div>
        <div style="margin:4px 0"><strong>Auto-lifts at:</strong> <span id="frzGuardUntil">—</span></div>
        <div style="margin:4px 0"><strong>Time left:</strong> <span id="frzGuardLeft" style="color:#0ea5e9;font-weight:700">—</span></div>
      </div>
      <p style="font-size:12px;color:rgba(255,255,255,0.6);margin:14px 0 0">
        For urgent help, contact the Owner. Logout is disabled while frozen.
      </p>
    </div>`;
  document.body.appendChild(overlay);
  // Block scrolling
  document.documentElement.style.overflow = 'hidden';
  // Block keyboard shortcuts that could navigate away (best-effort)
  document.addEventListener('keydown', blockKeys, true);

  function update() {
    const until = data.frozenUntil?.toDate?.();
    document.getElementById('frzGuardReason').textContent = data.reason || 'Hold by administrator.';
    document.getElementById('frzGuardUntil').textContent = until?.toLocaleString() || '—';
    if (until) {
      const ms = until.getTime() - Date.now();
      if (ms <= 0) { hideFrozenOverlay(); return; }
      const days = Math.floor(ms/86400000);
      const hrs = Math.floor((ms%86400000)/3600000);
      const mins = Math.floor((ms%3600000)/60000);
      document.getElementById('frzGuardLeft').textContent =
        (days>0?`${days}d `:'') + (hrs>0||days>0?`${hrs}h `:'') + `${mins}m`;
    }
  }
  update();
  if (timer) clearInterval(timer);
  timer = setInterval(update, 30000);
}

function blockKeys(e) {
  // Block F5, Ctrl+R reload could let them log out via cached signout link; we're already overlayed.
  // Mostly block nothing unusual — overlay covers UI.
  if ((e.ctrlKey || e.metaKey) && (e.key === 'q' || e.key === 'w')) {
    e.preventDefault(); e.stopPropagation();
  }
}

function hideFrozenOverlay() {
  if (overlay) { overlay.remove(); overlay = null; }
  document.documentElement.style.overflow = '';
  document.removeEventListener('keydown', blockKeys, true);
  if (timer) { clearInterval(timer); timer = null; }
}

onAuthStateChanged(auth, (user) => {
  if (!user) { hideFrozenOverlay(); return; }
  // Owner is never frozen
  if ((user.email || '').toLowerCase() === 'ssandeepsarkar143@gmail.com') return;
  try {
    onSnapshot(doc(db, 'frozenUsers', user.uid), async (snap) => {
      if (!snap.exists()) { hideFrozenOverlay(); return; }
      const f = snap.data();
      const untilMs = f.frozenUntil?.toMillis?.() || 0;
      if (untilMs && untilMs < Date.now()) {
        // Expired — auto-clean and hide
        try { await deleteDoc(snap.ref); } catch(_){}
        hideFrozenOverlay();
        return;
      }
      showFrozenOverlay(f);
    }, () => {});
  } catch(_){}
});

window.__freezeGuardLoaded = true;
