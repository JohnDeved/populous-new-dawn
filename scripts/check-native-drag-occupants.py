"""Compare actual area commands with tower/training occupants and land membership.
Usage: python scripts/check-native-drag-occupants.py EXE [--record]
Only UI refresh and voice playback are intercepted. Native cell traversal,
current-order lookup, building predicates, selection writes and voice choice run.
"""
import json, random, struct, subprocess, sys
from pathlib import Path
from unicorn import UC_HOOK_CODE
from unicorn.x86_const import UC_X86_REG_EIP, UC_X86_REG_ESP
from decomp import native_cpu, configure_native_constants, ROOT

exe = Path(sys.argv[1])
cpu, identity = native_cpu(exe)
configure_native_constants(cpu, exe)
cpu.mem_map(0x2000000, 0x100000)
people, tribe, command, building, stack, stop = 0x2000000, 0x2001000, 0x2003000, 0x2004000, 0x20fd000, 0x20fe000

def write(a, fmt, *values):
    cpu.mem_write(a, struct.pack('<' + fmt, *values))

def read(a, fmt):
    return struct.unpack('<' + fmt, cpu.mem_read(a, struct.calcsize('<' + fmt)))[0]

voices = []
def consumer(c, address, size, user):
    sp = c.reg_read(UC_X86_REG_ESP)
    if address == 0x48a050:
        voices.append(read(sp + 8, 'I'))
    c.reg_write(UC_X86_REG_EIP, read(sp, 'I'))
    c.reg_write(UC_X86_REG_ESP, sp + 4)

for address in (0x47a550, 0x48a050):
    cpu.hook_add(UC_HOOK_CODE, consumer, begin=address, end=address)

def call(address, *args):
    write(stack, 'I' * (len(args) + 1), stop, *args)
    cpu.reg_write(UC_X86_REG_ESP, stack)
    cpu.emu_start(address, stop, count=1000000)
    assert cpu.reg_read(UC_X86_REG_EIP) == stop

packed = int(subprocess.check_output(['node', '--input-type=module', '-e',
    "import{dragCommand}from'./app/drag-selection.ts';console.log(dragCommand({x:8192,y:8192},{x:10240,y:10240},0)>>>0)"], cwd=ROOT))
rng = random.Random(0x4de680)
cases = []
for trial in range(1024):
    cpu.mem_write(0x8a03e4, bytes(16384 * 16))
    cpu.mem_write(0x890390, bytes(4096))
    cpu.mem_write(tribe, bytes(0xc65))
    cpu.mem_write(building, bytes(256))
    write(tribe + 0x881, 'I', people)
    model = [1, 4, 5][trial % 3]
    state = 1 + (trial // 3) % 2
    write(building + 0x24, 'H', 100)
    write(building + 0x2a, 'BBB', 2, model, state)
    write(0x890390 + 400, 'I', building)
    members, orders, originals = [], [], []
    for i, (x, y) in enumerate([(8704, 8704), (9472, 8704), (8704, 9472), (13312, 13312)]):
        p = people + i * 256
        cpu.mem_write(p, bytes(256))
        write(p + 8, 'I', p + 256 if i < 3 else 0)
        present = (trial + i) % 5 != 0
        d = dict(id=i+1, model=[2, 3, 7][(trial+i) % 3], x=x, y=y,
                 flags2=(0x800000 if (trial+i) % 3 else 0) | (0x100000 if (trial+i) % 11 == 0 else 0),
                 flags3=rng.getrandbits(32), flags4=[0, 128, 0x800][(trial//4+i) % 3],
                 state=[10, 19, 21][(trial//7+i) % 3], substate=[0, 12, 13][(trial//9+i) % 3],
                 selectionFlags=1 | (128 if trial & (1 << i) else 0),
                 commands=[0]*8, commandCursor=(trial>>4) % 8, immediateCommand=(i+1) % 4+1 if trial & 32 else 0,
                 present=present, terrainBuilding=bool((trial+i) % 4))
        d['commands'][d['commandCursor']] = i+1
        order = dict(model=[0, 3, 8][(trial//5+i) % 3], flags=(trial//8+i) & 1, references=1, object=0, a=100, b=0)
        write(p + 0xc, 'III', d['flags2'], d['flags4'], d['flags3'])
        write(p + 0x24, 'H', i+1)
        write(p + 0x2a, '6B', 1, d['model'], d['state'], d['substate'], 0, 0)
        write(p + 0x3d, 'HH', x, y)
        write(p + 0x7a, 'B', d['selectionFlags'])
        write(p + 0x8b, '8H', *d['commands'])
        write(p + 0x9b, 'H', d['immediateCommand'])
        write(p + 0xa6, 'B', d['commandCursor'])
        write(0x938830 + (i+1)*10, 'BB4H', *order.values())
        write(0x890390 + (i+1)*4, 'I', p)
        cell = 0x8a03e4 + ((y>>9)*128 + (x>>9))*16
        write(cell, 'I', 512 if d['terrainBuilding'] else 0)
        write(cell+8, 'H', 100 | 0x4000)  # Mask the packed terrain index.
        if present:
            call(0x4ee470, p, p+0x3d)
        d['flags2'] = read(p+0xc, 'I')
        members.append(d)
        orders.append(order)
        originals.append(bytes(cpu.mem_read(p, 256)))
    write(command+4, 'HHIB', 8192, 8192, packed, 0x79 if trial & 1 else 0x6d)
    voices.clear()
    call(0x4449d0, tribe, command)
    expected = []
    for i, before in enumerate(originals):
        p = people+i*256
        expected.append(dict(flags3=read(p+0x14, 'I'), selectionFlags=read(p+0x7a, 'B')))
        after = bytearray(cpu.mem_read(p, 256))
        after[0x14:0x18] = before[0x14:0x18]
        after[0x7a] = before[0x7a]
        assert after == before, (trial, i, 'selection changed simulation bytes')
    cases.append(dict(building=dict(model=model,state=state), people=members, orders=orders,
                      packed=packed, extend=bool(trial & 1), expected=dict(people=expected, voices=list(voices))))
js = """
import {createWorld,addUnit,selectArea,browserPosition}from'./app/model.ts';
import {createLivePerson}from'./app/live-people.ts';
import {insertObjectIntoCell}from'./app/object-cells.ts';
let text='';for await(const part of process.stdin)text+=part;
console.log(JSON.stringify(JSON.parse(text).map(c=>{
 const w=createWorld();w.units=[];w.selected=[];w.objectCells.heads.fill(0);w.objectCells.objects.clear();
 w.buildings=[{id:100,kind:c.building.model===4?'tower':c.building.model===5?'camp':'hut',level:1,progress:c.building.state===2?1:.5,hp:100}];
 w.buildingOrders.records=[{},...c.orders];
 for(const d of c.people){
  const u=addUnit(w,'blue',d.model===7?'shaman':d.model===3?'warrior':'brave',browserPosition(d));
  u.native=createLivePerson(w,u);Object.assign(u.native,d,{id:u.id});
  u.inside=d.flags2&0x800000?100:null;
  w.objectCells.objects.set(u.id,u.native);if(d.present)insertObjectIntoCell(w.objectCells,u.native,u.native);
  const cell=(d.y>>9)*128+(d.x>>9);w.land.flags[cell]=d.terrainBuilding?512:0;w.land.buildingIds[cell]=100|0x4000;
  if(d.selectionFlags&128)w.selected.push(u.id);
 }
 selectArea(w,{x:8192,y:8192},c.packed,c.extend);
 return{people:w.units.map(u=>({flags3:u.native.flags3,selectionFlags:u.native.selectionFlags})),voices:w.sounds.map(s=>s.cue)};
})));
"""
actual = json.loads(subprocess.check_output(['node', '--input-type=module', '-e', js], input=json.dumps(cases).encode(), cwd=ROOT))
for i, (c, result) in enumerate(zip(cases, actual)):
    assert result == c['expected'], (i, c, result)
print('PASS: 1,024 complete native area commands / 4,096 people; tower/training phase, current orders, packed terrain lookup, hidden/blocked flags, land membership, selection and voices; other person bytes unchanged')
if '--record' in sys.argv:
    (ROOT/'tests/fixtures/drag-occupants.json').write_text(json.dumps(dict(executableSha256=identity['sha256'],cases=cases[::7]),separators=(',',':'))+'\n')
