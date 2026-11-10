(function(){
"use strict";
var D=window.RS_DATA, $=function(id){return document.getElementById(id)};
var ASK="Tarif sur demande";
// Prix relevés à côté d'un bloc voisin sur l'affiche : périmètre à faire valider par Rachid.
var TO_CONFIRM={"camera-integrale-air-01":1,"camera-integrale-air-02":1,"camera-integrale-air-03":1,"camera-integrale-air-04":1,"lentilles-strass":1};
function el(t,c,h){var e=document.createElement(t);if(c)e.className=c;if(h!=null)e.textContent=h;return e}
function eur(v){return v==null||v===""?null:v+" €"}
function opt(sel,val,label){var o=document.createElement("option");o.value=val;o.textContent=label||val;sel.appendChild(o)}

/* ---------- Réparations ---------- */
var SCREEN="Remplacement écran Soft OLED",BATT="Remplacement batterie",models=[],price={};
D.reparations.forEach(function(r){
  if(r.price_eur==null||!r.model)return;
  if(models.indexOf(r.model)<0)models.push(r.model);
  price[r.service+"|"+r.model]=r.price_eur;
});
function getP(s,m){var v=price[s+"|"+m];return v==null?null:v}
var selM=$("modele");
opt(selM,"","Choisir mon modèle");
models.forEach(function(m){opt(selM,m)});
function resBox(title,v){
  var b=el("div","res");b.appendChild(el("small",null,title));
  var p=el("div","price"+(v==null?" none":""),v==null?ASK:eur(v));b.appendChild(p);
  if(v!=null)b.appendChild(el("small",null,"Pièce et main-d’œuvre comprises"));
  return b;
}
function showRep(){
  var out=$("rep-result");out.textContent="";
  var m=selM.value;if(!m){out.appendChild(el("p","muted","Sélectionnez un modèle pour voir les tarifs."));return}
  out.appendChild(resBox("Écran Soft OLED · "+m,getP(SCREEN,m)));
  out.appendChild(resBox("Batterie · "+m,getP(BATT,m)));
}
selM.addEventListener("change",showRep);showRep();
var tb=$("rep-table");
models.forEach(function(m){
  var tr=document.createElement("tr");tr.dataset.m=m.toLowerCase();
  var th=el("th",null,m);th.scope="row";tr.appendChild(th);
  [SCREEN,BATT].forEach(function(s){var v=getP(s,m);tr.appendChild(el("td",null,v==null?ASK:eur(v)))});
  tb.appendChild(tr);
});
$("rep-filtre").addEventListener("input",function(){
  var q=this.value.trim().toLowerCase(),n=0;
  Array.prototype.forEach.call(tb.rows,function(r){var ok=r.dataset.m.indexOf(q)>=0;r.hidden=!ok;if(ok)n++});
  $("rep-vide").hidden=n>0;
});

/* ---------- Accessoires ---------- */
var acc=D.produits.filter(function(p){return p.category==="Accessoires iPhone"}),fam={},famOrder=[];
acc.forEach(function(p){if(!fam[p.group]){fam[p.group]=[];famOrder.push(p.group)}fam[p.group].push(p)});
function varLabel(p,i){return p.name&&p.name!==p.group?p.name:"Variante "+(i+1)}
function famTitle(g){return g}
famOrder.forEach(function(g){
  var list=fam[g],card=el("article","card"),img=el("img");img.loading="lazy";img.width=600;img.height=600;
  var body=el("div","body"),h=el("h3",null,famTitle(g)),desc=el("p",null,list[0].description),comp=el("p",null,"Compatibilité : "+list[0].compatible);
  var lab=el("label",null,"Variante"),sel=document.createElement("select");lab.htmlFor=sel.id="v-"+list[0].sku;
  list.forEach(function(p,i){opt(sel,p.sku,varLabel(p,i))});
  var pr=el("div","price"),note=el("p","muted"),btn=el("button","btn ice","Demander cet article");btn.type="button";
  function upd(){
    var p=list.filter(function(x){return x.sku===sel.value})[0];
    img.src=p.image;img.alt=p.alt||p.name;
    var v=eur(p.price_eur);pr.textContent=v||ASK;pr.className="price"+(v?"":" none");
    note.textContent=TO_CONFIRM[p.sku]?"Tarif relevé sur l’affiche, à confirmer.":(p.group==="Verre trempé 9H"?"Pose comprise selon l’affiche.":"");
    btn.dataset.family=g;btn.dataset.sku=p.sku;
  }
  sel.addEventListener("change",upd);upd();
  btn.addEventListener("click",function(){prefill(g,sel.value)});
  [h,desc,comp,lab,sel,pr,note,btn].forEach(function(n){body.appendChild(n)});
  card.appendChild(img);card.appendChild(body);$("acc-grid").appendChild(card);
});

/* ---------- Parfums ---------- */
var perf=D.produits.filter(function(p){return p.category==="Parfums & muscs"});
function prof(p){var s=(p.description||"").split("·")[1];return s?s.trim():"Non précisé"}
function uniq(f){var a=[];perf.forEach(function(p){var v=f(p);if(a.indexOf(v)<0)a.push(v)});return a.sort()}
function fill(id,all,vals){var s=$(id);opt(s,"",all);vals.forEach(function(v){opt(s,v)})}
fill("f-type","Tous les types",uniq(function(p){return p.group}));
fill("f-vol","Toutes les contenances",uniq(function(p){return p.volume}));
fill("f-prof","Tous les profils",uniq(prof));
function drawPerf(){
  var t=$("f-type").value,v=$("f-vol").value,pf=$("f-prof").value,g=$("p-grid"),n=0;g.textContent="";
  perf.forEach(function(p){
    if((t&&p.group!==t)||(v&&p.volume!==v)||(pf&&prof(p)!==pf))return;n++;
    var c=el("article","card"),i=el("img");i.src=p.image;i.alt=p.alt||p.name;i.loading="lazy";i.width=600;i.height=600;
    var b=el("div","body"),pv=eur(p.price_eur);
    b.appendChild(el("h3",null,p.name));
    b.appendChild(el("p",null,p.group+" · "+prof(p)+" · "+p.volume));
    b.appendChild(el("div","price"+(pv?"":" none"),pv||ASK));
    var bt=el("button","btn champ","Demander ce parfum");bt.type="button";bt.addEventListener("click",function(){prefill("perf:"+p.sku)});
    b.appendChild(bt);c.appendChild(i);c.appendChild(b);g.appendChild(c);
  });
  $("p-count").textContent=n+" référence"+(n>1?"s":"")+" sur "+perf.length;
  $("p-vide").hidden=n>0;
}
["f-type","f-vol","f-prof"].forEach(function(id){$(id).addEventListener("change",drawPerf)});
$("p-reset").addEventListener("click",function(){["f-type","f-vol","f-prof"].forEach(function(id){$(id).value=""});drawPerf();$("f-type").focus()});
drawPerf();

/* ---------- Demande ---------- */
var dt=$("d-type"),dv=$("d-var"),dm=$("d-mod"),needModel={};
opt(dt,"","Choisir…");
var g1=document.createElement("optgroup");g1.label="Réparations";
[["rep:ecran","Réparation écran Soft OLED"],["rep:batterie","Remplacement batterie"],["rep:piece","Pièce sur commande (écran Apple d’origine, appareil photo, SIM)"]].forEach(function(x){opt(g1,x[0],x[1])});
dt.appendChild(g1);
var g2=document.createElement("optgroup");g2.label="Accessoires";
famOrder.forEach(function(g){opt(g2,"acc:"+g,g)});dt.appendChild(g2);
var g3=document.createElement("optgroup");g3.label="Parfums & muscs";
perf.forEach(function(p){opt(g3,"perf:"+p.sku,p.name+" · "+p.volume)});dt.appendChild(g3);
opt(dm,"","Choisir…");models.concat(["iPhone Air","Autre modèle (à préciser)"]).forEach(function(m){opt(dm,m)});
function syncForm(){
  var v=dt.value,k=v.split(":")[0];
  $("d-var-box").hidden=k!=="acc";
  $("d-mod-box").hidden=!(k==="rep"||k==="acc");
  if(k==="acc"){dv.textContent="";fam[v.slice(4)].forEach(function(p,i){opt(dv,p.sku,varLabel(p,i))})}
}
dt.addEventListener("change",syncForm);
function prefill(a,b){
  var key=a.indexOf(":")>0?a:"acc:"+a;dt.value=key;syncForm();if(b)dv.value=b;
  $("demande").scrollIntoView();dt.focus();
}
document.addEventListener("click",function(e){
  var t=e.target.closest&&e.target.closest("[data-prefill]");if(!t)return;
  e.preventDefault();prefill("rep:piece");
});
function skuP(s){return D.produits.filter(function(p){return p.sku===s})[0]}
$("form").addEventListener("submit",function(e){
  e.preventDefault();
  var err=$("d-err"),v=dt.value,k=v.split(":")[0],lines=["Bonjour, je souhaite passer commande."],label;
  err.hidden=true;
  if(!v){err.textContent="Choisissez un article ou une prestation.";err.hidden=false;dt.focus();return}
  if(k==="rep"||k==="acc"){
    if(!dm.value){err.textContent="Indiquez le modèle exact de votre iPhone.";err.hidden=false;dm.focus();return}
  }
  if(k==="rep"){
    var s=v==="rep:ecran"?SCREEN:v==="rep:batterie"?BATT:null;
    label=dt.options[dt.selectedIndex].text;
    if(s){var pv=getP(s,dm.value);label+=" ("+(pv==null?ASK:eur(pv))+")"}
    lines.push("Prestation : "+label);
  }else if(k==="acc"){
    var p=skuP(dv.value),pa=eur(p.price_eur);
    lines.push("Article : "+v.slice(4));
    lines.push("Variante : "+varLabel(p,fam[p.group].indexOf(p))+" ("+(pa||ASK)+")");
  }else{
    var q=skuP(v.slice(5)),pq=eur(q.price_eur);
    lines.push("Article : "+q.name+" · "+q.volume+" ("+(pq||ASK)+")");
  }
  if(k==="rep"||k==="acc")lines.push("Modèle d’iPhone : "+dm.value);
  var n=$("d-note").value.trim();if(n)lines.push("Précisions : "+n);
  lines.push("Adresse complète : …","Numéro de téléphone : …");
  $("recap").value=lines.join("\n");$("recap-box").hidden=false;$("copy-msg").textContent="";
  $("recap-box").scrollIntoView();
});
$("copy").addEventListener("click",function(){
  var ta=$("recap"),m=$("copy-msg");
  function ok(){m.textContent="Récapitulatif copié."}
  function ko(){ta.focus();ta.select();m.textContent="Copie automatique impossible : le texte est sélectionné, copiez-le manuellement."}
  if(navigator.clipboard&&navigator.clipboard.writeText){navigator.clipboard.writeText(ta.value).then(ok,ko)}
  else{ta.focus();ta.select();try{document.execCommand("copy")?ok():ko()}catch(x){ko()}}
});
})();
