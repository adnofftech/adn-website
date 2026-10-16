import os, sys, tempfile, unittest
os.environ['BOS_DATA'] = tempfile.mkdtemp()
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
import bos

class T(unittest.TestCase):
    def test_score_trie(self):
        r = bos.score_opportunites(bos.lire(os.path.join(bos.HERE, 'opportunities.csv')))
        self.assertEqual(len(r), 10); self.assertEqual([s for s, _ in r], sorted([s for s, _ in r], reverse=True))
    def test_doublon_et_opposition(self):
        pid = bos.prospect_add('Salon X', 'beaute', 'St-Denis', 'email')
        with self.assertRaises(ValueError): bos.prospect_add('salon x', 'beaute', 'st-denis', 'email')
        bos.prospect_set(pid, 'opposition')
        with self.assertRaises(ValueError): bos.prospect_set(pid, 'contacte')
    def test_finances_separent_abonnements_ia(self):
        bos.ledger_add('revenu', 390, 'E1'); bos.ledger_add('frais_plateforme', 6); bos.ledger_add('abonnement_ia', 100)
        s = bos.synthese(bos.ledger())
        self.assertEqual(s['marge_hors_abonnements_ia'], 384.0); self.assertEqual(s['marge_apres_abonnements_ia'], 284.0)
    def test_verdict(self):
        self.assertEqual(bos.verdict(dict(actuel='', objectif='4', seuil_abandon='1')), 'en attente de donnees')
        self.assertEqual(bos.verdict(dict(actuel='5', objectif='4', seuil_abandon='1')), 'RENFORCER')
        self.assertEqual(bos.verdict(dict(actuel='1', objectif='4', seuil_abandon='1')), 'ABANDONNER')
        self.assertEqual(bos.verdict(dict(actuel='2', objectif='4', seuil_abandon='1')), 'ITERER')
if __name__ == '__main__': unittest.main()
