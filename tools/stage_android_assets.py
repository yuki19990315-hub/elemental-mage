#!/usr/bin/env python3
"""Package the existing Elemental Mage Web UI/game as offline Android assets.

Run from the repository root, or pass --check to validate in a temporary dir.
All paths preserve the web application's relative ../assets and ../data URLs.
"""
from __future__ import annotations
import argparse
import json
import shutil
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
TARGET = ROOT / "android/app/src/main/assets"

def stage(destination: Path) -> dict:
    if destination.exists():
        shutil.rmtree(destination)
    destination.mkdir(parents=True)
    proto=ROOT/"prototype"
    (destination/"prototype").mkdir(parents=True,exist_ok=True)
    for suffix in ("*.html","*.css","*.js"):
        for src in proto.glob(suffix):
            shutil.copy2(src,destination/"prototype"/src.name)
    # Copy all JSON used by fetch('../data/...') even when future recipes are added.
    (destination/"data").mkdir(exist_ok=True)
    for src in (ROOT/"data").glob("*.json"):
        shutil.copy2(src,destination/"data"/src.name)
    for group in ["gba/v1", "ui/v1"]:
        source=ROOT/"assets"/group
        if not source.exists():
            raise FileNotFoundError(f"Required visual assets missing: {source}")
        shutil.copytree(source,destination/"assets"/group,dirs_exist_ok=True)
    # Safe offline rendering fallback for incomplete GBA art. Exclude huge
    # AI concept boards, binary sprite packets and non-runtime source archives.
    for group in ["characters","enemies","bosses","tiles","obstacles","projectiles","icons"]:
        source=ROOT/"assets"/group
        if not source.exists():
            continue
        dest=destination/"assets"/group
        dest.mkdir(parents=True,exist_ok=True)
        for src in source.glob("*.svg"):
            shutil.copy2(src,dest/src.name)
    source=ROOT/"assets/environment/v2"
    if source.exists():
        for folder in ["tiles","props"]:
            sdir=source/folder
            if sdir.exists():
                for src in sdir.rglob("*.png"):
                    dest=destination/"assets/environment/v2"/src.relative_to(source)
                    dest.parent.mkdir(parents=True,exist_ok=True)
                    shutil.copy2(src,dest)
    required=[
       "prototype/index.html","prototype/game.js","prototype/ui.js",
       "prototype/logic.js","prototype/mechanics_v4.js","prototype/style.css",
       "data/elements.json","data/enemies.json","data/bosses.json",
       "data/fusion_recipes.json",
       "assets/gba/v1/characters/mage_down_0.png",
       "assets/gba/v1/icons/fire.png",
       "assets/gba/v1/enemies/poison_slime/idle_0.png",
       "assets/gba/v1/bosses/boss_ice_queen/idle_0.png",
       "assets/ui/v1/panel_frame.png"
    ]
    missing=[x for x in required if not (destination/x).is_file()]
    if missing:
        raise RuntimeError(f"Missing packaged files: {missing}")
    html=(destination/"prototype/index.html").read_text(encoding="utf-8")
    for src in ["./game.js","./ui.js","./logic.js","./mechanics_v4.js","./style.css"]:
        assert src in html,src
    # Detect accidental large archives or backup content.
    assets=[x for x in destination.rglob("*") if x.is_file()]
    forbidden=[str(x) for x in assets if x.suffix.lower() in {".zip",".b64",".psd"}]
    if forbidden: raise RuntimeError(f"Unexpected binary source archives: {forbidden}")
    report={"files":len(assets),"bytes":sum(p.stat().st_size for p in assets),
            "web_entry":"prototype/index.html","offline":True}
    (destination/"android_asset_manifest.json").write_text(
        json.dumps(report,indent=2,ensure_ascii=False)+"\n",encoding="utf-8")
    return report

def main():
    p=argparse.ArgumentParser()
    p.add_argument("--check",action="store_true",help="Stage into a temporary directory; leave build tree unchanged")
    options=p.parse_args()
    if options.check:
        with tempfile.TemporaryDirectory(prefix="elemental-android-") as tmp:
            result=stage(Path(tmp)/"assets")
            print("PASS Android staging dry-run:",json.dumps(result))
    else:
        result=stage(TARGET)
        print("PASS Android staging:",json.dumps(result))
if __name__=="__main__":
    main()
