"""Bounded original Spy inspection, ordered input, and reveal command research.

The original executable is mapped as data. No Windows process is launched.
Only allocation while constructing default input records is intercepted.
Usage: python scripts/check-native-spy-discovery.py /path/to/d3dpoptb.exe
Run with the resource limits documented in decomp/research/spy-manual-discovery.md.
"""
import hashlib
import itertools
import json
from pathlib import Path
import struct
import sys

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'scripts'))
from decomp import native_cpu
import unicorn
from unicorn import UC_HOOK_CODE
from unicorn.x86_const import UC_X86_REG_EAX, UC_X86_REG_ECX, UC_X86_REG_EIP, UC_X86_REG_ESP

EXE = Path(sys.argv[1])
cpu, identity = native_cpu(EXE, tcg_buffer_size=16*1024*1024)
cpu.mem_map(0x2000000, 0x20000)
person, second, tribe, out = 0x2000000, 0x2000100, 0x2001000, 0x2001ff0
owner, translation, heap = 0x2003000, 0x2004000, 0x2005000
stack, stop = 0x201e000, 0x201f000

def write(a, fmt, *v):
    cpu.mem_write(a, struct.pack('<'+fmt, *v))

def read(a, fmt):
    return struct.unpack('<'+fmt, cpu.mem_read(a, struct.calcsize('<'+fmt)))[0]

def call(address, *args, method=False):
    write(stack, 'I'*(len(args)+1), stop, *args)
    cpu.reg_write(UC_X86_REG_ESP, stack)
    cpu.reg_write(UC_X86_REG_ECX, owner)
    cpu.emu_start(address, stop, count=1000000 if address == 0x489300 else 100000)
    assert cpu.reg_read(UC_X86_REG_EIP) == stop, hex(cpu.reg_read(UC_X86_REG_EIP))
    assert cpu.reg_read(UC_X86_REG_ESP) == stack+4*(len(args)+1 if method else 1)
    return cpu.reg_read(UC_X86_REG_EAX)

def setup(player=0, real=1, model=5, disguise=0, slot=0, land=0):
    cpu.mem_write(person, bytes(256))
    cpu.mem_write(second, bytes(256))
    cpu.mem_write(tribe, bytes(0xc65))
    cpu.mem_write(0x897997, bytes(15*4))
    write(person+0x24, 'H', 1)
    write(person+0x2a, 'BB', 1, model)
    write(person+0x2f, 'B', real)
    write(person+0xb2, 'B', disguise)
    write(0x890390+4, 'I', person)
    write(0x890390+8, 'I', second)
    write(0x89c6f0, 'B', player)
    write(tribe+0xc22, 'B', player)
    write(0x897997+15*player+0xc, 'B', slot)
    for a,f,v in [(0x89c661,'I',land),(0x89c669,'I',0),(0x89c6e7,'B',0),
                  (0x894cf5,'I',0),(0x894cff,'I',0),(0x98e908,'H',0),
                  (0x89d17c,'B',0),(0x87cabc,'B',0),(0x87cac0,'B',0),
                  (0x87cac2,'H',1),(0x87cace,'H',0),(0x89ce36,'B',0),
                  (0x89c6c1,'H',0),(0x890374,'I',0),(0x8a03e4,'I',0),
                  (0x5a219c+2*30,'H',0),(0x5a219c+4*30,'H',0)]:
        write(a,f,v)
    return 0x897997+15*player

allocations = []
def allocate(c, address, size, _):
    sp = c.reg_read(UC_X86_REG_ESP)
    assert read(sp+4,'I') == 15
    p = heap+len(allocations)*16
    assert p < heap+0x1000
    allocations.append(p)
    c.reg_write(UC_X86_REG_EAX,p)
    c.reg_write(UC_X86_REG_EIP,read(sp,'I'))
    c.reg_write(UC_X86_REG_ESP,sp+4)

write(0x5f0550,'I',translation)
hook = cpu.hook_add(UC_HOOK_CODE,allocate,begin=0x55aca0,end=0x55aca0)
assert call(0x489300,0x5d5de8,method=True) == owner
cpu.hook_del(hook)
assert len(allocations) == 188

# The original indirect command-admission branch uses action 0x42 to classify
# admission, then writes command 0x4e. Execute it rather than reconstructing it.
inspection = []
for player,real,target,countdown,slot,land in itertools.product(range(4),range(4),range(4),[0,1,63],[0,0x42],[0,0x800]):
    if player == real:
        continue  # Own-person UI allocation is outside this focused probe.
    q = setup(player,real,5,(target<<6)|countdown,slot,land)
    before = bytes(cpu.mem_read(person,256))
    result = call(0x47b1d0,person,out,1) & 255
    accepted = target == player and countdown == 0 and slot == 0 and not land&0x800
    actual = [read(q+0xc,'B'),read(q+4,'I'),read(q+8,'I')]
    assert actual == ([0x4e,0,1] if accepted else [slot,0,0]), (player,real,target,countdown,slot,land,actual)
    assert bytes(cpu.mem_read(person,256)) == before  # Deferred command, not direct reveal.
    assert result == 0
    inspection.append([player,real,target,countdown,slot,land,actual])

# Original key mapper -> public right-press dispatcher -> inspection -> queued
# command -> original consumer. No producer, predicate, queue or reveal stubs.
chains = []
for mode,modifier,phase,cursor,land,overlay,modal,level in itertools.product([0,7,12],range(8),[1,4],[0,1],[0,8],[0,4],[0,0x100],[0,0x20]):
    q = setup()
    for a,f,v in [(0x89c6e7,'B',mode),(0x87cabc,'B',cursor),(0x89c661,'I',land),
                  (0x894cff,'I',overlay),(0x5a219c+2*30,'H',modal),(0x89c669,'I',level)]:
        write(a,f,v)
    action = call(0x489470,0xf1,modifier,phase,method=True)
    admitted = mode == 0 and modifier == 0 and phase == 1 and cursor == 1
    assert (action == 0x72) == admitted, (mode,modifier,phase,cursor,land,overlay,action)
    if action == 0x72:
        call(0x4aab80,action,0,0)
    queued = read(q+0xc,'B') == 0x4e
    assert queued == bool(admitted and not modal and not level), (mode,modifier,phase,cursor,land,overlay,modal,level,action,queued)
    if queued:
        assert read(person+0xb2,'B') == 0
        call(0x43e8e0,tribe,q)
        assert read(person+0xb2,'B') == 64
    chains.append([mode,modifier,phase,cursor,land,overlay,modal,level,action,queued])

consumers = []
for unitclass,removed,index in itertools.product([0,1,4],[0,1],[0,1]):
    q = setup(disguise=128)
    write(person+0x2a,'B',unitclass)
    write(person+0xc,'I',removed)
    write(q+0xc,'B',0x4e)
    write(q+8,'I',index)
    call(0x43e8e0,tribe,q)
    expected = 64 if unitclass and not removed and index else 128
    assert read(person+0xb2,'B') == expected
    consumers.append([unitclass,removed,index,expected])

result = {'executable':identity,'unicorn':unicorn.__version__,
          'probeSha256':hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),
          'allocationCount':len(allocations),'inspection':inspection,'chains':chains,'consumers':consumers,
          'limits':['Supplied per-person fields, unit array, command slots and input globals; no original game or renderer.',
                    'Only operator_new during default-binding construction is intercepted. Empty keyboard translation table supplied.',
                    'Own-person UI allocations and upstream native model picking/occlusion are not exercised.',
                    'Foreign apparent-tribe admission is byte-based, with no model or alliance check in this local native branch.',
                    'Consumer checks live unit reference but does not repeat producer eligibility. No browser/application or parity claim.']}
print(json.dumps(result, indent=2))
print(f'PASS: {len(inspection)} inspection cases, {len(chains)} input/command cases, {len(consumers)} consumer cases')
