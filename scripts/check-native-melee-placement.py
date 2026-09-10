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
for mode in ['valid', 'relocate']:
    for n in range(1024):
        fight = dict(id=1, x=rng.choice([0,65535,rng.randrange(65536)]), y=rng.choice([0,65535,rng.randrange(65536)]), h=rng.randrange(-100,1000), angle=rng.randrange(2048), counter=rng.choice([0,1,31,32,63,64,255]), model=8, tribe=255, flags2=0, flags4=0, workTarget=0, target=0)
        ci = index(fight)
        # Mixed restrictions, including a valid hole in otherwise blocked terrain.
        all_blocked = mode == 'relocate' and n % 8 == 0
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
        height_calls=0
        result=call(0x51e4b0,p,out,int(c['checkOthers'])) if mode=='valid' else None
        if mode=='relocate':call(0x519d10,p,int(c['force']))
        expected.append(dict(result=result,point=[read(p+0x3d,'H'),read(p+0x3f,'H'),read(p+0x41,'h')],pool=list(cpu.mem_read(0x89290d,192)),heightCalls=height_calls))
        cases.append(c)
js = """
import {validFightSite,relocateFight} from './app/melee-placement.ts';
import {terrainPointHeight} from './app/native-terrain.ts';
import {buildingOutsidePoint} from './app/building-shapes.ts';
let s='';for await(const c of process.stdin)s+=c;const input=JSON.parse(s);
const index=p=>((p.y&65535)>>9)*128+((p.x&65535)>>9);
console.log(JSON.stringify(input.cases.map(c=>{
 const land={heights:input.heights,flags:Uint32Array.from({length:16384},(_,i)=>(i&1)|(c.blocked?4:0)),categories:new Uint8Array(16384).fill(input.landcat)};
 for(const [i,f,t] of c.patches){land.flags[i]=f;land.categories[i]=t;}
 const fight={...c.fight},ci=index(fight),search=Uint8Array.from(c.pool);let heightCalls=0;
 const w={search,height:p=>{heightCalls++;return terrainPointHeight(land,p)},outside:id=>{if(id!==3)throw Error('building mask');return buildingOutsidePoint(c.pose)},occupied:p=>index(p)===ci&&c.occupant.classId===10&&c.occupant.model===8,
 collision:{cell:p=>{const i=index(p);return {flags:land.flags[i],category:land.categories[i],building:i===ci?0xfc03:0}},objects:new Map(),boatAt:()=>false,walkMask:new Uint8Array(8192).fill(c.walk)}};
 let result=null;if(c.mode==='valid')result=Number(validFightSite(w,fight,fight,c.checkOthers));else relocateFight(w,fight,c.force);
 return {result,point:[fight.x&65535,fight.y&65535,fight.h],pool:[...search],heightCalls};
})));
"""
result = subprocess.run(['node','--input-type=module','-e',js],input=json.dumps(dict(cases=cases,heights=heights,landcat=landcat)),capture_output=True,text=True,cwd=ROOT)
assert result.returncode==0,result.stderr
actual=json.loads(result.stdout);assert len(actual)==len(expected)
for i,(a,e) in enumerate(zip(actual,expected)):
    assert a['heightCalls']<=e['heightCalls'],(i,a,e)
    if {k:v for k,v in a.items() if k!='heightCalls'}!={k:v for k,v in e.items() if k!='heightCalls'}:
        path=Path('/private/tmp/populous-melee-placement-failure.json');path.write_text(json.dumps(dict(case=cases[i],native=e,browser=a),indent=2));raise AssertionError((i,str(path)))
print(f'PASS: {len(cases):,} original fight-site validity/relocation cases, full collision/search/height/building geometry and final search bytes; no replaced consumers.')
print(f'Equivalent results with {sum(x["heightCalls"] for x in actual):,} browser height queries versus {sum(x["heightCalls"] for x in expected):,} native queries. Allocation and scheduler phase are supplied.')
