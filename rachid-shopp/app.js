(function(){
"use strict";
var D=window.RS_DATA,C=window.RS_CONFIG||{},$=function(id){return document.getElementById(id)};
var ASK="Tarif sur demande";
/* Prix relevés à côté d'un bloc voisin sur l'affiche : périmètre à faire valider par Rachid. */
var TO_CONFIRM={"camera-integrale-air-01":1,"camera-integrale-air-02":1,"camera-integrale-air-03":1,"camera-integrale-air-04":1,"lentilles-strass":1};
var SCREEN="Remplacement écran Soft OLED",BATT="Remplacement batterie";

function el(t,c,h){var e=document.createElement(t);if(c)e.className=c;if(h!=null)e.textContent=h;return e}
function eur(v){return v==null||v===""?null:v+" €"}
function opt(sel,val,label){var o=document.createElement("option");o.value=val;o.textContent=label||val;sel.appendChild(o);return o}
function skuP(s){return D.produits.filter(function(p){return p.sku===s})[0]}
function demandeURL(params){var u=new URLSearchParams();Object.keys(params).forEach(function(k){if(params[k])u.set(k,params[k])});return "demande.html?"+u.toString()}
function field(labelText,sel,id){var f=el("div","field"),l=el("label",null,labelText);l.htmlFor=sel.id=id;f.appendChild(l);f.appendChild(sel);return f}

/* ---------- Menu (téléphone et tablette) ---------- */
var tog=document.querySelector(".nav__toggle"),sheet=$("menu");
if(tog&&sheet){
  function setMenu(open){tog.setAttribute("aria-expanded",open?"true":"false");sheet.hidden=!open;document.documentElement.style.overflow=open?"hidden":""}
  tog.addEventListener("click",function(){setMenu(sheet.hidden)});
  sheet.addEventListener("click",function(e){if(e.target.closest("a"))setMenu(false)});
  document.addEventListener("keydown",function(e){if(e.key==="Escape"&&!sheet.hidden){setMenu(false);tog.focus()}});
  window.matchMedia("(min-width:1024px)").addEventListener("change",function(m){if(m.matches)setMenu(false)});
}

/* ---------- Moment : la photographie se développe une fois, à l'entrée ---------- */
document.querySelectorAll('[data-moment="picture-develops"]').forEach(function(f){
  if(!("IntersectionObserver" in window)||window.matchMedia("(prefers-reduced-motion: reduce)").matches){f.classList.add("is-done");return}
  var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){f.classList.add("is-done");io.disconnect()}})},{threshold:.35});
  io.observe(f);
});

/* ---------- Données communes ---------- */
var models=[],price={};
D.reparations.forEach(function(r){
  if(r.price_eur==null||!r.model)return;
  if(models.indexOf(r.model)<0)models.push(r.model);
  price[r.service+"|"+r.model]=r.price_eur;
});
function getP(s,m){var v=price[s+"|"+m];return v==null?null:v}
var acc=D.produits.filter(function(p){return p.category==="Accessoires iPhone"}),fam={},famOrder=[];
acc.forEach(function(p){if(!fam[p.group]){fam[p.group]=[];famOrder.push(p.group)}fam[p.group].push(p)});
function varLabel(p){return p.name.indexOf("·")>0?p.name.split("·").slice(1).join("·").trim():p.name}
function accModels(group){
  var c=(fam[group][0].compatible||"");
  if(/17 Pro/.test(c)&&!/11/.test(c))return["iPhone 17 Pro","iPhone 17 Pro Max"];
  if(/^iPhone Air$/.test(c))return["iPhone Air"];
  return models.filter(function(m){return!/iPhone X/.test(m)}).concat(["iPhone Air"]);
}
var perf=D.produits.filter(function(p){return p.category==="Parfums & muscs"});
function prof(p){var s=(p.description||"").split("·")[1];return s?s.trim():"Non précisé"}

/* ---------- Horaires, livraison, éléments à fournir ---------- */
if($("horaires-list")&&C.horaires){
  C.horaires.forEach(function(h){
    var d=el("div"),dt=el("dt",null,h.plage),dd=el("dd");
    dd.appendChild(el("span","rows__name",h.titre));dd.appendChild(el("p",null,h.texte));
    d.appendChild(dt);d.appendChild(dd);$("horaires-list").appendChild(d);
  });
  if(C.livraison&&$("livraison"))$("livraison").textContent=C.livraison.titre+", "+C.livraison.detail.charAt(0).toLowerCase()+C.livraison.detail.slice(1);
}
if($("commande-list")&&C.commande)C.commande.forEach(function(t){$("commande-list").appendChild(el("li",null,t))});

/* ---------- Réparations ---------- */
if($("modele")){
  var selM=$("modele");
  opt(selM,"","Choisir mon modèle");
  models.forEach(function(m){opt(selM,m)});
  function resRow(title,service,key,m){
    var v=getP(service,m),li=el("li");
    li.appendChild(el("span","rows__name",title));
    li.appendChild(el("span","rows__value"+(v==null?" none":""),v==null?ASK:eur(v)));
    var p=el("p",null,v==null?"Pas de tarif sur l’affiche pour ce modèle.":"Pièce et main-d’œuvre comprises.");
    var a=el("a","link","Demander cette réparation");a.href=demandeURL({article:"rep:"+key,modele:m});p.appendChild(document.createTextNode(" "));p.appendChild(a);li.appendChild(p);
    return li;
  }
  function showRep(){
    var out=$("rep-result");out.textContent="";
    var m=selM.value;
    if(!m){var li=el("li");li.appendChild(el("p",null,"Choisissez un modèle : l’écran et la batterie s’affichent avec leur tarif."));out.appendChild(li);return}
    out.appendChild(resRow("Écran Soft OLED",SCREEN,"ecran",m));
    out.appendChild(resRow("Batterie",BATT,"batterie",m));
  }
  selM.addEventListener("change",showRep);
  var pm=new URLSearchParams(location.search).get("modele");if(pm&&models.indexOf(pm)>=0)selM.value=pm;
  showRep();
  var tb=$("rep-table");
  models.forEach(function(m){
    var tr=document.createElement("tr");tr.dataset.m=m.toLowerCase();
    var th=el("th",null,m);th.scope="row";tr.appendChild(th);
    [SCREEN,BATT].forEach(function(s){var v=getP(s,m);tr.appendChild(el("td",v==null?"none":"",v==null?ASK:eur(v)))});
    tb.appendChild(tr);
  });
  $("rep-filtre").addEventListener("input",function(){
    var q=this.value.trim().toLowerCase(),n=0;
    Array.prototype.forEach.call(tb.rows,function(r){var ok=r.dataset.m.indexOf(q)>=0;r.hidden=!ok;if(ok)n++});
    $("rep-vide").hidden=n>0;
  });
  D.reparations.filter(function(r){return r.price_eur==null}).forEach(function(r){
    var tr=document.createElement("tr"),th=el("th",null,r.service);th.scope="row";tr.appendChild(th);
    var td=el("td","none");td.colSpan=2;td.textContent=ASK+" · ";
    var a=el("a","link","Demander un devis");a.href=demandeURL({article:"rep:piece",note:r.service});td.appendChild(a);tr.appendChild(td);
    $("rep-commande").appendChild(tr);
  });
}

/* ---------- Accessoires ---------- */
if($("acc-grid")){
  famOrder.forEach(function(g){
    var list=fam[g],card=el("article","card"),ph=el("div","ph"),img=el("img");img.loading="lazy";img.decoding="async";img.width=640;img.height=680;ph.appendChild(img);
    var body=el("div","card__body"),h=el("h3","t-card",g),desc=el("p",null,list[0].description),comp=el("p","muted","Compatibilité : "+list[0].compatible);
    var id=g.replace(/[^a-z0-9]+/gi,"-").toLowerCase();
    var sel=document.createElement("select");list.forEach(function(p){opt(sel,p.sku,varLabel(p))});
    var selMo=document.createElement("select");opt(selMo,"","Choisir…");accModels(g).forEach(function(m){opt(selMo,m)});
    var pr=el("p","price"),note=el("p","muted"),btn=el("a","btn btn--primary","Demander cet article"),err=el("p","field__error");err.hidden=true;
    function upd(){
      var p=skuP(sel.value);img.src=p.image;img.alt=p.alt||p.name;
      var v=eur(p.price_eur);pr.textContent=v||ASK;pr.className="price"+(v?"":" none");
      note.textContent=TO_CONFIRM[p.sku]?"Prix relevé sur l’affiche, périmètre à confirmer.":(p.group==="Verre trempé 9H"?"Pose comprise selon l’affiche.":"");
      note.hidden=!note.textContent;
      btn.href=demandeURL({article:"acc:"+g,variante:p.sku,modele:selMo.value});
    }
    sel.addEventListener("change",upd);selMo.addEventListener("change",function(){err.hidden=true;upd()});upd();
    btn.addEventListener("click",function(e){if(!selMo.value){e.preventDefault();err.textContent="Indiquez d’abord votre modèle d’iPhone.";err.hidden=false;selMo.focus()}});
    var foot=el("div","card__foot");foot.appendChild(btn);foot.appendChild(err);
    [h,desc,comp,field("Variante",sel,"v-"+id),field("Mon modèle d’iPhone",selMo,"m-"+id),pr,note,foot].forEach(function(n){body.appendChild(n)});
    card.appendChild(ph);card.appendChild(body);$("acc-grid").appendChild(card);
  });
}

/* ---------- Parfums ---------- */
if($("p-grid")){
  var types=[];perf.forEach(function(p){if(types.indexOf(p.group)<0)types.push(p.group)});
  var cur="";
  function chip(label,val){
    var b=el("button","chip",label);b.type="button";b.setAttribute("aria-pressed",val===cur?"true":"false");
    b.addEventListener("click",function(){cur=val;Array.prototype.forEach.call($("p-filters").children,function(c){c.setAttribute("aria-pressed",c===b?"true":"false")});drawPerf()});
    $("p-filters").appendChild(b);
  }
  chip("Tous",""); types.forEach(function(t){chip(t,t)});
  function drawPerf(){
    var g=$("p-grid"),n=0;g.textContent="";
    perf.forEach(function(p){
      if(cur&&p.group!==cur)return;n++;
      var c=el("article","card"),ph=el("div","ph"),i=el("img");i.src=p.image;i.alt=p.alt||p.name;i.loading="lazy";i.decoding="async";i.width=640;i.height=680;ph.appendChild(i);
      var b=el("div","card__body"),pv=eur(p.price_eur);
      b.appendChild(el("p","tag",p.group));
      b.appendChild(el("h3","t-card",p.name));
      b.appendChild(el("p",null,prof(p)+" · "+p.volume));
      b.appendChild(el("p","price"+(pv?"":" none"),pv||ASK));
      var bt=el("a","btn btn--primary","Demander ce parfum");bt.href=demandeURL({article:"perf:"+p.sku});
      var foot=el("div","card__foot");foot.appendChild(bt);
      b.appendChild(foot);c.appendChild(ph);c.appendChild(b);g.appendChild(c);
    });
    $("p-count").textContent=n+" référence"+(n>1?"s":"")+(cur?" · "+cur:"")+", tarifs confirmés affichés dès réception.";
  }
  drawPerf();
}

/* ---------- Demande ---------- */
if($("form")){
  var dt=$("d-type"),dv=$("d-var"),dm=$("d-mod");
  opt(dt,"","Choisir…");
  var g1=document.createElement("optgroup");g1.label="Réparations";
  [["rep:ecran","Remplacement écran Soft OLED"],["rep:batterie","Remplacement batterie"],["rep:piece","Pièce sur commande (écran Apple d’origine, appareil photo, support SIM)"]].forEach(function(x){opt(g1,x[0],x[1])});
  dt.appendChild(g1);
  var g2=document.createElement("optgroup");g2.label="Accessoires";famOrder.forEach(function(g){opt(g2,"acc:"+g,g)});dt.appendChild(g2);
  var g3=document.createElement("optgroup");g3.label="Parfums & muscs";perf.forEach(function(p){opt(g3,"perf:"+p.sku,p.name+" · "+p.volume)});dt.appendChild(g3);
  function fillModels(list){var keep=dm.value;dm.textContent="";opt(dm,"","Choisir…");list.forEach(function(m){opt(dm,m)});opt(dm,"Autre","Autre modèle (préciser ci-dessous)");if(keep)dm.value=keep}
  function syncForm(){
    var v=dt.value,k=v.split(":")[0];
    $("d-var-box").hidden=k!=="acc";
    $("d-mod-box").hidden=!(k==="rep"||k==="acc");
    if(k==="acc"){dv.textContent="";fam[v.slice(4)].forEach(function(p){opt(dv,p.sku,varLabel(p))});fillModels(accModels(v.slice(4)))}
    else if(k==="rep")fillModels(models.concat(["iPhone Air"]));
  }
  dt.addEventListener("change",syncForm);
  var q=new URLSearchParams(location.search);
  if(q.get("article")){dt.value=q.get("article");syncForm();if(q.get("variante"))dv.value=q.get("variante");if(q.get("modele"))dm.value=q.get("modele");if(q.get("note"))$("d-note").value=q.get("note")}
  $("form").addEventListener("submit",function(e){
    e.preventDefault();
    var err=$("d-err"),v=dt.value,k=v.split(":")[0],lines=["Bonjour, je souhaite passer commande."];
    err.hidden=true;
    if(!v){err.textContent="Choisissez un article ou une prestation dans la première liste.";err.hidden=false;dt.focus();return}
    if((k==="rep"||k==="acc")&&!dm.value){err.textContent="Indiquez le modèle exact de votre iPhone dans la liste des modèles.";err.hidden=false;dm.focus();return}
    if(k==="rep"){
      var s=v==="rep:ecran"?SCREEN:v==="rep:batterie"?BATT:null,label=dt.options[dt.selectedIndex].text;
      if(s){var pv=getP(s,dm.value);label+=" — "+(pv==null?ASK:eur(pv)+" pièce et main-d’œuvre comprises")}else label+=" — devis";
      lines.push("Prestation : "+label);
    }else if(k==="acc"){
      var p=skuP(dv.value),pa=eur(p.price_eur);
      lines.push("Article : "+v.slice(4)+" · "+varLabel(p)+" — "+(pa||ASK));
    }else{
      var pq=skuP(v.slice(5)),pp=eur(pq.price_eur);
      lines.push("Article : "+pq.name+" · "+pq.volume+" — "+(pp||ASK));
    }
    if(k==="rep"||k==="acc")lines.push("Modèle d’iPhone : "+dm.value);
    var n=$("d-note").value.trim();if(n)lines.push("Précisions : "+n);
    lines.push("Adresse complète : ","Numéro de téléphone : ");
    $("recap").value=lines.join("\n");$("recap-box").hidden=false;$("copy-msg").textContent="";
    var oc=$("open-canal");
    if(C.contact&&C.contact.url){oc.href=C.contact.url;oc.textContent=C.contact.libelle||"Ouvrir le canal de commande";oc.hidden=false}
    $("recap-box").scrollIntoView({block:"nearest"});$("recap").focus();
  });
  $("copy").addEventListener("click",function(){
    var ta=$("recap"),m=$("copy-msg");
    function ok(){m.textContent="Récapitulatif copié. Collez-le dans votre message à Rachid."}
    function ko(){ta.focus();ta.select();m.textContent="Copie automatique impossible : le texte est sélectionné, copiez-le manuellement."}
    if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(ta.value).then(ok,ko);
    else{ta.focus();ta.select();try{document.execCommand("copy")?ok():ko()}catch(x){ko()}}
  });
}
})();
