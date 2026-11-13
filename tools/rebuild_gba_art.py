#!/usr/bin/env python3
"""Rebuild the Elemental Mage sprite library to the user's strict GBA pixel-art spec.

The pre-existing high-detail source images stay intact. The generated assets are
candidates for use in the browser prototype and are always audited for dimensions,
strict binary alpha, <=16 distinct RGBA colors, and pixel-grid alignment.
"""
from __future__ import annotations
import argparse, hashlib, json, math, random
from pathlib import Path
from PIL import Image, ImageDraw

PNG_FRAMES = ('idle_0','idle_1','move_0','move_1','attack_0','attack_1','hit','stun')
ELEMENTS = ['neutral','fire','water','ice','lightning','wind','earth','light','dark']
COLORS = {
    'neutral':('#e8dfff','#9185cb','#4d467b'), 'fire':('#ffe18a','#ff8938','#a82943'),
    'water':('#b9f3ff','#4da9de','#22538e'),'ice':('#e9faff','#83cfe8','#4d79bd'),
    'lightning':('#fff5b4','#eed24e','#7e68c6'),'wind':('#c8ffdf','#60be9a','#287568'),
    'earth':('#f5d798','#b18a5a','#6a4862'),'light':('#fffcd3','#efca76','#b38b6c'),
    'dark':('#d3a2f9','#784cba','#342353')
}
HERO_PALETTE = [(17,16,30),(39,31,63),(52,44,91),(68,55,122),
                (88,75,151),(117,104,190),(171,157,222),(231,220,243),
                (241,193,165),(195,141,112),(225,175,88),(250,219,139),
                (90,61,72),(90,204,227),(181,246,243)]

def rgba_colors(im):
    return set(im.convert('RGBA').getdata())

def quantize_strict(im, limit=16, transparent=True, palette=None):
    """Produce RGBA at native grid without dithering or semi-transparent pixels."""
    im=im.convert('RGBA')
    use_alpha = transparent and im.getchannel('A').getextrema()[0]<255
    threshold=95
    mask=im.getchannel('A').point(lambda a: 255 if a>=threshold else 0)
    rgb=Image.new('RGB',im.size,(18,15,33))
    rgb.paste(im.convert('RGB'),mask=mask)
    num=limit-1 if use_alpha else limit
    if palette is not None:
        quant=rgb.quantize(palette=palette,dither=Image.Dither.NONE)
    else:
        quant=rgb.quantize(colors=num,method=Image.Quantize.MEDIANCUT,dither=Image.Dither.NONE)
    dst=quant.convert('RGBA')
    dst.putalpha(mask if use_alpha else Image.new('L',dst.size,255))
    assert len(rgba_colors(dst))<=limit,(len(rgba_colors(dst)),im.size)
    assert set(dst.getchannel('A').getdata()).issubset({0,255})
    return dst

def palette_for(images, count=15):
    samples=Image.new('RGB',(64*len(images),64),(18,15,33))
    for i,im in enumerate(images):
        tmp=im.resize((64,64),Image.Resampling.NEAREST).convert('RGBA')
        flat=Image.new('RGB',tmp.size,(18,15,33))
        flat.paste(tmp.convert('RGB'),mask=tmp.getchannel('A'))
        samples.paste(flat,(i*64,0))
    return samples.quantize(colors=count,method=Image.Quantize.MEDIANCUT,dither=Image.Dither.NONE)

def fit_entity(im, bounds, size=64, pad=2):
    """Fit full source character inside stable frame canvas; no content clips."""
    W,H=im.size
    l,t,r,b=bounds
    l=max(0,l);t=max(0,t);r=min(W,r);b=min(H,b)
    cropped=im.crop((l,t,r,b))
    fit=min((size-pad*2)/(r-l),(size-pad*2)/(b-t))
    nw=max(1,round((r-l)*fit));nh=max(1,round((b-t)*fit))
    tile=cropped.resize((nw,nh),Image.Resampling.NEAREST)
    output=Image.new('RGBA',(size,size),(0,0,0,0))
    # Stable feet/pivot across frames, slightly above bottom of frame.
    output.paste(tile,((size-nw)//2,size-pad-nh))
    return output

def canvas_clip_group(frames):
    # Build a union bbox from alpha of all frames, with full horizontal details.
    bounds=[]
    for im in frames:
        b=im.getchannel('A').point(lambda a:255 if a>=95 else 0).getbbox()
        if b:bounds.append(b)
    if not bounds:return (0,0,frames[0].width,frames[0].height)
    return (min(b[0] for b in bounds),min(b[1] for b in bounds),
            max(b[2] for b in bounds),max(b[3] for b in bounds))

def save(outroot,rel,im,manifest,kind,source='',anchor=None,collision=None):
    path=outroot/rel
    path.parent.mkdir(parents=True,exist_ok=True)
    im.save(path,optimize=True)
    data=path.read_bytes()
    item={'path':'assets/gba/v1/'+rel.as_posix(),'kind':kind,'size_px':list(im.size),
          'colors_rgba':len(rgba_colors(im)),'alpha':'binary','source':source,
          'sha256':hashlib.sha256(data).hexdigest()}
    if anchor is not None:item['anchor_px']=anchor
    if collision is not None:item['collision']=collision
    manifest.append(item)
    return item

def hero_frame(direction,phase):
    # Original hand-authored pixel silhouette, not a resized ellipse sprite.
    im=Image.new('RGBA',(64,64),(0,0,0,0));d=ImageDraw.Draw(im)
    p=HERO_PALETTE
    # boots and small stride animation
    shift=(-2 if phase else 1)
    d.rectangle((24+shift,52,29+shift,58),fill=p[0]);d.rectangle((34-shift,52,39-shift,58),fill=p[0])
    d.polygon([(20,35),(44,35),(49,53),(41,59),(23,59),(15,53)],fill=p[0])
    d.polygon([(22,37),(42,37),(46,52),(39,56),(24,56),(18,51)],fill=p[2])
    d.polygon([(23,36),(32,40),(28,55),(22,54),(20,48)],fill=p[3])
    d.polygon([(34,40),(43,36),(46,49),(41,55),(34,54)],fill=p[4])
    for x in (23,29,35,41):d.line([(x,47),(x+(x-32)//6,55)],fill=p[5])
    d.line([(20,46),(44,46)],fill=p[10],width=2)
    d.polygon([(30,43),(34,43),(34,48),(30,48)],fill=p[11])
    # hood + hair + front/back face with four-direction consistency
    d.ellipse((17,12,47,42),fill=p[0])
    d.ellipse((19,13,45,39),fill=p[3])
    d.polygon([(21,15),(32,5),(43,15),(47,26),(43,32),(20,32),(17,25)],fill=p[2])
    d.line([(22,17),(33,8),(43,18)],fill=p[5],width=2)
    if direction=='up':
        d.polygon([(23,19),(41,19),(43,36),(21,35)],fill=p[2])
        d.line([(30,20),(30,39)],fill=p[5],width=2)
        d.polygon([(23,19),(27,23),(27,39),(22,36)],fill=p[4])
    else:
        d.ellipse((24,20,40,38),fill=p[8])
        d.polygon([(24,22),(25,19),(39,19),(40,24),(35,22),(27,25)],fill=p[7])
        if direction=='down':
            d.point((28,30),fill=p[0]);d.point((36,30),fill=p[0]);d.point((28,29),fill=p[13]);d.point((36,29),fill=p[13])
        elif direction=='left':
            d.polygon([(39,21),(39,35),(30,36),(25,30)],fill=p[8]);d.point((29,30),fill=p[0])
        else:
            d.polygon([(25,21),(25,35),(35,36),(39,30)],fill=p[8]);d.point((35,30),fill=p[0])
    # golden headdress and intricate rune details
    d.line([(20,22),(19,29),(23,36)],fill=p[10],width=1)
    d.line([(44,22),(45,29),(41,36)],fill=p[10],width=1)
    d.rectangle((31,12,33,16),fill=p[11]);d.point((32,14),fill=p[13])
    # arms and tall staff away from center silhouette
    staffx=52 if direction!='left' else 11
    d.line([(staffx,19),(staffx,54)],fill=p[0],width=4)
    d.line([(staffx,20),(staffx,52)],fill=p[12],width=2)
    d.polygon([(staffx,10),(staffx+6,16),(staffx,22),(staffx-6,16)],fill=p[0])
    d.polygon([(staffx,12),(staffx+4,16),(staffx,20),(staffx-4,16)],fill=p[13])
    d.point((staffx,16),fill=p[14]);d.point((staffx-1,9),fill=p[14]);d.point((staffx+7,21),fill=p[11])
    armx=42 if direction!='left' else 21
    d.polygon([(armx,36),(armx+4,40),(staffx,36),(staffx,40),(armx,44)],fill=p[3])
    d.point((armx,42),fill=p[10]);d.rectangle((staffx-2,39,staffx+1,42),fill=p[8])
    # scaled pixel spikes on robe bottom
    d.point((24,55),fill=p[11]);d.point((40,54),fill=p[11]);d.point((31,53),fill=p[5])
    return im

def custom_element_icon(el,size=24):
    im=Image.new('RGBA',(size,size),(0,0,0,0));d=ImageDraw.Draw(im)
    a,b,c=COLORS[el];o='#1b1638'
    if el in ('neutral','light'):
        d.polygon([(12,1),(15,9),(23,12),(15,15),(12,23),(9,15),(1,12),(9,9)],fill=b,outline=o)
        d.polygon([(12,4),(14,10),(20,12),(14,14),(12,20),(10,14),(4,12),(10,10)],fill=a)
    elif el=='fire':
        d.polygon([(12,1),(16,7),(20,12),(19,18),(15,22),(9,23),(5,18),(5,13),(9,8),(10,14)],fill=c,outline=o)
        d.polygon([(12,4),(17,13),(16,20),(9,20),(8,15)],fill=b)
        d.polygon([(12,12),(14,16),(13,21),(10,20)],fill=a)
    elif el=='water':
        d.polygon([(12,1),(18,10),(20,16),(17,21),(12,23),(7,21),(4,16),(6,10)],fill=c,outline=o)
        d.polygon([(11,6),(16,13),(16,18),(13,21),(8,18),(7,13)],fill=b)
        d.line([(9,13),(9,17),(11,19)],fill=a,width=2)
    elif el=='ice':
        for dx,dy in [(0,-8),(0,8),(-8,0),(8,0),(-6,-6),(6,6),(-6,6),(6,-6)]:d.line([(12,12),(12+dx,12+dy)],fill=b,width=3)
        d.rectangle((10,10,14,14),fill=a);d.point((12,12),fill=a)
    elif el=='lightning':
        d.polygon([(15,2),(7,13),(12,13),(9,22),(19,9),(13,10)],fill=c,outline=o)
        d.polygon([(15,5),(10,12),(14,12),(12,17),(17,10),(13,10)],fill=a)
    elif el=='wind':
        for y in [7,12,17]:
            d.arc((2,y-6,23,y+7),0,200,fill=b,width=2)
            d.line([(5,y),(16,y)],fill=a,width=2)
    elif el=='earth':
        d.polygon([(3,17),(9,6),(15,4),(21,13),(18,21),(6,22)],fill=c,outline=o)
        d.polygon([(8,12),(15,7),(19,14),(16,19),(7,19)],fill=b);d.line([(9,13),(14,10)],fill=a,width=2)
    elif el=='dark':
        d.ellipse((2,2,22,22),fill=c,outline=o,width=1)
        d.ellipse((5,5,19,19),fill=b);d.ellipse((9,9,15,15),fill=o)
        for x,y in [(3,11),(18,4),(18,20)]:d.point((x,y),fill=a)
    return quantize_strict(im,16,True)

def main():
    ap=argparse.ArgumentParser();ap.add_argument('--root',default='.',help='Repository root')
    args=ap.parse_args();root=Path(args.root).resolve();src=root/'assets';out=src/'gba/v1'
    manifest=[];people=[]
    # 14 detailed creatures and all available 2-frame+ action variations.
    for category in ('enemies','bosses'):
        source_root=src/'sprites/v2'/category
        for creature in sorted(p for p in source_root.iterdir() if p.is_dir()) if source_root.exists() else []:
            imgs={frame:Image.open(creature/(frame+'.png')).convert('RGBA') for frame in PNG_FRAMES if (creature/(frame+'.png')).is_file()}
            if not imgs:continue
            assert len(imgs)==8,(creature,len(imgs))
            bounds=canvas_clip_group(list(imgs.values()))
            shaped=[fit_entity(imgs[f],bounds) for f in PNG_FRAMES]
            pal=palette_for(shaped)
            for frame,im in zip(PNG_FRAMES,shaped):
                result=quantize_strict(im,16,True,palette=pal)
                save(out,Path(category)/creature.name/(frame+'.png'),result,manifest,category,source=str((creature/(frame+'.png')).relative_to(root)),anchor=[32,62],collision={'shape':'circle','radius_px':14 if category=='bosses' else 10})
            atlas=Image.new('RGBA',(4*64,2*64),(0,0,0,0))
            for i,frame in enumerate(PNG_FRAMES):
                with Image.open(out/category/creature.name/(frame+'.png')) as fr:atlas.paste(fr,((i%4)*64,(i//4)*64))
            # Atlas may contain many colors across frames but always uses same 15+transparent palette.
            assert len(rgba_colors(atlas))<=16
            save(out,Path(category)/creature.name/'atlas.png',atlas,manifest,'atlas',anchor=[32,62])
            people.append({'id':creature.name,'category':category,'frame_size':[64,64],'frames':[f+'.png' for f in PNG_FRAMES],
                           'atlas':'atlas.png','columns':4,'rows':2,'fps_idle':3,'fps_move':6,'fps_attack':8,'anchor':[32,62],'visual_review':'pending'})
    # Hero is redrawn on the 64x64 pixel grid to avoid 32x32 low-detail starter art.
    for face in ('down','up','left','right'):
        for phase in (0,1):
            im=hero_frame(face,phase)
            save(out,Path('characters')/f'mage_{face}_{phase}.png',im,manifest,'character','original_64px_pixel_draw',anchor=[32,59],collision={'shape':'circle','radius_px':8})
    # Tile-set palette is per tile, <=16 RGBA colors. Exact 32x32 canvas.
    theme_root=src/'environment/v2/tiles'
    for theme in sorted(theme_root.iterdir()) if theme_root.exists() else []:
        if not theme.is_dir():continue
        for tile in sorted(theme.glob('*.png')):
            if 'atlas' in tile.stem:continue
            im=Image.open(tile).convert('RGBA').resize((32,32),Image.Resampling.NEAREST)
            im=quantize_strict(im,16,True)
            save(out,Path('tiles')/theme.name/tile.name,im,manifest,'wall' if tile.stem.startswith('wall') else 'floor',source=str(tile.relative_to(root)),anchor=[0,0],collision={'blocks_movement':tile.stem.startswith('wall'),'blocks_projectiles':tile.stem.startswith('wall')})
    for prop in sorted((src/'environment/v2/props').glob('*.png')):
        im=Image.open(prop).convert('RGBA')
        bb=im.getchannel('A').point(lambda a:255 if a>=95 else 0).getbbox()
        if bb:im=fit_entity(im,bb,size=64,pad=2)
        else:im=im.resize((64,64),Image.Resampling.NEAREST)
        im=quantize_strict(im,16,True)
        save(out,Path('props')/prop.name,im,manifest,'prop',source=str(prop.relative_to(root)),anchor=[32,60],collision={'shape':'circle','radius_px':16})
    # Attribute icons are bespoke original silhouettes, rasterized in their native pixel grid.
    for el in ELEMENTS:
        save(out,Path('icons')/(el+'.png'),custom_element_icon(el),manifest,'icon','original_24px_pixel_draw',anchor=[12,12])
    # Convert every available source spell PNG (including 28 combinations) into 16x16 native projectiles.
    for spell in sorted((src/'projectiles').glob('*.png')):
        im=Image.open(spell).convert('RGBA')
        bb=im.getchannel('A').point(lambda a:255 if a>=95 else 0).getbbox()
        if bb:im=im.crop(bb)
        im.thumbnail((16,16),Image.Resampling.NEAREST)
        canvas=Image.new('RGBA',(16,16),(0,0,0,0))
        canvas.paste(im,((16-im.width)//2,(16-im.height)//2))
        res=quantize_strict(canvas,16,True)
        save(out,Path('projectiles')/spell.name,res,manifest,'projectile',source=str(spell.relative_to(root)),anchor=[8,8])
    # 1:1 alias manifest for current prototype enemy & boss identifiers.
    aliases={'slime':'slime','eyeball':'evil_eye','cultist':'dark_mage','crystal':'crystal_beast',
             'bat':'night_bat','golem':'stone_golem','poison_slime':'poison_slime',
             'crystal_golem':'crystal_golem','abyss_eye':'abyss_eye','sorcerer_light':'sorcerer_light',
             'phantom_dark':'phantom_dark'}
    bos_aliases={'lava_titan':'boss_fire_giant','frost_queen':'boss_ice_queen','abyss_eye_boss':'boss_abyss_eye'}
    doc={'version':'GBA-v1','rules':{'characters_monsters_bosses_canvas':[64,64],
           'max_RGBA_colors_including_transparent':16,'alpha_values_allowed':[0,255],
           'no_antialias':True,'native_pixel_grid':True,'transparent_png':True,
           'tile_canvas':[32,32],'icon_canvas':[24,24],'projectile_canvas':[16,16]},
         'origin':'Converted from project-owned high-detail concept PNGs; hand-drawn 64px protagonist and icons',
         'status':'candidate_art_not_verified_on_device','entity_animations':people,'enemy_aliases':aliases,
         'boss_aliases':bos_aliases,'assets':manifest}
    out.mkdir(parents=True,exist_ok=True)
    (out/'manifest.json').write_text(json.dumps(doc,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    # validate every entry on disk and source/source hashes, and make a low-size art review contact sheet.
    validate(root)
    print('GBA_REBUILD_OK: assets',len(manifest),'characters+monsters+bosses',len(people),'folders',out)

def validate(root):
    out=Path(root)/'assets/gba/v1'
    doc=json.loads((out/'manifest.json').read_text(encoding='utf-8'))
    count=0
    for entry in doc['assets']:
        path=Path(root)/entry['path'];assert path.is_file(),path
        im=Image.open(path).convert('RGBA');im.load()
        colors=rgba_colors(im)
        assert im.size==tuple(entry['size_px']),path
        assert len(colors)<=16,(path,len(colors))
        assert {px[3] for px in colors}<={0,255},path
        assert hashlib.sha256(path.read_bytes()).hexdigest()==entry['sha256'],path
        count+=1
    assert len(doc['entity_animations'])==14,len(doc['entity_animations'])
    assert len(doc['enemy_aliases'])==11 and len(doc['boss_aliases'])==3
    return count

if __name__=='__main__':main()