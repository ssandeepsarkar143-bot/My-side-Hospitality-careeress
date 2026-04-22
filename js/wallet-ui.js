// HC Wallet + Refer & Earn - shared UI module
// Usage from page module:
//   import { attachWallet } from './js/wallet-ui.js';
//   attachWallet({ db, auth, user, userData, mountId: 'hcWalletMount', accent: '#d4af37' });

import {
  doc, getDoc, setDoc, updateDoc, addDoc, collection, query, where,
  getDocs, orderBy, limit, serverTimestamp, runTransaction, increment
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const REFERRAL_REWARD_POINTS = 10;

function makeReferralCode(uid) {
  const base = (uid || '').replace(/[^a-zA-Z0-9]/g, '').slice(-6).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 5).toUpperCase();
  return `HC${base}${rand}`;
}

function fmtDate(ts) {
  try {
    const d = ts?.toDate?.() || (ts ? new Date(ts) : null);
    return d ? d.toLocaleDateString() + ' ' + d.toLocaleTimeString().slice(0,5) : '—';
  } catch { return '—'; }
}

async function ensureWalletDoc(db, user, userData) {
  const ref = doc(db, 'users', user.uid);
  const patch = {};
  if (typeof userData?.walletBalance !== 'number') patch.walletBalance = 0;
  if (!userData?.referralCode) patch.referralCode = makeReferralCode(user.uid);
  if (Object.keys(patch).length) {
    await setDoc(ref, patch, { merge: true });
    return { ...(userData||{}), ...patch };
  }
  return userData || {};
}

function buildHTML(accent) {
  return `
  <style>
    .hcw-card { background: rgba(255,255,255,0.04); border: 1px solid ${accent}33; border-radius: 16px; padding: 18px; margin-bottom: 16px; }
    .hcw-row { display:flex; align-items:center; justify-content:space-between; gap:12px; flex-wrap:wrap; }
    .hcw-balance { font-size: 28px; font-weight: 900; color: ${accent}; }
    .hcw-sub { font-size: 12px; color: rgba(255,255,255,0.6); }
    .hcw-btn { background: ${accent}; color:#000; border:none; padding:8px 14px; border-radius:10px; font-weight:700; cursor:pointer; font-size:12px; }
    .hcw-btn-outline { background: transparent; color: ${accent}; border:1px solid ${accent}66; padding:8px 14px; border-radius:10px; font-weight:700; cursor:pointer; font-size:12px; }
    .hcw-input { width:100%; background: rgba(0,0,0,0.25); border:1px solid ${accent}44; color:#fff; padding:10px 12px; border-radius:10px; font-size:13px; }
    .hcw-grid2 { display:grid; grid-template-columns:1fr 1fr; gap:10px; }
    .hcw-section { margin-top:14px; padding-top:14px; border-top:1px dashed ${accent}33; }
    .hcw-tx { display:flex; justify-content:space-between; gap:8px; padding:8px 0; border-bottom:1px solid rgba(255,255,255,0.06); font-size:12px; }
    .hcw-tx:last-child{border-bottom:none}
    .hcw-tx-amt-pos { color:#22c55e; font-weight:700; }
    .hcw-tx-amt-neg { color:#ef4444; font-weight:700; }
    .hcw-ref-link { background: rgba(0,0,0,0.3); border:1px dashed ${accent}66; padding:8px 10px; border-radius:8px; font-size:11px; word-break:break-all; color:${accent}; cursor:pointer; }
    .hcw-pill { display:inline-block; background:${accent}22; color:${accent}; padding:2px 8px; border-radius:8px; font-size:10px; font-weight:700; margin-left:6px; }
    .hcw-msg { font-size:11px; padding:8px 10px; border-radius:8px; margin-top:8px; display:none; }
    .hcw-msg.ok { background:rgba(34,197,94,0.12); color:#22c55e; border:1px solid rgba(34,197,94,0.3); display:block; }
    .hcw-msg.err{ background:rgba(239,68,68,0.12); color:#ef4444; border:1px solid rgba(239,68,68,0.3); display:block; }
  </style>

  <div class="hcw-card">
    <div class="hcw-row">
      <div>
        <div class="hcw-sub"><i class="fas fa-wallet"></i> HC Wallet Balance</div>
        <div class="hcw-balance" id="hcwBalance">0 pts</div>
        <div class="hcw-sub">1 point = ₹1 · Use during Prime Membership purchase</div>
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <button class="hcw-btn" id="hcwOpenTopup"><i class="fas fa-plus"></i> Add Money</button>
        <button class="hcw-btn-outline" id="hcwOpenWd"><i class="fas fa-money-bill-transfer"></i> Withdraw</button>
        <button class="hcw-btn-outline" id="hcwOpenTx"><i class="fas fa-clock-rotate-left"></i> History</button>
      </div>
    </div>

    <!-- Top-up form -->
    <div id="hcwTopupBox" style="display:none" class="hcw-section">
      <div class="hcw-sub" style="font-weight:700;color:${accent};margin-bottom:8px"><i class="fas fa-money-bill-wave"></i> Add Money to Wallet (via UPI)</div>
      <div class="hcw-sub" style="margin-bottom:10px">Pay any amount to UPI <b id="hcwUpiId">ssandeepsarkar143-2@okhdfcbank</b> from your UPI app, then enter the amount + UTR below. Owner will approve and credit your wallet.</div>
      <div class="hcw-grid2">
        <div>
          <label class="hcw-sub">Amount (₹)</label>
          <input type="number" min="1" max="100000" id="hcwTopupAmt" class="hcw-input" placeholder="e.g. 500"/>
        </div>
        <div>
          <label class="hcw-sub">UTR / Transaction ID</label>
          <input type="text" id="hcwTopupUtr" class="hcw-input" placeholder="e.g. 427812345678"/>
        </div>
      </div>
      <div style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap">
        <button class="hcw-btn-outline" id="hcwOpenUpiApp"><i class="fas fa-mobile-alt"></i> Open UPI App</button>
        <button class="hcw-btn" id="hcwSubmitTopup"><i class="fas fa-paper-plane"></i> Submit for Approval</button>
      </div>
      <div class="hcw-msg" id="hcwTopupMsg"></div>
    </div>

    <!-- Withdraw form -->
    <div id="hcwWdBox" style="display:none" class="hcw-section">
      <div class="hcw-sub" style="font-weight:700;color:${accent};margin-bottom:8px"><i class="fas fa-money-bill-transfer"></i> Withdraw to UPI</div>
      <div class="hcw-sub" style="margin-bottom:10px">Cash out your HC Wallet balance to your UPI / bank account. <b>Minimum withdrawal: ₹200.</b> Amount will be deducted from your wallet immediately and paid by owner within 24 hours. If rejected, points are auto-refunded.</div>
      <div class="hcw-grid2">
        <div>
          <label class="hcw-sub">Amount (₹, min 200)</label>
          <input type="number" min="200" max="100000" id="hcwWdAmt" class="hcw-input" placeholder="e.g. 500"/>
        </div>
        <div>
          <label class="hcw-sub">Your UPI ID</label>
          <input type="text" id="hcwWdUpi" class="hcw-input" placeholder="e.g. yourname@okhdfcbank"/>
        </div>
      </div>
      <div>
        <label class="hcw-sub">Account holder name (optional)</label>
        <input type="text" id="hcwWdName" class="hcw-input" placeholder="As per bank"/>
      </div>
      <div style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap">
        <button class="hcw-btn" id="hcwSubmitWd"><i class="fas fa-paper-plane"></i> Submit Withdrawal</button>
      </div>
      <div class="hcw-msg" id="hcwWdMsg"></div>
    </div>

    <!-- Tx history -->
    <div id="hcwTxBox" style="display:none" class="hcw-section">
      <div class="hcw-sub" style="font-weight:700;color:${accent};margin-bottom:8px"><i class="fas fa-list"></i> Wallet Transactions</div>
      <div id="hcwTxList"><div class="hcw-sub">Loading…</div></div>
    </div>
  </div>

  <!-- My Coupons -->
  <div class="hcw-card" id="hcwCouponsCard" style="display:none">
    <div class="hcw-row">
      <div>
        <div class="hcw-sub"><i class="fas fa-ticket"></i> My Coupons</div>
        <div style="font-size:16px;font-weight:800;margin-top:2px">You have <span id="hcwCouponCount" style="color:${accent}">0</span> claimable coupon(s)</div>
        <div class="hcw-sub">Discount, free trial & free month coupons sent by the owner.</div>
      </div>
    </div>
    <div class="hcw-section" id="hcwCouponList"></div>
  </div>

  <div class="hcw-card">
    <div class="hcw-row">
      <div>
        <div class="hcw-sub"><i class="fas fa-gift"></i> Refer & Earn</div>
        <div style="font-size:16px;font-weight:800;margin-top:2px">Get <span style="color:${accent}">10 HC points</span> when your friend buys Prime</div>
        <div class="hcw-sub">Both you & your friend get 10 points (₹10) credited automatically.</div>
      </div>
      <div style="text-align:right">
        <div class="hcw-sub">Total Referred</div>
        <div style="font-size:22px;font-weight:900;color:${accent}" id="hcwRefCount">0</div>
        <div class="hcw-sub">Prime Conversions: <b id="hcwRefPrimeCount" style="color:${accent}">0</b></div>
      </div>
    </div>
    <div class="hcw-section">
      <div class="hcw-sub" style="margin-bottom:6px">Your Referral Link</div>
      <div class="hcw-ref-link" id="hcwRefLink" title="Click to copy">Loading…</div>
      <div style="display:flex;gap:8px;margin-top:8px;flex-wrap:wrap">
        <button class="hcw-btn-outline" id="hcwCopyRef"><i class="fas fa-copy"></i> Copy Link</button>
        <button class="hcw-btn" id="hcwShareRef"><i class="fas fa-share-alt"></i> Share</button>
      </div>
    </div>
  </div>
  `;
}

export async function attachWallet({ db, auth, user, userData, mountId = 'hcWalletMount', accent = '#d4af37' }) {
  const mount = document.getElementById(mountId);
  if (!mount || !user) return;
  mount.innerHTML = buildHTML(accent);

  let ud = await ensureWalletDoc(db, user, userData);

  // Load UPI id from settings
  let UPI_ID = 'ssandeepsarkar143-2@okhdfcbank';
  let BUSINESS_NAME = 'Hospitality Careers';
  try {
    const s = await getDoc(doc(db, 'siteContent', 'settings'));
    if (s.exists()) {
      if (s.data().upiId) UPI_ID = s.data().upiId;
      if (s.data().upiName) BUSINESS_NAME = s.data().upiName;
    }
  } catch {}
  document.getElementById('hcwUpiId').textContent = UPI_ID;

  const refLink = `${location.origin}/index.html?ref=${ud.referralCode}`;
  document.getElementById('hcwBalance').textContent = `${ud.walletBalance || 0} pts`;
  document.getElementById('hcwRefLink').textContent = refLink;

  // Referral counts
  try {
    const refSnap = await getDocs(query(collection(db, 'users'), where('referredBy','==',user.uid)));
    let total = 0, prime = 0;
    refSnap.forEach(d => { total++; if (d.data().role === 'Prime') prime++; });
    document.getElementById('hcwRefCount').textContent = total;
    document.getElementById('hcwRefPrimeCount').textContent = prime;
  } catch {}

  document.getElementById('hcwOpenTopup').onclick = () => {
    const b = document.getElementById('hcwTopupBox');
    b.style.display = b.style.display === 'none' ? 'block' : 'none';
  };
  document.getElementById('hcwOpenWd').onclick = () => {
    const b = document.getElementById('hcwWdBox');
    b.style.display = b.style.display === 'none' ? 'block' : 'none';
  };
  document.getElementById('hcwSubmitWd').onclick = submitWithdraw;
  document.getElementById('hcwOpenTx').onclick = async () => {
    const b = document.getElementById('hcwTxBox');
    b.style.display = b.style.display === 'none' ? 'block' : 'none';
    if (b.style.display === 'block') await renderTx();
  };
  document.getElementById('hcwOpenUpiApp').onclick = () => {
    const amt = parseInt(document.getElementById('hcwTopupAmt').value) || 0;
    if (amt < 1) { showMsg('hcwTopupMsg', 'Enter amount first.', 'err'); return; }
    const url = `upi://pay?pa=${UPI_ID}&pn=${encodeURIComponent(BUSINESS_NAME)}&am=${amt}&cu=INR&tn=${encodeURIComponent('HC Wallet Top-up')}`;
    window.location.href = url;
  };
  document.getElementById('hcwSubmitTopup').onclick = submitTopup;
  document.getElementById('hcwCopyRef').onclick = () => copyText(refLink, 'Referral link copied!');
  document.getElementById('hcwRefLink').onclick = () => copyText(refLink, 'Referral link copied!');
  document.getElementById('hcwShareRef').onclick = async () => {
    const text = `Join Hospitality Careers and we both get 10 HC Wallet points (₹10) when you buy Prime! ${refLink}`;
    try {
      if (navigator.share) await navigator.share({ title: 'Hospitality Careers', text, url: refLink });
      else copyText(text, 'Share text copied!');
    } catch {}
  };

  // Load & render claimable coupons for this user
  await renderCoupons();

  async function renderCoupons() {
    try {
      const snap = await getDocs(query(collection(db, 'coupons'), where('targetUid','==',user.uid), where('status','==','available')));
      const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      const card = document.getElementById('hcwCouponsCard');
      const list = document.getElementById('hcwCouponList');
      const cnt = document.getElementById('hcwCouponCount');
      if (!items.length) { card.style.display = 'none'; return; }
      card.style.display = 'block';
      cnt.textContent = items.length;
      list.innerHTML = items.map(c => {
        const expTxt = c.expiresAt?.toDate?.() ? `Expires ${c.expiresAt.toDate().toLocaleDateString()}` : 'No expiry';
        let valTxt = '';
        if (c.type === 'discount') valTxt = `<b style="color:${accent}">₹${c.value} OFF</b> on Prime Membership`;
        else if (c.type === 'trial') valTxt = `<b style="color:${accent}">${c.value}-day FREE Prime Trial</b>`;
        else if (c.type === 'freeMonth') valTxt = `<b style="color:${accent}">1 Month FREE Prime Membership</b>`;
        return `<div style="background:rgba(0,0,0,0.25);border:1px dashed ${accent}66;border-radius:10px;padding:12px;margin-bottom:10px">
          <div style="display:flex;justify-content:space-between;gap:8px;align-items:flex-start;flex-wrap:wrap">
            <div style="flex:1;min-width:200px">
              <div style="font-weight:700;color:${accent};font-size:14px">🎟️ ${c.title || 'Coupon'}</div>
              <div style="font-size:12px;margin-top:4px">${valTxt}</div>
              ${c.message ? `<div class="hcw-sub" style="margin-top:6px">${c.message}</div>` : ''}
              <div class="hcw-sub" style="margin-top:6px">Code: <b>${c.code}</b> · ${expTxt}</div>
            </div>
            <button class="hcw-btn" onclick="window.__hcwClaimCoupon('${c.id}')"><i class="fas fa-check"></i> Claim</button>
          </div>
        </div>`;
      }).join('');
    } catch (e) { console.warn('Coupons load failed', e.message); }
  }

  window.__hcwClaimCoupon = async function(couponId) {
    try {
      const cRef = doc(db, 'coupons', couponId);
      const cSnap = await getDoc(cRef);
      if (!cSnap.exists()) return alert('Coupon not found.');
      const c = cSnap.data();
      if (c.status !== 'available' || c.targetUid !== user.uid) return alert('This coupon is not claimable.');
      if (c.expiresAt?.toDate && c.expiresAt.toDate() < new Date()) {
        await updateDoc(cRef, { status: 'expired' });
        return alert('This coupon has expired.');
      }

      if (c.type === 'discount') {
        // Save as active discount on user; applied automatically on membership.html
        await updateDoc(doc(db, 'users', user.uid), {
          activeCoupon: { id: couponId, code: c.code, type: 'discount', value: c.value, title: c.title || '' }
        });
        await updateDoc(cRef, { status: 'claimed', claimedAt: serverTimestamp() });
        alert(`✅ Coupon claimed! ₹${c.value} OFF will be auto-applied on your next Prime Membership purchase.`);
      } else if (c.type === 'trial' || c.type === 'freeMonth') {
        const days = c.type === 'freeMonth' ? 30 : (c.value || 7);
        const userRef = doc(db, 'users', user.uid);
        const uSnap = await getDoc(userRef);
        const ud2 = uSnap.data() || {};
        const expiry = new Date(); expiry.setDate(expiry.getDate() + days);
        const newCount = (ud2.membershipCount || 0) + 1;
        const tag = `Prime${newCount > 1 ? newCount : ''}`;
        await updateDoc(userRef, {
          role: 'Prime', tag,
          membershipCount: newCount,
          membershipPurchasedAt: serverTimestamp(),
          membershipExpiryAt: expiry
        });
        await addDoc(collection(db, 'requests'), {
          type: 'membership', requesterId: user.uid, requesterEmail: user.email,
          userName: ud2.displayName || user.displayName || user.email,
          utr: 'COUPON-' + c.code, amount: 0, validityDays: days,
          status: 'approved', autoApproved: true, couponId,
          createdAt: serverTimestamp(), approvedAt: serverTimestamp()
        });
        await updateDoc(cRef, { status: 'claimed', claimedAt: serverTimestamp() });
        alert(`🎉 Congratulations! Your FREE ${days}-day Prime Membership is active until ${expiry.toLocaleDateString()}.`);
      }
      await renderCoupons();
      setTimeout(() => location.reload(), 800);
    } catch (e) { alert('Claim failed: ' + e.message); }
  };

  async function submitWithdraw() {
    const amt = parseInt(document.getElementById('hcwWdAmt').value) || 0;
    const upi = (document.getElementById('hcwWdUpi').value || '').trim();
    const name = (document.getElementById('hcwWdName').value || '').trim();
    if (amt < 200) return showMsg('hcwWdMsg', 'Minimum withdrawal is ₹200.', 'err');
    if (!upi || !upi.includes('@')) return showMsg('hcwWdMsg', 'Enter a valid UPI ID (e.g. name@okhdfcbank).', 'err');
    // Re-fetch latest balance
    const fresh = (await getDoc(doc(db, 'users', user.uid))).data() || {};
    const bal = fresh.walletBalance || 0;
    if (bal < amt) return showMsg('hcwWdMsg', `Insufficient balance. You have ${bal} pts, need ${amt}.`, 'err');
    try {
      // Deduct immediately (hold)
      await updateDoc(doc(db, 'users', user.uid), { walletBalance: increment(-amt) });
      const wdRef = await addDoc(collection(db, 'walletWithdrawals'), {
        uid: user.uid, email: user.email || '',
        name: name || ud.displayName || user.displayName || user.email,
        amount: amt, upi, status: 'pending',
        createdAt: serverTimestamp()
      });
      await addDoc(collection(db, 'walletTransactions'), {
        uid: user.uid, type: 'withdraw', amount: -amt,
        note: `Withdrawal requested to ${upi}`, ref: wdRef.id,
        createdAt: serverTimestamp()
      });
      document.getElementById('hcwWdAmt').value = '';
      showMsg('hcwWdMsg', `✅ Withdrawal of ₹${amt} requested. Owner will pay within 24h to ${upi}.`, 'ok');
      document.getElementById('hcwBalance').textContent = `${bal - amt} pts`;
    } catch (e) {
      showMsg('hcwWdMsg', 'Failed: ' + e.message, 'err');
    }
  }

  async function submitTopup() {
    const amt = parseInt(document.getElementById('hcwTopupAmt').value) || 0;
    const utr = (document.getElementById('hcwTopupUtr').value || '').trim();
    if (amt < 1) return showMsg('hcwTopupMsg', 'Enter a valid amount.', 'err');
    if (utr.length < 6) return showMsg('hcwTopupMsg', 'Enter the UTR / Transaction ID after paying.', 'err');
    try {
      await addDoc(collection(db, 'walletTopups'), {
        uid: user.uid,
        email: user.email || '',
        name: ud.displayName || user.displayName || user.email,
        amount: amt,
        utr,
        status: 'pending',
        createdAt: serverTimestamp()
      });
      document.getElementById('hcwTopupAmt').value = '';
      document.getElementById('hcwTopupUtr').value = '';
      showMsg('hcwTopupMsg', '✅ Submitted! Owner will approve & credit your wallet shortly.', 'ok');
    } catch (e) {
      showMsg('hcwTopupMsg', 'Failed: ' + e.message, 'err');
    }
  }

  async function renderTx() {
    const list = document.getElementById('hcwTxList');
    list.innerHTML = '<div class="hcw-sub">Loading…</div>';
    try {
      const snap = await getDocs(query(collection(db, 'walletTransactions'), where('uid','==',user.uid)));
      const items = snap.docs.map(d => d.data()).sort((a,b) => (b.createdAt?.toMillis?.()||0) - (a.createdAt?.toMillis?.()||0)).slice(0, 30);
      if (!items.length) { list.innerHTML = '<div class="hcw-sub">No transactions yet.</div>'; return; }
      list.innerHTML = items.map(t => {
        const sign = t.amount > 0 ? '+' : '';
        const cls = t.amount > 0 ? 'hcw-tx-amt-pos' : 'hcw-tx-amt-neg';
        const label = ({topup:'Top-up Approved', referral:'Referral Bonus', spend:'Membership Payment', withdraw:'Withdrawal', refund:'Withdrawal Refund', adjust:'Adjustment'})[t.type] || t.type;
        return `<div class="hcw-tx"><div><div style="font-weight:600">${label}</div><div class="hcw-sub">${t.note||''} · ${fmtDate(t.createdAt)}</div></div><div class="${cls}">${sign}${t.amount} pts</div></div>`;
      }).join('');
    } catch (e) {
      list.innerHTML = `<div class="hcw-sub" style="color:#ef4444">Could not load transactions.</div>`;
    }
  }

  function showMsg(id, text, type) {
    const el = document.getElementById(id);
    el.textContent = text;
    el.className = 'hcw-msg ' + (type === 'ok' ? 'ok' : 'err');
    if (type === 'ok') setTimeout(() => { el.className = 'hcw-msg'; }, 5000);
  }
  function copyText(t, msg) {
    navigator.clipboard?.writeText(t);
    const el = document.getElementById('hcwTopupMsg');
    if (el) { el.textContent = msg; el.className = 'hcw-msg ok'; setTimeout(()=>{el.className='hcw-msg';},3000); }
  }
}

// ---------- Helpers exported for membership / owner pages ----------

export async function payMembershipFromWallet({ db, user, userData, amount, validityDays = 30 }) {
  if (!user) throw new Error('Not signed in');
  if (!amount || amount < 1) throw new Error('Invalid amount');
  const balance = userData?.walletBalance || 0;
  if (balance < amount) throw new Error(`Insufficient balance. You have ${balance} pts, need ${amount}.`);

  const userRef = doc(db, 'users', user.uid);
  const expiry = new Date(); expiry.setDate(expiry.getDate() + validityDays);
  const newCount = (userData.membershipCount || 0) + 1;
  const tag = `Prime${newCount > 1 ? newCount : ''}`;

  const userPatch = {
    walletBalance: increment(-amount),
    role: 'Prime',
    tag,
    membershipCount: newCount,
    membershipPurchasedAt: serverTimestamp(),
    membershipExpiryAt: expiry
  };
  if (userData?.activeCoupon) userPatch.activeCoupon = null;
  await updateDoc(userRef, userPatch);

  await addDoc(collection(db, 'walletTransactions'), {
    uid: user.uid, type: 'spend', amount: -amount,
    note: `Prime Membership (${validityDays} days)`,
    createdAt: serverTimestamp()
  });

  await addDoc(collection(db, 'requests'), {
    type: 'membership',
    requesterId: user.uid,
    requesterEmail: user.email,
    userName: userData?.displayName || user.displayName || user.email,
    utr: 'WALLET-PAY',
    amount,
    paidFromWallet: amount,
    validityDays,
    status: 'approved',
    autoApproved: true,
    createdAt: serverTimestamp(),
    approvedAt: serverTimestamp()
  });

  // Trigger referral reward (if any)
  await maybeCreditReferral({ db, user, userData });

  return { success: true, tag };
}

export async function maybeCreditReferral({ db, user, userData }) {
  if (!userData?.referredBy) return;
  if (userData?.primeReferralCredited) return;
  const referrerUid = userData.referredBy;
  if (referrerUid === user.uid) return;

  try {
    // Mark new prime user as credited + give 10 pts
    await updateDoc(doc(db, 'users', user.uid), {
      walletBalance: increment(REFERRAL_REWARD_POINTS),
      primeReferralCredited: true
    });
    await addDoc(collection(db, 'walletTransactions'), {
      uid: user.uid, type: 'referral', amount: REFERRAL_REWARD_POINTS,
      note: `Welcome bonus for joining via referral`,
      createdAt: serverTimestamp()
    });

    // Credit the referrer
    await updateDoc(doc(db, 'users', referrerUid), {
      walletBalance: increment(REFERRAL_REWARD_POINTS),
      referralPrimeCount: increment(1)
    });
    await addDoc(collection(db, 'walletTransactions'), {
      uid: referrerUid, type: 'referral', amount: REFERRAL_REWARD_POINTS,
      note: `Your referral ${user.email || ''} bought Prime`,
      ref: user.uid,
      createdAt: serverTimestamp()
    });

    // Log a referral record
    await addDoc(collection(db, 'referralRewards'), {
      referrerUid,
      referredUid: user.uid,
      referredEmail: user.email || '',
      points: REFERRAL_REWARD_POINTS,
      createdAt: serverTimestamp()
    });
  } catch (e) {
    console.warn('Referral credit failed:', e.message);
  }
}
