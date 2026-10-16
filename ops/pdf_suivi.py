#!/usr/bin/env python3
"""Génère le PDF de suivi (plan + liste de prospects avec cases à cocher). Sortie : ops/data/kaptur-plan-suivi.pdf (ignoré par Git)."""
import os, sys
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from reportlab.lib.colors import Color
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import bos
FD = '/usr/share/fonts/truetype/dejavu/'
pdfmetrics.registerFont(TTFont('F', FD + 'DejaVuSans.ttf')); pdfmetrics.registerFont(TTFont('FB', FD + 'DejaVuSans-Bold.ttf'))
W, H = A4; M = 40

PLAN = [
 ('Le principe', ["Vendre des sites vitrines à des commerces locaux de Sainte-Clotilde, avec 0 € de dépense en plus.", "Marque : kaptur. Les maquettes restent sur votre Mac, jamais publiées."]),
 ('Les 3 tests', ["E1 Site vitrine pour TPE, maquette d'abord (prix test 390 €). Objectif : 4 réponses positives sur 40 contacts, abandon à 1 ou moins.", "E2 Mini-audit de présence en ligne (0 € au départ) pour ouvrir la conversation.", "E3 Kits de site par métier (29 €). Objectif : 3 ventes. Plus tard : abonnement de maintenance."]),
 ('Règles', ["Sans SIRET : démo et discussion seulement. Pas de prix ferme, devis, contrat ni paiement.", "Un commerçant dit oui : vous déposez votre dossier de micro-entreprise (gratuit, guichet unique), facturation après réception du SIRET.", "Pas de spam, pas de faux avis ni de chiffres inventés, rien d'envoyé sans votre accord."]),
 ('Marche à suivre par commerce', ["1. Chercher le nom sur Google : site propre ou non ? 2. Si pas de site ou site peu lisible sur téléphone, générer la maquette (python3 ops/maquette.py brief.json).", "3. Visite avec la maquette ouverte, demander la permission de la montrer. 4. Si oui : noter les besoins et lancer la création de micro-entreprise."]),
]

def paragraphe(c, textes, y, taille=10):
    c.setFont('F', taille)
    for t in textes:
        mots, ligne = t.split(), ''
        for m in mots:
            if c.stringWidth(ligne + ' ' + m, 'F', taille) > W - 2 * M - 10 and ligne:
                c.drawString(M + 10, y, ligne); y -= 14; ligne = m
            else: ligne = (ligne + ' ' + m).strip()
        c.drawString(M + 10, y, ligne); y -= 18
    return y

def main():
    out = os.path.join(bos.DATA, 'kaptur-plan-suivi.pdf'); os.makedirs(bos.DATA, exist_ok=True)
    c = canvas.Canvas(out, pagesize=A4); c.setTitle('kaptur : plan et suivi'); c.setAuthor('kaptur')
    c.setFont('FB', 20); c.drawString(M, H - 60, 'kaptur : plan et suivi des prospects'); y = H - 95
    for titre, txt in PLAN:
        c.setFont('FB', 12); c.drawString(M, y, titre); y -= 20; y = paragraphe(c, txt, y) - 6
    c.showPage()
    c.setFont('FB', 16); c.drawString(M, H - 55, 'Prospects : Sainte-Clotilde (97490)'); c.setFont('F', 8.5)
    c.drawString(M, H - 72, "Infos d'annuaires, à vérifier. Cochez les cases dans votre lecteur PDF (Aperçu sur Mac fonctionne).")
    cols = [('Site existant', 335), ('Maquette faite', 405), ('Visite faite', 470), ('SITE FAIT', 525)]
    y = H - 105; c.setFont('FB', 7.5)
    for t, x in cols: c.drawCentredString(x + 8, y + 12, t)
    form = c.acroForm
    for p in bos.prospects():
        if y < 90: c.showPage(); y = H - 60
        c.setFont('FB', 10); c.drawString(M, y, f"{p['id']}  {p['nom']}"); c.setFont('F', 7.5)
        c.drawString(M + 22, y - 11, (p['niche'] + ' · ' + p['note'].split(' ; ')[0])[:75])
        for t, x in cols:
            form.checkbox(name=f"{p['id']}_{t}", x=x, y=y - 4, size=15, borderColor=Color(.3, .3, .3), fillColor=Color(1, 1, 1), checked=False, buttonStyle='check', forceBorder=True)
        c.setStrokeColorRGB(.85, .85, .85); c.line(M, y - 20, W - M, y - 20); y -= 38
    c.setFont('F', 8); c.drawString(M, 40, 'Document local : ne pas publier. Données issues d\'annuaires publics, à confirmer avec chaque établissement.')
    c.save(); return out

if __name__ == '__main__': print(main())
