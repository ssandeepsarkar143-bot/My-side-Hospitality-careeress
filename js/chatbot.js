(function () {
'use strict';

const LANGS = {
  en: { name: 'English', short: 'EN', flag: '🇬🇧' },
  hi: { name: 'हिन्दी', short: 'HI', flag: '🇮🇳' },
  bn: { name: 'বাংলা', short: 'BN', flag: '🟢' }
};

let currentLang = localStorage.getItem('hc_assistant_lang') || 'en';

const KB = [
  {
    keys: /hello|hi\b|hey|good\s*morning|good\s*evening|namaste|হ্যালো|নমস্কার|হেলো|কেমন আছ|হ্যাই|নমস্তে|নমস্কার/i,
    en: "Hello! 👋 I'm **HC Assistant** — your smart guide for Hospitality Careers. How can I help you today?\n\nI can assist with:\n• **Jobs** – Browse & apply\n• **Prime Membership** – Benefits & pricing\n• **Payments** – UPI process\n• **Resume Tips** – Stand out\n• **Interview Prep** – Ace it!",
    hi: "नमस्ते! 👋 मैं **HC Assistant** हूँ। Hospitality Careers पर आपका स्वागत है!\n\nमैं इनमें मदद कर सकता हूँ:\n• **Jobs** – ढूंढें और apply करें\n• **Prime Membership** – फायदे और कीमत\n• **Payment** – UPI प्रक्रिया\n• **Resume Tips** – बेहतर बनाएं\n• **Interview Prep** – तैयारी करें",
    bn: "হ্যালো! 👋 আমি **HC Assistant** — Hospitality Careers এর আপনার AI সহকারী!\n\nআমি এই বিষয়গুলোতে সাহায্য করতে পারি:\n• **চাকরি** – খুঁজুন ও আবেদন করুন\n• **Prime Membership** – সুবিধা ও মূল্য\n• **Payment** – UPI প্রক্রিয়া\n• **Resume Tips** – উন্নত করুন\n• **Interview Prep** – প্রস্তুতি নিন"
  },
  {
    keys: /prime|membership|সদস্যপদ|member|subscription|সদস্য|upgrade|প্রাইম|prime.*member|member.*prime|সদস্যতা/i,
    en: "**Prime Membership 🌟**\n\n✅ See ALL job listings (regular users see limited)\n✅ Download candidate resumes directly\n✅ Get employer's direct phone number\n✅ Priority in job applications\n✅ Exclusive job listings\n✅ Job Alert notifications\n\n💰 **₹499 / month**\n\n👉 Go to **Membership** page to subscribe via UPI.\n\n⏰ Account upgraded within **24 hours** after payment.",
    hi: "**Prime Membership 🌟**\n\n✅ सभी job listings देखें\n✅ Resume download करें\n✅ Employer का direct phone number\n✅ Job applications में priority\n✅ Exclusive job listings\n✅ Job Alert notifications\n\n💰 **₹499 / माह**\n\n👉 **Membership** page पर UPI से subscribe करें।\n\n⏰ Payment के बाद **24 घंटे** में upgrade होगा।",
    bn: "**Prime Membership 🌟**\n\n✅ সমস্ত job listing দেখুন (সাধারণ user সীমিত দেখেন)\n✅ Candidate এর resume সরাসরি download করুন\n✅ Employer এর direct phone number পান\n✅ Job application এ priority\n✅ Exclusive job listing\n✅ Job Alert notification\n\n💰 **মাত্র ₹৪৯৯/মাস**\n\n👉 **Membership** পেজে গিয়ে UPI দিয়ে subscribe করুন।\n\n⏰ Payment এর **২৪ ঘণ্টার** মধ্যে account upgrade হয়।"
  },
  {
    keys: /apply|job apply|আবেদন|application|কিভাবে apply|how to apply|চাকরি.*আবেদন|naukri|apply.*job|job.*apply/i,
    en: "**How to Apply for a Job 📝**\n\n1️⃣ Login to your account\n2️⃣ Go to **Find Job** section\n3️⃣ Use filters: Department, Position, City, Salary\n4️⃣ Click **Apply** on any job card\n5️⃣ Fill your details & upload CV (optional)\n6️⃣ Hit **Submit Application**!\n\n✅ Track your applications in **My Activity** section.\n⭐ **Prime members** get direct employer contact!",
    hi: "**Job Apply कैसे करें 📝**\n\n1️⃣ Account में login करें\n2️⃣ **Find Job** section खोलें\n3️⃣ Filters लगाएं: Department, City, Salary\n4️⃣ Job card पर **Apply** click करें\n5️⃣ Details भरें & CV upload करें\n6️⃣ **Submit Application** click करें!\n\n✅ **My Activity** में applications track करें।\n⭐ **Prime members** को employer का direct contact मिलता है!",
    bn: "**চাকরির জন্য আবেদন কিভাবে করবেন 📝**\n\n1️⃣ Account এ login করুন\n2️⃣ **Find Job** section এ যান\n3️⃣ Filter ব্যবহার করুন: Department, City, Salary\n4️⃣ যেকোনো job card এ **Apply** click করুন\n5️⃣ Details পূরণ করুন ও CV upload করুন\n6️⃣ **Submit Application** click করুন!\n\n✅ **My Activity** তে application track করুন।\n⭐ **Prime member** হলে employer এর direct contact পাবেন!"
  },
  {
    keys: /job alert|alert|notification|notif|চাকরির সতর্কতা|job.*notif|alert.*job|job.*subscribe|নতুন চাকরি/i,
    en: "**Job Alert Feature 🔔**\n\nSave your job preferences and get notified when matching jobs are posted!\n\n**How to set up:**\n1️⃣ Login to your account\n2️⃣ Go to **My Activity** section\n3️⃣ Find **Job Alert** tab\n4️⃣ Choose Department, Location & Salary range\n5️⃣ Click **Save Alert**!\n\n🔔 You'll get in-app notifications when a matching job goes live.",
    hi: "**Job Alert Feature 🔔**\n\nआपकी पसंदीदा job preferences save करें और matching jobs आने पर notification पाएं!\n\n**Setup कैसे करें:**\n1️⃣ Account login करें\n2️⃣ **My Activity** section खोलें\n3️⃣ **Job Alert** tab ढूंढें\n4️⃣ Department, Location & Salary choose करें\n5️⃣ **Save Alert** click करें!\n\n🔔 Matching job आने पर in-app notification मिलेगा।",
    bn: "**Job Alert Feature 🔔**\n\nআপনার পছন্দের job preferences save করুন এবং matching job এলে notification পান!\n\n**কিভাবে set করবেন:**\n1️⃣ Account এ login করুন\n2️⃣ **My Activity** section এ যান\n3️⃣ **Job Alert** tab খুঁজুন\n4️⃣ Department, Location ও Salary range বেছে নিন\n5️⃣ **Save Alert** click করুন!\n\n🔔 Matching job এলেই in-app notification পাবেন।"
  },
  {
    keys: /pay|payment|upi|পেমেন্ট|টাকা|amount|price|fee|ফি|কত টাকা|how much|পেমেন্ট.*কিভাবে|কিভাবে pay/i,
    en: "**Payment Process 💳**\n\n**Step-by-step:**\n1️⃣ Go to **Membership** page\n2️⃣ Click **'Pay with UPI'** or **'Show QR'**\n3️⃣ Pay **₹499** using any UPI app (PhonePe, GPay, Paytm)\n4️⃣ Note the **UTR / Transaction ID**\n5️⃣ Enter UTR on the page & submit\n6️⃣ Admin verifies → you become **Prime** ✅\n\n⏰ Usually verified within **24 hours**.\n\n📌 For latest UPI ID, check the **Membership** page.",
    hi: "**Payment Process 💳**\n\n**Steps:**\n1️⃣ **Membership** page पर जाएं\n2️⃣ **'Pay with UPI'** या **'Show QR'** click करें\n3️⃣ किसी भी UPI app से **₹499** pay करें\n4️⃣ **UTR / Transaction ID** नोट करें\n5️⃣ UTR page पर enter करके submit करें\n6️⃣ Admin verify करेगा → आप **Prime** बन जाएंगे ✅\n\n⏰ **24 घंटे** में verify होता है।\n\n📌 Latest UPI ID के लिए **Membership** page देखें।",
    bn: "**Payment প্রক্রিয়া 💳**\n\n**ধাপে ধাপে:**\n1️⃣ **Membership** পেজে যান\n2️⃣ **'Pay with UPI'** বা **'Show QR'** click করুন\n3️⃣ যেকোনো UPI app দিয়ে **₹৪৯৯** pay করুন (PhonePe, GPay, Paytm)\n4️⃣ **UTR / Transaction ID** note করুন\n5️⃣ UTR page এ দিয়ে submit করুন\n6️⃣ Admin verify করলে → আপনি **Prime** হবেন ✅\n\n⏰ সাধারণত **২৪ ঘণ্টার** মধ্যে verify হয়।\n\n📌 সর্বশেষ UPI ID জানতে **Membership** পেজ দেখুন।"
  },
  {
    keys: /cv|resume|রেজুমে|curriculum|বায়োডাটা|biodata|সিভি|resume.*tip|cv.*tip|resume.*upload|upload.*cv/i,
    en: "**Resume / CV Guide 📄**\n\n**Must-have sections:**\n✅ Full Name, Phone, Email, City\n✅ Professional Summary (2–3 lines)\n✅ Work Experience (latest first)\n✅ Skills & Certifications\n✅ Education\n✅ References (optional)\n\n**Pro tips:**\n• Keep it **1–2 pages max**\n• Mention specific **hotel names & designations**\n• Highlight **customer service** skills\n• Use **simple, clean formatting**\n\n💡 Upload CV in your profile → employers can see it!",
    hi: "**Resume / CV Guide 📄**\n\n**जरूरी sections:**\n✅ नाम, Phone, Email, शहर\n✅ Professional Summary\n✅ Work Experience (नया पहले)\n✅ Skills & Certifications\n✅ Education\n\n**Pro Tips:**\n• **1–2 pages** में रखें\n• Hotel name & designation mention करें\n• **Customer service** skills highlight करें\n\n💡 Profile में CV upload करें → employers देखेंगे!",
    bn: "**Resume / CV Guide 📄**\n\n**অবশ্যই থাকতে হবে:**\n✅ নাম, Phone, Email, শহর\n✅ Professional Summary (২-৩ লাইন)\n✅ কাজের অভিজ্ঞতা (সর্বশেষ আগে)\n✅ Skills ও Certifications\n✅ শিক্ষা\n\n**Pro Tips:**\n• **১-২ পাতার** বেশি না\n• Hotel এর নাম ও designation স্পষ্ট লিখুন\n• **Customer service** skill highlight করুন\n\n💡 Profile এ CV upload করুন → employers দেখতে পাবেন!"
  },
  {
    keys: /hotel|resort|restaurant|hospitality|হোটেল|রেস্টুরেন্ট|spa|catering|department|industry/i,
    en: "**Hospitality Industry Jobs 🏨**\n\n**Departments we cover:**\n• F&B Service (Captain, Steward, Bartender)\n• Kitchen / Culinary (Chef, Cook, Commis)\n• Front Office (Receptionist, Concierge, GSA)\n• Housekeeping (Room Attendant, Supervisor)\n• Sales & Marketing\n• Spa & Wellness\n• Security\n• HR & Training\n\n**Properties:**\n5-Star Hotels, Resorts, Restaurants, Cruise Lines, Airlines Catering\n\n👉 Browse jobs in the **Find Job** section!",
    hi: "**Hospitality Industry Jobs 🏨**\n\n**Departments:**\n• F&B Service\n• Kitchen / Culinary\n• Front Office\n• Housekeeping\n• Sales & Marketing\n• Spa & Wellness\n\n**Properties:**\n5-Star Hotels, Resorts, Restaurants, Cruise\n\n👉 **Find Job** section में browse करें!",
    bn: "**Hospitality Industry Jobs 🏨**\n\n**Departments:**\n• F&B Service (Captain, Steward, Bartender)\n• Kitchen / Culinary (Chef, Cook, Commis)\n• Front Office (Receptionist, GSA)\n• Housekeeping\n• Sales & Marketing\n• Spa & Wellness\n\n**Properties:**\n5-Star Hotels, Resorts, Restaurants, Cruise\n\n👉 **Find Job** section এ browse করুন!"
  },
  {
    keys: /salary|বেতন|pay scale|income|মাইনে|কত বেতন|salary.*range|how much.*earn/i,
    en: "**Salary Guide 💰**\n\n| Level | Range |\n|---|---|\n| Entry Level | ₹8K–₹15K/mo |\n| Mid Level | ₹15K–₹35K/mo |\n| Senior Level | ₹35K–₹80K/mo |\n| Management | ₹80K–₹2L+/mo |\n\n**Varies by:**\n• Star category of hotel\n• City (Metro vs Tier-2)\n• Department\n• Years of experience\n\n💡 Search specific jobs for exact salary details!",
    hi: "**Salary Guide 💰**\n\n• Entry Level: ₹8K–₹15K\n• Mid Level: ₹15K–₹35K\n• Senior Level: ₹35K–₹80K\n• Management: ₹80K–₹2L+\n\nSalary hotel की star category, city और experience पर depend करती है।",
    bn: "**Salary Guide 💰**\n\n• Entry Level: ₹৮K–₹১৫K/মাস\n• Mid Level: ₹১৫K–₹৩৫K/মাস\n• Senior Level: ₹৩৫K–₹৮০K/মাস\n• Management: ₹৮০K–₹২L+/মাস\n\nSalary নির্ভর করে hotel এর star category, city ও অভিজ্ঞতার উপর।\n\n💡 নির্দিষ্ট job search করে সঠিক salary দেখুন!"
  },
  {
    keys: /interview|ইন্টারভিউ|tips|interview.*prep|preparation|साक्षात्कार|কিভাবে interview/i,
    en: "**Interview Tips for Hospitality 🎯**\n\n**Appearance:**\n✅ Full formal dress (groomed, clean)\n✅ Ironed clothes, polished shoes\n✅ Avoid strong perfume\n\n**During Interview:**\n✅ Research the hotel/company first\n✅ Arrive 15 mins early\n✅ Firm handshake & eye contact\n✅ Smile & be courteous\n\n**Common Questions:**\n→ 'Tell me about yourself'\n→ 'Why hospitality?'\n→ 'How do you handle difficult guests?'\n→ 'What's your strength?'\n\n💡 **Be confident, calm and service-oriented!**",
    hi: "**Interview Tips 🎯**\n\n**Appearance:**\n✅ Formal dress\n✅ Groomed & clean\n\n**During:**\n✅ Company research करें\n✅ 15 मिनट पहले पहुंचें\n✅ Eye contact & smile\n\n**Common Questions:**\n→ 'अपने बारे में बताएं'\n→ 'Hospitality क्यों?'\n→ 'Difficult guest को handle?'\n\n💡 आत्मविश्वासी रहें!",
    bn: "**Interview Tips 🎯**\n\n**চেহারা:**\n✅ Full formal dress\n✅ Clean, groomed, ironed\n\n**Interview এ:**\n✅ Hotel/Company সম্পর্কে আগে research করুন\n✅ ১৫ মিনিট আগে পৌঁছান\n✅ Eye contact ও smile\n\n**সাধারণ প্রশ্ন:**\n→ 'নিজের সম্পর্কে বলুন'\n→ 'Hospitality কেন?'\n→ 'কঠিন guest কিভাবে সামলাবেন?'\n\n💡 **আত্মবিশ্বাসী ও সৌজন্যমূলক হন!**"
  },
  {
    keys: /hire|staff|recruit|নিয়োগ|employer|post.*job|job.*post|কর্মী/i,
    en: "**Hire Staff / Post a Job 🏢**\n\n**For Employers:**\n1️⃣ Click **'Post a Job'** in your dashboard\n2️⃣ Fill job details (position, salary, vacancy, location)\n3️⃣ Submit → Admin approves → Job goes LIVE!\n\n**With Prime Membership:**\n✅ Browse candidate profiles\n✅ Download resumes\n✅ Contact candidates directly\n\n📌 Job post is free. **Prime** unlocks full candidate access.",
    hi: "**Staff Hire / Job Post करें 🏢**\n\n**Employers के लिए:**\n1️⃣ Dashboard में **'Post a Job'** click करें\n2️⃣ Details भरें (position, salary, location)\n3️⃣ Submit → Admin approve → Job LIVE!\n\n**Prime के साथ:**\n✅ Candidate profiles देखें\n✅ Resumes download करें\n✅ Direct contact करें",
    bn: "**Staff Hire / Job Post করুন 🏢**\n\n**Employer দের জন্য:**\n1️⃣ Dashboard এ **'Post a Job'** click করুন\n2️⃣ Details দিন (position, salary, location)\n3️⃣ Submit → Admin approve → Job LIVE!\n\n**Prime Membership এ:**\n✅ Candidate profiles দেখুন\n✅ Resume download করুন\n✅ সরাসরি contact করুন\n\n📌 Job post ফ্রি। **Prime** দিয়ে সম্পূর্ণ access পাবেন।"
  },
  {
    keys: /contact|যোগাযোগ|phone|email|address|helpline|সাপোর্ট|support|help.*contact|contact.*us/i,
    en: "**Contact & Support 📞**\n\n📧 **Email:** support@hospitalitycareers.in\n🌐 Visit the **Contact** page for direct messaging\n💬 Use the **Feedback** page for suggestions\n\n**From your Dashboard:**\n• Check **Notifications** for updates\n• Contact Admin through the platform\n\nWe typically respond within **24–48 hours**.",
    hi: "**Contact & Support 📞**\n\n📧 **Email:** support@hospitalitycareers.in\n🌐 **Contact** page पर जाएं\n💬 **Feedback** page use करें\n\nहम **24–48 घंटों** में जवाब देते हैं।",
    bn: "**Contact & Support 📞**\n\n📧 **Email:** support@hospitalitycareers.in\n🌐 **Contact** page এ সরাসরি message করুন\n💬 **Feedback** page এ suggestion দিন\n\nআমরা সাধারণত **২৪-৪৮ ঘণ্টার** মধ্যে reply করি।"
  },
  {
    keys: /login|sign in|password|account|লগইন|পাসওয়ার্ড|forgot|password.*forgot|account.*help|login.*problem/i,
    en: "**Account Help 🔐**\n\n**Forgot Password?**\n→ Click 'Forgot Password?' on the Login page\n→ Enter your email → Reset link sent!\n\n**Google Sign-in issues?**\n→ Refresh browser / clear cache\n→ Try incognito mode\n\n**New here?**\n→ Click **'Create an Account'** on homepage\n→ Or sign in with **Google** (instant!)\n\n**Account locked / issues?**\n→ Email: support@hospitalitycareers.in",
    hi: "**Account Help 🔐**\n\n**Password भूल गए?**\n→ Login page पर 'Forgot Password?' click करें\n→ Email enter करें → Reset link आएगा!\n\n**Google Sign-in problem?**\n→ Browser refresh करें\n→ Incognito mode try करें\n\n**नए user?**\n→ Homepage पर **'Create an Account'** click करें",
    bn: "**Account সমস্যা 🔐**\n\n**Password ভুলে গেছেন?**\n→ Login page এ 'Forgot Password?' click করুন\n→ Email দিন → Reset link আসবে!\n\n**Google Sign-in সমস্যা?**\n→ Browser refresh করুন\n→ Incognito mode try করুন\n\n**নতুন user?**\n→ Homepage থেকে **'Create an Account'** click করুন\n\n**সমস্যা থাকলে:** support@hospitalitycareers.in"
  },
  {
    keys: /thank|ধন্যবাদ|thanks|bye|goodbye|ok|ঠিক আছে|শুভকামনা|best of luck|good luck/i,
    en: "You're welcome! 😊 Feel free to ask anytime.\n\n**Best of luck** with your hospitality career! 🌟\n\n_HC Assistant is here 24/7 for you._",
    hi: "आपका स्वागत है! 😊 कभी भी पूछ सकते हैं।\n\nआपके hospitality career में **शुभकामनाएं**! 🌟",
    bn: "স্বাগতম! 😊 যেকোনো সময় জিজ্ঞেস করুন।\n\nHospitality career এ আপনার জন্য **শুভকামনা**! 🌟\n\n_HC Assistant সবসময় আপনার পাশে।_"
  },
  {
    keys: /কি|what is|কিভাবে|how to|কেন|why|কোথায়|where|কখন|when|বলো|tell me|explain|বুঝাও|details/i,
    en: null,
    hi: null,
    bn: null
  }
];

const DEFAULT = {
  en: "Hmm, I'm not sure about that. 🤔 I can help with:\n\n• **Prime Membership** – Benefits & cost\n• **Job Applications** – How to apply\n• **Payment** – UPI process\n• **Resume Tips** – Stand out\n• **Interview Prep** – Ace the interview\n• **Job Alerts** – Get notified\n• **Contact** – Reach support\n\nTry asking something like: _'How do I apply for a job?'_ or _'What is Prime membership?'_",
  hi: "मुझे समझ नहीं आया। 🤔 मैं इनमें मदद कर सकता हूँ:\n\n• **Prime Membership** – फायदे और कीमत\n• **Job Apply** – कैसे करें\n• **Payment** – UPI प्रक्रिया\n• **Resume Tips**\n• **Interview Prep**\n• **Job Alert**\n\nकुछ और पूछें।",
  bn: "বুঝতে পারিনি। 🤔 আমি এই বিষয়ে সাহায্য করতে পারি:\n\n• **Prime Membership** – সুবিধা ও মূল্য\n• **Job Apply** – কিভাবে করবেন\n• **Payment** – UPI প্রক্রিয়া\n• **Resume Tips**\n• **Interview Prep**\n• **Job Alert**\n• **Contact** – Support\n\nযেমন জিজ্ঞেস করুন: _'চাকরির জন্য কিভাবে apply করব?'_"
};

const QUICK = {
  en: ['Prime Membership?', 'How to apply?', 'Payment steps', 'Interview Tips', 'Job Alert?'],
  hi: ['Prime क्या है?', 'Apply कैसे करें?', 'Payment steps', 'Interview Tips', 'Job Alert?'],
  bn: ['Prime কি?', 'Apply করব কিভাবে?', 'Payment steps', 'Interview Tips', 'Job Alert?']
};
const QUICK_Q = {
  en: ['What is Prime membership?', 'How to apply for a job?', 'How to make payment for Prime?', 'Interview tips for hospitality', 'What is Job Alert feature?'],
  hi: ['Prime membership क्या है?', 'Job apply कैसे करें?', 'Prime के लिए payment कैसे करें?', 'Hospitality interview tips', 'Job Alert feature क्या है?'],
  bn: ['Prime membership কি?', 'চাকরির জন্য কিভাবে apply করব?', 'Prime এর জন্য payment কিভাবে করব?', 'Hospitality interview tips', 'Job Alert feature কি?']
};
const GREET = {
  en: "Hi! 👋 I'm **HC Assistant** — your smart guide.\n\nAsk me about jobs, Prime membership, payments, resume tips & more!",
  hi: "नमस्ते! 👋 मैं **HC Assistant** हूँ।\n\nJobs, Prime membership, payment, resume tips के बारे में पूछें!",
  bn: "হ্যালো! 👋 আমি **HC Assistant**!\n\nচাকরি, Prime membership, payment, resume tips সহ যেকোনো বিষয়ে জিজ্ঞেস করুন!"
};

const LANG_CONFIRM = {
  en: "Assistant language is now set to **English**. You can also type: _set assistant language Bangla_ or _set assistant language Hindi_.",
  hi: "Assistant language अब **हिन्दी** में set हो गई है। आप लिख सकते हैं: _set assistant language English_ या _set assistant language Bangla_।",
  bn: "Assistant language এখন **বাংলা** set করা হয়েছে। আপনি লিখতে পারেন: _set assistant language English_ বা _set assistant language Hindi_।"
};

function getResponse(msg) {
  const chosenLang = detectLangCommand(msg);
  if (chosenLang) {
    setAssistantLang(chosenLang);
    return LANG_CONFIRM[chosenLang] || LANG_CONFIRM.en;
  }
  const m = msg.toLowerCase();
  for (const item of KB) {
    if (item.keys && item.keys.test(msg)) {
      const resp = item[currentLang] || item.en;
      if (resp) return resp;
    }
  }
  return DEFAULT[currentLang] || DEFAULT.en;
}

function detectLangCommand(msg) {
  const m = msg.toLowerCase().trim();
  if (!/(language|lang|ভাষা|ভাষাটা|भाषा|set|change|assistant)/i.test(m)) return null;
  if (/(bangla|bengali|বাংলা|বাঙ্গলা|bangali)/i.test(m)) return 'bn';
  if (/(hindi|हिन्दी|हिंदी)/i.test(m)) return 'hi';
  if (/(english|ইংরেজি|अंग्रेज़ी|angrezi)/i.test(m)) return 'en';
  return null;
}

function formatMsg(text) {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/_(.*?)_/g, '<em>$1</em>')
    .replace(/\n/g, '<br/>');
}

const style = document.createElement('style');
style.textContent = `
#hc-btn{position:fixed;bottom:22px;right:22px;z-index:9999;width:62px;height:62px;border-radius:50%;background:radial-gradient(circle at 35% 25%,#fff8cc 0,#f5d060 30%,#d4af37 64%,#8a6a12 100%);border:1px solid rgba(255,255,255,.32);cursor:pointer;box-shadow:0 10px 34px rgba(212,175,55,0.5),inset 0 2px 12px rgba(255,255,255,.38);display:flex;align-items:center;justify-content:center;transition:transform .2s,box-shadow .2s;user-select:none;animation:hcFloat 3.2s ease-in-out infinite}
#hc-btn::before{content:'';position:absolute;inset:-8px;border-radius:50%;border:1px solid rgba(245,208,96,.45);border-top-color:rgba(255,255,255,.85);animation:hcOrbit 4s linear infinite}
#hc-btn::after{content:'';position:absolute;inset:-14px;border-radius:50%;background:radial-gradient(circle,rgba(212,175,55,.22),transparent 66%);animation:hcAura 2.4s ease-in-out infinite;z-index:-1}
#hc-btn:hover{transform:translateY(-3px) scale(1.08);box-shadow:0 14px 42px rgba(212,175,55,.75),inset 0 2px 12px rgba(255,255,255,.42)}
#hc-btn svg{width:31px;height:31px;fill:#151827;flex-shrink:0;filter:drop-shadow(0 1px 1px rgba(255,255,255,.45));animation:hcBotNod 2.8s ease-in-out infinite;position:relative;z-index:1}
#hc-badge{position:absolute;top:-4px;right:-4px;background:#ef4444;color:#fff;font-size:10px;font-weight:700;width:18px;height:18px;border-radius:50%;display:none;align-items:center;justify-content:center;animation:hcPulse 1.5s infinite}
@keyframes hcPulse{0%,100%{transform:scale(1)}50%{transform:scale(1.2)}}
#hc-win{position:fixed;bottom:90px;right:22px;z-index:9998;width:350px;max-width:calc(100vw - 28px);background:#0d1117;border:1px solid rgba(212,175,55,.25);border-radius:18px;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,.8);display:none;flex-direction:column;max-height:540px;animation:hcSlide .22s ease}
@keyframes hcSlide{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}
@keyframes hcFloat{0%,100%{translate:0 0}50%{translate:0 -6px}}
@keyframes hcOrbit{to{transform:rotate(360deg)}}
@keyframes hcAura{0%,100%{opacity:.45;transform:scale(.9)}50%{opacity:.85;transform:scale(1.08)}}
@keyframes hcBotNod{0%,100%{transform:rotate(0)}35%{transform:rotate(-7deg)}70%{transform:rotate(6deg)}}
#hc-header{background:linear-gradient(135deg,rgba(212,175,55,.16),rgba(212,175,55,.05));border-bottom:1px solid rgba(212,175,55,.2);padding:12px 14px;display:flex;align-items:center;gap:9px;cursor:grab;user-select:none}
#hc-header:active{cursor:grabbing}
#hc-av{width:38px;height:38px;border-radius:50%;background:radial-gradient(circle at 35% 20%,#fff5c2,#d4af37 58%,#8a6a12);display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0;box-shadow:0 0 16px rgba(212,175,55,.55);animation:hcAvatarGlow 2.4s ease-in-out infinite}
@keyframes hcAvatarGlow{0%,100%{box-shadow:0 0 12px rgba(212,175,55,.35)}50%{box-shadow:0 0 24px rgba(212,175,55,.8)}}
#hc-info{flex:1;min-width:0}
#hc-name{font-size:13px;font-weight:700;color:#d4af37}
#hc-status{font-size:10px;color:#22c55e;display:flex;align-items:center;gap:4px}
#hc-status::before{content:'';width:5px;height:5px;border-radius:50%;background:#22c55e;flex-shrink:0;animation:hcGlow 2s infinite}
@keyframes hcGlow{0%,100%{opacity:1}50%{opacity:0.4}}
#hc-close{background:none;border:none;cursor:pointer;color:rgba(255,255,255,.4);font-size:16px;padding:4px 6px;border-radius:6px;flex-shrink:0}
#hc-close:hover{color:#fff;background:rgba(255,255,255,.1)}
#hc-msgs{flex:1;overflow-y:auto;padding:12px;display:flex;flex-direction:column;gap:9px;min-height:200px;max-height:310px;scrollbar-width:thin;scrollbar-color:rgba(212,175,55,.2) transparent}
#hc-msgs::-webkit-scrollbar{width:3px}
#hc-msgs::-webkit-scrollbar-thumb{background:rgba(212,175,55,.25);border-radius:2px}
.hc-msg{max-width:90%;line-height:1.6;font-size:12.5px;border-radius:14px;padding:9px 13px;animation:hcPop .18s ease}
@keyframes hcPop{from{opacity:0;transform:scale(.95)}to{opacity:1;transform:scale(1)}}
.hc-msg.bot{background:rgba(255,255,255,.06);color:rgba(255,255,255,.9);border-bottom-left-radius:4px;align-self:flex-start;border:1px solid rgba(255,255,255,.08)}
.hc-msg.user{background:linear-gradient(135deg,rgba(212,175,55,.28),rgba(212,175,55,.12));color:#fff;border-bottom-right-radius:4px;align-self:flex-end;border:1px solid rgba(212,175,55,.25)}
.hc-typing{display:flex;gap:4px;padding:9px 12px;align-self:flex-start;background:rgba(255,255,255,.04);border-radius:14px;border-bottom-left-radius:4px;border:1px solid rgba(255,255,255,.07)}
.hc-typing span{width:7px;height:7px;border-radius:50%;background:rgba(212,175,55,.7);animation:hcDot 1.2s infinite;display:block}
.hc-typing span:nth-child(2){animation-delay:.2s}.hc-typing span:nth-child(3){animation-delay:.4s}
@keyframes hcDot{0%,60%,100%{transform:translateY(0);opacity:.4}30%{transform:translateY(-6px);opacity:1}}
#hc-quick{padding:0 10px 8px;display:flex;gap:5px;flex-wrap:wrap}
.hc-qb{background:rgba(212,175,55,.08);border:1px solid rgba(212,175,55,.22);color:#d4af37;font-size:11px;padding:4px 10px;border-radius:18px;cursor:pointer;white-space:nowrap;transition:background .15s}
.hc-qb:hover{background:rgba(212,175,55,.22)}
#hc-lang-row{display:flex;gap:5px;align-items:center;padding:8px 10px 0;flex-wrap:wrap}
.hc-lang-chip{background:rgba(255,255,255,.045);border:1px solid rgba(255,255,255,.09);color:rgba(255,255,255,.62);font-size:10px;font-weight:700;padding:4px 8px;border-radius:14px;cursor:pointer}
.hc-lang-chip.active{background:rgba(212,175,55,.18);border-color:rgba(212,175,55,.42);color:#d4af37}
#hc-input-row{display:flex;gap:7px;padding:8px 12px 13px;border-top:1px solid rgba(255,255,255,.06)}
#hc-input{flex:1;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);border-radius:20px;padding:8px 13px;color:#fff;font-size:12.5px;outline:none;font-family:'Poppins',sans-serif}
#hc-input:focus{border-color:rgba(212,175,55,.5)}
#hc-input::placeholder{color:rgba(255,255,255,.28)}
#hc-send{width:36px;height:36px;border-radius:50%;flex-shrink:0;background:linear-gradient(135deg,#d4af37,#f5d060);border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:transform .15s}
#hc-send:hover{transform:scale(1.12)}
#hc-send svg{width:14px;height:14px;fill:#1a1a2e}
#hc-mic,#hc-speaker{width:34px;height:34px;border-radius:50%;flex-shrink:0;background:rgba(255,255,255,.06);border:1px solid rgba(212,175,55,.2);cursor:pointer;color:#d4af37;font-size:13px;display:flex;align-items:center;justify-content:center;transition:all .15s}
#hc-mic:hover,#hc-speaker:hover{background:rgba(212,175,55,.18)}
#hc-mic.recording{background:#ef4444;color:#fff;border-color:#ef4444;animation:hcRec 1s infinite}
#hc-speaker.on{background:rgba(34,197,94,.18);border-color:rgba(34,197,94,.4);color:#22c55e}
@keyframes hcRec{0%,100%{box-shadow:0 0 0 0 rgba(239,68,68,.6)}50%{box-shadow:0 0 0 6px rgba(239,68,68,0)}}
.hc-msg.bot.streaming::after{content:'▊';display:inline-block;animation:hcCursor .8s infinite;color:#d4af37;margin-left:2px}
@keyframes hcCursor{0%,49%{opacity:1}50%,100%{opacity:0}}
@media(max-width:400px){#hc-win{width:calc(100vw - 16px);right:8px;bottom:88px}#hc-btn{width:56px;height:56px}}
`;
document.head.appendChild(style);

const btn = document.createElement('button');
btn.id = 'hc-btn';
btn.title = 'HC AI Assistant';
btn.innerHTML = `<svg viewBox="0 0 64 64" aria-hidden="true"><path d="M21 9h22a5 5 0 0 1 5 5v4h2.5A5.5 5.5 0 0 1 56 23.5v17A5.5 5.5 0 0 1 50.5 46H48v4a5 5 0 0 1-5 5H21a5 5 0 0 1-5-5v-4h-2.5A5.5 5.5 0 0 1 8 40.5v-17A5.5 5.5 0 0 1 13.5 18H16v-4a5 5 0 0 1 5-5Zm3 14a6 6 0 1 0 0 12 6 6 0 0 0 0-12Zm16 0a6 6 0 1 0 0 12 6 6 0 0 0 0-12ZM23 42c2.5 4 15.5 4 18 0a2 2 0 0 0-3.4-2.1c-1.1 1.8-10.1 1.8-11.2 0A2 2 0 1 0 23 42Z"/><path d="M30 4h4v6h-4z"/></svg><span id="hc-badge"></span>`;

const win = document.createElement('div');
win.id = 'hc-win';
win.innerHTML = `
<div id="hc-header">
  <div id="hc-av">🤖</div>
  <div id="hc-info">
    <div id="hc-name">HC Assistant</div>
    <div id="hc-status">Online · Powered by Google Gemini</div>
  </div>
  <button id="hc-close" title="Close">✕</button>
</div>
<div id="hc-msgs"></div>
<div id="hc-lang-row"></div>
<div id="hc-quick"></div>
<div id="hc-input-row">
  <button id="hc-speaker" title="Toggle voice reply" type="button"><i class="fas fa-volume-mute"></i></button>
  <button id="hc-mic" title="Tap to speak" type="button"><i class="fas fa-microphone"></i></button>
  <input id="hc-input" type="text" maxlength="300"/>
  <button id="hc-send"><svg viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg></button>
</div>`;

document.body.appendChild(btn);
document.body.appendChild(win);

const msgsEl = document.getElementById('hc-msgs');
const inputEl = document.getElementById('hc-input');
const quickEl = document.getElementById('hc-quick');
const langRowEl = document.getElementById('hc-lang-row');
const badgeEl = document.getElementById('hc-badge');
let opened = false;

function setAssistantLang(code) {
  if (!LANGS[code]) return;
  currentLang = code;
  localStorage.setItem('hc_assistant_lang', code);
  renderQuick();
  renderLangChips();
  updatePlaceholder();
}

function renderLangChips() {
  langRowEl.innerHTML = Object.entries(LANGS).map(([code, l]) => `<button class="hc-lang-chip ${code === currentLang ? 'active' : ''}" data-lang="${code}" title="${l.name}">${l.flag} ${l.short}</button>`).join('');
  langRowEl.querySelectorAll('.hc-lang-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      setAssistantLang(chip.dataset.lang);
      addMsg(LANG_CONFIRM[currentLang] || LANG_CONFIRM.en, 'bot');
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
      setTimeout(() => sendMsg(b.dataset.q), 300);
    });
  });
}

function updatePlaceholder() {
  const ph = { en: 'Ask me anything...', hi: 'कुछ भी पूछें...', bn: 'যেকোনো প্রশ্ন করুন...' };
  inputEl.placeholder = ph[currentLang] || ph.en;
}

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

const HC_HISTORY = [];

// Phase 6 — Gemini Live AI mix: streaming reply + optional voice
let speakerOn = localStorage.getItem('hc_speaker') === '1';

function setSpeakerUI() {
  const sp = document.getElementById('hc-speaker'); if (!sp) return;
  sp.classList.toggle('on', speakerOn);
  sp.innerHTML = speakerOn ? '<i class="fas fa-volume-up"></i>' : '<i class="fas fa-volume-mute"></i>';
  sp.title = speakerOn ? 'Voice reply ON — click to mute' : 'Voice reply OFF — click to enable';
}

function speakReply(text) {
  if (!speakerOn || !('speechSynthesis' in window) || !text) return;
  try {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text.replace(/[*_`#>]/g, '').slice(0, 600));
    const langTag = currentLang === 'hi' ? 'hi-IN' : currentLang === 'bn' ? 'bn-IN' : 'en-US';
    u.lang = langTag; u.rate = 1; u.pitch = 1;
    window.speechSynthesis.speak(u);
  } catch (_) {}
}

async function sendMsg(text) {
  const msg = (text || inputEl.value).trim();
  if (!msg) return;
  inputEl.value = '';
  addMsg(msg, 'user');
  HC_HISTORY.push({ role: 'user', text: msg });
  showTyping();

  // Try streaming endpoint first
  try {
    const res = await fetch('/api/chat-stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'text/event-stream' },
      body: JSON.stringify({ message: msg, lang: currentLang, history: HC_HISTORY.slice(-8) })
    });
    if (!res.ok || !res.body) throw new Error('stream not ok');
    removeTyping();
    const botDiv = document.createElement('div');
    botDiv.className = 'hc-msg bot streaming';
    botDiv.textContent = '';
    msgsEl.appendChild(botDiv);
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buf = '', full = '', errored = false;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += decoder.decode(value, { stream: true });
      const lines = buf.split('\n');
      buf = lines.pop() || '';
      let curEvent = 'message';
      for (const ln of lines) {
        if (ln.startsWith('event:')) { curEvent = ln.slice(6).trim(); continue; }
        if (!ln.startsWith('data:')) { if (ln === '') curEvent = 'message'; continue; }
        const payload = ln.slice(5).trim();
        if (!payload) continue;
        try {
          const j = JSON.parse(payload);
          if (curEvent === 'error') { errored = true; break; }
          if (j.delta) { full += j.delta; botDiv.innerHTML = formatMsg(full); msgsEl.scrollTop = msgsEl.scrollHeight; }
          if (curEvent === 'done' && j.full) full = j.full;
        } catch (_) {}
        curEvent = 'message';
      }
      if (errored) break;
    }
    botDiv.classList.remove('streaming');
    if (!full || errored) {
      const fb = getResponse(msg);
      botDiv.innerHTML = formatMsg(fb); full = fb;
    } else {
      botDiv.innerHTML = formatMsg(full);
    }
    HC_HISTORY.push({ role: 'bot', text: full });
    speakReply(full);
    return;
  } catch (_) { /* fall back to non-stream */ }

  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: msg, lang: currentLang, history: HC_HISTORY.slice(-8) })
    });
    const data = await res.json();
    removeTyping();
    if (res.ok && data.reply) {
      addMsg(data.reply, 'bot');
      HC_HISTORY.push({ role: 'bot', text: data.reply });
      speakReply(data.reply);
    } else {
      const fb = getResponse(msg);
      addMsg(fb, 'bot'); speakReply(fb);
    }
  } catch (e) {
    removeTyping();
    const fb = getResponse(msg);
    addMsg(fb, 'bot'); speakReply(fb);
  }
}

// Voice input — Web Speech Recognition
let recognition = null, isRecording = false;
function initVoice() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  const micBtn = document.getElementById('hc-mic');
  const spBtn = document.getElementById('hc-speaker');
  if (spBtn) {
    spBtn.addEventListener('click', () => {
      speakerOn = !speakerOn;
      localStorage.setItem('hc_speaker', speakerOn ? '1' : '0');
      setSpeakerUI();
      if (!speakerOn) try { window.speechSynthesis?.cancel(); } catch (_) {}
    });
    setSpeakerUI();
  }
  if (!SR) {
    if (micBtn) { micBtn.style.opacity = '0.4'; micBtn.title = 'Voice input not supported in this browser'; micBtn.disabled = true; }
    return;
  }
  if (!micBtn) return;
  micBtn.addEventListener('click', () => {
    if (isRecording) { try { recognition.stop(); } catch (_) {} return; }
    try {
      recognition = new SR();
      recognition.lang = currentLang === 'hi' ? 'hi-IN' : currentLang === 'bn' ? 'bn-IN' : 'en-US';
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;
      recognition.continuous = false;
      recognition.onstart = () => { isRecording = true; micBtn.classList.add('recording'); inputEl.placeholder = '🎙 Listening…'; };
      recognition.onresult = (ev) => {
        let txt = '';
        for (let i = ev.resultIndex; i < ev.results.length; i++) txt += ev.results[i][0].transcript;
        inputEl.value = txt;
        if (ev.results[ev.results.length - 1].isFinal && txt.trim()) {
          setTimeout(() => sendMsg(txt.trim()), 200);
        }
      };
      recognition.onerror = () => { isRecording = false; micBtn.classList.remove('recording'); updatePlaceholder(); };
      recognition.onend = () => { isRecording = false; micBtn.classList.remove('recording'); updatePlaceholder(); };
      recognition.start();
    } catch (e) {
      isRecording = false; micBtn.classList.remove('recording');
      addMsg('🎙 Microphone error: ' + e.message, 'bot');
    }
  });
}
setTimeout(initVoice, 100);

function ensureOpen() {
  if (win.style.display !== 'flex') btn.click();
}

let isDragging = false, dragStartX, dragStartY, winStartRight, winStartBottom;
function onDragStart(e) {
  if (e.target.closest('#hc-close')) return;
  isDragging = true;
  const rect = win.getBoundingClientRect();
  const vw = window.innerWidth, vh = window.innerHeight;
  const cx = e.touches ? e.touches[0].clientX : e.clientX;
  const cy = e.touches ? e.touches[0].clientY : e.clientY;
  dragStartX = cx; dragStartY = cy;
  winStartRight = vw - rect.right; winStartBottom = vh - rect.bottom;
  win.style.transition = 'none';
  e.preventDefault();
}
function onDragMove(e) {
  if (!isDragging) return;
  const cx = e.touches ? e.touches[0].clientX : e.clientX;
  const cy = e.touches ? e.touches[0].clientY : e.clientY;
  const vw = window.innerWidth, vh = window.innerHeight;
  let nr = winStartRight - (cx - dragStartX);
  let nb = winStartBottom - (cy - dragStartY);
  nr = Math.max(6, Math.min(vw - 60, nr));
  nb = Math.max(6, Math.min(vh - 60, nb));
  win.style.right = nr + 'px'; win.style.bottom = nb + 'px';
}
function onDragEnd() { isDragging = false; win.style.transition = ''; }

const header = document.getElementById('hc-header');
header.addEventListener('mousedown', onDragStart);
header.addEventListener('touchstart', onDragStart, { passive: false });
document.addEventListener('mousemove', onDragMove);
document.addEventListener('touchmove', onDragMove, { passive: false });
document.addEventListener('mouseup', onDragEnd);
document.addEventListener('touchend', onDragEnd);

btn.addEventListener('click', () => {
  if (win.style.display === 'flex') {
    win.style.display = 'none';
  } else {
    win.style.display = 'flex';
    win.style.flexDirection = 'column';
    badgeEl.style.display = 'none';
    if (!opened) {
      opened = true;
      setTimeout(() => addMsg(GREET[currentLang] || GREET.en, 'bot'), 300);
    }
    setTimeout(() => inputEl.focus(), 150);
  }
});

document.getElementById('hc-close').addEventListener('click', (e) => {
  e.stopPropagation();
  win.style.display = 'none';
});
document.getElementById('hc-send').addEventListener('click', () => sendMsg());
inputEl.addEventListener('keydown', (e) => { if (e.key === 'Enter') sendMsg(); });

renderLangChips();
renderQuick();
updatePlaceholder();

setTimeout(() => {
  if (!opened) { badgeEl.style.display = 'flex'; badgeEl.textContent = '1'; }
}, 5000);

window.hcChat = {
  setLang: function(code) {
    setAssistantLang(code);
  },
  open: function() { if (win.style.display !== 'flex') btn.click(); },
  isOpen: function() { return win.style.display === 'flex'; }
};

})();
