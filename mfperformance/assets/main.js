(function () {
  var burger = document.querySelector('.burger');
  var nav = document.getElementById('nav');
  burger.addEventListener('click', function () {
    var open = nav.classList.toggle('open');
    burger.setAttribute('aria-expanded', open);
  });
  nav.addEventListener('click', function (e) {
    if (e.target.tagName === 'A') {
      nav.classList.remove('open');
      burger.setAttribute('aria-expanded', 'false');
    }
  });

  var tabs = document.querySelectorAll('.tabs button');
  var cards = document.querySelectorAll('#cards .card');
  tabs.forEach(function (t) {
    t.addEventListener('click', function () {
      tabs.forEach(function (b) { b.setAttribute('aria-selected', b === t); });
      cards.forEach(function (c) {
        c.hidden = t.dataset.f !== 'all' && c.dataset.c !== t.dataset.f;
      });
    });
  });
})();
