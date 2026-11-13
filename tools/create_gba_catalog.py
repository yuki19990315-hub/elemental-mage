#!/usr/bin/env python3
"""Create documentation-only preview boards for generated 16-color game sprites.

Preview boards intentionally combine many sprite palettes; only the individual
files referenced by assets/gba/v1/manifest.json are held to <=16 colors.
"""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT=Path(__file__).resolve().parents[1]
BASE=ROOT/'assets/gba/v1'
OUT=BASE/'previews'


def compose_image(path, dest, size, checker):
    im=Image.open(path).convert('RGBA')
    im=im.resize((size,size),Image.Resampling.NEAREST)
    patch=Image.new('RGB',(size,size),checker)
    patch.paste(im,mask=im.getchannel('A'))
    dest.paste(patch)
    return patch


def title(draw,text,x,y):
    draw.text((x,y),text,fill=(236,224,255),stroke_width=0)


def make_creatures():
    all_enemies=sorted((BASE/'enemies').glob('*/idle_0.png'))
    bosses=sorted((BASE/'bosses').glob('*/idle_0.png'))
    hero=BASE/'characters/mage_down_0.png'
    assets=all_enemies+bosses+[hero]
    assert len(all_enemies)==11 and len(bosses)==3 and hero.is_file()
    cell_w=205;cell_h=232
    out=Image.new('RGB',(cell_w*5,50+cell_h*3),(15,15,30));d=ImageDraw.Draw(out)
    title(d,'ELEMENTAL MAGE - GBA 64x64 / 16 colors (including transparency)',16,16)
    for i,p in enumerate(assets):
        col=i%5;row=i//5
        x=col*cell_w+16;y=50+row*cell_h
        d.rounded_rectangle((x-5,y-5,x+188,y+190),radius=4,fill=(38,32,63),outline=(92,80,143),width=2)
        patch=Image.new('RGB',(176,176),(44,37,72))
        im=Image.open(p).convert('RGBA').resize((176,176),Image.Resampling.NEAREST)
        patch.paste(im,mask=im.getchannel('A'))
        out.paste(patch,(x,y))
        label=p.parent.name if p.name=='idle_0.png' else 'mage'
        title(d,label,x,y+180)
    OUT.mkdir(parents=True,exist_ok=True)
    out.save(OUT/'creature_catalog.png',optimize=True)


def make_environment():
    tiles=sorted((BASE/'tiles').glob('*/floor_0.png'))
    props=sorted((BASE/'props').glob('*.png'))
    icons=sorted((BASE/'icons').glob('*.png'))
    projectiles=sorted((BASE/'projectiles').glob('*.png'))[:10]
    all_files=tiles+props+icons+projectiles
    assert len(tiles)==5 and len(props)==12 and len(icons)==9
    cw=145;ch=169;columns=6;rows=(len(all_files)+columns-1)//columns
    out=Image.new('RGB',(columns*cw,50+ch*rows),(14,15,29));d=ImageDraw.Draw(out)
    title(d,'ELEMENTAL MAGE - GBA tiles / props / icons / projectiles',18,16)
    for i,p in enumerate(all_files):
        x=(i%columns)*cw+13;y=50+(i//columns)*ch
        d.rounded_rectangle((x-6,y-5,x+132,y+151),radius=4,fill=(35,31,58),outline=(84,76,125),width=1)
        patch=Image.new('RGB',(120,120),(44,37,72))
        im=Image.open(p).convert('RGBA').resize((120,120),Image.Resampling.NEAREST)
        patch.paste(im,mask=im.getchannel('A'))
        out.paste(patch,(x,y))
        name=p.stem if p.parent.name not in ('tiles','props') else p.parent.name
        title(d,name[:20],x,y+124)
    OUT.mkdir(parents=True,exist_ok=True)
    out.save(OUT/'environment_catalog.png',optimize=True)

if __name__=='__main__':
    make_creatures();make_environment()
    print('PASS: rendered documentation previews')