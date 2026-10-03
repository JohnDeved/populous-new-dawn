"""Compare appended opening dust/conversion HFX frames with verified source bytes."""
import argparse,hashlib,importlib.util,json
from pathlib import Path
from PIL import Image
ROOT=Path(__file__).resolve().parents[1]
p=argparse.ArgumentParser();p.add_argument('--data-root',type=Path,required=True);p.add_argument('--baseline-dir',type=Path);p.add_argument('--output',type=Path);a=p.parse_args()
spec=importlib.util.spec_from_file_location('original',ROOT/'scripts/import-original.py');original=importlib.util.module_from_spec(spec);spec.loader.exec_module(original)
metadata=json.loads((ROOT/'app/original-effects.json').read_text());provenance=json.loads((ROOT/'public/original/provenance.json').read_text())
raw={n:(a.data_root/'data'/n).read_bytes() for n in ['pal0-c.dat','al0-c.dat','hfx0-0.dat']}
for n,b in raw.items():assert hashlib.sha256(b).hexdigest()==provenance['sha256']['data/'+n]
palette,alpha=raw['pal0-c.dat'],raw['al0-c.dat'];fx_palette=b''.join(palette[alpha[(v|15)*256]*4:alpha[(v|15)*256]*4+3]+bytes([(v&15)*17]) for v in range(256));bank=original.sprites(raw['hfx0-0.dat'],fx_palette,alpha=True)
atlas=Image.open(ROOT/'public/original/effects.png').convert('RGBA');assert atlas.size==(metadata['width'],metadata['height'])
for name,start,count in [('startStoneDust',1160,20),('startConversion',1240,8)]:
 frames=metadata['animations'][name];assert len(frames)==count
 for i,f in enumerate(frames):
  assert f['source']==start+i
  w,h,rgba=bank[start+i];assert (f['w'],f['h'])==(w,h)
  x=f['index']%8*256;y=f['index']//8*256
  assert atlas.crop((x,y,x+w,y+h)).tobytes()==rgba,(name,i)
assert metadata['startStoneDustColor']==list(palette[alpha[4*4096+0x2f82]*4:alpha[4*4096+0x2f82]*4+3])
report={'status':'PASS_STATIC_LEVEL_START_EFFECTS','frames':28,'dustPalette':metadata['startStoneDustColor'],'atlasSha256':hashlib.sha256((ROOT/'public/original/effects.png').read_bytes()).hexdigest(),'limits':'Original-byte atlas and metadata check; not full original raster/browser parity.'}
if a.baseline_dir:
 old=Image.open(a.baseline_dir/'effects.png').convert('RGBA');before=json.loads((a.baseline_dir/'original-effects.json').read_text())
 assert atlas.crop((0,0,*old.size)).tobytes()==old.tobytes()
 for name,frames in before['animations'].items():assert metadata['animations'][name]==frames
 report['preservedPixels']=list(old.size);report['preservedSequences']=len(before['animations'])
if a.output:
 if a.output.exists():raise ValueError('Choose a new report path')
 a.output.write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps(report,indent=2))
