#!/usr/bin/env python3
"""Recorded-demo raw-state/current-height boundary proof; source-map IDs unresolved.

Requires Python 3.9+ and existing Capstone 5.0.7. Reads the SHA-locked original
EXE and eleven supplied rddata files using the unchanged sibling PE32 reader;
never executes/emulates target instructions, decodes a full save or creates a
user-save fixture. Optional --imports-root repeats only the three accepted,
hash-pinned imported-height comparisons, never an all-map search. Output must
be a new directory under an existing parent. No Git/head/scratch/cwd dependency.
"""
from pathlib import Path
import argparse,hashlib,importlib.util,json,struct,sys
from datetime import datetime,timezone
try:
 import capstone
 from capstone.x86 import X86_OP_IMM
except ImportError as error:
 raise SystemExit('Use Python with the existing Capstone 5.0.7 dependency; nothing is installed automatically.') from error
HERE=Path(__file__).resolve().parent
READER_SHA='74dd55ab6d811f0f0d870c94eb404d2c06915bf96232b6dc39c25f19ceee6da2'
sha=lambda b:hashlib.sha256(b).hexdigest()
WINDOWS={0x4b3510:0x45,0x4b2a78:0xac,0x428210:0xf9,0x428120:0xe6,
 0x525f80:0xca,0x526580:0x56,0x484a10:0x93,0x484c53:0x75,
 0x42a500:0x61,0x442b50:0xa2,0x50c5c0:0x5d,0x49a750:0x97,0x43e9f6:0xa}
BASE=0x89d178
SIZE=0xd1964
HEIGHT_VA=0x8a03e8
HEIGHT_OFFSET=HEIGHT_VA-BASE
CELL_STRIDE=16
CELL_COUNT=0x4000
VERSION_OFFSET=0x96aa9e-BASE
BANK_OFFSET=0x96ead0-BASE
REFS={
 'app/level-four.ts':('b3e966af13cdf3b96ea822ca13a10bc70ac34bc1755d6aeecc32dfb726cddd69','82a3511c1b5669ba5b44d8ca9eceeefef51c9c6fa7151f650d96d8870f61abad'),
 'app/level-thirteen.ts':('5d5ffdd4bfdfac29a64e83364862dd89f4474780fdee1882beed4385ab99bb3d','5ad694a1f60e0df174ef300fb763d5fc1c48f4b520d1a743bdb1a4b930fc9c3f'),
 'app/level-nineteen.ts':('7ba81e0c6ba08b0eb2fc57421ba5353a196fb8f4ab857bdeb7235f11228c2ca8','33892de2c0fa0efa7c0cbb2ffcc86ffe6bb3b5afbf7f298cd28cb3a7d6fe0359'),
}

INPUTS = {
  "rddata/rdmn001.dat": [
    286,
    "b947d85037945626b58bd085d8bd3996ca2be3ea0072c88eee6621bcc2485f91"
  ],
  "rddata/rd001gm.dat": [
    858468,
    "fc18b981d980ddb9735545573093a5951ff6a574f7addc15cc977eca68df2890"
  ],
  "rddata/rd001gm.ver": [
    68,
    "d84c92ca0c698e9e82366d9425a8751d1913d48195ab2ad7f6e5e4a81afa7e7e"
  ],
  "rddata/rd005gm.dat": [
    858468,
    "6587c7c67e8ad1cd015fc088d03df6056c787ff1b6dd1d7e31ca3ba20eec7844"
  ],
  "rddata/rd005gm.ver": [
    68,
    "4cd55e16b29f5275f91b473a3f2721c0b487cf0aba1116ebda498f4ed2198d79"
  ],
  "rddata/rd002gm.dat": [
    858468,
    "c224346ebae53496c5d4b9d50d22032890097554b713a67ad3a89d02ffc4f8c2"
  ],
  "rddata/rd002gm.ver": [
    68,
    "95d4320f9e308327b9ba37c41266ceca133a1d2208ab8ad6f523b0d84c6abf35"
  ],
  "rddata/rd006gm.dat": [
    858468,
    "f40a17d7eb9bbf87a6a551d445a51f7c7729d819d898f0e49be9a399153037bb"
  ],
  "rddata/rd006gm.ver": [
    68,
    "b97da6cf4a6427af5d854dff95481cf5255907e42ce1b3111a661eb447e11a19"
  ],
  "rddata/rd003gm.dat": [
    858468,
    "26a24908568ca470b9c0d9d835f5493bb0c81ea8b154c5d335b7f6877fc0feda"
  ],
  "rddata/rd003gm.ver": [
    68,
    "6b75d1cda5e7d2b5e36d4a25a0c3b0d809931cd7684c5b1698f6d5268c1d77de"
  ]
}

def main():
 p=argparse.ArgumentParser(description=__doc__)
 p.add_argument('--exe',type=Path,required=True);p.add_argument('--data-root',type=Path,required=True)
 p.add_argument('--reader',type=Path,default=HERE/'check-static-mission18-sky.py',help='unchanged SHA-locked sibling PE32 reader')
 p.add_argument('--imports-root',type=Path,help='optional checkout root for the three fixed, hash-pinned existing height references')
 p.add_argument('--output-dir',type=Path,required=True,help='new evidence directory under an existing parent; never overwrite')
 a=p.parse_args()
 a.exe=a.exe.expanduser().resolve(strict=True)
 a.data_root=a.data_root.expanduser().resolve(strict=True)
 a.reader=a.reader.expanduser().resolve(strict=True)
 if a.imports_root is not None:a.imports_root=a.imports_root.expanduser().resolve(strict=True)
 if capstone.__version__!='5.0.7':raise ValueError('Use existing Capstone5.0.7')
 if sha(a.reader.read_bytes())!=READER_SHA:raise ValueError('Existing PE32 reader fingerprint mismatch')
 out=a.output_dir.expanduser()
 if out.exists() or out.is_symlink():raise ValueError('Existing output is preserved; choose a new directory')
 out=out.resolve()
 if not out.parent.is_dir():raise ValueError('Output parent directory must exist')
 spec=importlib.util.spec_from_file_location('read_only_pe32',a.reader);module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)
 pe=module.PE32(a.exe);out.mkdir();checks=[];rows={};windows={}
 def equal(actual,expected,name):
  if actual!=expected:raise ValueError(f'{name}: expected {expected!r}, got {actual!r}')
  checks.append(name)
 def truth(value,name):equal(bool(value),True,name)
 md=capstone.Cs(capstone.CS_ARCH_X86,capstone.CS_MODE_32);md.detail=True
 for va,size in WINDOWS.items():
  data=pe.read(va,size);instructions=[]
  for i in md.disasm(data,va):
   r={'va':f'{i.address:08x}','bytes':i.bytes.hex(),'size':i.size,'mnemonic':i.mnemonic,'op':i.op_str}
   for op in i.operands:
    if op.type==X86_OP_IMM and (i.group(capstone.CS_GRP_CALL) or i.group(capstone.CS_GRP_JUMP)):r['target']=f'{op.imm&0xffffffff:08x}'
   rows[i.address]=r;instructions.append(r)
  equal(sum(i['size']for i in instructions),size,f'whole declared static window {va:08x}')
  window={'start':f'{va:08x}','endExclusive':f'{va+size:08x}','sha256':sha(data),'instructions':instructions};windows[f'{va:08x}']=window
  (out/f'{va:08x}.txt').write_text('# STATIC BYTES ONLY; not executed.\n# SHA '+window['sha256']+'\n'+'\n'.join(r['va']+' '+r['bytes'].ljust(24)+' '+r['mnemonic']+' '+r['op']for r in instructions)+'\n')
 def ins(va,mn,op):
  if va not in rows:raise ValueError(f'No instruction at {va:08x}')
  equal(rows[va]['mnemonic'],mn,f'mnemonic {va:08x}');equal(rows[va]['op'],op,f'operand {va:08x}')
 def call(va,target):ins(va,'call',f'0x{target:x}')
 # Accepted montage dispatch and raw snapshot loader, not LEVL selection.
 call(0x4b351f,0x4b28d0);call(0x4b3537,0x4b2d20)
 ins(0x4b3518,'mov','word ptr [0x98f748], ax');ins(0x4b3547,'or','byte ptr [0x98f746], 0x10')
 ins(0x4b2a8b,'push','0x5ce054');ins(0x4b2a92,'push','0x5ce044');ins(0x4b2ad5,'cmp','eax, 0xd1964')
 ins(0x4b2ada,'jne','0x4b2c80');ins(0x4b2aec,'push','0x6b');call(0x4b2af7,0x428210);call(0x4b2b07,0x442b50)
 # Version106 accepted for requested107; only the version word, not an invented source-ID field.
 ins(0x428240,'push','0x44');call(0x428248,0x525f80);ins(0x428250,'cmp','dword ptr [esp + 4], 0x44')
 ins(0x428265,'cmp','dword ptr [esp + 8], 0x6a');ins(0x428270,'cmp','eax, 0x6a')
 ins(0x42829f,'push','0x89d178');call(0x4282a9,0x525f80);ins(0x4282b1,'mov','eax, dword ptr [0x96aa9e]')
 ins(0x4282b6,'push','0x6b');call(0x4282b9,0x428120)
 ins(0x4282ef,'push','0x89d178');call(0x4282f9,0x525f80)
 # File read is direct ReadFile of the requested buffer; no compression/field relayout on this adapter path.
 ins(0x525ffd,'mov','eax, dword ptr [esp + 0x114]');ins(0x52600b,'push','eax');call(0x52600d,0x526580)
 ins(0x5265a9,'call','dword ptr [0xd0c6ec]');equal(pe.imports[0xd0c6ec],'KERNEL32.dll!ReadFile','raw input reader import')
 ins(0x5265bd,'cmp','edi, dword ptr [esp + 8]');ins(0x5265c1,'jne','0x5265cb')
 # Conversion<=106 ->107 preserves height+4, count and stride; it repacks other cell fields.
 ins(0x428123,'cmp','dword ptr [esp + 0x14], 0x6a');ins(0x42812c,'jg','0x4281fe')
 ins(0x428136,'cmp','esi, 0x6a');ins(0x428139,'jle','0x4281fe')
 ins(0x42813f,'mov','edx, 0x8a03e4');ins(0x428144,'mov','eax, 0x4000')
 ins(0x428151,'mov','ebp, dword ptr [edx + 4]');ins(0x428159,'mov','dword ptr [ebx + 4], ebp')
 ins(0x428169,'mov','di, word ptr [esp + 0x14]');ins(0x428179,'mov','word ptr [ecx + 4], di')
 ins(0x4281a7,'add','ecx, 0x10');ins(0x4281aa,'add','edx, 0x10');ins(0x4281c3,'dec','eax')
 ins(0x4281f2,'jne','0x42814b');ins(0x4281f8,'mov','dword ptr [0x96aa9e], esi')
 # Canonical DAT loader provenance for first32768 bytes -> same live height field.
 ins(0x484a22,'mov','esi, dword ptr [esp + 0x26c]');ins(0x484a8e,'push','esi');ins(0x484a8f,'push','0x599848');call(0x484a9b,0x55b450)
 ins(0x484c67,'push','0x8000');call(0x484c6e,0x526580);ins(0x484c76,'cmp','dword ptr [esp + 0x18], 0x8000')
 ins(0x484ca0,'mov','eax, 0x8a03e4');ins(0x484ca5,'mov','ecx, 0x4000');ins(0x484caa,'mov','si, word ptr [edx]')
 ins(0x484cad,'add','eax, 0x10');ins(0x484cb0,'mov','word ptr [eax - 0xc], si');ins(0x484cb4,'add','edx, 2');ins(0x484cb8,'jne','0x484caa');call(0x484cc0,0x44ddf0)
 # This same height is mutable; a difference cannot reconstruct original terrain causally.
 ins(0x50c60d,'mov','word ptr [ecx*4 + 0x8a03e8], 0');call(0x50c618,0x44ddf0)
 # Saved landscape bank is consumed as art-bank selection, not a numeric campaign/map ID.
 ins(0x42a516,'mov','byte ptr [0x96ead0], cl');call(0x42a51c,0x42a140)
 ins(0x442bad,'mov','al, byte ptr [0x96ead0]');call(0x442bb3,0x42a500)
 # Ordinary chosen level and a byte copy are before the bulk image, not serialized through this reader.
 ins(0x43e9f6,'mov','al, byte ptr [0x89c6dd]');ins(0x43e9fb,'mov','byte ptr [0x89d16e], al')
 equal(BASE-0x89c6dd,2715,'ordinary level selector lies2715bytes before bulk image')
 equal(BASE-0x89d16e,10,'copied level byte also lies outside bulk image')
 equal(HEIGHT_OFFSET,0x3270,'loader-backed snapshot height offset');equal(VERSION_OFFSET,0xcd926,'payload version argument offset');equal(BANK_OFFSET,0xd1958,'saved bank offset')
 # Current writer metadata interface: no inference that old106 files were produced by this107 build.
 ins(0x49a777,'mov','eax, dword ptr [esp + 0x5c]');ins(0x49a77b,'mov','ecx, dword ptr [esp + 0x68]')
 ins(0x49a78d,'mov','dword ptr [esp + 0x14], eax');ins(0x49a792,'mov','dword ptr [esp + 0x58], ecx')
 equal(pe.cstr(0x59d018),'%s','version build-string format, not an integer source-map field')
 ins(0x49a7c2,'push','0x44');call(0x49a7c6,0x526130)
 equal(pe.cstr(0x5a1db8),'Nov 25 1998','current writer build-date literal')
 equal(pe.cstr(0x5ce044),'%s\\RD%03d%s.%s','recording filename format')
 equal(pe.cstr(0x5ce054),'GM','recording-state suffix');equal(pe.cstr(0x599848),'LEVL2','separate canonical-level stem')
 inputs=[];data={}
 for rel,(size,digest) in INPUTS.items():
  b=(a.data_root/rel).read_bytes();equal(len(b),size,'input size '+rel);equal(sha(b),digest,'input SHA '+rel);inputs.append({'path':rel,'bytes':size,'sha256':digest});data[rel]=b
 montage=data['rddata/rdmn001.dat'].decode('latin1');commands=[l.split()for l in montage.splitlines()if l.strip()and not l.lstrip().startswith('#')]
 active=[int(c[1])for c in commands if c[0]=='MONTYPE_GAME'];equal(active,[1,5,2,6,3],'active recording IDs, not map IDs')
 references=[]
 if a.imports_root:
  for rel,(fileSHA,datSHA)in REFS.items():
   b=(a.imports_root/rel).read_bytes();equal(sha(b),fileSHA,'unchanged tracked reference '+rel)
   obj=json.loads(b.decode('utf-8').split('export default ',1)[1].strip().removesuffix(';'));equal(obj['sourceSha256'],datSHA,'reference source provenance '+rel)
   values=[0]*CELL_COUNT
   for x,y,height in obj['heights']:values[y*128+x]=height
   packed=struct.pack('<16384h',*values);references.append({'path':rel,'fileSha256':fileSHA,'canonicalDATsha256':datSHA,'currentReferenceHeightSha256':sha(packed),'values':values})
 recordings=[]
 for rid in active:
  b=data[f'rddata/rd{rid:03}gm.dat'];ver=data[f'rddata/rd{rid:03}gm.ver'];equal(len(b),SIZE,'fixed raw snapshot size '+str(rid))
  equal(struct.unpack_from('<I',ver)[0],106,'sidecar input version106 '+str(rid))
  payloadVersion=struct.unpack_from('<I',b,VERSION_OFFSET)[0];equal(payloadVersion,0,'observed payload conversion argument0 '+str(rid))
  field=b''.join(b[HEIGHT_OFFSET+j*CELL_STRIDE:HEIGHT_OFFSET+j*CELL_STRIDE+2]for j in range(CELL_COUNT));equal(len(field),32768,'projected height byte count '+str(rid))
  values=struct.unpack('<16384h',field);(out/f'rd{rid:03}-current-heights-i16le.bin').write_bytes(field)
  comparisons=[{'reference':ref['path'],'canonicalDATsha256':ref['canonicalDATsha256'],'referenceHeightSha256':ref['currentReferenceHeightSha256'],'exactEqual':list(values)==ref['values'],'differentHeightCells':sum(x!=y for x,y in zip(values,ref['values']))}for ref in references]
  recordings.append({'recordingId':rid,'sourceMapId':None,'sourceIdentityStatus':'UNRESOLVED','sidecarVersion':106,'payloadVersionArgument':payloadVersion,
   'recordedLandscapeBank':b[BANK_OFFSET],'heightSha256':sha(field),'heightMin':min(values),'heightMax':max(values),'nonzeroHeightCells':sum(v!=0 for v in values),
   'sidecarWord20':{'value':struct.unpack_from('<I',ver,20)[0],'semantics':'UNBOUND; not treated as a map identifier even when it matches recording ID'},
   'sidecarTrailingWord64':struct.unpack_from('<I',ver,64)[0],'sidecarBuildText':ver[36:64].split(b'\0')[0].decode('ascii'),
   'exactReferenceComparisons':comparisons})
 if references:truth(all(not c['exactEqual']for r in recordings for c in r['exactReferenceComparisons']),'no whole-height equality among these three existing reference fields; not source exclusion')
 result={'at':datetime.now(timezone.utc).isoformat(),'status':'PASS_STATIC_RECORDED_STATE_FIELD_BOUNDARY','scopeDecision':'UNRESOLVED_ORIGINAL_MAP_PROVENANCE_FOR_ACTIVE_RECORDINGS',
  'exeSha256':sha(pe.data),'readerSha256':sha(a.reader.read_bytes()),'scriptSha256':sha(Path(__file__).read_bytes()),'capstone':capstone.__version__,'assertions':len(checks),'checks':checks,'windows':windows,
  'inputIdentities':inputs,'bulkImage':{'baseVA':f'{BASE:08x}','size':SIZE,'endExclusiveVA':f'{BASE+SIZE:08x}','heightVA':f'{HEIGHT_VA:08x}','heightOffset':HEIGHT_OFFSET,'cellStride':CELL_STRIDE,'cellCount':CELL_COUNT,'heightIsMutable':True,'ordinaryLevelSelectorSerializedInBulk':False},
  'referenceIdentities':[{k:v for k,v in x.items()if k!='values'}for x in references],'recordings':recordings,
  'resolved':'The recorded GM files are raw live-state images with verified field projection. Version conversion preserves terrain height; palette bank is an art selector; ordinary selected-level globals are outside the loaded span.',
  'remaining':'No trustworthy stored original source-map identifier has been bound in the inspected recording producer/reader contract. Need the original version106 recording creation source-map link, or a traceable immutable pre-mutation geometry/source fingerprint. The current raw reader00428210 cannot recover outside globals and current terrain alone is mutable. Current writer0049a750 describes its own metadata interface, not the provenance of olderSep30version106 input files.',
  'limits':'No LEVL2131 yes/no claim or other extra-map assignment. No identity from bank, label, recording number, raw coincidental words or near height matches. Optional comparisons are limited to three existing tracked height references; no canonical source-level raw-file inventory. No target execution/emulation, full save codec, user-created-save fixture, renderer, scope/parity recording or U08 acceptance.'}
 (out/'evidence.json').write_text(json.dumps(result,indent=2)+'\n')
 summary={k:v for k,v in result.items()if k not in ['checks','windows','inputIdentities']}
 print(json.dumps(summary,indent=2))

if __name__=='__main__':
 try:main()
 except (OSError,ValueError,struct.error) as error:
  print(f'FAIL: {error}',file=sys.stderr)
  sys.exit(1)
