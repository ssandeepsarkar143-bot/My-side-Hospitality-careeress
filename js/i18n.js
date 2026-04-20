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

let lang = localStorage.getItem('hc_ui_lang') || 'en';

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
      applyTranslations();
      if (window.hcChat) window.hcChat.setLang(lang);
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
document.addEventListener('DOMContentLoaded', () => {
  buildSwitcher();
  applyTranslations();
});

// If DOM already loaded
if (document.readyState !== 'loading') {
  buildSwitcher();
  applyTranslations();
}

// Expose globally
window.hcI18n = { t, applyTranslations, setLang: (code) => { lang = code; localStorage.setItem('hc_ui_lang', lang); applyTranslations(); } };

})();
