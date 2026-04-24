(function () {
'use strict';

// ── TRANSLATIONS ────────────────────────────────────────────────────────────
const T = {
  en: {
    // Navbar
    'nav.home': 'Home',
    'nav.about': 'About',
    'nav.contact': 'Contact',
    'nav.feedback': 'Feedback',
    'nav.help': 'Help',
    'nav.logout': 'Logout',
    'nav.login': 'Login',
    'nav.signup': 'Create an Account',
    'nav.notifications': 'Notifications',
    'nav.profile': 'Profile',
    // Roles
    'role.user': 'User',
    'role.prime': 'Prime',
    'role.admin': 'Admin',
    'role.owner': 'Owner',
    // Login
    'login.title': 'Hospitality Careers',
    'login.subtitle': 'YOUR GATEWAY TO HOSPITALITY JOBS',
    'login.email': 'EMAIL ADDRESS',
    'login.password': 'PASSWORD',
    'login.forgot': 'Forgot Password?',
    'login.btn': 'Login',
    'login.or': 'or',
    'login.google': 'Continue with Google',
    'login.noacc': "Don't have an account?",
    'login.signup': 'Create an Account',
    // Modes
    'mode.find': 'Find Job',
    'mode.hire': 'Hire Staff',
    'mode.post': 'My Posts',
    // Sections
    'sec.myApplications': 'My Applications',
    'sec.myPosts': 'My Job Posts',
    'sec.membership': 'Membership',
    'sec.notifications': 'Notifications',
    // Jobs
    'job.apply': 'Apply Now',
    'job.request': 'Request',
    'job.download': 'Download Resume',
    'job.contact': 'Contact Info',
    'job.connect': 'Connect Employer',
    'job.status': 'Status',
    'job.date': 'Date',
    'job.title': 'Job Title',
    'job.action': 'Action',
    'job.pending': 'Pending',
    'job.approved': 'Approved',
    'job.hired': 'Hired',
    'job.rejected': 'Rejected',
    // Membership
    'mem.upgrade': 'Upgrade to Prime',
    'mem.pay': 'Pay with UPI',
    'mem.history': 'Membership History',
    // Common
    'btn.submit': 'Submit',
    'btn.cancel': 'Cancel',
    'btn.close': 'Close',
    'btn.save': 'Save',
    'btn.upload': 'Upload',
    'btn.filter': 'Filter',
    'btn.search': 'Search',
    'loading': 'Loading...',
    'no.data': 'No data found',
    'no.jobs': 'No jobs found',
    'no.apps': 'No applications yet',
    'no.posts': 'No job posts yet',
    // Footer
    'footer.rights': '© 2024 Hospitality Careers. All rights reserved.',
    // About
    'about.title': 'About Us',
    'about.hero': 'Building Careers in Hospitality',
    'about.mission': 'Our Mission',
    'about.team': 'Our Team',
    'about.founder': 'Founder & CEO',
    'about.cofounder': 'Co-Founder',
    'about.opmanager': 'Operation Manager',
  },
  hi: {
    'nav.home': 'होम',
    'nav.about': 'हमारे बारे में',
    'nav.contact': 'संपर्क',
    'nav.feedback': 'फ़ीडबैक',
    'nav.help': 'मदद',
    'nav.logout': 'लॉगआउट',
    'nav.login': 'लॉगिन',
    'nav.signup': 'खाता बनाएं',
    'nav.notifications': 'सूचनाएं',
    'nav.profile': 'प्रोफ़ाइल',
    'role.user': 'User',
    'role.prime': 'Prime',
    'role.admin': 'Admin',
    'role.owner': 'Owner',
    'login.title': 'Hospitality Careers',
    'login.subtitle': 'होटल जॉब्स का आपका प्रवेश द्वार',
    'login.email': 'ईमेल पता',
    'login.password': 'पासवर्ड',
    'login.forgot': 'पासवर्ड भूल गए?',
    'login.btn': 'लॉगिन करें',
    'login.or': 'या',
    'login.google': 'Google से जारी रखें',
    'login.noacc': 'खाता नहीं है?',
    'login.signup': 'खाता बनाएं',
    'mode.find': 'नौकरी खोजें',
    'mode.hire': 'कर्मचारी रखें',
    'mode.post': 'मेरी पोस्ट',
    'sec.myApplications': 'मेरे आवेदन',
    'sec.myPosts': 'मेरे जॉब पोस्ट',
    'sec.membership': 'सदस्यता',
    'sec.notifications': 'सूचनाएं',
    'job.apply': 'अभी आवेदन करें',
    'job.request': 'अनुरोध',
    'job.download': 'Resume डाउनलोड करें',
    'job.contact': 'संपर्क जानकारी',
    'job.connect': 'Employer से जोड़ें',
    'job.status': 'स्थिति',
    'job.date': 'तारीख',
    'job.title': 'जॉब टाइटल',
    'job.action': 'कार्रवाई',
    'job.pending': 'लंबित',
    'job.approved': 'स्वीकृत',
    'job.hired': 'नियुक्त',
    'job.rejected': 'अस्वीकृत',
    'mem.upgrade': 'Prime में अपग्रेड करें',
    'mem.pay': 'UPI से भुगतान करें',
    'mem.history': 'सदस्यता इतिहास',
    'btn.submit': 'जमा करें',
    'btn.cancel': 'रद्द करें',
    'btn.close': 'बंद करें',
    'btn.save': 'सहेजें',
    'btn.upload': 'अपलोड करें',
    'btn.filter': 'फ़िल्टर',
    'btn.search': 'खोजें',
    'loading': 'लोड हो रहा है...',
    'no.data': 'कोई डेटा नहीं मिला',
    'no.jobs': 'कोई नौकरी नहीं मिली',
    'no.apps': 'अभी तक कोई आवेदन नहीं',
    'no.posts': 'अभी तक कोई पोस्ट नहीं',
    'footer.rights': '© 2024 Hospitality Careers. सर्वाधिकार सुरक्षित।',
    'about.title': 'हमारे बारे में',
    'about.hero': 'Hospitality में करियर बनाएं',
    'about.mission': 'हमारा मिशन',
    'about.team': 'हमारी टीम',
    'about.founder': 'संस्थापक और CEO',
    'about.cofounder': 'सह-संस्थापक',
    'about.opmanager': 'संचालन प्रबंधक',
  },
  bn: {
    'nav.home': 'হোম',
    'nav.about': 'আমাদের সম্পর্কে',
    'nav.contact': 'যোগাযোগ',
    'nav.feedback': 'ফিডব্যাক',
    'nav.help': 'সাহায্য',
    'nav.logout': 'লগআউট',
    'nav.login': 'লগইন',
    'nav.signup': 'অ্যাকাউন্ট তৈরি করুন',
    'nav.notifications': 'বিজ্ঞপ্তি',
    'nav.profile': 'প্রোফাইল',
    'role.user': 'ইউজার',
    'role.prime': 'প্রাইম',
    'role.admin': 'অ্যাডমিন',
    'role.owner': 'মালিক',
    'login.title': 'হসপিটালিটি ক্যারিয়ার্স',
    'login.subtitle': 'হোটেল চাকরির আপনার প্রবেশদ্বার',
    'login.email': 'ইমেইল ঠিকানা',
    'login.password': 'পাসওয়ার্ড',
    'login.forgot': 'পাসওয়ার্ড ভুলে গেছেন?',
    'login.btn': 'লগইন করুন',
    'login.or': 'অথবা',
    'login.google': 'Google দিয়ে চালিয়ে যান',
    'login.noacc': 'অ্যাকাউন্ট নেই?',
    'login.signup': 'অ্যাকাউন্ট তৈরি করুন',
    'mode.find': 'চাকরি খুঁজুন',
    'mode.hire': 'কর্মী নিয়োগ',
    'mode.post': 'আমার পোস্ট',
    'sec.myApplications': 'আমার আবেদন',
    'sec.myPosts': 'আমার জব পোস্ট',
    'sec.membership': 'সদস্যপদ',
    'sec.notifications': 'বিজ্ঞপ্তি',
    'job.apply': 'এখনই আবেদন করুন',
    'job.request': 'অনুরোধ',
    'job.download': 'Resume ডাউনলোড করুন',
    'job.contact': 'যোগাযোগের তথ্য',
    'job.connect': 'Employer এর সাথে যোগাযোগ',
    'job.status': 'অবস্থা',
    'job.date': 'তারিখ',
    'job.title': 'চাকরির নাম',
    'job.action': 'পদক্ষেপ',
    'job.pending': 'অপেক্ষমাণ',
    'job.approved': 'অনুমোদিত',
    'job.hired': 'নিয়োগ হয়েছে',
    'job.rejected': 'প্রত্যাখ্যাত',
    'mem.upgrade': 'Prime এ আপগ্রেড করুন',
    'mem.pay': 'UPI দিয়ে পেমেন্ট করুন',
    'mem.history': 'সদস্যপদ ইতিহাস',
    'btn.submit': 'জমা দিন',
    'btn.cancel': 'বাতিল',
    'btn.close': 'বন্ধ করুন',
    'btn.save': 'সংরক্ষণ করুন',
    'btn.upload': 'আপলোড',
    'btn.filter': 'ফিল্টার',
    'btn.search': 'খুঁজুন',
    'loading': 'লোড হচ্ছে...',
    'no.data': 'কোনো ডেটা পাওয়া যায়নি',
    'no.jobs': 'কোনো চাকরি পাওয়া যায়নি',
    'no.apps': 'এখনো কোনো আবেদন নেই',
    'no.posts': 'এখনো কোনো পোস্ট নেই',
    'footer.rights': '© ২০২৪ Hospitality Careers। সমস্ত অধিকার সংরক্ষিত।',
    'about.title': 'আমাদের সম্পর্কে',
    'about.hero': 'Hospitality এ ক্যারিয়ার গড়ুন',
    'about.mission': 'আমাদের লক্ষ্য',
    'about.team': 'আমাদের দল',
    'about.founder': 'প্রতিষ্ঠাতা ও CEO',
    'about.cofounder': 'সহ-প্রতিষ্ঠাতা',
    'about.opmanager': 'অপারেশন ম্যানেজার',
  }
};

// ── LANGUAGE SWITCHER UI ────────────────────────────────────────────────────
const LANGS = [
  { code: 'en', name: 'EN', full: 'English', flag: '🇬🇧' },
  { code: 'hi', name: 'HI', full: 'हिन्दी', flag: '🇮🇳' },
  { code: 'bn', name: 'BN', full: 'বাংলা', flag: '🟢' }
];

const initialUrlLang = new URLSearchParams(location.search).get('lang');
let lang = LANGS.some(l => l.code === initialUrlLang) ? initialUrlLang : (localStorage.getItem('hc_ui_lang') || 'en');
if (initialUrlLang && LANGS.some(l => l.code === initialUrlLang)) localStorage.setItem('hc_ui_lang', initialUrlLang);

function t(key) { return (T[lang] && T[lang][key]) || (T.en && T.en[key]) || key; }

function applyTranslations() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    const val = t(key);
    if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
      el.placeholder = val;
    } else {
      el.textContent = val;
    }
  });
  document.querySelectorAll('[data-i18n-html]').forEach(el => {
    const key = el.getAttribute('data-i18n-html');
    el.innerHTML = t(key);
  });
  document.querySelectorAll('[data-i18n-title]').forEach(el => {
    el.title = t(el.getAttribute('data-i18n-title'));
  });
  applyPublicStaticTranslations();
}

const PUBLIC_TEXT = {
  'Home': { hi: 'होम', bn: 'হোম' },
  'About': { hi: 'हमारे बारे में', bn: 'আমাদের সম্পর্কে' },
  'Contact': { hi: 'संपर्क', bn: 'যোগাযোগ' },
  'Feedback': { hi: 'फ़ीडबैक', bn: 'ফিডব্যাক' },
  'Help': { hi: 'मदद', bn: 'সাহায্য' },
  'About Us': { hi: 'हमारे बारे में', bn: 'আমাদের সম্পর্কে' },
  "The story behind India's premier hospitality career platform": { hi: 'भारत के प्रमुख हॉस्पिटैलिटी करियर प्लेटफ़ॉर्म की कहानी', bn: 'ভারতের প্রিমিয়ার hospitality career platform-এর গল্প' },
  'Our Mission': { hi: 'हमारा मिशन', bn: 'আমাদের লক্ষ্য' },
  'Hospitality Careers is dedicated to connecting talented hospitality professionals with the finest hotels, resorts, restaurants and wellness establishments across India. We believe every hospitality professional deserves a fulfilling career, and every employer deserves exceptional talent. Our platform bridges this gap with technology, transparency and trust.': { hi: 'Hospitality Careers पूरे भारत में प्रतिभाशाली हॉस्पिटैलिटी पेशेवरों को बेहतरीन होटल, रिसॉर्ट, रेस्टोरेंट और वेलनेस संस्थानों से जोड़ने के लिए समर्पित है। हमारा विश्वास है कि हर पेशेवर को अच्छा करियर और हर नियोक्ता को उत्कृष्ट प्रतिभा मिलनी चाहिए।', bn: 'Hospitality Careers ভারতের সেরা hotel, resort, restaurant এবং wellness প্রতিষ্ঠানের সঙ্গে দক্ষ hospitality professional-দের যুক্ত করার জন্য তৈরি। আমরা বিশ্বাস করি প্রত্যেক professional ভালো career deserve করেন, আর প্রত্যেক employer ভালো talent deserve করেন।' },
  'Our Founder': { hi: 'हमारे संस्थापक', bn: 'আমাদের প্রতিষ্ঠাতা' },
  'Founder & CEO': { hi: 'संस्थापक और CEO', bn: 'প্রতিষ্ঠাতা ও CEO' },
  'Hospitality Expert': { hi: 'Hospitality विशेषज्ञ', bn: 'Hospitality Expert' },
  'With over a decade of experience in the hospitality industry, Suman Sarkar founded Hospitality Careers with a vision to create a specialized platform that truly understands the unique needs of hospitality employers and job seekers.': { hi: 'हॉस्पिटैलिटी उद्योग में एक दशक से अधिक अनुभव के साथ, Suman Sarkar ने ऐसा विशेष प्लेटफ़ॉर्म बनाने के उद्देश्य से Hospitality Careers की स्थापना की जो नियोक्ताओं और नौकरी चाहने वालों की जरूरतों को समझता है।', bn: 'Hospitality industry-তে এক দশকের বেশি অভিজ্ঞতা নিয়ে Suman Sarkar এমন একটি specialized platform তৈরির লক্ষ্য নিয়ে Hospitality Careers শুরু করেন, যা employer ও job seeker—দুই পক্ষের প্রয়োজন ভালোভাবে বোঝে।' },
  "His deep understanding of the industry's talent landscape, combined with a passion for technology, led to the creation of this comprehensive platform that serves hotels, restaurants, resorts and hospitality professionals across India.": { hi: 'उद्योग की प्रतिभा-जरूरतों की गहरी समझ और तकनीक के प्रति जुनून ने इस व्यापक प्लेटफ़ॉर्म को जन्म दिया।', bn: 'Industry-র talent landscape সম্পর্কে গভীর বোঝাপড়া এবং technology-র প্রতি আগ্রহ থেকেই এই comprehensive platform তৈরি হয়েছে।' },
  'Co-Founder': { hi: 'सह-संस्थापक', bn: 'সহ-প্রতিষ্ঠাতা' },
  'আমাদের Co-Founder Hospitality Careers কে একটি সফল platform হিসেবে গড়ে তুলতে অক্লান্ত পরিশ্রম করছেন। তাঁর দূরদর্শিতা ও নেতৃত্বে এই platform আজ হাজার হাজার hospitality professional এর কর্মসংস্থানের সুযোগ তৈরি করছে।': { en: 'Our Co-Founder is working tirelessly to build Hospitality Careers into a successful platform. With vision and leadership, this platform is creating employment opportunities for thousands of hospitality professionals.', hi: 'हमारे सह-संस्थापक Hospitality Careers को सफल प्लेटफ़ॉर्म बनाने के लिए लगातार काम कर रहे हैं। उनकी दृष्टि और नेतृत्व हजारों हॉस्पिटैलिटी पेशेवरों के लिए अवसर बना रहे हैं।', bn: 'আমাদের Co-Founder Hospitality Careers-কে একটি সফল platform হিসেবে গড়ে তুলতে অক্লান্ত পরিশ্রম করছেন। তাঁর দূরদর্শিতা ও নেতৃত্বে এই platform হাজার হাজার hospitality professional-এর কর্মসংস্থানের সুযোগ তৈরি করছে।' },
  'Operation Manager': { hi: 'ऑपरेशन मैनेजर', bn: 'অপারেশন ম্যানেজার' },
  'Operations Head': { hi: 'ऑपरेशंस हेड', bn: 'অপারেশনস হেড' },
  'Operations': { hi: 'ऑपरेशंस', bn: 'অপারেশনস' },
  'আমাদের Operations Manager প্রতিদিনের platform পরিচালনা, user experience এবং সামগ্রিক কার্যক্রম সুচারুভাবে পরিচালনা করেন। তাঁর দক্ষ ব্যবস্থাপনায় আমাদের platform সর্বদা সচল ও কার্যকর থাকে।': { en: 'Our Operations Manager handles daily platform operations, user experience and overall activities smoothly. With skilled management, our platform remains active and effective.', hi: 'हमारे ऑपरेशन मैनेजर रोज़मर्रा के प्लेटफ़ॉर्म संचालन, यूज़र अनुभव और सभी गतिविधियों को सुचारु रूप से संभालते हैं।', bn: 'আমাদের Operations Manager প্রতিদিনের platform পরিচালনা, user experience এবং সামগ্রিক কার্যক্রম সুচারুভাবে পরিচালনা করেন।' },
  'Our Team Members': { hi: 'हमारी टीम', bn: 'আমাদের টিম সদস্য' },
  'Our Impact': { hi: 'हमारा प्रभाव', bn: 'আমাদের প্রভাব' },
  'Hospitality Professionals': { hi: 'Hospitality पेशेवर', bn: 'Hospitality Professional' },
  'Connected with top employers across India': { hi: 'भारत भर के शीर्ष नियोक्ताओं से जुड़े', bn: 'ভারতজুড়ে top employer-দের সঙ্গে যুক্ত' },
  'Hotel Partners': { hi: 'होटल पार्टनर', bn: 'Hotel Partner' },
  'Luxury hotels, resorts & restaurants': { hi: 'लक्ज़री होटल, रिसॉर्ट और रेस्टोरेंट', bn: 'Luxury hotel, resort এবং restaurant' },
  'Satisfaction Rate': { hi: 'संतुष्टि दर', bn: 'Satisfaction Rate' },
  'From our Prime members & employers': { hi: 'Prime सदस्यों और नियोक्ताओं से', bn: 'আমাদের Prime member ও employer-দের থেকে' },
  'Success Stories': { hi: 'सफलता की कहानियाँ', bn: 'সফলতার গল্প' },
  '"Found my dream job at a 5-star hotel within 2 weeks of joining Hospitality Careers. The Prime membership was worth every rupee!"': { hi: '"Hospitality Careers से जुड़ने के 2 सप्ताह में मुझे 5-स्टार होटल में अपना सपना जॉब मिला। Prime membership पूरी तरह उपयोगी रही!"', bn: '"Hospitality Careers join করার ২ সপ্তাহের মধ্যে 5-star hotel-এ আমার dream job পেয়েছি। Prime membership সত্যিই value for money!"' },
  '"We hired 3 exceptional housekeeping staff through this platform. The quality of candidates is unmatched."': { hi: '"हमने इस प्लेटफ़ॉर्म से 3 बेहतरीन housekeeping staff hire किए। उम्मीदवारों की गुणवत्ता शानदार है।"', bn: '"এই platform-এর মাধ্যমে আমরা ৩ জন দক্ষ housekeeping staff hire করেছি। Candidate quality অসাধারণ।"' },
  '"The platform helped me transition from a small restaurant to a luxury resort. Life-changing experience!"': { hi: '"इस प्लेटफ़ॉर्म ने मुझे छोटे रेस्टोरेंट से luxury resort तक पहुँचाया। जीवन बदल देने वाला अनुभव!"', bn: '"এই platform আমাকে ছোট restaurant থেকে luxury resort-এ যেতে সাহায্য করেছে। জীবন বদলে দেওয়া অভিজ্ঞতা!"' },
  'Our Journey': { hi: 'हमारी यात्रा', bn: 'আমাদের যাত্রা' },
  '2023 – Foundation': { hi: '2023 – शुरुआत', bn: '2023 – শুরু' },
  'Hospitality Careers was founded with a mission to transform how hospitality professionals find jobs and how hotels find talent.': { hi: 'Hospitality Careers की स्थापना इस मिशन के साथ हुई कि पेशेवरों को जॉब और होटलों को talent मिलना आसान हो।', bn: 'Hospitality professional-রা যেন সহজে job খুঁজতে পারেন এবং hotel-গুলো যেন talent পায়—এই mission নিয়ে Hospitality Careers শুরু হয়।' },
  '2024 – Platform Launch': { hi: '2024 – प्लेटफ़ॉर्म लॉन्च', bn: '2024 – Platform Launch' },
  'Official platform launch with job posting, CV upload, and Prime membership features. First 100 members onboarded.': { hi: 'Job posting, CV upload और Prime membership सुविधाओं के साथ आधिकारिक लॉन्च। पहले 100 सदस्य जुड़े।', bn: 'Job posting, CV upload এবং Prime membership feature সহ official platform launch। প্রথম 100 member onboarded।' },
  '2025 – Growth Phase': { hi: '2025 – विकास चरण', bn: '2025 – Growth Phase' },
  'Expanded to 20+ cities. Partnered with 200+ hotels and restaurants. Achieved 95% member satisfaction rate.': { hi: '20+ शहरों तक विस्तार, 200+ होटल और रेस्टोरेंट पार्टनर और 95% संतुष्टि दर।', bn: '20+ city-তে expansion, 200+ hotel ও restaurant partner এবং 95% member satisfaction rate অর্জন।' },
  '2026 & Beyond': { hi: '2026 और आगे', bn: '2026 এবং এরপর' },
  'Continuous growth with advanced AI-powered matching, mobile app, and expanding to Southeast Asia.': { hi: 'Advanced AI matching, mobile app और Southeast Asia तक विस्तार के साथ निरंतर विकास।', bn: 'Advanced AI-powered matching, mobile app এবং Southeast Asia expansion নিয়ে continuous growth।' },
  'Your Feedback': { hi: 'आपका फ़ीडबैक', bn: 'আপনার ফিডব্যাক' },
  'Help us improve by sharing your experience with Hospitality Careers': { hi: 'Hospitality Careers के साथ अपना अनुभव साझा करके हमें बेहतर बनाने में मदद करें', bn: 'Hospitality Careers নিয়ে আপনার অভিজ্ঞতা share করে আমাদের উন্নত করতে সাহায্য করুন' },
  'Share Your Experience': { hi: 'अपना अनुभव साझा करें', bn: 'আপনার অভিজ্ঞতা শেয়ার করুন' },
  'Your Name *': { hi: 'आपका नाम *', bn: 'আপনার নাম *' },
  'Full name': { hi: 'पूरा नाम', bn: 'পুরো নাম' },
  'Email Address': { hi: 'ईमेल पता', bn: 'ইমেইল ঠিকানা' },
  'You are a...': { hi: 'आप हैं...', bn: 'আপনি একজন...' },
  'Job Seeker': { hi: 'नौकरी खोजने वाले', bn: 'Job Seeker' },
  'Employer / Hotel': { hi: 'नियोक्ता / होटल', bn: 'Employer / Hotel' },
  'Prime Member': { hi: 'Prime सदस्य', bn: 'Prime Member' },
  'General User': { hi: 'सामान्य यूज़र', bn: 'সাধারণ User' },
  'Overall Rating *': { hi: 'कुल रेटिंग *', bn: 'সামগ্রিক রেটিং *' },
  'Click to rate': { hi: 'रेटिंग देने के लिए क्लिक करें', bn: 'রেট করতে ক্লিক করুন' },
  'Category': { hi: 'श्रेणी', bn: 'Category' },
  'Overall Experience': { hi: 'कुल अनुभव', bn: 'Overall Experience' },
  'Job Listings Quality': { hi: 'जॉब लिस्टिंग गुणवत्ता', bn: 'Job Listing Quality' },
  'Prime Membership Value': { hi: 'Prime सदस्यता का मूल्य', bn: 'Prime সদস্যপদের মূল্য' },
  'Website Design & Usability': { hi: 'Website Design और उपयोग', bn: 'Website Design ও Usability' },
  'Customer Support': { hi: 'ग्राहक सहायता', bn: 'গ্রাহক সহায়তা' },
  'Hiring Process': { hi: 'भर्ती प्रक्रिया', bn: 'নিয়োগ প্রক্রিয়া' },
  'Your Feedback *': { hi: 'आपका फ़ीडबैक *', bn: 'আপনার ফিডব্যাক *' },
  'Tell us about your experience. Your feedback helps us improve!': { hi: 'अपने अनुभव के बारे में बताएं। आपका फ़ीडबैक हमें बेहतर बनाता है!', bn: 'আপনার অভিজ্ঞতা লিখুন। আপনার feedback আমাদের উন্নত করতে সাহায্য করে!' },
  'Allow this review to be displayed publicly': { hi: 'इस review को public दिखाने की अनुमति दें', bn: 'এই review public দেখানোর অনুমতি দিন' },
  'Submit Feedback': { hi: 'फ़ीडबैक जमा करें', bn: 'ফিডব্যাক জমা দিন' },
  'What People Say': { hi: 'लोग क्या कहते हैं', bn: 'মানুষ কী বলছেন' },
  'Rating Summary': { hi: 'रेटिंग सारांश', bn: 'Rating Summary' },
  'Based on verified reviews': { hi: 'Verified reviews के आधार पर', bn: 'Verified review-এর ভিত্তিতে' },
  '"Excellent platform for hospitality professionals. Found my ideal job within 10 days. Highly recommended!"': { hi: '"हॉस्पिटैलिटी पेशेवरों के लिए बेहतरीन मंच। 10 दिनों में मुझे सही नौकरी मिली। बहुत अनुशंसित!"', bn: '"হসপিটালিটি পেশাদারদের জন্য অসাধারণ প্ল্যাটফর্ম। ১০ দিনের মধ্যে ভালো চাকরি পেয়েছি। অবশ্যই ব্যবহারযোগ্য!"' },
  '"The Prime membership is absolutely worth it. The quality of job listings and the support from the team is outstanding."': { hi: '"Prime सदस्यता सच में उपयोगी है। नौकरी सूची की गुणवत्ता और टीम की सहायता बेहतरीन है।"', bn: '"Prime সদস্যপদ সত্যিই মূল্যবান। চাকরির তালিকার মান এবং টিমের সহায়তা অসাধারণ।"' },
  '"Great platform with a professional design. As an employer, I found multiple qualified candidates quickly."': { hi: '"पेशेवर डिज़ाइन वाला शानदार मंच। नियोक्ता के रूप में मुझे जल्दी कई योग्य उम्मीदवार मिले।"', bn: '"পেশাদার ডিজাইনসহ দারুণ প্ল্যাটফর্ম। নিয়োগকর্তা হিসেবে দ্রুত অনেক যোগ্য প্রার্থী পেয়েছি।"' },
  'Contact Us': { hi: 'हमसे संपर्क करें', bn: 'যোগাযোগ করুন' },
  "We're here to help. Reach out to our team anytime.": { hi: 'हम मदद के लिए हैं। कभी भी हमारी टीम से संपर्क करें।', bn: 'আমরা সাহায্যের জন্য আছি। যেকোনো সময় আমাদের দলের সঙ্গে যোগাযোগ করুন।' },
  'Get In Touch': { hi: 'संपर्क करें', bn: 'যোগাযোগ করুন' },
  'Email Address *': { hi: 'ईमेल पता *', bn: 'ইমেইল ঠিকানা *' },
  'Response within 24 hours': { hi: '24 घंटे के भीतर जवाब', bn: '২৪ ঘণ্টার মধ্যে উত্তর' },
  'Phone / WhatsApp': { hi: 'फोन / WhatsApp', bn: 'Phone / WhatsApp' },
  'Mon–Sat, 9 AM – 7 PM': { hi: 'सोम–शनिवार, 9 AM – 7 PM', bn: 'সোম–শনিবার, 9 AM – 7 PM' },
  'Office Address': { hi: 'ऑफिस पता', bn: 'অফিস ঠিকানা' },
  'Business Hours': { hi: 'काम का समय', bn: 'Business Hours' },
  'Monday – Saturday': { hi: 'सोमवार – शनिवार', bn: 'সোমবার – শনিবার' },
  'India – Serving pan-India hospitality professionals': { hi: 'भारत – पूरे भारत के hospitality professionals के लिए', bn: 'India – সারা ভারতের hospitality professional-দের জন্য' },
  'Send Us a Message': { hi: 'हमें संदेश भेजें', bn: 'আমাদের মেসেজ পাঠান' },
  'Phone Number': { hi: 'फोन नंबर', bn: 'ফোন নম্বর' },
  'Subject *': { hi: 'विषय *', bn: 'বিষয় *' },
  '-- Select Subject --': { hi: '-- विषय चुनें --', bn: '-- Subject নির্বাচন করুন --' },
  'Job Application Query': { hi: 'जॉब आवेदन सवाल', bn: 'চাকরির আবেদন সংক্রান্ত প্রশ্ন' },
  'Prime Membership Support': { hi: 'Prime सदस्यता सहायता', bn: 'Prime সদস্যপদ সহায়তা' },
  'Job Posting Help': { hi: 'जॉब पोस्टिंग मदद', bn: 'চাকরি পোস্ট সহায়তা' },
  'Account Issue': { hi: 'अकाउंट समस्या', bn: 'অ্যাকাউন্ট সমস্যা' },
  'Payment / UTR Issue': { hi: 'पेमेंट / UTR समस्या', bn: 'পেমেন্ট / UTR সমস্যা' },
  'Partnership Enquiry': { hi: 'साझेदारी पूछताछ', bn: 'পার্টনারশিপ অনুসন্ধান' },
  'Other': { hi: 'अन्य', bn: 'অন্যান্য' },
  'Message *': { hi: 'संदेश *', bn: 'বার্তা *' },
  'Write your message here...': { hi: 'अपना संदेश यहाँ लिखें...', bn: 'আপনার বার্তা এখানে লিখুন...' },
  'Send Message': { hi: 'संदेश भेजें', bn: 'মেসেজ পাঠান' },
  'Quick Help': { hi: 'त्वरित मदद', bn: 'দ্রুত সাহায্য' },
  'FAQ / Help': { hi: 'FAQ / मदद', bn: 'FAQ / সাহায্য' },
  'Find quick answers': { hi: 'जल्दी जवाब पाएं', bn: 'দ্রুত উত্তর খুঁজুন' },
  'Give Feedback': { hi: 'फ़ीडबैक दें', bn: 'Feedback দিন' },
  'Rate your experience': { hi: 'अपने अनुभव को रेट करें', bn: 'আপনার অভিজ্ঞতা rate করুন' },
  'Help Center': { hi: 'मदद केंद्र', bn: 'সাহায্য কেন্দ্র' },
  'Find answers to common questions about Hospitality Careers': { hi: 'Hospitality Careers से जुड़े सामान्य सवालों के जवाब पाएं', bn: 'Hospitality Careers সম্পর্কে সাধারণ প্রশ্নের উত্তর খুঁজুন' },
  'Search for help topics...': { hi: 'मदद के विषय खोजें...', bn: 'সাহায্যের বিষয় খুঁজুন...' },
  'All Topics': { hi: 'सभी विषय', bn: 'সব বিষয়' },
  'Account': { hi: 'अकाउंट', bn: 'অ্যাকাউন্ট' },
  'Jobs': { hi: 'नौकरियाँ', bn: 'চাকরি' },
  'Membership': { hi: 'सदस्यता', bn: 'সদস্যপদ' },
  'Payment': { hi: 'भुगतान', bn: 'পেমেন্ট' },
  'MPIN': { hi: 'MPIN', bn: 'MPIN' },
  'How do I create an account on Hospitality Careers?': { hi: 'Hospitality Careers पर account कैसे बनाऊँ?', bn: 'Hospitality Careers-এ account কীভাবে তৈরি করব?' },
  'Visit the homepage and click "Login / Register". Choose "Sign Up" and fill in your details (name, email, password). You can also sign in with your Google account for faster access. Once registered, you\'ll be directed to your personal dashboard.': { hi: 'Homepage पर जाकर "Login / Register" क्लिक करें। "Sign Up" चुनें और अपना नाम, email और password भरें। तेज़ access के लिए Google account से भी sign in कर सकते हैं। Register होने के बाद आप अपने dashboard पर जाएंगे।', bn: 'Homepage-এ গিয়ে "Login / Register" click করুন। "Sign Up" বেছে নিয়ে নাম, email ও password দিন। দ্রুত access-এর জন্য Google account দিয়েও sign in করতে পারেন। Register হলে আপনার dashboard খুলবে।' },
  'What is MPIN and how do I use it?': { hi: 'MPIN क्या है और इसे कैसे use करें?', bn: 'MPIN কী এবং কীভাবে ব্যবহার করব?' },
  'MPIN is a 4-digit security PIN used to protect your dashboard access. For Owners, you set your own MPIN on first login. For Admins, the Owner sets your MPIN from the Admin Management section. You must enter your MPIN every time you access the dashboard. If you forget your MPIN, contact the system owner.': { hi: 'MPIN 4-digit security PIN है जो dashboard access को सुरक्षित रखता है। Owner first login पर अपना MPIN set करते हैं। Admin के लिए Owner Admin Management section से MPIN set करते हैं। Dashboard खोलते समय MPIN डालना जरूरी है। भूलने पर system owner से संपर्क करें।', bn: 'MPIN হলো 4-digit security PIN, যা dashboard access protect করে। Owner first login-এ নিজের MPIN set করেন। Admin-এর MPIN Owner Admin Management section থেকে set করেন। Dashboard খুলতে প্রতিবার MPIN দিতে হবে। ভুলে গেলে system owner-এর সঙ্গে যোগাযোগ করুন।' },
  'How do I apply for a job?': { hi: 'Job के लिए apply कैसे करूँ?', bn: 'চাকরির জন্য কীভাবে apply করব?' },
  'Browse jobs from your dashboard\'s "Find Job" mode. Click the "Apply" button on any job listing. Fill in your details and upload your CV (PDF, DOC, or image). Wait for the CV to upload completely before submitting. Once submitted, you can track your application status in "My Activity".': { hi: 'Dashboard के "Find Job" mode से jobs browse करें। किसी भी job listing पर "Apply" button click करें। Details भरें और CV upload करें (PDF, DOC या image)। Submit करने से पहले CV upload पूरा होने दें। Submit होने के बाद "My Activity" में status track करें।', bn: 'Dashboard-এর "Find Job" mode থেকে jobs browse করুন। যেকোনো job listing-এ "Apply" button click করুন। Details দিন এবং CV upload করুন (PDF, DOC বা image)। Submit করার আগে CV upload সম্পূর্ণ হতে দিন। Submit হলে "My Activity"-তে status track করতে পারবেন।' },
  'How do I post a job vacancy?': { hi: 'Job vacancy कैसे post करूँ?', bn: 'Job vacancy কীভাবে post করব?' },
  'Go to your dashboard and switch to "Hire Staff" mode, or click "Add Job" from the sidebar. Fill in all job details. If you are a regular User, your post goes to "Pending" status and needs admin approval. Prime Members, Admins and Owners can post jobs that go live immediately.': { hi: 'Dashboard में जाकर "Hire Staff" mode चुनें, या sidebar से "Add Job" click करें। Job details भरें। Regular User होने पर post "Pending" में जाएगी और admin approval चाहिए होगा। Prime Members, Admins और Owners की jobs तुरंत live हो सकती हैं।', bn: 'Dashboard-এ গিয়ে "Hire Staff" mode select করুন, অথবা sidebar থেকে "Add Job" click করুন। Job details পূরণ করুন। Regular User হলে post "Pending" status-এ যাবে এবং admin approval লাগবে। Prime Members, Admins ও Owners-এর jobs সরাসরি live হতে পারে।' },
  'What is Prime Membership and what are its benefits?': { hi: 'Prime Membership क्या है और इसके फायदे क्या हैं?', bn: 'Prime Membership কী এবং এর সুবিধা কী?' },
  'Prime Membership (₹499/month) gives you access to exclusive job listings, the ability to post jobs that go live immediately (no approval needed), view candidate resumes, connect with employers directly, and get a verified Prime tag on your profile. Your tag is numbered (Prime, Prime2, Prime3...) based on how many times you\'ve renewed.': { hi: 'Prime Membership (₹499/month) में exclusive job listings, बिना approval तुरंत job post, candidate resumes देखना, employers से direct connect और profile पर verified Prime tag मिलता है। Renewal count के आधार पर tag Prime, Prime2, Prime3... होता है।', bn: 'Prime Membership (₹499/month) দিলে exclusive job listings, approval ছাড়া job post live, candidate resume দেখা, employer-এর সঙ্গে direct connect এবং profile-এ verified Prime tag পাওয়া যায়। Renewal count অনুযায়ী tag Prime, Prime2, Prime3... হয়।' },
  'How do I purchase Prime Membership?': { hi: 'Prime Membership कैसे खरीदें?', bn: 'Prime Membership কীভাবে কিনব?' },
  'Go to "Membership" from your dashboard sidebar. Scan the UPI QR code or use the UPI ID provided to pay ₹499. After payment, enter your UTR (Unique Transaction Reference) number in the provided field and click "Submit Request". Your membership will be activated by the admin within 24 hours after UTR verification.': { hi: 'Dashboard sidebar से "Membership" खोलें। UPI QR scan करें या UPI ID से ₹499 pay करें। Payment के बाद UTR number field में डालकर "Submit Request" click करें। UTR verify होने के बाद admin 24 घंटे में membership activate करेगा।', bn: 'Dashboard sidebar থেকে "Membership" খুলুন। UPI QR scan করুন অথবা দেওয়া UPI ID দিয়ে ₹499 pay করুন। Payment-এর পর UTR number field-এ দিয়ে "Submit Request" click করুন। UTR verify হলে admin ২৪ ঘণ্টার মধ্যে membership activate করবেন।' },
  'Where do I find my UTR number?': { hi: 'UTR number कहाँ मिलेगा?', bn: 'UTR number কোথায় পাব?' },
  'After making a UPI payment, open your UPI app (PhonePe, Google Pay, Paytm, etc.) and go to your transaction history. Open the payment you made to us and look for "UTR", "Transaction ID" or "Reference Number" – it\'s usually a 12-digit number. Copy this and paste it in the UTR field on our membership page.': { hi: 'UPI payment के बाद अपना UPI app (PhonePe, Google Pay, Paytm आदि) खोलें और transaction history में जाएँ। Payment खोलकर "UTR", "Transaction ID" या "Reference Number" देखें—यह आमतौर पर 12-digit होता है। इसे copy करके membership page के UTR field में paste करें।', bn: 'UPI payment করার পর আপনার UPI app (PhonePe, Google Pay, Paytm ইত্যাদি) খুলে transaction history দেখুন। Payment খুলে "UTR", "Transaction ID" বা "Reference Number" খুঁজুন—সাধারণত এটি 12-digit হয়। Copy করে membership page-এর UTR field-এ paste করুন।' },
  'What is the Prime tag numbering system?': { hi: 'Prime tag numbering system क्या है?', bn: 'Prime tag numbering system কী?' },
  'Your Prime tag reflects how many times you\'ve purchased membership. Your first membership gives you the "Prime" tag. The second renewal gives "Prime2", third gives "Prime3", and so on. Higher numbered Prime tags signal to employers that you are a long-term, committed platform member.': { hi: 'Prime tag बताता है कि आपने membership कितनी बार खरीदी है। पहली membership पर "Prime", second renewal पर "Prime2", third पर "Prime3" मिलता है। Higher tag employers को long-term committed member का signal देता है।', bn: 'Prime tag দেখায় আপনি কতবার membership কিনেছেন। প্রথম membership-এ "Prime", second renewal-এ "Prime2", third-এ "Prime3"—এভাবে tag বাড়ে। Higher tag employer-দের কাছে long-term committed member বোঝায়।' },
  'I forgot my Admin MPIN. What should I do?': { hi: 'Admin MPIN भूल गया हूँ। क्या करूँ?', bn: 'Admin MPIN ভুলে গেছি। কী করব?' },
  'Admin MPINs are set and managed by the Owner. If you\'ve forgotten your MPIN, contact the Owner of the system. The Owner can set a new MPIN for you from the Owner Dashboard → Settings → Manage MPINs → Set Admin MPIN.': { hi: 'Admin MPIN Owner set और manage करते हैं। MPIN भूलने पर system Owner से संपर्क करें। Owner Dashboard → Settings → Manage MPINs → Set Admin MPIN से नया MPIN set किया जा सकता है।', bn: 'Admin MPIN Owner set ও manage করেন। MPIN ভুলে গেলে system Owner-এর সঙ্গে যোগাযোগ করুন। Owner Dashboard → Settings → Manage MPINs → Set Admin MPIN থেকে নতুন MPIN set করা যাবে।' },
  'How do notifications work?': { hi: 'Notifications कैसे काम करते हैं?', bn: 'Notifications কীভাবে কাজ করে?' },
  'You receive in-app notifications when your requests (membership, contact, resume download) are approved or rejected. You can also receive broadcast notifications from the Owner. Look for the bell icon in your dashboard navbar to see your notifications. Allow browser notifications for instant alerts.': { hi: 'आपके requests (membership, contact, resume download) approve या reject होने पर in-app notifications मिलते हैं। Owner से broadcast notifications भी आ सकते हैं। Dashboard navbar में bell icon से notifications देखें। Instant alerts के लिए browser notifications allow करें।', bn: 'আপনার requests (membership, contact, resume download) approve বা reject হলে in-app notifications পাবেন। Owner-এর broadcast notifications-ও আসতে পারে। Dashboard navbar-এর bell icon থেকে notifications দেখুন। Instant alerts-এর জন্য browser notifications allow করুন।' },
  'Still Need Help?': { hi: 'अभी भी मदद चाहिए?', bn: 'এখনও সাহায্য দরকার?' },
  "Can't find what you're looking for? Our support team is ready to help you.": { hi: 'जो ढूंढ रहे हैं वह नहीं मिला? हमारी support team आपकी मदद के लिए तैयार है।', bn: 'যা খুঁজছেন তা পাচ্ছেন না? আমাদের support team সাহায্যের জন্য প্রস্তুত।' },
  'Contact Support': { hi: 'Support से संपर्क करें', bn: 'Support-এ যোগাযোগ করুন' },
  '© 2026 Hospitality Careers. All rights reserved.': { hi: '© 2026 Hospitality Careers. सर्वाधिकार सुरक्षित।', bn: '© 2026 Hospitality Careers. সমস্ত অধিকার সংরক্ষিত।' },
  '© 2026 Hospitality Careers. All rights reserved. | Founded by Suman Sarkar': { hi: '© 2026 Hospitality Careers. सर्वाधिकार सुरक्षित। | Founder: Suman Sarkar', bn: '© 2026 Hospitality Careers. সমস্ত অধিকার সংরক্ষিত। | Founder: Suman Sarkar' },

  // ============ ABOUT PAGE EXTRA ============
  'Co-Founder & Strategy Lead': { hi: 'सह-संस्थापक और रणनीति प्रमुख', bn: 'সহ-প্রতিষ্ঠাতা ও কৌশল প্রধান' },
  'Head of Operations': { hi: 'ऑपरेशंस प्रमुख', bn: 'অপারেশনস প্রধান' },
  'Visionary Leader': { hi: 'दूरदर्शी नेता', bn: 'দূরদর্শী নেতা' },
  'Operations Expert': { hi: 'ऑपरेशंस विशेषज्ञ', bn: 'অপারেশনস বিশেষজ্ঞ' },
  'Hospitality Professionals': { hi: 'हॉस्पिटैलिटी पेशेवर', bn: 'Hospitality পেশাদার' },
  'Hotel Partners': { hi: 'होटल पार्टनर', bn: 'Hotel Partner' },
  'Satisfaction Rate': { hi: 'संतुष्टि दर', bn: 'সন্তুষ্টির হার' },
  'Connected with top employers across India': { hi: 'पूरे भारत के शीर्ष नियोक्ताओं से जुड़े', bn: 'সারা ভারতের সেরা employer-দের সঙ্গে যুক্ত' },
  'Luxury hotels, resorts & restaurants': { hi: 'लक्जरी होटल, रिसॉर्ट और रेस्टोरेंट', bn: 'Luxury hotel, resort ও restaurant' },
  'From our Prime members & employers': { hi: 'हमारे Prime सदस्यों और नियोक्ताओं से', bn: 'আমাদের Prime member ও employer থেকে' },

  // ============ CONTACT PAGE EXTRA ============
  'Account Issue': { hi: 'खाते की समस्या', bn: 'অ্যাকাউন্ট সমস্যা' },
  'Business Hours': { hi: 'व्यापार के घंटे', bn: 'কাজের সময়' },
  'Email Address': { hi: 'ईमेल पता', bn: 'ইমেল ঠিকানা' },
  'Find quick answers': { hi: 'त्वरित उत्तर पाएं', bn: 'দ্রুত উত্তর পান' },
  'Give Feedback': { hi: 'फ़ीडबैक दें', bn: 'ফিডব্যাক দিন' },
  'Job Application Query': { hi: 'नौकरी आवेदन पूछताछ', bn: 'Job Application সংক্রান্ত প্রশ্ন' },
  'Job Posting Help': { hi: 'नौकरी पोस्टिंग सहायता', bn: 'Job Posting সহায়তা' },
  'Office Address': { hi: 'कार्यालय का पता', bn: 'অফিস ঠিকানা' },
  'Partnership Enquiry': { hi: 'साझेदारी पूछताछ', bn: 'Partnership অনুসন্ধান' },
  'Phone Number': { hi: 'फ़ोन नंबर', bn: 'ফোন নম্বর' },
  'Prime Membership Support': { hi: 'Prime सदस्यता सहायता', bn: 'Prime Membership সহায়তা' },
  'Rate your experience': { hi: 'अपना अनुभव रेट करें', bn: 'আপনার অভিজ্ঞতা রেট দিন' },
  'West Bengal, India': { hi: 'पश्चिम बंगाल, भारत', bn: 'পশ্চিমবঙ্গ, ভারত' },
  'Other': { hi: 'अन्य', bn: 'অন্যান্য' },

  // ============ FEEDBACK PAGE EXTRA ============
  'Based on verified reviews': { hi: 'सत्यापित समीक्षाओं के आधार पर', bn: 'যাচাইকৃত review-র ভিত্তিতে' },
  'Category': { hi: 'श्रेणी', bn: 'বিভাগ' },
  'Click to rate': { hi: 'रेट करने के लिए क्लिक करें', bn: 'রেট দিতে ক্লিক করুন' },
  'Customer Support': { hi: 'ग्राहक सहायता', bn: 'গ্রাহক সহায়তা' },
  'General User': { hi: 'सामान्य उपयोगकर्ता', bn: 'সাধারণ ব্যবহারকারী' },
  'Help us improve by sharing your experience with Hospitality Careers': { hi: 'अपना अनुभव साझा करके हमें बेहतर बनाने में मदद करें', bn: 'আপনার অভিজ্ঞতা share করে আমাদের আরও ভালো করতে সাহায্য করুন' },
  'Hiring Process': { hi: 'भर्ती प्रक्रिया', bn: 'নিয়োগ প্রক্রিয়া' },
  'Job Listings Quality': { hi: 'नौकरी लिस्टिंग गुणवत्ता', bn: 'Job Listing-এর মান' },
  'Job Seeker': { hi: 'नौकरी खोजने वाला', bn: 'চাকরি প্রার্থী' },
  'Overall Experience': { hi: 'समग्र अनुभव', bn: 'সামগ্রিক অভিজ্ঞতা' },
  'Prime Member': { hi: 'Prime सदस्य', bn: 'Prime সদস্য' },
  'Prime Membership Value': { hi: 'Prime सदस्यता मूल्य', bn: 'Prime Membership-এর মূল্য' },
  'Website Design & Usability': { hi: 'वेबसाइट डिज़ाइन और उपयोगिता', bn: 'Website Design ও ব্যবহারযোগ্যতা' },
  'You are a...': { hi: 'आप एक...', bn: 'আপনি একজন…' },

  // ============ HELP PAGE EXTRA ============
  'Account': { hi: 'खाता', bn: 'অ্যাকাউন্ট' },
  'Add to Home Screen': { hi: 'होम स्क्रीन पर जोड़ें', bn: 'Home Screen-এ যোগ করুন' },
  'Add to Home screen': { hi: 'होम स्क्रीन पर जोड़ें', bn: 'Home Screen-এ যোগ করুন' },
  'AI Assistant': { hi: 'AI सहायक', bn: 'AI সহায়ক' },
  'All Topics': { hi: 'सभी विषय', bn: 'সব বিষয়' },
  'Chrome': { hi: 'Chrome', bn: 'Chrome' },
  'Claim': { hi: 'दावा करें', bn: 'Claim' },
  'Coupons': { hi: 'कूपन', bn: 'কুপন' },
  'Discount Coupon': { hi: 'डिस्काउंट कूपन', bn: 'ডিসকাউন্ট কুপন' },
  'Discount coupons': { hi: 'डिस्काउंट कूपन', bn: 'ডিসকাউন্ট কুপন' },
  'Download PDF': { hi: 'PDF डाउनलोड करें', bn: 'PDF ডাউনলোড করুন' },
  'English, Hindi and Bangla': { hi: 'English, Hindi और Bangla', bn: 'English, Hindi এবং Bangla' },
  'Enquiries': { hi: 'पूछताछ', bn: 'অনুসন্ধান' },
  'Enquiry': { hi: 'पूछताछ', bn: 'অনুসন্ধান' },
  'Find answers to common questions about Hospitality Careers': { hi: 'Hospitality Careers के बारे में सामान्य प्रश्नों के उत्तर पाएं', bn: 'Hospitality Careers সংক্রান্ত সাধারণ প্রশ্নের উত্তর পান' },
  'Free Trial Coupon': { hi: 'मुफ़्त ट्रायल कूपन', bn: 'Free Trial কুপন' },
  'Full Name': { hi: 'पूरा नाम', bn: 'পুরো নাম' },
  'Generate My Resume': { hi: 'मेरा बायोडाटा बनाएं', bn: 'আমার Resume তৈরি করুন' },
  'Google Gemini': { hi: 'Google Gemini', bn: 'Google Gemini' },
  'HC Wallet': { hi: 'HC वॉलेट', bn: 'HC Wallet' },
  'History': { hi: 'इतिहास', bn: 'ইতিহাস' },
  'Install': { hi: 'इंस्टॉल करें', bn: 'Install করুন' },
  'Install app': { hi: 'ऐप इंस्टॉल करें', bn: 'App Install করুন' },
  'Install App': { hi: 'ऐप इंस्टॉल करें', bn: 'App Install করুন' },
  'Job Title': { hi: 'नौकरी का शीर्षक', bn: 'Job Title' },
  'Choose File': { hi: 'फ़ाइल चुनें', bn: 'ফাইল বেছে নিন' }
};

const PUBLIC_TITLES = {
  'About Us – Hospitality Careers': { hi: 'हमारे बारे में – Hospitality Careers', bn: 'আমাদের সম্পর্কে – Hospitality Careers' },
  'Feedback – Hospitality Careers': { hi: 'फ़ीडबैक – Hospitality Careers', bn: 'ফিডব্যাক – Hospitality Careers' },
  'Contact Us – Hospitality Careers': { hi: 'संपर्क – Hospitality Careers', bn: 'যোগাযোগ – Hospitality Careers' },
  'Help & FAQ – Hospitality Careers': { hi: 'मदद और FAQ – Hospitality Careers', bn: 'Help ও FAQ – Hospitality Careers' }
};

function originalText(node, fallback) {
  if (!node.parentElement) return fallback;
  if (!node.parentElement.dataset.i18nOriginalText) node.parentElement.dataset.i18nOriginalText = fallback;
  return node.parentElement.dataset.i18nOriginalText;
}

function applyTextNode(node) {
  const raw = node.textContent;
  const trimmed = raw.replace(/\s+/g, ' ').trim();
  if (!trimmed) return;
  const original = originalText(node, trimmed);
  const replacement = lang === 'en' ? (PUBLIC_TEXT[original]?.en || original) : PUBLIC_TEXT[original]?.[lang];
  if (!replacement) return;
  node.textContent = raw.replace(trimmed, replacement);
}

function applyPublicStaticTranslations() {
  const titleOriginal = document.documentElement.dataset.i18nOriginalTitle || document.title;
  document.documentElement.dataset.i18nOriginalTitle = titleOriginal;
  document.title = lang === 'en' ? titleOriginal : (PUBLIC_TITLES[titleOriginal]?.[lang] || titleOriginal);
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      if (!node.parentElement || ['SCRIPT', 'STYLE'].includes(node.parentElement.tagName)) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    }
  });
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  nodes.forEach(applyTextNode);
  document.querySelectorAll('input[placeholder], textarea[placeholder]').forEach(el => {
    if (!el.dataset.i18nOriginalPlaceholder) el.dataset.i18nOriginalPlaceholder = el.placeholder;
    const original = el.dataset.i18nOriginalPlaceholder;
    el.placeholder = lang === 'en' ? original : (PUBLIC_TEXT[original]?.[lang] || original);
  });
  // After static dictionary pass, run auto-translation for everything else
  scheduleAutoTranslate();
}

// ── AUTO-TRANSLATE ENGINE (DOM walker + Gemini-backed /api/translate) ──────
// Caches translations in localStorage so repeat visits are instant.
const __AUTO_SKIP_TAGS = new Set(['SCRIPT','STYLE','CODE','PRE','NOSCRIPT','TEXTAREA','INPUT','SELECT','OPTION','SVG','PATH','CANVAS']);
const __AUTO_SKIP_CLASS_RX = /(?:^|\s)(no-i18n|gc-message|gc-msg-text|gc-input|chat-msg|hljs|monaco|cm-)/;
const AUTO_LS_KEY = (l) => 'hc_tr_' + l;
let __autoCache = null; // { [origText]: translated }
let __autoTimer = null;
let __autoInflight = false;
let __autoObserver = null;
const __autoOriginals = new WeakMap(); // textNode -> original text

function loadAutoCache() {
  if (__autoCache) return __autoCache;
  try { __autoCache = JSON.parse(localStorage.getItem(AUTO_LS_KEY(lang)) || '{}'); }
  catch(_) { __autoCache = {}; }
  return __autoCache;
}
function persistAutoCache() {
  try { localStorage.setItem(AUTO_LS_KEY(lang), JSON.stringify(__autoCache || {})); } catch(_) {}
}
function shouldSkipNode(n) {
  let p = n.parentElement;
  while (p) {
    if (__AUTO_SKIP_TAGS.has(p.tagName)) return true;
    if (p.hasAttribute && p.hasAttribute('data-no-i18n')) return true;
    if (p.className && typeof p.className === 'string' && __AUTO_SKIP_CLASS_RX.test(p.className)) return true;
    if (p === document.body) break;
    p = p.parentElement;
  }
  return false;
}
function isTranslatableText(t) {
  const s = (t || '').trim();
  if (s.length < 2) return false;
  // Skip pure numbers, URLs, emails, dates, currency-only
  if (/^[\d\s.,:;%+\-/()*$₹€£¥]+$/.test(s)) return false;
  if (/^(https?:|mailto:|tel:|www\.)/i.test(s)) return false;
  if (/^[\w.+-]+@[\w-]+\.[\w.-]+$/.test(s)) return false;
  // Must contain at least one letter
  if (!/[A-Za-z\u0900-\u097F\u0980-\u09FF]/.test(s)) return false;
  return true;
}
function collectAutoTextNodes() {
  const out = [];
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
    acceptNode(n) {
      if (shouldSkipNode(n)) return NodeFilter.FILTER_REJECT;
      if (!isTranslatableText(n.textContent)) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    }
  });
  while (walker.nextNode()) out.push(walker.currentNode);
  return out;
}
function collectAutoAttrTargets() {
  // placeholder, title, aria-label
  const list = [];
  const sel = '[placeholder],[title],[aria-label]';
  document.querySelectorAll(sel).forEach(el => {
    if (__AUTO_SKIP_TAGS.has(el.tagName) && el.tagName !== 'INPUT' && el.tagName !== 'TEXTAREA') return;
    if (el.hasAttribute('data-no-i18n')) return;
    ['placeholder','title','aria-label'].forEach(attr => {
      if (!el.hasAttribute(attr)) return;
      const v = el.getAttribute(attr);
      if (!isTranslatableText(v)) return;
      const dKey = '__i18nOrig_' + attr;
      if (!el[dKey]) el[dKey] = v;
      list.push({ el, attr, original: el[dKey] });
    });
  });
  return list;
}
function applyAutoTranslations(map) {
  // Text nodes
  collectAutoTextNodes().forEach(node => {
    let original = __autoOriginals.get(node);
    if (!original) { original = node.textContent; __autoOriginals.set(node, original); }
    const trimmed = original.replace(/\s+/g, ' ').trim();
    if (!trimmed) return;
    if (lang === 'en') {
      if (node.textContent !== original) node.textContent = original;
      return;
    }
    const tr = map[trimmed];
    if (tr && tr !== trimmed) {
      // preserve surrounding whitespace
      node.textContent = original.replace(trimmed, tr);
    }
  });
  // Attribute targets
  collectAutoAttrTargets().forEach(({ el, attr, original }) => {
    if (lang === 'en') { el.setAttribute(attr, original); return; }
    const trimmed = original.replace(/\s+/g, ' ').trim();
    const tr = map[trimmed];
    if (tr && tr !== trimmed) el.setAttribute(attr, tr);
  });
}
function scheduleAutoTranslate() {
  clearTimeout(__autoTimer);
  __autoTimer = setTimeout(runAutoTranslate, 250);
}
async function runAutoTranslate() {
  if (lang === 'en') {
    // Restore originals
    applyAutoTranslations({});
    return;
  }
  if (__autoInflight) { scheduleAutoTranslate(); return; }
  loadAutoCache();
  // Collect uniques
  const uniq = new Set();
  collectAutoTextNodes().forEach(n => {
    let original = __autoOriginals.get(n);
    if (!original) { original = n.textContent; __autoOriginals.set(n, original); }
    const t = original.replace(/\s+/g, ' ').trim();
    if (t) uniq.add(t);
  });
  collectAutoAttrTargets().forEach(({ original }) => {
    const t = original.replace(/\s+/g, ' ').trim();
    if (t) uniq.add(t);
  });
  // Filter out things already in static PUBLIC_TEXT (handled separately)
  const needed = [...uniq].filter(s => {
    if (PUBLIC_TEXT[s] && PUBLIC_TEXT[s][lang]) {
      // copy to autoCache so applyAutoTranslations picks up if static walker missed
      __autoCache[s] = PUBLIC_TEXT[s][lang];
      return false;
    }
    return !(s in __autoCache);
  });
  // Apply what we already have
  applyAutoTranslations(__autoCache);
  if (!needed.length) return;
  __autoInflight = true;
  try {
    // Batch in groups of 50
    const BATCH = 50;
    for (let i = 0; i < needed.length; i += BATCH) {
      const slice = needed.slice(i, i + BATCH);
      try {
        const r = await fetch('/api/translate', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ texts: slice, lang })
        });
        if (!r.ok) throw new Error('translate http ' + r.status);
        const j = await r.json();
        if (Array.isArray(j.translations)) {
          slice.forEach((src, k) => {
            const tr = j.translations[k];
            if (typeof tr === 'string' && tr) __autoCache[src] = tr;
          });
        }
      } catch (err) { console.warn('translate batch err:', err.message); }
    }
    persistAutoCache();
    applyAutoTranslations(__autoCache);
  } finally { __autoInflight = false; }
}
function setupAutoMutationObserver() {
  if (__autoObserver) return;
  try {
    __autoObserver = new MutationObserver(muts => {
      let needs = false;
      for (const m of muts) {
        if (m.type === 'childList' && (m.addedNodes.length || m.removedNodes.length)) { needs = true; break; }
        if (m.type === 'characterData') { needs = true; break; }
      }
      if (needs) scheduleAutoTranslate();
    });
    __autoObserver.observe(document.body, { childList: true, subtree: true, characterData: true });
  } catch(e) { console.warn('mut obs failed:', e.message); }
}

// Build switcher widget
function buildSwitcher() {
  if (document.getElementById('hc-lang-switcher')) return;
  const sw = document.createElement('div');
  sw.id = 'hc-lang-switcher';
  sw.style.cssText = 'position:fixed;top:60px;right:14px;z-index:8888;display:flex;gap:4px;background:rgba(13,17,23,.85);border:1px solid rgba(212,175,55,.25);border-radius:24px;padding:4px 8px;backdrop-filter:blur(10px);box-shadow:0 4px 20px rgba(0,0,0,.4);user-select:none';
  LANGS.forEach(l => {
    const btn = document.createElement('button');
    btn.textContent = l.flag + ' ' + l.name;
    btn.title = l.full;
    btn.style.cssText = `background:none;border:none;cursor:pointer;font-size:11px;font-weight:600;padding:3px 8px;border-radius:16px;transition:background .15s,color .15s;color:${l.code===lang?'#d4af37':'rgba(255,255,255,.55)'}`;
    if (l.code === lang) btn.style.background = 'rgba(212,175,55,.18)';
    btn.addEventListener('click', () => {
      lang = l.code;
      localStorage.setItem('hc_ui_lang', lang);
      __autoCache = null;
      applyTranslations();
      sw.querySelectorAll('button').forEach((b, i) => {
        b.style.background = LANGS[i].code === lang ? 'rgba(212,175,55,.18)' : 'none';
        b.style.color = LANGS[i].code === lang ? '#d4af37' : 'rgba(255,255,255,.55)';
      });
    });
    sw.appendChild(btn);
  });
  document.body.appendChild(sw);
}

// ── INIT ────────────────────────────────────────────────────────────────────
function bootI18n() {
  buildSwitcher();
  applyTranslations();
  setTimeout(applyTranslations, 1200);
  setupAutoMutationObserver();
}
document.addEventListener('DOMContentLoaded', bootI18n);
if (document.readyState !== 'loading') bootI18n();

// Expose globally
window.hcI18n = {
  t, applyTranslations,
  setLang: (code) => {
    lang = code;
    localStorage.setItem('hc_ui_lang', lang);
    __autoCache = null; // re-load per-lang cache
    applyTranslations();
  },
  retranslate: () => scheduleAutoTranslate()
};

})();
