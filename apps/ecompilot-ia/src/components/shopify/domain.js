/** Force un domaine au format <boutique>.myshopify.com (même règle que le backend). */
export function normalizeDomain(value) {
  let domain = String(value || '')
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/\/.*$/, '');
  if (!domain) return '';
  if (!domain.endsWith('.myshopify.com')) {
    domain = `${domain.replace(/\.myshopify\.com.*$/, '').replace(/\./g, '-')}.myshopify.com`;
  }
  return domain;
}

export default normalizeDomain;
