(function () {
  'use strict';
  if (window.__hcTrustBannerLoaded) return;
  window.__hcTrustBannerLoaded = true;

  function inject() {
    if (document.getElementById('hcVerifiedBanner')) return;

    var bar = document.createElement('div');
    bar.id = 'hcVerifiedBanner';
    bar.setAttribute('role', 'note');
    bar.setAttribute('aria-label', 'Verified site notice');
    bar.style.cssText = [
      'position:relative',
      'z-index:9998',
      'width:100%',
      'box-sizing:border-box',
      'background:linear-gradient(90deg,rgba(15,28,20,0.96),rgba(20,40,28,0.96))',
      'color:#e9f5ec',
      'font-family:"Poppins",system-ui,-apple-system,Segoe UI,Roboto,sans-serif',
      'font-size:12px',
      'line-height:1.45',
      'padding:6px 14px',
      'display:flex',
      'align-items:center',
      'justify-content:center',
      'gap:10px',
      'flex-wrap:wrap',
      'border-bottom:1px solid rgba(52,208,88,0.35)',
      'box-shadow:0 1px 0 rgba(0,0,0,0.25)'
    ].join(';');

    bar.innerHTML =
      '<span aria-hidden="true" style="display:inline-flex;align-items:center;justify-content:center;width:18px;height:18px;border-radius:50%;background:#34d058;color:#0b1c12;font-size:11px;font-weight:900">' +
        '<svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
          '<rect x="5" y="11" width="14" height="9" rx="2"/>' +
          '<path d="M8 11V7a4 4 0 0 1 8 0v4"/>' +
        '</svg>' +
      '</span>' +
      '<span><strong style="color:#fff;font-weight:700">Verified site</strong> — Official Hospitality Careers portal</span>' +
      '<span style="opacity:0.55">·</span>' +
      '<span>Contact: <a href="mailto:help.hospitalitycareers@outlook.com" style="color:#9be7a7;text-decoration:none;font-weight:600">help.hospitalitycareers@outlook.com</a></span>';

    var body = document.body;
    if (body && body.firstChild) {
      body.insertBefore(bar, body.firstChild);
    } else if (body) {
      body.appendChild(bar);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inject, { once: true });
  } else {
    inject();
  }
})();
