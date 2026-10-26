"""Interface web locale de KAPTUR Radar (127.0.0.1 uniquement, bibliothèque standard)."""
from __future__ import annotations

import html
import re
import secrets
import urllib.parse
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

from . import audit as audit_mod
from . import demo as demo_mod
from . import messages, store

e = html.escape
CSS = """
:root{--bg:#0a0a0a;--panel:#161616;--ink:#f4f4f2;--mute:#a8a8a4;--acc:#ff5b1f;--line:#2c2c2c;--ok:#5ec27f;--bad:#ff7a5c}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font:16px/1.5 system-ui,sans-serif}
a{color:var(--acc)}header{display:flex;gap:24px;align-items:center;padding:16px 24px;border-bottom:1px solid var(--line)}
header b{font:700 22px Impact,'Arial Narrow',sans-serif;letter-spacing:.02em;text-transform:uppercase}
main{max-width:1100px;margin:0 auto;padding:24px}h1,h2{margin:0 0 12px}h2{font-size:20px}
table{width:100%;border-collapse:collapse}th,td{padding:8px 10px;border-bottom:1px solid var(--line);text-align:left;vertical-align:top}
th{color:var(--mute);font-weight:500;font-size:14px}.panel{background:var(--panel);padding:16px;margin:16px 0}
input,select,textarea{background:#0f0f0f;color:var(--ink);border:1px solid var(--line);padding:8px;font:inherit;max-width:100%}
textarea{width:100%;min-height:150px}button{background:var(--acc);color:#0a0a0a;border:0;padding:8px 14px;font-weight:700;cursor:pointer}
button.alt{background:transparent;color:var(--ink);border:1px solid var(--line)}.row{display:flex;gap:8px;flex-wrap:wrap;align-items:end}
.score{font-weight:700}.good{color:var(--ok)}.warn{color:var(--bad)}.mute{color:var(--mute)}.tag{border:1px solid var(--line);padding:2px 8px;font-size:13px}
.banner{background:#2a1a12;border:1px solid var(--acc);padding:10px 14px;margin-bottom:16px}label{display:grid;gap:4px;font-size:14px;color:var(--mute)}
:focus-visible{outline:2px solid var(--acc);outline-offset:2px}
"""


def page(title: str, body: str, token: str, notice: str = "") -> bytes:
    n = f'<div class="banner">{e(notice)}</div>' if notice else ""
    return (f"<!doctype html><html lang='fr'><meta charset='utf-8'><meta name='viewport' content='width=device-width,initial-scale=1'>"
            f"<title>{e(title)}</title><style>{CSS}</style><header><b>Kaptur Radar</b><a href='/'>Prospects</a>"
            f"<span class='mute'>Local uniquement. Rien n'est envoyé automatiquement.</span></header><main>{n}{body}</main>"
            f"<script>document.querySelectorAll('[data-copy]').forEach(function(b){{b.addEventListener('click',function(){{"
            f"var t=document.getElementById(b.dataset.copy);t.select();var ok=function(){{b.textContent='Copié'}},fb=function(){{try{{document.execCommand('copy');ok()}}catch(x){{}}}};if(navigator.clipboard){{navigator.clipboard.writeText(t.value).then(ok,fb)}}else{{fb()}}}})}});</script>"
            ).encode("utf-8")


def sel(name: str, options, current: str = "", extra: str = "") -> str:
    o = "".join(f"<option{' selected' if x == current else ''}>{e(x)}</option>" for x in options)
    return f"<select name='{name}' {extra}>{o}</select>"


def home(con, token: str, status: str = "", notice: str = "") -> bytes:
    stats = store.stats(con)
    funnel = " · ".join(f"{e(k)} <b>{v}</b>" for k, v in stats.items())
    rows = store.list_prospects(con, status=status or None)
    trs = []
    for r in rows:
        score = "-" if r["score"] is None else str(r["score"])
        cls = "mute" if r["score"] is None else ("warn" if r["score"] < 50 else "good")
        due = f"<br><span class='mute'>relance {e(r['next_followup'])}</span>" if r["next_followup"] else ""
        demo_tag = " <span class='tag'>démo fictive</span>" if r["source"] == "demo" else ""
        trs.append(f"<tr><td><a href='/p/{r['id']}'>{e(r['name'])}</a>{demo_tag}<br><span class='mute'>{e(r['commune'])}</span></td>"
                   f"<td>{e(r['sector'])}</td><td class='score {cls}'>{score}</td><td>{e(r['status'])}{due}</td></tr>")
    table = ("<table><tr><th>Entreprise</th><th>Secteur</th><th>Score site</th><th>Statut</th></tr>" + "".join(trs) + "</table>") if trs else "<p class='mute'>Aucun prospect. Ajoutez-en un ci-dessous, ou lancez <code>python -m radar demo</code> pour voir des exemples fictifs.</p>"
    filt = "<form method='get' class='row'><label>Filtrer par statut" + sel("status", [""] + store.STATUSES, status) + "</label><button class='alt'>Filtrer</button></form>"
    add = (f"<form method='post' action='/add' class='panel row'><input type='hidden' name='token' value='{token}'>"
           "<label>Entreprise<input name='name' required></label><label>Secteur" + sel("sector", store.SECTORS, "autre") + "</label>"
           "<label>Commune<input name='commune'></label><label>Site web<input name='website' placeholder='exemple.re'></label><button>Ajouter</button></form>")
    return page("Prospects", f"<h1>Prospects</h1><p>{funnel}</p>{filt}{table}<h2>Ajouter</h2>{add}", token, notice)


def detail(con, pid: int, token: str, notice: str = "") -> bytes | None:
    r = store.get(con, pid)
    if r is None:
        return None
    a = store.last_audit(con, pid)
    if a and not a.get("error"):
        items = "".join(f"<tr><td class='{'good' if c['ok'] else 'warn'}'>{'OK' if c['ok'] else 'À corriger'}</td><td>{e(c['label'])}<br><span class='mute'>{e(c['detail'])}</span></td></tr>"
                        for c in sorted(a["checks"], key=lambda c: (c["ok"], -c["weight"])))
        audit_html = f"<p class='score'>Score : {a['score']}/100 <span class='mute'>(audit du {e(a['_ts'][:16])})</span></p><table>{items}</table>"
    elif a:
        audit_html = f"<p class='warn'>{e(a['error'])}</p>"
    else:
        audit_html = "<p class='mute'>Pas encore d'audit.</p>"
    m = messages.build({k: r[k] for k in r.keys()}, a)
    boxes = []
    for key, title in (("dm", "WhatsApp / Instagram"), ("email", "E-mail"), ("call", "Script d'appel"), ("relance_1", "Relance J+3"), ("relance_2", "Relance J+7")):
        text = (f"Objet : {m['email_subject']}\n\n" if key == "email" else "") + m[key]
        boxes.append(f"<h2>{e(title)}</h2><textarea id='t-{key}' readonly>{e(text)}</textarea><p><button class='alt' type='button' data-copy='t-{key}'>Copier</button></p>")
    edit = (f"<form method='post' action='/p/{pid}/edit' class='row'><input type='hidden' name='token' value='{token}'>"
            f"<label>Site web<input name='website' value='{e(r['website'])}'></label><label>Téléphone<input name='phone' value='{e(r['phone'])}'></label>"
            f"<label>E-mail<input name='email' value='{e(r['email'])}'></label><label>Instagram<input name='instagram' value='{e(r['instagram'])}'></label>"
            f"<label>Notes<input name='notes' value='{e(r['notes'])}'></label><button>Enregistrer</button></form>")
    status = (f"<form method='post' action='/p/{pid}/status' class='row'><input type='hidden' name='token' value='{token}'>"
              f"<label>Statut{sel('status', store.STATUSES, r['status'])}</label><button>Changer</button></form>")
    aud = (f"<form method='post' action='/p/{pid}/audit'><input type='hidden' name='token' value='{token}'><button>Lancer l'audit du site</button></form>")
    dele = (f"<form method='post' action='/p/{pid}/delete'><input type='hidden' name='token' value='{token}'><button class='alt'>Supprimer ce prospect</button></form>")
    body = (f"<p><a href='/'>&larr; Retour</a></p><h1>{e(r['name'])}</h1><p class='mute'>{e(r['sector'])} · {e(r['commune'])} · SIREN {e(r['siren'] or '-')}</p>"
            f"<div class='panel'><h2>Fiche</h2>{edit}<h2>Statut</h2>{status}</div><div class='panel'><h2>Audit du site</h2>{aud}{audit_html}</div>"
            f"<div class='panel'><p class='mute'>Messages préparés à partir de l'audit. Relisez et envoyez vous-même.</p>{''.join(boxes)}</div>{dele}")
    return page(r["name"], body, token, notice)


class Handler(BaseHTTPRequestHandler):
    server_version = "KapturRadar"
    db_path = None
    token = ""
    port = 0

    def log_message(self, fmt, *args):  # journal discret
        pass

    # -- utilitaires
    def _send(self, code: int, body: bytes, ctype="text/html; charset=utf-8", headers=None):
        self.send_response(code)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(body)))
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("X-Frame-Options", "DENY")
        self.send_header("Content-Security-Policy", "default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; form-action 'self'; base-uri 'none'")
        self.send_header("Referrer-Policy", "no-referrer")
        for k, v in (headers or {}).items():
            self.send_header(k, v)
        self.end_headers()
        self.wfile.write(body)

    def _redirect(self, to: str):
        self.send_response(303)
        self.send_header("Location", to)
        self.send_header("Content-Length", "0")
        self.end_headers()

    def _host_ok(self) -> bool:
        host = (self.headers.get("Host") or "").lower()
        return host in (f"127.0.0.1:{self.port}", f"localhost:{self.port}")

    # -- routes
    def do_GET(self):
        if not self._host_ok():
            return self._send(403, b"Hote refuse")
        u = urllib.parse.urlsplit(self.path)
        q = urllib.parse.parse_qs(u.query)
        with store.connect(self.db_path) as con:
            if u.path == "/":
                status = (q.get("status") or [""])[0]
                if status and status not in store.STATUSES:
                    status = ""
                return self._send(200, home(con, self.token, status, (q.get("n") or [""])[0][:200]))
            m = re.fullmatch(r"/p/(\d+)", u.path)
            if m:
                body = detail(con, int(m.group(1)), self.token, (q.get("n") or [""])[0][:200])
                return self._send(200, body) if body else self._send(404, "Prospect introuvable".encode())
        self._send(404, b"Introuvable")

    def do_POST(self):
        if not self._host_ok():
            return self._send(403, b"Hote refuse")
        origin = self.headers.get("Origin")
        if origin and origin not in (f"http://127.0.0.1:{self.port}", f"http://localhost:{self.port}"):
            return self._send(403, b"Origine refusee")
        try:
            n = int(self.headers.get("Content-Length") or 0)
        except ValueError:
            n = 0
        if n > 20_000:
            return self._send(413, b"Trop grand")
        form = {k: v[0] for k, v in urllib.parse.parse_qs(self.rfile.read(n).decode("utf-8", "replace")).items()}
        if not secrets.compare_digest(form.get("token", ""), self.token):
            return self._send(403, b"Jeton invalide")
        path = urllib.parse.urlsplit(self.path).path

        def back(to, msg):
            self._redirect(to + "?n=" + urllib.parse.quote(msg))

        try:
            with store.connect(self.db_path) as con:
                if path == "/add":
                    pid = store.add_prospect(con, form.get("name", ""), sector=form.get("sector") or "autre", commune=form.get("commune", ""), website=form.get("website", ""))
                    return back(f"/p/{pid}", "Prospect ajouté.")
                m = re.fullmatch(r"/p/(\d+)/(edit|status|audit|delete)", path)
                if not m:
                    return self._send(404, b"Introuvable")
                pid, action = int(m.group(1)), m.group(2)
                if store.get(con, pid) is None:
                    return self._send(404, b"Prospect introuvable")
                if action == "edit":
                    store.update(con, pid, **{k: form.get(k, "") for k in ("website", "phone", "email", "instagram", "notes")})
                    return back(f"/p/{pid}", "Fiche enregistrée.")
                if action == "status":
                    store.set_status(con, pid, form.get("status", ""))
                    return back(f"/p/{pid}", "Statut mis à jour.")
                if action == "delete":
                    store.delete(con, pid)
                    return back("/", "Prospect supprimé.")
                row = store.get(con, pid)
                if row["source"] == "demo":
                    res = demo_mod.audit_for(row["name"]) or audit_mod.no_site_result()
                elif row["website"]:
                    res = audit_mod.audit_url(row["website"])
                else:
                    res = audit_mod.no_site_result()
                store.save_audit(con, pid, res.to_dict())
                return back(f"/p/{pid}", "Audit terminé." if not res.error else f"Audit impossible : {res.error}")
        except (ValueError, KeyError) as err:
            return back("/", f"Erreur : {err}")


def make_server(port: int, db_path=None) -> ThreadingHTTPServer:
    srv = ThreadingHTTPServer(("127.0.0.1", port), Handler)
    Handler.db_path = db_path
    Handler.token = secrets.token_urlsafe(24)
    Handler.port = srv.server_address[1]
    return srv


def serve(port: int = 8765, db_path=None) -> None:
    srv = make_server(port, db_path)
    print(f"KAPTUR Radar : http://127.0.0.1:{srv.server_address[1]}/  (Ctrl+C pour arrêter)")
    try:
        srv.serve_forever()
    except KeyboardInterrupt:
        print("\nArrêt.")
    finally:
        srv.server_close()
