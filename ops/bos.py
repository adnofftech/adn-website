#!/usr/bin/env python3
"""Business OS : suivi local, stdlib uniquement. Usage : python3 ops/bos.py <commande> (voir --help).
Donnees personnelles dans ops/data/ (ignore par Git)."""
import argparse, csv, datetime, os, sys
HERE = os.path.dirname(os.path.abspath(__file__))
DATA = os.environ.get('BOS_DATA', os.path.join(HERE, 'data'))
STATUTS = ['nouveau', 'contacte', 'reponse', 'echange', 'devis', 'gagne', 'perdu', 'opposition']
ORDRE = {s: i for i, s in enumerate(STATUTS)}
TYPES = ['revenu', 'frais_plateforme', 'cout', 'remboursement', 'abonnement_ia']
POIDS = dict(demand=2, speed=2, cost0=3, automation=1.5, recurring=1.5, low_human=1, legal_safety=3, testability=2)

def lire(path):
    if not os.path.exists(path): return []
    with open(path, encoding='utf8', newline='') as f: return list(csv.DictReader(f))

def ecrire(path, rows, champs):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'w', encoding='utf8', newline='') as f:
        w = csv.DictWriter(f, fieldnames=champs); w.writeheader(); w.writerows(rows)

def score_opportunites(rows):
    tot = sum(POIDS.values())
    out = [(round(sum(float(r[k]) * w for k, w in POIDS.items()) / tot / 5 * 100, 1), r) for r in rows]
    return sorted(out, key=lambda t: -t[0])

def verdict(e):
    if e.get('actuel', '') == '': return 'en attente de donnees'
    a, obj, seuil = float(e['actuel']), float(e['objectif']), float(e['seuil_abandon'])
    return 'RENFORCER' if a >= obj else ('ABANDONNER' if a <= seuil else 'ITERER')

PCH = ['id', 'nom', 'niche', 'ville', 'canal', 'contact', 'statut', 'maj', 'note']
def prospects(): return lire(os.path.join(DATA, 'prospects.csv'))
def sauve_prospects(r): ecrire(os.path.join(DATA, 'prospects.csv'), r, PCH)

def prospect_add(nom, niche, ville, canal, contact='', note=''):
    rows = prospects()
    if any(r['nom'].lower() == nom.lower() and r['ville'].lower() == ville.lower() for r in rows):
        raise ValueError('doublon : prospect deja present')
    pid = f'P{len(rows) + 1:04d}'
    rows.append(dict(id=pid, nom=nom, niche=niche, ville=ville, canal=canal, contact=contact, statut='nouveau', maj=str(datetime.date.today()), note=note))
    sauve_prospects(rows); return pid

def prospect_set(pid, statut):
    if statut not in ORDRE: raise ValueError(f'statut inconnu : {statut}')
    rows = prospects()
    for r in rows:
        if r['id'] == pid:
            if r['statut'] == 'opposition': raise ValueError('prospect en opposition : ne plus contacter')
            r['statut'], r['maj'] = statut, str(datetime.date.today()); sauve_prospects(rows); return
    raise ValueError('prospect introuvable')

LCH = ['date', 'type', 'montant_eur', 'offre', 'note']
def ledger(): return lire(os.path.join(DATA, 'ledger.csv'))
def ledger_add(typ, montant, offre='', note='', date=None):
    if typ not in TYPES: raise ValueError(f'type inconnu : {typ}')
    rows = ledger(); rows.append(dict(date=date or str(datetime.date.today()), type=typ, montant_eur=f'{float(montant):.2f}', offre=offre, note=note))
    ecrire(os.path.join(DATA, 'ledger.csv'), rows, LCH)

def synthese(rows):
    s = {t: 0.0 for t in TYPES}
    for r in rows: s[r['type']] += float(r['montant_eur'])
    marge = s['revenu'] - s['frais_plateforme'] - s['cout'] - s['remboursement']
    return dict(s, marge_hors_abonnements_ia=round(marge, 2), marge_apres_abonnements_ia=round(marge - s['abonnement_ia'], 2))

def rapport():
    pr, sy = prospects(), synthese(ledger())
    cnt = {s: sum(1 for p in pr if p['statut'] == s) for s in STATUTS}
    lignes = [f'# Rapport du {datetime.date.today()}', '', '## Prospection (compte reel, aucune donnee inventee)']
    lignes += [f'- {s} : {n}' for s, n in cnt.items()]
    lignes += ['', '## Finances (CA encaisse != benefice != tresorerie != revenu personnel)']
    lignes += [f'- {k} : {v:.2f} EUR' for k, v in sy.items()]
    lignes += ['', '## Experiences']
    lignes += [f"- {e['id']} {e['offre']} : {e['statut']} -> {verdict(e)}" for e in lire(os.path.join(HERE, 'experiments.csv'))]
    txt = '\n'.join(lignes) + '\n'
    os.makedirs(os.path.join(HERE, 'REPORTS'), exist_ok=True)
    with open(os.path.join(HERE, 'REPORTS', f'daily-{datetime.date.today()}.md'), 'w', encoding='utf8') as f: f.write(txt)
    return txt

def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__); sp = ap.add_subparsers(dest='cmd', required=True)
    sp.add_parser('score'); sp.add_parser('experiments'); sp.add_parser('report'); sp.add_parser('prospects')
    a = sp.add_parser('prospect-add'); [a.add_argument(x) for x in ('nom', 'niche', 'ville', 'canal')]; a.add_argument('--contact', default=''); a.add_argument('--note', default='')
    s = sp.add_parser('prospect-set'); s.add_argument('id'); s.add_argument('statut', choices=STATUTS)
    l = sp.add_parser('ledger-add'); l.add_argument('type', choices=TYPES); l.add_argument('montant'); l.add_argument('--offre', default=''); l.add_argument('--note', default='')
    n = ap.parse_args(argv)
    try:
        if n.cmd == 'score':
            for sc, r in score_opportunites(lire(os.path.join(HERE, 'opportunities.csv'))): print(f"{sc:5} {r['id']:4} {r['name']}")
        elif n.cmd == 'experiments':
            for e in lire(os.path.join(HERE, 'experiments.csv')): print(f"{e['id']} {e['statut']:10} {verdict(e)}")
        elif n.cmd == 'report': print(rapport())
        elif n.cmd == 'prospects':
            for p in prospects(): print(p['id'], p['statut'], p['nom'], p['ville'])
        elif n.cmd == 'prospect-add': print(prospect_add(n.nom, n.niche, n.ville, n.canal, n.contact, n.note))
        elif n.cmd == 'prospect-set': prospect_set(n.id, n.statut)
        elif n.cmd == 'ledger-add': ledger_add(n.type, n.montant, n.offre, n.note)
    except ValueError as e: sys.exit(f'Erreur : {e}')

if __name__ == '__main__': main()
