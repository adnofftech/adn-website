/** Préfixe les chemins internes avec la base de déploiement (BASE_PATH). */
export function url(path: string): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  if (path === '/') return base ? `${base}/` : '/';
  return `${base}${path}`;
}
