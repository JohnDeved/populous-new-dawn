"""Compare timed-head reward admission, group selection and panel model height.
The supplied PE executes cell traversal and person eligibility. Only presentation
consumers and the selection roster lookup are intercepted.
Usage: python scripts/check-native-worship-admission.py /path/to/d3dpoptb.exe [--record]
"""
import itertools,json,random,struct,subprocess,sys
from pathlib import Path
from unicorn import UC_HOOK_CODE
from unicorn.x86_const import UC_X86_REG_ESP,UC_X86_REG_EIP,UC_X86_REG_EAX
from decomp import native_cpu,configure_native_constants,ROOT
exe=Path(sys.argv[1]);cpu,identity=native_cpu(exe);configure_native_constants(cpu,exe)
cpu.mem_map(0x2000000,0x100000)
trigger,head,people,tribe,command,stack,stop=0x2000000,0x2001000,0x2002000,0x2009000,0x200a000,0x20fd000,0x20fe000
def write(a,f,*v):cpu.mem_write(a,struct.pack('<'+f,*v))
def read(a,f):return struct.unpack('<'+f,cpu.mem_read(a,struct.calcsize('<'+f)))[0]
def call(a,*args):
 write(stack,'I'*(len(args)+1),stop,*args);cpu.reg_write(UC_X86_REG_ESP,stack);cpu.emu_start(a,stop,count=500000)
 assert cpu.reg_read(UC_X86_REG_EIP)==stop,hex(cpu.reg_read(UC_X86_REG_EIP))
def leaf(cpu,a,size,user):
 sp=cpu.reg_read(UC_X86_REG_ESP);value=0xffffffff if a==0x430bd0 else 0
 if a==0x43c600:
  i=read(read(sp+8,'I'),'I');value=people+i*256 if i<3 else 0
 cpu.reg_write(UC_X86_REG_EAX,value);cpu.reg_write(UC_X86_REG_EIP,read(sp,'I'));cpu.reg_write(UC_X86_REG_ESP,sp+4)
for a in [0x4fbd20,0x509290,0x430bd0,0x47a550,0x489c40]:cpu.hook_add(UC_HOOK_CODE,leaf,begin=a,end=a)
rng=random.Random(0x4fb270);cases=[]
for n in range(1536):
 cpu.mem_write(0x8a03e4,bytes(16384*16));cpu.mem_write(trigger,bytes(256));cpu.mem_write(head,bytes(256))
 h=dict(x=rng.randrange(65536),y=rng.randrange(65536),angle=n%4*512,range=n%4)
 write(trigger+0x2a,'BBBB',6,6,0,0);write(trigger+0x2e,'B',4);write(trigger+0x3d,'HH',h['x'],h['y'])
 write(trigger+0x68,'BB',0,h['range']);write(trigger+0x6d,'B',1);write(trigger+0x8e,'h',1);write(trigger+0x92,'H',100);write(trigger+0x9a,'i',100000)
 write(0x890390+400,'I',head);write(head+0x24,'H',100);write(head+0x2a,'BB',5,9);write(head+0x26,'H',h['angle']);write(head+0xc,'I',0x20000);write(head+0x3d,'HH',h['x'],h['y'])
 ps=[];orders=[]
 for i in range(24):
  p=people+i*256;cpu.mem_write(p,bytes(256));ident=i+1
  x=(h['x']+rng.randrange(-4,5)*512+rng.randrange(-256,256))&65535;y=(h['y']+rng.randrange(-4,5)*512+rng.randrange(-256,256))&65535
  d=dict(id=ident,x=x,y=y,**{'class':rng.choice([1,1,1,5])},tribe=rng.choice([-1,0,1,2,3]),state=rng.choice([10,10,33,19]),substate=rng.randrange(4),speed=rng.choice([0,0,0,256,-256]),flags4=rng.choice([0,0,128,0x800]),commands=[ident]+[0]*7,commandCursor=0,immediateCommand=ident if i%2 else 0)
  order=dict(model=rng.choice([27,27,27,3]),flags=rng.choice([0,0,0,1]),a=rng.randrange(1000),b=0)
  write(p+0x24,'H',ident);write(p+0x2a,'4Bb',d['class'],2,d['state'],d['substate'],0);write(p+0x2f,'b',d['tribe']);write(p+0x3d,'HH',x,y);write(p+0x5f,'h',d['speed']);write(p+0x10,'I',d['flags4']);write(p+0x8b,'8H',*d['commands']);write(p+0x9b,'H',d['immediateCommand'])
  write(0x938830+ident*10,'BBHHHH',order['model'],order['flags'],1,0,order['a'],0)
  write(0x890390+ident*4,'I',p);cellhead=0x8a03ea+((y>>9)*128+(x>>9))*16
  write(p+0x20,'H',read(cellhead,'H'));write(cellhead,'H',ident);ps.append(d);orders.append(order)
 call(0x4fb270,trigger)
 cases.append(dict(head=h,people=ps,orders=orders,expected=list(struct.unpack('<4h',cpu.mem_read(trigger+0x86,8)))))
js="""import{countWorshippers}from'./app/worship.ts';let s='';for await(const c of process.stdin)s+=c;console.log(JSON.stringify(JSON.parse(s).map(c=>countWorshippers(c.head,{records:[{},...c.orders]},cell=>c.people.filter(p=>((p.x>>8)&254)===(cell&254)&&((p.y>>8)&254)===((cell>>8)&254))))));"""
a=json.loads(subprocess.check_output(['node','--input-type=module','-e',js],input=json.dumps(cases).encode(),cwd=ROOT))
for i,(c,v) in enumerate(zip(cases,a)):assert c['expected']==v,(i,c,v)
assert any(sum(c['expected'])>1 for c in cases)
print('PASS: 1,536 native timed-head visits; oriented/wrapped cell bounds, all four tribe counts, state/order/cancel/speed/substate eligibility')
# Native group command 113 uses the same on-foot person flag semantics as
# existing building panels. Real eligibility runs; only the roster is supplied.
cpu.hook_add(UC_HOOK_CODE,leaf,begin=0x43c600,end=0x43c600)
write(tribe+0xc22,'B',0);selection=[]
for selected,blocked,flags in itertools.product(range(8),range(8),[0,128,0x10000000,0x90000180]):
 ps=[]
 for i in range(3):
  p=people+i*256;cpu.mem_write(p,bytes(256));write(p+0x24,'H',i+1);write(p+0x2a,'BB',1,2);write(p+0x2f,'B',0)
  d=dict(id=i+1,flags4=128 if blocked&(1<<i) else 0,flags3=flags,selectionFlags=0x25|(128 if selected&(1<<i) else 0))
  write(p+0x10,'II',d['flags4'],flags);write(p+0x7a,'B',d['selectionFlags']);ps.append(d)
 write(command,'IIIBBB',0,int(not(selected&2)),100,113,0,0);call(0x43e8e0,tribe,command)
 expected=[dict(id=i+1,flags4=read(people+i*256+0x10,'I'),flags3=read(people+i*256+0x14,'I'),selectionFlags=read(people+i*256+0x7a,'B')) for i in range(3)]
 selection.append(dict(people=ps,clicked=2,expected=expected))
js="""import{selectTrainingOccupants}from'./app/training.ts';let s='';for await(const c of process.stdin)s+=c;console.log(JSON.stringify(JSON.parse(s).map(c=>{selectTrainingOccupants(c.people,c.clicked,true);return c.people})));"""
a=json.loads(subprocess.check_output(['node','--input-type=module','-e',js],input=json.dumps(selection).encode(),cwd=ROOT));assert a==[c['expected'] for c in selection]
print('PASS: 256 native head-group selection commands, selected/blocked combinations and preserved unrelated flags')
# Complete model-height consumer, including native signed truncation.
raw=(exe.parent/'objects/objs0-2.dat').read_bytes();cpu.mem_write(0x2020000,raw);write(0x895ec1,'I',0x2020000)
models=json.loads((ROOT/'app/original-models.json').read_text());heights=[]
for key,model in models.items():
 cpu.mem_write(head,bytes(256));write(head+0x2a,'BB',5,9);write(head+0x33,'h',int(key));write(head+0x3a,'B',0)
 write(0x5a6af8,'b',3)
 call(0x509000,command,head);value=read(command+8,'h');assert value==model['panelHeight'],(key,value,model['panelHeight'])
 heights.append(dict(model=int(key),height=value))
print(f'PASS: {len(heights)} native model-panel heights from original object records')
if '--record' in sys.argv:
 (ROOT/'tests/fixtures/worship-admission.json').write_text(json.dumps(dict(executableSha256=identity['sha256'],cases=cases[::11],selection=selection[::3],heights=heights),separators=(',',':'))+'\n')
