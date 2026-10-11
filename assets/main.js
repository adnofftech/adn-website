const b=document.querySelector('.burger'),u=document.querySelector('nav ul');
if(b)b.addEventListener('click',()=>{const o=u.classList.toggle('open');b.setAttribute('aria-expanded',o)});
const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}}),{threshold:.12});
document.querySelectorAll('.reveal').forEach(el=>io.observe(el));
// Suggestion du jour : lue depuis suggestion.json
const s=document.getElementById('suggestion');
if(s)fetch('suggestion.json').then(r=>r.json()).then(d=>{
  const dt=new Date(d.date+'T12:00:00').toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long'});
  s.innerHTML=`<p class="eyebrow">${dt}</p><h2>${d.titre}</h2><p>${d.description}</p>${d.prix?`<p class="price">${d.prix}</p>`:''}`;
}).catch(()=>{s.innerHTML='<h2>Appelez-nous</h2><p>La suggestion du jour est à découvrir au 02 62 21 73 82.</p>'});
// Formulaire : ouvre le mail du restaurant
const f=document.getElementById('contact-form');
if(f)f.addEventListener('submit',e=>{e.preventDefault();const d=new FormData(f);
  const body=`${d.get('message')}\n\nTéléphone : ${d.get('tel')||'-'}\nDe : ${d.get('email')}`;
  location.href=`mailto:siege@lerefletdesiles.com?subject=${encodeURIComponent(d.get('sujet'))}&body=${encodeURIComponent(body)}`});
