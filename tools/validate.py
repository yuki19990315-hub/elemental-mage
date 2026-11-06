#!/usr/bin/env python3
"""Check JSON content references, asset sets and SVG XML without third-party packages."""
import json
import xml.etree.ElementTree as ET
from pathlib import Path
from itertools import combinations
ROOT=Path(__file__).resolve().parents[1]
def load(name):return json.loads((ROOT/"data"/name).read_text(encoding="utf-8"))
elements=load("elements.json");pairs=load("fusion_recipes.json")
ids=[a["id"] for a in elements]
assert len(ids)==6 and len(set(ids))==6
assert len(pairs)==15
actual=set()
for p in pairs:
    key=tuple(sorted(p["elements"]))
    assert len(key)==2 and key[0]!=key[1]
    assert key not in actual, f"duplicate pair {key}"
    actual.add(key)
assert actual==set(combinations(sorted(ids),2))
refs=[]
for name in ("elements","fusion_recipes","enemies","bosses","obstacles"):
    for x in load(name+".json"):
        for key in ("icon","projectile","asset"):
            if key in x:refs.append(x[key])
missing=[s for s in refs if not (ROOT/s).is_file()]
assert not missing, f"Missing sprite references: {missing}"
svgs=list((ROOT/"assets").rglob("*.svg"))
assert len(svgs)>=90, f"Expected 90+ svg designs, got {len(svgs)}"
for f in svgs:
    node=ET.parse(f).getroot()
    assert node.tag.endswith("svg"),f
print(f"PASS: {len(svgs)} SVG assets, 6 elements, 15 combinations, all data references valid")
