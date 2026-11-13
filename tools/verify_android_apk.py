#!/usr/bin/env python3
"""Check that the produced file is an installable-looking APK with offline Web assets.

This is structural verification, not a physical Android device test.
"""
import sys
import zipfile
from pathlib import Path
apk=Path(sys.argv[1])
assert apk.exists() and apk.stat().st_size>500_000, "Missing or suspiciously small APK"
with zipfile.ZipFile(apk) as z:
    bad=z.testzip()
    assert bad is None, f"Corrupt ZIP member: {bad}"
    files=set(z.namelist())
    must={
        "AndroidManifest.xml",
        "assets/prototype/index.html",
        "assets/prototype/game.js",
        "assets/prototype/ui.js",
        "assets/prototype/style.css",
        "assets/data/elements.json",
        "assets/data/fusion_recipes.json",
        "assets/gba/v1/characters/mage_down_0.png",
        "assets/gba/v1/enemies/poison_slime/idle_0.png",
        "assets/gba/v1/bosses/boss_ice_queen/idle_0.png",
    }
    missing=must-files
    assert not missing, f"Missing APK payload: {sorted(missing)}"
    dex=[f for f in files if f.startswith("classes") and f.endswith(".dex")]
    assert dex, "APK has no Android compiled code"
    html=z.read("assets/prototype/index.html").decode("utf-8")
    assert "./game.js" in html and "./ui.js" in html
    print(f"PASS Android APK: {apk.stat().st_size:,} bytes; "
          f"{len(files)} archive entries; {len(dex)} dex; all required offline files")
