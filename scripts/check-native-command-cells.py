"""Compose original footprint registration with complete contextual hover/priority.
Usage: python scripts/check-native-command-cells.py EXE [--record]
Only the registration texture refresh is intercepted. Checks choices, including
unoccupied cells; move eligibility and subsequent order execution are not claimed.
"""
import json,struct,subprocess,sys
from pathlib import Path
from unicorn import UC_HOOK_CODE
from unicorn.x86_const import UC_X86_REG_ESP,UC_X86_REG_EIP,UC_X86_REG_EAX
from decomp import native_cpu,load_native_shapes,configure_native_constants,ROOT
exe=Path(sys.argv[1]);cpu,identity=native_cpu(exe);configure_native_constants(cpu,exe)
cpu.mem_map(0x2000000,0x100000);load_native_shapes(cpu,exe,0x2020000,0x2030000)
building,follower,stack,stop=0x2000000,0x2000100,0x20fd000,0x20fe000
write=lambda a,f,*v:cpu.mem_write(a,struct.pack('<'+f,*v))
read=lambda a,f:struct.unpack('<'+f,cpu.mem_read(a,struct.calcsize('<'+f)))[0]
def call(a,*args):
 write(stack,'I'*(len(args)+1),stop,*args);cpu.reg_write(UC_X86_REG_ESP,stack)
 cpu.emu_start(a,stop,count=1000000);assert cpu.reg_read(UC_X86_REG_EIP)==stop

def refresh(c,a,size,user):
 sp=c.reg_read(UC_X86_REG_ESP);c.reg_write(UC_X86_REG_EAX,0)
 c.reg_write(UC_X86_REG_EIP,read(sp,'I'));c.reg_write(UC_X86_REG_ESP,sp+4)
cpu.hook_add(UC_HOOK_CODE,refresh,begin=0x4bdd40,end=0x4bdd40)
write(0x96aa74,'I',0x2040000);cpu.mem_write(0x2040000,bytes([255])*8192)
cases=[]
for angle in range(4):
 for owner in [0,1]:
  for anchor in [0,8192]:
   cpu.mem_write(0x8a03e4,bytes(16384*16));cpu.mem_write(building,bytes(256));cpu.mem_write(follower,bytes(256))
   write(0x890390,'I',0);write(0x890390+20*4,'I',building);write(0x890390+10*4,'I',follower)
   write(building+0x24,'H',20);write(building+0x26,'h',angle*512);write(building+0x2a,'BBB',2,1,2)
   write(building+0x2f,'B',owner);write(building+0x33,'H',107);write(building+0x7a,'HH',anchor,anchor)
   write(building+0x3d,'HHh',anchor,anchor,100)
   call(0x403a00,building,1)
   for selected in [2,3,7]:
    write(follower+0x24,'H',10);write(follower+0x2a,'BBB',1,selected,19);write(follower+0x7a,'B',128)
    write(0x89d1c8+0x881,'I',follower);write(0x89d1c8+0x8c0,'B',0)
    for dx in range(-4,5):
     for dy in range(-4,5):
      x,y=(anchor+dx*256)&65535,(anchor+dy*256)&65535
      write(0x87caba,'I',0x10000|(x>>8)|(y&0xff00))
      write(0x87cac2,'H',0);write(0x87cace,'H',0);write(0x89c6f0,'B',0)
      write(0x895e9c,'B',1);write(0x895e9d,'B',0);write(0x895ea0,'B',3)
      write(0x5cae80,'i',-1);write(0x5cae74,'B',0);write(0x89c665,'I',0x20000);write(0x98e908,'H',0)
      call(0x437010,1)
      cases.append(dict(angle=angle,owner=owner,anchor=anchor,selected=selected,x=x,y=y,model=read(0x895ea0,'B')))
js="""import {createWorld,addBuilding,addUnit,browserPosition,syncLandscapeObjects} from './app/model.ts';import {liveCommandContext} from './app/live-command.ts';
let text='';for await(const chunk of process.stdin)text+=chunk;
const w=createWorld();w.units=[];w.buildings=[];w.trees=[];w.shrines=[];
const u=addUnit(w,'blue','brave',{x:-12,z:8}),b=addBuilding(w,'blue','hut',{x:0,z:0},true);w.selected=[u.id];let key='';
console.log(JSON.stringify(JSON.parse(text).map(c=>{const next=[c.angle,c.owner,c.anchor].join();if(next!==key){key=next;b.object=107;b.angle=c.angle*Math.PI/2;b.anchor={x:c.anchor,y:c.anchor};b.team=c.owner?'red':'blue';syncLandscapeObjects(w);}u.kind=({2:'brave',3:'warrior',7:'shaman'})[c.selected];return liveCommandContext(w,browserPosition(c)).model;})));"""
r=subprocess.run(['node','--input-type=module','-e',js],input=json.dumps(cases),capture_output=True,text=True,cwd=ROOT)
assert r.returncode==0,r.stderr
actual=json.loads(r.stdout)
for c,a in zip(cases,actual):assert a==c['model'],(c,a)
print(f'PASS: {len(cases)} native registered-footprint/contextual choices, four rotations, both owners, wrapped cells and all opening classes')
if '--record' in sys.argv:
 (ROOT/'tests/fixtures/command-cells.json').write_text(json.dumps(dict(executableSha256=identity['sha256'],cases=cases[::6]),separators=(',',':'))+'\n')
