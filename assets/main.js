(() => {
  const burger = document.querySelector('.burger'), nav = document.getElementById('nav');
  if (burger) burger.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    burger.setAttribute('aria-expanded', open);
  });

  // Apparition au scroll (IntersectionObserver, sans listener de scroll)
  const els = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    }), { threshold: .12 });
    els.forEach(el => io.observe(el));
  } else els.forEach(el => el.classList.add('in'));

  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  // Suggestion du jour, lue depuis suggestion.json
  const sug = document.getElementById('suggestion');
  if (sug) fetch('suggestion.json').then(r => r.ok ? r.json() : Promise.reject()).then(d => {
    if (!d.titre) throw 0;
    const dt = new Date(d.date + 'T12:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
    sug.innerHTML = `<p class="date">${esc(dt)}</p><h2>${esc(d.titre)}</h2>` +
      (d.description ? `<p>${esc(d.description)}</p>` : '') + (d.prix ? `<p class="price">${esc(d.prix)}</p>` : '');
    sug.setAttribute('aria-busy', 'false');
  }).catch(() => {
    sug.innerHTML = '<h2>La suggestion arrive</h2><p>Elle change chaque jour. Appelez-nous au 02 62 21 73 82 pour la connaître.</p>';
    sug.setAttribute('aria-busy', 'false');
  });

  // Galerie, lue depuis galerie.json
  const gal = document.getElementById('galerie');
  if (gal) fetch('galerie.json').then(r => r.json()).then(list => {
    if (!list.length) throw 0;
    gal.className = 'gal';
    gal.innerHTML = list.map(p => `<figure><img src="${esc(p.src)}" alt="${esc(p.alt || '')}" loading="lazy"></figure>`).join('');
  }).catch(() => {});

  // Formulaire: validation en ligne puis ouverture du mail du restaurant
  const f = document.getElementById('contact-form');
  if (f) f.addEventListener('submit', e => {
    e.preventDefault();
    let ok = true;
    f.querySelectorAll('[required]').forEach(i => {
      const err = f.querySelector('#' + i.id + '-err');
      const bad = !i.value.trim() || (i.type === 'email' && !/^\S+@\S+\.\S+$/.test(i.value));
      i.setAttribute('aria-invalid', bad);
      err.textContent = bad ? (i.type === 'email' ? 'Entrez une adresse e-mail valide.' : 'Ce champ est obligatoire.') : '';
      if (bad) ok = false;
    });
    if (!ok) return;
    const d = new FormData(f);
    const body = `${d.get('message')}\n\nTéléphone : ${d.get('tel') || 'non renseigné'}\nDe la part de : ${d.get('email')}`;
    f.querySelector('.ok').textContent = 'Votre messagerie va s\'ouvrir pour envoyer le message.';
    location.href = `mailto:siege@lerefletdesiles.com?subject=${encodeURIComponent(d.get('sujet'))}&body=${encodeURIComponent(body)}`;
  });
})();
