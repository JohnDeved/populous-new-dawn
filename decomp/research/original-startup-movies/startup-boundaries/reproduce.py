#!/usr/bin/env python3
"""Data-only bounded extraction. Never loads or executes the subject PE."""
import hashlib, json, struct, subprocess, sys
from pathlib import Path
if len(sys.argv)<2: raise SystemExit('Usage: python reproduce.py AUTHORIZED_D3DPOPTB_EXE [OUTPUT_DIRECTORY]')
exe=Path(sys.argv[1])
out=Path(sys.argv[2] if len(sys.argv)>2 else Path(__file__).parent)
out.mkdir(parents=True,exist_ok=True)
b=exe.read_bytes(); expected='3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f'
assert hashlib.sha256(b).hexdigest()==expected
pe=struct.unpack_from('<I',b,0x3c)[0]; n=struct.unpack_from('<H',b,pe+6)[0]; opt=struct.unpack_from('<H',b,pe+20)[0]; base=struct.unpack_from('<I',b,pe+24+28)[0]
sections=[]
for i in range(n):
 p=pe+24+opt+40*i; name=b[p:p+8].split(b'\0')[0].decode(); vs,rva,raw,off=struct.unpack_from('<4I',b,p+8); sections.append((name,base+rva,raw,off))
def read(va,size):
 for _,start,raw,off in sections:
  if start<=va and va+size<=start+raw:return b[off+va-start:off+va-start+size]
 raise ValueError(hex(va))
def words(va,n):return list(struct.unpack('<'+'I'*n,read(va,4*n)))
def string(va):return read(va,128).split(b'\0')[0].decode('ascii')
ranges={
'entry-crt':[(0x55d6c0,0x55d867)],'entry-winmain':[(0x583ef0,0x583f15)],'entry-app':[(0x47fe90,0x47feca)],
'entry-startup':[(0x4a4450,0x4a45a1)],'startup-initializer':[(0x4a4f70,0x4a5301)],
'logo-guard-producer':[(0x499800,0x499892)],'lobby-detection':[(0x413db0,0x413f82)],
'language-selector':[(0x492ff0,0x4931b8)],'registry-open':[(0x529e80,0x529ef3),(0x52a030,0x52a075)],
'registry-read':[(0x52a0e0,0x52a12e),(0x52a390,0x52a480)],
'frontend-first-pass':[(0x4587e3,0x458884)],'frontend-count-initializer':[(0x459f40,0x45a186)],
'frontend-select':[(0x458a39,0x458afe)],'frontend-menu-set':[(0x45a3c0,0x45a4cb)],
'frontend-page-timer':[(0x4c5b60,0x4c5c2f),(0x45d7f0,0x45d806),(0x4c5cd0,0x4c5cef)],
'frontend-update-type1':[(0x45ae30,0x45ae94)],'frontend-dispatch':[(0x457aa9,0x457abc)],
'frontend-input-boundary':[(0x459000,0x4590f9),(0x45a500,0x45a544)],
'guard-clearers':[(0x4c3610,0x4c363f),(0x4c38b0,0x4c38ef)]}
for name,rs in ranges.items():
 chunks=[]
 for start,end in rs:
  text=subprocess.check_output(['objdump','-d','-Mintel',f'--start-address={start:#x}',f'--stop-address={end:#x}',str(exe)],text=True)
  chunks.append(text.replace(str(exe),'INPUT/d3dpoptb.exe'))
 (out/(name+'.asm')).write_text(''.join(chunks))
headers=subprocess.check_output(['objdump','-x',str(exe)],text=True)
(out/'imports-and-entry.txt').write_text('\n'.join(x for x in headers.splitlines() if any(y in x for y in ['start address','AddressOfEntryPoint','ImageBase','DLL Name: weanetr','0090c978','0090c9b0','0090c784','0090c58c','0090c594']))+'\n')
jumps=words(0x4931b8,12); branch_values={0x49307c:'9, except high-six-bits == 2 gives 10',0x49308e:2,0x493095:0,0x493099:4,0x4930a0:1,0x4930a7:3,0x4930ae:11,0x4930b5:6,0x4930bc:7,0x4930c3:8,0x4930ca:5,0x4930d1:'caller argument'}
maprows=[{'low_ten_bits':i+4,'branch':f'{jumps[v]:08x}','selector':branch_values[jumps[v]]} for i,v in enumerate(read(0x4931e8,26)) if v!=11]
data={'input_sha256':expected,'image_base':hex(base),'entry_point':hex(base+struct.unpack_from('<I',b,pe+24+16)[0]),'strings':{hex(a):string(a) for a in [0x5ca2c0,0x5ca2d0,0x5cd8fc,0x5e0948]},'language_primary_id_mapping':maprows,'data_records':{hex(a):{'raw_hex':read(a,n*4).hex(),'dwords':[f'{x:08x}' for x in words(a,n)]} for a,n in [(0x4931b8,12),(0x4c34ec,11),(0x45a4cc,13),(0x45b3f4,5),(0x45b408,4),(0x59d104,4),(0x59d138,1),(0x5cd954,1),(0x5d9c98,184),(0x5d9bf8,28),(0x5d9f18,8),(0x5d7328,4),(0x5da028,12)]}}
(out/'bounded-data.json').write_text(json.dumps(data,indent=2)+'\n')
(out/'range-manifest.json').write_text(json.dumps({k:[[hex(a),hex(z)] for a,z in v] for k,v in ranges.items()},indent=2)+'\n')
print('Saved',len(ranges),'bounded assembly files and data/import evidence; input hash verified.')
