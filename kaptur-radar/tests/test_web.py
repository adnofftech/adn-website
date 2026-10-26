import http.client
import re
import tempfile
import threading
import unittest
import urllib.parse
import pathlib

from radar import store, web, demo


class WebTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.tmp = tempfile.TemporaryDirectory()
        cls.db = str(pathlib.Path(cls.tmp.name) / "t.db")
        with store.connect(cls.db) as con:
            demo.load(con)
        cls.srv = web.make_server(0, cls.db)
        cls.port = cls.srv.server_address[1]
        cls.t = threading.Thread(target=cls.srv.serve_forever, daemon=True)
        cls.t.start()

    @classmethod
    def tearDownClass(cls):
        cls.srv.shutdown()
        cls.srv.server_close()
        cls.tmp.cleanup()

    def req(self, method, path, body=None, headers=None, host=None):
        c = http.client.HTTPConnection("127.0.0.1", self.port, timeout=5)
        h = {"Host": host or f"127.0.0.1:{self.port}"}
        h.update(headers or {})
        data = urllib.parse.urlencode(body).encode() if body is not None else None
        if data:
            h["Content-Type"] = "application/x-www-form-urlencoded"
        c.request(method, path, body=data, headers=h)
        r = c.getresponse()
        out = (r.status, r.read().decode("utf-8"), dict(r.getheaders()))
        c.close()
        return out

    def token(self):
        return re.search(r"name='token' value='([^']+)'", self.req("GET", "/")[1]).group(1)

    def test_home_lists_demo_prospects(self):
        code, body, hdr = self.req("GET", "/")
        self.assertEqual(code, 200)
        self.assertIn("Garage Démo Océan", body)
        self.assertIn("démo fictive", body)
        self.assertIn("default-src 'none'", hdr["Content-Security-Policy"])

    def test_detail_shows_messages_and_audit(self):
        code, body, _ = self.req("GET", "/p/1")
        self.assertEqual(code, 200)
        self.assertIn("Score : 8/100", body)
        self.assertIn("KAPTUR TEST", body)
        self.assertIn("STOP", body)

    def test_unknown_prospect_404(self):
        self.assertEqual(self.req("GET", "/p/9999")[0], 404)
        self.assertEqual(self.req("GET", "/nimportequoi")[0], 404)

    def test_post_without_token_refused(self):
        self.assertEqual(self.req("POST", "/add", {"name": "X"})[0], 403)

    def test_post_with_foreign_origin_refused(self):
        code = self.req("POST", "/add", {"name": "X", "token": self.token()}, {"Origin": "http://evil.example"})[0]
        self.assertEqual(code, 403)

    def test_foreign_host_header_refused(self):
        self.assertEqual(self.req("GET", "/", host="evil.example")[0], 403)

    def test_add_edit_status_flow(self):
        tok = self.token()
        code, _, hdr = self.req("POST", "/add", {"name": "Boulangerie <b>Test</b>", "sector": "commerce", "token": tok})
        self.assertEqual(code, 303)
        loc = hdr["Location"].split("?")[0]
        _, body, _ = self.req("GET", loc)
        self.assertIn("Boulangerie &lt;b&gt;Test&lt;/b&gt;", body)  # échappé : pas d'injection HTML
        self.assertNotIn("<b>Test</b>", body)
        self.assertEqual(self.req("POST", loc + "/status", {"status": "contacté", "token": tok})[0], 303)
        self.assertIn("contacté", self.req("GET", loc)[1])
        self.assertEqual(self.req("POST", loc + "/edit", {"website": "exemple.re", "token": tok})[0], 303)
        self.assertIn("exemple.re", self.req("GET", loc)[1])

    def test_bad_status_does_not_crash(self):
        tok = self.token()
        code, _, hdr = self.req("POST", "/p/1/status", {"status": "bidon", "token": tok})
        self.assertEqual(code, 303)
        self.assertIn("Erreur", urllib.parse.unquote(hdr["Location"]))

    def test_empty_name_rejected_cleanly(self):
        code, _, hdr = self.req("POST", "/add", {"name": " ", "token": self.token()})
        self.assertEqual(code, 303)
        self.assertIn("Erreur", urllib.parse.unquote(hdr["Location"]))

    def test_audit_of_private_url_refused(self):
        tok = self.token()
        _, _, hdr = self.req("POST", "/add", {"name": "Cible interne", "website": "http://169.254.169.254/", "token": tok})
        loc = hdr["Location"].split("?")[0]
        _, _, hdr2 = self.req("POST", loc + "/audit", {"token": tok})
        self.assertIn("refus", urllib.parse.unquote(hdr2["Location"]))

    def test_oversized_post_refused(self):
        self.assertEqual(self.req("POST", "/add", {"name": "x" * 30000, "token": self.token()})[0], 413)

    def test_demo_audit_runs_offline(self):
        tok = self.token()
        code, _, hdr = self.req("POST", "/p/2/audit", {"token": tok})
        self.assertEqual(code, 303)
        self.assertIn("Audit termin", urllib.parse.unquote(hdr["Location"]))


if __name__ == "__main__":
    unittest.main()
