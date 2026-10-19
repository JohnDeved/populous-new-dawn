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
'movie-callbacks':[(0x49cc10,0x49cc7d)],
'movie-wrapper':[(0x49cc80,0x49cf3c)],
'input-dispatch':[(0x526a80,0x526bed)],
'input-dequeue-count':[(0x526c10,0x526cf1),(0x526d10,0x526d16)],
'input-ring':[(0x52c5b0,0x52c74c)],
'keyboard-producer':[(0x52c880,0x52cb3c)],
'mouse-producer':[(0x52cd40,0x52d117)],
'input-helper-boundary':[(0x526fd0,0x526fe7),(0x52e060,0x52e073)],
'memory-release-boundary':[(0x55bdd0,0x55be3d)],
'player-create':[(0x579960,0x5799e0)],
'player-entry':[(0x57ae00,0x57ae3f)],
'player-run-and-destroy':[(0x57a800,0x57a99b)],
'player-loop':[(0x57a9a0,0x57ac83)],
'player-exit-helpers':[(0x57dfe0,0x57e026),(0x57e350,0x57e36f),(0x57ade0,0x57adf3)],
'callers-continue':[(0x523170,0x5231bc),(0x4c3340,0x4c34ec)],
'directinput-import-thunk':[(0x584f38,0x584f3e)]}
for name,rs in ranges.items():
 chunks=[]
 for start,end in rs:
  text=subprocess.check_output(['objdump','-d','-Mintel',f'--start-address={start:#x}',f'--stop-address={end:#x}',str(exe)],text=True)
  chunks.append(text.replace(str(exe),'INPUT/d3dpoptb.exe'))
 (out/(name+'.asm')).write_text(''.join(chunks))
headers=subprocess.check_output(['objdump','-x',str(exe)],text=True)
(out/'imports.txt').write_text('\n'.join(x for x in headers.splitlines() if any(y in x for y in ['DLL Name: DINPUT','DLL Name: WINMM','0090c5a8','0090c6a8','0090c670','0090c674','0090c678','0090c724','0090c784','0090c934','0090c938','0090c6e0']))+'\n')
# Preserve raw table bytes and decode only the specific format fields used by the trace.
raw_ranges=[(0x5ca864,24),(0x590938,32),(0x526bf0,19),(0x526cf4,20),(0x52d1b4,32),(0x584f20,24),(0x584fb0,24),(0x584f40,112)]
data={'input_sha256':expected,'image_base':hex(base),'raw_data':{hex(a):read(a,n).hex() for a,n in raw_ranges},'keyboard_format':words(0x584f20,6),'mouse_format':words(0x584fb0,6),'keyboard_objects':[],'mouse_objects':[]}
for name,addr,count in [('keyboard',0x583f20,256),('mouse',0x584f40,7)]:
 for i in range(count):
  guid,ofs,typ,flags=words(addr+i*16,4)
  data[name+'_objects'].append({'guid_va':hex(guid),'offset':ofs,'type':hex(typ),'flags':flags})
# All keyboard offsets are the sequential 256-byte keyboard state layout.
assert [v['offset'] for v in data['keyboard_objects']]==list(range(256))
(out/'bounded-data.json').write_text(json.dumps(data,indent=2)+'\n')
(out/'range-manifest.json').write_text(json.dumps({k:[[hex(a),hex(z)] for a,z in v] for k,v in ranges.items()},indent=2)+'\n')
# Linear-disassembly reference inventory is a search aid, NOT proof against indirect accesses.
full=subprocess.check_output(['objdump','-d','-Mintel','-j','.text',str(exe)],text=True)
(out/'reference-inventory.txt').write_text('\n'.join(x for x in full.splitlines() if '0x5ca864' in x or 'call   0x52c5b0' in x)+'\n')
print('Saved',len(ranges),'bounded assembly files plus table/import/reference evidence; hash verified.')
