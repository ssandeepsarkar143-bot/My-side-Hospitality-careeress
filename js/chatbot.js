(function () {
'use strict';

// ── LANGUAGE DATA ──────────────────────────────────────────────────────────
const LANGS = {
  en: { name: 'English', flag: '🇬🇧' },
  hi: { name: 'हिन्दी', flag: '🇮🇳' },
  bn: { name: 'বাংলা', flag: '🇧🇩' },
  od: { name: 'ଓଡ଼ିଆ', flag: '🏵️' },
  ta: { name: 'தமிழ்', flag: '🌺' }
};

let currentLang = localStorage.getItem('hc_chat_lang') || 'bn';

// ── KNOWLEDGE BASE (multi-language) ────────────────────────────────────────
const KB = {
  greeting: {
    pattern: /^(hello|hi|hey|হ্যালো|নমস্কার|হেলো|কেমন আছ|good\s*morning|good\s*evening|namaste|নমস্কার|হ্যালো|হ্যাই|ওহে)/i,
    en: "Hello! 👋 I'm the Hospitality Careers AI Assistant. How can I help you today?",
    hi: "नमस्ते! 👋 मैं Hospitality Careers का AI Assistant हूँ। आज मैं आपकी कैसे मदद कर सकता हूँ?",
    bn: "হ্যালো! 👋 আমি Hospitality Careers এর AI Assistant। আজ আপনাকে কিভাবে সাহায্য করতে পারি?",
    od: "ନମସ୍କାର! 👋 ମୁଁ Hospitality Careers ର AI Assistant। ଆଜି ଆପଣଙ୍କୁ କିପରି ସାହାଯ୍ୟ କରିପାରିବି?",
    ta: "வணக்கம்! 👋 நான் Hospitality Careers AI Assistant. இன்று உங்களுக்கு எவ்வாறு உதவலாம்?"
  },
  prime: {
    pattern: /prime|membership|সদস্যপদ|member|subscription|सदस्यता|ਮੈਂਬਰਸ਼ਿਪ/i,
    en: "**Prime Membership Benefits 🌟**\n\n✅ View all job listings\n✅ Download candidate resumes\n✅ Direct employer contact\n✅ Priority in job applications\n✅ Exclusive job listings\n\n💰 Fee: ₹499/month\n\nGo to the Membership page to subscribe.",
    hi: "**Prime Membership के फायदे 🌟**\n\n✅ सभी job listings देखें\n✅ Resume download करें\n✅ Employer से direct contact\n✅ Job applications में priority\n\n💰 शुल्क: ₹499/माह\n\nMembership page पर जाएं।",
    bn: "**Prime Membership সুবিধা 🌟**\n\n✅ সমস্ত job listing দেখা\n✅ Resume download করা\n✅ Employer এর সাথে direct contact\n✅ Job application এ priority\n\n💰 মাত্র ₹499/মাস\n\nMembership page এ যান।",
    od: "**Prime Membership ସୁବିଧା 🌟**\n\n✅ ସମସ୍ତ job listing ଦେଖନ୍ତୁ\n✅ Resume download କରନ୍ତୁ\n✅ Employer ସହ direct contact\n\n💰 ₹499/ମାସ\n\nMembership page ଦେଖନ୍ତୁ।",
    ta: "**Prime Membership நன்மைகள் 🌟**\n\n✅ அனைத்து job listings காண\n✅ Resume download\n✅ Employer direct contact\n\n💰 ₹499/மாதம்\n\nMembership page பாருங்கள்."
  },
  apply: {
    pattern: /apply|job apply|চাকরি|আবেদন|application|कैसे apply|naukri|job kaise/i,
    en: "**How to Apply for a Job 📝**\n\n1️⃣ Login to your account\n2️⃣ Browse Jobs section\n3️⃣ Use filters (Department, Position, City)\n4️⃣ Click "Apply Now"\n5️⃣ Upload CV & fill details\n6️⃣ Submit!\n\n⭐ Prime members get direct employer contact.",
    hi: "**Job के लिए Apply कैसे करें 📝**\n\n1️⃣ Account में login करें\n2️⃣ Jobs section browse करें\n3️⃣ Filter लगाएं (Department, City)\n4️⃣ 'Apply Now' click करें\n5️⃣ CV upload करें\n6️⃣ Submit करें!\n\n⭐ Prime members को employer contact मिलता है।",
    bn: "**চাকরির জন্য আবেদন 📝**\n\n1️⃣ Account এ login করুন\n2️⃣ Jobs section এ job খুঁজুন\n3️⃣ Filter ব্যবহার করুন\n4️⃣ 'Apply Now' click করুন\n5️⃣ CV upload করুন\n6️⃣ Submit করুন!\n\n⭐ Prime member হলে employer এর contact সরাসরি পাবেন।",
    od: "**Job ପାଇଁ Apply କରନ୍ତୁ 📝**\n\n1️⃣ Account ରେ login କରନ୍ତୁ\n2️⃣ Jobs section browse କରନ୍ତୁ\n3️⃣ Filter ବ୍ୟବହାର କରନ୍ତୁ\n4️⃣ 'Apply Now' click କରନ୍ତୁ\n5️⃣ CV upload କରନ୍ତୁ\n6️⃣ Submit!",
    ta: "**Job விண்ணப்பிக்க 📝**\n\n1️⃣ Account login\n2️⃣ Jobs பகுதி பாருங்கள்\n3️⃣ Filter பயன்படுத்துங்கள்\n4️⃣ 'Apply Now' click\n5️⃣ CV upload\n6️⃣ Submit!"
  },
  resume: {
    pattern: /cv|resume|রেজুমে|curriculum|বায়োডাটা|biodata|सीवी|रेज्यूमे/i,
    en: "**Resume/CV Tips 📄**\n\n✅ Keep it concise (1-2 pages)\n✅ Highlight hospitality experience\n✅ Mention department & designation\n✅ Include contact number & email\n✅ Add references\n\n💡 Upload your CV in Profile for employers to see.",
    hi: "**Resume/CV Tips 📄**\n\n✅ संक्षिप्त रखें (1-2 page)\n✅ Hospitality experience highlight करें\n✅ Department & designation लिखें\n✅ Contact number & email दें\n✅ References जोड़ें\n\n💡 Profile में CV upload करें।",
    bn: "**Resume/CV টিপস 📄**\n\n✅ সংক্ষিপ্ত রাখুন (১-২ পাতা)\n✅ Hospitality experience highlight করুন\n✅ Department ও designation স্পষ্ট লিখুন\n✅ Contact number ও email দিন\n✅ References যোগ করুন\n\n💡 Profile এ CV upload করুন।",
    od: "**Resume/CV Tips 📄**\n\n✅ ସଂକ୍ଷିପ୍ତ ରଖନ୍ତୁ (1-2 page)\n✅ Hospitality experience highlight\n✅ Contact number ଦିଅନ୍ତୁ\n\n💡 Profile ରେ CV upload କରନ୍ତୁ।",
    ta: "**Resume/CV குறிப்புகள் 📄**\n\n✅ சுருக்கமாக (1-2 பக்கம்)\n✅ Hospitality அனுபவம் முன்னிலைப்படுத்துங்கள்\n✅ தொடர்பு எண் & email\n\n💡 Profile-ல் CV upload செய்யுங்கள்."
  },
  payment: {
    pattern: /pay|payment|upi|পেমেন্ট|টাকা|amount|price|दाम|कितना|fee|ফি/i,
    en: "**Payment Info 💳**\n\nWe accept UPI payments:\n📱 **UPI ID:** ssandeepsarkar143-2@okhdfcbank\n\n**Steps:**\n1️⃣ Go to Membership page\n2️⃣ Click 'Pay with UPI' or 'Show QR'\n3️⃣ Complete payment\n4️⃣ Enter UTR/Transaction ID\n5️⃣ Admin verifies → you become Prime!\n\n⏰ Usually verified within 24 hours.",
    hi: "**Payment की जानकारी 💳**\n\nहम UPI payment accept करते हैं:\n📱 **UPI ID:** ssandeepsarkar143-2@okhdfcbank\n\n**Steps:**\n1️⃣ Membership page जाएं\n2️⃣ 'Pay with UPI' click करें\n3️⃣ Payment करें\n4️⃣ UTR/Transaction ID दें\n5️⃣ Admin verify करेगा!\n\n⏰ 24 घंटे में verify होता है।",
    bn: "**Payment তথ্য 💳**\n\nUPI payment accept করি:\n📱 **UPI ID:** ssandeepsarkar143-2@okhdfcbank\n\n**Steps:**\n1️⃣ Membership page এ যান\n2️⃣ 'Pay with UPI' বা 'Show QR' click করুন\n3️⃣ Payment করুন\n4️⃣ UTR/Transaction ID দিন\n5️⃣ Admin verify করলে Prime হবেন!\n\n⏰ সাধারণত **২৪ ঘণ্টার** মধ্যে verify হয়।",
    od: "**Payment Info 💳**\n\n📱 **UPI ID:** ssandeepsarkar143-2@okhdfcbank\n\n1️⃣ Membership page ଯାଆନ୍ତୁ\n2️⃣ Payment କରନ୍ତୁ\n3️⃣ UTR ID ଦିଅନ୍ତୁ\n4️⃣ Admin verify ରେ Prime ହେବେ!\n\n⏰ 24 ଘଣ୍ଟା ଭିତରେ।",
    ta: "**Payment தகவல் 💳**\n\n📱 **UPI ID:** ssandeepsarkar143-2@okhdfcbank\n\n1️⃣ Membership page செல்லுங்கள்\n2️⃣ Payment செய்யுங்கள்\n3️⃣ UTR ID கொடுங்கள்\n4️⃣ Admin verify → Prime!\n\n⏰ 24 மணி நேரத்தில்."
  },
  hotel: {
    pattern: /hotel|resort|restaurant|hospitality|হোটেল|রেস্টুরেন্ট|spa|catering|होटल|रेस्तरां/i,
    en: "**Hospitality Industry Jobs 🏨**\n\nWe cover:\n• 5-star Hotels & Resorts\n• Restaurants & Cafes\n• Spa & Wellness Centers\n• Catering Services\n• Airlines & Airport Hospitality\n\n**Popular Roles:**\nF&B Captain, Receptionist, Chef, Steward, Housekeeping, Sales & HR\n\nCheck the Jobs section!",
    hi: "**Hospitality Industry Jobs 🏨**\n\nहम cover करते हैं:\n• 5-star Hotels & Resorts\n• Restaurants & Cafes\n• Spa & Wellness\n• Catering Services\n\n**Popular Roles:**\nF&B Captain, Chef, Receptionist, Housekeeping, Sales & HR\n\nJobs section देखें!",
    bn: "**Hospitality Industry Jobs 🏨**\n\nআমাদের platform এ রয়েছে:\n• 5-star Hotels ও Resorts\n• Restaurants ও Cafes\n• Spa ও Wellness Centers\n• Catering Services\n• Airlines Hospitality\n\n**জনপ্রিয় পদ:**\nF&B Captain, Chef, Receptionist, Housekeeping, HR, Sales\n\nJobs section এ দেখুন!",
    od: "**Hospitality Industry Jobs 🏨**\n\n• Hotels & Resorts\n• Restaurants\n• Spa & Wellness\n• Catering\n\nPopular Roles: Chef, F&B Captain, Receptionist\n\nJobs section ଦେଖନ୍ତୁ!",
    ta: "**Hospitality Industry Jobs 🏨**\n\n• Hotels & Resorts\n• Restaurants\n• Spa & Wellness\n• Catering\n\nPopular Roles: Chef, F&B Captain, Receptionist\n\nJobs பகுதி பாருங்கள்!"
  },
  salary: {
    pattern: /salary|বেতন|pay scale|compensation|income|आय|वेतन|মাইনে/i,
    en: "**Salary Guide 💰**\n\n• Entry Level: ₹8,000–₹15,000\n• Mid Level: ₹15,000–₹35,000\n• Senior Level: ₹35,000–₹80,000+\n• Management: ₹80,000–₹2,00,000+\n\nDepends on star category, city, experience & department. Search specific jobs for salary details.",
    hi: "**Salary Guide 💰**\n\n• Entry Level: ₹8,000–₹15,000\n• Mid Level: ₹15,000–₹35,000\n• Senior Level: ₹35,000–₹80,000+\n• Management: ₹80,000–₹2,00,000+\n\nSalary hotel की star category, city और experience पर depend करती है।",
    bn: "**Salary Guide 💰**\n\n• Entry Level: ₹৮,০০০–₹১৫,০০০\n• Mid Level: ₹১৫,০০০–₹৩৫,০০০\n• Senior Level: ₹৩৫,০০০–₹৮০,০০০+\n• Management: ₹৮০,০০০–₹২,০০,০০০+\n\nSalary নির্ভর করে hotel এর star category, city ও experience এর উপর।",
    od: "**Salary Guide 💰**\n\n• Entry: ₹8K–₹15K\n• Mid: ₹15K–₹35K\n• Senior: ₹35K–₹80K+\n• Management: ₹80K+\n\nStar category ଓ city ଉପରେ depend ।",
    ta: "**Salary Guide 💰**\n\n• Entry: ₹8K–₹15K\n• Mid: ₹15K–₹35K\n• Senior: ₹35K–₹80K+\n• Management: ₹80K+\n\nStar category மற்றும் நகரத்தை பொறுத்தது."
  },
  interview: {
    pattern: /interview|ইন্টারভিউ|tips|preparation|interview.*tip|साक्षात्कार|इंटरव्यू/i,
    en: "**Interview Tips 🎯**\n\n✅ Professional dress (formal attire)\n✅ Research the hotel/company\n✅ Focus on grooming & body language\n✅ Highlight customer service skills\n✅ Practice common questions:\n   → 'Tell me about yourself'\n   → 'Why hospitality?'\n   → 'How do you handle difficult guests?'\n\n💡 Be confident and courteous!",
    hi: "**Interview Tips 🎯**\n\n✅ Professional dress पहनें\n✅ Hotel/Company research करें\n✅ Grooming & body language पर ध्यान दें\n✅ Customer service skills highlight करें\n✅ Common questions practice करें:\n   → 'अपने बारे में बताएं'\n   → 'Hospitality क्यों?'\n\n💡 आत्मविश्वासी रहें!",
    bn: "**Interview Tips 🎯**\n\n✅ Professional dress code (formal)\n✅ Hotel/Company সম্পর্কে research করুন\n✅ Grooming ও body language তে মনোযোগ দিন\n✅ Customer service skill highlight করুন\n✅ Common questions practice করুন:\n   → 'নিজের সম্পর্কে বলুন'\n   → 'Hospitality কেন?'\n   → 'কঠিন guest কিভাবে handle করবেন?'\n\n💡 আত্মবিশ্বাসী ও সৌজন্যমূলক হন!",
    od: "**Interview Tips 🎯**\n\n✅ Professional dress\n✅ Hotel/Company research\n✅ Grooming ও body language\n✅ Customer service highlight\n\n💡 ଆତ୍ମବିଶ୍ୱାସୀ ରୁହନ୍ତୁ!",
    ta: "**Interview Tips 🎯**\n\n✅ Professional உடை\n✅ Hotel/Company ஆராய்ச்சி\n✅ Grooming & body language\n✅ Customer service highlight\n\n💡 தன்னம்பிக்கையாக இருங்கள்!"
  },
  contact: {
    pattern: /contact|যোগাযোগ|phone|email|address|ঠিকানা|helpline|संपर्क|हेल्पलाइन/i,
    en: "**Contact Us 📞**\n\n🌐 Visit our Contact page for details\n📧 Use the Feedback form on feedback.html\n💬 You can also message us through the platform\n\nOr contact the Admin through your dashboard.",
    hi: "**Contact करें 📞**\n\n🌐 Contact page देखें\n📧 Feedback form use करें\n💬 Dashboard से Admin को message करें",
    bn: "**যোগাযোগ করুন 📞**\n\n🌐 Contact page দেখুন\n📧 Feedback form ব্যবহার করুন\n💬 Dashboard থেকে Admin এ message করুন",
    od: "**Contact 📞**\n\n🌐 Contact page ଦେଖନ୍ତୁ\n📧 Feedback form ବ୍ୟବହାର କରନ୍ତୁ",
    ta: "**தொடர்பு கொள்ளுங்கள் 📞**\n\n🌐 Contact page பாருங்கள்\n📧 Feedback form பயன்படுத்துங்கள்"
  },
  login: {
    pattern: /login|sign in|password|account|লগইন|পাসওয়ার্ড|forgot|भूल गया|पासवर्ड/i,
    en: "**Account Help 🔐**\n\n• **Forgot Password?** Click 'Forgot Password' on login page\n• **Google Sign-in issues?** Refresh browser\n• **Account locked?** Use Contact page\n\nNew user? Sign Up from the homepage.",
    hi: "**Account Help 🔐**\n\n• **Password भूल गए?** Login page पर 'Forgot Password' click करें\n• **Google Sign-in problem?** Browser refresh करें\n• **Account locked?** Contact page use करें\n\nनए user? Homepage पर Sign Up करें।",
    bn: "**Account সমস্যা 🔐**\n\n• **Password ভুলে গেছেন?** Login page এ 'Forgot Password' click করুন\n• **Google Sign-in সমস্যা?** Browser refresh করুন\n• **Account lock?** Contact page এ জানান\n\nনতুন user? Homepage থেকে Sign Up করুন।",
    od: "**Account Help 🔐**\n\n• Password ଭୁଲ? Login page ରେ 'Forgot Password'\n• Browser refresh କରନ୍ତୁ\n\nNew user? Homepage ରୁ Sign Up।",
    ta: "**Account உதவி 🔐**\n\n• Password மறந்தீர்களா? 'Forgot Password' click\n• Browser refresh செய்யுங்கள்\n\nNew user? Homepage-ல் Sign Up."
  },
  employer: {
    pattern: /employer|hire|staff|recruit|নিয়োগ|कर्मचारी|employee|जनशक्ति|staff hire/i,
    en: "**Hire Staff 🏢**\n\n1️⃣ Post a Job (Job Post Form)\n2️⃣ Browse candidate profiles\n3️⃣ Request resume download (Prime)\n4️⃣ Contact candidates directly\n\nOnce job is approved, all candidates can see it. Use 'Post a Job' option.",
    hi: "**Staff Hire करें 🏢**\n\n1️⃣ Job post करें\n2️⃣ Candidate profiles browse करें\n3️⃣ Resume download request (Prime)\n4️⃣ Direct contact करें\n\nJob approve होने पर candidates देख सकते हैं।",
    bn: "**Staff Hire করুন 🏢**\n\n1️⃣ Job post করুন\n2️⃣ Candidate profiles browse করুন\n3️⃣ Resume download request করুন (Prime)\n4️⃣ Direct contact করুন\n\nJob approve হলে সব candidates দেখতে পাবে।",
    od: "**Staff Hire 🏢**\n\n1️⃣ Job post\n2️⃣ Candidates browse\n3️⃣ Resume request (Prime)\n4️⃣ Contact\n\nJob approve ହେଲେ candidates ଦେଖିପାରିବେ।",
    ta: "**Staff Hire 🏢**\n\n1️⃣ Job post\n2️⃣ Candidate profiles\n3️⃣ Resume request (Prime)\n4️⃣ Direct contact\n\nJob approve ஆனால் candidates பார்க்கலாம்."
  },
  thank: {
    pattern: /thank|ধন্যবাদ|thanks|bye|goodbye|ok|ঠিক আছে|ধন্যবাদ|शुक्रिया|धन्यवाद/i,
    en: "Thank you! Feel free to ask anytime. Wishing you success in your hospitality career! 🌟",
    hi: "धन्यवाद! कभी भी पूछ सकते हैं। आपके hospitality career में शुभकामनाएं! 🌟",
    bn: "ধন্যবাদ! যেকোনো প্রশ্নে জিজ্ঞেস করুন। Hospitality career এ শুভকামনা! 🌟",
    od: "ଧନ୍ୟବାଦ! ଯେକୌଣସି ସମୟ ପଚାରନ୍ତୁ। ଶୁଭକାମନା! 🌟",
    ta: "நன்றி! எப்போது வேண்டுமானாலும் கேளுங்கள். வாழ்த்துக்கள்! 🌟"
  },
  default: {
    en: "I didn't quite understand that. I can help with:\n\n• **Prime Membership** info\n• **Job Application** process\n• **Payment** details\n• **Interview Tips**\n• **Salary Guide**\n• **Hire Staff**\n\nPlease rephrase your question.",
    hi: "मैं समझ नहीं पाया। मैं इन विषयों में मदद कर सकता हूँ:\n\n• **Prime Membership**\n• **Job Apply** कैसे करें\n• **Payment** जानकारी\n• **Interview Tips**\n• **Salary Guide**\n\nफिर से पूछें।",
    bn: "আপনার প্রশ্নটি বুঝতে পারিনি। নিচের বিষয়গুলো সম্পর্কে সাহায্য করতে পারি:\n\n• **Prime Membership**\n• **চাকরির আবেদন**\n• **Payment** তথ্য\n• **Interview Tips**\n• **Salary Guide**\n\nআরেকটু বিস্তারিত লিখুন।",
    od: "ମୁଁ ବୁଝିପାରିଲି ନାହିଁ। ଏଗୁଡ଼ିକ ବିଷୟରେ ସାହାଯ୍ୟ ମିଳିବ:\n\n• Prime Membership\n• Job Apply\n• Payment\n• Interview Tips\n\nଆଉ ଥରେ ଚେଷ୍ଟା କରନ୍ତୁ।",
    ta: "புரியவில்லை. கீழே உதவ முடியும்:\n\n• Prime Membership\n• Job Apply\n• Payment\n• Interview Tips\n\nமீண்டும் கேளுங்கள்."
  }
};

const QUICK = {
  en: ['Prime Membership?', 'How to apply?', 'Payment info', 'Interview Tips'],
  hi: ['Prime क्या है?', 'Apply कैसे करें?', 'Payment कैसे?', 'Interview Tips'],
  bn: ['Prime কি?', 'Apply করব কিভাবে?', 'Payment কিভাবে?', 'Interview Tips'],
  od: ['Prime କ\'ଣ?', 'Apply କିପରି?', 'Payment?', 'Interview Tips'],
  ta: ['Prime என்ன?', 'Apply எப்படி?', 'Payment?', 'Interview Tips']
};

const QUICK_Q = {
  en: ['What is Prime membership?', 'How to apply for a job?', 'How to make payment?', 'Interview tips for hospitality'],
  hi: ['Prime membership क्या है?', 'Job के लिए apply कैसे करें?', 'Payment कैसे करें?', 'Interview tips'],
  bn: ['Prime membership কি?', 'চাকরির জন্য কিভাবে apply করব?', 'Payment কিভাবে করব?', 'Interview tips'],
  od: ['Prime membership କ\'ଣ?', 'Job apply କିପରି?', 'Payment?', 'Interview tips'],
  ta: ['Prime membership என்ன?', 'Job apply எப்படி?', 'Payment எப்படி?', 'Interview tips']
};

const GREET = {
  en: "Hello! 👋 I'm the **HC Assistant**. Ask me about jobs, Prime membership, payments & more!",
  hi: "नमस्ते! 👋 मैं **HC Assistant** हूँ। Jobs, Prime membership, payments के बारे में पूछें!",
  bn: "হ্যালো! 👋 আমি **HC Assistant**। চাকরি, Prime membership, payment সহ যেকোনো বিষয়ে জিজ্ঞেস করুন!",
  od: "ନମସ୍କାର! 👋 ମୁଁ **HC Assistant**। Jobs, Prime membership ବିଷୟରେ ପଚାରନ୍ତୁ!",
  ta: "வணக்கம்! 👋 நான் **HC Assistant**. Jobs, Prime membership பற்றி கேளுங்கள்!"
};

function getResponse(msg) {
  const keys = Object.keys(KB).filter(k => k !== 'default');
  for (const key of keys) {
    if (KB[key].pattern && KB[key].pattern.test(msg)) {
      return KB[key][currentLang] || KB[key].en;
    }
  }
  return KB.default[currentLang] || KB.default.en;
}

function formatMsg(text) {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br/>');
}

// ── STYLES ─────────────────────────────────────────────────────────────────
const style = document.createElement('style');
style.textContent = `
#hc-btn{position:fixed;bottom:22px;right:22px;z-index:9999;width:54px;height:54px;border-radius:50%;background:linear-gradient(135deg,#d4af37,#f5d060);border:none;cursor:pointer;box-shadow:0 4px 22px rgba(212,175,55,0.5);display:flex;align-items:center;justify-content:center;transition:transform .2s,box-shadow .2s;user-select:none}
#hc-btn:hover{transform:scale(1.1);box-shadow:0 6px 30px rgba(212,175,55,.7)}
#hc-btn svg{width:24px;height:24px;fill:#1a1a2e;flex-shrink:0}
#hc-badge{position:absolute;top:-4px;right:-4px;background:#ef4444;color:#fff;font-size:10px;font-weight:700;width:18px;height:18px;border-radius:50%;display:flex;align-items:center;justify-content:center;display:none}
#hc-win{position:fixed;bottom:86px;right:22px;z-index:9998;width:340px;max-width:calc(100vw - 28px);background:#0d1117;border:1px solid rgba(212,175,55,.25);border-radius:18px;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,.75);display:none;flex-direction:column;max-height:530px;animation:hcSlide .22s ease}
@keyframes hcSlide{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
#hc-header{background:linear-gradient(135deg,rgba(212,175,55,.14),rgba(212,175,55,.05));border-bottom:1px solid rgba(212,175,55,.2);padding:12px 14px;display:flex;align-items:center;gap:9px;cursor:grab;user-select:none}
#hc-header:active{cursor:grabbing}
#hc-av{width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,#d4af37,#f5d060);display:flex;align-items:center;justify-content:center;font-size:17px;flex-shrink:0}
#hc-info{flex:1;min-width:0}
#hc-name{font-size:13px;font-weight:700;color:#d4af37}
#hc-status{font-size:10px;color:#22c55e;display:flex;align-items:center;gap:4px}
#hc-status::before{content:'';width:5px;height:5px;border-radius:50%;background:#22c55e;flex-shrink:0}
#hc-lang-btn{background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.15);color:#fff;font-size:11px;padding:3px 8px;border-radius:10px;cursor:pointer;white-space:nowrap;flex-shrink:0}
#hc-lang-btn:hover{background:rgba(212,175,55,.15)}
#hc-close{background:none;border:none;cursor:pointer;color:rgba(255,255,255,.45);font-size:16px;padding:4px;border-radius:4px;flex-shrink:0;line-height:1}
#hc-close:hover{color:#fff;background:rgba(255,255,255,.08)}
#hc-lang-panel{display:none;padding:10px 14px;border-bottom:1px solid rgba(255,255,255,.06);background:rgba(255,255,255,.02)}
#hc-lang-panel .hc-lp-title{font-size:11px;color:rgba(255,255,255,.5);margin-bottom:8px;letter-spacing:.5px}
.hc-lang-option{display:inline-flex;align-items:center;gap:5px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);color:rgba(255,255,255,.8);font-size:12px;padding:5px 10px;border-radius:18px;cursor:pointer;margin:3px;transition:background .15s}
.hc-lang-option:hover,.hc-lang-option.active{background:rgba(212,175,55,.2);border-color:rgba(212,175,55,.4);color:#d4af37}
#hc-msgs{flex:1;overflow-y:auto;padding:12px;display:flex;flex-direction:column;gap:9px;min-height:200px;max-height:300px;scrollbar-width:thin;scrollbar-color:rgba(212,175,55,.2) transparent}
#hc-msgs::-webkit-scrollbar{width:3px}
#hc-msgs::-webkit-scrollbar-thumb{background:rgba(212,175,55,.2);border-radius:2px}
.hc-msg{max-width:88%;line-height:1.55;font-size:12.5px;border-radius:14px;padding:9px 12px;animation:hcPop .18s ease}
@keyframes hcPop{from{opacity:0;transform:scale(.95)}to{opacity:1;transform:scale(1)}}
.hc-msg.bot{background:rgba(255,255,255,.06);color:rgba(255,255,255,.9);border-bottom-left-radius:4px;align-self:flex-start;border:1px solid rgba(255,255,255,.07)}
.hc-msg.user{background:linear-gradient(135deg,rgba(212,175,55,.25),rgba(212,175,55,.1));color:#fff;border-bottom-right-radius:4px;align-self:flex-end;border:1px solid rgba(212,175,55,.2)}
.hc-typing{display:flex;gap:4px;padding:9px 12px;align-self:flex-start;background:rgba(255,255,255,.04);border-radius:14px;border-bottom-left-radius:4px;border:1px solid rgba(255,255,255,.07)}
.hc-typing span{width:6px;height:6px;border-radius:50%;background:rgba(212,175,55,.6);animation:hcDot 1.2s infinite;display:block}
.hc-typing span:nth-child(2){animation-delay:.2s}.hc-typing span:nth-child(3){animation-delay:.4s}
@keyframes hcDot{0%,60%,100%{transform:translateY(0);opacity:.4}30%{transform:translateY(-5px);opacity:1}}
#hc-quick{padding:0 12px 8px;display:flex;gap:5px;flex-wrap:wrap}
.hc-qb{background:rgba(212,175,55,.09);border:1px solid rgba(212,175,55,.22);color:#d4af37;font-size:11px;padding:4px 9px;border-radius:18px;cursor:pointer;white-space:nowrap;transition:background .15s}
.hc-qb:hover{background:rgba(212,175,55,.2)}
#hc-input-row{display:flex;gap:7px;padding:8px 12px 13px;border-top:1px solid rgba(255,255,255,.06)}
#hc-input{flex:1;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);border-radius:20px;padding:8px 13px;color:#fff;font-size:12.5px;outline:none;font-family:'Poppins',sans-serif}
#hc-input:focus{border-color:rgba(212,175,55,.4)}
#hc-input::placeholder{color:rgba(255,255,255,.3)}
#hc-send{width:36px;height:36px;border-radius:50%;flex-shrink:0;background:linear-gradient(135deg,#d4af37,#f5d060);border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:transform .15s}
#hc-send:hover{transform:scale(1.1)}
#hc-send svg{width:14px;height:14px;fill:#1a1a2e}
@media(max-width:400px){#hc-win{width:calc(100vw - 14px);right:7px;bottom:80px}}
`;
document.head.appendChild(style);

// ── BUILD HTML ──────────────────────────────────────────────────────────────
const btn = document.createElement('button');
btn.id = 'hc-btn';
btn.title = 'AI Assistant';
btn.innerHTML = `<svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/></svg><span id="hc-badge"></span>`;

const win = document.createElement('div');
win.id = 'hc-win';
win.innerHTML = `
<div id="hc-header">
  <div id="hc-av">🤖</div>
  <div id="hc-info">
    <div id="hc-name">HC Assistant</div>
    <div id="hc-status">Online</div>
  </div>
  <button id="hc-lang-btn" title="Change Language">🌐 Lang</button>
  <button id="hc-close" title="Close">✕</button>
</div>
<div id="hc-lang-panel">
  <div class="hc-lp-title">SELECT LANGUAGE</div>
  <div id="hc-lang-options"></div>
</div>
<div id="hc-msgs"></div>
<div id="hc-quick"></div>
<div id="hc-input-row">
  <input id="hc-input" type="text" maxlength="300"/>
  <button id="hc-send"><svg viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg></button>
</div>`;

document.body.appendChild(btn);
document.body.appendChild(win);

// ── REFS ────────────────────────────────────────────────────────────────────
const msgsEl = document.getElementById('hc-msgs');
const inputEl = document.getElementById('hc-input');
const quickEl = document.getElementById('hc-quick');
const langPanelEl = document.getElementById('hc-lang-panel');
const langOptsEl = document.getElementById('hc-lang-options');
const badgeEl = document.getElementById('hc-badge');
let opened = false;

// ── LANGUAGE SETUP ──────────────────────────────────────────────────────────
function renderLangOptions() {
  langOptsEl.innerHTML = Object.keys(LANGS).map(code => `
    <span class="hc-lang-option ${code === currentLang ? 'active' : ''}" data-lang="${code}">
      ${LANGS[code].flag} ${LANGS[code].name}
    </span>`).join('');
  langOptsEl.querySelectorAll('.hc-lang-option').forEach(el => {
    el.addEventListener('click', () => {
      currentLang = el.dataset.lang;
      localStorage.setItem('hc_chat_lang', currentLang);
      renderLangOptions();
      renderQuick();
      updatePlaceholder();
      document.getElementById('hc-lang-btn').textContent = `${LANGS[currentLang].flag} ${LANGS[currentLang].name}`;
    });
  });
}

function renderQuick() {
  const qs = QUICK[currentLang] || QUICK.en;
  const qq = QUICK_Q[currentLang] || QUICK_Q.en;
  quickEl.innerHTML = qs.map((q, i) => `<button class="hc-qb" data-q="${qq[i]}">${q}</button>`).join('');
  quickEl.querySelectorAll('.hc-qb').forEach(b => {
    b.addEventListener('click', () => {
      ensureOpen();
      setTimeout(() => sendMsg(b.dataset.q), 350);
    });
  });
}

function updatePlaceholder() {
  const ph = {en:'Type your question...', hi:'अपना सवाल लिखें...', bn:'প্রশ্ন লিখুন...', od:'ଆପଣଙ୍କ ପ୍ରଶ୍ନ...', ta:'உங்கள் கேள்வி...'};
  inputEl.placeholder = ph[currentLang] || ph.en;
}

// ── MESSAGES ────────────────────────────────────────────────────────────────
function addMsg(text, role) {
  const div = document.createElement('div');
  div.className = `hc-msg ${role}`;
  div.innerHTML = formatMsg(text);
  msgsEl.appendChild(div);
  msgsEl.scrollTop = msgsEl.scrollHeight;
}

function showTyping() {
  const t = document.createElement('div');
  t.className = 'hc-typing'; t.id = 'hc-typing';
  t.innerHTML = '<span></span><span></span><span></span>';
  msgsEl.appendChild(t); msgsEl.scrollTop = msgsEl.scrollHeight;
}

function removeTyping() { const t = document.getElementById('hc-typing'); if(t) t.remove(); }

function sendMsg(text) {
  const msg = (text || inputEl.value).trim();
  if (!msg) return;
  inputEl.value = '';
  addMsg(msg, 'user');
  showTyping();
  setTimeout(() => { removeTyping(); addMsg(getResponse(msg), 'bot'); }, 550 + Math.random() * 700);
}

function ensureOpen() {
  if (win.style.display !== 'flex') btn.click();
}

// ── DRAGGABLE ───────────────────────────────────────────────────────────────
let isDragging = false, dragStartX, dragStartY, winStartRight, winStartBottom;

function onDragStart(e) {
  if (e.target.closest('#hc-close') || e.target.closest('#hc-lang-btn') || e.target.closest('#hc-lang-options')) return;
  isDragging = true;
  const rect = win.getBoundingClientRect();
  const vw = window.innerWidth, vh = window.innerHeight;
  const clientX = e.touches ? e.touches[0].clientX : e.clientX;
  const clientY = e.touches ? e.touches[0].clientY : e.clientY;
  dragStartX = clientX;
  dragStartY = clientY;
  winStartRight = vw - rect.right;
  winStartBottom = vh - rect.bottom;
  win.style.transition = 'none';
  e.preventDefault();
}

function onDragMove(e) {
  if (!isDragging) return;
  const clientX = e.touches ? e.touches[0].clientX : e.clientX;
  const clientY = e.touches ? e.touches[0].clientY : e.clientY;
  const dx = clientX - dragStartX;
  const dy = clientY - dragStartY;
  const rect = win.getBoundingClientRect();
  const vw = window.innerWidth, vh = window.innerHeight;
  let newRight = winStartRight - dx;
  let newBottom = winStartBottom - dy;
  newRight = Math.max(6, Math.min(vw - 60, newRight));
  newBottom = Math.max(6, Math.min(vh - 60, newBottom));
  win.style.right = newRight + 'px';
  win.style.bottom = newBottom + 'px';
}

function onDragEnd() { isDragging = false; win.style.transition = ''; }

const header = document.getElementById('hc-header');
header.addEventListener('mousedown', onDragStart);
header.addEventListener('touchstart', onDragStart, { passive: false });
document.addEventListener('mousemove', onDragMove);
document.addEventListener('touchmove', onDragMove, { passive: false });
document.addEventListener('mouseup', onDragEnd);
document.addEventListener('touchend', onDragEnd);

// ── EVENTS ──────────────────────────────────────────────────────────────────
btn.addEventListener('click', () => {
  if (win.style.display === 'flex') {
    win.style.display = 'none';
  } else {
    win.style.display = 'flex';
    win.style.flexDirection = 'column';
    badgeEl.style.display = 'none';
    if (!opened) {
      opened = true;
      setTimeout(() => addMsg(GREET[currentLang] || GREET.en, 'bot'), 280);
    }
    setTimeout(() => inputEl.focus(), 120);
  }
});

document.getElementById('hc-close').addEventListener('click', (e) => {
  e.stopPropagation();
  win.style.display = 'none';
});

document.getElementById('hc-lang-btn').addEventListener('click', (e) => {
  e.stopPropagation();
  langPanelEl.style.display = langPanelEl.style.display === 'block' ? 'none' : 'block';
});

document.getElementById('hc-send').addEventListener('click', () => sendMsg());
inputEl.addEventListener('keydown', (e) => { if (e.key === 'Enter') sendMsg(); });

// ── INIT ────────────────────────────────────────────────────────────────────
renderLangOptions();
renderQuick();
updatePlaceholder();
document.getElementById('hc-lang-btn').textContent = `${LANGS[currentLang].flag} ${LANGS[currentLang].name}`;

// Show badge after 4s
setTimeout(() => { if (!opened) { badgeEl.style.display = 'flex'; badgeEl.textContent = '1'; } }, 4000);

})();
