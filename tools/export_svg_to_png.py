#!/usr/bin/env python3
"""Optional: export all SVG asset sprites to native-resolution RGBA PNG files.
Requirements: pip install -r tools/requirements.txt
The source SVG images remain untouched.
"""
from pathlib import Path
import cairosvg
root=Path(__file__).resolve().parents[1]
count=0
for source in (root/"assets").rglob("*.svg"):
    if source.parent.name=="previews":
        continue
    cairosvg.svg2png(url=str(source),write_to=str(source.with_suffix(".png")))
    count+=1
print(f"Exported {count} PNG sprites from SVG sources")
