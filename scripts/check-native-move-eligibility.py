"""Compare complete command-3 eligibility and original input feedback gating.
Usage: python scripts/check-native-move-eligibility.py EXE [--record]
The native collision/eligibility branches execute. Transport, marker allocation,
UI refresh and audio playback are recorded rather than sent to the old engine.
"""
import json,struct,subprocess,sys
from pathlib import Path
from unicorn import UC_HOOK_CODE
from unicorn.x86_const import UC_X86_REG_ESP,UC_X86_REG_EIP,UC_X86_REG_EAX
from decomp import native_cpu,ROOT
cpu,identity=native_cpu(Path(sys.argv[1]));cpu.mem_map(0x2000000,0x10000)
write=lambda a,f,*v:cpu.mem_write(a,struct.pack('<'+f,*v))
read=lambda a,f:struct.unpack('<'+f,cpu.mem_read(a,struct.calcsize('<'+f)))[0]
stack,stop,walk=0x200d000,0x200e000,0x2000000
write(0x96aa74,'I',walk);events=[]
def consumer(c,a,size,user):
 sp=c.reg_read(UC_X86_REG_ESP)
 if a==0x479cf0:events.append('command')
 elif a==0x4edbd0:events.append('marker')
 elif a==0x48a050:events.append('cue')
 c.reg_write(UC_X86_REG_EAX,0);c.reg_write(UC_X86_REG_EIP,read(sp,'I'));c.reg_write(UC_X86_REG_ESP,sp+4)
for a in [0x479cf0,0x4edbd0,0x48a050,0x47a550]:cpu.hook_add(UC_HOOK_CODE,consumer,begin=a,end=a)
def call(a,*args):
 write(stack,'I'*(len(args)+1),stop,*args);cpu.reg_write(UC_X86_REG_ESP,stack)
 cpu.emu_start(a,stop,count=100000);assert cpu.reg_read(UC_X86_REG_EIP)==stop
cases=[]
for category in range(16):
 for flags in [0,4,512,516]:
  for tribe in [0,32,64,96]:
   for bits in [0,1,3,7,15]:
    for point in [0,0x2020,0xfefe,0xffff]:
     cpu.mem_write(0x8a03e4,bytes(16384*16));cpu.mem_write(walk,bytes(8192))
     x,y=point&254,(point>>8)&254;index=(y>>1)*128+(x>>1)
     write(0x8a03e4+index*16,'I',flags);write(0x8a03e4+index*16+12,'B',category)
     quarters=[y*256+x,y*256+x+1,(y+1)*256+x,(y+1)*256+x+1]
     for i,bit in enumerate(quarters):
      if bits&(1<<i):write(walk+(bit>>3),'B',read(walk+(bit>>3),'B')|(1<<(bit&7)))
     write(0x89c6f0,'B',0);write(0x89d1c8+0x93d,'I',tribe);write(0x89d1c8+0x8c0,'B',0)
     write(0x895e7a,'I',1);write(0x895e8e,'H',point);write(0x895e9d,'B',0);write(0x895ea0,'B',3)
     write(0x684214,'I',0);call(0x4380f0)
     enabled=bool(read(0x895e9b,'B'))
     write(0x87caba,'I',0x10000|point);write(0x87cac2,'H',0);write(0x87cace,'H',0)
     events.clear();call(0x4aa8b0,0,0,0)
     assert events==(['command','marker','cue'] if enabled else []),(category,flags,tribe,bits,events)
     cases.append(dict(category=category,flags=flags,tribe=tribe,bits=bits,point=point,enabled=enabled))
js="""import {moveCommandAllowed} from './app/command-context.ts';let s='';for await(const chunk of process.stdin)s+=chunk;console.log(JSON.stringify(JSON.parse(s).map(c=>{const walk=new Uint8Array(8192),x=c.point&254,y=(c.point>>8)&254;[y*256+x,y*256+x+1,(y+1)*256+x,(y+1)*256+x+1].forEach((bit,i)=>{if(c.bits&(1<<i))walk[bit>>3]|=1<<(bit&7)});return moveCommandAllowed(c,walk,{x:((c.point&255)<<8)+128,y:(c.point&0xff00)+128},c.tribe)})));"""
r=subprocess.run(['node','--input-type=module','-e',js],input=json.dumps(cases),capture_output=True,text=True,cwd=ROOT);assert r.returncode==0,r.stderr
for c,a in zip(cases,json.loads(r.stdout)):assert a==c['enabled'],(c,a)
print(f'PASS: {len(cases)} full native move eligibility/input calls, categories, quarter masks, coarse-cell boundaries and transport/strict-land flags; rejected inputs have no command, marker or cue')
if '--record' in sys.argv:
 (ROOT/'tests/fixtures/move-eligibility.json').write_text(json.dumps(dict(executableSha256=identity['sha256'],cases=cases[::5]),separators=(',',':'))+'\n')
