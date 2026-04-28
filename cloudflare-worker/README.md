# Cloudflare Worker — Gemini AI Proxy

This Worker is the free-tier replacement for the Express `/api/*` endpoints in
`server.js`. It runs the same chat / chat-stream / resume / translate logic and
holds the Gemini API key as an encrypted secret so the browser never sees it.

**Cost:** Cloudflare Workers free plan = 100,000 requests/day, no credit card.

---

## Endpoints (drop-in compatible with the local Express server)

| Path | Method | Purpose |
|---|---|---|
| `/api/chat` | POST | Non-streaming HC Assistant chat |
| `/api/chat-stream` | POST | Streaming (SSE) HC Assistant chat |
| `/api/resume` | POST | AI resume generator (with local fallback) |
| `/api/job-match` | POST | Score candidate profile against open jobs (top-K) |
| `/api/translate` | POST | Batch UI translation (en → hi/bn) |
| `/api/preview-end` | POST | No-op beacon (returns 204) |

---

## Deploy in 5 minutes

### 1. Install Wrangler (Cloudflare's CLI) — one time
```bash
npm install -g wrangler
wrangler login    # opens browser → sign in / create free account
```
Cloudflare signup needs only an email + password. **No credit card.**

### 2. Set the Gemini API key as an encrypted secret
Get a free key from https://aistudio.google.com/apikey then run:
```bash
cd cloudflare-worker
wrangler secret put GEMINI_KEY
# paste the AIza... key when prompted, press Enter
```

### 3. (Optional) Restrict CORS to your Firebase Hosting domain
Edit `wrangler.toml` and set:
```toml
[vars]
ALLOWED_ORIGINS = "https://hospitality-careers-e662f.web.app,https://hospitality-careers-e662f.firebaseapp.com"
```
Leave it blank or `"*"` to allow any origin (fine for testing).

### 4. Deploy
```bash
wrangler deploy
```
You'll see something like:
```
Published hospitality-gemini
  https://hospitality-gemini.<your-subdomain>.workers.dev
```

### 5. Wire the front-end to the worker
Open `js/api-config.js` in the project root and replace the placeholder:
```js
const HC_AI_BASE_PROD = 'https://hospitality-gemini.<your-subdomain>.workers.dev';
```
with your real Worker URL. Then redeploy Firebase Hosting:
```bash
firebase deploy --only hosting
```

That's it. The chatbot, resume builder, and auto-translate will now route
through the Worker on production, and continue using the local Express
server on Replit / `localhost`.

---

## Verify it works

```bash
curl -X POST https://hospitality-gemini.<your-subdomain>.workers.dev/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message":"What is HC Wallet?","lang":"en"}'
```
Expected: `{"reply":"..."}`

For the SSE stream:
```bash
curl -N -X POST https://hospitality-gemini.<your-subdomain>.workers.dev/api/chat-stream \
  -H "Content-Type: application/json" \
  -d '{"message":"Hello","lang":"en"}'
```
You should see `data: {"delta":"..."}` lines stream in.

---

## Updating the Worker later
After any edit to `worker.js`:
```bash
cd cloudflare-worker
wrangler deploy
```
No client redeploy needed unless you change the API shape.
