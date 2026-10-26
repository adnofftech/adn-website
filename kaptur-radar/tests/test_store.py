import datetime as dt
import unittest

from radar import store


class StoreTests(unittest.TestCase):
    def setUp(self):
        self._cm = store.connect(":memory:")
        self.con = self._cm.__enter__()

    def tearDown(self):
        self._cm.__exit__(None, None, None)

    def test_add_and_get(self):
        pid = store.add_prospect(self.con, "Garage Démo", sector="autre", commune="Saint-Paul", siren="123456789")
        row = store.get(self.con, pid)
        self.assertEqual(row["name"], "Garage Démo")
        self.assertEqual(row["status"], "à contacter")

    def test_name_required(self):
        with self.assertRaises(ValueError):
            store.add_prospect(self.con, "   ")

    def test_duplicate_siren_rejected(self):
        store.add_prospect(self.con, "A", siren="111")
        with self.assertRaises(ValueError):
            store.add_prospect(self.con, "B", siren="111")

    def test_empty_siren_allowed_many_times(self):
        store.add_prospect(self.con, "A")
        store.add_prospect(self.con, "B", siren="")
        self.assertEqual(len(store.list_prospects(self.con)), 2)

    def test_unknown_sector_rejected(self):
        with self.assertRaises(ValueError):
            store.add_prospect(self.con, "A", sector="piraterie")

    def test_update_whitelist(self):
        pid = store.add_prospect(self.con, "A")
        store.update(self.con, pid, phone="0692 00 00 00")
        self.assertEqual(store.get(self.con, pid)["phone"], "0692 00 00 00")
        with self.assertRaises(ValueError):
            store.update(self.con, pid, status="client")  # le statut passe par set_status
        with self.assertRaises(ValueError):
            store.update(self.con, pid, **{"id": 5})
        with self.assertRaises(KeyError):
            store.update(self.con, 9999, phone="x")

    def test_status_sets_followup(self):
        pid = store.add_prospect(self.con, "A")
        store.set_status(self.con, pid, "contacté")
        row = store.get(self.con, pid)
        self.assertEqual(row["last_contact"], store.today())
        self.assertEqual(row["next_followup"], (dt.date.today() + dt.timedelta(days=3)).isoformat())
        store.set_status(self.con, pid, "client")
        self.assertIsNone(store.get(self.con, pid)["next_followup"])

    def test_status_invalid(self):
        pid = store.add_prospect(self.con, "A")
        with self.assertRaises(ValueError):
            store.set_status(self.con, pid, "inconnu")
        with self.assertRaises(KeyError):
            store.set_status(self.con, 4242, "contacté")

    def test_audit_roundtrip_and_score(self):
        pid = store.add_prospect(self.con, "A")
        store.save_audit(self.con, pid, {"score": 42, "error": ""})
        self.assertEqual(store.get(self.con, pid)["score"], 42)
        self.assertEqual(store.last_audit(self.con, pid)["score"], 42)
        store.save_audit(self.con, pid, {"score": 0, "error": "inaccessible"})
        self.assertIsNone(store.get(self.con, pid)["score"])

    def test_due_filter_and_delete_cascade(self):
        a = store.add_prospect(self.con, "A")
        store.add_prospect(self.con, "B")
        store.update(self.con, a, next_followup=(dt.date.today() - dt.timedelta(days=1)).isoformat())
        self.assertEqual([r["name"] for r in store.list_prospects(self.con, due_only=True)], ["A"])
        store.save_audit(self.con, a, {"score": 10})
        store.delete(self.con, a)
        self.assertEqual(self.con.execute("SELECT COUNT(*) FROM audits").fetchone()[0], 0)

    def test_sql_injection_in_name_is_data(self):
        pid = store.add_prospect(self.con, "x'); DROP TABLE prospects;--")
        self.assertEqual(store.get(self.con, pid)["name"], "x'); DROP TABLE prospects;--")
        self.assertEqual(len(store.list_prospects(self.con)), 1)


if __name__ == "__main__":
    unittest.main()
