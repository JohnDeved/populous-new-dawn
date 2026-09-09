"""Import original HUD sprites and bitmap glyphs. Reuses the validated PSFB decoder.
Usage: python3 scripts/import-hud.py /path/to/extracted/game
"""
import hashlib, importlib.util, json, sys
from pathlib import Path
from decomp import inspect, ROOT
source=Path(sys.argv[1]);identity=inspect(source/'d3dpoptb.exe');hashes={}
def read(name):
    b=(source/name).read_bytes();hashes[name]=hashlib.sha256(b).hexdigest();return b
spec=importlib.util.spec_from_file_location('assets',ROOT/'scripts/import-original.py')
a=importlib.util.module_from_spec(spec);spec.loader.exec_module(a)
palette=read('data/pal0-c.dat');bank=a.sprites(read('data/hfx0-0.dat'),palette)
alpha=read('data/al0-c.dat');assert len(alpha)==65536
alpha_colors=[alpha[((i<<4)|15)*256] for i in range(16)]
output=ROOT/'public/original'
# HFX identities are checked against the shipped spell records and artwork.
ids=[54,55,65,66,67,68,*range(354,408),589,*range(664,682),875,1028,1029,1030]
entries={str(i):bank[i] for i in ids}
# 0x524cf0 selects spell artwork from POINT, warning marks from HFX.
points=a.sprites(read('data/point0-0.dat'),palette)
entries.update({f'point{i}':points[i] for i in [*range(38,58),*range(80,84)]})
for font in [0,2]:
    for i,glyph in enumerate(a.sprites(read(f'data/font{font}-0.dat'),palette)):
        entries[f'font{font}-{i}']=glyph
# 0x44a2f0/0x42ac70 use F00T, whose brace positions contain mouse artwork.
for font in [3,4]:
    for i,glyph in enumerate(a.sprites(read(f'data/f00t{font}-0.dat'),palette)):
        entries[f'f00t{font}-{i}']=glyph
# 0x41d730: original world-view building, occupant and discovery icons.
entries.update({str(i):bank[i] for i in [*range(0x74,0xaa),0x434,0x43b]})
width=1024;x=y=row=0;rects={}
for key,(w,h,_) in entries.items():
    assert w<=width
    if x+w>width:y+=row+1;x=row=0
    rects[key]=dict(x=x,y=y,w=w,h=h);x+=w+1;row=max(row,h)
height=y+row;pixels=bytearray(width*height*4)
for key,(w,h,data) in entries.items():
    r=rects[key]
    for yy in range(h):
        at=((r['y']+yy)*width+r['x'])*4;pixels[at:at+w*4]=data[yy*w*4:(yy+1)*w*4]
a.png(output/'hud.png',width,height,pixels)
# Nine-patches keep native corners and tile edges; no CSS-generated bevels.
for name,start in [('button',821),('button-selected',830),('button-hover',839),
                   ('button-gift',510),('button-gift-selected',519),('button-gift-hover',528),
                   ('tab',740),('tab-active',758)]:
    tiles=[bank[start+k] for k in [0,4,1,6,8,7,2,5,3]]
    columns=[max(tiles[j][0] for j in range(c,9,3)) for c in range(3)]
    rows=[max(t[1] for t in tiles[r*3:r*3+3]) for r in range(3)]
    wout,hout=sum(columns),sum(rows);pixels=bytearray(wout*hout*4)
    for j,(w,h,data) in enumerate(tiles):
        left,top=sum(columns[:j%3]),sum(rows[:j//3])
        for yy in range(rows[j//3]):
            for xx in range(columns[j%3]):
                at=((top+yy)*wout+left+xx)*4;src=((yy%h)*w+xx%w)*4;pixels[at:at+4]=data[src:src+4]
    a.png(output/f'hud-{name}.png',wout,hout,pixels)
    print(name,columns,rows)
# 0x4a1f50: native charge/health frames, including overlapping 4px corners.
# CSS border-image would shrink corners to fit the short charge rectangle.
for name,frame_width,frame_height in [('charge',26,5),('health',10,22)]:
    pixels=bytearray(frame_width*frame_height*4)
    draws=[(1018,4,0,frame_width-8,4),(1019,4,frame_height-4,frame_width-8,4)]
    if frame_height>8:draws.extend([(1020,0,4,4,frame_height-8),(1021,frame_width-4,4,4,frame_height-8)])
    draws.extend([(1014,0,0,4,4),(1015,frame_width-4,0,4,4),
                  (1016,0,frame_height-4,4,4),(1017,frame_width-4,frame_height-4,4,4)])
    for sprite,left,top,draw_width,draw_height in draws:
        w,h,data=bank[sprite]
        for y in range(draw_height):
            for x in range(draw_width):
                src=((y%h)*w+x%w)*4;at=((top+y)*frame_width+left+x)*4
                if data[src+3]:pixels[at:at+4]=data[src:src+4]
    a.png(output/f'hud-{name}.png',frame_width,frame_height,pixels)
# 0x49fe70/0x4a1f50: portrait borders at the original 30×35 logical size.
for name,start in [('portrait',713),('portrait-hover',731),('portrait-selected',722)]:
    pixels=bytearray(30*35*4)
    draws=[(8,4,4,22,27),(4,8,0,14,4),(5,8,31,14,4),
           (6,0,8,4,19),(7,26,8,4,19),(0,0,0,8,8),
           (1,22,0,8,8),(2,0,27,8,8),(3,22,27,8,8)]
    for offset,left,top,draw_width,draw_height in draws:
        w,h,data=bank[start+offset]
        for y in range(draw_height):
            for x in range(draw_width):
                src=((y%h)*w+x%w)*4;at=((top+y)*30+left+x)*4
                if data[src+3]:pixels[at:at+4]=data[src:src+4]
    a.png(output/f'hud-{name}.png',30,35,pixels)
pixels=bytearray(100*99*4)
for i in range(4):
    w,h,data=bank[690+i];assert (w,h)==(50,49 if i<2 else 50)
    for yy in range(h):
        at=((i//2*49+yy)*100+i%2*50)*4;pixels[at:at+200]=data[yy*200:(yy+1)*200]
a.png(output/'hud-map-frame.png',100,99,pixels)
for name,i in [('panel',706),('commands',712)]:a.png(output/f'hud-{name}.png',*bank[i])
meta=dict(executableSha256=identity['sha256'],sha256=hashes,width=width,height=height,rects=rects,alphaColors=alpha_colors,spriteColors=[alpha[i*4096+0x2f82] for i in range(13)])
meta['colors']=['#'+palette[i*4:i*4+3].hex() for i in range(256)]
(ROOT/'app/original-hud.json').write_text(json.dumps(meta,separators=(',',':'))+'\n')
print(f'Imported {len(entries)} native HUD sprites/glyphs, eight borders, charge/health/portrait frames and minimap frame')
