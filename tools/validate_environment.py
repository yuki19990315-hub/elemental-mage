#!/usr/bin/env python3
"""Check environment source art and extracted files/metadata."""
from pathlib import Path
from zipfile import ZipFile
import hashlib,json
from PIL import Image
ROOT=Path(__file__).resolve().parents[1]
SOURCE=ROOT/"assets/environment/source/environment_art_pack_v2.zip"
def main():
    assert SOURCE.is_file()
    with ZipFile(SOURCE) as z:
        meta=json.loads(z.read("assets/environment/v2/manifest.json"))
        art=meta["assets"]
        assert len(art)>=63, len(art)
        assert len([x for x in art if x["kind"]=="floor"])==20
        assert len([x for x in art if x["kind"]=="wall"])==20
        assert len([x for x in art if x["kind"]=="obstacle"])==12
        for entry in art:
            p=ROOT/entry["path"]
            assert p.is_file(),str(p)
            assert hashlib.sha256(p.read_bytes()).hexdigest()==entry["sha256"],str(p)
            with Image.open(p) as im:
                im.verify()
        assert (ROOT/"assets/environment/v2/manifest.json").is_file()
        print(f"PASS: {len(art)} environment PNGs verified; 20 floors, 20 wall modules, 12 props")
if __name__=="__main__":main()
