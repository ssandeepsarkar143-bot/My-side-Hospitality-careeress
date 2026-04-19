# Hospitality Careers – Job Portal

## Project Overview
A full-featured hospitality job portal with role-based authentication (Owner, Admin, Prime, User), Firebase backend, and multi-page dashboard system.

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
| `membership.html` | Prime membership purchase page |

## User Roles & Redirects
- **Owner** (ssandeepsarkar143@gmail.com) → `owner-feed.html`
- **Admin** → `admin-feed.html` (MPIN set by Owner)
- **Prime** → `prime-feed.html`
- **User** → `user-feed.html` (then `profile.html` if new)

## Firebase Config
- Project: `hospitality-careers-e662f`
- Auth: Email/Password + Google enabled
- Firestore collections: `users`, `jobPosts`, `applications`, `requests`, `offers`, `upgrades`, `mpins`

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

## UPI Payment
UPI ID: `ssandeepsarkar143-2@okhdfcbank`
Business Name: `Hospitality Careers`

## Run
```
node server.js
```
Port: 5000
