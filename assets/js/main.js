(function () {
  'use strict';
  var MAIL = 'contact@lafabrique.re';
  document.documentElement.classList.remove('no-js');

  /* Menu mobile */
  var btn = document.getElementById('menu-btn');
  var nav = document.getElementById('mobile-nav');
  if (btn && nav) {
    btn.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      btn.setAttribute('aria-expanded', open);
      btn.querySelector('span').textContent = open ? 'Fermer' : 'Menu';
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('open')) { btn.click(); btn.focus(); }
    });
  }

  /* Statut d'ouverture : mercredi-samedi, 12h00-14h30 et 19h45-22h30 (heure de La Réunion) */
  document.querySelectorAll('[data-status]').forEach(function (el) {
    try {
      var parts = new Intl.DateTimeFormat('fr-FR', { timeZone: 'Indian/Reunion', weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(new Date());
      var get = function (t) { return parts.filter(function (p) { return p.type === t; })[0].value; };
      var day = { 'lun.': 1, 'mar.': 2, 'mer.': 3, 'jeu.': 4, 'ven.': 5, 'sam.': 6, 'dim.': 0 }[get('weekday')];
      var min = parseInt(get('hour'), 10) % 24 * 60 + parseInt(get('minute'), 10);
      var slots = [[720, 870], [1185, 1350]];
      var openDay = day >= 3 && day <= 6;
      var open = openDay && slots.some(function (s) { return min >= s[0] && min < s[1]; });
      el.dataset.state = open ? 'open' : 'closed';
      el.querySelector('.txt').textContent = open ? 'Ouvert actuellement' : 'Fermé actuellement · du mercredi au samedi';
    } catch (e) { el.hidden = true; }
  });

  /* Apparition au scroll */
  var items = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
    }, { threshold: .12 });
    items.forEach(function (i) { io.observe(i); });
  } else { items.forEach(function (i) { i.classList.add('in'); }); }

  /* Formulaires : validation + ouverture du client mail */
  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  var PHONE_RE = /^[+\d][\d\s.()-]{7,}$/;

  function setError(field, msg) {
    var f = field.closest('.field');
    var err = f.querySelector('.error');
    f.classList.toggle('invalid', !!msg);
    field.setAttribute('aria-invalid', msg ? 'true' : 'false');
    if (err) { err.textContent = msg || ''; field.setAttribute('aria-describedby', err.id); }
    return !msg;
  }

  function check(field, form) {
    var v = field.value.trim();
    var label = (form.querySelector('label[for="' + field.id + '"]') || {}).textContent || 'Ce champ';
    label = label.replace('*', '').trim();
    if (field.required && !v) return setError(field, label + ' est obligatoire.');
    if (field.type === 'email' && v && !EMAIL_RE.test(v)) return setError(field, 'Saisissez une adresse e-mail valide, par exemple nom@exemple.re.');
    if (field.type === 'tel' && v && !PHONE_RE.test(v)) return setError(field, 'Saisissez un numéro de téléphone valide.');
    if (field.type === 'number' && v) {
      var n = Number(v);
      if (field.min && n < Number(field.min)) return setError(field, 'Minimum ' + field.min + ' personnes pour le service traiteur.');
    }
    if (field.type === 'date' && v) {
      var d = new Date(v + 'T00:00:00'), limit = new Date();
      limit.setHours(0, 0, 0, 0); limit.setDate(limit.getDate() + 2);
      if (d < limit) return setError(field, 'Commande minimum 48 h à l\'avance : choisissez une date à partir du ' + limit.toLocaleDateString('fr-FR') + '.');
    }
    return setError(field, '');
  }

  document.querySelectorAll('form[data-mailto]').forEach(function (form) {
    form.setAttribute('novalidate', '');
    var fields = form.querySelectorAll('input, textarea');
    fields.forEach(function (f) {
      f.addEventListener('blur', function () { if (f.value || f.closest('.field').classList.contains('invalid')) check(f, form); });
      f.addEventListener('input', function () { if (f.closest('.field').classList.contains('invalid')) check(f, form); });
    });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var firstBad = null;
      fields.forEach(function (f) { if (!check(f, form) && !firstBad) firstBad = f; });
      if (firstBad) { firstBad.focus(); return; }
      var lines = [];
      fields.forEach(function (f) {
        var lab = (form.querySelector('label[for="' + f.id + '"]') || {}).textContent || f.name;
        lab = lab.replace('*', '').trim();
        var val = f.value.trim();
        if (f.type === 'date' && val) val = val.split('-').reverse().join('/');
        if (val) lines.push(lab + ' : ' + val);
      });
      var body = (form.dataset.intro ? form.dataset.intro + '\n\n' : '') + lines.join('\n') + '\n';
      var href = 'mailto:' + MAIL + '?subject=' + encodeURIComponent(form.dataset.subject) + '&body=' + encodeURIComponent(body);
      var res = form.querySelector('.form-result');
      if (res) {
        res.querySelector('a.again').setAttribute('href', href);
        res.classList.add('show');
        res.setAttribute('tabindex', '-1');
        res.focus();
      }
      window.location.href = href;
    });
  });
})();
