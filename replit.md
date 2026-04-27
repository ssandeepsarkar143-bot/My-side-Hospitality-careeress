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

## Recent Fixes (2026-04-27, Latest)
- **Admin Working Dashboard for promoted admins**: The "Admin Working" sidebar item (gated by `auth_perms.adminWorking`, shown for Operations Manager / Branch Head and any admin with the Admin-Working permission) now mirrors the owner's dashboard but scoped to the current admin's allocated states. The table lists each in-scope sub-admin with five live work counters fetched in parallel — Jobs approved, Contacts approved, Resumes approved, Memberships approved, Candidates hired (`approvedBy`/`hiredBy` queries against `jobPosts`, `requests`, `applications`) — and three actions per row: **Edit** (reuses `openAdminEditRole`), **Remove** (`adminRemovePromoted` — confirms, demotes to User, clears authorities/locations, deletes MPIN, writes a `forceReauth` so the demoted user is logged out, audits via `logAdminAudit`) and **Report** (`adminGenerateReport` — lazy-loads jsPDF and downloads a per-admin PDF with profile + operational counters; no Storage upload required). Self is always excluded; Operations Manager / Branch Head rows are read-only ("Locked (higher role)"). No View, no Freeze.
- **"Account Temporarily Frozen" overlay copy**: `js/freeze-guard.js` no longer says "contact the Owner" — replaced with a professional Management mention ("please reach out to Management through your usual support channel"), and "Logout is disabled while frozen" softened to "Sign-out is disabled while the hold is active".
- **Promoted Admins list excludes self**: `loadManagePromoted` now filters out the current admin's own row entirely (`a.id !== currentUser.uid`) instead of rendering it with a "Cannot edit self" label.
- **Admin "My Dashboard" stat-card drill-down**: The promoted-admin's My Dashboard stat cards (Users (My States), Prime Members, Revenue, Live Jobs, Applications, Connect Approved, Resume Approved, Contact Approved, AI Resumes Built) are now **clickable** and open a detail modal — exactly like the owner's Revenue Dashboard. Implementation: `loadAdminRevenue` now caches the already-state-filtered raw data (users / apps / jobs / reqs / resumes) into `__adRevRawData`; `adStatCard` accepts an optional `key` and renders the card as clickable with a "Click for details →" hint when supplied; new `window.showAdminRevenueDetail(key)` opens `#adminRevenueDetailModal` and renders a per-key drill-down table (member/app/job/request lists with state column, totals, hired/pending counts, with-photo splits, etc.). Everything stays scoped to `adminData.locations` because the cached data was already filtered through `adPassRevFilter`.
- **Re-auth overlay shows "Management" instead of personal name**: The fullscreen "Your access has been updated" overlay now displays `Updated by Management · <timestamp>` regardless of which owner/ops-manager actually performed the edit. The editor's true identity is still preserved in the audit log and the `roleUpdated` notification metadata. Change is in `js/role-reauth-guard.js` only — no Firestore migration needed.
- **Admin tag now shows role**: The navbar badge in admin-feed previously read just "Admin"; it now renders as `Admin · <adminRole>` (e.g. "Admin · Branch Head", "Admin · Operations Manager"). The tag span got a stable id `adminTagEl` and the init code sets the text from `adminData.adminRole` right after fetching the user doc.
- **Admin "Enable Chat" button missing**: When the Owner added an admin to a group chat, the admin received the notification text but no clickable button (the rendering only existed in user-feed/prime-feed). Added the same `enableChatBubble` button + handler to admin-feed.html notifications panel: detects `n.type === 'enableChatBubble'` and renders a cyan gradient "Enable Chat" button under the message; clicking it sets `users/{uid}.chatBubbleEnabled = true`, marks the notification read+enabled, lazy-loads `js/group-chat.js?v=3` so the floating bubble mounts immediately. Auto-mark-as-read now skips `enableChatBubble` so the button stays visible until the admin clicks it.
- **Force re-login after Edit Promoted User (owner → admin)**: Owner's `saveEditPromotedUser` now (1) snapshots the previous role/authorities/locations, (2) computes a clean diff (`grantedAuths`, `revokedAuths`, `addedLocations`, `removedLocations`, `roleChanged`), (3) writes a `forceReauth` object onto the user doc only when something the admin can SEE actually changed, (4) creates a `roleUpdated` in-app notification with a human-readable summary in the bell tray. The watcher is implemented as a **shared module** `js/role-reauth-guard.js` (loaded on all 4 feeds: owner / admin / user / prime, like `freeze-guard.js`) so the prompt fires no matter which page the admin is on. It listens via `onSnapshot(users/{uid})`, anchors the session start at `auth.currentUser.metadata.lastSignInTime` (cached in `sessionStorage` to survive intra-session navigations) and shows the overlay when `forceReauth.at > sessionAnchor + 1500ms`. The professional fullscreen overlay (amber theme, 🔐) shows: editor name, timestamp, role change, granted/revoked permission chips, added/removed location chips, plus a "Re-Login Now" button, a 10-second auto-logout countdown, and clears the `forceReauth` field via `deleteField()` before signing out so the next sign-in starts clean. Existing Firestore data is preserved — only what the admin can see changes (allocated-locations filter naturally hides removed-state data on next login). Skipped for owner and for owner-preview-as-admin sessions. Diagnostic logs (`[ReauthGuard] …`) are emitted to the browser console so the watcher can be verified in DevTools.
- **Change Password (all 4 feeds)**: Added a navbar-mounted Change Password button + modal to user-feed, prime-feed, admin-feed, owner-feed. Uses Firebase EmailAuthProvider re-authentication; writes a security notification + audit log on success. Min 6-char enforcement, friendly errors for `wrong-password`, `weak-password`, `requires-recent-login`.
- **Show/Hide password eye toggle**: All Change Password modal fields (current/new/confirm) on every feed now have the same eye-icon toggle as the login page. Implemented via a shared `js/toggle-pw.js` helper.
- **Default-MPIN warning auto-clear**: Saving a new (non-0000) MPIN now writes `{isDefault:false, mustChange:false}` with merge:true and removes the dashboard banner instantly. The lock-screen banner also disappears on subsequent logins. Saving `0000` as a new MPIN is rejected.
- **Group Chat "Read by" privacy**: Owner row now shows only "👑 CEO" (no email, no name leak). Other members render with display name + role fallback only.
- **profile.html signup fix**: `Submit Profile` button silently failed because hidden state-select fields had `required`. Removed `required` (state is optional, validated in JS). Added `currentUser` null guard.
- **Group chat bubble gating (hardened, defense in depth)**: Floating chat bubble + "My Group Chats" panel (`#gc-fab`) no longer auto-mounts for non-owners. The bubble shows ONLY when ALL three conditions are met: (1) user is the platform owner, OR (2) `chatBubbleEnabled === true` AND (3) user is a member of at least one `connectGroups` doc (verified by an `array-contains` query on `memberUids`). Even if a stale `chatBubbleEnabled:true` flag is present, no group membership = no bubble. The enable-flag watcher (`onSnapshot`) re-verifies membership before mounting too. Cache-busted all `import('./js/group-chat.js')` paths to `?v=3` across user/prime/admin/owner-feed so the new logic loads on every browser. Console hint logged when bubble is hidden so user can verify in DevTools.
- **Owner notifications click-to-detail**: Owner-feed "All Notifications" panel rows are now clickable (`cursor:pointer`). Clicking opens a detail modal showing: target user (avatar, displayName, email, role, UID — resolved live from `users` collection), or broadcast audience (Prime / All / Admins / Job Seekers / Employers); message body; type badge; read-status badge; timestamp + "X minutes ago"; createdBy; any extra metadata (groupId, jobId, etc.); notification ID. Click outside or the × button to close.
- **Free deployment guide**: `FREE_DEPLOY_GUIDE.md` added at project root — full step-by-step Hybrid Free deployment (Firebase Hosting frontend + Firebase Spark Auth/Firestore/Storage + Cloudflare Workers Gemini proxy). Zero credit card, zero monthly cost. Includes Worker source code, exact CLI commands, firebase.json template, Auth domain whitelist steps, troubleshooting, and cost-tier table.

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
| 9 | Connect Hub overhaul v2 (admin Chatbox tab, @mentions autocomplete, Reminders, chat-admin meeting/reports/reminder access) + Branch Reports Center for Branch Heads / Operations Managers (daily/monthly/yearly + custom date PDFs viewable by Owner) | ✅ |

### Phase 9 — New collections / paths
- `branchReports/{id}` — Branch-Head / Op-Mgr PDF activity reports (period, from, to, states, generatedByUid/Name/Role, totalActions, perActor[], perState[], pdfDataUrl base64, createdAt). Owner viewer at `owner-feed.html#sec-reportsCenter` with filters by person/state/period; Branch-Head/Op-Mgr generators at `admin-feed.html#sec-reportsCenter`.
- `connectGroups/{id}/messages/*.mentionUids[]` + `mentionNames[]` — @-mention list extracted from text or attached to a `reminder` message.
- `connectGroups/{id}/messages/*.reminder` — `{ text, dueAt, mentionUids, mentionNames, byName, byUid, createdAt }`. Renders as orange reminder card; overdue items highlighted in viewer (`GroupChat.showReminders`).
- Admin sidebar adds "Chatbox" + "Reports Center" (latter only for Operations Manager / Branch Head).

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

### Phase 10 — Polish batch (Apr 2026)
**Bug fixes:**
- Admin Switch View `insertBefore` crash fixed in `setupUserControlFilter` (uses `tableWrap.parentNode`).
- Op Mgr Branch Reports Firestore composite-index error eliminated: `loadMyBranchReports` queries by `uid` only, sorts client-side.
- Promoted-admin authority not reflecting → added `onSnapshot` live sync on `users/{uid}` in admin-feed (`startLiveAdminDataSync`); sidebar nav re-renders instantly when Owner changes authorities/role/locations and a "access updated" toast fires.

**UX upgrades:**
- Owner-feed Location Comparison: replaced broken native `<select multiple>` with a pro checkbox dropdown driven by full INDIA_STATES list (Select All, search filter, persisted in `window.__lcSelectedLocs`).
- Branch Reports: both Op-Mgr generator and Owner viewer now open a **preview overlay first** (red-gradient header, KPI cards, per-actor + per-state tables); PDF is built **only when Download PDF is clicked** — no auto-download.
- Group Chat overhaul (`js/group-chat.js`):
  - Floating panel + FAB are now **fully draggable**; position persisted to `localStorage`.
  - Minimize button collapses panel to a draggable pill icon.
  - Screenshot/file uploads now show **preview-before-send** (`_stagePendingImage` / `_cancelPendingImage`); upload to Storage runs only on Send.
  - "Add Members" allowed for chat-admins (not only owner).
  - Members list shows only **CEO** crown title (no extra ranks bleeding through).
  - "Send Report" button removed from chat toolbar (reports live in Reports Center instead).

**Full trilingual coverage (EN / HI / BN — every word):**
- New server endpoint `POST /api/translate` in `server.js`: batches up to 80 strings to Gemini, returns same-order JSON array, in-memory LRU-style cache (5000-entry cap) so repeat strings are free.
- New auto-translate engine in `js/i18n.js`:
  - DOM TreeWalker collects every visible text node (skips `script`, `style`, `code`, `pre`, chat message bubbles, code editors, anything with `data-no-i18n`).
  - Also translates `placeholder`, `title`, `aria-label` attributes.
  - Filters out URLs, emails, pure numbers, single chars.
  - Caches translations per-language in `localStorage` (`hc_tr_hi`, `hc_tr_bn`) so repeat visits are instant and offline-resilient.
  - `MutationObserver` re-runs translation when dynamic content (job cards, chat panels, modals, tables) appears.
  - Static `PUBLIC_TEXT` dictionary still preferred (overrides the auto translator) — auto only fills the gaps.
  - Originals preserved in a `WeakMap` so switching back to English fully restores native text.
- Language switcher button now also clears `__autoCache` so each language has its own cached map.
- Required: `GEMINI_API_KEY` secret must be set (already done in this Repl + must be re-set in Firebase via `firebase functions:secrets:set GEMINI_API_KEY` for production — see Phase 9 deploy steps).

### Phase 11 — Revenue Dashboard filters + Promoted Dashboard + enriched Reports + 3-language switcher REMOVED (Apr 25, 2026)
**1. Owner Revenue Dashboard — date + location filters + line chart**
- Gold filter card on top of `sec-revenue` (owner-feed.html) with: 6 date presets (Today / 7d / 30d / 90d / 1y / All), from/to date pickers, INDIA-states checkbox dropdown (search, Select All/None, persisted in `window.__revSelectedStates`).
- `loadRevenue()` fully refactored — applies `passRevFilter(d)` (date + state) to users / applications / jobPosts / requests / aiResumes / feedback collections.
- New `renderMembershipLineChart()` draws a Chart.js dual-axis line chart (memberships gold, revenue green) with auto bucket sizing — daily ≤60d, weekly ≤180d, monthly otherwise.
- Chart.js 4.4.1 CDN added to owner-feed.html before js/i18n.js.

**2. Promoted-Admin Revenue Dashboard (admin-feed.html)**
- `sec-dashboard` now shows a red-themed Revenue Dashboard mirror, gated by `adminData.authorities.dashboard`.
- Location dropdown is **strictly limited** to `adminData.locations` — admin can only see/filter their allocated states.
- Stat cards are gated by the matching authority: e.g. `Membership` card requires `auth.membership`, `Live Jobs` requires `auth.jobList || auth.jobPost`, `Connect Approved` requires `auth.connectEmployer`, etc. Promoted admins only see what they're permitted to.
- Same date/preset/dropdown UX as owner; `__adRevAllowedStates`/`__adRevSelectedStates` namespace keeps it isolated.
- Same dual-axis line chart (`adminRevenueChart`).

**3. Enriched daily/branch report — `generateBranchReport()` + `showBranchReportPreview()` / `_renderOwnerBranchReportPreview()`**
- `generateBranchReport` now also pulls `users`, `applications`, and `workshops` collections (best-effort).
- New summary fields persisted to `branchReports/{id}`: `workshopCount`, `workshops[]`, `usersJoinedCount`, `usersJoinedSample`, `jobsAppliedCount`, `jobsPostedCount`, `requestsByType` (5 types each with `total/approved/rejected/pending/acceptedBy[]`), `requestPercents`, `membershipsCount`, `membershipsRevenue`, `promotedActivity[]` (each with `actions/approved/rejected/onlineMin/breakdown`), `overallPercents` (`hired`, `approvedReq`, `primeConv`).
- Preview overlays (admin + owner) rebuilt with: 6-card KPI grid (Workshops, Users Joined, Jobs Posted/Applied, Memberships, Revenue), Overall Performance %, Requests-by-Type table (with acceptors), Promoted-Persons table (online minutes + work breakdown), Per-State table, Workshops list. PDF download button still works on demand.

**4. 3-Language Switcher REMOVED**
- `js/i18n.js`: `buildSwitcher()` is now a no-op early return; `localStorage` forced to `en`; `i18nState.lang = 'en'`. The HI/BN switcher in the header no longer appears anywhere.
- `/api/translate` endpoint in server.js stays (harmless) but is unused on the client.

**5. Group Chat — Add Members filter + chat-admin save permission**
- `openManageMembers` (`js/group-chat.js`) already filters to **promoted members only** (role==='Admin') OR existing members, plus location/category/search filters from Phase 10.
- `saveMemberChanges` now allows **owner OR chat-admins** (was owner-only) — chat-admins can finally add/remove members.

**6. Firebase production: zero-error AI Resume Builder + Gemini Live AI**
- Required steps for production:
  1. `firebase login` then `firebase use hospitality-careers-e662f`
  2. `firebase functions:secrets:set GEMINI_API_KEY` → paste your key when prompted (or `printf 'KEY' | firebase functions:secrets:set GEMINI_API_KEY --data-file=-`)
  3. `firebase functions:secrets:access GEMINI_API_KEY` → must print the key
  4. `cd functions && npm install && cd ..`
  5. `firebase deploy --only functions:chat,functions:resume,hosting`
- `firebase.json` rewrites already map `/api/chat`→`exports.chat`, `/api/resume`→`exports.resume`. `functions/index.js` uses `defineSecret('GEMINI_API_KEY')` and exports both as `onRequest({ secrets: [GEMINI_API_KEY] }, …)`.
- Verify in production:
  - **AI Resume Builder** → fill 6-step wizard → click Generate → expect formatted resume in 5-10s. If 500 error: check `firebase functions:log --only resume`.
  - **Gemini Live AI / Chatbot** → click chatbot bubble → say "hi" → expect Gemini reply. If 500: check `firebase functions:log --only chat`.

### Still pending (not blocking)
- Mirror Activity Records / Freeze / Location-Compare sections to admin-feed (currently owner-only by design).
- Add Edit/Freeze action buttons on Op Manager / Branch Head rows (currently shown on Admin rows only).

---

## Phase 12 — Owner Dashboard polish + Sub-admin permissions + Chat UX (Apr 2026)

### 1. Fixed "getAllKnownStates is not defined" in Edit Promoted User → Allocated Locations
- `owner-feed.html` is two separate `<script type="module">` blocks; the function defined in block 1 was invisible to block 2.
- Exposed the helper + state list on `window` (`window.getAllKnownStates`, `window.INDIAN_STATES`) and added a safe fallback in `openEditPromotedUser` that uses `INDIAN_STATES` if anything fails to load.
- Also broadened the helper to merge in `u.locations` so admin-allocated branch names show up.

### 2. New permissions on Promote-to-Admin checklist: User Control + Admin Working Dashboard
- `ALL_AUTH_KEYS`, `ROLE_PRESETS`, `ALL_AUTHS`, and the promote-modal HTML now include `dashboard` (renamed label → "User Control") and a new `adminWorking` ("Admin Working Dashboard").
- Operations Manager and Branch Head presets get `adminWorking` automatically.
- All data shown to a sub-admin remains location-scoped (existing logic in `setupAuthority` honours `adminData.locations`).

### 3. "My Dashboard blank after edit" — fixed `saveEditPromotedUser`
- The owner's edit form was saving `authorities` as an **array** of keys. The admin-feed `setupAuthority()` reads it as **`auth_perms.dashboard`** (object). After an edit, the admin's dashboard had no permissions to render and went blank.
- `saveEditPromotedUser` now writes `authorities` as `{key: bool}` (matching `confirmPromote`), and also persists `role: 'Admin'`, `tag: 'Admin'`, `adminRole: <selected role>` — so the live snapshot listener triggers a clean re-render.

### 4. Sub-admin promote/demote permission (location-scoped)
- `nav_managePromoted` was previously only shown to Operations Manager / Branch Head. Now it's also unlocked by the granular `auth_perms.promote` checkbox (Sub-admin management).
- Underlying logic (`loadManagePromoted`) already enforces the **Promotion Delegation** config + the admin's allocated locations.

### 5. New "Admin Working Dashboard" inside admin-feed
- When `auth_perms.adminWorking` is set, the sidebar gets an "Admin Working" item and a section is injected lazily.
- `loadAdminWorkingScoped()` lists every promoted admin whose `locations` overlap the current admin's `locations` (or both empty → all-India).

### 6. MPIN screens — Logout button (both feeds)
- `owner-feed.html` and `admin-feed.html` MPIN screens have a small "Logout instead" link beneath the unlock button. It calls `signOut(auth)` and routes to `index.html`.

### 7. Auto-MPIN 0000 + professional warning + notification on promote
- `finalizePromote` (`owner-feed.html`) now creates a default `mpins/<uid>` doc with `mpin: '0000'`, `mustChange: true`, `isDefault: true` on **first promotion only** (skips if a doc already exists).
- It also writes a `notifications` doc (severity warning) telling the new admin to change their MPIN.
- `admin-feed.html`:
  - On the MPIN screen, an inline yellow banner shows "default MPIN is 0000 — change after unlock" if the doc has `mustChange/isDefault/mpin==='0000'`.
  - After a successful unlock with the default code, an in-dashboard banner persists at the top of the page with a one-click "Change Now" button that jumps to Manage MPIN.

### 8. Group Chat (Connect Hub) UX overhaul (`js/group-chat.js`)
- **Instant attach**: image previews now render at full opacity with a check-mark — no more "uploading…" spinner. The cloud upload runs in the background and the message swaps in seamlessly via `onSnapshot`.
- **Real Close vs Minimize**: minimize keeps the thread alive and morphs the FAB into a Messenger-style chat-head (`gc-chathead` class — bobs gently with a gold ring); close (`closePanel()`) tears down the thread but still asks for browser-notification permission so the user keeps getting alerts.
- **Browser notifications**: `notifyNewMessage` now pulses the chat-head, fires a tagged Notification (clickable → re-opens that thread), and flashes the document title while the tab is hidden.
- **Add Members filter (Marketing Team)**: `openManageMembers` now seeds the location dropdown from the full `INDIAN_STATES` list (plus any custom branch names admins are allocated to) and seeds the category dropdown from a standard set (Marketing Manager, Sales Manager, Accountant, Team Leader, Operations Manager, etc.).
