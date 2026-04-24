# Firebase Deploy Guide — Hospitality Careers

Project ID: `hospitality-careers-e662f`
Owner: `ssandeepsarkar143@gmail.com`

---

## 1) One-time setup (only the first time)

```bash
# Install the Firebase CLI globally
npm install -g firebase-tools

# Login with the OWNER Google account
firebase login

# Link this folder to the project
firebase use hospitality-careers-e662f
```

---

## 2) Deploy the live security rules (CRITICAL — do this first)

The new sections (Activity Records, Freeze Users, Chat Group Admins) write to
new Firestore collections. The local `firestore.rules` already has the right
permissions, but until you push them, writes from the dashboard will be denied
silently and you'll see warnings in the browser console.

```bash
firebase deploy --only firestore:rules
firebase deploy --only firestore:indexes
firebase deploy --only storage
```

> If you see `403 PERMISSION_DENIED` or "rule-deny" warnings in the console
> after Edit / Freeze / Coupon / Offer actions, this step was skipped.

---

## 3) Set the Gemini API key as a Functions secret

Replit holds your `GEMINI_API_KEY` for development. For production (Cloud
Functions), it must be stored as a Functions secret:

```bash
firebase functions:secrets:set GEMINI_API_KEY
# Paste the same key when prompted, then press Enter.

# Verify it's there:
firebase functions:secrets:access GEMINI_API_KEY
```

The function in `functions/index.js` already declares
`runWith({ secrets: ['GEMINI_API_KEY'] })` so it will pick it up automatically
on the next deploy.

---

## 4) Deploy Cloud Functions (Gemini AI backend)

```bash
cd functions
npm install
cd ..
firebase deploy --only functions
```

After this, the live AI Resume Builder, Chatbot, and any other Gemini-powered
features will work in production exactly as they do on Replit.

---

## 5) Deploy Hosting (the actual website)

```bash
firebase deploy --only hosting
```

Your site will be live at:
- `https://hospitality-careers-e662f.web.app`
- `https://hospitality-careers-e662f.firebaseapp.com`
- (plus any custom domain you've connected)

---

## 6) Deploy everything in one shot (after the first time)

Once secrets and rules are set, daily deploys can be a single command:

```bash
firebase deploy
```

---

## 7) After every deploy — quick sanity check

1. Open the live URL in a private window.
2. Log in as the OWNER and confirm:
   - Edit Promoted User modal opens (not blank)
   - Freeze User flow works end-to-end
   - Activity Records show recent coupon / offer / referral events
   - AI Resume Records → "View" + "PDF" both work
3. Log in as a normal user and try the AI Resume Builder
   (this calls the live Gemini Function).
4. Switch language EN → हि → বাং on Home / About / Contact
   to confirm the switcher persists across pages.

---

## 8) Rollback (if something breaks)

```bash
# List recent hosting releases
firebase hosting:channel:list

# Rollback hosting to the previous release
firebase hosting:rollback

# For Functions, redeploy the previous Git commit:
git checkout <previous-commit>
firebase deploy --only functions
git checkout main
```

---

## Common issues

| Symptom | Fix |
|---|---|
| "Missing or insufficient permissions" on Edit / Freeze | Run step 2 — rules not deployed |
| AI Resume / Chatbot returns "Failed to fetch" in prod | Run step 3 + 4 — secret or function not deployed |
| Language switcher doesn't appear on a public page | Confirm `<script src="js/i18n.js"></script>` is at the bottom of that HTML file |
| Group chat "Report failed" toast | Storage CORS not configured — run `gsutil cors set cors.json gs://hospitality-careers-e662f.appspot.com` |
| Service worker showing old version | Hard-refresh (Ctrl+Shift+R) or bump the cache version in `service-worker.js` |
