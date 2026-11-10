/* Informations pratiques : modifier ici les horaires, la livraison et le contact. */
window.RS_CONFIG = {
  "nom": "Rachid Shopp",
  "zone": "La Réunion",

  /* Canal de commande officiel. Laisser "url" vide tant que Rachid n'a pas confirmé :
     le site propose alors seulement la copie du récapitulatif.
     Exemples : "https://wa.me/262XXXXXXXXX" ou "https://www.snapchat.com/add/xxxx" */
  "contact": { "libelle": "", "url": "" },

  "livraison": {
    "titre": "Livraison gratuite sur l’île",
    "detail": "Délai annoncé de 1 à 5 jours selon le secteur et la disponibilité."
  },

  "horaires": [
    { "plage": "6 h – 10 h", "titre": "Réponses et commandes", "icone": "message",
      "texte": "Réponses aux messages et gestion des commandes. Pas de livraison sur ce créneau." },
    { "plage": "10 h – 18 h", "titre": "Livraisons", "icone": "livraison",
      "texte": "Uniquement les commandes programmées à l’avance. Pas de prise de commande ni de réponse." },
    { "plage": "18 h – 6 h", "titre": "Temps personnel", "icone": "horaires",
      "texte": "Ni commandes, ni messages, ni livraisons." }
  ],

  /* Éléments demandés dans tout message de commande (affiche IMG_2077). */
  "commande": ["Adresse complète", "Numéro de téléphone", "Article ou prestation", "Modèle d’iPhone si pertinent"]
};
