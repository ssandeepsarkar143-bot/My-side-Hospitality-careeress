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
      .gc-fab { position:fixed; right:90px; bottom:24px; width:56px; height:56px; border-radius:50%;
        background:linear-gradient(135deg,#d4af37,#b8941f); color:#0a0a14; border:none; cursor:pointer;
        box-shadow:0 6px 20px rgba(212,175,55,0.45); z-index:9998; display:flex;
        align-items:center; justify-content:center; font-size:22px; transition:transform .2s; }
      .gc-fab:hover { transform:scale(1.08); }
      .gc-fab .gc-badge { position:absolute; top:-4px; right:-4px; background:#ef4444; color:#fff;
        font-size:10px; min-width:20px; height:20px; border-radius:10px; display:flex;
        align-items:center; justify-content:center; font-weight:700; padding:0 5px; }
      .gc-fab.dragging { transition:none; cursor:grabbing; }
      .gc-panel { position:fixed; right:20px; bottom:90px; width:400px; max-width:calc(100vw - 32px);
        height:600px; max-height:calc(100vh - 120px); background:#13131f; border:1px solid rgba(212,175,55,0.3);
        border-radius:16px; box-shadow:0 12px 40px rgba(0,0,0,0.6); z-index:9999;
        display:none; flex-direction:column; overflow:hidden; }
      .gc-panel.open { display:flex; animation: gc-slide .25s ease-out; }
      .gc-panel.dragging { transition:none; user-select:none; }
      @keyframes gc-slide { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
      .gc-head { padding:14px 16px; background:linear-gradient(135deg,#1a1a2e,#0f0f1a);
        border-bottom:1px solid rgba(212,175,55,0.25); display:flex; align-items:center; gap:10px; cursor:grab; }
      .gc-head.gc-grab { cursor:grabbing; }
      .gc-thread-head { cursor:grab; }
      .gc-thread-head.gc-grab { cursor:grabbing; }
      .gc-screenshot-preview { padding:10px 12px; background:rgba(212,175,55,0.08); border-top:1px solid rgba(212,175,55,0.25);
        border-bottom:1px solid rgba(212,175,55,0.15); display:flex; gap:10px; align-items:center; }
      .gc-screenshot-preview img { width:64px; height:64px; object-fit:cover; border-radius:8px; border:1px solid rgba(212,175,55,0.4); cursor:zoom-in; }
      .gc-screenshot-preview .gc-sp-info { flex:1; font-size:11px; color:#d4af37; min-width:0; }
      .gc-screenshot-preview .gc-sp-info b { color:#fff; display:block; font-size:12px; margin-bottom:2px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
      .gc-screenshot-preview .gc-sp-actions { display:flex; flex-direction:column; gap:5px; }
      .gc-screenshot-preview button.gc-edit-btn { background:rgba(212,175,55,0.18); color:#d4af37; border:1px solid rgba(212,175,55,0.45);
        padding:6px 10px; border-radius:6px; font-size:11px; cursor:pointer; white-space:nowrap; }
      .gc-screenshot-preview button.gc-edit-btn:hover { background:rgba(212,175,55,0.32); }
      .gc-screenshot-preview button { background:rgba(239,68,68,0.18); color:#ef4444; border:1px solid rgba(239,68,68,0.4);
        padding:6px 10px; border-radius:6px; font-size:11px; cursor:pointer; white-space:nowrap; }
      .gc-crop-modal { position:fixed; inset:0; background:rgba(0,0,0,0.85); z-index:10100; display:flex;
        align-items:center; justify-content:center; padding:16px; }
      .gc-crop-card { background:#13131f; border:1px solid rgba(212,175,55,0.35); border-radius:14px;
        max-width:760px; width:100%; max-height:92vh; display:flex; flex-direction:column; overflow:hidden; }
      .gc-crop-card h3 { margin:0; padding:12px 16px; color:#d4af37; font-size:14px; border-bottom:1px solid rgba(212,175,55,0.25);
        display:flex; justify-content:space-between; align-items:center; }
      .gc-crop-card h3 button { background:transparent; border:none; color:#fff; font-size:22px; cursor:pointer; padding:0 6px; line-height:1; }
      .gc-crop-tools { padding:8px 12px; background:#0f0f1a; border-bottom:1px solid rgba(212,175,55,0.15);
        display:flex; gap:6px; flex-wrap:wrap; align-items:center; }
      .gc-crop-tools button { background:rgba(212,175,55,0.12); border:1px solid rgba(212,175,55,0.3); color:#d4af37;
        padding:5px 10px; border-radius:6px; font-size:11px; cursor:pointer; }
      .gc-crop-tools button:hover { background:rgba(212,175,55,0.22); }
      .gc-crop-tools button.active { background:#d4af37; color:#0a0a14; }
      .gc-crop-stage { flex:1; min-height:240px; max-height:60vh; overflow:hidden; background:#000; position:relative; }
      .gc-crop-stage img { display:block; max-width:100%; max-height:60vh; }
      .gc-crop-actions { padding:10px 14px; display:flex; gap:8px; justify-content:flex-end; border-top:1px solid rgba(212,175,55,0.2); background:#0f0f1a; }
      .gc-crop-actions button.cancel { background:rgba(255,255,255,0.06); color:#fff; border:1px solid rgba(255,255,255,0.18);
        padding:8px 14px; border-radius:8px; cursor:pointer; font-size:12px; }
      .gc-crop-actions button.apply { background:linear-gradient(135deg,#d4af37,#b8941f); color:#0a0a14; border:none;
        padding:8px 16px; border-radius:8px; cursor:pointer; font-size:12px; font-weight:700; }
      .gc-head .gc-title { flex:1; font-weight:700; color:#d4af37; font-size:15px; }
      .gc-head .gc-min, .gc-thread-head .gc-min { font-size:24px; font-weight:700; line-height:1; padding:0 10px; color:rgba(255,255,255,0.8); }
      .gc-head .gc-close, .gc-thread-head .gc-close { font-size:16px; padding:4px 10px; color:rgba(255,255,255,0.8); border-radius:6px; }
      .gc-head .gc-min:hover, .gc-head .gc-close:hover, .gc-thread-head .gc-min:hover, .gc-thread-head .gc-close:hover { color:#fff; background:rgba(255,255,255,0.12); }
      .gc-fab.gc-pulse { animation:gcPulse 1.4s ease-out 3; }
      @keyframes gcPulse { 0%{box-shadow:0 0 0 0 rgba(212,175,55,0.7)} 70%{box-shadow:0 0 0 18px rgba(212,175,55,0)} 100%{box-shadow:0 0 0 0 rgba(212,175,55,0)} }
      /* Facebook-Messenger-style chat-head: a slightly bigger, rounder, jiggle-y bubble */
      .gc-fab.gc-chathead { width:60px; height:60px; box-shadow:0 6px 22px rgba(0,0,0,0.45),0 0 0 3px rgba(212,175,55,0.35); animation:gcBob 2.2s ease-in-out infinite; }
      .gc-fab.gc-chathead .gc-badge { width:22px; height:22px; line-height:22px; font-size:11px; }
      @keyframes gcBob { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-4px)} }
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
      .gc-mention { color:#3b82f6; font-weight:700; background:rgba(59,130,246,0.15); padding:1px 4px; border-radius:4px; }
      .gc-msg.me .gc-mention { color:#0a0a14; background:rgba(0,0,0,0.15); }
      .gc-msg.mention-me { border-left:3px solid #f59e0b; background:rgba(245,158,11,0.12); }
      .gc-mention-pop { position:absolute; bottom:60px; left:14px; right:14px; max-height:180px; overflow-y:auto;
        background:#1a1a2e; border:1px solid rgba(212,175,55,0.4); border-radius:10px; box-shadow:0 6px 20px rgba(0,0,0,0.5);
        z-index:10002; }
      .gc-mention-pop .gc-mention-row { padding:8px 12px; cursor:pointer; display:flex; align-items:center; gap:10px; font-size:13px; color:#fff; }
      .gc-mention-pop .gc-mention-row:hover, .gc-mention-pop .gc-mention-row.active { background:rgba(212,175,55,0.18); }
      .gc-mention-pop .gc-mention-row .gc-mini-avatar { width:26px; height:26px; font-size:11px; }
      .gc-reminder-card { background:rgba(245,158,11,0.1); border-left:3px solid #f59e0b; border-radius:8px; padding:10px 12px; margin:6px 0; font-size:12px; color:#fff; }
      .gc-reminder-card .gc-rmh { display:flex; justify-content:space-between; align-items:center; margin-bottom:4px; }
      .gc-reminder-card .gc-rmh b { color:#f59e0b; }
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
        <div class="gc-head" id="gc-list-head">
          <div class="gc-title"><i class="fas fa-users"></i> My Group Chats</div>
          <button class="gc-min" onclick="GroupChat.minimizePanel()" title="Minimize to chat-head">−</button>
          <button class="gc-close" onclick="GroupChat.closePanel()" title="Close chat">✕</button>
        </div>
        <div class="gc-body"><div class="gc-grouplist" id="gc-grouplist">
          <div class="gc-empty">Loading your groups…</div>
        </div></div>
      </div>
      <div id="gc-thread-view" style="display:none;flex-direction:column;height:100%">
        <div class="gc-thread-head" id="gc-thread-head">
          <button class="gc-back" onclick="GroupChat.closeThread()"><i class="fas fa-arrow-left"></i></button>
          <div style="flex:1;min-width:0">
            <div class="gc-thread-title" id="gc-thread-title">Group</div>
            <div class="gc-thread-sub" id="gc-thread-sub">—</div>
          </div>
          <button class="gc-min" onclick="GroupChat.minimizePanel()" title="Minimize to chat-head">−</button>
          <button class="gc-close" onclick="GroupChat.closePanel()" title="Close chat">✕</button>
        </div>
        <div id="gc-meeting-bar"></div>
        <div class="gc-toolbar" id="gc-toolbar"></div>
        <div id="gc-thread-status"></div>
        <div class="gc-messages" id="gc-messages"></div>
        <div id="gc-screenshot-preview-bar" style="display:none"></div>
        <div class="gc-input-bar" id="gc-input-bar">
          <button class="attach" onclick="GroupChat.pickFile()" title="Attach screenshot"><i class="fas fa-paperclip"></i></button>
          <input type="file" id="gc-file-input" accept="image/*" style="display:none" onchange="GroupChat.onFilePicked(event)"/>
          <div id="gc-mention-pop" class="gc-mention-pop" style="display:none"></div>
          <input type="text" id="gc-msg-input" placeholder="Type a message… (use @ to mention)" maxlength="500"
            oninput="GroupChat.onInputChange(event)"
            onkeydown="GroupChat.onInputKeyDown(event)"
            onpaste="GroupChat.onPaste(event)"/>
          <button onclick="GroupChat.sendMessage()" id="gc-send-btn" title="Send"><i class="fas fa-paper-plane"></i></button>
        </div>
      </div>
    `;
    document.body.appendChild(panel);
    // Restore saved position
    this._restorePanelPos();
    this._restoreFabPos();
    // Wire up drag handlers
    this._setupDrag(fab, null);
    this._setupDrag(panel, '#gc-list-head, #gc-thread-head');
  },

  togglePanel() {
    const p = document.getElementById('gc-panel');
    p.classList.toggle('open');
    if (p.classList.contains('open')) {
      // Re-opening from the chat-head: clear minimized state + unread pulse
      this._minimized = false;
      const fab = document.getElementById('gc-fab');
      if (fab) fab.classList.remove('gc-pulse','gc-chathead');
      const badge = document.getElementById('gc-fab-badge');
      if (badge) { badge.style.display = 'none'; badge.textContent = '0'; }
      this._pendingUnread = 0;
      // Ask permission for browser notifications the first time the user actually opens the chat
      try {
        if ('Notification' in window && Notification.permission === 'default') {
          Notification.requestPermission().catch(()=>{});
        }
      } catch(_){}
    } else {
      this.closeThread();
    }
  },

  // Facebook-Messenger-style minimize: collapses to a floating chat-head bubble that pulses
  // on new messages and re-opens the same thread on click.
  minimizePanel() {
    const p = document.getElementById('gc-panel');
    if (p) p.classList.remove('open');
    this._minimized = true;
    // Preserve the active thread so re-opening returns to the same place
    const fab = document.getElementById('gc-fab');
    if (fab) {
      fab.classList.add('gc-chathead');
      fab.classList.add('gc-pulse');
      setTimeout(() => fab.classList.remove('gc-pulse'), 3000);
    }
  },

  // Real "close" button: tear down the panel state (close thread + listeners) and ask the
  // browser to keep notifying the user of new messages even after the chat is dismissed.
  closePanel() {
    const p = document.getElementById('gc-panel');
    if (p) p.classList.remove('open');
    this._minimized = false;
    this.closeThread();
    const fab = document.getElementById('gc-fab');
    if (fab) fab.classList.remove('gc-chathead');
    // Best-effort: enable browser notifications so user is alerted to new messages
    try {
      if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission().catch(()=>{});
      }
    } catch(_){}
  },

  // ---------------------- DRAGGABLE ----------------------
  _setupDrag(el, handleSelector) {
    if (!el) return;
    let startX = 0, startY = 0, origLeft = 0, origTop = 0, dragging = false, moved = false;
    const getHandle = (e) => {
      if (!handleSelector) return el;
      return e.target.closest(handleSelector);
    };
    const isInteractive = (target) => {
      // Allow normal clicks on inner buttons / inputs / links
      return target.closest('button, input, a, select, textarea');
    };
    const start = (e) => {
      if (handleSelector) {
        const h = getHandle(e); if (!h) return;
      }
      if (isInteractive(e.target)) return;
      const touch = e.touches?.[0];
      const cx = touch ? touch.clientX : e.clientX;
      const cy = touch ? touch.clientY : e.clientY;
      const r = el.getBoundingClientRect();
      origLeft = r.left; origTop = r.top;
      startX = cx; startY = cy;
      dragging = true; moved = false;
      el.classList.add('dragging');
      document.addEventListener('mousemove', move); document.addEventListener('mouseup', stop);
      document.addEventListener('touchmove', move, { passive: false }); document.addEventListener('touchend', stop);
      e.preventDefault?.();
    };
    const move = (e) => {
      if (!dragging) return;
      const touch = e.touches?.[0];
      const cx = touch ? touch.clientX : e.clientX;
      const cy = touch ? touch.clientY : e.clientY;
      const dx = cx - startX, dy = cy - startY;
      if (Math.abs(dx) + Math.abs(dy) > 4) moved = true;
      let nl = origLeft + dx, nt = origTop + dy;
      const w = el.offsetWidth, h = el.offsetHeight;
      const margin = 4;
      nl = Math.max(margin, Math.min(window.innerWidth - w - margin, nl));
      nt = Math.max(margin, Math.min(window.innerHeight - h - margin, nt));
      el.style.left = nl + 'px'; el.style.top = nt + 'px';
      el.style.right = 'auto'; el.style.bottom = 'auto';
      e.preventDefault?.();
    };
    const stop = () => {
      if (!dragging) return;
      dragging = false;
      el.classList.remove('dragging');
      document.removeEventListener('mousemove', move); document.removeEventListener('mouseup', stop);
      document.removeEventListener('touchmove', move); document.removeEventListener('touchend', stop);
      if (moved) {
        try {
          const key = el.id === 'gc-fab' ? 'hc_gc_fab_pos' : 'hc_gc_panel_pos';
          localStorage.setItem(key, JSON.stringify({ left: el.style.left, top: el.style.top }));
        } catch(_){}
        // Suppress click that follows mouseup after drag
        const block = (ev) => { ev.stopPropagation(); ev.preventDefault(); el.removeEventListener('click', block, true); };
        el.addEventListener('click', block, true);
        setTimeout(() => el.removeEventListener('click', block, true), 50);
      }
    };
    el.addEventListener('mousedown', start);
    el.addEventListener('touchstart', start, { passive: false });
  },

  _restorePanelPos() {
    try {
      const raw = localStorage.getItem('hc_gc_panel_pos'); if (!raw) return;
      const p = JSON.parse(raw); const el = document.getElementById('gc-panel');
      if (el && p?.left && p?.top) { el.style.left = p.left; el.style.top = p.top; el.style.right = 'auto'; el.style.bottom = 'auto'; }
    } catch(_){}
  },
  _restoreFabPos() {
    try {
      const raw = localStorage.getItem('hc_gc_fab_pos'); if (!raw) return;
      const p = JSON.parse(raw); const el = document.getElementById('gc-fab');
      if (!el || !p?.left || !p?.top) return;
      // Validate: if a stale position has parked the bubble in the upper half of the
      // viewport (above 55%), discard it and keep the default bottom-right position.
      const topNum = parseFloat(p.top);
      if (!isFinite(topNum) || topNum < window.innerHeight * 0.55) {
        try { localStorage.removeItem('hc_gc_fab_pos'); } catch(_){}
        return;
      }
      el.style.left = p.left; el.style.top = p.top; el.style.right = 'auto'; el.style.bottom = 'auto';
    } catch(_){}
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
    // Pulse the chat-head bubble (Messenger style) when chat is minimized OR closed
    const fab = document.getElementById('gc-fab');
    if (fab) {
      fab.classList.add('gc-pulse');
      setTimeout(() => fab.classList.remove('gc-pulse'), 4000);
    }
    // Tab title flash so the user sees activity even while on another tab
    if (document.hidden) {
      this._flashTitle(`💬 New message — ${group.name}`);
    }
    // Browser notification (works after the user has granted permission, even when tab is closed/backgrounded)
    try {
      if ('Notification' in window && Notification.permission === 'granted') {
        const n = new Notification(`${group.name} · ${msg.senderName||''}`, {
          body: (msg.text||'[image]').slice(0,120),
          icon: '/logo.png',
          tag: 'gc-' + group.id,
          renotify: true
        });
        n.onclick = () => { try { window.focus(); } catch(_){} this.togglePanel(); this.openThread(group.id); n.close(); };
      }
    } catch(_){}
  },

  // Flash the document title until the tab regains focus, so users notice new messages
  // even when the chat panel is closed.
  _flashTitle(text) {
    if (this._titleTimer) return;
    if (!this._origTitle) this._origTitle = document.title;
    let toggle = false;
    this._titleTimer = setInterval(() => {
      document.title = toggle ? this._origTitle : text;
      toggle = !toggle;
    }, 1200);
    const restore = () => {
      if (!document.hidden) {
        clearInterval(this._titleTimer);
        this._titleTimer = null;
        document.title = this._origTitle;
        document.removeEventListener('visibilitychange', restore);
      }
    };
    document.addEventListener('visibilitychange', restore);
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

    // Toolbar (owner + chat admins get meeting/reminder/report extras)
    const isOwner = this.isOwner();
    const chatAdmins = await this.loadChatAdmins(groupId);
    const isChatAdmin = chatAdmins.includes(this.currentUser.uid) || isOwner;
    const tb = document.getElementById('gc-toolbar');
    tb.innerHTML = `
      <span class="gc-online-count"><i class="fas fa-circle" style="font-size:8px"></i> ${onlineCount} online</span>
      ${isChatAdmin ? `
        <button onclick="GroupChat.setMeetingLinkPrompt('${groupId}')"><i class="fas fa-video"></i> Set Meeting</button>
        <button onclick="GroupChat.openReminderModal('${groupId}')"><i class="fas fa-bell"></i> Reminder</button>
      ` : ''}
      <button onclick="GroupChat.showMembers('${groupId}')"><i class="fas fa-users"></i> Members</button>
      <button onclick="GroupChat.showReminders('${groupId}')"><i class="fas fa-list-ul"></i> Reminders</button>
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
      const myUid = this.currentUser?.uid;
      box.innerHTML = msgs.map(m => {
        if (m.system) return `<div class="gc-system">${this.escape(m.text || '')}</div>`;
        if (m.reminder) {
          const due = m.reminder.dueAt?.toDate?.()?.toLocaleString() || '';
          const mentionList = (m.reminder.mentionNames || []).map(n => '@'+n).join(' ');
          return `<div class="gc-reminder-card"><div class="gc-rmh"><b><i class="fas fa-bell"></i> Reminder</b><span>Due: ${this.escape(due)}</span></div>
            <div>${this.escape(m.reminder.text||'')}</div>
            ${mentionList ? `<div style="color:#3b82f6;margin-top:4px;font-size:11px">${this.escape(mentionList)}</div>` : ''}
            <div style="font-size:10px;color:#888;margin-top:4px">By ${this.escape(m.reminder.byName||m.senderName||'')}</div>
          </div>`;
        }
        const isMe = m.senderUid === myUid;
        const time = m.at?.toDate?.()?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) || '';
        const readCount = (m.readBy || []).length;
        const tickColour = readCount >= memberCount ? '#3b82f6' : '#888';
        const tick = isMe ? `<span class="gc-tick" style="color:${tickColour}">✓✓ ${readCount}</span>` : '';
        const imgHtml = m.imageUrl ? `<img src="${this.escape(m.imageUrl)}" alt="image" onclick="window.open('${this.escape(m.imageUrl)}','_blank')"/>` : '';
        const textHtml = m.text ? `<div>${this.renderTextWithMentions(m.text, m.mentionUids||[])}</div>` : '';
        const mentionMe = (m.mentionUids||[]).includes(myUid) ? ' mention-me' : '';
        return `<div class="gc-msg ${isMe ? 'me' : 'them'}${mentionMe}" onclick="GroupChat.showReadBy('${groupId}','${m.id}')" title="Click to see who read">
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
      userDocs.forEach((d, i) => {
        const uid = memberUids[i];
        const isGroupCreator = uid === g?.ownerUid;
        const email = (d?.exists?.() ? (d.data().email || '') : '').toLowerCase();
        const isSystemOwner = email === OWNER_EMAIL;
        if (isSystemOwner) {
          nameByUid[uid] = '👑 CEO';
        } else if (d?.exists?.()) {
          nameByUid[uid] = d.data().displayName || (isGroupCreator ? 'Group Admin' : 'Member');
        } else {
          nameByUid[uid] = isGroupCreator ? 'Group Admin' : 'Member';
        }
      });
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
    if (uid === g.ownerUid) return '👑 CEO';
    if ((userData?.email || '').toLowerCase() === OWNER_EMAIL) return '👑 CEO';
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
    const canManage = isOwner || chatAdmins.includes(this.currentUser.uid);
    overlay.innerHTML = `<div class="gc-modal-card" style="max-width:520px">
      <h3><span><i class="fas fa-users"></i> ${memberUids.length} Members</span><button onclick="this.closest('.gc-readby-modal').remove()">&times;</button></h3>
      <div class="gc-modal-body">
        ${canManage ? `<div style="display:flex;gap:8px;margin-bottom:12px">
          <button class="btn btn-sm" style="background:#22c55e;color:#fff;flex:1" onclick="GroupChat.openManageMembers('${groupId}')"><i class="fas fa-user-plus"></i> Add / Remove Members</button>
        </div>` : ''}
        ${userDocs.map((d, i) => {
          const uid = memberUids[i];
          const x = d?.exists?.() ? d.data() : { displayName: 'Member' };
          const online = this.isOnline(uid);
          const isGroupOwner = uid === g.ownerUid;
          // Hide email everywhere — show name only. For the owner show "Owner" if no displayName.
          const safeName = x.displayName || (isGroupOwner ? 'Owner' : 'Member');
          const initial = safeName[0].toUpperCase();
          const title = this.memberTitle(g, uid, x);
          const isChatAdmin = chatAdmins.includes(uid);
          const adminBadge = isChatAdmin && !isGroupOwner ? '<span style="background:rgba(245,158,11,0.18);color:#f59e0b;font-size:9px;padding:2px 6px;border-radius:6px;margin-left:6px">⭐ Chat Admin</span>' : '';
          const adminBtn = isOwner && !isGroupOwner
            ? `<button class="btn btn-sm" style="background:${isChatAdmin?'#ef4444':'rgba(245,158,11,0.18)'};color:${isChatAdmin?'#fff':'#f59e0b'};font-size:10px" onclick="GroupChat.toggleChatAdmin('${groupId}','${uid}',${!isChatAdmin})">${isChatAdmin ? 'Remove Admin' : 'Make Admin'}</button>`
            : '';
          return `<div class="gc-readby-row">
            <div class="gc-mini-avatar" style="position:relative">${initial}${online?'<span style="position:absolute;bottom:-2px;right:-2px;width:9px;height:9px;background:#22c55e;border-radius:50%;border:2px solid #13131f"></span>':''}</div>
            <div style="flex:1;color:#fff;font-size:13px">${this.escape(safeName)}${adminBadge}<div style="font-size:10px;color:#d4af37">${this.escape(title)}</div></div>
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

  // ----- Manage members modal (owner OR chat admin): location/category filter to add/remove -----
  async openManageMembers(groupId) {
    const chatAdmins = await this.loadChatAdmins(groupId);
    const isOwner = this.isOwner();
    if (!isOwner && !chatAdmins.includes(this.currentUser.uid)) return;
    const g = this.groups.find(x => x.id === groupId); if (!g) return;
    document.querySelector('.gc-readby-modal')?.remove();
    const all = await getDocs(collection(db, 'users'));
    // Show ONLY promoted members (Admin role) + the existing group members so they can be removed.
    const allUsers = all.docs.map(d => ({ uid: d.id, ...d.data() }));
    const existingMemberIds = new Set(g.memberUids || []);
    const users = allUsers.filter(u => u.role === 'Admin' || existingMemberIds.has(u.uid));
    // Location filter baseline: ALL Indian states + UTs (so the dropdown is always complete)
    // PLUS any custom locations that promoted admins are already allocated to (e.g. branch names).
    const INDIA_STATES = (window.INDIAN_STATES) || ['Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat','Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh','Uttarakhand','West Bengal','Andaman & Nicobar','Chandigarh','Dadra & Nagar Haveli','Daman & Diu','Delhi','Jammu & Kashmir','Ladakh','Lakshadweep','Puducherry'];
    const stateSet = new Set(INDIA_STATES);
    allUsers.forEach(u => {
      if (u.role === 'Admin') {
        const ulocs = Array.isArray(u.locations) ? u.locations : (u.state ? [u.state] : []);
        ulocs.forEach(s => { if (s) stateSet.add(s); });
      }
    });
    const states = Array.from(stateSet).sort();
    // Category baseline: marketing, sales, account, team, management — plus any roles seen on the actual users
    const STANDARD_CATEGORIES = ['Marketing Manager','Marketing Executive','Sales Manager','Sales Executive','Accountant','Account Manager','Team Leader','Team Member','Operations Manager','Branch Head','Recruiter','Support Executive','Admin'];
    const catSet = new Set(STANDARD_CATEGORIES);
    users.forEach(u => { const c = u.adminRole || u.role; if (c) catSet.add(c); });
    const cats = Array.from(catSet).sort();

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
    // Allow group owner OR chat-admins to save member changes.
    const chatAdmins = await this.loadChatAdmins(groupId);
    if (!this.isOwner() && !chatAdmins.includes(this.currentUser.uid)) {
      alert('Only the owner or chat-admins can change members.');
      return;
    }
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
    this._stagePendingImage(file);
    ev.target.value = '';
  },

  async onPaste(ev) {
    const items = ev.clipboardData?.items || [];
    for (const it of items) {
      if (it.type && it.type.startsWith('image/')) {
        const f = it.getAsFile();
        if (f) { ev.preventDefault(); this._stagePendingImage(f); return; }
      }
    }
  },

  // Stage a pending screenshot — show preview above input, only upload when user presses Send
  _stagePendingImage(file) {
    if (this._pendingImage?.url) { try { URL.revokeObjectURL(this._pendingImage.url); } catch(_){} }
    const url = URL.createObjectURL(file);
    this._pendingImage = { file, url };
    const bar = document.getElementById('gc-screenshot-preview-bar');
    if (!bar) return;
    bar.style.display = 'block';
    const sizeKB = Math.round(file.size / 1024);
    const fname = (file.name || 'screenshot.png').slice(0, 48);
    bar.innerHTML = `<div class="gc-screenshot-preview">
      <img src="${url}" alt="preview" onclick="GroupChat.openCropModal()" title="Click to edit / crop"/>
      <div class="gc-sp-info"><b>${this.escape(fname)}</b>${sizeKB} KB · review below. Click image or "Edit" to crop before sending.</div>
      <div class="gc-sp-actions">
        <button class="gc-edit-btn" onclick="GroupChat.openCropModal()" title="Crop / edit"><i class="fas fa-crop"></i> Edit</button>
        <button onclick="GroupChat._cancelPendingImage()" title="Remove"><i class="fas fa-times"></i> Cancel</button>
      </div>
    </div>`;
    // Update placeholder + send button hint
    const inp = document.getElementById('gc-msg-input'); if (inp) inp.placeholder = 'Add an optional caption…';
    const sendBtn = document.getElementById('gc-send-btn');
    if (sendBtn) sendBtn.title = 'Send screenshot';
  },

  _cancelPendingImage() {
    if (this._pendingImage?.url) { try { URL.revokeObjectURL(this._pendingImage.url); } catch(_){} }
    this._pendingImage = null;
    const bar = document.getElementById('gc-screenshot-preview-bar');
    if (bar) { bar.style.display = 'none'; bar.innerHTML = ''; }
    const inp = document.getElementById('gc-msg-input'); if (inp) inp.placeholder = 'Type a message… (use @ to mention)';
  },

  // ---------------------- IMAGE CROP / EDIT MODAL ----------------------
  // Loads CropperJS from CDN on demand and shows a full crop UI.
  async _ensureCropper() {
    if (window.Cropper) return;
    if (!document.getElementById('gc-cropper-css')) {
      const link = document.createElement('link');
      link.id = 'gc-cropper-css'; link.rel = 'stylesheet';
      link.href = 'https://cdn.jsdelivr.net/npm/cropperjs@1.6.1/dist/cropper.min.css';
      document.head.appendChild(link);
    }
    await new Promise((res, rej) => {
      const s = document.createElement('script');
      s.src = 'https://cdn.jsdelivr.net/npm/cropperjs@1.6.1/dist/cropper.min.js';
      s.onload = res; s.onerror = () => rej(new Error('Failed to load CropperJS'));
      document.head.appendChild(s);
    });
  },

  async openCropModal() {
    if (!this._pendingImage) return;
    try {
      await this._ensureCropper();
    } catch(e) { alert('Could not load crop tool. Are you online?'); return; }
    const file = this._pendingImage.file;
    const url = this._pendingImage.url;
    document.querySelector('.gc-crop-modal')?.remove();
    const modal = document.createElement('div');
    modal.className = 'gc-crop-modal';
    modal.innerHTML = `
      <div class="gc-crop-card">
        <h3>
          <span><i class="fas fa-crop"></i> Edit Screenshot — drag corners to crop</span>
          <button onclick="GroupChat._closeCropModal()" title="Cancel">&times;</button>
        </h3>
        <div class="gc-crop-tools">
          <button data-ratio="NaN" class="active" onclick="GroupChat._setCropRatio(this, NaN)">Free</button>
          <button data-ratio="1" onclick="GroupChat._setCropRatio(this, 1)">1 : 1</button>
          <button data-ratio="${4/3}" onclick="GroupChat._setCropRatio(this, 4/3)">4 : 3</button>
          <button data-ratio="${16/9}" onclick="GroupChat._setCropRatio(this, 16/9)">16 : 9</button>
          <button data-ratio="${9/16}" onclick="GroupChat._setCropRatio(this, 9/16)">9 : 16</button>
          <span style="flex:1"></span>
          <button onclick="GroupChat._cropRotate(-90)" title="Rotate left"><i class="fas fa-undo"></i></button>
          <button onclick="GroupChat._cropRotate(90)" title="Rotate right"><i class="fas fa-redo"></i></button>
          <button onclick="GroupChat._cropFlip('h')" title="Flip horizontal"><i class="fas fa-arrows-alt-h"></i></button>
          <button onclick="GroupChat._cropFlip('v')" title="Flip vertical"><i class="fas fa-arrows-alt-v"></i></button>
          <button onclick="GroupChat._cropReset()" title="Reset"><i class="fas fa-sync"></i> Reset</button>
        </div>
        <div class="gc-crop-stage">
          <img id="gc-crop-img" src="${url}" alt="to crop"/>
        </div>
        <div class="gc-crop-actions">
          <button class="cancel" onclick="GroupChat._closeCropModal()">Cancel</button>
          <button class="apply" onclick="GroupChat._applyCrop()"><i class="fas fa-check"></i> Apply &amp; Use</button>
        </div>
      </div>`;
    document.body.appendChild(modal);
    const img = modal.querySelector('#gc-crop-img');
    this._cropFlipState = { h: 1, v: 1 };
    this._cropper = new window.Cropper(img, {
      viewMode: 1,
      dragMode: 'move',
      autoCropArea: 0.95,
      background: false,
      responsive: true,
      movable: true,
      zoomable: true,
      rotatable: true,
      scalable: true,
      checkOrientation: false
    });
    this._origCropFile = file;
  },
  _setCropRatio(btn, ratio) {
    if (!this._cropper) return;
    document.querySelectorAll('.gc-crop-tools button[data-ratio]').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    this._cropper.setAspectRatio(ratio);
  },
  _cropRotate(deg) { if (this._cropper) this._cropper.rotate(deg); },
  _cropFlip(axis) {
    if (!this._cropper) return;
    if (axis === 'h') { this._cropFlipState.h *= -1; this._cropper.scaleX(this._cropFlipState.h); }
    else { this._cropFlipState.v *= -1; this._cropper.scaleY(this._cropFlipState.v); }
  },
  _cropReset() {
    if (!this._cropper) return;
    this._cropFlipState = { h: 1, v: 1 };
    this._cropper.reset();
  },
  _closeCropModal() {
    try { this._cropper?.destroy(); } catch(_){}
    this._cropper = null;
    document.querySelector('.gc-crop-modal')?.remove();
  },
  async _applyCrop() {
    if (!this._cropper || !this._pendingImage) { this._closeCropModal(); return; }
    const canvas = this._cropper.getCroppedCanvas({
      maxWidth: 2000, maxHeight: 2000,
      imageSmoothingEnabled: true, imageSmoothingQuality: 'high'
    });
    if (!canvas) { this._closeCropModal(); return; }
    const orig = this._origCropFile || this._pendingImage.file;
    const mime = (orig.type && orig.type !== 'image/gif') ? orig.type : 'image/png';
    const quality = mime === 'image/jpeg' ? 0.92 : undefined;
    canvas.toBlob((blob) => {
      if (!blob) { this._closeCropModal(); return; }
      const newName = (orig.name || 'screenshot.png').replace(/(\.[^.]+)?$/, '_edited' + (mime==='image/jpeg'?'.jpg':'.png'));
      const newFile = new File([blob], newName, { type: mime, lastModified: Date.now() });
      this._closeCropModal();
      // Re-stage with the cropped result; preview bar refreshes automatically
      this._stagePendingImage(newFile);
    }, mime, quality);
  },

  // Compress an image File to a JPEG data URL — keeps under ~700KB so it fits in a Firestore doc.
  // Bypasses Firebase Storage entirely (avoids CORS / retry-limit-exceeded issues for chat images).
  async _compressToDataUrl(file, maxSide = 1280, startQuality = 0.72) {
    const dataUrl = await new Promise((resolve, reject) => {
      const fr = new FileReader();
      fr.onload = () => resolve(fr.result);
      fr.onerror = () => reject(new Error('Could not read image'));
      fr.readAsDataURL(file);
    });
    // If it's not an image, just return the raw dataURL (rare for chat).
    if (!/^image\//.test(file.type || '')) return dataUrl;
    const img = await new Promise((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = () => reject(new Error('Could not decode image'));
      i.src = dataUrl;
    });
    let { width, height } = img;
    const longest = Math.max(width, height);
    if (longest > maxSide) {
      const scale = maxSide / longest;
      width = Math.round(width * scale);
      height = Math.round(height * scale);
    }
    const canvas = document.createElement('canvas');
    canvas.width = width; canvas.height = height;
    const ctx = canvas.getContext('2d');
    // Use white background for transparent PNGs so JPEG looks right.
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(img, 0, 0, width, height);
    // Try descending quality steps until we're under the safety cap (~700KB).
    const cap = 700 * 1024;
    let quality = startQuality;
    let out = canvas.toDataURL('image/jpeg', quality);
    while (out.length > cap && quality > 0.35) {
      quality = Math.max(0.35, quality - 0.12);
      out = canvas.toDataURL('image/jpeg', quality);
    }
    // If still too big, scale down further.
    let scaleAttempts = 0;
    while (out.length > cap && scaleAttempts < 3) {
      width = Math.round(width * 0.8);
      height = Math.round(height * 0.8);
      canvas.width = width; canvas.height = height;
      ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);
      out = canvas.toDataURL('image/jpeg', quality);
      scaleAttempts++;
    }
    return out;
  },

  // Instant upload: image is compressed locally and embedded directly in the Firestore
  // message doc (no Firebase Storage hop) so it sends in zero perceived time and never
  // hits CORS / retry-limit-exceeded.
  async uploadAndSend(file) {
    if (!this.currentGroupId || !this.currentUser) return;
    const u = this.currentUser;
    const myData = this.currentUserData || {};
    const groupId = this.currentGroupId;

    // 1. Local preview — instant feedback
    const localUrl = URL.createObjectURL(file);
    const tempId = 'gc-tmp-' + Date.now() + '-' + Math.random().toString(36).slice(2,6);
    const box = document.getElementById('gc-messages');
    if (box) {
      const tempHtml = `<div class="gc-msg me" id="${tempId}">
        <img src="${localUrl}" alt="image" style="max-width:240px;border-radius:10px"/>
        <div class="gc-time"><i class="fas fa-check" style="opacity:0.6"></i></div>
      </div>`;
      box.insertAdjacentHTML('beforeend', tempHtml);
      box.scrollTop = box.scrollHeight;
    }

    // 2. Compress + post in background (no blocking)
    (async () => {
      try {
        const url = await this._compressToDataUrl(file);
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
        document.getElementById(tempId)?.remove();
        try { URL.revokeObjectURL(localUrl); } catch(_){}
      } catch(e) {
        const t = document.getElementById(tempId);
        if (t) t.innerHTML = `<div style="color:#ef4444;font-size:11px;padding:6px">❌ Send failed: ${this.escape(e.message)} — tap to retry</div>`;
        if (t) t.onclick = () => { t.remove(); this.uploadAndSend(file); };
        console.warn('image send failed:', e);
      }
    })();
  },

  // ---------------------- SEND TEXT MESSAGE (and/or staged screenshot) ----------------------
  async sendMessage() {
    const input = document.getElementById('gc-msg-input');
    const text = (input?.value || '').trim();
    const pending = this._pendingImage;
    if (!text && !pending) return;
    if (!this.currentGroupId || !this.currentUser) return;
    const btn = document.getElementById('gc-send-btn');
    if (btn) btn.disabled = true;
    try {
      const u = this.currentUser;
      const myData = this.currentUserData || (await getDoc(doc(db,'users',u.uid))).data() || {};
      const { uids: mentionUids, names: mentionNames } = await this.parseMentions(text, this.currentGroupId);
      if (pending) {
        // Upload + send image (with optional caption) — clear preview immediately for snappy UX
        const fileToUpload = pending.file;
        const captionText = text;
        this._cancelPendingImage();
        if (input) input.value = '';
        await this._uploadStagedImage(fileToUpload, captionText, mentionUids, mentionNames, myData);
      } else {
        await addDoc(collection(db, 'connectGroups', this.currentGroupId, 'messages'), {
          senderUid: u.uid,
          senderName: myData.displayName || u.displayName || u.email || 'User',
          senderRole: myData.adminRole || myData.role || 'User',
          text: text.slice(0, 500),
          mentionUids, mentionNames,
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
      }
    } catch (e) {
      console.error('Send message failed:', e);
      alert('Could not send: ' + e.message);
    } finally {
      if (btn) btn.disabled = false;
    }
  },

  // Upload staged image and post as message (called from sendMessage when a screenshot is staged)
  async _uploadStagedImage(file, caption, mentionUids, mentionNames, myData) {
    const u = this.currentUser; const groupId = this.currentGroupId;
    const localUrl = URL.createObjectURL(file);
    const tempId = 'gc-tmp-' + Date.now() + '-' + Math.random().toString(36).slice(2,6);
    const box = document.getElementById('gc-messages');
    if (box) {
      const capHtml = caption ? `<div style="margin-bottom:4px">${this.escape(caption)}</div>` : '';
      // Instant attach — full opacity image, no spinner. Background upload swaps it silently.
      box.insertAdjacentHTML('beforeend', `<div class="gc-msg me" id="${tempId}">
        ${capHtml}
        <img src="${localUrl}" alt="image" style="max-width:240px;border-radius:10px"/>
        <div class="gc-time"><i class="fas fa-check" style="opacity:0.6"></i></div>
      </div>`);
      box.scrollTop = box.scrollHeight;
    }
    try {
      // Compress + embed as dataURL — no Firebase Storage hop, no CORS, no retry-limit errors.
      const url = await this._compressToDataUrl(file);
      await addDoc(collection(db, 'connectGroups', groupId, 'messages'), {
        senderUid: u.uid,
        senderName: myData.displayName || u.displayName || u.email,
        senderRole: myData.adminRole || myData.role || 'User',
        text: (caption || '').slice(0, 500),
        mentionUids: mentionUids || [], mentionNames: mentionNames || [],
        imageUrl: url,
        readBy: [u.uid],
        at: serverTimestamp()
      });
      await updateDoc(doc(db, 'connectGroups', groupId), {
        lastMessage: caption ? caption.slice(0, 100) : '[image]',
        lastMessageAt: serverTimestamp(),
        lastMessageBy: u.uid,
        lastMessageByName: myData.displayName || u.email
      });
      document.getElementById(tempId)?.remove();
      try { URL.revokeObjectURL(localUrl); } catch(_){}
    } catch(e) {
      const t = document.getElementById(tempId);
      if (t) t.innerHTML = `<div style="color:#ef4444;font-size:11px;padding:6px">❌ Send failed: ${this.escape(e.message)}</div>`;
      console.warn('image send failed:', e);
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
      if (typeof window.showToast === 'function') window.showToast(`Report ready (${allMsgs.length} msgs)`, 'success');
      else alert(`Report generated and saved. Total ${allMsgs.length} messages analysed.`);
    } catch(e) {
      console.warn('Report failed', e?.message || e);
      // Storage retry-limit-exceeded usually means CORS not configured — surface gentle message instead of blocking alert
      const msg = String(e?.message || e);
      const friendly = msg.includes('storage/retry-limit-exceeded') || msg.includes('Storage')
        ? 'Could not upload PDF — storage may be offline. The report data is saved; try again from Reports Center.'
        : 'Could not generate report: ' + msg;
      if (typeof window.showToast === 'function') window.showToast(friendly, 'error');
      else console.warn(friendly);
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
  },

  // ---------------------- @MENTIONS ----------------------
  async getGroupMembers(groupId) {
    if (this._memberCache && this._memberCache.gid === groupId && (Date.now() - this._memberCache.t) < 30000) return this._memberCache.list;
    const g = this.groups.find(x => x.id === groupId);
    if (!g) return [];
    const uids = g.memberUids || [];
    const docs = await Promise.all(uids.map(uid => getDoc(doc(db, 'users', uid)).catch(() => null)));
    const list = docs.map((d, i) => {
      const x = d?.exists?.() ? d.data() : {};
      return { uid: uids[i], name: x.displayName || x.email || uids[i].slice(0,8), email: x.email||'', role: x.adminRole || x.role || 'User' };
    });
    this._memberCache = { gid: groupId, t: Date.now(), list };
    return list;
  },

  async parseMentions(text, groupId) {
    const matches = [...text.matchAll(/@([A-Za-z0-9_.\-]{2,40})/g)];
    if (!matches.length) return { uids: [], names: [] };
    const members = await this.getGroupMembers(groupId);
    const uids = []; const names = [];
    matches.forEach(m => {
      const tag = m[1].toLowerCase();
      const hit = members.find(u => {
        const n = (u.name||'').toLowerCase().replace(/\s+/g,'');
        const e = (u.email||'').toLowerCase().split('@')[0];
        return n.startsWith(tag) || e === tag || n === tag;
      });
      if (hit && !uids.includes(hit.uid)) { uids.push(hit.uid); names.push(hit.name); }
    });
    return { uids, names };
  },

  renderTextWithMentions(text, mentionUids) {
    const safe = this.escape(text);
    return safe.replace(/@([A-Za-z0-9_.\-]{2,40})/g, '<span class="gc-mention">@$1</span>');
  },

  async onInputChange(ev) {
    const inp = ev.target;
    const v = inp.value;
    const caret = inp.selectionStart || v.length;
    const before = v.slice(0, caret);
    const m = before.match(/@([A-Za-z0-9_.\-]{0,40})$/);
    const pop = document.getElementById('gc-mention-pop');
    if (!m || !this.currentGroupId) { if (pop) pop.style.display = 'none'; this._mentionState = null; return; }
    const q = m[1].toLowerCase();
    const members = await this.getGroupMembers(this.currentGroupId);
    const filtered = members.filter(u => {
      if (u.uid === this.currentUser?.uid) return false;
      if (!q) return true;
      const n = (u.name||'').toLowerCase();
      const e = (u.email||'').toLowerCase();
      return n.includes(q) || e.includes(q);
    }).slice(0, 8);
    if (!filtered.length) { pop.style.display = 'none'; this._mentionState = null; return; }
    this._mentionState = { start: caret - m[0].length, end: caret, list: filtered, idx: 0 };
    pop.innerHTML = filtered.map((u, i) => {
      const init = (u.name||'?').split(/\s+/).map(x=>x[0]||'').join('').slice(0,2).toUpperCase();
      return `<div class="gc-mention-row ${i===0?'active':''}" data-idx="${i}" onclick="GroupChat.applyMention(${i})">
        <div class="gc-mini-avatar" style="width:26px;height:26px;border-radius:50%;background:linear-gradient(135deg,#d4af37,#b8941f);color:#0a0a14;display:flex;align-items:center;justify-content:center;font-weight:700">${init}</div>
        <div style="flex:1"><div style="font-weight:600">${this.escape(u.name)}</div><div style="font-size:10px;color:#888">${this.escape(u.role||'')}</div></div>
      </div>`;
    }).join('');
    pop.style.display = 'block';
  },

  onInputKeyDown(ev) {
    const pop = document.getElementById('gc-mention-pop');
    const open = pop && pop.style.display !== 'none' && this._mentionState;
    if (open) {
      if (ev.key === 'ArrowDown') { ev.preventDefault(); this._mentionState.idx = (this._mentionState.idx + 1) % this._mentionState.list.length; this._refreshMentionActive(); return; }
      if (ev.key === 'ArrowUp')   { ev.preventDefault(); this._mentionState.idx = (this._mentionState.idx - 1 + this._mentionState.list.length) % this._mentionState.list.length; this._refreshMentionActive(); return; }
      if (ev.key === 'Enter' || ev.key === 'Tab') { ev.preventDefault(); this.applyMention(this._mentionState.idx); return; }
      if (ev.key === 'Escape') { pop.style.display = 'none'; this._mentionState = null; return; }
    }
    if (ev.key === 'Enter') { ev.preventDefault(); this.sendMessage(); }
  },

  _refreshMentionActive() {
    const pop = document.getElementById('gc-mention-pop');
    if (!pop) return;
    pop.querySelectorAll('.gc-mention-row').forEach((el, i) => el.classList.toggle('active', i === this._mentionState.idx));
  },

  applyMention(idx) {
    if (!this._mentionState) return;
    const u = this._mentionState.list[idx];
    if (!u) return;
    const inp = document.getElementById('gc-msg-input');
    const v = inp.value;
    const tag = '@' + (u.name || '').replace(/\s+/g, '') + ' ';
    inp.value = v.slice(0, this._mentionState.start) + tag + v.slice(this._mentionState.end);
    const newPos = this._mentionState.start + tag.length;
    inp.focus(); inp.setSelectionRange(newPos, newPos);
    document.getElementById('gc-mention-pop').style.display = 'none';
    this._mentionState = null;
  },

  // ---------------------- REMINDERS ----------------------
  async openReminderModal(groupId) {
    document.querySelectorAll('.gc-readby-modal').forEach(x => x.remove());
    const members = await this.getGroupMembers(groupId);
    const overlay = document.createElement('div');
    overlay.className = 'gc-readby-modal';
    overlay.innerHTML = `<div class="gc-readby-content" style="max-width:480px">
      <h3><span><i class="fas fa-bell"></i> New Reminder</span><button onclick="this.closest('.gc-readby-modal').remove()">&times;</button></h3>
      <div style="padding:14px;display:grid;gap:12px">
        <div><label style="font-size:12px;color:#aaa">Reason / Description</label><textarea id="gc-rem-text" rows="3" placeholder="What is this reminder about?" style="width:100%;background:#1a1a2e;border:1px solid rgba(255,255,255,0.15);color:#fff;padding:8px;border-radius:6px;font-size:13px"></textarea></div>
        <div><label style="font-size:12px;color:#aaa">Due Date &amp; Time</label><input type="datetime-local" id="gc-rem-due" style="width:100%;background:#1a1a2e;border:1px solid rgba(255,255,255,0.15);color:#fff;padding:8px;border-radius:6px;font-size:13px"/></div>
        <div><label style="font-size:12px;color:#aaa">Mention Members (optional)</label>
          <div id="gc-rem-mentions" style="max-height:160px;overflow-y:auto;border:1px solid rgba(255,255,255,0.12);border-radius:6px;padding:8px;background:#13131f">
            ${members.map(u => `<label style="display:flex;align-items:center;gap:8px;padding:5px;font-size:13px;color:#fff;cursor:pointer">
              <input type="checkbox" value="${u.uid}" data-name="${this.escape(u.name)}"/> ${this.escape(u.name)} <span style="color:#888;font-size:11px">· ${this.escape(u.role||'')}</span>
            </label>`).join('')}
          </div>
        </div>
        <div style="display:flex;gap:10px;justify-content:flex-end">
          <button class="btn btn-sm" onclick="this.closest('.gc-readby-modal').remove()" style="background:rgba(255,255,255,0.08);color:#fff;padding:8px 14px;border-radius:6px;border:none;cursor:pointer">Cancel</button>
          <button class="btn btn-sm" onclick="GroupChat.postReminder('${groupId}')" style="background:#f59e0b;color:#0a0a14;padding:8px 14px;border-radius:6px;border:none;cursor:pointer;font-weight:700"><i class="fas fa-paper-plane"></i> Post Reminder</button>
        </div>
      </div>
    </div>`;
    document.body.appendChild(overlay);
  },

  async postReminder(groupId) {
    const text = document.getElementById('gc-rem-text')?.value?.trim();
    const due = document.getElementById('gc-rem-due')?.value;
    if (!text) { alert('Please enter a reason for the reminder.'); return; }
    if (!due) { alert('Please pick a due date and time.'); return; }
    const dueDate = new Date(due);
    const checks = document.querySelectorAll('#gc-rem-mentions input[type=checkbox]:checked');
    const mentionUids = Array.from(checks).map(c => c.value);
    const mentionNames = Array.from(checks).map(c => c.dataset.name);
    try {
      const u = this.currentUser;
      const myData = this.currentUserData || {};
      const myName = myData.displayName || u.displayName || u.email;
      await addDoc(collection(db, 'connectGroups', groupId, 'messages'), {
        senderUid: u.uid,
        senderName: myName,
        senderRole: myData.adminRole || myData.role || 'User',
        reminder: { text: text.slice(0, 500), dueAt: dueDate, mentionUids, mentionNames, byName: myName, byUid: u.uid, createdAt: new Date() },
        mentionUids,
        mentionNames,
        readBy: [u.uid],
        at: serverTimestamp()
      });
      await updateDoc(doc(db, 'connectGroups', groupId), {
        lastMessage: '🔔 Reminder: ' + text.slice(0, 80),
        lastMessageAt: serverTimestamp(),
        lastMessageBy: u.uid,
        lastMessageByName: myName
      });
      document.querySelector('.gc-readby-modal')?.remove();
    } catch(e) { alert('Failed to post reminder: ' + e.message); }
  },

  async showReminders(groupId) {
    document.querySelectorAll('.gc-readby-modal').forEach(x => x.remove());
    const overlay = document.createElement('div');
    overlay.className = 'gc-readby-modal';
    overlay.innerHTML = `<div class="gc-readby-content" style="max-width:540px">
      <h3><span><i class="fas fa-list-ul"></i> All Reminders</span><button onclick="this.closest('.gc-readby-modal').remove()">&times;</button></h3>
      <div id="gc-rem-list" style="padding:14px;max-height:60vh;overflow-y:auto"><div style="text-align:center;color:#888"><i class="fas fa-spinner fa-spin"></i> Loading…</div></div>
    </div>`;
    document.body.appendChild(overlay);
    try {
      const ms = await getDocs(query(collection(db, 'connectGroups', groupId, 'messages'), orderBy('at','desc'), limit(500)));
      const reminders = ms.docs.map(d => ({ id: d.id, ...d.data() })).filter(m => m.reminder);
      const box = document.getElementById('gc-rem-list');
      if (!reminders.length) { box.innerHTML = '<div style="text-align:center;color:#888;padding:20px">No reminders yet.</div>'; return; }
      const now = Date.now();
      box.innerHTML = reminders.map(m => {
        const due = m.reminder.dueAt?.toDate?.() || (m.reminder.dueAt instanceof Date ? m.reminder.dueAt : null);
        const dueT = due ? due.getTime() : 0;
        const overdue = dueT && dueT < now;
        const mentionList = (m.reminder.mentionNames || []).map(n => '@'+n).join(' ');
        return `<div class="gc-reminder-card" style="${overdue?'border-left-color:#ef4444':''}">
          <div class="gc-rmh"><b><i class="fas fa-bell"></i> ${this.escape(m.reminder.byName||m.senderName||'')}</b>
            <span style="${overdue?'color:#ef4444;font-weight:700':''}">${overdue?'OVERDUE · ':''}${due?due.toLocaleString():''}</span></div>
          <div>${this.escape(m.reminder.text||'')}</div>
          ${mentionList ? `<div style="color:#3b82f6;margin-top:4px;font-size:11px">${this.escape(mentionList)}</div>` : ''}
        </div>`;
      }).join('');
    } catch(e) {
      document.getElementById('gc-rem-list').innerHTML = `<div style="color:#ef4444;text-align:center;padding:20px">Failed: ${this.escape(e.message)}</div>`;
    }
  }
};

window.GroupChat = GroupChat;
export default GroupChat;
