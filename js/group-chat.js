// ============================================================================
// js/group-chat.js — Connect Hub + Group Chat (Phase 4 + Phase 8 enhancements)
//   • Member-aware group list (owner & members can both see)
//   • Online presence (heartbeat every 30s, online if seen within 90s)
//   • Per-message read receipts + click-to-see-who-read
//   • Screenshot / image upload (Firebase Storage)
//   • Owner-set Meeting Link + Join Meeting button
//   • Browser + in-app notifications on new messages
//   • Owner: send Daily / Monthly / Yearly reports (PDF, stored in chatReports)
// ============================================================================
import {
  collection, doc, addDoc, getDoc, getDocs, setDoc, updateDoc, deleteDoc,
  query, where, onSnapshot, orderBy, limit, serverTimestamp, arrayUnion
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { ref as sRef, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";
import { auth, db, storage } from "./firebase-config.js";

const OWNER_EMAIL = 'ssandeepsarkar143@gmail.com';
const PRESENCE_HEARTBEAT_MS = 30 * 1000;
const PRESENCE_ONLINE_WINDOW_MS = 90 * 1000;

const GroupChat = {
  currentUser: null,
  currentUserData: null,
  currentGroupId: null,
  unsubGroups: null,
  unsubMessages: null,
  unsubPresence: null,
  groups: [],
  presence: {}, // uid -> lastSeenMs
  presenceTimer: null,
  notifiedMsgs: new Set(),
  lastSeenByGroup: {}, // groupId -> ms

  isOwner() { return (this.currentUser?.email || '').toLowerCase() === OWNER_EMAIL; },

  init({ user }) {
    if (!user) return;
    if (this.currentUser && this.currentUser.uid === user.uid) return; // already initialised
    this.currentUser = user;
    this.loadUserMeta();
    this.injectStyles();
    this.injectPanel();
    this.subscribeMyGroups();
    this.startPresence();
    this.requestNotifPermission();
    // restore last-seen from localStorage
    try { this.lastSeenByGroup = JSON.parse(localStorage.getItem('hc_gc_lastSeen') || '{}'); } catch(_){}
  },

  async loadUserMeta() {
    try {
      const s = await getDoc(doc(db, 'users', this.currentUser.uid));
      if (s.exists()) this.currentUserData = s.data();
    } catch(_){}
  },

  // ---------------------- STYLES ----------------------
  injectStyles() {
    if (document.getElementById('gc-styles')) return;
    const css = document.createElement('style');
    css.id = 'gc-styles';
    css.textContent = `
      .gc-fab { position:fixed; right:20px; bottom:24px; width:56px; height:56px; border-radius:50%;
        background:linear-gradient(135deg,#d4af37,#b8941f); color:#0a0a14; border:none; cursor:pointer;
        box-shadow:0 6px 20px rgba(212,175,55,0.45); z-index:9998; display:flex;
        align-items:center; justify-content:center; font-size:22px; transition:transform .2s; }
      .gc-fab:hover { transform:scale(1.08); }
      .gc-fab .gc-badge { position:absolute; top:-4px; right:-4px; background:#ef4444; color:#fff;
        font-size:10px; min-width:20px; height:20px; border-radius:10px; display:flex;
        align-items:center; justify-content:center; font-weight:700; padding:0 5px; }
      .gc-panel { position:fixed; right:20px; bottom:90px; width:400px; max-width:calc(100vw - 32px);
        height:600px; max-height:calc(100vh - 120px); background:#13131f; border:1px solid rgba(212,175,55,0.3);
        border-radius:16px; box-shadow:0 12px 40px rgba(0,0,0,0.6); z-index:9999;
        display:none; flex-direction:column; overflow:hidden; }
      .gc-panel.open { display:flex; animation: gc-slide .25s ease-out; }
      @keyframes gc-slide { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
      .gc-head { padding:14px 16px; background:linear-gradient(135deg,#1a1a2e,#0f0f1a);
        border-bottom:1px solid rgba(212,175,55,0.25); display:flex; align-items:center; gap:10px; }
      .gc-head .gc-title { flex:1; font-weight:700; color:#d4af37; font-size:15px; }
      .gc-head button { background:transparent; border:none; color:#fff; cursor:pointer; font-size:18px;
        width:32px; height:32px; border-radius:8px; }
      .gc-head button:hover { background:rgba(255,255,255,0.08); }
      .gc-body { flex:1; overflow-y:auto; }
      .gc-grouplist { padding:8px; }
      .gc-group-row { padding:12px 14px; border-radius:10px; cursor:pointer; display:flex;
        align-items:center; gap:12px; transition:background .15s; }
      .gc-group-row:hover { background:rgba(212,175,55,0.08); }
      .gc-group-row .gc-avatar { width:42px; height:42px; border-radius:50%;
        background:linear-gradient(135deg,#d4af37,#b8941f); color:#0a0a14; font-weight:700;
        display:flex; align-items:center; justify-content:center; font-size:18px; flex-shrink:0; position:relative; }
      .gc-group-row .gc-avatar .gc-presence { position:absolute; bottom:2px; right:2px; width:10px; height:10px;
        border-radius:50%; background:#22c55e; border:2px solid #13131f; }
      .gc-group-row .gc-info { flex:1; min-width:0; }
      .gc-group-row .gc-name { color:#fff; font-weight:600; font-size:13px; white-space:nowrap;
        overflow:hidden; text-overflow:ellipsis; }
      .gc-group-row .gc-sub { color:#888; font-size:11px; margin-top:2px; }
      .gc-group-row .gc-unread { background:#ef4444; color:#fff; font-size:10px; padding:2px 7px;
        border-radius:10px; font-weight:700; margin-left:6px; }
      .gc-empty { padding:40px 20px; text-align:center; color:#888; font-size:13px; }
      .gc-thread-head { padding:10px 14px; background:#1a1a2e; border-bottom:1px solid rgba(212,175,55,0.2);
        display:flex; align-items:center; gap:10px; }
      .gc-thread-head .gc-back { background:transparent; border:none; color:#d4af37; cursor:pointer;
        font-size:16px; padding:6px 10px; }
      .gc-thread-head .gc-thread-title { flex:1; color:#fff; font-weight:700; font-size:14px; }
      .gc-thread-head .gc-thread-sub { color:#d4af37; font-size:10px; }
      .gc-toolbar { padding:6px 12px; background:#15152a; border-bottom:1px solid rgba(212,175,55,0.15);
        display:flex; gap:6px; flex-wrap:wrap; align-items:center; }
      .gc-toolbar button { background:rgba(212,175,55,0.12); border:1px solid rgba(212,175,55,0.3);
        color:#d4af37; padding:4px 10px; border-radius:14px; font-size:11px; cursor:pointer; }
      .gc-toolbar button:hover { background:rgba(212,175,55,0.2); }
      .gc-toolbar .gc-online-count { font-size:11px; color:#22c55e; }
      .gc-messages { flex:1; overflow-y:auto; padding:14px; display:flex; flex-direction:column; gap:8px;
        background:linear-gradient(180deg, #0a0a14 0%, #13131f 100%); }
      .gc-msg { max-width:78%; padding:8px 12px; border-radius:14px; font-size:13px; line-height:1.4;
        word-wrap:break-word; position:relative; cursor:pointer; }
      .gc-msg.me { align-self:flex-end; background:linear-gradient(135deg,#d4af37,#b8941f); color:#0a0a14;
        border-bottom-right-radius:4px; }
      .gc-msg.them { align-self:flex-start; background:rgba(255,255,255,0.08); color:#fff;
        border:1px solid rgba(255,255,255,0.06); border-bottom-left-radius:4px; }
      .gc-msg .gc-sender { font-size:10px; font-weight:700; color:#d4af37; margin-bottom:3px; }
      .gc-msg.me .gc-sender { color:rgba(0,0,0,0.65); }
      .gc-msg .gc-time { font-size:9px; opacity:0.65; margin-top:3px; text-align:right; display:flex; justify-content:flex-end; gap:6px; align-items:center; }
      .gc-msg img { max-width:240px; max-height:240px; border-radius:8px; display:block; margin-top:4px; cursor:zoom-in; }
      .gc-msg .gc-tick { font-size:10px; }
      .gc-input-bar { padding:10px; border-top:1px solid rgba(212,175,55,0.2); background:#1a1a2e;
        display:flex; gap:8px; align-items:center; }
      .gc-input-bar input[type=text] { flex:1; padding:10px 14px; border-radius:22px; border:1px solid rgba(212,175,55,0.25);
        background:rgba(0,0,0,0.3); color:#fff; font-size:13px; outline:none; }
      .gc-input-bar input[type=text]:focus { border-color:#d4af37; }
      .gc-input-bar button { width:40px; height:40px; border-radius:50%;
        background:linear-gradient(135deg,#d4af37,#b8941f); color:#0a0a14; border:none; cursor:pointer;
        font-size:14px; display:flex; align-items:center; justify-content:center; }
      .gc-input-bar button.attach { background:rgba(255,255,255,0.08); color:#d4af37; border:1px solid rgba(212,175,55,0.3); }
      .gc-input-bar button:disabled { opacity:0.4; cursor:not-allowed; }
      .gc-system { align-self:center; font-size:11px; color:#888; padding:4px 10px;
        background:rgba(255,255,255,0.04); border-radius:10px; }
      .gc-meeting-bar { padding:8px 14px; background:rgba(34,197,94,0.1); border-bottom:1px solid rgba(34,197,94,0.25);
        display:flex; align-items:center; gap:10px; font-size:11px; color:#22c55e; }
      .gc-meeting-bar a { color:#fff; background:#22c55e; padding:5px 12px; border-radius:14px; text-decoration:none; font-weight:700; }
      .gc-dismissed { padding:8px 14px; background:rgba(239,68,68,0.1); color:#ef4444; font-size:11px;
        text-align:center; border-bottom:1px solid rgba(239,68,68,0.2); }
      .gc-readby-modal { position:fixed; inset:0; background:rgba(0,0,0,0.7); z-index:10000;
        display:flex; align-items:center; justify-content:center; padding:20px; }
      .gc-readby-modal .gc-modal-card { background:#13131f; border:1px solid rgba(212,175,55,0.3); border-radius:14px;
        max-width:360px; width:100%; max-height:80vh; overflow:hidden; display:flex; flex-direction:column; }
      .gc-readby-modal h3 { margin:0; padding:14px 18px; color:#d4af37; border-bottom:1px solid rgba(212,175,55,0.2); display:flex; justify-content:space-between; align-items:center; }
      .gc-readby-modal h3 button { background:transparent; border:none; color:#fff; cursor:pointer; font-size:20px; }
      .gc-readby-modal .gc-modal-body { overflow-y:auto; padding:8px 0; }
      .gc-readby-modal .gc-readby-row { padding:10px 18px; display:flex; align-items:center; gap:10px; }
      .gc-readby-row .gc-mini-avatar { width:32px; height:32px; border-radius:50%; background:#d4af37; color:#000;
        display:flex; align-items:center; justify-content:center; font-weight:700; font-size:12px; }
      .gc-toast { position:fixed; top:20px; right:20px; background:#13131f; border:1px solid rgba(212,175,55,0.4);
        padding:12px 16px; border-radius:10px; color:#fff; z-index:10001; box-shadow:0 6px 20px rgba(0,0,0,0.5);
        max-width:320px; animation:gc-slide-in .25s; cursor:pointer; }
      @keyframes gc-slide-in { from { transform:translateX(120%); } to { transform:translateX(0); } }
      .gc-toast .gc-toast-title { font-weight:700; color:#d4af37; font-size:12px; margin-bottom:3px; }
      .gc-toast .gc-toast-body { font-size:12px; color:#ddd; }
    `;
    document.head.appendChild(css);
  },

  // ---------------------- UI INJECT ----------------------
  injectPanel() {
    if (document.getElementById('gc-panel')) return;
    const fab = document.createElement('button');
    fab.id = 'gc-fab'; fab.className = 'gc-fab'; fab.title = 'Group Chats';
    fab.innerHTML = '<i class="fas fa-comments"></i><span class="gc-badge" id="gc-fab-badge" style="display:none">0</span>';
    fab.onclick = () => this.togglePanel();
    document.body.appendChild(fab);

    const panel = document.createElement('div');
    panel.id = 'gc-panel'; panel.className = 'gc-panel';
    panel.innerHTML = `
      <div id="gc-list-view">
        <div class="gc-head">
          <div class="gc-title"><i class="fas fa-users"></i> My Group Chats</div>
          <button onclick="GroupChat.togglePanel()" title="Close">&times;</button>
        </div>
        <div class="gc-body"><div class="gc-grouplist" id="gc-grouplist">
          <div class="gc-empty">Loading your groups…</div>
        </div></div>
      </div>
      <div id="gc-thread-view" style="display:none;flex-direction:column;height:100%">
        <div class="gc-thread-head">
          <button class="gc-back" onclick="GroupChat.closeThread()"><i class="fas fa-arrow-left"></i></button>
          <div style="flex:1;min-width:0">
            <div class="gc-thread-title" id="gc-thread-title">Group</div>
            <div class="gc-thread-sub" id="gc-thread-sub">—</div>
          </div>
          <button onclick="GroupChat.togglePanel()" title="Close">&times;</button>
        </div>
        <div id="gc-meeting-bar"></div>
        <div class="gc-toolbar" id="gc-toolbar"></div>
        <div id="gc-thread-status"></div>
        <div class="gc-messages" id="gc-messages"></div>
        <div class="gc-input-bar" id="gc-input-bar">
          <button class="attach" onclick="GroupChat.pickFile()" title="Attach screenshot"><i class="fas fa-paperclip"></i></button>
          <input type="file" id="gc-file-input" accept="image/*" style="display:none" onchange="GroupChat.onFilePicked(event)"/>
          <input type="text" id="gc-msg-input" placeholder="Type a message…" maxlength="500"
            onkeypress="if(event.key==='Enter')GroupChat.sendMessage()"
            onpaste="GroupChat.onPaste(event)"/>
          <button onclick="GroupChat.sendMessage()" id="gc-send-btn" title="Send"><i class="fas fa-paper-plane"></i></button>
        </div>
      </div>
    `;
    document.body.appendChild(panel);
  },

  togglePanel() {
    const p = document.getElementById('gc-panel');
    p.classList.toggle('open');
    if (!p.classList.contains('open')) this.closeThread();
  },

  // ---------------------- PRESENCE ----------------------
  startPresence() {
    if (this.presenceTimer) clearInterval(this.presenceTimer);
    const beat = async () => {
      try {
        await setDoc(doc(db, 'presence', this.currentUser.uid), {
          uid: this.currentUser.uid,
          email: this.currentUser.email || '',
          name: this.currentUser.displayName || this.currentUserData?.displayName || this.currentUser.email,
          lastSeen: serverTimestamp()
        }, { merge: true });
      } catch(_){}
    };
    beat();
    this.presenceTimer = setInterval(beat, PRESENCE_HEARTBEAT_MS);
    // Subscribe to presence collection (lightweight; ~few hundred docs)
    if (this.unsubPresence) this.unsubPresence();
    this.unsubPresence = onSnapshot(collection(db, 'presence'), (snap) => {
      const m = {};
      snap.docs.forEach(d => {
        const x = d.data();
        m[d.id] = x.lastSeen?.toMillis?.() || 0;
      });
      this.presence = m;
      this.renderGroupList();
    }, (e) => console.warn('[GroupChat] presence err:', e.message));
  },

  isOnline(uid) {
    const t = this.presence[uid] || 0;
    return t > 0 && (Date.now() - t) < PRESENCE_ONLINE_WINDOW_MS;
  },

  // ---------------------- NOTIFICATIONS ----------------------
  async requestNotifPermission() {
    if (!('Notification' in window)) return;
    if (Notification.permission === 'default') {
      try { await Notification.requestPermission(); } catch(_){}
    }
  },

  notifyNewMessage(group, msg) {
    if (!msg || msg.senderUid === this.currentUser.uid) return;
    if (this.notifiedMsgs.has(msg.id)) return;
    this.notifiedMsgs.add(msg.id);
    // In-app toast
    const toast = document.createElement('div');
    toast.className = 'gc-toast';
    toast.innerHTML = `<div class="gc-toast-title">${this.escape(group.name)} · ${this.escape(msg.senderName||'')}</div>
      <div class="gc-toast-body">${this.escape((msg.text||'[image]').slice(0,80))}</div>`;
    toast.onclick = () => { toast.remove(); this.togglePanel(); if (!document.getElementById('gc-panel').classList.contains('open')) this.togglePanel(); this.openThread(group.id); };
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 6000);
    // Browser notification
    try {
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(`${group.name} · ${msg.senderName||''}`, { body: (msg.text||'[image]').slice(0,120), icon: '/logo.png' });
      }
    } catch(_){}
  },

  // ---------------------- SUBSCRIBE TO MY GROUPS ----------------------
  subscribeMyGroups() {
    if (!this.currentUser) return;
    if (this.unsubGroups) this.unsubGroups();
    const q = query(collection(db, 'connectGroups'), where('memberUids', 'array-contains', this.currentUser.uid));
    this.unsubGroups = onSnapshot(q, (snap) => {
      const prev = new Map(this.groups.map(g => [g.id, g.lastMessageAt?.toMillis?.()||0]));
      this.groups = snap.docs.map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => (b.lastMessageAt?.toMillis?.() || b.createdAt?.toMillis?.() || 0) -
                        (a.lastMessageAt?.toMillis?.() || a.createdAt?.toMillis?.() || 0));
      // detect new messages for toast
      this.groups.forEach(g => {
        const newT = g.lastMessageAt?.toMillis?.()||0;
        const oldT = prev.get(g.id) || 0;
        if (newT > oldT && oldT > 0 && g.lastMessageBy && g.lastMessageBy !== this.currentUser.uid) {
          this.notifyNewMessage(g, { id: 'g_'+g.id+'_'+newT, senderUid: g.lastMessageBy, senderName: g.lastMessageByName || '', text: g.lastMessage });
        }
      });
      this.renderGroupList();
      this.updateBadge();
    }, (err) => {
      console.warn('[GroupChat] groups listener error:', err.message);
      const el = document.getElementById('gc-grouplist');
      if (el) el.innerHTML = '<div class="gc-empty">Could not load groups: ' + this.escape(err.message) + '</div>';
    });
  },

  renderGroupList() {
    const el = document.getElementById('gc-grouplist');
    if (!el) return;
    if (!this.groups.length) {
      el.innerHTML = '<div class="gc-empty"><i class="fas fa-comments" style="font-size:32px;color:#444;display:block;margin-bottom:10px"></i>No group chats yet.<br/><span style="font-size:11px">Owner can create groups via Connect Hub.</span></div>';
      return;
    }
    el.innerHTML = this.groups.map(g => {
      const initials = (g.name || 'G').split(/\s+/).map(s => s[0]).join('').slice(0, 2).toUpperCase();
      const lastMsg = g.lastMessage ? g.lastMessage.slice(0, 60) : 'No messages yet';
      const dismissed = g.dismissedAt ? '<span style="color:#ef4444;font-size:9px">[Closed]</span> ' : '';
      const time = g.lastMessageAt?.toDate?.()?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) || '';
      const onlineCount = (g.memberUids||[]).filter(uid => this.isOnline(uid)).length;
      const onlineDot = onlineCount > 0 ? '<span class="gc-presence" title="' + onlineCount + ' online"></span>' : '';
      const lastSeen = this.lastSeenByGroup[g.id] || 0;
      const lastMsgT = g.lastMessageAt?.toMillis?.() || 0;
      const unread = (lastMsgT > lastSeen && g.lastMessageBy !== this.currentUser.uid) ? '<span class="gc-unread">●</span>' : '';
      return `<div class="gc-group-row" onclick="GroupChat.openThread('${g.id}')">
        <div class="gc-avatar">${initials}${onlineDot}</div>
        <div class="gc-info">
          <div class="gc-name">${dismissed}${this.escape(g.name || 'Group')} ${unread}</div>
          <div class="gc-sub">${this.escape(lastMsg)} · <span style="color:#22c55e">${onlineCount} online</span></div>
        </div>
        <div style="font-size:10px;color:#888">${time}</div>
      </div>`;
    }).join('');
  },

  updateBadge() {
    const now = Date.now();
    const recent = this.groups.filter(g => {
      const t = g.lastMessageAt?.toMillis?.() || 0;
      const lastSeen = this.lastSeenByGroup[g.id] || 0;
      return t > 0 && t > lastSeen && g.lastMessageBy !== this.currentUser?.uid;
    }).length;
    const badge = document.getElementById('gc-fab-badge');
    if (!badge) return;
    if (recent > 0) { badge.style.display = 'flex'; badge.textContent = recent; }
    else badge.style.display = 'none';
  },

  // ---------------------- THREAD ----------------------
  async openThread(groupId) {
    this.currentGroupId = groupId;
    const g = this.groups.find(x => x.id === groupId);
    if (!g) return;
    document.getElementById('gc-list-view').style.display = 'none';
    document.getElementById('gc-thread-view').style.display = 'flex';
    document.getElementById('gc-thread-title').textContent = g.name || 'Group';
    const onlineCount = (g.memberUids||[]).filter(uid => this.isOnline(uid)).length;
    document.getElementById('gc-thread-sub').textContent =
      `${(g.memberUids || []).length} members · ${onlineCount} online · ${(g.states || []).join(', ') || 'All India'}`;

    // Meeting bar
    const meetBar = document.getElementById('gc-meeting-bar');
    if (g.meetingLink) {
      meetBar.innerHTML = `<div class="gc-meeting-bar"><i class="fas fa-video"></i>
        <span style="flex:1">Meeting available</span>
        <a href="${this.escape(g.meetingLink)}" target="_blank" rel="noopener"><i class="fas fa-sign-in-alt"></i> Join Meeting</a>
      </div>`;
    } else { meetBar.innerHTML = ''; }

    // Toolbar (owner gets extras)
    const isOwner = this.isOwner();
    const tb = document.getElementById('gc-toolbar');
    tb.innerHTML = `
      <span class="gc-online-count"><i class="fas fa-circle" style="font-size:8px"></i> ${onlineCount} online</span>
      ${isOwner ? `
        <button onclick="GroupChat.setMeetingLinkPrompt('${groupId}')"><i class="fas fa-video"></i> Set Meeting</button>
        <button onclick="GroupChat.sendReportPrompt('${groupId}')"><i class="fas fa-file-pdf"></i> Send Report</button>
      ` : ''}
      <button onclick="GroupChat.showMembers('${groupId}')"><i class="fas fa-users"></i> Members</button>
    `;

    const dismissedBar = document.getElementById('gc-thread-status');
    if (g.dismissedAt) {
      dismissedBar.innerHTML = '<div class="gc-dismissed"><i class="fas fa-archive"></i> This group has been closed by the Owner.</div>';
      document.getElementById('gc-input-bar').style.display = 'none';
    } else {
      dismissedBar.innerHTML = '';
      document.getElementById('gc-input-bar').style.display = 'flex';
    }
    this.subscribeMessages(groupId);

    // Mark seen
    this.lastSeenByGroup[groupId] = Date.now();
    try { localStorage.setItem('hc_gc_lastSeen', JSON.stringify(this.lastSeenByGroup)); } catch(_){}
    this.updateBadge();
  },

  closeThread() {
    this.currentGroupId = null;
    if (this.unsubMessages) { this.unsubMessages(); this.unsubMessages = null; }
    document.getElementById('gc-thread-view').style.display = 'none';
    document.getElementById('gc-list-view').style.display = '';
  },

  subscribeMessages(groupId) {
    if (this.unsubMessages) this.unsubMessages();
    const msgsRef = collection(db, 'connectGroups', groupId, 'messages');
    const q = query(msgsRef, orderBy('at', 'asc'), limit(200));
    this.unsubMessages = onSnapshot(q, (snap) => {
      const box = document.getElementById('gc-messages');
      if (!box) return;
      const msgs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      if (!msgs.length) {
        box.innerHTML = '<div class="gc-system">No messages yet — say hi 👋</div>';
        return;
      }
      const memberCount = (this.groups.find(g => g.id === groupId)?.memberUids || []).length;
      box.innerHTML = msgs.map(m => {
        if (m.system) return `<div class="gc-system">${this.escape(m.text || '')}</div>`;
        const isMe = m.senderUid === this.currentUser?.uid;
        const time = m.at?.toDate?.()?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) || '';
        const readCount = (m.readBy || []).length;
        const tickColour = readCount >= memberCount ? '#3b82f6' : '#888';
        const tick = isMe ? `<span class="gc-tick" style="color:${tickColour}">✓✓ ${readCount}</span>` : '';
        const imgHtml = m.imageUrl ? `<img src="${this.escape(m.imageUrl)}" alt="image" onclick="window.open('${this.escape(m.imageUrl)}','_blank')"/>` : '';
        const textHtml = m.text ? `<div>${this.escape(m.text)}</div>` : '';
        return `<div class="gc-msg ${isMe ? 'me' : 'them'}" onclick="GroupChat.showReadBy('${groupId}','${m.id}')" title="Click to see who read">
          ${isMe ? '' : `<div class="gc-sender">${this.escape(m.senderName || 'Unknown')}${m.senderRole ? ' · ' + this.escape(m.senderRole) : ''}</div>`}
          ${textHtml}${imgHtml}
          <div class="gc-time"><span>${time}</span>${tick}</div>
        </div>`;
      }).join('');
      box.scrollTop = box.scrollHeight;
      // Mark unread messages as read by me (best-effort, batched)
      this.markRead(groupId, msgs);
    }, (err) => {
      console.warn('[GroupChat] messages listener error:', err.message);
    });
  },

  async markRead(groupId, msgs) {
    const myUid = this.currentUser.uid;
    const toMark = msgs.filter(m => !m.system && m.senderUid !== myUid && !(m.readBy || []).includes(myUid));
    for (const m of toMark.slice(0, 30)) {
      try {
        await updateDoc(doc(db, 'connectGroups', groupId, 'messages', m.id), { readBy: arrayUnion(myUid) });
      } catch(_){}
    }
  },

  async showReadBy(groupId, msgId) {
    try {
      const s = await getDoc(doc(db, 'connectGroups', groupId, 'messages', msgId));
      if (!s.exists()) return;
      const readBy = s.data().readBy || [];
      const g = this.groups.find(x => x.id === groupId);
      const memberUids = g?.memberUids || [];
      // resolve names
      const userDocs = await Promise.all(memberUids.map(uid => getDoc(doc(db, 'users', uid)).catch(() => null)));
      const nameByUid = {};
      userDocs.forEach((d, i) => { if (d?.exists?.()) nameByUid[memberUids[i]] = d.data().displayName || d.data().email; else nameByUid[memberUids[i]] = memberUids[i].slice(0,8); });
      const overlay = document.createElement('div');
      overlay.className = 'gc-readby-modal';
      overlay.innerHTML = `<div class="gc-modal-card">
        <h3><span><i class="fas fa-eye"></i> Read by ${readBy.length}/${memberUids.length}</span><button onclick="this.closest('.gc-readby-modal').remove()">&times;</button></h3>
        <div class="gc-modal-body">
          ${memberUids.map(uid => {
            const seen = readBy.includes(uid);
            const name = nameByUid[uid] || uid;
            const initial = (name || '?')[0].toUpperCase();
            return `<div class="gc-readby-row">
              <div class="gc-mini-avatar">${initial}</div>
              <div style="flex:1;color:#fff;font-size:13px">${this.escape(name)}</div>
              <div style="font-size:11px;color:${seen?'#22c55e':'#888'}">${seen ? '✓ Seen' : 'Not yet'}</div>
            </div>`;
          }).join('')}
        </div>
      </div>`;
      overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };
      document.body.appendChild(overlay);
    } catch(e) { console.warn('readBy error', e); }
  },

  // Get the friendly title for a member of a group
  // Owner of the group ⇒ "👑 CEO / Employer". Others use their adminRole / role.
  memberTitle(g, uid, userData) {
    if (uid === g.ownerUid) return '👑 CEO / Employer';
    if ((userData?.email || '').toLowerCase() === OWNER_EMAIL) return '👑 CEO / Employer';
    return userData?.adminRole || userData?.role || 'Member';
  },

  async loadChatAdmins(groupId) {
    try {
      const s = await getDoc(doc(db, 'chatGroupAdmins', groupId));
      return s.exists() ? (s.data().admins || []) : [];
    } catch(_) { return []; }
  },

  async showMembers(groupId) {
    const g = this.groups.find(x => x.id === groupId); if (!g) return;
    const memberUids = g.memberUids || [];
    const userDocs = await Promise.all(memberUids.map(uid => getDoc(doc(db, 'users', uid)).catch(() => null)));
    const chatAdmins = await this.loadChatAdmins(groupId);
    const isOwner = this.isOwner();
    const overlay = document.createElement('div');
    overlay.className = 'gc-readby-modal';
    overlay.innerHTML = `<div class="gc-modal-card" style="max-width:520px">
      <h3><span><i class="fas fa-users"></i> ${memberUids.length} Members</span><button onclick="this.closest('.gc-readby-modal').remove()">&times;</button></h3>
      <div class="gc-modal-body">
        ${isOwner ? `<div style="display:flex;gap:8px;margin-bottom:12px">
          <button class="btn btn-sm" style="background:#22c55e;color:#fff;flex:1" onclick="GroupChat.openManageMembers('${groupId}')"><i class="fas fa-user-plus"></i> Add / Remove Members</button>
        </div>` : ''}
        ${userDocs.map((d, i) => {
          const uid = memberUids[i];
          const x = d?.exists?.() ? d.data() : { displayName: uid.slice(0,8) };
          const online = this.isOnline(uid);
          const initial = (x.displayName || x.email || '?')[0].toUpperCase();
          const title = this.memberTitle(g, uid, x);
          const isChatAdmin = chatAdmins.includes(uid);
          const isGroupOwner = uid === g.ownerUid;
          const adminBadge = isChatAdmin && !isGroupOwner ? '<span style="background:rgba(245,158,11,0.18);color:#f59e0b;font-size:9px;padding:2px 6px;border-radius:6px;margin-left:6px">⭐ Chat Admin</span>' : '';
          const adminBtn = isOwner && !isGroupOwner
            ? `<button class="btn btn-sm" style="background:${isChatAdmin?'#ef4444':'rgba(245,158,11,0.18)'};color:${isChatAdmin?'#fff':'#f59e0b'};font-size:10px" onclick="GroupChat.toggleChatAdmin('${groupId}','${uid}',${!isChatAdmin})">${isChatAdmin ? 'Remove Admin' : 'Make Admin'}</button>`
            : '';
          return `<div class="gc-readby-row">
            <div class="gc-mini-avatar" style="position:relative">${initial}${online?'<span style="position:absolute;bottom:-2px;right:-2px;width:9px;height:9px;background:#22c55e;border-radius:50%;border:2px solid #13131f"></span>':''}</div>
            <div style="flex:1;color:#fff;font-size:13px">${this.escape(x.displayName || x.email || uid)}${adminBadge}<div style="font-size:10px;color:#d4af37">${this.escape(title)}</div></div>
            ${adminBtn || `<div style="font-size:10px;color:${online?'#22c55e':'#666'}">${online ? '● Online' : 'Offline'}</div>`}
          </div>`;
        }).join('')}
      </div>
    </div>`;
    overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };
    document.body.appendChild(overlay);
  },

  async toggleChatAdmin(groupId, uid, makeAdmin) {
    if (!this.isOwner()) return;
    try {
      const s = await getDoc(doc(db, 'chatGroupAdmins', groupId));
      let admins = s.exists() ? (s.data().admins || []) : [];
      if (makeAdmin) { if (!admins.includes(uid)) admins.push(uid); }
      else { admins = admins.filter(x => x !== uid); }
      await setDoc(doc(db, 'chatGroupAdmins', groupId), { admins, updatedAt: serverTimestamp() }, { merge: true });
      // Refresh the member list
      document.querySelector('.gc-readby-modal')?.remove();
      this.showMembers(groupId);
    } catch(e) { alert('Could not update chat admin: ' + e.message); }
  },

  // ----- Manage members modal (owner only): location/category filter to add/remove -----
  async openManageMembers(groupId) {
    if (!this.isOwner()) return;
    const g = this.groups.find(x => x.id === groupId); if (!g) return;
    document.querySelector('.gc-readby-modal')?.remove();
    const all = await getDocs(collection(db, 'users'));
    const users = all.docs.map(d => ({ uid: d.id, ...d.data() }));
    const states = Array.from(new Set(users.flatMap(u => Array.isArray(u.locations) ? u.locations : (u.state ? [u.state] : [])).filter(Boolean))).sort();
    const cats = Array.from(new Set(users.map(u => u.adminRole || u.role || 'User').filter(Boolean))).sort();

    const overlay = document.createElement('div');
    overlay.className = 'gc-readby-modal';
    overlay.innerHTML = `<div class="gc-modal-card" style="max-width:560px;max-height:88vh;overflow:hidden;display:flex;flex-direction:column">
      <h3><span><i class="fas fa-user-plus"></i> Manage "${this.escape(g.name||'Group')}" Members</span><button onclick="this.closest('.gc-readby-modal').remove()">&times;</button></h3>
      <div style="padding:12px 16px;border-bottom:1px solid rgba(255,255,255,0.08);display:flex;gap:8px;flex-wrap:wrap">
        <select id="gc-mm-state" style="flex:1;min-width:140px;background:#1a1a2e;color:#fff;border:1px solid rgba(255,255,255,0.15);padding:7px;border-radius:6px;font-size:12px">
          <option value="">All locations</option>${states.map(s=>`<option value="${this.escape(s)}">${this.escape(s)}</option>`).join('')}
        </select>
        <select id="gc-mm-cat" style="flex:1;min-width:140px;background:#1a1a2e;color:#fff;border:1px solid rgba(255,255,255,0.15);padding:7px;border-radius:6px;font-size:12px">
          <option value="">All categories</option>${cats.map(c=>`<option value="${this.escape(c)}">${this.escape(c)}</option>`).join('')}
        </select>
        <input id="gc-mm-search" placeholder="Search name / email…" style="flex:2;min-width:160px;background:#1a1a2e;color:#fff;border:1px solid rgba(255,255,255,0.15);padding:7px;border-radius:6px;font-size:12px"/>
      </div>
      <div id="gc-mm-list" class="gc-modal-body" style="flex:1;overflow-y:auto"></div>
      <div style="padding:12px 16px;border-top:1px solid rgba(255,255,255,0.08);display:flex;gap:10px;justify-content:flex-end">
        <button class="btn btn-sm" style="background:rgba(255,255,255,0.1);color:#fff" onclick="this.closest('.gc-readby-modal').remove()">Cancel</button>
        <button class="btn btn-sm" style="background:linear-gradient(135deg,#22c55e,#16a34a);color:#fff" onclick="GroupChat.saveMemberChanges('${groupId}')"><i class="fas fa-save"></i> Save Changes</button>
      </div>
    </div>`;
    document.body.appendChild(overlay);

    // store state
    this._mmUsers = users;
    this._mmGroupId = groupId;
    this._mmSelected = new Set(g.memberUids || []);

    const render = () => {
      const fs = document.getElementById('gc-mm-state').value;
      const fc = document.getElementById('gc-mm-cat').value;
      const fq = document.getElementById('gc-mm-search').value.trim().toLowerCase();
      const list = users.filter(u => {
        if (fs) {
          const ulocs = Array.isArray(u.locations) ? u.locations : (u.state ? [u.state] : []);
          if (!ulocs.includes(fs)) return false;
        }
        if (fc && (u.adminRole || u.role || 'User') !== fc) return false;
        if (fq) { const t = ((u.displayName||'')+' '+(u.email||'')).toLowerCase(); if (!t.includes(fq)) return false; }
        return true;
      });
      document.getElementById('gc-mm-list').innerHTML = list.length ? list.map(u => {
        const sel = this._mmSelected.has(u.uid);
        const isGroupOwner = u.uid === g.ownerUid;
        return `<div class="gc-readby-row" style="cursor:${isGroupOwner?'not-allowed':'pointer'};opacity:${isGroupOwner?0.6:1}" onclick="${isGroupOwner?'':`GroupChat.toggleMmSelect('${u.uid}', this)`}">
          <div class="gc-mini-avatar">${(u.displayName||u.email||'?')[0].toUpperCase()}</div>
          <div style="flex:1;color:#fff;font-size:13px">${this.escape(u.displayName||u.email||u.uid)}<div style="font-size:10px;color:#888">${this.escape(u.email||'')} · ${this.escape(u.adminRole||u.role||'User')}</div></div>
          <div style="font-size:18px;color:${sel?'#22c55e':'#444'}">${isGroupOwner ? '👑' : (sel ? '✓' : '○')}</div>
        </div>`;
      }).join('') : '<div class="gc-empty">No users match these filters.</div>';
    };
    document.getElementById('gc-mm-state').onchange = render;
    document.getElementById('gc-mm-cat').onchange = render;
    document.getElementById('gc-mm-search').oninput = render;
    render();
  },

  toggleMmSelect(uid, rowEl) {
    if (this._mmSelected.has(uid)) this._mmSelected.delete(uid);
    else this._mmSelected.add(uid);
    const sel = this._mmSelected.has(uid);
    const tick = rowEl.querySelector('div:last-child');
    if (tick) { tick.textContent = sel ? '✓' : '○'; tick.style.color = sel ? '#22c55e' : '#444'; }
  },

  async saveMemberChanges(groupId) {
    if (!this.isOwner()) return;
    try {
      const newMembers = Array.from(this._mmSelected);
      // ensure owner stays
      const g = this.groups.find(x => x.id === groupId);
      if (g && !newMembers.includes(g.ownerUid)) newMembers.push(g.ownerUid);
      await updateDoc(doc(db, 'connectGroups', groupId), { memberUids: newMembers });
      await addDoc(collection(db, 'connectGroups', groupId, 'messages'), {
        system: true,
        text: `Member list updated — group now has ${newMembers.length} members.`,
        at: serverTimestamp()
      });
      document.querySelector('.gc-readby-modal')?.remove();
      alert('Members updated.');
    } catch(e) { alert('Failed: ' + e.message); }
  },

  // ---------------------- FILE / SCREENSHOT UPLOAD ----------------------
  pickFile() { document.getElementById('gc-file-input').click(); },

  async onFilePicked(ev) {
    const file = ev.target.files?.[0]; if (!file) return;
    await this.uploadAndSend(file);
    ev.target.value = '';
  },

  async onPaste(ev) {
    const items = ev.clipboardData?.items || [];
    for (const it of items) {
      if (it.type && it.type.startsWith('image/')) {
        const f = it.getAsFile();
        if (f) { ev.preventDefault(); await this.uploadAndSend(f); return; }
      }
    }
  },

  // Instant / optimistic upload: show the picture in the thread INSTANTLY using a local
  // preview, then upload in background and quietly swap to the cloud URL.
  async uploadAndSend(file) {
    if (!this.currentGroupId || !this.currentUser) return;
    const u = this.currentUser;
    const myData = this.currentUserData || {};
    const groupId = this.currentGroupId;

    // 1. Generate local preview (data URL) and show it instantly as a temporary message
    const localUrl = URL.createObjectURL(file);
    const tempId = 'gc-tmp-' + Date.now() + '-' + Math.random().toString(36).slice(2,6);
    const box = document.getElementById('gc-messages');
    if (box) {
      const tempHtml = `<div class="gc-msg me" id="${tempId}">
        <img src="${localUrl}" alt="uploading" style="max-width:240px;border-radius:10px;opacity:0.65"/>
        <div class="gc-time"><span><i class="fas fa-spinner fa-spin"></i> uploading…</span></div>
      </div>`;
      box.insertAdjacentHTML('beforeend', tempHtml);
      box.scrollTop = box.scrollHeight;
    }

    // 2. Upload in background — do NOT block sending UI
    (async () => {
      try {
        const path = `chatUploads/${groupId}/${Date.now()}_${Math.random().toString(36).slice(2,8)}_${file.name||'image.png'}`;
        const r = sRef(storage, path);
        await uploadBytes(r, file);
        const url = await getDownloadURL(r);
        await addDoc(collection(db, 'connectGroups', groupId, 'messages'), {
          senderUid: u.uid,
          senderName: myData.displayName || u.displayName || u.email,
          senderRole: myData.adminRole || myData.role || 'User',
          text: '',
          imageUrl: url,
          readBy: [u.uid],
          at: serverTimestamp()
        });
        await updateDoc(doc(db, 'connectGroups', groupId), {
          lastMessage: '[image]',
          lastMessageAt: serverTimestamp(),
          lastMessageBy: u.uid,
          lastMessageByName: myData.displayName || u.email
        });
        // Real message will arrive via onSnapshot and re-render — wipe the placeholder
        document.getElementById(tempId)?.remove();
        try { URL.revokeObjectURL(localUrl); } catch(_){}
      } catch(e) {
        const t = document.getElementById(tempId);
        if (t) t.innerHTML = `<div style="color:#ef4444;font-size:11px;padding:6px">❌ Upload failed: ${this.escape(e.message)} — tap to retry</div>`;
        if (t) t.onclick = () => { t.remove(); this.uploadAndSend(file); };
        console.warn('image upload failed:', e);
      }
    })();
  },

  // ---------------------- SEND TEXT MESSAGE ----------------------
  async sendMessage() {
    const input = document.getElementById('gc-msg-input');
    const text = (input?.value || '').trim();
    if (!text || !this.currentGroupId || !this.currentUser) return;
    const btn = document.getElementById('gc-send-btn');
    if (btn) btn.disabled = true;
    try {
      const u = this.currentUser;
      const myData = this.currentUserData || (await getDoc(doc(db,'users',u.uid))).data() || {};
      await addDoc(collection(db, 'connectGroups', this.currentGroupId, 'messages'), {
        senderUid: u.uid,
        senderName: myData.displayName || u.displayName || u.email || 'User',
        senderRole: myData.adminRole || myData.role || 'User',
        text: text.slice(0, 500),
        readBy: [u.uid],
        at: serverTimestamp()
      });
      await updateDoc(doc(db, 'connectGroups', this.currentGroupId), {
        lastMessage: text.slice(0, 100),
        lastMessageAt: serverTimestamp(),
        lastMessageBy: u.uid,
        lastMessageByName: myData.displayName || u.email
      });
      input.value = '';
    } catch (e) {
      console.error('Send message failed:', e);
      alert('Could not send: ' + e.message);
    } finally {
      if (btn) btn.disabled = false;
    }
  },

  // ---------------------- OWNER: MEETING LINK ----------------------
  async setMeetingLinkPrompt(groupId) {
    const cur = this.groups.find(g => g.id === groupId)?.meetingLink || '';
    const val = prompt('Enter meeting link (Zoom / Google Meet / Teams) — leave blank to clear:', cur);
    if (val === null) return;
    try {
      await updateDoc(doc(db, 'connectGroups', groupId), { meetingLink: val.trim() });
      // Notify thread
      await addDoc(collection(db, 'connectGroups', groupId, 'messages'), {
        system: true, text: val.trim() ? `Meeting link set by Owner — Join from the bar above.` : 'Meeting link cleared by Owner.',
        at: serverTimestamp()
      });
      alert('Meeting link updated.');
      this.openThread(groupId);
    } catch(e) { alert('Failed: '+e.message); }
  },

  // ---------------------- OWNER: REPORT GENERATION ----------------------
  async sendReportPrompt(groupId) {
    const choice = prompt('Generate report for which period?\n\nType: daily, monthly, or yearly', 'daily');
    if (!choice) return;
    const period = choice.trim().toLowerCase();
    if (!['daily','monthly','yearly'].includes(period)) { alert('Invalid period.'); return; }
    await this.generateReports(groupId, period);
  },

  async generateReports(groupId, period) {
    try {
      // Determine window
      const now = new Date();
      let since;
      if (period === 'daily') since = new Date(now.getTime() - 24*60*60*1000);
      else if (period === 'monthly') since = new Date(now.getFullYear(), now.getMonth(), 1);
      else since = new Date(now.getFullYear(), 0, 1);

      const g = this.groups.find(x => x.id === groupId);
      if (!g) { alert('Group not found.'); return; }

      // Pull messages
      const ms = await getDocs(query(collection(db, 'connectGroups', groupId, 'messages'), orderBy('at','asc'), limit(2000)));
      const allMsgs = ms.docs.map(d => ({ id: d.id, ...d.data() }))
        .filter(m => !m.system && (m.at?.toMillis?.()||0) >= since.getTime());

      // Per-member aggregation
      const memberUids = g.memberUids || [];
      const userDocs = await Promise.all(memberUids.map(uid => getDoc(doc(db, 'users', uid)).catch(() => null)));
      const nameByUid = {}; const roleByUid = {};
      userDocs.forEach((d,i) => { const x = d?.exists?.() ? d.data() : {}; nameByUid[memberUids[i]] = x.displayName || x.email || memberUids[i].slice(0,8); roleByUid[memberUids[i]] = x.adminRole || x.role || 'Member'; });

      const perUser = memberUids.map(uid => {
        const sent = allMsgs.filter(m => m.senderUid === uid).length;
        const seen = allMsgs.filter(m => (m.readBy||[]).includes(uid)).length;
        return { uid, name: nameByUid[uid], role: roleByUid[uid], sent, seen };
      });

      // Build PDF (jsPDF lazy load)
      if (!window.jspdf) {
        await new Promise((res, rej) => { const s = document.createElement('script'); s.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'; s.onload = res; s.onerror = rej; document.head.appendChild(s); });
      }
      const { jsPDF } = window.jspdf;
      const docPdf = new jsPDF();
      docPdf.setFontSize(16); docPdf.text(`Connect Hub — ${period.toUpperCase()} Report`, 14, 18);
      docPdf.setFontSize(10); docPdf.text(`Group: ${g.name||''}`, 14, 26);
      docPdf.text(`Period: ${since.toLocaleString()} → ${now.toLocaleString()}`, 14, 32);
      docPdf.text(`Total messages: ${allMsgs.length}  ·  Members: ${memberUids.length}`, 14, 38);
      let y = 50;
      docPdf.setFontSize(11); docPdf.text('Per-Member Activity', 14, y); y += 6;
      docPdf.setFontSize(9);
      docPdf.text('Name', 14, y); docPdf.text('Role', 70, y); docPdf.text('Sent', 130, y); docPdf.text('Seen', 160, y); y += 4;
      docPdf.line(14, y, 196, y); y += 5;
      perUser.sort((a,b) => b.sent - a.sent).forEach(p => {
        if (y > 280) { docPdf.addPage(); y = 20; }
        docPdf.text(String(p.name).slice(0,32), 14, y);
        docPdf.text(String(p.role).slice(0,28), 70, y);
        docPdf.text(String(p.sent), 130, y);
        docPdf.text(String(p.seen), 160, y);
        y += 5;
      });

      const pdfBlob = docPdf.output('blob');
      // Upload PDF to storage
      const path = `chatReports/${groupId}/${period}_${Date.now()}.pdf`;
      const r = sRef(storage, path);
      await uploadBytes(r, pdfBlob);
      const url = await getDownloadURL(r);

      // Save record
      await addDoc(collection(db, 'chatReports'), {
        groupId, groupName: g.name||'', period,
        generatedBy: this.currentUser.uid, generatedByName: this.currentUserData?.displayName || this.currentUser.email,
        rangeFrom: since, rangeTo: now,
        totalMessages: allMsgs.length, memberCount: memberUids.length,
        perUser, pdfUrl: url, createdAt: serverTimestamp()
      });

      // System message in chat
      await addDoc(collection(db, 'connectGroups', groupId, 'messages'), {
        system: true,
        text: `📊 ${period.toUpperCase()} Report generated — ${allMsgs.length} msgs · ${memberUids.length} members. Saved in Reports.`,
        at: serverTimestamp()
      });

      // Trigger download
      const a = document.createElement('a'); a.href = url; a.target = '_blank'; a.click();
      alert(`Report generated and saved. Total ${allMsgs.length} messages analysed.`);
    } catch(e) { console.error('Report failed', e); alert('Report failed: ' + e.message); }
  },

  escape(s) { return String(s || '').replace(/[<>&"']/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&#39;' }[c])); },

  // ---------------------- OWNER-ONLY: GROUP MANAGEMENT ----------------------
  async createGroup({ name, states = [], roles = [], memberUids = [] }) {
    if (!this.currentUser) throw new Error('Not signed in');
    if (!name || !memberUids.length) throw new Error('Name and members required');
    const u = this.currentUser;
    const myDoc = await getDoc(doc(db, 'users', u.uid));
    const myData = myDoc.exists() ? myDoc.data() : {};
    const allMembers = Array.from(new Set([u.uid, ...memberUids]));
    const docRef = await addDoc(collection(db, 'connectGroups'), {
      name: name.slice(0, 80),
      ownerUid: u.uid,
      ownerName: myData.displayName || u.displayName || u.email,
      memberUids: allMembers,
      states: states,
      roles: roles,
      meetingLink: '',
      createdAt: serverTimestamp(),
      lastMessage: '',
      lastMessageAt: serverTimestamp(),
      lastMessageBy: u.uid,
      lastMessageByName: myData.displayName || u.email,
      dismissedAt: null
    });
    await addDoc(collection(db, 'connectGroups', docRef.id, 'messages'), {
      system: true,
      text: `Group "${name}" created by ${myData.displayName || u.email}. ${allMembers.length} members.`,
      at: serverTimestamp()
    });
    return docRef.id;
  },

  async dismissGroup(groupId) {
    await updateDoc(doc(db, 'connectGroups', groupId), { dismissedAt: serverTimestamp() });
    await addDoc(collection(db, 'connectGroups', groupId, 'messages'), {
      system: true,
      text: 'This group has been closed by the Owner.',
      at: serverTimestamp()
    });
  },

  async restoreGroup(groupId) {
    await updateDoc(doc(db, 'connectGroups', groupId), { dismissedAt: null });
  }
};

window.GroupChat = GroupChat;
export default GroupChat;
