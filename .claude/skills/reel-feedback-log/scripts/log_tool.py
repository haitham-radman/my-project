#!/usr/bin/env python3
"""Registro de reels, metricas y correcciones (stdlib, JSON Lines).

  log_tool.py add        LOG --slug S --topic T --hook-type TIPO --hook TEXTO [--date AAAA-MM-DD]
  log_tool.py metrics    LOG --slug S --platform tiktok|instagram [--views N --likes N --comments N
                             --shares N --saves N --avg-watch-s X] [--as-of AAAA-MM-DD]
  log_tool.py correction LOG --slug S --skill NOMBRE --what TEXTO
  log_tool.py status     LOG --slug S --index N --status propuesta|aprobada|aplicada|descartada
  log_tool.py report     LOG
  log_tool.py check      LOG

Solo guarda lo que el usuario da: las metricas no se leen de ninguna cuenta ni
se inventan. No guardes claves, enlaces privados ni datos personales. El
informe no saca conclusiones con menos de 5 reels por grupo.
"""
import argparse
import datetime
import json
import os
import re
import sys
import tempfile
from pathlib import Path

SKILLS = Path(__file__).resolve().parents[2]
PLATFORMS = ("tiktok", "instagram")
HOOK_TYPES = ("pregunta", "error", "promesa", "contraste", "lista")
STATUSES = ("propuesta", "aprobada", "aplicada", "descartada")
INT_FIELDS = ("views", "likes", "comments", "shares", "saves")
SLUG = re.compile(r"^[a-z0-9]+(-[a-z0-9]+)*$")
MIN_GROUP = 5     # reels por grupo para hablar de tendencia
RECURRENT = 2     # correcciones abiertas de una skill => proponer cambio
AGE_SPREAD_DAYS = 2  # diferencia de edad al medir que invalida comparar vistas


def read(path):
    p = Path(path)
    if not p.exists():
        return []
    recs = []
    for n, line in enumerate(p.read_text(encoding="utf-8").splitlines(), 1):
        if line.strip():
            try:
                recs.append(json.loads(line))
            except json.JSONDecodeError as ex:
                raise ValueError(f"linea {n}: JSON invalido ({ex.msg})")
    return recs


def write(path, recs):
    p = Path(path)
    p.parent.mkdir(parents=True, exist_ok=True)
    fd, tmp = tempfile.mkstemp(dir=p.parent, suffix=".tmp")
    with os.fdopen(fd, "w", encoding="utf-8") as f:
        for r in recs:
            f.write(json.dumps(r, ensure_ascii=False) + "\n")
    os.replace(tmp, p)


def find(recs, slug):
    hits = [r for r in recs if r["slug"] == slug]
    if not hits:
        raise KeyError(f"no hay ningun reel con slug {slug!r}")
    return hits[-1]


def valid_date(s):
    try:
        datetime.date.fromisoformat(s)
        return True
    except (TypeError, ValueError):
        return False


def add(recs, slug, topic, hook_type, hook, date):
    if not SLUG.match(slug):
        raise ValueError(f"slug invalido {slug!r}: minusculas, numeros y guiones")
    if hook_type not in HOOK_TYPES:
        raise ValueError(f"tipo de gancho {hook_type!r}: usa {', '.join(HOOK_TYPES)}")
    if not valid_date(date):
        raise ValueError(f"fecha invalida {date!r}")
    if any(r["slug"] == slug and r["date"] == date for r in recs):
        raise ValueError(f"ya existe {date}_{slug}")
    recs.append({"date": date, "slug": slug, "topic": topic, "hook_type": hook_type, "hook": hook,
                 "metrics": {}, "corrections": []})
    return recs


def set_metrics(recs, slug, platform, values, as_of):
    if platform not in PLATFORMS:
        raise ValueError(f"plataforma {platform!r}: usa {', '.join(PLATFORMS)}")
    if not valid_date(as_of):
        raise ValueError(f"fecha invalida {as_of!r}")
    given = {k: v for k, v in values.items() if v is not None}
    if not given:
        raise ValueError("no diste ninguna metrica")
    for k, v in given.items():
        if v < 0:
            raise ValueError(f"{k} no puede ser negativo")
    m = find(recs, slug)["metrics"].setdefault(platform, {})
    m.update(given)
    m["as_of"] = as_of
    return recs


def add_correction(recs, slug, skill, what):
    if not (SKILLS / skill / "SKILL.md").exists():
        raise ValueError(f"la skill {skill!r} no existe en .claude/skills")
    if not what.strip():
        raise ValueError("describe la correccion")
    find(recs, slug)["corrections"].append({"skill": skill, "what": what.strip(), "status": "propuesta"})
    return recs


def set_status(recs, slug, index, status):
    if status not in STATUSES:
        raise ValueError(f"estado {status!r}: usa {', '.join(STATUSES)}")
    cs = find(recs, slug)["corrections"]
    if not 1 <= index <= len(cs):
        raise ValueError(f"indice {index} fuera de rango (1-{len(cs)})")
    cs[index - 1]["status"] = status
    return recs


def validate(recs):
    errs, seen = [], set()
    for i, r in enumerate(recs, 1):
        tag = f"reel {i}"
        for k in ("date", "slug", "topic", "hook_type", "hook", "metrics", "corrections"):
            if k not in r:
                errs.append(f"{tag}: falta {k}")
        if errs and errs[-1].startswith(tag):
            continue
        key = (r["date"], r["slug"])
        if key in seen:
            errs.append(f"{tag}: duplicado {key[0]}_{key[1]}")
        seen.add(key)
        if not valid_date(r["date"]):
            errs.append(f"{tag}: fecha invalida")
        if r["hook_type"] not in HOOK_TYPES:
            errs.append(f"{tag}: tipo de gancho invalido")
        for plat, m in r["metrics"].items():
            if plat not in PLATFORMS:
                errs.append(f"{tag}: plataforma {plat!r} desconocida")
            for k in INT_FIELDS:
                if k in m and (not isinstance(m[k], int) or m[k] < 0):
                    errs.append(f"{tag}: {plat}.{k} debe ser un entero >= 0")
        for c in r["corrections"]:
            if c.get("status") not in STATUSES:
                errs.append(f"{tag}: estado de correccion invalido")
            if not (SKILLS / str(c.get("skill")) / "SKILL.md").exists():
                errs.append(f"{tag}: la skill {c.get('skill')!r} no existe")
    return errs


def report(recs):
    lines = [f"Reels: {len(recs)}"]
    with_m = sum(1 for r in recs if r["metrics"])
    lines.append(f"Con metricas: {with_m}")
    groups = {}
    for r in recs:
        for plat, m in r["metrics"].items():
            if "views" in m:
                age = (datetime.date.fromisoformat(m["as_of"]) - datetime.date.fromisoformat(r["date"])).days if valid_date(m.get("as_of")) and valid_date(r["date"]) else None
                groups.setdefault((plat, r["hook_type"]), []).append((m["views"], age))
    if groups:
        lines.append("\nVistas por plataforma y tipo de gancho:")
        for (plat, ht), items in sorted(groups.items()):
            v = [x for x, _ in items]
            ages = [a for _, a in items if a is not None]
            note = "" if len(v) >= MIN_GROUP else f"  (n={len(v)} < {MIN_GROUP}: muestra pequena, no concluyas)"
            if ages and max(ages) - min(ages) > AGE_SPREAD_DAYS:
                note += f"  (medidas a {min(ages)}-{max(ages)} dias de publicar: no comparables)"
            lines.append(f"  {plat:9} {ht:10} n={len(v)} media={sum(v) / len(v):.0f}{note}")
        lines.append("  Es una descripcion, no una causa: tema, hora y audiencia tambien cambian las vistas.")
    open_by_skill, all_by_skill = {}, {}
    for r in recs:
        for c in r["corrections"]:
            all_by_skill.setdefault(c["skill"], []).append(c)
            if c["status"] in ("propuesta", "aprobada"):
                open_by_skill.setdefault(c["skill"], []).append((r["slug"], c))
    if all_by_skill:
        lines.append("\nCorrecciones por skill:")
        for skill, cs in sorted(all_by_skill.items()):
            counts = {s: sum(1 for c in cs if c["status"] == s) for s in STATUSES if any(c["status"] == s for c in cs)}
            flag = ""
            if len(open_by_skill.get(skill, [])) >= RECURRENT:
                flag = "  <- RECURRENTE: proponer cambio a la skill (diff + aprobacion)"
            lines.append(f"  {skill}: {len(cs)} ({', '.join(f'{n} {s}' for s, n in counts.items())}){flag}")
        for skill, items in sorted(open_by_skill.items()):
            if len(items) >= RECURRENT:
                lines.append(f"\nAbiertas en {skill}:")
                lines += [f"  - [{s}] {c['what']} ({c['status']})" for s, c in items]
    return "\n".join(lines)


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = ap.add_subparsers(dest="cmd", required=True)
    for name in ("add", "metrics", "correction", "status", "report", "check"):
        sp = sub.add_parser(name)
        sp.add_argument("log")
        if name != "report" and name != "check":
            sp.add_argument("--slug", required=True)
    s = sub.choices["add"]
    s.add_argument("--topic", required=True); s.add_argument("--hook-type", required=True)
    s.add_argument("--hook", required=True); s.add_argument("--date", default=datetime.date.today().isoformat())
    s = sub.choices["metrics"]
    s.add_argument("--platform", required=True)
    for f in INT_FIELDS:
        s.add_argument(f"--{f}", type=int)
    s.add_argument("--avg-watch-s", type=float); s.add_argument("--as-of", default=datetime.date.today().isoformat())
    s = sub.choices["correction"]
    s.add_argument("--skill", required=True); s.add_argument("--what", required=True)
    s = sub.choices["status"]
    s.add_argument("--index", type=int, required=True); s.add_argument("--status", required=True)
    a = ap.parse_args(argv)
    try:
        recs = read(a.log)
        if a.cmd == "report":
            print(report(recs)); return 0
        if a.cmd == "check":
            errs = validate(recs)
            for e in errs:
                print(f"[ERROR] {e}")
            print(f"{len(recs)} reels, {len(errs)} errores")
            return 1 if errs else 0
        if a.cmd == "add":
            recs = add(recs, a.slug, a.topic, a.hook_type, a.hook, a.date)
        elif a.cmd == "metrics":
            vals = {f: getattr(a, f) for f in INT_FIELDS}
            vals["avg_watch_s"] = a.avg_watch_s
            recs = set_metrics(recs, a.slug, a.platform, vals, a.as_of)
        elif a.cmd == "correction":
            recs = add_correction(recs, a.slug, a.skill, a.what)
        elif a.cmd == "status":
            recs = set_status(recs, a.slug, a.index, a.status)
        write(a.log, recs)
        print(f"ok: {a.cmd} {a.slug}")
        return 0
    except (ValueError, KeyError) as ex:
        print(f"error: {ex.args[0] if ex.args else ex}")
        return 2


if __name__ == "__main__":
    sys.exit(main())
