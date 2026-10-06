"""Read-only original-piece/accepted-atlas measurement; never writes an image or asset."""
import ast
import hashlib
import json
from pathlib import Path
import struct
import subprocess
from types import SimpleNamespace
import zlib

ROOT=Path.cwd()
BASE='169b5f38e8cc9f7aacbae222ba804ac519ec1f27'
GAME=ROOT.parent/'prerequisites/game'
sha=lambda data:hashlib.sha256(data).hexdigest()
def blob(path):return subprocess.check_output(['git','show',BASE+':'+path],cwd=ROOT)
source=blob('scripts/import-original.py')
parsed=ast.parse(source)
functions=[f for f in parsed.body if isinstance(f,ast.FunctionDef) and f.name in ['sprites','read_owned_rgba_png']]
assert len(functions)==2
ns={'struct':struct,'zlib':zlib}
exec(compile(ast.Module(body=functions,type_ignores=[]),'accepted-importer-decoders','exec'),ns)
units_bytes=blob('app/original-units.json');units=json.loads(units_bytes)
provenance_bytes=blob('public/original/provenance.json');provenance=json.loads(provenance_bytes)
report={'status':'passed','scope':__doc__,'acceptedHead':BASE,
    'sourceSha256':{'scripts/import-original.py':sha(source),'app/original-units.json':sha(units_bytes),
                    'public/original/provenance.json':sha(provenance_bytes)},'inputs':{},'missingPieces':[]}
def original(path):
 data=(GAME/path).read_bytes();digest=sha(data)
 expected='3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f' if path=='d3dpoptb.exe' else provenance['sha256'][path]
 assert digest==expected,path
 report['inputs'][path]={'sha256':digest,'bytes':len(data)}
 return data
original('d3dpoptb.exe')
starts=list(struct.iter_unpack('<HH',original('data/vstart-0.ani')))
frames=list(struct.iter_unpack('<HBBBBH',original('data/vfra-0.ani')))
elements=list(struct.iter_unpack('<HhhHH',original('data/vele-0.ani')))
bank=ns['sprites'](original('data/hspr0-0.dat'),original('data/pal0-c.dat'))
required_frames=set();required_pieces=set()
for source_id in range(176,192):
 first,_mirror=starts[source_id];f=first;seen=set()
 while f and f not in seen:
  seen.add(f);required_frames.add(f);e=frames[f][0];used=set()
  while e:
   assert e not in used;used.add(e)
   reference,x,y,flags,e=elements[e];assert reference>0 and reference%6==0
   required_pieces.add(reference//6-1)
  f=frames[f][-1]
 assert f in [0,first]
missing=sorted(required_pieces-{p['source'] for p in units['pieces']})
prior=json.loads((ROOT/'decomp/research/preacher-sermon-gestures/result.json').read_text())
assert missing==prior['combinedGestureGap']['acceptedFiring']['missingPieces'] and len(missing)==48
for piece_id in missing:
 w,h,rgba=bank[piece_id]
 coords=[(i%w,i//w) for i in range(w*h) if rgba[i*4+3]]
 bounds=[min(x for x,y in coords),min(y for x,y in coords),max(x for x,y in coords)+1,max(y for x,y in coords)+1] if coords else None
 report['missingPieces'].append({'source':piece_id,'width':w,'height':h,'nontransparentPixels':len(coords),
    'alphaBoundsExclusive':bounds,'rgbaSha256':sha(rgba),'fitsUncropped32Slot':w<=32 and h<=32,
    'fitsUncropped64Cell':w<=64 and h<=64})
atlas_bytes=blob('public/original/unit-layers.png')
width,height,pixels=ns['read_owned_rgba_png'](SimpleNamespace(read_bytes=lambda:atlas_bytes))
assert (width,height)==(units['width'],units['height'])==(2048,8128)
report['sourceSha256']['public/original/unit-layers.png']=sha(atlas_bytes)
# Existing full piece rectangles and decoded RGBA bytes remain the sole ownership boundary.
rectangles=[]
for index,piece in enumerate(units['pieces']):
 w,h,rgba=bank[piece['source']];assert (w,h)==(piece['w'],piece['h'])
 x=piece.get('atlasX',(index%units['columns'])*units['cell'])
 y=piece.get('atlasY',(index//units['columns'])*units['cell'])
 assert x>=0 and y>=0 and x+w<=width and y+h<=height
 for row in range(h):
  at=((y+row)*width+x)*4
  assert pixels[at:at+w*4]==rgba[row*w*4:(row+1)*w*4],(index,piece['source'])
 rectangles.append((x,y,x+w,y+h))
assert all('atlasX' not in p and 'atlasY' not in p for p in units['pieces'][:4042])
assert len(units['pieces'])==4122
for offset,piece in enumerate(units['pieces'][4042:]):
 container=4042+offset//4
 x=(container%32)*64+(offset%2)*32
 y=(container//32)*64+((offset//2)%2)*32
 assert (piece['atlasX'],piece['atlasY'])==(x,y)
 assert piece['w']<=32 and piece['h']<=32
empty_tail=[]
for index in range(4062,4064):
 x=(index%32)*64;y=(index//32)*64
 assert all(not (x<right and x+64>left and y<bottom and y+64>top) for left,top,right,bottom in rectangles)
 assert all(not any(pixels[((y+row)*width+x)*4:((y+row)*width+x+64)*4]) for row in range(64))
 empty_tail.append({'cell':index,'x':x,'y':y,'width':64,'height':64})
small=sum(p['fitsUncropped32Slot'] for p in report['missingPieces'])
report['atlas']={'width':width,'height':height,'pieceCount':len(units['pieces']),
    'frameCount':len(units['frames']),'verifiedExistingPieceRectangles':len(rectangles),
    'existingRgbaRectanglesMatchOriginal':True,'reservedOldFullCells':4042,
    'acceptedFiring32Subslots':80,'acceptedFiringTailCells':20,
    'verifiedUnusedTailCells':empty_tail,'tail32SubslotCapacity':8,
    'suppliedTextureLimit':8192,'verticalMarginPixels':8192-height,
    'possibleAdditional64RowsUnderLimit':1,'additionalRow32SubslotCapacity':128,
    'allMissingFitExistingUncropped32SubslotRule':small==48,
    'missingFit32Count':small,'missingOver32Count':48-small,
    'limitSource':'Parent/review supplied accepted MAX_TEXTURE_SIZE8192; no new hardware query.',
    'scope':'No search inside occupied cells, repacking, crop, metadata/atlas write, new pixel placement or renderer run.'}
if small==48:
 report['compatibility']={'currentUnusedTailOnlySufficient':False,
   'tailPlusOne64RowCapacity':136,'required32Subslots':48,
   'fitsWithin8192UsingExisting32SubslotPattern':True,
   'minimumNewTailCellsAtFourPerCell':12,'alreadyEmptyTailCells':2,'additionalCellsInOneNewRow':10,
   'planningOnly':'A future reviewed append can use existing32px subslot conventions and at most one64px row. No coordinates were assigned and no assets changed.'}
else:
 report['compatibility']={'currentUnusedTailOnlySufficient':False,
   'fitsWithin8192UsingExisting32SubslotPattern':False,
   'planningOnly':'Do not crop to fit. Larger raw rectangles require a separately reviewed layout decision; no redesign attempted.'}
print(json.dumps(report,indent=2))
