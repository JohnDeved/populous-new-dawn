"""Fight-site validity and relocation against the locked original executable.
Usage: python scripts/check-native-melee-placement.py /path/to/d3dpoptb.exe
Runs original terrain, collision, search, building geometry and cell movement.
No native consumers are replaced. Allocation/scheduler phase is supplied.
"""
import hashlib, json, random, struct, subprocess, sys
from pathlib import Path
from unicorn import UC_HOOK_CODE
from unicorn.x86_const import UC_X86_REG_ESP, UC_X86_REG_EIP, UC_X86_REG_EAX
from decomp import native_cpu, configure_native_constants, load_native_shapes, ROOT
exe = Path(sys.argv[1]); cpu, _ = native_cpu(exe); configure_native_constants(cpu, exe)
cpu.mem_map(0x2000000, 0x200000)
p, other, building, out, stack, stop = 0x2000000, 0x2000100, 0x2000200, 0x2000400, 0x201e000, 0x201f000
load_native_shapes(cpu, exe, 0x2020000, 0x2100000)
data = (exe.parent / 'data/mwsearch.dat').read_bytes()
assert hashlib.sha256(data).hexdigest() == '0c39b12d160658863c2df89aa34484dff459e48ea0b5634658b7473ca940fae0'
cpu.mem_write(0x8929cd, data)
rng = random.Random(0x519d10)
def write(a, f, *v): cpu.mem_write(a, struct.pack('<' + f, *v))
def read(a, f): return struct.unpack('<' + f, cpu.mem_read(a, struct.calcsize('<' + f)))[0]
def call(a, *args):
    write(stack, 'I' * (len(args) + 1), stop, *[x & 0xffffffff for x in args]); cpu.reg_write(UC_X86_REG_ESP, stack)
    cpu.emu_start(a, stop, count=3000000)
    assert cpu.reg_read(UC_X86_REG_EIP) == stop, hex(cpu.reg_read(UC_X86_REG_EIP))
    return cpu.reg_read(UC_X86_REG_EAX) & 255

def index(q): return ((q['y'] & 65535) >> 9) * 128 + ((q['x'] & 65535) >> 9)
def count_height(c, a, size, user):
    global height_calls
    height_calls += 1
cpu.hook_add(UC_HOOK_CODE, count_height, begin=0x44e940, end=0x44e940)
write(0x96aa74, 'I', 0x96aaba)
write(0x890390, '4I', 0, p, other, building)
rules = json.loads((ROOT / 'app/original-rules.json').read_text())
landcat = next(i for i, f in enumerate(rules['terrainCategoryFlags']) if f & 1)
heights = [rng.randrange(-128, 1025) for _ in range(16384)]
base = b''.join(struct.pack('<IhHHBBBBBB', i & 1, h, 0, 0, 0, 0, landcat, 0, 0, 0) for i, h in enumerate(heights))
blocked = b''.join(struct.pack('<IhHHBBBBBB', (i & 1) | 4, h, 0, 0, 0, 0, landcat, 0, 0, 0) for i, h in enumerate(heights))
fields = {'id':(0x24,'H'), 'angle':(0x26,'h'), 'counter':(0x2e,'B'), 'model':(0x2b,'B'), 'tribe':(0x2f,'B'), 'flags2':(0xc,'I'), 'flags4':(0x10,'I'), 'x':(0x3d,'H'), 'y':(0x3f,'H'), 'h':(0x41,'h')}
cases, expected = [], []
for mode in ['valid', 'relocate', 'waiting']:
    for n in range(1024):
        fight = dict(id=1, x=rng.choice([0,65535,rng.randrange(65536)]), y=rng.choice([0,65535,rng.randrange(65536)]), h=rng.randrange(-100,1000), angle=rng.randrange(2048), counter=rng.choice([0,1,31,32,63,64,255]), model=8, tribe=255, flags2=0, flags4=0, workTarget=0, target=0)
        ci = index(fight)
        # Mixed restrictions, including a valid hole in otherwise blocked terrain.
        all_blocked = mode != 'valid' and n % 8 == 0
        patches = []
        for dy in range(-2,3):
            for dx in range(-2,3):
                j = (((ci // 128 + dy) & 127) * 128 + ((ci % 128 + dx) & 127))
                patches.append([j, rng.choice([0,0,2,4]) | (j&1), rng.choice([landcat,landcat,landcat,0])])
        patches.append([ci, [0,2,4,512,0x206,0x4000,0,0][n%8] | (ci&1), n%16 if mode=='valid' else landcat])
        if all_blocked:
            patches = [] if n%16==0 else [[((ci//128+5)&127)*128+((ci%128+3)&127),0,landcat]]
        pool = [rng.randrange(256) for _ in range(192)]
        for j in range(16): pool[j*12] = 1 if n%11==0 else 0
        pose = dict(object=131 + n%6, angle=(n%4)*512, anchorX=fight['x']&0xfe00, anchorY=fight['y']&0xfe00)
        occupant = dict(classId=10 if n%3 else 1, model=8 if n%4 else 7)
        c = dict(mode=mode,fight=fight,blocked=all_blocked,patches=patches,pool=pool,pose=pose,occupant=occupant,checkOthers=bool(n%2),force=bool(n%3),walk=0 if n%13==0 else 255)
        c['randomState']=rng.getrandbits(32)
        c['center']=dict(x=(fight['x']+rng.randrange(-1000,1001))&65535,y=(fight['y']+rng.randrange(-1000,1001))&65535)
        c['occupants']=[dict(x=fight['x'],y=fight['y'])]
        if mode=='waiting' and n%4==1:
            c['center']=dict(x=(fight['x']-448)&65535,y=fight['y'])
        if mode=='waiting' and n%16==3:
            patches.clear();c['walk']=255
            c['center']=dict(x=(fight['x']-448)&65535,y=fight['y'])
        write(0x89d178,'I',c['randomState'])
        if mode=='waiting':
            fight['model']=2
            fight['tribe']=0
        cpu.mem_write(0x8a03e4, blocked if all_blocked else base)
        cpu.mem_write(0x96aaba, bytes([c['walk']])*8192)
        cpu.mem_write(0x89290d, bytes(pool))
        for j, flags, cat in patches:
            write(0x8a03e4+j*16, 'I', flags); write(0x8a03e4+j*16+12, 'B', cat)
        write(0x8a03e4+ci*16+6, '2H', 1, 0xfc03)
        for a in [p,other,building]: cpu.mem_write(a,bytes(256))
        for k,(off,f) in fields.items(): write(p+off,f,fight[k])
        write(p+0x2a,'B',10); write(p+0x20,'H',2)
        write(other+0x22,'2H',1,2);write(other+0x2a,'2B',occupant['classId'],occupant['model'])
        write(other+0x3d,'2H',fight['x'],fight['y'])
        write(building+0x24,'2H',3,pose['angle']);write(building+0x33,'H',pose['object']);write(building+0x7a,'2H',pose['anchorX'],pose['anchorY'])
        write(out,'HHh',fight['x'],fight['y'],fight['h'])
        if mode=='waiting' and n%16==3:
            # Fill all 32 first-pass positions; the second pass must permit overlap.
            for k in range(32):
                i=k+1;angle=(512+(i//2)*(-64 if i&1 else 64))&2047
                write(out,'HH',c['center']['x'],c['center']['y']);call(0x4e6a70,out,angle,448)
                q=dict(x=read(out,'H'),y=read(out+2,'H'));c['occupants'].append(q)
                j=index(q);a=0x2000600+k*256;id_=k+4
                cpu.mem_write(a,bytes(256));write(0x890390+id_*4,'I',a)
                write(a+0x20,'H',read(0x8a03e4+j*16+6,'H'));write(a+0x24,'H',id_)
                write(a+0x2a,'B',1);write(a+0x3d,'HH',q['x'],q['y']);write(0x8a03e4+j*16+6,'H',id_)
        height_calls=0
        result=call(0x51e4b0,p,out,int(c['checkOthers'])) if mode=='valid' else None
        if mode=='relocate':call(0x519d10,p,int(c['force']))
        if mode=='waiting':
            cpu.mem_write(out+16,bytes(256));write(out+16+0x3d,'HH',c['center']['x'],c['center']['y'])
            call(0x51f750,out+16,p,out)
            result=[read(out,'H'),read(out+2,'H')]
        expected.append(dict(randomState=read(0x89d178,'I'),result=result,point=[read(p+0x3d,'H'),read(p+0x3f,'H'),read(p+0x41,'h')],pool=list(cpu.mem_read(0x89290d,192)),heightCalls=height_calls))
        cases.append(c)
js = """
import {validFightSite,relocateFight,fightWaitingPosition} from './app/melee-placement.ts';
import {terrainPointHeight} from './app/native-terrain.ts';
import {buildingOutsidePoint} from './app/building-shapes.ts';
let s='';for await(const c of process.stdin)s+=c;const input=JSON.parse(s);
const index=p=>((p.y&65535)>>9)*128+((p.x&65535)>>9);
console.log(JSON.stringify(input.cases.map(c=>{
 const land={heights:input.heights,flags:Uint32Array.from({length:16384},(_,i)=>(i&1)|(c.blocked?4:0)),categories:new Uint8Array(16384).fill(input.landcat)};
 for(const [i,f,t] of c.patches){land.flags[i]=f;land.categories[i]=t;}
 const fight={...c.fight},ci=index(fight),search=Uint8Array.from(c.pool);let heightCalls=0;
 const w={randomState:c.randomState,search,height:p=>{heightCalls++;return terrainPointHeight(land,p)},outside:id=>{if(id!==3)throw Error('building mask');return buildingOutsidePoint(c.pose)},occupied:p=>c.mode==='waiting'?c.occupants.some(q=>p.x===q.x&&p.y===q.y):index(p)===ci&&c.occupant.classId===10&&c.occupant.model===8,
 collision:{cell:p=>{const i=index(p);return {flags:land.flags[i],category:land.categories[i],building:i===ci?0xfc03:0}},objects:new Map(),boatAt:()=>false,walkMask:new Uint8Array(8192).fill(c.walk)}};
 let result=null;if(c.mode==='valid')result=Number(validFightSite(w,fight,fight,c.checkOthers));else if(c.mode==='relocate')relocateFight(w,fight,c.force);else {const p=fightWaitingPosition(w,fight,c.center);result=[p.x,p.y];}
 return {randomState:w.randomState,result,point:[fight.x&65535,fight.y&65535,fight.h],pool:[...search],heightCalls};
})));
"""
result = subprocess.run(['node','--input-type=module','-e',js],input=json.dumps(dict(cases=cases,heights=heights,landcat=landcat)),capture_output=True,text=True,cwd=ROOT)
assert result.returncode==0,result.stderr
actual=json.loads(result.stdout);assert len(actual)==len(expected)
for i,(a,e) in enumerate(zip(actual,expected)):
    assert a['heightCalls']<=e['heightCalls'],(i,a,e)
    if {k:v for k,v in a.items() if k!='heightCalls'}!={k:v for k,v in e.items() if k!='heightCalls'}:
        path=Path('/private/tmp/populous-melee-placement-failure.json');path.write_text(json.dumps(dict(case=cases[i],native=e,browser=a),indent=2));raise AssertionError((i,str(path)))
print(f'PASS: {len(cases):,} original fight-site validity/relocation/waiting cases, full collision/search/height/building geometry and final search bytes; no replaced consumers.')
print(f'Equivalent results with {sum(x["heightCalls"] for x in actual):,} browser height queries versus {sum(x["heightCalls"] for x in expected):,} native queries. Allocation and scheduler phase are supplied.')
for mode in ['valid','relocate','waiting']:
    indices=[i for i,c in enumerate(cases) if c['mode']==mode]
    print(f'{mode}: {sum(actual[i]["heightCalls"] for i in indices)} browser / {sum(expected[i]["heightCalls"] for i in indices)} native height queries')
if '--record' in sys.argv:
    captures=[]
    for i in range(2048,len(cases),23):
        c=cases[i]
        captures.append(dict(input={**{k:c[k] for k in ['fight','center','blocked','patches','walk','occupants','randomState']},'landcat':landcat},expected=dict(point=expected[i]['result'],randomState=expected[i]['randomState'])))
    (ROOT/'tests/fixtures/fight-waiting.json').write_text(json.dumps(captures,separators=(',',':'))+'\n')
