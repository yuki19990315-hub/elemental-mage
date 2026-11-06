#!/usr/bin/env python3
"""Compatibility command: export the checked-in SVG art to RGBA PNG.
Does not regenerate the older ZIP's original raster artwork.
Install: pip install -r tools/requirements.txt
"""
from pathlib import Path
import cairosvg
root=Path(__file__).resolve().parents[1]
count=0
for source in (root/"assets").rglob("*.svg"):
    if source.parent.name=="previews":continue
    cairosvg.svg2png(url=str(source),write_to=str(source.with_suffix(".png")))
    count+=1
print("Exported",count,"sprite PNGs")
