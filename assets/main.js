(() => {
  const burger = document.querySelector('.burger'), nav = document.getElementById('nav');
  if (burger) burger.addEventListener('click', () => {
    burger.setAttribute('aria-expanded', nav.classList.toggle('open'));
  });
  const els = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    }), { threshold: .12 });
    els.forEach(el => io.observe(el));
  } else els.forEach(el => el.classList.add('in'));
})();
