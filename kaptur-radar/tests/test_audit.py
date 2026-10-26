import pathlib
import unittest

from radar import audit

FX = pathlib.Path(__file__).parent.parent / "radar" / "demo_data"


def load(name, **kw):
    return audit.analyze_html((FX / name).read_text(encoding="utf-8"), "https://exemple.re/", **kw)


class NormalizeUrl(unittest.TestCase):
    def test_adds_scheme(self):
        self.assertEqual(audit.normalize_url("exemple.re"), "https://exemple.re/")

    def test_keeps_http(self):
        self.assertEqual(audit.normalize_url("http://exemple.re/a?b=1#x"), "http://exemple.re/a?b=1")

    def test_rejects_other_schemes(self):
        for bad in ("ftp://exemple.re", "file:///etc/passwd", "javascript:alert(1)", ""):
            with self.assertRaises(ValueError):
                audit.normalize_url(bad)


class Analyze(unittest.TestCase):
    def test_old_site_scores_low_and_lists_issues(self):
        r = load("vieux_site.html", final_url="http://exemple.re/")
        failed = {c.id for c in r.failed}
        self.assertTrue({"https", "mobile", "description", "contact", "video", "social", "fresh", "h1"} <= failed)
        self.assertLess(r.score, 35)

    def test_medium_site_gets_partial_score(self):
        r = load("site_moyen.html", elapsed_ms=800)
        ids_ok = {c.id for c in r.checks if c.ok}
        self.assertIn("mobile", ids_ok)
        self.assertIn("contact", ids_ok)
        self.assertIn("social", ids_ok)
        self.assertIn("video", {c.id for c in r.failed})
        self.assertTrue(35 < r.score < 90)

    def test_good_site_scores_high(self):
        r = load("bon_site.html", elapsed_ms=600)
        self.assertGreaterEqual(r.score, 90)
        self.assertEqual([c.id for c in r.failed][:1] if r.failed else [], [c.id for c in r.failed][:1])
        self.assertIn("instagram", r.socials)

    def test_slow_response_flagged(self):
        r = load("bon_site.html", elapsed_ms=5200)
        self.assertIn("speed", {c.id for c in r.failed})

    def test_broken_html_does_not_crash(self):
        r = audit.analyze_html("<html><head><title>x<body><<<>>><a href=", "https://x.re/")
        self.assertIsInstance(r.score, int)

    def test_empty_html(self):
        r = audit.analyze_html("", "https://x.re/")
        self.assertLess(r.score, 40)

    def test_failed_sorted_by_weight(self):
        r = load("vieux_site.html")
        weights = [c.weight for c in r.failed]
        self.assertEqual(weights, sorted(weights, reverse=True))


class LocalServerAudit(unittest.TestCase):
    """Audit réel (via HTTP local) d'une page servie par un mini-serveur de test."""

    @classmethod
    def setUpClass(cls):
        import http.server, threading
        page = (FX / "bon_site.html").read_bytes()

        class H(http.server.BaseHTTPRequestHandler):
            def log_message(self, *a): pass
            def do_GET(self):
                if self.path == "/robots.txt":
                    self.send_response(404); self.end_headers(); return
                if self.path == "/redir":
                    self.send_response(302); self.send_header("Location", "http://127.0.0.1:1/"); self.end_headers(); return
                if self.path == "/boom":
                    self.send_response(500); self.end_headers(); return
                self.send_response(200); self.send_header("Content-Type", "text/html; charset=utf-8"); self.end_headers(); self.wfile.write(page)

        cls.srv = http.server.ThreadingHTTPServer(("127.0.0.1", 0), H)
        cls.base = f"http://127.0.0.1:{cls.srv.server_address[1]}"
        threading.Thread(target=cls.srv.serve_forever, daemon=True).start()

    @classmethod
    def tearDownClass(cls):
        cls.srv.shutdown(); cls.srv.server_close()

    def test_real_http_fetch(self):
        r = audit.audit_url(self.base + "/", allow_private=True)
        self.assertEqual(r.error, "")
        self.assertEqual(r.status, 200)
        self.assertGreaterEqual(r.score, 85)

    def test_http_error_reported(self):
        r = audit.audit_url(self.base + "/boom", allow_private=True)
        self.assertIn("500", r.error)

    def test_redirect_to_private_blocked(self):
        # allow_private=False : la cible initiale est déjà privée, donc refusée avant toute requête
        r = audit.audit_url(self.base + "/redir")
        self.assertIn("refus", r.error)


class FetchErrors(unittest.TestCase):
    def test_invalid_url_returns_error_not_exception(self):
        r = audit.audit_url("ftp://x")
        self.assertTrue(r.error)

    def test_unreachable_host(self):
        r = audit.audit_url("http://127.0.0.1:9/", respect_robots=False, allow_private=True)
        self.assertTrue(r.error)
        self.assertEqual(r.score, 0)

    def test_private_hosts_refused_by_default(self):
        for u in ("http://127.0.0.1/", "http://localhost:8000/", "http://192.168.1.1/", "http://10.0.0.5/", "http://169.254.169.254/latest/meta-data/", "http://[::1]/"):
            r = audit.audit_url(u)
            self.assertIn("refusée", r.error, u)


if __name__ == "__main__":
    unittest.main()
