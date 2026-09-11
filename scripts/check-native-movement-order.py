"""Compare 0x438730 for command 3, including native coastal correction.
Usage: python scripts/check-native-movement-order.py /path/to/d3dpoptb.exe
Only the building outside-point lookup is supplied (geometry has its own oracle).
"""
import json, random, struct, subprocess, sys
from pathlib import Path
from unicorn import UC_HOOK_CODE
from unicorn.x86_const import UC_X86_REG_ESP, UC_X86_REG_EIP
from decomp import native_cpu, configure_native_constants
root = Path(__file__).resolve().parents[1]
cpu, identity = native_cpu(Path(sys.argv[1])); configure_native_constants(cpu, Path(sys.argv[1]))
cpu.mem_map(0x2000000, 0x10000)
point, stack, stop, order = 0x2000000, 0x200e000, 0x200f000, 0x93883a
rng = random.Random(0x438730)
def write(a, f, *v): cpu.mem_write(a, struct.pack('<' + f, *v))
def read(a, f): return struct.unpack('<' + f, cpu.mem_read(a, struct.calcsize('<' + f)))
def outside(cpu, address, size, user):
    sp = cpu.reg_read(UC_X86_REG_ESP); target, result = read(sp + 4, 'II')
    assert target == 0x2001000
    write(result, 'HH', case['outside']['x'], case['outside']['y'])
    cpu.reg_write(UC_X86_REG_ESP, sp + 4); cpu.reg_write(UC_X86_REG_EIP, read(sp, 'I')[0])
cpu.hook_add(UC_HOOK_CODE, outside, begin=0x4044b0, end=0x4044b0)
write(0x890390 + 100 * 4, 'I', 0x2001000)
cases = []
for i in range(1024):
    x, y = rng.randrange(65536), rng.randrange(65536)
    before = dict(model=3 if i % 7 == 0 else 0, flags=rng.randrange(256), references=1, object=0, a=x, b=y)
    case = dict(before=before, point=dict(x=x, y=y), flags=rng.randrange(256), category=i % 16,
                building=bool(i & 16), outside=dict(x=rng.randrange(65536), y=rng.randrange(65536)))
    cell = (y >> 9) * 128 + (x >> 9)
    write(order, 'BBHHHH', *[before[k] for k in ['model','flags','references','object','a','b']])
    write(point, 'HH', x, y)
    write(0x8a03e4 + cell * 16, 'I', 512 if case['building'] else 0)
    write(0x8a03e4 + cell * 16 + 8, 'H', 100)
    write(0x8a03e4 + cell * 16 + 12, 'B', case['category'])
    write(stack, 'IIIII', stop, 1, 3, point, case['flags'])
    cpu.reg_write(UC_X86_REG_ESP, stack); cpu.emu_start(0x438730, stop, count=10000)
    assert cpu.reg_read(UC_X86_REG_EIP) == stop
    case['expected'] = dict(zip(['model','flags','references','object','a','b'], read(order, 'BBHHHH')))
    cases.append(case)
js = """import {prepareMovementOrder} from './app/person-orders.ts';let s='';for await(const c of process.stdin)s+=c;
console.log(JSON.stringify(JSON.parse(s).map(c=>{const land={categories:new Uint8Array(16384),flags:new Uint32Array(16384),buildingIds:new Uint16Array(16384)},i=(c.point.y>>9)*128+(c.point.x>>9);
land.categories[i]=c.category;land.flags[i]=c.building?512:0;land.buildingIds[i]=100;
prepareMovementOrder(c.before,c.point,c.flags,land,id=>{if(id!==100)throw Error('wrong building');return c.outside});return c.before})));"""
actual = json.loads(subprocess.check_output(['node','--input-type=module','-e',js], input=json.dumps(cases).encode(), cwd=root))
for i, (case, result) in enumerate(zip(cases, actual)): assert case['expected'] == result, (i, case, result)
(root/'tests/fixtures/movement-order.json').write_text(json.dumps(dict(executableSha256=identity['sha256'],cases=cases),separators=(',',':'))+'\n')
print('PASS: 1024 native movement-order preparation cases, all coast categories, original-cell building precedence and unchanged records')

# Command 8 retains a building ID; the native final branch rewrites it to 10
# when that building is already being dismantled. Execute the complete routine.
building_cases=[]
for i in range(256):
    a,b=100,rng.randrange(65536)
    before=dict(model=8 if i%3==0 else 0,flags=rng.randrange(256),references=3,object=0,a=a,b=b)
    case=dict(before=before,a=a,b=b,flags=rng.randrange(256),dismantling=bool(i&1))
    write(order,'BBHHHH',*[before[k] for k in ['model','flags','references','object','a','b']])
    write(point,'HH',a,b);write(0x2001000+0x9c,'H',0x8000 if case['dismantling'] else 0)
    # Model 8 has no terrain payload. Avoid borrowing the preceding case's
    # categories through the original routine's irrelevant local coordinate.
    cpu.mem_write(0x8a03e4,bytes(128*128*16))
    write(stack,'IIIII',stop,1,8,point,case['flags'])
    cpu.reg_write(UC_X86_REG_ESP,stack);cpu.emu_start(0x438730,stop,count=10000)
    assert cpu.reg_read(UC_X86_REG_EIP)==stop
    case['expected']=dict(zip(['model','flags','references','object','a','b'],read(order,'BBHHHH')))
    building_cases.append(case)
js="""import {prepareBuildingEntryOrder} from './app/person-orders.ts';let s='';for await(const c of process.stdin)s+=c;
console.log(JSON.stringify(JSON.parse(s).map(c=>{prepareBuildingEntryOrder(c.before,c.a,c.b,c.flags,c.dismantling);return c.before})));"""
actual=json.loads(subprocess.check_output(['node','--input-type=module','-e',js],input=json.dumps(building_cases).encode(),cwd=root))
for case,result in zip(building_cases,actual):assert case['expected']==result,(case,result)
(root/'tests/fixtures/building-entry-orders.json').write_text(json.dumps(dict(executableSha256=identity['sha256'],cases=building_cases),separators=(',',':'))+'\n')
print('PASS: 256 complete native building-order preparations, unchanged payloads, flag merging and dismantling conversion')

# Compare the production shared-append adapter's worship payload with actual
# 0x438730, not a second TypeScript copy of its target-record preparation.
worship_cases=[]
for i in range(128):
    target=100+i;flags=(i*2)&254
    write(order,'BBHHHH',0,0,1,0,0,0);write(point,'HH',target,0)
    cpu.mem_write(0x8a03e4,bytes(128*128*16));write(stack,'IIIII',stop,1,27,point,flags)
    cpu.reg_write(UC_X86_REG_ESP,stack);cpu.emu_start(0x438730,stop,count=10000)
    assert cpu.reg_read(UC_X86_REG_EIP)==stop
    worship_cases.append(dict(target=target,flags=flags,expected=dict(zip(['model','flags','references','object','a','b'],read(order,'BBHHHH')))))
js="""import {createWorld,addUnit} from './app/model.ts';import {appendLiveOrders} from './app/live-movement.ts';
import {emptyPersonOrder,currentPersonOrder} from './app/person-orders.ts';let s='';for await(const c of process.stdin)s+=c;
console.log(JSON.stringify(JSON.parse(s).map(c=>{const w=createWorld();w.units=[];const u=addUnit(w,'blue','brave',{x:0,z:30});
appendLiveOrders(w,[u],{...emptyPersonOrder(),model:27,a:c.target,flags:c.flags},true);return currentPersonOrder(w.buildingOrders,u.native)})));"""
actual=json.loads(subprocess.check_output(['node','--input-type=module','-e',js],input=json.dumps(worship_cases).encode(),cwd=root))
for case,result in zip(worship_cases,actual):assert case['expected']==result,(case,result)
print('PASS: 128 native worship preparations compared with actual live shared-append records')
