from pathlib import Path
import struct, hashlib, json, ast, zlib
root=Path('/workspace/scratch/69fd8163d94e/populous-research-inputs/game/app')
repo=Path('/tmp/populous-raid447-fallback-0229')
source=ast.parse((repo/'scripts/import-original.py').read_text())
ns={'struct':struct,'zlib':zlib};exec(compile(ast.Module(body=[n for n in source.body if isinstance(n,ast.FunctionDef) and n.name in ['sprites','png']],type_ignores=[]),'<existing data decoder>','exec'),ns)
spr=(root/'data/plspanel.spr').read_bytes();pal=(root/'data/plspl0-c.dat').read_bytes();frames=ns['sprites'](spr,pal)
exe=(root/'D3DPopTB.exe').read_bytes()
def data(a,n):return exe[a-0x598000+0x195e00:a-0x598000+0x195e00+n]
rows=[struct.unpack('<7i',data(0x59dff8+i*28,28)) for i in range(25)]
meta={'palette_sha256':hashlib.sha256(pal).hexdigest(),'frames':[{'index':i,'width':w,'height':h,'sha256_rgba':hashlib.sha256(p).hexdigest()} for i,(w,h,p) in enumerate(frames)],'table_va':'0059dff8','raw_rows':rows,'panel_origin':[1,419],'opening_glyphs':[]}
w,h,p=frames[0];out=bytearray(p)
# Static initial profile: only mission1 available, no completion. This is an explicitly supplied state, not a game execution.
t,x,y,*_=rows[0];x-=1+(t==2);y-=1+(t==2);idx={0:5,1:3,2:1}[t];fw,fh,fp=frames[idx]
for yy in range(fh):
 for xx in range(fw):
  q=(yy*fw+xx)*4
  if fp[q+3]:out[((y+yy)*w+x+xx)*4:((y+yy)*w+x+xx)*4+4]=fp[q:q+4]
meta['opening_glyphs'].append({'mission':1,'frame':idx,'global_xy':[x+1,y+419],'hit':{'left_exclusive':x+1,'right_inclusive':x+1+fw,'top_exclusive':y+419,'bottom_inclusive':y+419+fh}})
ns['png'](Path('/tmp/selector-static/panel-initial-c.png'),w,h,out)
ns['png'](Path('/tmp/selector-static/panel-frame0-c.png'),w,h,p)
Path('/tmp/selector-static/panel-data.json').write_text(json.dumps(meta,indent=2)+'\n')
print(json.dumps(meta,indent=2))
