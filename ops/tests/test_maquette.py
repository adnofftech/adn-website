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
    def test_slug_accents(self): self.assertEqual(maquette.slug('Salon Démo'), 'salon-demo')
    def test_champs_optionnels(self):
        h = open(maquette.generer(dict(nom='A', metier='B', ville='C', adresse='1 rue <x>', avis='5,0/5', instagram='javascript:alert(1)', categories=[dict(nom='Gel', detail='10 prestations')]), tempfile.mkdtemp()), encoding='utf8').read()
        self.assertIn('1 rue &lt;x&gt;', h); self.assertIn('Gel', h); self.assertNotIn('javascript:', h)
if __name__ == '__main__': unittest.main()
