#!/usr/bin/env python3
"""Split a 4x4 sprite concept sheet: top 2 rows creature A, bottom 2 rows B.
Game asset candidates; artist review of alpha and animation consistency required.
"""
from pathlib import Path
from PIL import Image
import argparse, json

SHEETS = [
  ("魔法と毒のスライム図鑑.png","slime","poison_slime"),
  ("邪眼と深淵眼の16種スプライトシート.png","evil_eye","abyss_eye"),
  ("闇と光の魔導士スプライトシート.png","dark_mage","sorcerer_light"),
  ("クリスタルモンスター4_4スプライトシート.png","crystal_beast","crystal_golem"),
  ("闇夜の魔物スプライトシート.png","night_bat","phantom_dark"),
  ("紫と炎の巨像アニメーションシート.png","stone_golem","boss_fire_giant"),
  ("氷の女王と深淵の眼ボススプライトシート.png","boss_ice_queen","boss_abyss_eye")
]
FRAMES = ("idle_0","idle_1","move_0","move_1","attack_0","attack_1","hit","stun")
BOSSES = {"boss_fire_giant","boss_ice_queen","boss_abyss_eye"}

def build(source_dir, output_dir):
    creatures = {}
    for filename, a, b in SHEETS:
        path = source_dir / filename
        if not path.is_file():
            raise FileNotFoundError(f"Missing input source sheet: {path}")
        sheet = Image.open(path).convert("RGBA")
        sw, sh = sheet.size
        for group_index, ident in enumerate((a, b)):
            boss = ident in BOSSES
            size = 256 if boss else 192
            folder = output_dir / ("bosses" if boss else "enemies") / ident
            folder.mkdir(parents=True, exist_ok=True)
            atlas = Image.new("RGBA",(size*4,size*2))
            frames = {}
            for i, name in enumerate(FRAMES):
                col, row = i%4, group_index*2+i//4
                rect = (round(col*sw/4), round(row*sh/4),
                        round((col+1)*sw/4), round((row+1)*sh/4))
                sprite = sheet.crop(rect)
                alpha = sprite.getchannel("A").point(lambda v: 0 if v < 16 else v)
                sprite.putalpha(alpha)
                sprite = sprite.resize((size,size), Image.Resampling.LANCZOS)
                sprite.save(folder/f"{name}.png",optimize=True)
                atlas.alpha_composite(sprite,(col*size,(i//4)*size))
                bbox = sprite.getchannel("A").getbbox()
                frames[name] = {
                    "file":f"{name}.png",
                    "atlas_rect":[col*size,(i//4)*size,size,size],
                    "alpha_bbox": list(bbox) if bbox else [0,0,0,0]
                }
            atlas.save(folder/"atlas.png",optimize=True)
            meta={
              "id":ident, "tier":"boss" if boss else "enemy",
              "canvas_size":[size,size],"anchor_px":[size//2,round(size*.86)],
              "atlas":"atlas.png",
              "atlas_layout":{"columns":4,"rows":2,"cell_size":[size,size]},
              "frames":frames,
              "animations":{
                "idle":{"frames":["idle_0","idle_1"],"fps":3,"loop":True},
                "move":{"frames":["move_0","move_1"],"fps":6,"loop":True},
                "attack":{"frames":["attack_0","attack_1"],"fps":8,"loop":False},
                "hit":{"frames":["hit"],"fps":1,"loop":False},
                "stun":{"frames":["stun"],"fps":1,"loop":False}
              },
              "source_sheet":filename, "review_required":True
            }
            (folder/"meta.json").write_text(json.dumps(meta,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
            creatures[ident]={
              "path":str(folder.relative_to(output_dir)).replace("\\","/"),
              "tier":meta["tier"],"canvas_size":[size,size]
            }
    (output_dir/"manifest.json").write_text(
      json.dumps({"version":"2.0","status":"candidate_requires_art_review","creatures":creatures},
                 ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print(f"Created {len(creatures)} creatures, {len(creatures)*len(FRAMES)} frames")

if __name__=="__main__":
    p=argparse.ArgumentParser()
    p.add_argument("--source-dir",type=Path,required=True)
    p.add_argument("--output-dir",type=Path,default=Path("assets/sprites/v2"))
    args=p.parse_args()
    build(args.source_dir,args.output_dir)
