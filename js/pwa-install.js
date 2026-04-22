(function () {
  'use strict';
  if (!('serviceWorker' in navigator)) return;

  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });

  let deferredPrompt = null;
  const KEY_DISMISS = 'hc_pwa_dismissed_until';
  const dismissedUntil = parseInt(localStorage.getItem(KEY_DISMISS) || '0', 10);
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
  if (isStandalone) return;

  function injectStyles() {
    if (document.getElementById('hc-pwa-style')) return;
    const s = document.createElement('style');
    s.id = 'hc-pwa-style';
    s.textContent = `
      #hc-pwa-banner{position:fixed;left:12px;right:12px;bottom:12px;max-width:420px;margin:0 auto;background:rgba(15,15,25,.96);backdrop-filter:blur(14px);border:1px solid rgba(212,175,55,.35);border-radius:14px;padding:12px 14px;display:flex;align-items:center;gap:12px;z-index:99998;box-shadow:0 12px 36px rgba(0,0,0,.55);font-family:'Poppins',system-ui,sans-serif;color:#fff;animation:hcSlideUp .35s ease}
      @keyframes hcSlideUp{from{transform:translateY(120%);opacity:0}to{transform:translateY(0);opacity:1}}
      #hc-pwa-banner img{width:38px;height:38px;border-radius:9px;flex-shrink:0;background:#fff;padding:3px;object-fit:contain}
      #hc-pwa-text{flex:1;min-width:0}
      #hc-pwa-text b{display:block;font-size:13px;color:#d4af37}
      #hc-pwa-text span{display:block;font-size:11.5px;color:rgba(255,255,255,.7);margin-top:2px;line-height:1.35}
      #hc-pwa-banner button{border:none;cursor:pointer;font-family:inherit;font-weight:700;font-size:11.5px;border-radius:18px;padding:7px 13px}
      .hc-pwa-install{background:linear-gradient(135deg,#d4af37,#f5d060);color:#1a1a2e}
      .hc-pwa-skip{background:rgba(255,255,255,.08);color:rgba(255,255,255,.7)}
    `;
    document.head.appendChild(s);
  }

  function showBanner({ title, body, actionText, onAction }) {
    if (document.getElementById('hc-pwa-banner')) return;
    if (Date.now() < dismissedUntil) return;
    injectStyles();
    const el = document.createElement('div');
    el.id = 'hc-pwa-banner';
    el.innerHTML = `<img src="/logo.png" alt="" onerror="this.style.display='none'"/>
      <div id="hc-pwa-text"><b>${title}</b><span>${body}</span></div>
      <button class="hc-pwa-install" id="hc-pwa-go">${actionText}</button>
      <button class="hc-pwa-skip" id="hc-pwa-skip" title="Dismiss">✕</button>`;
    document.body.appendChild(el);
    document.getElementById('hc-pwa-go').addEventListener('click', onAction);
    document.getElementById('hc-pwa-skip').addEventListener('click', () => {
      localStorage.setItem(KEY_DISMISS, String(Date.now() + 7 * 24 * 60 * 60 * 1000));
      el.remove();
    });
  }

  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    setTimeout(() => {
      showBanner({
        title: '📲 Install Hospitality Careers',
        body: 'Add this app to your home screen for one-tap access, faster loads & offline support.',
        actionText: 'Install',
        onAction: async () => {
          const banner = document.getElementById('hc-pwa-banner');
          if (deferredPrompt) {
            deferredPrompt.prompt();
            try { await deferredPrompt.userChoice; } catch {}
            deferredPrompt = null;
          }
          if (banner) banner.remove();
        }
      });
    }, 4000);
  });

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  if (isIOS) {
    setTimeout(() => {
      showBanner({
        title: '📲 Install on iPhone',
        body: 'Tap the Share button below, then choose "Add to Home Screen" to install as an app.',
        actionText: 'Got it',
        onAction: () => {
          localStorage.setItem(KEY_DISMISS, String(Date.now() + 30 * 24 * 60 * 60 * 1000));
          const b = document.getElementById('hc-pwa-banner'); if (b) b.remove();
        }
      });
    }, 5000);
  }

  window.addEventListener('appinstalled', () => {
    const b = document.getElementById('hc-pwa-banner'); if (b) b.remove();
    localStorage.setItem(KEY_DISMISS, String(Date.now() + 365 * 24 * 60 * 60 * 1000));
  });
})();
