/* Démarrage */
(function () {
  'use strict';
  const ctx = window.EJ.ctx;
  ctx.load();
  if (!location.hash) location.hash = '#/aujourdhui';
  ctx.render();
  setInterval(() => { const a = document.activeElement; if (!ctx.modal && !(a && /INPUT|SELECT|TEXTAREA/.test(a.tagName)) && /^#\/aujourdhui$/.test(location.hash || '#/')) ctx.render(); }, 60000);
})();
