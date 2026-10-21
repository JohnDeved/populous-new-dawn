"""Bounded read-only PE data extraction and local CFG check, not execution/emulation."""
from pathlib import Path
import subprocess,re,struct,json,hashlib
P=Path('/tmp/populous-route-blend-review-20261021')
EXE=Path('/workspace/scratch/69fd8163d94e/populous-original-inputs-20261020/game/d3dpoptb.exe')
b=EXE.read_bytes(); assert hashlib.sha256(b).hexdigest()=='3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f'
raw=subprocess.check_output(['objdump','-d','-Mintel','--insn-width=16',str(EXE)],text=True)
ins={}
for line in raw.splitlines():
 m=re.match(r'^\s*([0-9a-f]+):\s*([0-9a-f ]+)\t([^\s]+)\s*(.*)$',line)
 if m:
  a=int(m[1],16); bs=bytes.fromhex(m[2]);ins[a]=(m[3],m[4],a+len(bs),line)
flag=0x5da074
refs=[(a,v) for a,v in ins.items() if any(f'0x{x:x}' in v[1] for x in range(flag,flag+4))]
sets=[a for a,v in refs if v[0]=='or' and v[1].endswith('0x5da074,0x10')]
full=[a for a,v in refs if v[0]=='mov' and re.match(r'(?:DWORD PTR )?(?:ds:)?0x5da074,e',v[1])]
def local_until_clear(start,mode):
 todo=[start];seen=set();clears=set();calls={};bad=[]
 while todo:
  a=todo.pop()
  if a in seen: continue
  seen.add(a)
  if a not in ins:bad.append([hex(a),'missing instruction']);continue
  op,operand,nxt,line=ins[a]
  clear=(op=='and' and operand.endswith('0x5da074,0xffffffef'))
  if mode=='full':
   clear=(op=='mov' and operand.endswith('0x5da074,eax') and ins.get(a-4,('',''))[:2]==('xor','eax,eax'))
   # Tail zero writes have 2 register pops between xor and mov.
   if op=='mov' and operand.endswith('0x5da074,eax'):
    prev=sorted(x for x in ins if a-10<=x<a)
    for x in prev:
     if ins[x][:2]==('xor','eax,eax') and all(ins[y][0]=='pop' for y in prev if x<y<a):clear=True
  if clear and a!=start:clears.add(a);continue
  if op.startswith('ret') or op in ('int3','ud2'):bad.append([hex(a),op]);continue
  if op=='call':calls[hex(a)]=operand
  if op.startswith('j') or op.startswith('loop'):
   m=re.match(r'0x([0-9a-f]+)$',operand)
   if not m:bad.append([hex(a),'indirect branch: '+operand]);continue
   todo.append(int(m[1],16))
   if op=='jmp':continue
  todo.append(nxt)
  if len(seen)>15000:raise RuntimeError('unexpectedly broad CFG')
 return {'start':hex(start),'mode':mode,'local_instruction_count':len(seen),'clears':[hex(a) for a in sorted(clears)],'calls':calls,'uncleared_exits':bad},seen
results=[]; selected=set()
for a in sets:
 r,nodes=local_until_clear(a,'bit16');results.append(r);selected|=nodes
for a in full:
 if a in [0x45f482,0x45f9b1,0x45ff1d,0x46b172]:continue
 r,nodes=local_until_clear(a,'full');results.append(r);selected|=nodes
(P/'flag-write-closure.json').write_text(json.dumps({'method':'Local branch graph only. Calls assumed to return; direct callees listed for separate inspection. No native instruction execution. Does not claim exhaustive indirect-memory alias proof.','results':results},indent=2)+'\n')
(P/'flag-write-closure.asm').write_text('\n'.join(ins[a][3] for a in sorted(selected))+'\n')
# Decode mapped PE data and callback tables.
pe=struct.unpack_from('<I',b,0x3c)[0]; n=struct.unpack_from('<H',b,pe+6)[0]; opt=struct.unpack_from('<H',b,pe+20)[0];base=struct.unpack_from('<I',b,pe+52)[0];secs=[]
for i in range(n):
 p=pe+24+opt+i*40;name=b[p:p+8].split(b'\0')[0].decode();vs,va,rs,ro=struct.unpack_from('<IIII',b,p+8);secs.append((name,base+va,vs,rs,ro))
def data(a,n):
 for name,v,vs,rs,ro in secs:
  if v<=a and a+n<=v+rs:return b[ro+a-v:ro+a-v+n]
 raise ValueError(hex(a))
windows=[];callbacks=set();desc=[]
for i in range(1,7):
 a=0x5cd080+i*62; d=data(a,62);id=struct.unpack_from('<I',d)[0];record={'address':hex(a),'id':id,'transition_count':struct.unpack_from('<H',d,4)[0],'callback30':hex(struct.unpack_from('<I',d,30)[0]),'hex':d.hex()};windows.append(record)
 for off in (6,10):
  ptr=struct.unpack_from('<I',d,off)[0]
  if not ptr or ptr in [int(x['address'],16) for x in desc]:continue
  controls=[]
  for j in range(1000):
   e=data(ptr+j*66,66);typ=e[4]
   if typ==9:break
   cb=struct.unpack_from('<I',e,41)[0];callbacks.add(cb)
   controls.append({'address':hex(ptr+j*66),'type':typ,'callback41':hex(cb)})
  else:raise RuntimeError('no terminator')
  desc.append({'address':hex(ptr),'controls':controls,'terminator':hex(ptr+j*66)})
refs_raw=[]
for v in range(flag,flag+4):
 pat=struct.pack('<I',v); pos=0
 while True:
  pos=b.find(pat,pos)
  if pos<0:break
  section=next((s for s in secs if s[4]<=pos<s[4]+s[3]),None)
  if section:
   va=section[1]+pos-section[4]; cover=[a for a,x in ins.items() if a<=va<x[2]]
   refs_raw.append({'operand_address':hex(va),'section':section[0],'instruction':hex(cover[0]) if cover else None,'target':hex(v)})
  pos+=1
(P/'source-data.json').write_text(json.dumps({'exe':str(EXE),'sha256':hashlib.sha256(b).hexdigest(),'windows':windows,'descriptors':desc,'callbacks':list(map(hex,sorted(callbacks))),'quad_packet_vtable':data(0x58f518,8).hex(),'initial_vertices_flags':int.from_bytes(data(flag,4),'little'),'raw_address_refs':refs_raw},indent=2)+'\n')
print(json.dumps({'results':results,'callbacks':list(map(hex,sorted(callbacks))),'uncovered_raw_refs':[x for x in refs_raw if x['instruction'] is None],'bytes_saved':sum(x.stat().st_size for x in P.iterdir())},indent=2))
