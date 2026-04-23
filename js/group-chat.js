// ============================================================================
// js/group-chat.js — Connect Hub + Group Chat module (Phase 4)
// Shared between owner-feed.html and admin-feed.html
// ============================================================================
import {
  collection, doc, addDoc, getDoc, getDocs, setDoc, updateDoc, deleteDoc,
  query, where, onSnapshot, orderBy, limit, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { auth, db } from "./firebase-config.js";

const GroupChat = {
  currentUser: null,
  currentGroupId: null,
  unsubGroups: null,
  unsubMessages: null,
  groups: [],

  init({ user }) {
    this.currentUser = user;
    this.injectStyles();
    this.injectPanel();
    this.subscribeMyGroups();
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
      .gc-panel { position:fixed; right:20px; bottom:90px; width:380px; max-width:calc(100vw - 32px);
        height:560px; max-height:calc(100vh - 120px); background:#13131f; border:1px solid rgba(212,175,55,0.3);
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
        display:flex; align-items:center; justify-content:center; font-size:18px; flex-shrink:0; }
      .gc-group-row .gc-info { flex:1; min-width:0; }
      .gc-group-row .gc-name { color:#fff; font-weight:600; font-size:13px; white-space:nowrap;
        overflow:hidden; text-overflow:ellipsis; }
      .gc-group-row .gc-sub { color:#888; font-size:11px; margin-top:2px; }
      .gc-group-row .gc-unread { background:#ef4444; color:#fff; font-size:10px; padding:2px 7px;
        border-radius:10px; font-weight:700; }
      .gc-empty { padding:40px 20px; text-align:center; color:#888; font-size:13px; }
      .gc-thread-head { padding:10px 14px; background:#1a1a2e; border-bottom:1px solid rgba(212,175,55,0.2);
        display:flex; align-items:center; gap:10px; }
      .gc-thread-head .gc-back { background:transparent; border:none; color:#d4af37; cursor:pointer;
        font-size:16px; padding:6px 10px; }
      .gc-thread-head .gc-thread-title { flex:1; color:#fff; font-weight:700; font-size:14px; }
      .gc-thread-head .gc-thread-sub { color:#d4af37; font-size:10px; }
      .gc-messages { flex:1; overflow-y:auto; padding:14px; display:flex; flex-direction:column; gap:8px;
        background:linear-gradient(180deg, #0a0a14 0%, #13131f 100%); }
      .gc-msg { max-width:78%; padding:8px 12px; border-radius:14px; font-size:13px; line-height:1.4;
        word-wrap:break-word; position:relative; }
      .gc-msg.me { align-self:flex-end; background:linear-gradient(135deg,#d4af37,#b8941f); color:#0a0a14;
        border-bottom-right-radius:4px; }
      .gc-msg.them { align-self:flex-start; background:rgba(255,255,255,0.08); color:#fff;
        border:1px solid rgba(255,255,255,0.06); border-bottom-left-radius:4px; }
      .gc-msg .gc-sender { font-size:10px; font-weight:700; color:#d4af37; margin-bottom:3px; }
      .gc-msg.me .gc-sender { color:rgba(0,0,0,0.65); }
      .gc-msg .gc-time { font-size:9px; opacity:0.65; margin-top:3px; text-align:right; }
      .gc-input-bar { padding:10px; border-top:1px solid rgba(212,175,55,0.2); background:#1a1a2e;
        display:flex; gap:8px; align-items:center; }
      .gc-input-bar input { flex:1; padding:10px 14px; border-radius:22px; border:1px solid rgba(212,175,55,0.25);
        background:rgba(0,0,0,0.3); color:#fff; font-size:13px; outline:none; }
      .gc-input-bar input:focus { border-color:#d4af37; }
      .gc-input-bar button { width:40px; height:40px; border-radius:50%;
        background:linear-gradient(135deg,#d4af37,#b8941f); color:#0a0a14; border:none; cursor:pointer;
        font-size:16px; display:flex; align-items:center; justify-content:center; }
      .gc-input-bar button:disabled { opacity:0.4; cursor:not-allowed; }
      .gc-system { align-self:center; font-size:11px; color:#888; padding:4px 10px;
        background:rgba(255,255,255,0.04); border-radius:10px; }
      .gc-dismissed { padding:8px 14px; background:rgba(239,68,68,0.1); color:#ef4444; font-size:11px;
        text-align:center; border-bottom:1px solid rgba(239,68,68,0.2); }
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
        <div id="gc-thread-status"></div>
        <div class="gc-messages" id="gc-messages"></div>
        <div class="gc-input-bar" id="gc-input-bar">
          <input type="text" id="gc-msg-input" placeholder="Type a message…" maxlength="500"
            onkeypress="if(event.key==='Enter')GroupChat.sendMessage()"/>
          <button onclick="GroupChat.sendMessage()" id="gc-send-btn"><i class="fas fa-paper-plane"></i></button>
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

  // ---------------------- SUBSCRIBE TO MY GROUPS ----------------------
  subscribeMyGroups() {
    if (!this.currentUser) return;
    if (this.unsubGroups) this.unsubGroups();
    const q = query(collection(db, 'connectGroups'), where('memberUids', 'array-contains', this.currentUser.uid));
    this.unsubGroups = onSnapshot(q, (snap) => {
      this.groups = snap.docs.map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => (b.lastMessageAt?.toMillis?.() || b.createdAt?.toMillis?.() || 0) -
                        (a.lastMessageAt?.toMillis?.() || a.createdAt?.toMillis?.() || 0));
      this.renderGroupList();
      this.updateBadge();
    }, (err) => {
      console.warn('[GroupChat] groups listener error:', err.message);
      const el = document.getElementById('gc-grouplist');
      if (el) el.innerHTML = '<div class="gc-empty">Could not load groups.</div>';
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
      return `<div class="gc-group-row" onclick="GroupChat.openThread('${g.id}')">
        <div class="gc-avatar">${initials}</div>
        <div class="gc-info">
          <div class="gc-name">${dismissed}${this.escape(g.name || 'Group')}</div>
          <div class="gc-sub">${this.escape(lastMsg)}</div>
        </div>
        <div style="font-size:10px;color:#888">${time}</div>
      </div>`;
    }).join('');
  },

  updateBadge() {
    // Count of groups with new activity in last 5 min as a simple heuristic
    const now = Date.now();
    const recent = this.groups.filter(g => {
      const t = g.lastMessageAt?.toMillis?.() || 0;
      return t > 0 && (now - t) < 5 * 60 * 1000 && g.lastMessageBy !== this.currentUser?.uid;
    }).length;
    const badge = document.getElementById('gc-fab-badge');
    if (!badge) return;
    if (recent > 0) { badge.style.display = 'flex'; badge.textContent = recent; }
    else badge.style.display = 'none';
  },

  // ---------------------- THREAD ----------------------
  openThread(groupId) {
    this.currentGroupId = groupId;
    const g = this.groups.find(x => x.id === groupId);
    if (!g) return;
    document.getElementById('gc-list-view').style.display = 'none';
    document.getElementById('gc-thread-view').style.display = 'flex';
    document.getElementById('gc-thread-title').textContent = g.name || 'Group';
    document.getElementById('gc-thread-sub').textContent =
      `${(g.memberUids || []).length} members · ${(g.states || []).join(', ') || 'All India'}`;
    const dismissedBar = document.getElementById('gc-thread-status');
    if (g.dismissedAt) {
      dismissedBar.innerHTML = '<div class="gc-dismissed"><i class="fas fa-archive"></i> This group has been closed by the Owner.</div>';
      document.getElementById('gc-input-bar').style.display = 'none';
    } else {
      dismissedBar.innerHTML = '';
      document.getElementById('gc-input-bar').style.display = 'flex';
    }
    this.subscribeMessages(groupId);
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
      box.innerHTML = msgs.map(m => {
        if (m.system) return `<div class="gc-system">${this.escape(m.text || '')}</div>`;
        const isMe = m.senderUid === this.currentUser?.uid;
        const time = m.at?.toDate?.()?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) || '';
        return `<div class="gc-msg ${isMe ? 'me' : 'them'}">
          ${isMe ? '' : `<div class="gc-sender">${this.escape(m.senderName || 'Unknown')}${m.senderRole ? ' · ' + this.escape(m.senderRole) : ''}</div>`}
          <div>${this.escape(m.text || '')}</div>
          <div class="gc-time">${time}</div>
        </div>`;
      }).join('');
      box.scrollTop = box.scrollHeight;
    }, (err) => {
      console.warn('[GroupChat] messages listener error:', err.message);
    });
  },

  async sendMessage() {
    const input = document.getElementById('gc-msg-input');
    const text = (input?.value || '').trim();
    if (!text || !this.currentGroupId || !this.currentUser) return;
    const btn = document.getElementById('gc-send-btn');
    if (btn) btn.disabled = true;
    try {
      const u = this.currentUser;
      const myDoc = await getDoc(doc(db, 'users', u.uid));
      const myData = myDoc.exists() ? myDoc.data() : {};
      await addDoc(collection(db, 'connectGroups', this.currentGroupId, 'messages'), {
        senderUid: u.uid,
        senderName: myData.displayName || u.displayName || u.email || 'User',
        senderRole: myData.adminRole || myData.role || 'User',
        text: text.slice(0, 500),
        at: serverTimestamp()
      });
      await updateDoc(doc(db, 'connectGroups', this.currentGroupId), {
        lastMessage: text.slice(0, 100),
        lastMessageAt: serverTimestamp(),
        lastMessageBy: u.uid
      });
      input.value = '';
    } catch (e) {
      console.error('Send message failed:', e);
      alert('Could not send: ' + e.message);
    } finally {
      if (btn) btn.disabled = false;
    }
  },

  escape(s) { return String(s || '').replace(/[<>&"']/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&#39;' }[c])); },

  // ---------------------- OWNER-ONLY: GROUP MANAGEMENT ----------------------
  async createGroup({ name, states = [], roles = [], memberUids = [] }) {
    if (!this.currentUser) throw new Error('Not signed in');
    if (!name || !memberUids.length) throw new Error('Name and members required');
    const u = this.currentUser;
    const myDoc = await getDoc(doc(db, 'users', u.uid));
    const myData = myDoc.exists() ? myDoc.data() : {};
    // Ensure creator is a member
    const allMembers = Array.from(new Set([u.uid, ...memberUids]));
    const docRef = await addDoc(collection(db, 'connectGroups'), {
      name: name.slice(0, 80),
      ownerUid: u.uid,
      ownerName: myData.displayName || u.displayName || u.email,
      memberUids: allMembers,
      states: states,
      roles: roles,
      createdAt: serverTimestamp(),
      lastMessage: '',
      lastMessageAt: serverTimestamp(),
      lastMessageBy: u.uid,
      dismissedAt: null
    });
    // Welcome system message
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
