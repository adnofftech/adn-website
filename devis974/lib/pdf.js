import PDFDocument from 'pdfkit';
import { computeTotals } from './calc.js';

const NAVY = '#10243A', BLUE = '#2563EB', GREY = '#5B6B7F', LIGHT = '#F4F7FB';
const eur = c => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(c / 100).replace(/[  ]/g, ' ');
const frDate = iso => iso ? iso.split('-').reverse().join('/') : '';
const pct = n => `${String(n).replace('.', ',')} %`;

export function renderQuotePdf(q, co) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 48, info: { Title: `Devis ${q.number}`, Author: co.name } });
    const chunks = []; doc.on('data', c => chunks.push(c)); doc.on('end', () => resolve(Buffer.concat(chunks))); doc.on('error', reject);
    const L = 48, R = 547, W = R - L;

    // En-tête : logo + identité
    let y = 48;
    if (co.logo) { try { doc.image(Buffer.from(co.logo), L, y, { fit: [110, 56] }); y += 62; } catch { /* logo illisible : ignoré */ } }
    doc.fillColor(NAVY).font('Helvetica-Bold').fontSize(13).text(co.name, L, y, { width: 280 });
    doc.font('Helvetica').fontSize(9).fillColor(GREY);
    const ident = [co.legal_form, [co.address, [co.postal_code, co.city].filter(Boolean).join(' ')].filter(Boolean).join(', '),
      co.phone && `Tél. ${co.phone}`, co.email, co.siret && `SIRET ${co.siret}`, co.vat_number && `N° TVA ${co.vat_number}`].filter(Boolean);
    doc.text(ident.join('\n'), L, doc.y + 2, { width: 280 });
    const leftEnd = doc.y;

    doc.fillColor(BLUE).font('Helvetica-Bold').fontSize(24).text('DEVIS', 340, 48, { width: R - 340, align: 'right' });
    doc.fillColor(NAVY).fontSize(10).text(`N° ${q.number}`, 340, 78, { width: R - 340, align: 'right' });
    doc.font('Helvetica').fillColor(GREY).fontSize(9)
      .text(`Date : ${frDate(q.issue_date)}`, 340, 94, { width: R - 340, align: 'right' })
      .text(`Valable jusqu’au : ${frDate(q.valid_until)}`, 340, 107, { width: R - 340, align: 'right' });

    // Bloc client
    y = Math.max(leftEnd, 130) + 18;
    doc.roundedRect(L, y, W, 74, 6).fill(LIGHT);
    const c = q.client;
    doc.fillColor(GREY).font('Helvetica-Bold').fontSize(8).text('DESTINATAIRE', L + 12, y + 10);
    doc.fillColor(NAVY).font('Helvetica-Bold').fontSize(11).text([c.first_name, c.last_name].filter(Boolean).join(' ') + (c.company_name ? ` — ${c.company_name}` : ''), L + 12, y + 23, { width: W - 24 });
    doc.font('Helvetica').fontSize(9).fillColor(GREY).text(
      [c.address, [c.postal_code, c.city].filter(Boolean).join(' '), c.phone, c.email].filter(Boolean).join('  ·  '), L + 12, y + 40, { width: W - 24 });
    y += 92;
    if (q.title) { doc.fillColor(NAVY).font('Helvetica-Bold').fontSize(11).text(`Objet : ${q.title}`, L, y, { width: W }); y = doc.y + 10; }

    // Tableau
    const col = { d: L + 8, q: 300, u: 345, r: 410, v: 455, t: R - 8 };
    const header = yy => {
      doc.rect(L, yy, W, 22).fill(NAVY);
      doc.fillColor('#fff').font('Helvetica-Bold').fontSize(8.5);
      doc.text('Description', col.d, yy + 7, { width: 240 });
      doc.text('Qté', col.q, yy + 7, { width: 40, align: 'right' });
      doc.text('P.U. HT', col.u, yy + 7, { width: 60, align: 'right' });
      doc.text('Remise', col.r, yy + 7, { width: 40, align: 'right' });
      doc.text('TVA', col.v, yy + 7, { width: 30, align: 'right' });
      doc.text('Total HT', col.t - 60, yy + 7, { width: 60, align: 'right' });
      return yy + 22;
    };
    y = header(y);
    const t = computeTotals(q.lines, q.vat_regime);
    doc.font('Helvetica').fontSize(9);
    t.lines.forEach((l, i) => {
      const h = Math.max(doc.heightOfString(l.description, { width: 240 }), 12) + 12;
      if (y + h > 740) { doc.addPage(); y = header(48); doc.font('Helvetica').fontSize(9); }
      if (i % 2) doc.rect(L, y, W, h).fill(LIGHT);
      doc.fillColor(NAVY);
      doc.text(l.description, col.d, y + 6, { width: 240 });
      doc.text(String(l.quantity).replace('.', ','), col.q, y + 6, { width: 40, align: 'right' });
      doc.text(eur(l.unit_price_cents), col.u - 10, y + 6, { width: 70, align: 'right' });
      doc.text(l.discount_pct ? pct(l.discount_pct) : '—', col.r, y + 6, { width: 40, align: 'right' });
      doc.text(q.vat_regime === 'franchise' ? '—' : pct(l.vat_rate), col.v - 8, y + 6, { width: 38, align: 'right' });
      doc.text(eur(l.line_ht_cents), col.t - 70, y + 6, { width: 70, align: 'right' });
      y += h;
    });
    doc.moveTo(L, y).lineTo(R, y).strokeColor('#D5DDE8').lineWidth(0.7).stroke();

    // Totaux
    y += 14;
    if (y > 650) { doc.addPage(); y = 48; }
    const tx = 340, tw = R - tx;
    const row = (label, val, bold = false) => {
      doc.font(bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(bold ? 11 : 9.5).fillColor(NAVY);
      doc.text(label, tx, y, { width: tw - 90 }); doc.text(val, R - 100, y, { width: 100, align: 'right' }); y += bold ? 20 : 15;
    };
    row('Total HT', eur(t.subtotal_ht_cents));
    if (q.vat_regime === 'franchise') row('TVA', 'non applicable');
    else for (const v of t.vatByRate) row(`TVA ${pct(v.rate)} sur ${eur(v.base_cents)}`, eur(v.vat_cents));
    doc.rect(tx - 6, y - 4, tw + 6, 26).fill(BLUE);
    doc.fillColor('#fff').font('Helvetica-Bold').fontSize(11).text('Total TTC', tx + 2, y + 3).text(eur(t.total_ttc_cents), R - 108, y + 3, { width: 100, align: 'right' });
    y += 40;

    // Conditions et mentions
    const block = (title, text) => {
      if (!text) return;
      const h = doc.heightOfString(text, { width: W, fontSize: 8.5 }) + 22;
      if (y + h > 770) { doc.addPage(); y = 48; }
      doc.fillColor(NAVY).font('Helvetica-Bold').fontSize(9).text(title, L, y);
      doc.fillColor(GREY).font('Helvetica').fontSize(8.5).text(text, L, doc.y + 2, { width: W });
      y = doc.y + 10;
    };
    block('Conditions de paiement', q.payment_terms);
    block('Notes', q.notes);
    const mentions = [];
    if (q.vat_regime === 'franchise') mentions.push('TVA non applicable, art. 293 B du CGI.');
    mentions.push(`Devis valable jusqu’au ${frDate(q.valid_until)}. Il devient un contrat une fois daté et signé par le client avec la mention « Bon pour accord ».`);
    if (co.legal_notes) mentions.push(co.legal_notes);
    block('Mentions légales', mentions.join('\n'));

    // Signature
    if (y > 700) { doc.addPage(); y = 48; }
    doc.roundedRect(L, y, 240, 62, 6).strokeColor('#D5DDE8').stroke();
    doc.fillColor(GREY).font('Helvetica').fontSize(8.5).text('Bon pour accord — date et signature du client', L + 10, y + 8, { width: 220 });
    doc.end();
  });
}
