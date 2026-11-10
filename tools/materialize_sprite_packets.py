#!/usr/bin/env python3
"""Safely decode sprite packet JSON into standalone PNGs, atlases and basic metadata.

Only packets available in the repository are generated. No claims of 14 complete
packs if only 12 source packets exist. The final art needs manual visual review.
"""
import base64
import io
import json
from pathlib import Path
from PIL import Image

ROOT=Path(__file__).resolve().parents[1]
PACKETS=ROOT/"assets/sprites/v2/packets"
EXPECTED=("idle_0","idle_1","move_0","move_1","attack_0","attack_1","hit","stun")
PNG_SIGNATURE=bytes([137,80,78,71,13,10,26,10])

def export():
    files=sorted(PACKETS.glob("*.json"))
    assert files, "No sprite packets found"
    count=0
    for packet in files:
        obj=json.loads(packet.read_text(encoding="utf-8"))
        entries=obj.get("entries",[])
        assert len(entries)==len(EXPECTED), (packet,len(entries))
        images={}
        creature_dir=None
        for entry in entries:
            rel=Path(entry["path"])
            assert rel.parts[:4]==("assets","sprites","v2",rel.parts[3]) and rel.parts[3] in ("enemies","bosses")
            assert len(rel.parts)==6 and rel.suffix.lower()==".png"
            assert rel.parts[4]==packet.stem
            frame=rel.stem
            assert frame in EXPECTED and frame not in images, (packet,frame)
            output=(ROOT/rel).resolve()
            assert output.is_relative_to(ROOT.resolve())
            binary=base64.b64decode(entry["base64"],validate=True)
            assert binary.startswith(PNG_SIGNATURE),rel
            assert len(binary)<5_000_000,rel
            img=Image.open(io.BytesIO(binary))
            img.load()
            img=img.convert("RGBA")
            assert img.width==img.height and img.width in (192,256), (rel,img.size)
            images[frame]=img
            creature_dir=output.parent
        assert set(images)==set(EXPECTED),(packet,set(images))
        creature_dir.mkdir(parents=True,exist_ok=True)
        for frame,img in images.items():
            img.save(creature_dir/(frame+".png"),optimize=True)
            count+=1
        w,h=images["idle_0"].size
        atlas=Image.new("RGBA",(4*w,2*h))
        for i,frame in enumerate(EXPECTED):
            atlas.paste(images[frame],((i%4)*w,(i//4)*h))
        atlas.save(creature_dir/"atlas.png",optimize=True)
        meta={"id":packet.stem,"status":"candidate_requires_visual_review","canvas_size":[w,h],
              "anchor_px":[w//2,round(h*0.86)],
              "atlas":{"file":"atlas.png","columns":4,"rows":2,"order":list(EXPECTED)},
              "animations":{"idle":{"frames":["idle_0.png","idle_1.png"],"fps":3,"loop":True},
                            "move":{"frames":["move_0.png","move_1.png"],"fps":6,"loop":True},
                            "attack":{"frames":["attack_0.png","attack_1.png"],"fps":8,"loop":False},
                            "hit":{"frames":["hit.png"],"fps":1,"loop":False},
                            "stun":{"frames":["stun.png"],"fps":1,"loop":False}},
              "note":"Animation timing and anchor are provisional; effects may spill into other frames."}
        (creature_dir/"meta.json").write_text(json.dumps(meta,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print(f"PASS: decoded {count} PNG frames, {len(files)} atlases and metadata")
if __name__=="__main__": export()
