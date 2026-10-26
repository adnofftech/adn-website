import unittest

from radar import audit, messages
import pathlib

FX = pathlib.Path(__file__).parent / "fixtures"


def audit_of(name):
    return audit.analyze_html((FX / name).read_text(encoding="utf-8"), "https://exemple.re/", elapsed_ms=500).to_dict()


P = {"name": "Garage Démo Océan", "sector": "autre", "commune": "Saint-Pierre", "website": "exemple.re"}


class MessageTests(unittest.TestCase):
    def test_hooks_come_from_real_findings(self):
        hooks = messages.pick_hooks(audit_of("vieux_site.html"))
        self.assertEqual(hooks, ["video", "mobile"])
        hooks = messages.pick_hooks(audit_of("site_moyen.html"))
        self.assertEqual(hooks[0], "video")
        self.assertNotIn("mobile", hooks)  # le site moyen est adapté au mobile : jamais cité

    def test_good_site_gets_no_false_defect(self):
        m = messages.build({**P, "name": "Institut Démo Bourbon"}, audit_of("bon_site.html"))
        self.assertEqual(m["hooks"], [])
        self.assertNotIn("pas de vidéo", m["dm"])
        self.assertIn("plutôt bien tenu", m["dm"])

    def test_no_site(self):
        m = messages.build({**P, "website": ""}, None)
        self.assertIn("pas trouvé de site", m["dm"])
        self.assertEqual(m["hooks"], [])

    def test_unreachable_site(self):
        m = messages.build(P, {"error": "Site inaccessible", "checks": []})
        self.assertIn("ne répondait pas", m["dm"])

    def test_email_has_identification_and_optout(self):
        m = messages.build(P, audit_of("vieux_site.html"))
        self.assertIn("STOP", m["email"])
        self.assertIn("KAPTUR", m["email"])
        self.assertIn("kaptur.visual@gmail.com", m["email"])

    def test_offer_price_is_the_documented_one(self):
        m = messages.build(P, audit_of("vieux_site.html"))
        self.assertIn("99 €", m["dm"])
        for forbidden in ("%", "garanti", "x2", "témoign"):
            self.assertNotIn(forbidden, m["dm"] + m["email"] + m["call"])

    def test_dm_is_short_enough_for_whatsapp(self):
        m = messages.build(P, audit_of("vieux_site.html"))
        self.assertLess(len(m["dm"]), 700)

    def test_sector_specific_idea(self):
        m = messages.build({**P, "sector": "immobilier"}, audit_of("vieux_site.html"))
        self.assertIn("visite vidéo", m["dm"])

    def test_custom_sender(self):
        m = messages.build(P, None, messages.Sender(name="Adrien", whatsapp="0693 82 40 54"))
        self.assertIn("Adrien", m["dm"])
        self.assertIn("0693 82 40 54", m["dm"])


if __name__ == "__main__":
    unittest.main()
