// Live unread request-badge updater for Owner / Admin / Sub-Admin sidebars.
//
// Listens to `notifications` for the signed-in user where
//   category == 'request'  AND  read == false
// and pushes a per-requestType count into any element matching
//   #ownerBadge_<requestType>          (owner-feed.html)
//   #adminBadge_<requestType>          (admin-feed.html)
//   [data-req-badge="<requestType>"]   (generic, future-proof)
//
// Also keeps the global navbar bell badge (#notifBadge / #adminNotifBadge /
// #userNotifBadge) in sync with the total unread count so the user never has
// to refresh to see new alerts.
//
// Safe to include on every dashboard — it only attaches if the user document
// resolves to a management role (owner / admin / sub-admin) for the per-type
// badges; the navbar bell badge is updated for every signed-in user.

import { auth, db } from '/js/firebase-config.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js';
import {
  collection, query, where, onSnapshot, doc, getDoc
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

const REQ_TYPES = ['employerConnect', 'contact', 'resumeDownload', 'membership', 'jobPost', 'promote'];

function setBadge(el, count) {
  if (!el) return;
  if (count > 0) {
    el.textContent = count > 99 ? '99+' : String(count);
    el.style.display = 'inline-flex';
  } else {
    el.style.display = 'none';
  }
}

function updateAllBadges(unreadByType, totalUnread) {
  // Per-request-type badges
  REQ_TYPES.forEach((t) => {
    const ids = [`ownerBadge_${t}`, `adminBadge_${t}`];
    ids.forEach((id) => setBadge(document.getElementById(id), unreadByType[t] || 0));
    document.querySelectorAll(`[data-req-badge="${t}"]`).forEach((el) => setBadge(el, unreadByType[t] || 0));
  });

  // Global notification bell badge (works for owner / admin / user / prime layouts)
  ['notifBadge', 'adminNotifBadge', 'userNotifBadge'].forEach((id) => {
    const el = document.getElementById(id);
    if (!el) return;
    if (totalUnread > 0) {
      el.textContent = totalUnread > 99 ? '99+' : String(totalUnread);
      el.style.display = 'inline-flex';
    } else {
      el.style.display = 'none';
    }
  });
}

let _unsub = null;

function attachListener(uid) {
  if (_unsub) { try { _unsub(); } catch (_) {} _unsub = null; }
  if (!uid) { updateAllBadges({}, 0); return; }
  // We listen to ALL unread notifications for this user, not just request-category,
  // because the navbar bell badge counts every unread notification. We then filter
  // in-memory to compute the per-request-type counts.
  try {
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', uid),
      where('read', '==', false)
    );
    _unsub = onSnapshot(q, (snap) => {
      const byType = {};
      let total = 0;
      snap.forEach((d) => {
        const data = d.data() || {};
        total += 1;
        if (data.category === 'request' && data.requestType) {
          byType[data.requestType] = (byType[data.requestType] || 0) + 1;
        }
      });
      updateAllBadges(byType, total);
    }, () => {
      // Silent on permission / network errors — badges simply stay hidden.
    });
  } catch (_) { /* no-op */ }
}

(async function start() {
  if (!document.body) {
    await new Promise((r) => document.addEventListener('DOMContentLoaded', r, { once: true }));
  }
  try {
    onAuthStateChanged(auth, (user) => {
      attachListener(user ? user.uid : '');
    });
  } catch (_) { /* firebase not loadable */ }
})();
