import contextlib
import io
import pathlib
import tempfile
import unittest

from radar import cli


def run(db, *argv):
    out, err = io.StringIO(), io.StringIO()
    with contextlib.redirect_stdout(out), contextlib.redirect_stderr(err):
        rc = cli.main(["--db", db, *argv])
    return rc, out.getvalue(), err.getvalue()


class CliTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.db = str(pathlib.Path(self.tmp.name) / "t.db")

    def tearDown(self):
        self.tmp.cleanup()

    def test_demo_list_message(self):
        self.assertEqual(run(self.db, "demo")[0], 0)
        rc, out, _ = run(self.db, "list")
        self.assertIn("Garage Démo Océan", out)
        rc, out, _ = run(self.db, "message", "1", "--kind", "dm")
        self.assertIn("KAPTUR TEST", out)
        self.assertIn("Rien n'a été envoyé", out)

    def test_audit_demo_offline(self):
        run(self.db, "demo")
        rc, out, _ = run(self.db, "audit", "2")
        self.assertEqual(rc, 0)
        self.assertIn("Score : 83/100", out)

    def test_audit_local_file(self):
        run(self.db, "add", "Test", "--website", "exemple.re")
        f = pathlib.Path(__file__).parent.parent / "radar" / "demo_data" / "vieux_site.html"
        rc, out, _ = run(self.db, "audit", "1", "--file", str(f))
        self.assertIn("Score : 8/100", out)

    def test_unknown_id_is_clean_error(self):
        rc, _, err = run(self.db, "message", "42")
        self.assertEqual(rc, 1)
        rc, _, err = run(self.db, "status", "42", "contacté")
        self.assertEqual(rc, 1)
        self.assertIn("Erreur", err)

    def test_status_and_due(self):
        run(self.db, "add", "A")
        run(self.db, "status", "1", "contacté", "--in-days", "0")
        rc, out, _ = run(self.db, "list", "--due")
        self.assertIn("A", out)

    def test_import_french_csv_with_semicolons_and_bom(self):
        f = pathlib.Path(self.tmp.name) / "in.csv"
        f.write_text("﻿Nom;Secteur;Ville;Téléphone;Site\nBoulangerie X;commerce;Saint-Paul;0692 11 11 11;x.re\n;commerce;;;\nBoulangerie Y;inconnu;Le Port;;\n", encoding="utf-8")
        rc, out, _ = run(self.db, "import", str(f))
        self.assertIn("2 importé(s), 1 ignoré(s)", out)
        rc, out, _ = run(self.db, "list")
        self.assertIn("Boulangerie X", out)
        self.assertIn("Boulangerie Y", out)

    def test_export_neutralizes_formulas(self):
        run(self.db, "add", "=HYPERLINK(\"http://evil.example\")")
        f = pathlib.Path(self.tmp.name) / "out.csv"
        run(self.db, "export", str(f))
        text = f.read_text(encoding="utf-8-sig")
        self.assertIn("'=HYPERLINK", text)
        self.assertNotIn("\n=HYPERLINK", text)

    def test_find_dry_run_with_fake_network(self):
        from radar import find
        orig = find._fetch
        try:
            import json
            payload = json.loads((pathlib.Path(__file__).parent / "fixtures" / "api_fictif.json").read_text(encoding="utf-8"))
            find._fetch = lambda params, attempts=3: payload
            rc, out, _ = run(self.db, "find", "restauration", "--dry-run")
            self.assertIn("Sarl Demo Lagon", out)
            self.assertIn("simulation", out)
            self.assertEqual(run(self.db, "list")[1].strip(), "Aucun prospect.")
            rc, out, _ = run(self.db, "find", "restauration")
            self.assertIn("2 ajouté(s)", out)
        finally:
            find._fetch = orig


if __name__ == "__main__":
    unittest.main()


class SalesPageTests(unittest.TestCase):
    def test_sales_page_lists_exactly_the_audited_points(self):
        from radar import audit
        page = (pathlib.Path(__file__).parent.parent / "vente" / "audit-offert.html").read_text(encoding="utf-8")
        labels = [c.label for c in audit.analyze_html("", "https://x.re/").checks]
        for label in labels:
            self.assertIn(f"<li>{label}</li>", page, label)
        self.assertIn(f"{len(labels)} points", page)

    def test_prices_match_offer_everywhere(self):
        from radar import messages
        page = (pathlib.Path(__file__).parent.parent / "vente" / "audit-offert.html").read_text(encoding="utf-8")
        for price in ("99 €", "249 €", "399 €"):
            self.assertIn(price, page)
        self.assertEqual(messages.OFFER["price"], "99 €")
