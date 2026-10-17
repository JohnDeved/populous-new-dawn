import importlib.util,hashlib,json
from pathlib import Path
root=Path('/tmp/populous-raid447-fallback-0229'); game=Path('/workspace/scratch/69fd8163d94e/populous-research-inputs/game/app')
s=importlib.util.spec_from_file_location('imp',root/'scripts/import-original.py');m=importlib.util.module_from_spec(s);s.loader.exec_module(m)
raw=(game/'data/fenew/igmslidr.spr').read_bytes(); pal=b''.join(bytes([i,0,0,255]) for i in range(256)); bank=m.sprites(raw,pal)
for n,(w,h,pix) in enumerate(bank):
 ids=sorted({pix[i] for i in range(0,len(pix),4) if pix[i+3]});print(n,w,h,'indices',ids)
for n in ['D3DPopTB.exe','data/fenew/igmslidr.spr','data/pal0-c.dat','levels/levl2001.hdr']:
 p=game/n; print(n,hashlib.sha256(p.read_bytes()).hexdigest())
print('Mission1 bank', (game/'levels/levl2001.hdr').read_bytes()[96])
used={pix[i] for w,h,pix in bank for i in range(0,len(pix),4) if pix[i+3]}
p0=(game/'data/pal0-c.dat').read_bytes()
for suffix in ['0','c','s','p','d','g']:
 p=game/f'data/pal0-{suffix}.dat'
 if p.exists():
  data=p.read_bytes(); print('palette comparison c vs',suffix,'different slider RGB indices',[i for i in sorted(used) if data[i*4:i*4+3]!=p0[i*4:i*4+3]])
