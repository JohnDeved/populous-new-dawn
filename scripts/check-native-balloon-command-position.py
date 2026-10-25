"""Compare raw command-position startup with unmodified native x86.

Usage: python scripts/check-native-balloon-command-position.py EXE
Runs complete 0x432df0 and its real 0x4389c0 leaf for commands15/16. No native
leaves are intercepted. Node calls the production startLiveOrders adapter;
comparison is limited to configuration fields, not startup speed/RNG or vehicle
scheduling. No fixture, parity, imported asset, or tracked output is written.
"""
import json
import struct
import subprocess
import sys
from pathlib import Path

from unicorn import UC_HOOK_CODE
from unicorn.x86_const import UC_X86_REG_EAX, UC_X86_REG_EIP, UC_X86_REG_ESP

from decomp import ROOT, native_cpu

cpu, identity = native_cpu(Path(sys.argv[1]))
cpu.mem_map(0x2000000, 0x10000)
person, vehicle, point, stack, stop = 0x2000000, 0x2001000, 0x2002000, 0x200e000, 0x200f000
order = 0x93883a


def write(address, fmt, *values):
    cpu.mem_write(address, struct.pack('<' + fmt, *values))


def read(address, fmt):
    return struct.unpack('<' + fmt, cpu.mem_read(address, struct.calcsize('<' + fmt)))[0]


def call(address, *args):
    write(stack, 'I' * (len(args) + 1), stop, *args)
    cpu.reg_write(UC_X86_REG_ESP, stack)
    cpu.emu_start(address, stop, count=100000)
    assert cpu.reg_read(UC_X86_REG_EIP) == stop, hex(cpu.reg_read(UC_X86_REG_EIP))
    return cpu.reg_read(UC_X86_REG_EAX) & 255


calls = []
# Observation only: the callback leaves all registers, memory and execution intact.
cpu.hook_add(UC_HOOK_CODE, lambda *args: calls.append(0x4389c0), begin=0x4389c0, end=0x4389c0)
payloads = [(0, 0), (2, 0), (0xffff, 0x8000), (0x7fff, 0xffff), (0x8000, 0x7fff), (0xfefe, 0xff01)]
rules = json.loads((ROOT / 'app/original-rules.json').read_text())['personCommands']
leaf_count = 0
raw_models = []
for model, descriptor in enumerate(rules):
    flags = read(0x5a7dca + model * 22, 'I')
    assert flags == descriptor['flags'], (model, flags, descriptor['flags'])
    if flags & (4 | 0x800 | 0x242):
        continue
    raw_models.append(model)
    for a, b in payloads:
        write(order, 'BBHHHH', model, 0, 1, 0, a, b)
        write(point, 'HH', 555, 666)
        assert call(0x4389c0, order, point) == 1
        assert (read(point, 'H'), read(point + 2, 'H')) == (a, b)
        leaf_count += 1
assert rules[16]['flags'] == 0x400
print(f'PASS: {leaf_count} native raw-position leaves; descriptor identity and unsigned payload words for models {raw_models}')

fields = {
    'flags2': (0xc, 'I'), 'flags4': (0x10, 'I'), 'substate': (0x2d, 'B'),
    'destinationX': (0x53, 'H'), 'destinationY': (0x55, 'H'),
    'motionTimer': (0x61, 'H'), 'motionMode': (0x66, 'B'),
    'assignment': (0x76, 'H'), 'workTarget': (0x89, 'H'),
    'commandStatus': (0xa7, 'B'), 'animationMode': (0xa8, 'B'),
    'commandAux': (0xa9, 'B'), 'orderDelay': (0xab, 'B'),
}
cases = []
for model in [15, 16]:
    for person_model in [2, 5, 6]:
        for craft in [0, 2]:
            for flags4 in [0, 0x2000000, 0x8000000, 0xa000000]:
                for cancelled in [False, True]:
                    for immediate in [False, True]:
                        for a, b in payloads:
                            cpu.mem_write(person, bytes(256))
                            cpu.mem_write(vehicle, bytes(256))
                            write(0x890398, 'I', vehicle)
                            write(vehicle + 0x2a, 'BB', 4, 3)
                            write(person + 0x2a, 'BBB', 1, person_model, 10)
                            write(person + 0x10, 'I', flags4)
                            write(person + 0x9f, 'H', craft)
                            write(person + (0x9b if immediate else 0x8b), 'H', 1)
                            write(person + 0x53, 'HH', 555, 666)
                            write(order, 'BBHHHH', model, int(cancelled), 1, 0, a, b)
                            calls.clear()
                            call(0x432df0, person)
                            called = bool(calls)
                            assert len(calls) <= 1
                            assert called == (not cancelled and bool(craft) and bool(flags4 & 0x2000000))
                            assert (read(person + 0x53, 'H'), read(person + 0x55, 'H')) == ((a, b) if called else (555, 666))
                            cases.append(dict(model=model, personModel=person_model, vehicle=craft,
                                              flags4=flags4, cancelled=cancelled, immediate=immediate,
                                              a=a, b=b, expected={name: read(person + offset, fmt)
                                                                  for name, (offset, fmt) in fields.items()}))

js = """
import {createWorld,addUnit} from './app/model.ts';
import {createLivePerson} from './app/live-people.ts';
import {startLiveOrders} from './app/live-movement.ts';
import {emptyPersonOrder} from './app/person-orders.ts';
let input='';for await(const chunk of process.stdin)input+=chunk;
const w=createWorld(22),unit=addUnit(w,'blue','spy',{x:0,z:0});
const balloon=w.vehicles.find(v=>v.model===3);
console.log(JSON.stringify(JSON.parse(input).map(c=>{
 const p=createLivePerson(w,unit);unit.native=p;
 Object.assign(p,{model:c.personModel,flags2:0,flags3:0,flags4:c.flags4,
  vehicle:c.vehicle?balloon.id:0,commands:[c.immediate?0:1,0,0,0,0,0,0,0],
  commandCursor:0,immediateCommand:c.immediate?1:0,destinationX:555,destinationY:666});
 w.buildingOrders.records[1]={...emptyPersonOrder(),model:c.model,flags:Number(c.cancelled),references:1,a:c.a,b:c.b};
 startLiveOrders(w,p,w);
 return Object.fromEntries(Object.keys(c.expected).map(name=>[name,p[name]]));
})));
"""
result = subprocess.run(['node', '--input-type=module', '-e', js], input=json.dumps(cases),
                        text=True, capture_output=True, cwd=ROOT)
assert result.returncode == 0, result.stderr
actual = json.loads(result.stdout)
assert len(actual) == len(cases)
for case, output in zip(cases, actual):
    assert output == case['expected'], (case, output)
print(f'PASS: {len(cases)} native configure + command-position compositions match production live startup fields; no native leaves supplied')
print(f'Executable SHA256: {identity["sha256"]}; startup speed/RNG, full vehicle movement and non-driver scheduling are outside this comparison')
