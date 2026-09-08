"""Compare native hut maturity decisions and entrance-cell timber counting.
The full 0x4050c0 executes with wood availability and order/allocation consumers
supplied. Replacement allocation is intentionally refused; successful replacement
and linked worker ownership are outside this decision oracle.
Usage: python scripts/check-native-hut-upgrade.py EXE
"""
import json,random,struct,subprocess,sys
from pathlib import Path
from unicorn import UC_HOOK_CODE
from unicorn.x86_const import UC_X86_REG_ESP,UC_X86_REG_EIP,UC_X86_REG_EAX
from decomp import native_cpu,load_native_shapes,configure_native_constants,ROOT
exe=Path(sys.argv[1]);cpu,identity=native_cpu(exe);configure_native_constants(cpu,exe);cpu.mem_map(0x2000000,0x40000)
load_native_shapes(cpu,exe,0x2000000,0x2004000)
building,person,record,stack,stop=0x2010000,0x2011000,0x2012000,0x203d000,0x203e000
rng=random.Random(0x4050c0)
def write(a,f,*v):cpu.mem_write(a,struct.pack('<'+f,*v))
def read(a,f):return struct.unpack('<'+f,cpu.mem_read(a,struct.calcsize('<'+f)))[0]
def call(a,*args):
 write(stack,'I'*(len(args)+1),stop,*args);cpu.reg_write(UC_X86_REG_ESP,stack)
 cpu.emu_start(a,stop,count=100000);assert cpu.reg_read(UC_X86_REG_EIP)==stop,hex(cpu.reg_read(UC_X86_REG_EIP))
def hook(c,a,size,user):
 global action,queries
 sp=c.reg_read(UC_X86_REG_ESP);value=0
 if a==0x40b4f0:queries+=1;value=case['missing']
 elif a==0x4ed8a0:action='upgrade'
 elif a==0x436b90:value=1
 elif a==0x4935c0:
  action='fetch';write(read(sp+4,'I'),'b',-1)
 c.reg_write(UC_X86_REG_EAX,value);c.reg_write(UC_X86_REG_EIP,read(sp,'I'));c.reg_write(UC_X86_REG_ESP,sp+4)
for a in [0x40b4f0,0x4ed8a0,0x436b90,0x4935c0]:cpu.hook_add(UC_HOOK_CODE,hook,begin=a,end=a)
write(0x890390+4,'I',person);write(person+0x2a,'BB',1,2)
cases=[];expected=[]
for level in [1,2,3]:
 for counter in [0,1,15,16,32,112,127,128,144,240,255]:
  for occupants in [0,1,3,6,127,128,255]:
   for work in [0,1775,1776,1792,2376,2392,2400,32767,-32768]:
    case=dict(level=level,counter=counter,occupants=occupants,upgrade=work,missing=rng.choice([0,1,100,300]),woodUnavailable=bool(rng.randrange(2)))
    cpu.mem_write(building,bytes(256));write(building+0x2a,'BB',2,level);write(building+0x2e,'B',counter)
    write(building+0x33,'h',130+level);write(building+99,'h',130+level)
    write(building+0x14,'I',4096 if case['woodUnavailable'] else 0)
    write(building+0xa0,'h',work);write(building+0xa6,'B',occupants);write(building+0x86,'H',1)
    write(0x892443,'I',record);action=None;queries=0;call(0x4050c0,building)
    expected.append(dict(upgrade=read(building+0xa0,'h'),woodUnavailable=bool(read(building+0x14,'I')&4096),action=action,queries=queries));cases.append(case)
js="""import {stepHutUpgrade} from './app/hut-upgrade.ts';let s='';for await(const c of process.stdin)s+=c;
console.log(JSON.stringify(JSON.parse(s).map(c=>{const b={...c};let queries=0;const action=stepHutUpgrade(b,c.occupants,()=>{queries++;return c.missing});return {upgrade:b.upgrade,woodUnavailable:b.woodUnavailable,action,queries}})));"""
r=subprocess.run(['node','--input-type=module','-e',js],input=json.dumps(cases),capture_output=True,text=True,cwd=ROOT);assert r.returncode==0,r.stderr
actual=json.loads(r.stdout);assert len(actual)==len(expected)
for i,(a,e) in enumerate(zip(actual,expected)):assert a==e,(i,cases[i],a,e)
print(f'PASS: {len(cases)} complete native maturity decisions, signed work/occupants, 16/128-turn phases, wood lookup order, blocked-wood flag and fetch/upgrade requests')
if '--record' in sys.argv:
 selected=[i for i,c in enumerate(cases) if c['counter'] in [0,1,16,128] and c['occupants'] in [0,1,3,128]]
 (ROOT/'tests/fixtures/hut-upgrade.json').write_text(json.dumps(dict(executableSha256=identity['sha256'],cases=[cases[i] for i in selected],expected=[expected[i] for i in selected]),separators=(',',':'))+'\n')

# Cell-list resource count: native descriptor flag at +20 differs from the
# separate renderer flag byte +21. Trees and logs both qualify in this cell.
wood_cases=[];wood_expected=[]
write(0x890390,'I',0)
for index in range(256):
 point=dict(x=rng.randrange(65536),y=rng.randrange(65536));items=[];linked=[]
 for n in range(20):
  item=dict(x=(point['x']&0xfe00)+rng.randrange(512),y=(point['y']&0xfe00)+rng.randrange(512),model=n,wood=rng.randrange(-32768,32768))
  if n%3==0:item['x']=(item['x']+512)&65535
  items.append(item)
  if (item['x']>>9,item['y']>>9)!=(point['x']>>9,point['y']>>9):continue
  p=0x2020000+n*256;cpu.mem_write(p,bytes(256));write(p+0x2a,'BB',5,n);write(p+0x84,'h',item['wood'])
  write(0x890390+(n+2)*4,'I',p);linked.append((n+2,p))
 for n,(id,p) in enumerate(linked):write(p+0x20,'H',linked[n+1][0] if n+1<len(linked) else 0)
 cell=(point['y']>>9)*128+(point['x']>>9);write(0x8a03e4+cell*16+6,'h',linked[0][0] if linked else 0)
 write(record,'HH',point['x'],point['y']);call(0x4a77d0,record)
 value=cpu.reg_read(UC_X86_REG_EAX);wood_expected.append(value if value<0x80000000 else value-0x100000000);wood_cases.append(dict(point=point,items=items))
js="""import {looseWoodInCell} from './app/hut-upgrade.ts';let s='';for await(const c of process.stdin)s+=c;console.log(JSON.stringify(JSON.parse(s).map(c=>looseWoodInCell(c.point,c.items))));"""
r=subprocess.run(['node','--input-type=module','-e',js],input=json.dumps(wood_cases),capture_output=True,text=True,cwd=ROOT);assert r.returncode==0,r.stderr
assert json.loads(r.stdout)==wood_expected
print('PASS: 256 complete native entrance-cell wood totals, all 20 scenery models, signed amounts and adjacent-cell exclusion')
if '--record' in sys.argv:
 path=ROOT/'tests/fixtures/hut-upgrade.json';fixture=json.loads(path.read_text());fixture.update(woodCases=wood_cases[:16],woodExpected=wood_expected[:16]);path.write_text(json.dumps(fixture,separators=(',',':'))+'\n')
