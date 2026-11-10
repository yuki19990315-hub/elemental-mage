#!/usr/bin/env python3
"""Extract the environment v2 pack safely. Never rewrite unrelated assets."""
from pathlib import Path, PurePosixPath
from zipfile import ZipFile
import hashlib, json
ROOT=Path(__file__).resolve().parents[1]
SOURCE=ROOT/"assets/environment/source/environment_art_pack_v2.zip"
TARGET=ROOT/"assets/environment/v2"
def main():
    assert SOURCE.is_file(), f"Missing art source archive: {SOURCE}"
    with ZipFile(SOURCE) as z:
        entries=z.infolist()
        manifest_path="assets/environment/v2/manifest.json"
        assert any(f.filename==manifest_path for f in entries)
        manifest=json.loads(z.read(manifest_path))
        assets=manifest["assets"]
        expected={m["path"] for m in assets}|{manifest_path}
        for item in entries:
            name=item.filename
            if name=="README.md": continue
            p=PurePosixPath(name)
            assert not item.is_dir() and p.as_posix()==name and ".." not in p.parts, name
            assert name in expected, f"Unexpected archive path: {name}"
            assert name.startswith("assets/environment/v2/"),name
            assert item.file_size <= 6_000_000, name
        assert {i.filename for i in entries if i.filename!="README.md"}==expected
        # Validate all image payloads against committed manifest before writing.
        for m in assets:
            data=z.read(m["path"])
            assert hashlib.sha256(data).hexdigest()==m["sha256"], m["path"]
            assert data.startswith(bytes([137,80,78,71,13,10,26,10])),m["path"]
        for item in entries:
            if item.filename=="README.md": continue
            dest=ROOT/item.filename
            assert dest.resolve().is_relative_to(TARGET.resolve()),item.filename
            dest.parent.mkdir(parents=True,exist_ok=True)
            dest.write_bytes(z.read(item))
        print(f"PASS: extracted {len(assets)} environment PNGs + manifest")
if __name__=="__main__": main()
