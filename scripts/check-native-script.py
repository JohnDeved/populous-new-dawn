"""Compare PopScript control flow with the original x86 interpreter.
Usage: python scripts/check-native-script.py /path/to/d3dpoptb.exe /path/to/cpscr010.dat
Game commands are intercepted and external reads supplied by the test host.
This verifies the interpreter, not the game-side command implementations.
"""
import hashlib
import json
from pathlib import Path
import random
import struct
import subprocess
import sys
from unicorn import UC_HOOK_CODE
from unicorn.x86_const import UC_X86_REG_ESP, UC_X86_REG_EIP, UC_X86_REG_EAX
from decomp import native_cpu

root = Path(__file__).resolve().parents[1]
script = json.loads((root / 'app/original-script.json').read_text())
source = Path(sys.argv[2]).read_bytes()
assert hashlib.sha256(source).hexdigest() == script['sha256'], 'Script source hash mismatch'
cpu, identity = native_cpu(Path(sys.argv[1]))
cpu.mem_map(0x2000000, 0x20000)
program, tribe, stack, stop = 0x2000000, 0x2008000, 0x201d000, 0x201e000
u32 = lambda p: struct.unpack('<I', cpu.mem_read(p, 4))[0]
trace, reads, values, current = [], [], {}, script

def return_value(value):
    sp = cpu.reg_read(UC_X86_REG_ESP)
    cpu.reg_write(UC_X86_REG_EAX, value & 0xffffffff)
    cpu.reg_write(UC_X86_REG_EIP, u32(sp))
    cpu.reg_write(UC_X86_REG_ESP, sp + 4)

def command(cpu, address, size, user):
    pc = u32(program + 0x3104)
    opcode = struct.unpack('<H', cpu.mem_read(pc + 2, 2))[0]
    arity = current['commands'][str(opcode)]
    args = list(struct.unpack('<' + 'H' * arity, cpu.mem_read(pc + 4, arity * 2))) if arity else []
    trace.append([opcode, args])
    cpu.mem_write(program + 0x3104, struct.pack('<I', pc + 4 + arity * 2))
    return_value(1)

def internal(cpu, address, size, user):
    field = u32(cpu.reg_read(UC_X86_REG_ESP) + 12)
    kind, index = struct.unpack('<Ii', cpu.mem_read(field, 8))
    if kind == 2 and not 1000 <= index < 1048:
        reads.append(index)
        return_value(values.get(index, 0))

cpu.hook_add(UC_HOOK_CODE, command, begin=0x48cc60, end=0x48cc60)
cpu.hook_add(UC_HOOK_CODE, internal, begin=0x48f350, end=0x48f350)
rng = random.Random(1998)
cases = [dict(turn=turn, tribe=owner, variables=[0]*64, values={}) for owner in range(4) for turn in range(256)]
cases += [dict(turn=rng.randrange(2**32),tribe=rng.randrange(4),
               variables=[rng.randrange(-2**31,2**31) for _ in range(64)],
               values={i:rng.randrange(-2**31,2**31) for i in (1,6,1082,1083,1084,1092)}) for _ in range(128)]
# Exercise arithmetic absent from mission one, eager nested comparisons, byte attributes,
# and EVERY's raw field mask (even when the record refers to a user variable).
fixture = dict(variables=[0]*64,commands={'1028':1},fields=[
    [1,0],[1,1],[1,2],[1,3],[2,1000],[0,2147483647],[0,1],[0,-17],[0,3],[0,0],
    [0,300],[0,-5],[0,130],[2,900],[1,4],[1,5]],codes=[12,1003,
    1007,0,5,1008,0,6,1009,0,7,1025,1,0,8,1026,2,7,8,1026,3,6,9,
    1007,4,10,1008,4,11,1025,4,12,8,1026,4,7,8,1008,13,6,1025,13,6,8,
    1000,1021,1012,13,9,1020,1014,6,6,1015,13,9,
    1003,1006,1028,1022,1004,1001,1003,1006,1028,1023,1004,1002,
    1005,1,13,1003,1008,14,6,1004,
    1005,8,1003,1008,15,6,1004,1004,1019])
cases += [dict(turn=turn,tribe=owner,variables=[0]*64,values={900:value},script=fixture)
          for turn in (0,1,2,3,255,256,0xffffffff) for owner in range(4) for value in (-1,0,1)]
expected = []
for case in cases:
    trace,reads=[],[]
    values={int(k):v for k,v in case['values'].items()};values[0]=case['turn']
    current=case.get('script',script)
    if 'script' in case:
        blob=bytearray(12552)
        struct.pack_into('<'+'H'*len(current['codes']),blob,0,*current['codes'])
        for i,field in enumerate(current['fields']):struct.pack_into('<Ii',blob,8192+i*8,*field)
        cpu.mem_write(program,bytes(blob))
    else:
        cpu.mem_write(program,source)
    cpu.mem_write(program+0x3000,struct.pack('<64i',*case['variables']))
    cpu.mem_write(tribe,bytes(0xc65));cpu.mem_write(tribe+0xc22,bytes([case['tribe']]))
    cpu.mem_write(0x9607ea+case['tribe']*48,bytes(48))
    cpu.mem_write(0x89d188,struct.pack('<I',case['turn']))
    cpu.mem_write(stack,struct.pack('<III',stop,tribe,program))
    cpu.reg_write(UC_X86_REG_ESP,stack)
    cpu.emu_start(0x48c6b0,stop,timeout=100000,count=100000)
    assert cpu.reg_read(UC_X86_REG_EIP)==stop, 'Native interpreter failed to return'
    expected.append(dict(variables=list(struct.unpack('<64i',cpu.mem_read(program+0x3000,256))),
                         attributes=list(cpu.mem_read(0x9607ea+case['tribe']*48,48)),trace=trace,reads=reads,pc=(u32(program+0x3104)-program)//2))
js="""import script from './app/original-script.json' with {type:'json'};
import {scriptState,runScript} from './app/popscript.ts';
let s='';for await(const c of process.stdin)s+=c;
console.log(JSON.stringify(JSON.parse(s).map(c=>{
 const program=c.script??script,state=scriptState(program);state.variables=c.variables;const trace=[],reads=[];
 const pc=runScript(program,state,{turn:c.turn,tribe:c.tribe,readInternal:i=>{reads.push(i);return i===0?c.turn:(c.values[i]??0);},command:(op,args)=>trace.push([op,args])});
 return {...state,trace,reads,pc};
})));"""
result=subprocess.run(['node','--input-type=module','-e',js],input=json.dumps(cases),text=True,capture_output=True,check=True,cwd=root)
actual=json.loads(result.stdout)
assert len(actual)==len(expected)
for case,want,got in zip(cases,expected,actual):
    assert got==want,(case,want,got)
print(f'PASS: {len(cases)} native x86/browser campaign interpreter cases; external game commands intercepted')
