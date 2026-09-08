"""Compare original held navigation, command merging and edge-scroll requests.
Usage: python scripts/check-native-navigation.py /path/to/d3dpoptb.exe
Full handlers execute. Mouse input and unrelated UI/drag leaves are intercepted.
"""
import json,struct,subprocess,sys
from pathlib import Path
from unicorn import UC_HOOK_CODE
from unicorn.x86_const import UC_X86_REG_ESP,UC_X86_REG_EIP,UC_X86_REG_EAX
from decomp import native_cpu
root=Path(__file__).resolve().parents[1]
cpu,_=native_cpu(Path(sys.argv[1]));cpu.mem_map(0x2000000,0x20000)
stack,stop,mouse=0x201d000,0x201e000,0x2000000

def write(p,fmt,*v):cpu.mem_write(p,struct.pack('<'+fmt,*v))
def read(p,fmt):return struct.unpack('<'+fmt,cpu.mem_read(p,struct.calcsize('<'+fmt)))[0]
def call(address,*args):
 write(stack,'I'*(len(args)+1),stop,*[v&0xffffffff for v in args]);cpu.reg_write(UC_X86_REG_ESP,stack)
 cpu.emu_start(address,stop,count=1000000)
 assert cpu.reg_read(UC_X86_REG_EIP)==stop,hex(cpu.reg_read(UC_X86_REG_EIP))
def compare(js,cases,wants):
 p=subprocess.run(['node','--input-type=module','-e',"import * as f from './app/camera-input.ts';let s='';for await(const c of process.stdin)s+=c;console.log(JSON.stringify(JSON.parse(s).map("+js+')));'],input=json.dumps(cases),capture_output=True,text=True,cwd=root)
 assert p.returncode==0,p.stderr
 got=json.loads(p.stdout);assert len(got)==len(wants)
 for c,w,g in zip(cases,wants,got):assert w==g,(c,w,g)

# Original built-in key table at 0x5d5de8, 12-byte records used by 0x4891d0.
keys=[]
for i in range(12):
 row=bytes(cpu.mem_read(0x5d5de8+i*12,12))
 assert read(0x5d5de8+i*12+8,'I')==0x4ae200
 keys.append((row[0],struct.unpack_from('<I',row,1)[0]))
assert keys==[(0xc8,1),(0x48,1),(0xd0,2),(0x50,2),(0xd3,3),(0x4b,199),(0xd1,4),(0x4d,200),(0xcb,5),(0x47,201),(0xcd,6),(0x49,202)]

cases=[];wants=[]
for command in [0,1,2,3,4,5,6,7,198,199,200,201,202,203,255]:
 for flags in range(64):
  control,fast,swap,reverse,overview,blocked=[bool(flags&(1<<i)) for i in range(6)]
  for consumed in [False,True]:
   cpu.mem_write(0x984591,bytes(512))
   write(0x98e908,'H',1 if blocked else 0);write(0x89c6e7,'B',0)
   write(0x9845ae,'B',control);write(0x9846ae,'B',control and consumed)
   write(0x9845bb,'B',fast);write(0x9846bb,'B',fast and consumed)
   write(0x895da8,'I',(0x200000 if swap else 0)|(0x80000 if reverse else 0))
   write(0x89c6c1,'B',2 if overview else 0);write(0x89798d,'H',0)
   call(0x4ae200,command)
   cases.append([command,dict(control=control and not consumed,fast=fast and not consumed,swap=swap,reverse=reverse,overview=overview,blocked=blocked)])
   wants.append(read(0x89798e,'B'))
compare('c=>f.cameraCommand(...c)',cases,wants)
print(f'PASS: {len(cases)} complete native navigation commands, built-in key table, modifiers/settings, consumed keys, aliases and input lock')

# Exact type-2 record accumulator: a duplicate direction sets the fast bit.
cases=[];wants=[]
for current in range(256):
 for incoming in [0,1,2,3,4,8,16,32,64,255]:
  write(0x89798d,'BB',2,current);call(0x479dd0,2,incoming,0)
  cases.append([current,incoming]);wants.append(read(0x89798e,'B'))
compare('c=>f.mergeCameraInput(...c)',cases,wants)
print('PASS: 2560 complete native input accumulations, including duplicate-direction acceleration')

# Supply pointer coordinates; skip non-edge consumers after the original gates.
def leaf(cpu,address,size,user):
 if address==0x4ffb90:cpu.reg_write(UC_X86_REG_EAX,mouse)
 sp=cpu.reg_read(UC_X86_REG_ESP);cpu.reg_write(UC_X86_REG_EIP,read(sp,'I'));cpu.reg_write(UC_X86_REG_ESP,sp+4)
for address in [0x4ffb90,0x448fa0,0x417c00,0x419a60,0x442880,0x442920,0x4429c0,0x47acb0]:
 cpu.hook_add(UC_HOOK_CODE,leaf,begin=address,end=address)
cpu.mem_write(0x984591,bytes(512));write(0x98e908,'H',0);write(0x89c6e7,'B',0)
cases=[];wants=[]
for width,height in [(1,1),(640,480),(1440,1000)]:
 write(0x89c6cf,'hh',width,height)
 for x in [-1,0,1,width//2,width-2,width-1,width]:
  for y in [-1,0,1,height//2,height-2,height-1,height]:
   for gate in range(6):
    write(mouse,'ii',x,y);write(0x89798d,'H',0)
    write(0x89c661,'I',0x80000 if gate==1 else 0)
    write(0x89c669,'I',0x80000000 if gate==2 else 0)
    write(0x98e910,'B',1 if gate==3 else 2 if gate==4 else 0)
    write(0x5a219c+2*0x1e,'H',0x100 if gate==5 else 0)
    call(0x4adbb0)
    cases.append([x,y,width,height,gate]);wants.append(read(0x89798e,'B'))
compare('c=>c[4]?0:f.cameraEdgeButtons(...c)',cases,wants)
print(f'PASS: {len(cases)} complete native pointer handlers: outer pixels/corners, disabled scrolling, input locks and drag gates')
