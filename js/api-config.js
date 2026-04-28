/**
 * Hospitality Careers — front-end API base resolver.
 *
 * On Replit / localhost: AI calls go to the local Express server (relative
 * URLs, e.g. `/api/chat`).
 * On Firebase Hosting (production): AI calls go to the Cloudflare Worker that
 * proxies to Gemini and holds the API key as an encrypted secret.
 *
 * After you deploy the Worker (see cloudflare-worker/README.md), replace the
 * placeholder below with your real Worker URL and redeploy Firebase Hosting.
 *
 * Loaded as a plain <script>; exposes:
 *   window.HC_AI_BASE   — the resolved base origin (no trailing slash)
 *   window.hcApiUrl(p)  — helper to prefix any /api/* path
 */
(function () {
  'use strict';

  // ── EDIT ME after `wrangler deploy` ────────────────────────────────────────
  // Example: 'https://hospitality-gemini.your-subdomain.workers.dev'
  var HC_AI_BASE_PROD = 'https://hospitality-gemini.ssandeepsarkar143.workers.dev';
  // ───────────────────────────────────────────────────────────────────────────

  function resolveBase() {
    try {
      var override = (typeof localStorage !== 'undefined') && localStorage.getItem('HC_AI_BASE_OVERRIDE');
      if (override) return override.replace(/\/+$/, '');
    } catch (_) {}
    var h = (typeof location !== 'undefined' && location.hostname) || '';
    var isReplitLocal = !h
      || h === 'localhost'
      || h === '127.0.0.1'
      || h === '0.0.0.0'
      || h.endsWith('.replit.dev')
      || h.endsWith('.repl.co')
      || h.endsWith('.replit.app')
      || h.endsWith('.spock.replit.dev')
      || h.endsWith('.picard.replit.dev');
    if (isReplitLocal && h !== 'localhost' && h !== '127.0.0.1' && h !== '0.0.0.0') return (HC_AI_BASE_PROD || '').replace(/\/+$/, '');
    if (isReplitLocal) return ''; // keep local Express for localhost, but use Worker in Replit preview
    return (HC_AI_BASE_PROD || '').replace(/\/+$/, '');
  }

  var BASE = resolveBase();
  window.HC_AI_BASE = BASE;
  window.hcApiUrl = function (path) {
    if (!path) return BASE;
    if (!BASE) return path;                    // relative call to local server
    if (/^https?:\/\//i.test(path)) return path; // already absolute
    return BASE + (path.charAt(0) === '/' ? '' : '/') + path;
  };
})();
