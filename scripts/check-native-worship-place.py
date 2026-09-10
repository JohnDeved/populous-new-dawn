"""Execute original worship-place search with native geometry and occupancy.
Route feasibility is supplied; exact query order, output and flags are compared.
Usage: python scripts/check-native-worship-place.py /path/to/d3dpoptb.exe [--record]
"""
import json, random, struct, subprocess, sys
from pathlib import Path
from unicorn import UC_HOOK_CODE
from unicorn.x86_const import UC_X86_REG_ESP, UC_X86_REG_EIP, UC_X86_REG_EAX
from decomp import native_cpu, configure_native_constants, ROOT

exe=Path(sys.argv[1]);cpu,identity=native_cpu(exe);configure_native_constants(cpu,exe)
cpu.mem_map(0x2000000,0x100000)
head,person,out,stack,stop=0x2000000,0x2001000,0x2002000,0x20fd000,0x20fe000

def write(a,f,*v):cpu.mem_write(a,struct.pack('<'+f,*v))
def read(a,f):return struct.unpack('<'+f,cpu.mem_read(a,struct.calcsize('<'+f)))[0]
def call(a,*args):
 write(stack,'I'*(len(args)+1),stop,*args);cpu.reg_write(UC_X86_REG_ESP,stack)
 cpu.emu_start(a,stop,count=1000000)
 assert cpu.reg_read(UC_X86_REG_EIP)==stop
 return cpu.reg_read(UC_X86_REG_EAX)&255

call(0x429ad0)
offsets=list(struct.iter_unpack('<hh',cpu.mem_read(0x974048,200)))
queries=[];answers=[]
def route_leaf(cpu,address,size,user):
 sp=cpu.reg_read(UC_X86_REG_ESP);result=0
 if address==0x4ea970:
  start,end=read(sp+8,'I'),read(sp+12,'I')
  queries.append([list(cpu.mem_read(start,2)),list(cpu.mem_read(end,2))])
  result=int(answers[min(len(queries)-1,len(answers)-1)])
  flags=read(person+0x10,'I')&~0x10000000
  write(person+0x10,'I',flags if result else flags|0x10000000)
 cpu.reg_write(UC_X86_REG_EAX,result);cpu.reg_write(UC_X86_REG_EIP,read(sp,'I'));cpu.reg_write(UC_X86_REG_ESP,sp+4)
# The endpoint correction runs natively on ordinary dry, unoccupied terrain.
cpu.hook_add(UC_HOOK_CODE,route_leaf,begin=0x4ea970,end=0x4ea970)
rng=random.Random(0x43c340);cases=[]
for trial in range(1024):
 cpu.mem_write(0x8a03e4,bytes(16384*16));cpu.mem_write(head,bytes(256));cpu.mem_write(person,bytes(256))
 h=dict(x=rng.randrange(65536),y=rng.randrange(65536),angle=rng.randrange(4)*512,nextSlot=rng.choice([0,1,10,48,49,50,255]))
 p=dict(id=1,x=rng.randrange(65536),y=rng.randrange(65536),flags4=rng.choice([0,0x10000000,0xa1234567]))
 write(head+0x3d,'HH',h['x'],h['y']);write(head+0x26,'h',h['angle']);write(head+0x31,'B',h['nextSlot'])
 write(person+0x24,'H',1);write(person+0x2a,'BB',1,2);write(person+0x3d,'HH',p['x'],p['y']);write(person+0x10,'I',p['flags4'])
 occupied=[]
 for slot,(dx,dy) in enumerate(offsets):
  dx,dy=((dx,dy),(dy,-dx),(-dx,-dy),(-dy,dx))[h['angle']//512]
  x=((h['x']&0xfe00)+256+dx)&65535;y=((h['y']&0xfe00)+256+dy)&65535
  if trial%5 and rng.randrange(3)==0:continue
  # Include stationary enemies, moving people, self and non-person objects.
  cls,speed,own=rng.choice([(1,0,False),(1,0,False),(1,256,False),(5,0,False),(1,0,True)])
  address=person if own else 0x2003000+slot*256
  if own:continue
  cpu.mem_write(address,bytes(256));write(address+0x2a,'B',cls);write(address+0x2f,'B',1)
  write(address+0x5f,'h',speed);write(address+0x3d,'HH',x,y)
  cell=(y>>9)*128+(x>>9);cellhead=0x8a03ea+cell*16;id=slot+10
  write(address+0x20,'H',read(cellhead,'H'));write(cellhead,'H',id);write(0x890390+id*4,'I',address)
  if cls==1 and speed==0:occupied.append(dict(x=x,y=y))
 if trial%7==0:
  dx,dy=offsets[0];dx,dy=((dx,dy),(dy,-dx),(-dx,-dy),(-dy,dx))[h['angle']//512]
  p['x']=((h['x']&0xfe00)+256+dx)&65535;p['y']=((h['y']&0xfe00)+256+dy)&65535
  write(person+0x3d,'HH',p['x'],p['y']);write(0x890394,'I',person)
  cellhead=0x8a03ea+((p['y']>>9)*128+(p['x']>>9))*16
  write(person+0x20,'H',read(cellhead,'H'));write(cellhead,'H',1)
 answers=[bool(rng.randrange(3)) for _ in range(101)]
 if trial%4==0:answers=[True]*101
 elif trial%4==1:answers=[True]+[False]*100
 queries=[];write(out,'III',0xdeadbeef,0xfeedface,0)
 mode=call(0x43c340,head,person,out,out+4)
 result=dict(point=dict(x=read(out,'H'),y=read(out+2,'H')),slot=read(out+4,'I'),mode=mode) if mode else None
 cases.append(dict(head=h,person=p,occupied=occupied,answers=answers,expected=dict(result=result,flags4=read(person+0x10,'I'),queries=queries.copy())))
js="""import{findWorshipPlace}from'./app/worship.ts';let s='';for await(const c of process.stdin)s+=c;console.log(JSON.stringify(JSON.parse(s).map(c=>{const queries=[];const result=findWorshipPlace(c.head,c.person,p=>c.occupied.some(o=>o.x===p.x&&o.y===p.y),p=>{queries.push([[c.person.x>>8,c.person.y>>8],[p.x>>8,p.y>>8]]);const ok=c.answers[Math.min(queries.length-1,c.answers.length-1)];c.person.flags4=((c.person.flags4&~0x10000000)|(ok?0:0x10000000))>>>0;return ok});return{result,flags4:c.person.flags4,queries}})));"""
actual=json.loads(subprocess.check_output(['node','--input-type=module','-e',js],input=json.dumps(cases).encode(),cwd=ROOT))
for i,(c,a) in enumerate(zip(cases,actual)):assert a==c['expected'],(i,c,a)
if '--record' in sys.argv:
 (ROOT/'tests/fixtures/worship-place.json').write_text(json.dumps(dict(executableSha256=identity['sha256'],cases=cases[::7]),separators=(',',':'))+'\n')
assert {c['expected']['result']['mode'] if c['expected']['result'] else 0 for c in cases}=={0,1,2}
print('PASS: 1,024 native worship-place searches, original endpoint/slot geometry, occupancy, query ordering and failure flags')
