"""Génère docs/EXEMPLES_MESSAGES.md à partir des prospects FICTIFS de démo (aucun envoi, aucune vraie entreprise)."""
import pathlib
import sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent.parent))
from radar import demo, messages, store  # noqa: E402

OUT = pathlib.Path(__file__).resolve().parent.parent / "docs" / "EXEMPLES_MESSAGES.md"

with store.connect(":memory:") as con:
    ids = demo.load(con)
    parts = ["# Exemples de messages générés (entreprises FICTIVES)\n",
             "Tous les noms ci-dessous sont inventés pour la démonstration. Les constats viennent de pages HTML d'exemple fournies avec l'outil (`radar/demo_data/`). Rien de ceci n'a été envoyé.\n"]
    for pid in ids:
        row = store.get(con, pid)
        m = messages.build({k: row[k] for k in row.keys()}, store.last_audit(con, pid))
        score = "pas de site" if row["score"] is None else f"{row['score']}/100"
        parts.append(f"\n## {row['name']} ({row['sector']}, {row['commune']}), score {score}\n")
        parts.append("**WhatsApp / Instagram**\n\n```\n" + m["dm"] + "\n```\n")
        parts.append("**E-mail**\n\n```\nObjet : " + m["email_subject"] + "\n\n" + m["email"] + "\n```\n")
OUT.write_text("\n".join(parts), encoding="utf-8")
print("écrit", OUT)
