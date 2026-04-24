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

## HC Wallet, Refer & Earn, Withdraw, Coupons (NEW)
- **HC Wallet**: 1 point = ₹1. Top-up via UPI → submit UTR → owner approves in `walletTopups` → balance auto-credited.
- **Pay from Wallet**: On membership.html, users pay Prime instantly from wallet.
- **Withdraw to UPI**: Users withdraw ₹200+ to their UPI; wallet debited immediately. Owner sees in `walletWithdrawals` section → Mark Paid (notify) or Reject (auto-refund). Collection: `walletWithdrawals`.
- **Refer & Earn**: Unique `referralCode` per user; on referee Prime approval, both get 10 pts. Logged in `referralRewards`.
- **Coupons**: Owner creates coupons (discount ₹X / trial X days / 1 month free) and targets specific user, all users, normal users, all Prime, or specific Prime tier (Prime, Prime2, Prime3, … dynamically). Users get notification + see "My Coupons" card on dashboard. Discount auto-applies on Membership page; trial/freeMonth instantly upgrades to Prime. Collection: `coupons` (one doc per target user). User doc field: `activeCoupon`.
- **Owner Dashboard sections**: HC Wallet Top-ups, Wallet Withdrawals, Wallet Records (ledger), Refer & Earn Records, Create & Send Coupons (with stats + table).
- **Firestore collections**: `walletTopups`, `walletTransactions` (types: topup/spend/referral/withdraw/refund/adjust), `walletWithdrawals`, `referralRewards`, `coupons`.
- **User doc fields**: `walletBalance`, `referralCode`, `referredBy`, `referredByCode`, `primeReferralCredited`, `referralPrimeCount`, `activeCoupon`.
- **Shared module**: `js/wallet-ui.js` (attachWallet UI: balance/topup/withdraw/history + My Coupons + referral; payMembershipFromWallet, maybeCreditReferral).

## Firebase Deployment (from VS Code) — Phase 9 Final
**One-time setup:**
1. `npm install -g firebase-tools`
2. `firebase login`
3. `firebase use hospitality-careers-e662f`

**Setting the Gemini API key (CRITICAL — without this, AI Resume + Chatbot won't work in production):**
4. Get a free Gemini API key from https://aistudio.google.com/apikey
5. Run: `firebase functions:secrets:set GEMINI_API_KEY`
6. When prompted, paste the API key (starts with `AIza...`) and press Enter.
7. Verify with: `firebase functions:secrets:access GEMINI_API_KEY` (should print the key).

**Deploy everything:**
8. `firebase deploy` — deploys hosting + functions + rules + storage rules in one go.
   - For partial deploys: `firebase deploy --only hosting,firestore:rules,functions`
   - For rules only: `firebase deploy --only firestore:rules` (run after editing `firestore.rules`)

**How AI calls work after deploy:**
- All `/api/chat`, `/api/resume`, `/api/preview-end` calls auto-route to Cloud Functions via `firebase.json` rewrites.
- The function reads `GEMINI_API_KEY` from Firebase Secrets at runtime — no `.env` file needed.
- If AI returns "API key not configured": re-run step 5 and redeploy with `firebase deploy --only functions`.

**Verify AI Resume Builder works after deploy:**
1. Open `https://hospitality-careers-e662f.web.app/resume-builder.html`
2. Fill name + job target + 1 experience + 1 skill → click **Generate My Resume**
3. Should show formatted resume within 5–10s. If "Failed": open browser console → look for `/api/resume` response → if 500, GEMINI_API_KEY missing or quota exceeded.

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

## Phase 4 Update (2026-04-23) — Connect Hub & Group Chat
- **New module `js/group-chat.js`** — shared real-time group chat (auth-gated)
  - Floating FAB (bottom-right) opens slide-in panel
  - List view → thread view with message bubbles (me/them/system styles)
  - Real-time `onSnapshot` for groups + messages
  - Modern WhatsApp-style UI (gold accent, dark theme)
- **Owner Connect Hub** (`owner-feed.html` → new sidebar item "Connect Hub")
  - Create groups by state filter + role category preset:
    - "Management" (Op Mgr + Branch Head auto-tick)
    - "All Team" (every admin auto-tick)
    - "Marketing" (Marketing Mgr + Recruiter + TL auto-tick)
  - Custom mode: pick states → members appear grouped by role with checkboxes
  - Existing groups table: Active/Closed status, dismiss/restore/delete buttons
  - Welcome system message auto-posted on group creation
- **Admins** (`admin-feed.html`) — same group-chat module loads after MPIN unlock; admins see/chat in groups they're members of; cannot create
- **Help page audience filter** (`help.html`)
  - FAQ items can be tagged `data-audience="all|user|admin|owner"`
  - Auto-applies on auth state change based on user's role
- **Firestore rules** — added `connectGroups` + `connectGroups/{id}/messages` (members read/write own; owner full; messages immutable except by owner) + `auditLog` rules
- **Safety fix**: `js/firebase-config.js` now uses `getApps().length ? getApp() : initializeApp(...)` to avoid double-init when both inline scripts and the shared module load

## Phase 5 + Phase 6 Update (2026-04-23)
### Phase 5 — Switch Admin View (Owner Preview Mode)
- "Switch View" blue button on every admin row in `Admin Working` table (owner-feed)
- Opens `admin-feed.html?previewAs=<UID>&previewName=<name>` in new tab
- admin-feed.html detects `previewAs` query param + verifies signed-in user is the owner
- Loads target admin's user doc → uses their `adminData` (authorities, locations, role) for the entire dashboard
- Skips MPIN screen entirely (owner already authenticated)
- Red banner pinned at top: "PREVIEW MODE — Viewing as <Name> · Read-only · Exit Preview"
- All write controls (`btn-primary`, `btn-success`, `btn-danger`, `btn-warning`, submit inputs) auto-disabled after 600ms (excludes preview banner + group chat panel)
- Owner sees the dashboard exactly as that admin sees it — same sidebar items, same data scope

### Phase 6 — Gemini Live AI mix
- **Server** (`server.js`):
  - New `/api/chat-stream` Server-Sent Events endpoint
  - Calls Gemini's `streamGenerateContent?alt=sse` for token-by-token streaming
  - Same model fallback chain as `/api/chat`
  - Returns SSE: `data: {delta:...}` per chunk, `event: done` final
- **Chatbot** (`js/chatbot.js`):
  - Streams replies live (typing-cursor `▊` shown during stream)
  - Mic button (🎙) for voice input via Web Speech Recognition (auto-language: en-US/hi-IN/bn-IN)
  - Speaker toggle (🔊/🔇) — when ON, AI replies spoken via Web Speech Synthesis
  - Settings persist in `localStorage` (`hc_speaker`)
  - Graceful fallback: stream fails → non-stream `/api/chat` → static KB
  - Recording state: red pulsing ring around mic button + "🎙 Listening…" placeholder

### Project Status Summary (all phases)
| Phase | Feature | Status |
|---|---|---|
| 1 | Owner Dashboard foundation (auth categories, audit log, Op Mgr role) | ✅ |
| 2 | mPIN system upgrade (View/Change/Delete, state-filtered records, restrictions) | ✅ |
| 3 | Promoted admin user control + state filter | ✅ |
| 4 | Connect Hub + group chats + help audience filter | ✅ |
| 5 | Switch Admin View preview mode | ✅ |
| 6 | Firebase deploy + i18n + Gemini Live mix | ✅ |
| 7 | Promotion Delegation fix + Switch View admin filter broadened | ✅ |
| 8 | MPIN Rotation Reminders, User Credentials issuance, Reports Center, Group Chat overhaul (presence, read-receipts, screenshot upload, meeting link, notifications, PDF reports) | ✅ |

### Phase 8 — New collections / paths
- `presence/{uid}` — heartbeat docs (lastSeen serverTimestamp; online window 90s)
- `chatReports/{id}` — PDF metadata for daily/monthly/yearly chat reports (PDF in Storage at `chatReports/{groupId}/`)
- `userCredentials/{uid}` — owner-issued Email + Password records for promoted users
- `mpinReminderConfig/default` — owner-configured rotation threshold (days)
- `connectGroups/{id}.meetingLink` — owner-set Zoom/Meet/Teams URL surfaced as Join button
- `connectGroups/{id}/messages/*.readBy[]` — per-message read receipts (members can update only this field)

Group chat (`js/group-chat.js`) is initialised on owner-feed, user-feed, and prime-feed pages.

### Deploy
1. `firebase login`
2. `firebase functions:secrets:set GEMINI_API_KEY`
3. `firebase deploy`

Note: SSE streaming (`/api/chat-stream`) works in dev (Express). On Firebase Hosting the client gracefully falls back to non-stream `/api/chat` Cloud Function. Voice in/out works in any modern browser regardless of backend.

### Phase 9 — Critical bug fixes + dashboard mirror + deploy guide
- Bug fixes: modal class `active` (not `show`) for freezeUserModal & editPromotedUserModal; defensive coercion of `u.authorities` (was breaking `auths.includes`); coupon success message visibility (`.show` class + toast bridge); Group Chat Report failed alert replaced with non-blocking toast; AI Resume Records: added Download PDF button via `window.__downloadMyResume`.
- `js/freeze-guard.js` (new) — fullscreen overlay for frozen users, wired into owner/user/prime/admin feeds.
- `logActivity` now warns on rule-deny (was silently failing) — see DEPLOY_GUIDE.md step 2.
- AI Resume Records section mirrored to **admin-feed.html** (gated by `auth_perms.resumeRecords`) — promoted users with that authority now see the same View/PDF table the owner has.
- `resume-builder.html` now loads `js/i18n.js` so the language switcher appears on it too.
- `DEPLOY_GUIDE.md` (new) — step-by-step Firebase deploy: rules, Gemini secret, functions, hosting, rollback, common-issue table.

### Still pending (not blocking)
- Mirror Activity Records / Freeze / Location-Compare sections to admin-feed (currently owner-only by design).
- Add Edit/Freeze action buttons on Op Manager / Branch Head rows (currently shown on Admin rows only).
- Expand `PUBLIC_TEXT` dictionary in `js/i18n.js` for any uncovered strings on public pages.
