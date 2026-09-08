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
ids=[54,55,65,66,*range(354,390),589,*range(664,682),875,1028,1029,1030]
entries={str(i):bank[i] for i in ids}
# 0x524cf0 selects spell artwork from POINT, warning marks from HFX.
points=a.sprites(read('data/point0-0.dat'),palette)
entries.update({f'point{i}':points[i] for i in [*range(38,58),*range(80,84)]})
for font in [0,2]:
    for i,glyph in enumerate(a.sprites(read(f'data/font{font}-0.dat'),palette)):
        entries[f'font{font}-{i}']=glyph
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
for name,start in [('button',821),('button-selected',830),('tab',740),('tab-active',758)]:
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
pixels=bytearray(100*99*4)
for i in range(4):
    w,h,data=bank[690+i];assert (w,h)==(50,49 if i<2 else 50)
    for yy in range(h):
        at=((i//2*49+yy)*100+i%2*50)*4;pixels[at:at+200]=data[yy*200:(yy+1)*200]
a.png(output/'hud-map-frame.png',100,99,pixels)
for name,i in [('panel',706),('commands',712)]:a.png(output/f'hud-{name}.png',*bank[i])
meta=dict(executableSha256=identity['sha256'],sha256=hashes,width=width,height=height,rects=rects,alphaColors=alpha_colors,spriteColors=[alpha[i*4096+0x2f82] for i in range(13)])
(ROOT/'app/original-hud.json').write_text(json.dumps(meta,separators=(',',':'))+'\n')
print(f'Imported {len(entries)} native HUD sprites/glyphs, four borders and minimap frame')
