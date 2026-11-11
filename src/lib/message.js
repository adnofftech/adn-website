// Construit le message Instagram à partir des réponses de l'assistant.
// Module partagé entre le navigateur (src/components/Assistant.astro) et les tests (tests/e2e.mjs).

/**
 * @typedef {Object} Reponses
 * @property {string} [idee]
 * @property {boolean} [hesite]
 * @property {string} [reference]  Titre de la réalisation choisie, ou vide
 * @property {string} [zone]
 * @property {string} [dimensions]  Texte libre ; "" si à définir
 * @property {boolean} [dimensionsADefinir]
 * @property {'noire'|'rouge'|'noire-rouge'|'a-discuter'|''} [encre]
 * @property {string} [disponibilites]
 * @property {boolean} [flexible]
 */

export const ENCRES = {
  'noire': 'Encre noire',
  'rouge': 'Encre rouge',
  'noire-rouge': 'Encre noire et rouge',
  'a-discuter': 'À discuter avec vous',
};

const nettoie = (s) => (s ?? '').toString().trim().replace(/\s+\n/g, '\n');

/** @param {Reponses} r */
export function construireMessage(r) {
  const blocs = [];
  blocs.push("Bonjour, j'aimerais discuter d'un projet de tatouage.");

  const idee = nettoie(r.idee);
  if (idee) blocs.push(`Mon idée\n${idee}`);
  else if (r.hesite) blocs.push("Mon idée\nJ'hésite encore sur le motif, j'aimerais en discuter avec vous.");

  const zone = nettoie(r.zone);
  const dims = r.dimensionsADefinir ? 'dimensions à définir ensemble' : nettoie(r.dimensions);
  if (zone || dims) {
    const parts = [];
    if (zone) parts.push(zone);
    if (dims) parts.push(zone ? dims : dims.charAt(0).toUpperCase() + dims.slice(1));
    blocs.push(`Emplacement et dimensions\n${parts.join(', ')}`);
  }

  if (r.encre && ENCRES[r.encre]) blocs.push(`Encre souhaitée\n${ENCRES[r.encre]}`);

  const dispo = nettoie(r.disponibilites);
  if (dispo || r.flexible) {
    const lignes = [];
    if (dispo) lignes.push(dispo);
    if (r.flexible) lignes.push(dispo ? 'Je suis flexible sur les dates.' : 'Je suis flexible sur les dates.');
    blocs.push(`Mes disponibilités\n${lignes.join('\n')}`);
  }

  const ref = nettoie(r.reference);
  if (ref) blocs.push(`La réalisation qui m'intéresse\n${ref}`);

  blocs.push("Je peux vous envoyer mes inspirations ainsi qu'une photo de l'emplacement avec les dimensions souhaitées.");
  blocs.push('Merci !');
  return blocs.join('\n\n');
}
