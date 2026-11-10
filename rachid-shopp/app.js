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
/* Modèles proposés pour un accessoire, d'après la compatibilité du catalogue. */
function accModels(group){
  var c=(fam[group][0].compatible||"");
  if(/17 Pro/.test(c)&&!/11/.test(c))return["iPhone 17 Pro","iPhone 17 Pro Max"];
  if(/^iPhone Air$/.test(c))return["iPhone Air"];
  return models.filter(function(m){return!/iPhone X/.test(m)}).concat(["iPhone Air"]);
}
var perf=D.produits.filter(function(p){return p.category==="Parfums & muscs"});
function prof(p){var s=(p.description||"").split("·")[1];return s?s.trim():"Non précisé"}

/* ---------- Horaires / livraison (accueil, demande) ---------- */
if($("horaires")&&C.horaires){
  C.horaires.forEach(function(h){
    var a=el("article","panel"),i=el("img");i.src="img/icones/"+h.icone+".svg";i.alt="";i.width=28;i.height=28;
    a.appendChild(i);a.appendChild(el("h3",null,h.plage+" · "+h.titre));a.appendChild(el("p","muted",h.texte));$("horaires").appendChild(a);
  });
  if(C.livraison)$("livraison").textContent=C.livraison.titre+". "+C.livraison.detail;
}
if($("commande-list")&&C.commande)C.commande.forEach(function(t){$("commande-list").appendChild(el("li",null,t))});

/* ---------- Réparations ---------- */
if($("modele")){
  var selM=$("modele");
  opt(selM,"","Choisir mon modèle");
  models.forEach(function(m){opt(selM,m)});
  function resBox(title,service,key,m){
    var v=getP(service,m),b=el("div","res");b.appendChild(el("small",null,title));
    b.appendChild(el("div","price"+(v==null?" none":""),v==null?ASK:eur(v)));
    b.appendChild(el("small",null,v==null?"Ce modèle n’est pas tarifé sur l’affiche.":"Pièce et main-d’œuvre comprises"));
    var a=el("a","btn "+(v==null?"line":"ice"),"Demander cette réparation");a.href=demandeURL({article:"rep:"+key,modele:m});b.appendChild(a);
    return b;
  }
  function showRep(){
    var out=$("rep-result");out.textContent="";
    var m=selM.value;if(!m){out.appendChild(el("p","muted","Sélectionnez un modèle pour afficher ses tarifs."));return}
    out.appendChild(resBox("Écran Soft OLED · "+m,SCREEN,"ecran",m));
    out.appendChild(resBox("Batterie · "+m,BATT,"batterie",m));
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
    var a=el("article","panel");a.appendChild(el("h3",null,r.service));a.appendChild(el("p","muted","Délais et modèles selon devis. "+ASK+"."));
    var l=el("a","btn line","Demander un devis");l.href=demandeURL({article:"rep:piece",note:r.service});a.appendChild(l);$("rep-commande").appendChild(a);
  });
}

/* ---------- Accessoires ---------- */
if($("acc-grid")){
  famOrder.forEach(function(g){
    var list=fam[g],card=el("article","card"),img=el("img");img.loading="lazy";img.decoding="async";img.width=640;img.height=680;
    var body=el("div","body"),h=el("h3",null,g),desc=el("p",null,list[0].description),comp=el("p",null,"Compatibilité : "+list[0].compatible);
    var id=g.replace(/[^a-z0-9]+/gi,"-").toLowerCase();
    var lab=el("label",null,"Variante"),sel=document.createElement("select");lab.htmlFor=sel.id="v-"+id;
    list.forEach(function(p){opt(sel,p.sku,varLabel(p))});
    var labM=el("label",null,"Mon modèle d’iPhone"),selMo=document.createElement("select");labM.htmlFor=selMo.id="m-"+id;
    opt(selMo,"","Choisir…");accModels(g).forEach(function(m){opt(selMo,m)});
    var pr=el("div","price"),note=el("p","muted"),btn=el("a","btn ice","Demander cet article"),err=el("p","err");err.hidden=true;
    function upd(){
      var p=skuP(sel.value);img.src=p.image;img.alt=p.alt||p.name;
      var v=eur(p.price_eur);pr.textContent=v||ASK;pr.className="price"+(v?"":" none");
      note.textContent=TO_CONFIRM[p.sku]?"Prix relevé sur l’affiche, périmètre à confirmer.":(p.group==="Verre trempé 9H"?"Pose comprise selon l’affiche.":"");
      btn.href=demandeURL({article:"acc:"+g,variante:p.sku,modele:selMo.value});
    }
    sel.addEventListener("change",upd);selMo.addEventListener("change",function(){err.hidden=true;upd()});upd();
    btn.addEventListener("click",function(e){if(!selMo.value){e.preventDefault();err.textContent="Indiquez d’abord votre modèle d’iPhone.";err.hidden=false;selMo.focus()}});
    [h,desc,comp,lab,sel,labM,selMo,pr,note,btn,err].forEach(function(n){body.appendChild(n)});
    var ph=el("div","ph");ph.appendChild(img);card.appendChild(ph);card.appendChild(body);$("acc-grid").appendChild(card);
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
  chip("Tous","");types.forEach(function(t){chip(t,t)});
  function drawPerf(){
    var g=$("p-grid"),n=0;g.textContent="";
    perf.forEach(function(p){
      if(cur&&p.group!==cur)return;n++;
      var c=el("article","card"),i=el("img");i.src=p.image;i.alt=p.alt||p.name;i.loading="lazy";i.decoding="async";i.width=640;i.height=680;
      var b=el("div","body"),pv=eur(p.price_eur);
      b.appendChild(el("span","tag",p.group));
      b.appendChild(el("h3",null,p.name));
      b.appendChild(el("p",null,prof(p)+" · "+p.volume));
      b.appendChild(el("div","price"+(pv?"":" none"),pv||ASK));
      var bt=el("a","btn champ","Demander ce parfum");bt.href=demandeURL({article:"perf:"+p.sku});
      b.appendChild(bt);var ph=el("div","ph");ph.appendChild(i);c.appendChild(ph);c.appendChild(b);g.appendChild(c);
    });
    $("p-count").textContent=n+" référence"+(n>1?"s":"")+(cur?" · "+cur:"");
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
    if(!v){err.textContent="Choisissez un article ou une prestation.";err.hidden=false;dt.focus();return}
    if((k==="rep"||k==="acc")&&!dm.value){err.textContent="Indiquez le modèle exact de votre iPhone.";err.hidden=false;dm.focus();return}
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
    $("recap-box").scrollIntoView({block:"start"});$("recap-box").focus();
  });
  $("copy").addEventListener("click",function(){
    var ta=$("recap"),m=$("copy-msg");
    function ok(){m.textContent="Récapitulatif copié. Collez-le dans votre message."}
    function ko(){ta.focus();ta.select();m.textContent="Copie automatique impossible : le texte est sélectionné, copiez-le manuellement."}
    if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(ta.value).then(ok,ko);
    else{ta.focus();ta.select();try{document.execCommand("copy")?ok():ko()}catch(x){ko()}}
  });
}
})();
