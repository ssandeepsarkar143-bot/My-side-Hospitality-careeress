// Auto-notify Owner + location-allocated Admin / Sub-Admin whenever a user
// creates a new request (employerConnect / contact / resumeDownload / membership /
// jobPost / promote etc).
//
// Schema written to `notifications` (matches the existing site convention):
//   { userId, message, type, read:false, broadcast:false, createdAt,
//     category:'request', requestId, requestType,
//     fromUid, fromName, fromEmail, location }
//
// Recipient resolution:
//   • Always: every user where role == 'Owner'.
//   • For "scoped" request types: every Admin / Sub-Admin where
//       authorities[<authKey>] == true AND
//       (locations array is empty  ──→ all-India access, or
//        locations array includes the requester's `state`).

import { db } from '/js/firebase-config.js';
import {
  collection, query, where, getDocs, getDoc, doc, addDoc, serverTimestamp
} from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js';

// requestType  →  human label  +  the matching admin authority key
const REQ_TYPE_META = {
  employerConnect: { label: 'Employer Connect',  authority: 'connectEmployer' },
  contact:         { label: 'Candidate Contact', authority: 'contact' },
  resumeDownload:  { label: 'Resume Download',   authority: 'resumeDownload' },
  membership:      { label: 'Prime Membership',  authority: 'membership' },
  jobPost:         { label: 'Job Post',          authority: 'jobPost' },
  promote:         { label: 'Promotion',         authority: 'promote' }
};

// Short approval hint shown inside the notification body.
function approvalHint(reqType) {
  switch (reqType) {
    case 'employerConnect':
      return 'Open the Connect Employer requests tab in your dashboard. Verify the candidate and the job, then click Approve to release the employer phone number to the user.';
    case 'contact':
      return 'Open the Contact requests tab in your dashboard. Verify the requester is a Prime member, then click Approve to release the candidate contact details.';
    case 'resumeDownload':
      return 'Open the Resume Download requests tab. Confirm the requester is Prime and the candidate exists, then click Approve to allow the resume download.';
    case 'membership':
      return 'Open the Membership Approvals tab. Verify the UTR / payment screenshot in your bank, then click Approve to upgrade the user to Prime.';
    case 'jobPost':
      return 'Open the Job Post Requests tab. Review the position, salary and location, then click Approve to publish the job live on the site.';
    case 'promote':
      return 'Open the Promotion Requests tab. Review the requested role, location and authorities, then click Approve to grant the promotion.';
    default:
      return 'Open your dashboard to review and Approve / Reject this request.';
  }
}

async function _fetchRequesterContext(uid, fallback = {}) {
  if (!uid) return fallback;
  try {
    const snap = await getDoc(doc(db, 'users', uid));
    const u = snap.exists() ? snap.data() : {};
    return {
      fromUid: uid,
      fromName: u.displayName || fallback.requesterName || fallback.requesterEmail || 'A user',
      fromEmail: u.email || fallback.requesterEmail || '',
      isPrime: !!u.isPrime,
      role: u.role || 'User',
      location: u.state || ''
    };
  } catch {
    return { fromUid: uid, ...fallback };
  }
}

async function _resolveRecipients(reqType, requesterLocation) {
  const recipients = new Map(); // uid → reason label
  // 1) All owners
  try {
    const ownerSnap = await getDocs(query(collection(db, 'users'), where('role', '==', 'Owner')));
    ownerSnap.docs.forEach(d => recipients.set(d.id, 'Owner'));
  } catch (_) {}

  // 2) Admins with the matching authority + location overlap
  const meta = REQ_TYPE_META[reqType];
  if (!meta || !meta.authority) return Array.from(recipients, ([uid, why]) => ({ uid, why }));

  try {
    // Pull both Admin and Sub-Admin in parallel (role values used in production)
    const [adminSnap, subAdminSnap] = await Promise.all([
      getDocs(query(collection(db, 'users'), where('role', '==', 'Admin'))),
      getDocs(query(collection(db, 'users'), where('role', '==', 'Sub-Admin'))).catch(() => ({ docs: [] }))
    ]);
    const docs = [...adminSnap.docs, ...subAdminSnap.docs];
    docs.forEach(d => {
      const u = d.data() || {};
      const auths = u.authorities || {};
      if (!auths[meta.authority]) return;            // no permission for this request type
      const locs = Array.isArray(u.locations) ? u.locations : [];
      // No locations set ⇒ all-India admin (still notify).
      // Locations set ⇒ must include the requester's state.
      if (locs.length && requesterLocation && !locs.includes(requesterLocation)) return;
      if (!recipients.has(d.id)) recipients.set(d.id, locs.length ? `Admin (${locs.join(', ')})` : 'Admin (all-India)');
    });
  } catch (_) {}

  return Array.from(recipients, ([uid, why]) => ({ uid, why }));
}

/**
 * Send notifications to Owner + location-scoped Admins about a new user request.
 *
 * @param {Object} opts
 * @param {string} opts.requestId       Firestore doc id of the request
 * @param {string} opts.requestType     'employerConnect' | 'contact' | ...
 * @param {string} opts.requesterUid    UID of the user who created the request
 * @param {string} [opts.requesterEmail]
 * @param {string} [opts.requesterName]
 * @param {string} [opts.subject]       Short subject (e.g. job title, candidate name)
 * @param {Object} [opts.extra]         Extra metadata mirrored on each notification
 */
export async function notifyManagementOfRequest(opts) {
  try {
    const meta = REQ_TYPE_META[opts.requestType] || { label: opts.requestType || 'Request', authority: null };
    const ctx = await _fetchRequesterContext(opts.requesterUid, {
      requesterEmail: opts.requesterEmail,
      requesterName: opts.requesterName
    });
    const requesterLocation = ctx.location || '';
    const recipients = await _resolveRecipients(opts.requestType, requesterLocation);
    if (!recipients.length) return { sent: 0 };

    const subjectLine = opts.subject ? ` for "${opts.subject}"` : '';
    const locLine = requesterLocation ? ` (location: ${requesterLocation})` : '';
    const message = `🔔 New ${meta.label} request${subjectLine} from ${ctx.fromName || ctx.fromEmail || 'a user'}${locLine}.\n\n${approvalHint(opts.requestType)}`;

    const writes = recipients.map(r => addDoc(collection(db, 'notifications'), {
      userId: r.uid,
      message,
      type: 'info',
      read: false,
      broadcast: false,
      createdAt: serverTimestamp(),
      category: 'request',
      requestId: opts.requestId || '',
      requestType: opts.requestType || '',
      fromUid: ctx.fromUid || opts.requesterUid || '',
      fromName: ctx.fromName || '',
      fromEmail: ctx.fromEmail || opts.requesterEmail || '',
      location: requesterLocation,
      recipientReason: r.why,
      ...(opts.extra || {})
    }).catch(() => null));

    const results = await Promise.all(writes);
    return { sent: results.filter(Boolean).length, total: recipients.length };
  } catch (e) {
    // Never throw — notifications are best-effort and must not block the user request flow.
    try { console.warn('[notify-helpers] failed:', e?.message); } catch (_) {}
    return { sent: 0, error: e?.message };
  }
}

// Convenience wrapper: pass a Firestore DocumentReference returned by addDoc.
export async function notifyForNewRequest(addDocResult, baseOpts) {
  const requestId = addDocResult?.id || addDocResult || '';
  return notifyManagementOfRequest({ ...baseOpts, requestId });
}
