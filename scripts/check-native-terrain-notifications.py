"""Compare 0044f2f0's height-change object notifications and cell damage bits.
Independent landscape redraw/walk-mask/route consumers are intercepted; inactive
tribe views require no camera update. Linked object traversal executes natively.
Usage: python SCRIPT EXE [--record].
"""
import json, random, struct, subprocess, sys
from pathlib import Path
from unicorn import UC_HOOK_CODE, UC_HOOK_MEM_WRITE
from unicorn.x86_const import UC_X86_REG_ESP, UC_X86_REG_EIP
from decomp import ROOT, native_cpu, configure_native_constants
exe=Path(sys.argv[1]);cpu,identity=native_cpu(exe);configure_native_constants(cpu,exe)
cpu.mem_map(0x2000000,0x10000)
objects,stack,stop=0x2000000,0x200d000,0x200e000
rng=random.Random(0x44f2f0);events=[];recording=False

def write(a,f,*v):cpu.mem_write(a,struct.pack('<'+f,*v))
def read(a,f):return struct.unpack('<'+f,cpu.mem_read(a,struct.calcsize('<'+f)))[0]
def index(cell):return ((cell&0xfe00)>>9)*128+((cell&254)>>1)
def offset(cell,x,y):return (((cell&255)+x*2)&255)|((((cell>>8)+y*2)&255)<<8)
def leaf(c,a,size,user):
 sp=c.reg_read(UC_X86_REG_ESP);c.reg_write(UC_X86_REG_EIP,read(sp,'I'));c.reg_write(UC_X86_REG_ESP,sp+4)
def touched(c,access,a,size,value,user):
 if recording and size==4 and (a-objects)%256==12:events.append((a-objects)//256+1)
for a in [0x4206d0,0x422a60,0x4951b0]:cpu.hook_add(UC_HOOK_CODE,leaf,begin=a,end=a)
cpu.hook_add(UC_HOOK_MEM_WRITE,touched,begin=objects,end=objects+32*256-1)
cpu.mem_write(0x89d1c8,bytes(4*0xc65))
cases=[];expected=[]
for n in range(512):
 center=rng.choice([0,2,0xfefe,0xfe00,0xfe,rng.randrange(65536)]);radius=n%4
 cells=[]
 for y in range(-radius-1,radius+1):
  for x in range(-radius-1,radius+1):
   cells.append(dict(index=index(offset(center,x,y)),flags=rng.choice([0,16,512,1024,0x20000,0x20010,1536]),building=rng.choice([0,0,rng.randrange(1,9)|rng.choice([0,0xfc00])]),people=[]))
 records=[dict(id=i+1,flags2=rng.randrange(65536)) for i in range(32)]
 for i in range(8,32):rng.choice(cells)['people'].append(i+1)
 cpu.mem_write(0x8a03e4,bytes(16384*16));cpu.mem_write(objects,bytes(32*256))
 for r in records:
  a=objects+(r['id']-1)*256;write(0x890390+r['id']*4,'I',a);write(a+12,'I',r['flags2']);write(a+0x2a,'B',1)
 for d in cells:
  a=0x8a03e4+d['index']*16;write(a,'I',d['flags']);write(a+8,'H',d['building']);write(a+6,'H',d['people'][0] if d['people'] else 0)
  for j,id in enumerate(d['people']):write(objects+(id-1)*256+0x20,'H',d['people'][j+1] if j+1<len(d['people']) else 0)
 events=[];recording=True
 write(stack,'5I',stop,1,center,radius,255);cpu.reg_write(UC_X86_REG_ESP,stack);cpu.emu_start(0x44f2f0,stop,count=200000);recording=False
 assert cpu.reg_read(UC_X86_REG_EIP)==stop
 cases.append(dict(center=center,radius=radius,cells=cells,records=records))
 expected.append(dict(events=events,flags=[read(0x8a03e4+d['index']*16,'I') for d in cells],objects=[read(objects+(r['id']-1)*256+12,'I') for r in records]))
js="""
import {notifyTerrainObjects} from './app/terrain-notifications.ts';
let s='';for await(const b of process.stdin)s+=b;
console.log(JSON.stringify(JSON.parse(s).map(c=>{
 const land={flags:new Uint32Array(16384),buildingIds:new Uint16Array(16384)},people=new Map(c.cells.map(d=>[d.index,d.people])),objects=c.records.map(r=>r.flags2),events=[];
 for(const d of c.cells){land.flags[d.index]=d.flags;land.buildingIds[d.index]=d.building}
 notifyTerrainObjects(land,c.center,c.radius,i=>people.get(i)??[],id=>{events.push(id);objects[id-1]=(objects[id-1]|4)>>>0});
 return {events,flags:c.cells.map(d=>land.flags[d.index]),objects};
})));"""
r=subprocess.run(['node','--input-type=module','-e',js],input=json.dumps(cases),capture_output=True,text=True,cwd=ROOT);assert r.returncode==0,r.stderr
actual=json.loads(r.stdout);assert len(actual)==len(expected)
for n,(a,e) in enumerate(zip(actual,expected)):
 if a!=e:
  p=Path('/private/tmp/populous-terrain-notification-mismatch.json');p.write_text(json.dumps(dict(case=cases[n],actual=a,expected=e),indent=2));raise AssertionError(f'case {n}: {p}')
if '--record' in sys.argv:
 ids=range(0,len(cases),5)
 (ROOT/'tests/fixtures/terrain-notifications.json').write_text(json.dumps(dict(executableSha256=identity['sha256'],cases=[cases[i] for i in ids],expected=[expected[i] for i in ids]),separators=(',',':'))+'\n')
print(f'PASS: {len(cases)} native height notifications: linked object order, four touching building cells, damage bits, duplicate visits and wrapped edges')
