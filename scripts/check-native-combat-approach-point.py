"""Execute complete 0051c110 with original search, terrain/collision and geometry.
No consumers are replaced during comparisons. Loader I/O alone is supplied during
setup; original shape relocation and MWSEARCH.DAT are used.
Usage: python scripts/check-native-combat-approach-point.py EXE [--record]
"""
import copy,hashlib,json,random,struct,subprocess,sys
from pathlib import Path
from unicorn import UC_HOOK_CODE
from unicorn.x86_const import UC_X86_REG_ESP,UC_X86_REG_EIP,UC_X86_REG_EAX
from capstone import Cs,CS_ARCH_X86,CS_MODE_32
from decomp import native_cpu,configure_native_constants,ROOT
exe=Path(sys.argv[1]);cpu,identity=native_cpu(exe);configure_native_constants(cpu,exe)
cpu.mem_map(0x2000000,0x40000)
raw_objects,raw_shapes,base,order,out,stack,stop=0x2000000,0x2003000,0x2010000,0x2020000,0x2020100,0x203e000,0x203f000
rng=random.Random(0x51c110)
def write(a,f,*v):cpu.mem_write(a,struct.pack('<'+f,*v))
def read(a,f):return struct.unpack('<'+f,cpu.mem_read(a,struct.calcsize('<'+f)))[0]
def ptr(i):return base+i*256

def call(a,*args):
 write(stack,'I'*(len(args)+1),stop,*args);cpu.reg_write(UC_X86_REG_ESP,stack)
 cpu.emu_start(a,stop,count=10000000);assert cpu.reg_read(UC_X86_REG_EIP)==stop,hex(cpu.reg_read(UC_X86_REG_EIP))
 return cpu.reg_read(UC_X86_REG_EAX)&255
objects=(exe.parent/'objects/objs0-2.dat').read_bytes();shapes=(exe.parent/'objects/shapes.dat').read_bytes();search=(exe.parent/'data/mwsearch.dat').read_bytes()
assert hashlib.sha256(search).hexdigest()=='0c39b12d160658863c2df89aa34484dff459e48ea0b5634658b7473ca940fae0'
cpu.mem_write(raw_objects,objects);cpu.mem_write(raw_shapes,shapes);cpu.mem_write(0x8929cd,search)
write(0x895ec1,'I',raw_objects);write(0x59df3c,'I',raw_shapes)
leaves=[]
for ins in Cs(CS_ARCH_X86,CS_MODE_32).disasm(bytes(cpu.mem_read(0x40c880,144)),0x40c880):
 if ins.mnemonic=='ret':break
 if ins.mnemonic=='call':leaves.append(int(ins.op_str,16))
assert len(leaves)==2

def loader(c,a,size,user):
 sp=c.reg_read(UC_X86_REG_ESP);c.reg_write(UC_X86_REG_EAX,1);c.reg_write(UC_X86_REG_EIP,read(sp,'I'));c.reg_write(UC_X86_REG_ESP,sp+4)
hooks=[cpu.hook_add(UC_HOOK_CODE,loader,begin=a,end=a) for a in leaves];call(0x40c880)
for h in hooks:cpu.hook_del(h)
shape_data=json.loads((ROOT/'app/original-shapes.json').read_text());poses=[(i,j*512) for i,row in enumerate(shape_data['objects']) for j in range(len(row))]
def observe(c,a,size,user):
 global area_reads
 if a==0x51c1de:area_reads+=1;return
 sp=c.reg_read(UC_X86_REG_ESP)
 if a==0x4044b0:events.append(['outside',read(read(sp+4,'I')+0x24,'H')])
 else:events.append(['height',read(sp+4,'H')])
for a in [0x4044b0,0x44f600,0x51c1de]:cpu.hook_add(UC_HOOK_CODE,observe,begin=a,end=a)
fields={'id':(0x24,'H'),'class':(0x2a,'B'),'model':(0x2b,'B'),'state':(0x2c,'B'),'flags2':(0xc,'I'),'flags4':(0x10,'I'),'tribe':(0x2f,'B'),'x':(0x3d,'H'),'y':(0x3f,'H'),'workTarget':(0x89,'H'),'target':(0x72,'H'),'related':(0x92,'h'),'object':(0x33,'h'),'angle':(0x26,'H'),'anchorX':(0x7a,'H'),'anchorY':(0x7c,'H')}
cases=[];expected=[];native_area_reads=[]
for n in range(1024):
 mode=n%8
 flags=512 if mode==3 else 4 if mode in [2,7] else 0
 category=1 if mode==4 else 0
 height=100
 land=bytearray(struct.pack('<IhHHBBBBBB',flags,height,0,2|0xfc00,0,0,category,0,0,0)*16384)
 packed=rng.choice([0,1,65535,32767,32768,rng.randrange(65536)])
 width=rng.choice([0,1,2,4,255]);height_radius=rng.choice([0,1,2,4,255])
 cmd=dict(model=28 if n%5==0 else rng.choice([19,21]),flags=0,references=1,object=0,a=packed,b=width|(height_radius<<8))
 if cmd['model']==28:cmd['a']=rng.choice([0,4])
 records=[]
 for i in range(1,5):
  obj,angle=rng.choice(poses)
  rec={k:0 for k in fields};rec.update(id=i,**{'class':1 if i in [1,4] else 2},model=2,state=rng.choice([1,2]),flags2=0,tribe=i&1,
   x=rng.randrange(65536),y=rng.randrange(65536),anchorX=rng.randrange(128)*512,anchorY=rng.randrange(128)*512,object=obj,angle=angle,
   workTarget=rng.choice([0,2,3]),target=4,related=rng.choice([-1,0,2,3]))
  if i==1:rec.update(flags2=rng.choice([0,0x20000000]),flags4=rng.choice([0,1,2,4,0x10000,0x10007]))
  if i==4:rec.update(flags2=rng.choice([0,0,1]),**{'class':rng.choice([0,1,1])})
  records.append(rec)
 patches=[]
 def patch(cell,flag,cat=0,building=2,h=100):
  index=(cell>>9)*128+((cell&254)>>1);struct.pack_into('<IhHHBBBBBB',land,index*16,flag,h,0,building,0,0,cat,0,0,0);patches.append([index,flag,cat,building,h])
 if mode==1:patch(packed,4)
 if mode==5:
  patch(packed,512,0,2|0xfc00)
  if n&8:patch(((records[0]['x']>>8)&254)|(records[0]['y']&0xfe00),512,0,2)
 if mode==6:
  for y in range(-3,4):
   for x in range(-3,4):
    cell=(((packed&255)+x*2)&255)|((((packed>>8)+y*2)&255)<<8)
    patch(cell,rng.choice([0,4,512]),rng.choice([0,1,3]),rng.choice([2,3,0xfc02]),rng.choice([-32768,0,100,32767]))
 if cmd['model']==28 and n&8:patch(((records[3]['x']>>8)&254)|(records[3]['y']&0xfe00),512,0,3|0xfc00)
 pool=[rng.randrange(256) for _ in range(192)]
 for i in range(16):pool[i*12]=int(mode==7 or i<=n%4)
 case=dict(mode=mode,flags=flags,category=category,height=height,patches=patches,records=records,order=cmd,search=pool,limit=rng.choice([-1,0,64,32767]))
 cpu.mem_write(0x8a03e4,bytes(land));cpu.mem_write(0x89290d,bytes(pool));write(0x5aa450,'i',case['limit'])
 for rec in records:
  a=ptr(rec['id']);cpu.mem_write(a,bytes(256));write(0x890390+rec['id']*4,'I',a)
  for k,(off,f) in fields.items():write(a+off,f,rec[k])
 write(order,'BBHHHH',*[cmd[k] for k in ['model','flags','references','object','a','b']]);events=[];area_reads=0
 result=call(0x51c110,ptr(1),order,out)
 expected.append(dict(point=dict(x=read(out,'H'),y=read(out+2,'H'),kind=result),search=list(cpu.mem_read(0x89290d,192)),events=copy.deepcopy(events)))
 cases.append(case);native_area_reads.append(area_reads)
js="""
import {findCombatApproachPoint} from './app/combat-order-search.ts';import {buildingOutsidePoint} from './app/building-shapes.ts';import {terrainCellHeightRange} from './app/native-terrain.ts';
let text='';for await(const c of process.stdin)text+=c;
console.log(JSON.stringify(JSON.parse(text).map(c=>{
 const flags=new Uint32Array(16384).fill(c.flags),categories=new Uint8Array(16384).fill(c.category),buildingIds=new Uint16Array(16384).fill(0xfc02),heights=new Int16Array(16384).fill(c.height);
 for(const [i,f,cat,b,h] of c.patches){flags[i]=f;categories[i]=cat;buildingIds[i]=b;heights[i]=h;}
 const objects=new Map(c.records.map(p=>[p.id,p])),search=Uint8Array.from(c.search),events=[];
 let cellReads=0;const collision={cell:p=>{cellReads++;const i=(p.y>>9)*128+(p.x>>9);return {flags:flags[i],category:categories[i],building:buildingIds[i]};},objects,walkMask:[],boatAt:()=>{throw Error("Unexpected boat lookup in whole-cell approach query")}};
 const point=findCombatApproachPoint(c.records[0],c.order,{collision,search,landLimit:c.limit,heightRange:cell=>{events.push(['height',cell]);return terrainCellHeightRange({heights},cell);},outside:id=>{events.push(['outside',id]);return buildingOutsidePoint(objects.get(id));}});
 return {point,search:[...search],events,cellReads};})));
"""
r=subprocess.run(['node','--input-type=module','-e',js],input=json.dumps(cases),capture_output=True,text=True,cwd=ROOT);assert r.returncode==0,r.stderr
actual=json.loads(r.stdout)
native_full_reads=0;modern_full_reads=0
for i,(a,b) in enumerate(zip(actual,expected)):
 reads=a.pop('cellReads')
 if cases[i]['mode']==3 and cases[i]['order']['model']!=28:
  native_full_reads+=native_area_reads[i];modern_full_reads+=reads-1
 if a!=b:
  path=Path('/private/tmp/populous-combat-point-failure.json');path.write_text(json.dumps(dict(case=cases[i],native=b,browser=a),indent=2));raise AssertionError((i,str(path)))
assert len(actual)==len(expected)
assert modern_full_reads<native_full_reads
print('Fully occupied area probes:',dict(native=native_full_reads,modern=modern_full_reads))
print('PASS: 1024 complete native approach queries, original collision/height, building entrances, indexed searches and all search pool bytes; no replaced comparison consumers')
if '--record' in sys.argv:(ROOT/'tests/fixtures/combat-approach-point.json').write_text(json.dumps(dict(identity=identity,cases=[dict(input=cases[i],expected=expected[i]) for i in range(0,len(cases),7)]),separators=(',',':'))+'\n')
