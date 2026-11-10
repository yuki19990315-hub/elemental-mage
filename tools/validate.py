#!/usr/bin/env python3
"""Validate the data-driven game manifest and art references."""
import base64, binascii, json, xml.etree.ElementTree as ET
from pathlib import Path
from itertools import combinations
R=Path(__file__).resolve().parents[1]
def load(n): return json.loads((R/"data"/(n+".json")).read_text(encoding="utf-8"))
elements=load("elements"); ids=[e["id"] for e in elements]
assert len(ids)==9 and len(set(ids))==9, "neutral + 8 elements required"
combat=set(ids)-{"neutral"}
assert len(combat)==8
recipes=load("fusion_recipes")
pairs=set()
for r in recipes:
    a,b=r["elements"]
    assert a!=b and {a,b}<=combat, r["id"]
    key=tuple(sorted((a,b)));assert key not in pairs, key;pairs.add(key)
assert pairs==set(combinations(sorted(combat),2)), "28 distinct element pairs required"
enemies=load("enemies");bosses=load("bosses")
assert len(enemies)>=11 and len({e["id"] for e in enemies})==len(enemies)
assert len(bosses)==3 and len({b["id"] for b in bosses})==3
for name,objs in [("elements",elements),("fusion_recipes",recipes),("enemies",enemies),("bosses",bosses),("obstacles",load("obstacles"))]:
    for item in objs:
        for prop in ("asset","icon","projectile"):
            if item.get(prop):
                assert (R/item[prop]).is_file(), (name,item["id"],prop,item[prop])
for p in (R/"assets").rglob("*.svg"):
    assert ET.parse(p).getroot().tag.endswith("svg"),p
# Validate v2 packet paths and PNG signatures without claiming all 14 packets are present.
pdir=R/"assets/sprites/v2/packets"
for p in pdir.glob("*.json"):
    doc=json.loads(p.read_text(encoding="utf-8"))
    assert doc.get("entries"),p
    for e in doc["entries"]:
        dest=Path(e["path"])
        assert dest.parts[:3]==("assets","sprites","v2") and ".." not in dest.parts and dest.suffix==".png",p
        assert base64.b64decode(e["base64"],validate=True).startswith(b"\\x89PNG\\r\\n\\x1a\\n"),e["path"]
print(f"PASS: {len(elements)} element states, {len(pairs)} pair recipes, {len(enemies)} enemies, {len(bosses)} bosses, {len(list(pdir.glob('*.json')))} sprite packets")
