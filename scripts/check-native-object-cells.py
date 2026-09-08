"""Compare full 4ee470 insertion, 4ee4f0 removal and 4ee580 movement.
Usage: python scripts/check-native-object-cells.py /path/to/d3dpoptb.exe
No native callees are supplied. Every operation checks all cell heads and all
object fields through 128 persistent records, including detached stale links.
"""
import hashlib,json,random,struct,subprocess,sys
from pathlib import Path
from unicorn.x86_const import UC_X86_REG_ESP,UC_X86_REG_EIP,UC_X86_REG_EAX
from decomp import native_cpu
root=Path(__file__).resolve().parents[1];cpu,_=native_cpu(Path(sys.argv[1]));rng=random.Random(0x4ee580)
cpu.mem_map(0x2000000,0x20000);base,to,stack,stop=0x2000000,0x2010000,0x201e000,0x201f000
fields=[('id',0x24,'H'),('x',0x3d,'H'),('y',0x3f,'H'),('h',0x41,'h'),('flags2',0xc,'I'),('flags3',0x14,'I'),('cellNext',0x20,'H'),('cellPrevious',0x22,'H')]
def write(a,f,*v):cpu.mem_write(a,struct.pack('<'+f,*v))
def read(a,f):return struct.unpack('<'+f,cpu.mem_read(a,struct.calcsize('<'+f)))[0]
def call(a,*args):
 write(stack,'I'*(len(args)+1),stop,*args);cpu.reg_write(UC_X86_REG_ESP,stack);cpu.emu_start(a,stop,count=10000)
 assert cpu.reg_read(UC_X86_REG_EIP)==stop;return cpu.reg_read(UC_X86_REG_EAX)
ids=[1,639,640,1023,1024,1727]+rng.sample(list(range(2,639))+list(range(641,1023)),122)
objects=[];addresses={};linked=set();ops=[];expected=[];counts={'insert':0,'remove':0,'move':0}
for i,id in enumerate(ids):
 p=dict(id=id,x=rng.choice([0,511,512,65535]),y=rng.choice([0,511,512,65535]),h=rng.randrange(-32768,32768),flags2=0,flags3=0,cellNext=0,cellPrevious=0,displacement=dict(x=0,y=0,h=0));objects.append(p);addr=base+i*256;addresses[id]=addr;write(0x890390+id*4,'I',addr)
 for k,offset,f in fields:write(addr+offset,f,p[k])
def snapshot():
 memory=bytes(cpu.mem_read(0x8a03e4,16384*16));heads=b''.join(memory[i:i+2] for i in range(6,len(memory),16))
 rows=[[read(a+off,f) for _,off,f in fields]+list(struct.unpack('<hhh',cpu.mem_read(a+0x43,6))) for a in addresses.values()]
 return [hashlib.sha256(heads).hexdigest(),hashlib.sha256(json.dumps(rows,separators=(',',':')).encode()).hexdigest()]
for i in range(8192):
 id=rng.choice(ids);addr=addresses[id];kind='insert' if id not in linked else 'remove' if i%5==0 else 'move';counts[kind]+=1
 flags3=rng.getrandbits(32);write(addr+0x14,'I',flags3)
 op=dict(id=id,kind=kind,flags3=flags3)
 if kind=='insert':call(0x4ee470,addr,addr+0x3d);linked.add(id)
 elif kind=='remove':call(0x4ee4f0,addr);linked.remove(id)
 else:
  x=read(addr+0x3d,'H');y=read(addr+0x3f,'H');q=dict(x=(x+rng.choice([0,1,-1,511,512,65535,rng.randrange(65536)]))&65535,y=(y+rng.choice([0,1,-1,511,512,65535,rng.randrange(65536)]))&65535,h=rng.randrange(-32768,32768));op.update(to=q,alias=i%31==0)
  write(to,'HHh',q['x'],q['y'],q['h']);op['moved']=bool(call(0x4ee580,addr,addr+0x3d if op['alias'] else to))
 ops.append(op);expected.append(snapshot())
js="""import {insertObjectIntoCell,removeObjectFromCell,moveObjectInCells} from './app/object-cells.ts';import {createHash} from 'node:crypto';let s='';for await(const c of process.stdin)s+=c;const input=JSON.parse(s),w={heads:new Uint16Array(16384),objects:new Map(input.objects.map(p=>[p.id,p]))};
const hash=b=>createHash('sha256').update(b).digest('hex');console.log(JSON.stringify(input.ops.map(o=>{const p=w.objects.get(o.id);p.flags3=o.flags3;
if(o.kind==='insert')insertObjectIntoCell(w,p,p);else if(o.kind==='remove')removeObjectFromCell(w,p);else if(moveObjectInCells(w,p,o.alias?p:o.to)!==o.moved)throw Error('Movement result differs');
return [hash(new Uint8Array(w.heads.buffer)),hash(JSON.stringify([...w.objects.values()].map(p=>[p.id,p.x,p.y,p.h,p.flags2,p.flags3,p.cellNext,p.cellPrevious,p.displacement.x,p.displacement.y,p.displacement.h])))];})));"""
r=subprocess.run(['node','--input-type=module','-e',js],input=json.dumps(dict(objects=objects,ops=ops)),capture_output=True,text=True,cwd=root);assert r.returncode==0,r.stderr;actual=json.loads(r.stdout);assert len(actual)==len(expected)
for i,(a,b) in enumerate(zip(expected,actual)):assert a==b,(i,ops[i],a,b)
assert all(counts.values());print('PASS: 8,192 sequential native cell-list operations, all 16,384 heads and 128 object records after every operation:',counts)
