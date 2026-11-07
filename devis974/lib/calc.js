/** Calcul des totaux d'un devis — source de vérité côté serveur (montants en centimes). */
export function computeTotals(lines, regime) {
  const byRate = new Map();
  let ht = 0;
  const out = lines.map(l => {
    const net = Math.round(l.quantity * l.unit_price_cents * (1 - (l.discount_pct || 0) / 100));
    const rate = regime === 'franchise' ? 0 : l.vat_rate;
    byRate.set(rate, (byRate.get(rate) || 0) + net);
    ht += net;
    return { ...l, vat_rate: rate, line_ht_cents: net };
  });
  let vat = 0;
  const vatByRate = [];
  for (const [rate, base] of [...byRate].sort((a, b) => a[0] - b[0])) {
    const v = Math.round(base * rate / 100);
    vat += v; vatByRate.push({ rate, base_cents: base, vat_cents: v });
  }
  return { lines: out, subtotal_ht_cents: ht, total_vat_cents: vat, total_ttc_cents: ht + vat, vatByRate };
}
