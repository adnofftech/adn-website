import os, sys, tempfile, unittest
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
import maquette

class T(unittest.TestCase):
    def test_generation_et_echappement(self):
        d = tempfile.mkdtemp()
        p = maquette.generer(dict(nom='Salon <b>X</b>', metier='Coiffeur', ville='St-Denis', tel='0692 00 00 00', services=[dict(nom='Coupe', prix='25 €')]), d)
        h = open(p, encoding='utf8').read()
        self.assertIn('noindex', h); self.assertNotIn('<b>X</b>', h); self.assertIn('Coupe', h); self.assertIn('tel:0692000000', h)
    def test_champ_manquant_et_couleur(self):
        with self.assertRaises(ValueError): maquette.generer(dict(nom='A'), tempfile.mkdtemp())
        self.assertEqual(maquette.valide_couleur('red;}body{'), '#8a5a44')
if __name__ == '__main__': unittest.main()
