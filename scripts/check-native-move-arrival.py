"""Compare complete 0x4336c0 movement arrival and its 0x43bb60 consumer.
No native hooks: payload decoding, category, vehicle and all distance gates run.
Usage: python SCRIPT EXE [--record]
"""
import json,random,struct,subprocess,sys
from pathlib import Path
from unicorn.x86_const import UC_X86_REG_ESP,UC_X86_REG_EIP,UC_X86_REG_EAX
from decomp import native_cpu,configure_native_constants
root=Path(__file__).resolve().parents[1];exe=Path(sys.argv[1]);cpu,identity=native_cpu(exe);configure_native_constants(cpu,exe)
cpu.mem_map(0x2000000,0x10000);p,v,o,stack,stop=0x2000000,0x2001000,0x2002000,0x200e000,0x200f000
rng=random.Random(0x4336c0)
def write(a,f,*values):cpu.mem_write(a,struct.pack('<'+f,*values))
fields={'x':(0x3d,'H'),'y':(0x3f,'H'),'model':(0x2b,'B'),'flags4':(0x10,'I'),'vehicle':(0x9f,'H'),'counter':(0x2e,'B'),'goalX':(0x4f,'H'),'goalY':(0x51,'H')}
write(0x890394,'I',v)
cases=[]
for i in range(8192):
 x=rng.choice([0,1,32767,32768,65535,rng.randrange(65536)]);y=rng.randrange(65536)
 person=dict(x=x,y=y,model=i%9,flags4=rng.choice([0,0x2000000,0x4000000,0x6000000]),vehicle=rng.randrange(2),counter=i%8,goalX=(x+rng.choice([0,352,353,567,568,32768,-1]))&65535,goalY=y)
 order=dict(model=rng.randrange(35),flags=0,references=1,object=0,a=(x+rng.choice([0,215,216,439,440,32768,-1]))&65535,b=y)
 vehicle=dict(x=x,y=y);category=i%16
 for k,(off,f) in fields.items():write(p+off,f,person[k])
 write(v+0x3d,'HH',x,y);write(o,'BBHHHH',*order.values());cell=(person['goalY']>>9)*128+(person['goalX']>>9);write(0x8a03e4+cell*16+12,'B',category)
 result=[]
 for a in [0x43bb60,0x4336c0]:
  write(stack,'III',stop,p,o);cpu.reg_write(UC_X86_REG_ESP,stack);cpu.emu_start(a,stop,count=10000);assert cpu.reg_read(UC_X86_REG_EIP)==stop;result.append(bool(cpu.reg_read(UC_X86_REG_EAX)&255))
 cases.append(dict(person=person,order=order,vehicle=vehicle,category=category,expected=result))
js="""import {personReachedOrder,stepMovementOrder} from './app/person-orders.ts';let s='';for await(const c of process.stdin)s+=c;console.log(JSON.stringify(JSON.parse(s).map(c=>{const land=new Uint8Array(16384);land[(c.person.goalY>>9)*128+(c.person.goalX>>9)]=c.category;return [personReachedOrder(c.person,c.order,()=>c.vehicle),stepMovementOrder(c.person,c.order,land,()=>c.vehicle)]})));"""
r=subprocess.run(['node','--input-type=module','-e',js],input=json.dumps(cases),text=True,capture_output=True,cwd=root);assert r.returncode==0,r.stderr
for i,(c,a) in enumerate(zip(cases,json.loads(r.stdout))):assert a==c['expected'],(i,c,a)
if '--record' in sys.argv:(root/'tests/fixtures/move-arrival.json').write_text(json.dumps(dict(executableSha256=identity['sha256'],cases=cases[:512]),separators=(',',':'))+'\n')
print('PASS: 16,384 native movement/payload arrival calls; 4-turn cadence, every person model/category, vehicle centering and seam boundaries')
