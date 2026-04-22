# Hospitality Careers – Job Portal

## Project Overview
A full-featured hospitality job portal with role-based authentication (Owner, Admin, Prime, User), Firebase backend, multi-page dashboard, trilingual support (EN/HI/BN), AI chatbot, and smart request approval display system.

## Tech Stack
- **Frontend**: Pure HTML5, CSS3, Vanilla JavaScript (ES Modules)
- **Backend**: Express.js (static file server on port 5000)
- **Database**: Firebase Firestore
- **Auth**: Firebase Authentication (Email/Password + Google)
- **Storage**: Firebase Storage (CV uploads, logos)

## Pages
| File | Description |
|------|-------------|
| `index.html` | Login page with dynamic hero slideshow |
| `profile.html` | First-time profile completion |
| `user-feed.html` | Normal user dashboard (Find Job + Hire Staff) |
| `prime-feed.html` | Prime member dashboard (unlocked features) |
| `owner-feed.html` | Owner full-control dashboard (MPIN protected) |
| `admin-feed.html` | Admin dashboard (MPIN protected, authority-based) |
| `job-post-from.html` | Job posting form |
| `membership.html` | Prime membership purchase page (UPI + HC Wallet payment) |
| `help.html` | FAQs (incl. HC Wallet & Refer & Earn) |

## HC Wallet & Refer & Earn (NEW)
- **HC Wallet**: 1 point = ₹1. Users top-up via UPI → submit UTR → owner approves in `walletTopups` section → balance auto-credited.
- **Pay from Wallet**: On membership.html, users can pay Prime instantly from wallet (no UTR/owner approval).
- **Refer & Earn**: Each user gets a unique `referralCode` + share link. When a referred user becomes Prime (owner approves), both parties auto-credited 10 points (₹10) and recorded in `referralRewards`.
- **Owner Dashboard sections**: HC Wallet Top-ups (approve/reject), Wallet Records (full ledger), Refer & Earn Records (all successful referrals + stats).
- **Firestore collections**: `walletTopups`, `walletTransactions`, `referralRewards`. User doc fields: `walletBalance`, `referralCode`, `referredBy`, `referredByCode`, `primeReferralCredited`, `referralPrimeCount`.
- **Shared module**: `js/wallet-ui.js` (attachWallet UI, payMembershipFromWallet, maybeCreditReferral).

## Firebase Deployment (from VS Code)
1. `npm install -g firebase-tools`
2. `firebase login`
3. `firebase functions:secrets:set GEMINI_API_KEY` (paste key)
4. `firebase deploy` — deploys hosting + functions + rules.
5. Gemini AI calls (`/api/chat`, `/api/resume`) auto-route to Cloud Functions in production via `firebase.json` rewrites.

## User Roles & Redirects
- **Owner** (ssandeepsarkar143@gmail.com) → `owner-feed.html`
- **Admin** → `admin-feed.html` (MPIN set by Owner)
- **Prime** → `prime-feed.html`
- **User** → `user-feed.html` (then `profile.html` if new)

## Firebase Config
- Project: `hospitality-careers-e662f`
- Auth: Email/Password + Google enabled
- Firestore collections: `users`, `jobPosts`, `applications`, `requests`, `offers`, `upgrades`, `mpins`, `notifications`, `feedback`

## Key Features
- Dynamic background slideshow with hospitality images
- Animated logo with pulse effect
- MPIN protection for Owner and Admin dashboards
- Promote User to Admin with custom authority permissions
- Membership (₹499/month) with UPI + QR payment
- Job search with filters (department, position, state, city, salary)
- Paginated job listings (10 per page)
- CV upload for job applications
- Revenue dashboard with live Firestore stats
- Discount/offer/upgrade system from Owner dashboard

## Logo
Place your logo file as `logo.png` in the project root (also stored in `public/logo.png`).

## Recent Fixes
- Logo fixed: `jogo.png` reference in `profile.html` corrected to `/logo.png`; `logo.png` copied to root
- CV upload made optional in job apply form – users can submit without uploading a resume
- UPI redirect fixed: uses `window.location.href` instead of programmatic anchor click
- Site settings (owner-feed): Added Firebase Storage photo upload for owner & admin photos; added Admin Name field; fixed save using `{ merge: true }`
- About page: Admin photo/name section added, shown dynamically when set in site settings
- Admin dashboard: "Edit Site Content" section added with full site settings editing + photo upload capability
- **v2 Fixes (2026-04)**:
  - `index.html`: Anonymous user no longer redirected to profile page (`!user.isAnonymous` check added)
  - `prime-feed.html`: `requestResumeDownload`, `requestContact`, `requestEmployerConnect` made global (`window.xxx`) so inline onclick handlers work; `showToast` updated to support type parameter
  - `user-feed.html`, `prime-feed.html`, `admin-feed.html`: App download section added — loads settings from Firestore and shows Android/iOS buttons if enabled by owner
  - `owner-feed.html`: Managers section added to site settings (with instant photo compress/preview); offer categories added (prime/prime2/prime3/newUsers1Week/specificUser/all)
  - `membership.html`: Offer loading now filters by category based on user role and join date
  - `about.html`: Managers/team members grid added, shown when set by owner
  - `profile.html`: Profile photo upload with instant compress+preview added
- **Replit migration (2026-04)**:
  - Installed Express dependency for Replit runtime
  - Kept existing static HTML/CSS/JS/Firebase architecture intact
  - Restricted Express static serving to public assets and known HTML pages so server/config files are not exposed
- **Public language + assistant update (2026-04)**:
  - Added full static text translation support for About, Feedback, Help, and Contact pages using English, Hindi, and Bangla selections
  - Added query-language support for public pages (`?lang=en`, `?lang=hi`, `?lang=bn`) while retaining the existing language switcher
  - Updated AI assistant with a professional animated floating bot logo
  - Separated assistant language from website language; assistant can be changed from chat language chips or commands such as `set assistant language Bangla`, `set assistant language Hindi`, or `set assistant language English`
- **Profile & Feedback fixes (2026-04)**:
  - `index.html`: New users with `profileComplete: false` now correctly redirected to `profile.html` on login
  - `owner-feed.html`: Feedback Records panel now has "Show Publicly" toggle per feedback entry; toggling updates `isPublic` in Firestore instantly
  - `feedback.html`: Static placeholder reviews hidden when real owner-approved public reviews exist in Firestore; up to 10 real reviews shown
  - `owner-feed.html`: Broadcast Notification now supports "Job Seekers Only" and "Employers Only" targets (filters by `userType` field)
- **Google auth handling (2026-04)**:
  - Added Google sign-in redirect fallback when popup sign-in is blocked or unsupported
  - Added clearer Firebase Authorized Domain error messaging for Google login/signup
  - Added autocomplete attributes to login/signup fields
  - Firebase Google sign-in requires the active Replit preview/published domain to be added in Firebase Console → Authentication → Settings → Authorized domains

## UPI Payment
UPI ID: `ssandeepsarkar143-2@okhdfcbank`
Business Name: `Hospitality Careers`

## Run
```
node server.js
```
Port: 5000

## v3 Major Update (2026-04-22)
- **Backend AI** (`server.js`):
  - Added `express.json` body parsing
  - New `/api/chat` — Gemini-powered assistant; accepts message + history + lang; uses `gemini-flash-latest`
  - New `/api/resume` — Gemini structured JSON output for AI resume generation
  - Reads `GEMINI_API_KEY` from secrets; optional `GEMINI_MODEL` env override
  - Serves `manifest.webmanifest`, `sw.js`, `offline.html`
- **AI Assistant** (`js/chatbot.js`): Now calls `/api/chat` with Gemini; falls back to keyword KB if API fails. Status bar reads "Powered by Google Gemini". Multilingual auto-reply (EN/HI/BN).
- **AI Resume Builder** (`resume-builder.html` — new page):
  - 4-step wizard (Personal / Experience / Skills / Generate)
  - Sends profile to `/api/resume`, renders live HTML preview
  - jsPDF-based client-side PDF download (no server roundtrip needed for download)
- **Contact page** (`contact.html`): Default email/phone/address placeholders are now empty italic gray ("Email not set yet" etc). Owner-set values from `siteContent/settings` instantly replace them.
- **PWA / Mobile App**:
  - `manifest.webmanifest` — installable web app (Android & iOS), standalone display, shortcuts to Find Jobs / Resume Builder / Membership
  - `sw.js` — service worker with shell caching + offline page + network-first HTML
  - `offline.html` — friendly offline fallback
  - `js/pwa-install.js` — auto-shown install banner (Android `beforeinstallprompt` + iOS Safari "Add to Home Screen" hint), 7-day dismiss memory
  - All 12 main HTML pages updated with manifest link, theme color (`#d4af37`), apple-touch-icon, and PWA install script
- **Help page** (`help.html`): 3 new categories with 9 new FAQ entries — AI Assistant, Resume Builder, Install App (Android + iOS + offline + auto-update)
- **Navigation**: Added "Resume" link in nav + footer of all public pages (index, about, contact, feedback, help, resume-builder)
