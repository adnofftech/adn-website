import json
import pathlib
import unittest

from radar import find, store

FX = pathlib.Path(__file__).parent / "fixtures"
PAYLOAD = json.loads((FX / "api_fictif.json").read_text(encoding="utf-8"))


class FindTests(unittest.TestCase):
    def test_parse_skips_individuals_and_non_diffusible(self):
        names = [x["name"] for x in find.parse(PAYLOAD)]
        self.assertEqual(names, ["Sarl Demo Lagon", "Sci Demo Immo"])

    def test_uses_matching_establishment_not_head_office(self):
        first = find.parse(PAYLOAD)[0]
        self.assertEqual(first["commune"], "Saint-Gilles-Les-Bains")
        self.assertIn("97434", first["address"])

    def test_include_individuals_flag(self):
        names = [x["name"] for x in find.parse(PAYLOAD, include_individuals=True)]
        self.assertIn("Prenom Nom Fictif", names)
        self.assertNotIn("Sas Demo Non Diffusible", names)  # jamais les non diffusibles

    def test_sector_mapping(self):
        self.assertEqual(find.sector_of("56.10A"), "restauration")
        self.assertEqual(find.sector_of("68.31Z"), "immobilier")
        self.assertEqual(find.sector_of("43.21A"), "BTP")
        self.assertEqual(find.sector_of("96.02A"), "beauté")
        self.assertEqual(find.sector_of("99.99Z"), "autre")

    def test_search_dedupes_across_codes_and_uses_974(self):
        calls = []

        def fake(params):
            calls.append(params)
            return PAYLOAD

        res = find.search("restauration", fetch=fake)
        self.assertEqual(len(calls), 2)  # 2 codes NAF
        self.assertTrue(all(c["departement"] == "974" for c in calls))
        self.assertEqual(len(res), 2)  # doublons retirés

    def test_network_failure_is_a_clean_error(self):
        def boom(params):
            raise find.FindError("injoignable")
        with self.assertRaises(find.FindError):
            find.search("restauration", fetch=boom)

    def test_search_unknown_sector(self):
        with self.assertRaises(ValueError):
            find.search("astronomie", fetch=lambda p: PAYLOAD)

    def test_results_insertable_in_store(self):
        with store.connect(":memory:") as con:
            for item in find.parse(PAYLOAD):
                store.add_prospect(con, **item)
            self.assertEqual(len(store.list_prospects(con)), 2)


if __name__ == "__main__":
    unittest.main()
