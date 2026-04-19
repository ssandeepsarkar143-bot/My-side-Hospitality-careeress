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

## UPI Payment
UPI ID: `ssandeepsarkar143-2@okhdfcbank`
Business Name: `Hospitality Careers`

## Run
```
node server.js
```
Port: 5000
