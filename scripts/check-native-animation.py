"""Compare full native object/person setters and both animation allocation lists.
Usage: python scripts/check-native-animation.py /path/to/d3dpoptb.exe
Frame counts come from the supplied VFRA/VSTART chains. Morph duration inputs
are supplied at the loaded-table boundary; only footprint emission is stubbed.
"""
import json,random,struct,subprocess,sys
from pathlib import Path
from unicorn import UC_HOOK_CODE
from unicorn.x86_const import UC_X86_REG_ESP,UC_X86_REG_EIP
from decomp import native_cpu,configure_native_constants

root=Path(__file__).resolve().parents[1];exe=Path(sys.argv[1]);cpu,_=native_cpu(exe)
configure_native_constants(cpu,exe);cpu.mem_map(0x2000000,0x20000)
p,stack,stop,counts=0x2000000,0x201d000,0x201e000,0x2008000
rng=random.Random(0x4ee7b0);rules=json.loads((root/'app/original-rules.json').read_text())
def write(a,f,*v):cpu.mem_write(a,struct.pack('<'+f,*v))
def read(a,f):return struct.unpack('<'+f,cpu.mem_read(a,struct.calcsize('<'+f)))[0]
def call(a,*args):
 write(stack,'I'*(len(args)+1),stop,*[x&0xffffffff for x in args]);cpu.reg_write(UC_X86_REG_ESP,stack)
 cpu.emu_start(a,stop,timeout=1000000,count=1000000)
 assert cpu.reg_read(UC_X86_REG_EIP)==stop,hex(cpu.reg_read(UC_X86_REG_EIP))

starts=list(struct.iter_unpack('<HH',(exe.parent/'data/vstart-0.ani').read_bytes()))
frames=list(struct.iter_unpack('<HBBBBH',(exe.parent/'data/vfra-0.ani').read_bytes()))
frame_counts=[]
for start,_ in starts:
 frame=start;seen=set()
 while frame and frame not in seen:
  assert frame<len(frames);seen.add(frame);frame=frames[frame][-1]
 assert frame in [0,start],(start,frame)
 frame_counts.append(len(seen)&255)
model_frames=list(map(list,struct.iter_unpack('<10B',(exe.parent/'data/aniob0-0.dat').read_bytes())))
durations=[rng.randrange(0,200) for _ in model_frames]
data=dict(frameCounts=frame_counts,modelFrames=model_frames,morphDurations=durations)
write(0x59df44,'I',counts)
for i,n in enumerate(frame_counts):write(counts+i*6+1,'B',n)
cpu.mem_write(0x5aa118,(exe.parent/'data/aniob0-0.dat').read_bytes())
for i,n in enumerate(durations):
 write(0x87cc08+i*0x170+4,'H',0);write(0x87ccae+i*0x170,'H',n)

fields={'object':(0x33,'H'),'renderFlags':(0x35,'H'),'f1':(0x37,'h'),'f2':(0x39,'B'),
 'draw':(0x3a,'B'),'morph':(0x3b,'B'),'palette':(0x3c,'B'),'stamp':(0x18,'I'),
 'flags3':(0x14,'I'),'morphTimer':(0x72,'h'),'morphFrames':(0x71,'B'),
 'model':(0x2b,'B'),'state':(0x2c,'B'),'flags2':(0xc,'I'),'flags4':(0x10,'I'),
 'assignment':(0x76,'H'),'tribe':(0x2f,'B'),'vehicle':(0x9f,'H')}
def put(u,a=p):
 cpu.mem_write(a,bytes(256))
 for k,(off,f) in fields.items():write(a+off,f,u[k])
def get(a=p):return {k:read(a+off,f) for k,(off,f) in fields.items()}
def person(draw):
 return dict(object=rng.choice([0,40,72,216,424,1099,1108,1180,1194,1240,1264,1304,1616]),
  renderFlags=rng.choice([0,2,0x400,0x800,0xc00,0x1000,0x1800]),f1=rng.choice([-32768,-1,0,1,3,4,15,16,31,32767]),
  f2=rng.choice([0,1,7,254,255]),draw=draw,morph=rng.randrange(len(model_frames)),palette=rng.randrange(256),
  stamp=rng.randrange(2),flags3=rng.choice([0,0x40000]),morphTimer=rng.choice([-32768,-1,0,3,4,32767]),
  morphFrames=rng.randrange(256),model=rng.randrange(2,8),state=rng.choice([10,11,14,33,41]),
  flags2=rng.choice([0,0x80000]),flags4=rng.choice([0,0x800,0x1000,0x1800,0x800000,0x801800]),
  assignment=rng.choice([0,128,512,640]),tribe=rng.randrange(4),vehicle=rng.choice([0,1]))
actions=[]
def footprints(cpu,address,size,user):
 sp=cpu.reg_read(UC_X86_REG_ESP);actions.append((read(sp+4,'I')-p)//256)
 cpu.reg_write(UC_X86_REG_EIP,read(sp,'I'));cpu.reg_write(UC_X86_REG_ESP,sp+4)
# Resolve the named consumer from the retained metadata rather than guessing it.
import re
metadata=(root/'.tools/decomp/pop3-rev/backup/backup.xml').read_text()
address=int(re.search(r'<SYMBOL ADDRESS="([0-9a-f]+)" NAME="set_unit_footprints"',metadata)[1],16)
cpu.hook_add(UC_HOOK_CODE,footprints,begin=address,end=address)
def compare(kind,cases,expected):
 js="""import {setAnimationObject,setPersonAnimation,stepObjectAnimation,stepAnimations} from './app/animation.ts';
 let s='';for await(const c of process.stdin)s+=c;const {kind,cases,data}=JSON.parse(s);
 console.log(JSON.stringify(cases.map(c=>{
  const actions=[];
  if(kind==='set'){setAnimationObject(c.p,c.draw,c.object);return c.p;}
  if(kind==='upper'){c.w.objects=new Map(c.w.objects);setPersonAnimation(c.p,c.object,c.w,data);return c.p;}
  if(kind==='step'){stepObjectAnimation(c.p,c.w,data,()=>actions.push(0));return {p:c.p,actions};}
  const out=[];for(const w of c.timeline){stepAnimations(c.lists,w.landFlags,w,data,u=>actions.push(c.lists.flat().indexOf(u)));out.push({people:structuredClone(c.lists.flat()),actions:actions.splice(0)});}return out;
 })));"""
 r=subprocess.run(['node','--input-type=module','-e',js],input=json.dumps(dict(kind=kind,cases=cases,data=data)),text=True,capture_output=True,cwd=root)
 assert r.returncode==0,r.stderr
 actual=json.loads(r.stdout);assert len(actual)==len(expected)
 for i,(a,b) in enumerate(zip(expected,actual)):
  if a!=b:
   dest=Path('/private/tmp/populous-animation-failure.json');dest.write_text(json.dumps(dict(kind=kind,case=cases[i],native=a,browser=b),indent=2));raise AssertionError((kind,i,str(dest)))
 print(f'PASS: {len(cases):,} native {kind} animation comparisons',flush=True)

cases=[];expected=[]
for draw in range(40):
 for _ in range(48):
  u=person(draw);obj=rng.randrange(65536);put(u);call(0x4ee700,p+0x33,draw,obj)
  cases.append(dict(p=u,draw=draw,object=obj));expected.append(get())
compare('set',cases,expected)

cases=[];expected=[]
for draw in range(40):
 for _ in range(64):
  u=person(draw)
  if rules['animationDescriptors'][draw]['mode']==2:u['object']=rng.choice([0,40,72,216,424,1616])
  w=dict(counter=rng.randrange(2),levelFlags=rng.choice([0,8]),levelFlags2=rng.choice([0,0x10000]))
  put(u);actions=[];write(0x897981,'I',w['counter']);write(0x895da8,'I',w['levelFlags']);write(0x895da4,'I',w['levelFlags2']);call(0x4ee7b0,p)
  cases.append(dict(p=u,w=w));expected.append(dict(p=get(),actions=actions))
compare('step',cases,expected)

cases=[];expected=[]
for trial in range(2048):
 u=person(14);obj=rng.randrange(161)
 w=dict(playerTribe=trial%4,gameFlags=rng.choice([0,2]),sessionSubstate=rng.choice([None,0,1,2,255]),
  tribes=[dict(flags=rng.choice([0,8,0x80000,0x80008]),playerType=rng.choice([0,1,2])) for _ in range(4)],
  objects=[[1,dict(flags2=0,**{'class':4},passenger=rng.choice([0,2]),speed=0)],
   [2,dict(flags2=rng.choice([0,1]),**{'class':rng.choice([0,1])},passenger=0,speed=rng.choice([-1,0,1,128]))]])
 put(u);write(0x89c6f0,'b',w['playerTribe']);write(0x89d17c,'I',w['gameFlags'])
 write(0x89d178+0xcd8f8,'I',p+1024 if w['sessionSubstate'] is not None else 0)
 write(p+1024+0x2d,'B',w['sessionSubstate'] or 0)
 for i,t in enumerate(w['tribes']):write(0x89d1c8+i*0xc65+0x93d,'I',t['flags']);write(0x89d1c8+i*0xc65+0xc1f,'B',t['playerType'])
 for id_,o in w['objects']:
  a=p+id_*256;cpu.mem_write(a,bytes(256));write(0x890390+id_*4,'I',a)
  write(a+0xc,'I',o['flags2']);write(a+0x2a,'B',o['class']);write(a+0x7a,'H',o['passenger']);write(a+0x5f,'h',o['speed'])
 call(0x4d4040,p,obj);cases.append(dict(p=u,object=obj,w=w));expected.append(get())
compare('upper',cases,expected)

cases=[];expected=[]
for trial in range(64):
 people=[person(draw) for draw in [1,3,4,13,14,18,37,39]]
 for i,u in enumerate(people):
  if u['draw'] in [13,14,18]:u['object']=[0,40,216][i-3]
  put(u,p+i*256);write(p+i*256+4,'I',p+(i+1)*256 if i not in [3,7] else 0)
 write(0x890324,'I',p);write(0x890330,'I',p+4*256)
 timeline=[];out=[]
 for tick in range(64):
  w=dict(counter=tick,levelFlags=rng.choice([0,8]),levelFlags2=rng.choice([0,0x10000]),landFlags=rng.choice([0,0,0,2]))
  timeline.append(w);write(0x897981,'I',tick);write(0x895da8,'I',w['levelFlags']);write(0x895da4,'I',w['levelFlags2']);write(0x89c661,'I',w['landFlags'])
  actions=[];call(0x4ee770);out.append(dict(people=[get(p+i*256) for i in range(8)],actions=actions))
 cases.append(dict(lists=[people[:4],people[4:]],timeline=timeline));expected.append(out)
compare('lists',cases,expected)
print('PASS: 4,096 native list updates over eight objects, including paused lists; supplied morph duration table and footprint consumer')
