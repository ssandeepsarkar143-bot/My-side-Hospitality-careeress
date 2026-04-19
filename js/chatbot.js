(function() {
'use strict';

// ── RESPONSES DATABASE ──────────────────────────────────────
const KB = [
  // Greetings
  { p: /^(hello|hi|hey|হ্যালো|হেলো|নমস্কার|হ্যালো|কেমন আছ|good morning|good evening)/i,
    r: ['হ্যালো! আমি Hospitality Careers এর AI Assistant। আপনাকে কিভাবে সাহায্য করতে পারি? 😊', 'স্বাগতম! কিভাবে আপনার কাজে লাগতে পারি?'] },

  // Prime Membership
  { p: /prime|membership|সদস্যপদ|member|subscription|সাবস্ক্রিপশন/i,
    r: ['**Prime Membership** সম্পর্কে জানতে চাইছেন?\n\n✅ **সুবিধা:**\n• সমস্ত job listing দেখার সুযোগ\n• Resume download করার সুবিধা\n• Employer এর সাথে direct contact\n• Job application এ priority\n\n💰 Membership fee মাত্র **₹499/মাস**\n\nMembership নিতে সরাসরি Membership পেজে যান অথবা আমাদের সাথে contact করুন।'] },

  // How to apply for a job
  { p: /apply|job apply|চাকরি|আবেদন|application|কিভাবে apply/i,
    r: ['**চাকরির জন্য আবেদন করা খুবই সহজ! 📝**\n\n1️⃣ আপনার account এ login করুন\n2️⃣ Jobs section এ পছন্দের job খুঁজুন\n3️⃣ Filter ব্যবহার করুন (Department, Position, City)\n4️⃣ "Apply Now" button click করুন\n5️⃣ CV/Resume upload করুন (optional)\n6️⃣ Submit করুন!\n\n⭐ Prime membership থাকলে employer এর contact info সরাসরি পাবেন।'] },

  // CV / Resume
  { p: /cv|resume|রেজুমে|curriculum|বায়োডাটা|biodata/i,
    r: ['**Resume/CV টিপস 📄**\n\n✅ সংক্ষিপ্ত ও স্পষ্ট রাখুন (১-২ পাতা)\n✅ Hospitality experience highlight করুন\n✅ Department & designation clearly লিখুন\n✅ Contact number ও email দিন\n✅ References যোগ করুন\n\n💡 Profile এ CV upload করলে employers সহজে দেখতে পারেন।', 'CV সুন্দর করতে:\n• Personal info\n• Experience\n• Skills (Food & Beverage, Housekeeping, Front Desk, etc.)\n• Education\n• References\n\nএই section গুলো অবশ্যই রাখবেন।'] },

  // Payment / UPI
  { p: /pay|payment|upi|পেমেন্ট|টাকা|amount|price|দাম|কত|fee/i,
    r: ['**Payment সম্পর্কে তথ্য 💳**\n\nআমরা UPI payment accept করি:\n📱 **UPI ID:** ssandeepsarkar143-2@okhdfcbank\n\n**Steps:**\n1️⃣ Membership page এ যান\n2️⃣ "Pay with UPI" বা "Show QR" click করুন\n3️⃣ Payment করুন\n4️⃣ UTR/Transaction ID দিন\n5️⃣ Admin verify করলে আপনি Prime হয়ে যাবেন!\n\nসাধারণত **২৪ ঘণ্টার** মধ্যে verify হয়।'] },

  // Hotel jobs / Hospitality sector
  { p: /hotel|resort|restaurant|hospitality|হোটেল|রেস্টুরেন্ট|spa|catering/i,
    r: ['**Hospitality Industry তে চাকরি 🏨**\n\nআমাদের platform এ রয়েছে:\n• 5-star Hotels\n• Resorts\n• Restaurants & Cafes\n• Spa & Wellness Centers\n• Catering Services\n• Airlines & Airport Hospitality\n\n**Popular Positions:**\nF&B Captain, Front Desk, Housekeeping, Chef, Steward, Receptionist, Sales & Marketing, HR, Management Trainee\n\nজবের জন্য Jobs section দেখুন!'] },

  // Salary / Compensation
  { p: /salary|বেতন|pay scale|compensation|income|আয়/i,
    r: ['**Hospitality Sector Salary Guide 💰**\n\n• **Entry Level:** ₹8,000 – ₹15,000\n• **Mid Level:** ₹15,000 – ₹35,000\n• **Senior Level:** ₹35,000 – ₹80,000+\n• **Management:** ₹80,000 – ₹2,00,000+\n\nSalary নির্ভর করে:\n✅ Hotel Star Category\n✅ City/Location\n✅ Experience\n✅ Department\n\nSearch করে specific job এর salary দেখুন।'] },

  // Interview tips
  { p: /interview|ইন্টারভিউ|tips|preparation|প্রস্তুতি/i,
    r: ['**Hospitality Interview Tips 🎯**\n\n✅ Professional dress code (formal attire)\n✅ Hotel/Company সম্পর্কে research করুন\n✅ Grooming ও body language এ মনোযোগ দিন\n✅ Customer service skill highlight করুন\n✅ Common questions practice করুন:\n   - "Tell me about yourself"\n   - "Why hospitality?"\n   - "How do you handle difficult guests?"\n\n💡 আত্মবিশ্বাসী ও সৌজন্যমূলক আচরণ করুন!'] },

  // Contact
  { p: /contact|যোগাযোগ|phone|email|address|ঠিকানা|helpline/i,
    r: ['**যোগাযোগ করুন 📞**\n\nআমাদের সাথে যোগাযোগের জন্য:\n🌐 **Contact Page:** contact.html পেজে যান\n📧 বিস্তারিত তথ্যের জন্য site এর Contact section দেখুন\n\nঅথবা আমাদের **Feedback form** ব্যবহার করুন — feedback.html'] },

  // Login / Account issues
  { p: /login|sign in|password|account|লগইন|পাসওয়ার্ড|forgot/i,
    r: ['**Account সমস্যা? 🔐**\n\n• **Forgot Password?** Login page এ "Forgot Password" click করুন\n• **Google Sign-in** সমস্যা হলে browser refresh করুন\n• **Account locked?** Contact page এ আমাদের জানান\n\nনতুন account তৈরি করতে homepage এ গিয়ে Sign Up করুন।'] },

  // Employer / Hire Staff
  { p: /employer|hire|staff|recruit|নিয়োগ|কর্মী|employee|জনবল/i,
    r: ['**Staff Hire করতে চান? 🏢**\n\nHospitality Careers এ candidate খুঁজুন:\n\n1️⃣ Job post করুন (Job Post Form)\n2️⃣ Candidate profiles browse করুন\n3️⃣ Resume download request করুন (Prime)\n4️⃣ Direct contact করুন\n\n💡 Job post approve হলে সব candidates দেখতে পাবে।\n\nJob post করতে "Post a Job" option ব্যবহার করুন।'] },

  // Location / Cities
  { p: /city|cities|state|location|কোথায়|কোন শহর|delhi|mumbai|kolkata|bangalore|chennai|west bengal/i,
    r: ['**আমরা সারা ভারতে Service দিই 🇮🇳**\n\nজনপ্রিয় শহর:\n🏙️ Delhi, Mumbai, Kolkata\n🌴 Goa, Kerala, Shimla\n🏔️ Darjeeling, Manali\n🌊 Puri, Chennai\n🏛️ Bangalore, Hyderabad, Pune\n\nSafar করে নিজের City/State filter করুন।'] },

  // How the platform works
  { p: /how|কিভাবে|কীভাবে|platform|website|কি করে/i,
    r: ['**Hospitality Careers Platform কিভাবে কাজ করে? ⚙️**\n\n1️⃣ **Register করুন** — Email বা Google দিয়ে\n2️⃣ **Profile Complete করুন** — আপনার experience ও position দিন\n3️⃣ **Jobs Browse করুন** — Filter দিয়ে পছন্দের job খুঁজুন\n4️⃣ **Apply করুন** — একটি click এ application দিন\n5️⃣ **Prime হন** — বেশি সুবিধা পান\n\n**Prime Members পান:**\n✅ Resume download\n✅ Employer contact\n✅ Exclusive job listings'] },

  // Departments / Positions
  { p: /department|position|designation|housekeeping|food|beverage|front desk|chef|steward|fdm|f&b/i,
    r: ['**Hospitality Departments ও Positions 🏨**\n\n🍽️ **F&B (Food & Beverage)**\nCaptain, Steward, Bartender, Waiter\n\n🛏️ **Housekeeping**\nExecutive Housekeeper, Room Attendant, GRA\n\n🏢 **Front Office**\nReceptionist, Concierge, Bell Captain, FOM\n\n👨‍🍳 **Kitchen**\nExecutive Chef, Sous Chef, CDP, Commis\n\n📊 **Management**\nGeneral Manager, HR Manager, Sales Manager\n\nJob Search এ Department filter ব্যবহার করুন।'] },

  // Thank you / Goodbye
  { p: /thank|ধন্যবাদ|thanks|bye|goodbye|ok|ঠিক আছে|আচ্ছা/i,
    r: ['ধন্যবাদ! আর কোনো প্রশ্ন থাকলে জিজ্ঞেস করুন। 😊 Hospitality Careers আপনার স্বপ্নের চাকরি খুঁজে পেতে সাহায্য করতে সদা প্রস্তুত! 🌟', 'আপনার সাথে কথা বলে ভালো লাগলো! আর কিছু জানতে চাইলে সবসময় জিজ্ঞেস করুন। শুভকামনা! 🎯'] },

  // Default
  { p: /./,
    r: ['আপনার প্রশ্নটি আমি সঠিকভাবে বুঝতে পারিনি। নিচের বিষয়গুলো সম্পর্কে আমি সাহায্য করতে পারি:\n\n• **Prime Membership** সম্পর্কে জানতে\n• **চাকরির আবেদন** কিভাবে করতে হয়\n• **Payment** সম্পর্কিত তথ্য\n• **Interview Tips**\n• **Salary Guide**\n• **Contact** তথ্য\n\nআপনার প্রশ্ন আরেকটু বিস্তারিত লিখুন।', 'এই বিষয়ে আমি আরো জানতে চাই। আপনি কি নিচের কোনো বিষয়ে প্রশ্ন করছেন?\n\n1. Job খোঁজা\n2. Prime Membership\n3. Payment\n4. Resume/CV\n5. Employer হিসেবে Staff hire করা'] }
];

function getResponse(msg) {
  for (const entry of KB) {
    if (entry.p.test(msg)) {
      const responses = entry.r;
      return responses[Math.floor(Math.random() * responses.length)];
    }
  }
  return KB[KB.length - 1].r[0];
}

function formatMsg(text) {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br/>');
}

// ── BUILD UI ─────────────────────────────────────────────────
const style = document.createElement('style');
style.textContent = `
#hc-chat-btn {
  position:fixed;bottom:24px;right:24px;z-index:9999;
  width:56px;height:56px;border-radius:50%;
  background:linear-gradient(135deg,#d4af37,#f5d060);
  border:none;cursor:pointer;box-shadow:0 4px 20px rgba(212,175,55,0.5);
  display:flex;align-items:center;justify-content:center;
  transition:transform 0.2s,box-shadow 0.2s;
}
#hc-chat-btn:hover { transform:scale(1.08);box-shadow:0 6px 28px rgba(212,175,55,0.7); }
#hc-chat-btn svg { width:26px;height:26px;fill:#1a1a2e; }
#hc-chat-badge {
  position:absolute;top:-4px;right:-4px;
  background:#ef4444;color:#fff;font-size:11px;font-weight:700;
  width:20px;height:20px;border-radius:50%;display:flex;align-items:center;justify-content:center;
}
#hc-chat-window {
  position:fixed;bottom:90px;right:24px;z-index:9998;
  width:340px;max-width:calc(100vw - 32px);
  background:#0d1117;border:1px solid rgba(212,175,55,0.25);
  border-radius:18px;overflow:hidden;
  box-shadow:0 20px 60px rgba(0,0,0,0.7);
  display:none;flex-direction:column;
  animation:chatSlideIn 0.25s ease;
  max-height:520px;
}
@keyframes chatSlideIn { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
#hc-chat-header {
  background:linear-gradient(135deg,rgba(212,175,55,0.15),rgba(212,175,55,0.05));
  border-bottom:1px solid rgba(212,175,55,0.2);
  padding:14px 16px;display:flex;align-items:center;gap:10px;
}
#hc-chat-header .hc-av {
  width:38px;height:38px;border-radius:50%;
  background:linear-gradient(135deg,#d4af37,#f5d060);
  display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0;
}
#hc-chat-header .hc-info { flex:1 }
#hc-chat-header .hc-name { font-size:14px;font-weight:700;color:#d4af37;line-height:1.2 }
#hc-chat-header .hc-status { font-size:11px;color:#22c55e;display:flex;align-items:center;gap:4px }
#hc-chat-header .hc-status::before { content:'';width:6px;height:6px;border-radius:50%;background:#22c55e;display:inline-block }
#hc-chat-close { background:none;border:none;cursor:pointer;color:rgba(255,255,255,0.5);font-size:18px;padding:4px;border-radius:4px }
#hc-chat-close:hover { color:#fff;background:rgba(255,255,255,0.08) }
#hc-chat-messages {
  flex:1;overflow-y:auto;padding:14px;display:flex;flex-direction:column;gap:10px;
  min-height:220px;max-height:340px;
  scrollbar-width:thin;scrollbar-color:rgba(212,175,55,0.2) transparent;
}
#hc-chat-messages::-webkit-scrollbar { width:4px }
#hc-chat-messages::-webkit-scrollbar-thumb { background:rgba(212,175,55,0.2);border-radius:2px }
.hc-msg { max-width:88%;line-height:1.55;font-size:13px;border-radius:14px;padding:10px 13px;animation:msgPop 0.2s ease }
@keyframes msgPop { from{opacity:0;transform:scale(0.95)} to{opacity:1;transform:scale(1)} }
.hc-msg.bot {
  background:rgba(255,255,255,0.06);color:rgba(255,255,255,0.9);
  border-bottom-left-radius:4px;align-self:flex-start;
  border:1px solid rgba(255,255,255,0.07);
}
.hc-msg.user {
  background:linear-gradient(135deg,rgba(212,175,55,0.25),rgba(212,175,55,0.12));
  color:#fff;border-bottom-right-radius:4px;align-self:flex-end;
  border:1px solid rgba(212,175,55,0.2);
}
.hc-typing { display:flex;gap:4px;padding:10px 13px;align-self:flex-start }
.hc-typing span {
  width:7px;height:7px;border-radius:50%;background:rgba(212,175,55,0.6);
  animation:typingDot 1.2s infinite;display:block;
}
.hc-typing span:nth-child(2){animation-delay:.2s}
.hc-typing span:nth-child(3){animation-delay:.4s}
@keyframes typingDot {
  0%,60%,100%{transform:translateY(0);opacity:0.4}
  30%{transform:translateY(-6px);opacity:1}
}
#hc-chat-quick { padding:0 14px 8px;display:flex;gap:6px;flex-wrap:wrap }
.hc-quick-btn {
  background:rgba(212,175,55,0.1);border:1px solid rgba(212,175,55,0.25);
  color:#d4af37;font-size:11px;padding:5px 10px;border-radius:20px;cursor:pointer;
  transition:background 0.15s;white-space:nowrap;
}
.hc-quick-btn:hover { background:rgba(212,175,55,0.2) }
#hc-chat-input-row {
  display:flex;gap:8px;padding:10px 14px 14px;
  border-top:1px solid rgba(255,255,255,0.06);
}
#hc-chat-input {
  flex:1;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);
  border-radius:22px;padding:9px 14px;color:#fff;font-size:13px;outline:none;
  font-family:'Poppins',sans-serif;
}
#hc-chat-input:focus { border-color:rgba(212,175,55,0.4) }
#hc-chat-input::placeholder { color:rgba(255,255,255,0.3) }
#hc-chat-send {
  width:38px;height:38px;border-radius:50%;flex-shrink:0;
  background:linear-gradient(135deg,#d4af37,#f5d060);border:none;cursor:pointer;
  display:flex;align-items:center;justify-content:center;
  transition:transform 0.15s;
}
#hc-chat-send:hover { transform:scale(1.08) }
#hc-chat-send svg { width:16px;height:16px;fill:#1a1a2e }
`;
document.head.appendChild(style);

const btn = document.createElement('button');
btn.id = 'hc-chat-btn';
btn.title = 'AI Assistant';
btn.innerHTML = `<svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/></svg>
<span id="hc-chat-badge" style="display:none">1</span>`;

const win = document.createElement('div');
win.id = 'hc-chat-window';
win.innerHTML = `
<div id="hc-chat-header">
  <div class="hc-av">🤖</div>
  <div class="hc-info">
    <div class="hc-name">HC Assistant</div>
    <div class="hc-status">Online · সবসময় প্রস্তুত</div>
  </div>
  <button id="hc-chat-close" title="Close">✕</button>
</div>
<div id="hc-chat-messages"></div>
<div id="hc-chat-quick">
  <button class="hc-quick-btn" data-q="Prime membership কি?">Prime কি?</button>
  <button class="hc-quick-btn" data-q="চাকরির জন্য কিভাবে apply করব?">Apply করব?</button>
  <button class="hc-quick-btn" data-q="Payment কিভাবে করব?">Payment?</button>
  <button class="hc-quick-btn" data-q="Interview tips">Interview Tips</button>
</div>
<div id="hc-chat-input-row">
  <input id="hc-chat-input" type="text" placeholder="আপনার প্রশ্ন লিখুন..." maxlength="200"/>
  <button id="hc-chat-send" title="Send">
    <svg viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
  </button>
</div>`;

document.body.appendChild(btn);
document.body.appendChild(win);

const messagesEl = document.getElementById('hc-chat-messages');
const inputEl = document.getElementById('hc-chat-input');
let opened = false;

function addMsg(text, role) {
  const div = document.createElement('div');
  div.className = `hc-msg ${role}`;
  div.innerHTML = formatMsg(text);
  messagesEl.appendChild(div);
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

function showTyping() {
  const t = document.createElement('div');
  t.className = 'hc-typing';
  t.id = 'hc-typing';
  t.innerHTML = '<span></span><span></span><span></span>';
  messagesEl.appendChild(t);
  messagesEl.scrollTop = messagesEl.scrollHeight;
}

function removeTyping() {
  const t = document.getElementById('hc-typing');
  if (t) t.remove();
}

function sendMessage(text) {
  const msg = (text || inputEl.value).trim();
  if (!msg) return;
  inputEl.value = '';
  addMsg(msg, 'user');
  showTyping();
  const delay = 600 + Math.random() * 800;
  setTimeout(() => {
    removeTyping();
    addMsg(getResponse(msg), 'bot');
  }, delay);
}

btn.addEventListener('click', () => {
  if (win.style.display === 'flex') {
    win.style.display = 'none';
  } else {
    win.style.display = 'flex';
    win.style.flexDirection = 'column';
    document.getElementById('hc-chat-badge').style.display = 'none';
    if (!opened) {
      opened = true;
      setTimeout(() => addMsg('নমস্কার! 👋 আমি **Hospitality Careers AI Assistant**। আপনাকে চাকরি খোঁজা, Prime Membership, Payment সহ যেকোনো বিষয়ে সাহায্য করতে এসেছি। কিভাবে সাহায্য করতে পারি?', 'bot'), 300);
    }
    setTimeout(() => inputEl.focus(), 100);
  }
});

document.getElementById('hc-chat-close').addEventListener('click', () => { win.style.display = 'none'; });

document.getElementById('hc-chat-send').addEventListener('click', () => sendMessage());

inputEl.addEventListener('keydown', (e) => { if (e.key === 'Enter') sendMessage(); });

document.querySelectorAll('.hc-quick-btn').forEach(b => {
  b.addEventListener('click', () => {
    if (win.style.display !== 'flex') { btn.click(); }
    setTimeout(() => sendMessage(b.dataset.q), 400);
  });
});

// Show badge after 3s (first visit hint)
setTimeout(() => {
  if (!opened) {
    document.getElementById('hc-chat-badge').style.display = 'flex';
  }
}, 3000);

})();
