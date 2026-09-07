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

command_hook=cpu.hook_add(UC_HOOK_CODE, command, begin=0x48cc60, end=0x48cc60)
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


# Execute actual DO GET_HEIGHT_AT_POS dispatch, without the command interception above.
level=json.loads((root/'app/level-one.ts').read_text().split('export default ',1)[1].strip().removesuffix(';'))
header=(Path(sys.argv[2]).parent/'levl2001.hdr').read_bytes()
assert hashlib.sha256(header).hexdigest()==level['headerSha256'],'Level header hash mismatch'
cpu.hook_del(command_hook)
cpu.mem_write(0x8a03e4,bytes(0x40000))
heights=[0]*16384
for x,y,h in level['heights']:heights[y*128+x]=h
for i,h in enumerate(heights):cpu.mem_write(0x8a03e8+i*16,struct.pack('<h',h))
cpu.mem_write(0x89b7a5,header[100:612])
queries=[dict(index=i,packed=p,height=None) for i,p in enumerate(level['markers'])]
queries += [dict(index=i,packed=level['markers'][i]|odd,height=h)
            for i in range(25,41) for odd in (0,0x101) for h in (-32768,-1,0,1,32767)]
expected=[]
for case in queries:
    packed=case['packed'];index=((packed&0xfe00)>>9)*128+((packed&254)>>1)
    h=heights[index] if case['height'] is None else case['height']
    cpu.mem_write(0x8a03e8+index*16,struct.pack('<h',h))
    cpu.mem_write(0x89b7a5+case['index']*2,struct.pack('<H',packed))
    blob=bytearray(12552)
    struct.pack_into('<8H',blob,0,12,1003,1006,1085,0,1,1004,1019)
    struct.pack_into('<IiIi',blob,8192,0,case['index'],1,0)
    cpu.mem_write(program,bytes(blob))
    cpu.mem_write(stack,struct.pack('<III',stop,tribe,program));cpu.reg_write(UC_X86_REG_ESP,stack)
    cpu.emu_start(0x48c6b0,stop,timeout=100000,count=10000)
    assert cpu.reg_read(UC_X86_REG_EIP)==stop,'Native terrain query failed to return'
    expected.append(struct.unpack('<i',cpu.mem_read(program+0x3000,4))[0])
js="""import level from './app/level-one.ts';import {makeTerrain,markerHeight,nativeCellPoint,GRID} from './app/model.ts';
let s='';for await(const c of process.stdin)s+=c;
console.log(JSON.stringify(JSON.parse(s).map(c=>{
 const t=makeTerrain(),previous=level.markers[c.index];level.markers[c.index]=c.packed;
 if(c.height!==null){const p=nativeCellPoint(c.packed);if(Math.abs(p.x)>48||Math.abs(p.z)>48)throw Error('Override outside browser crop');t[(p.z+48)*GRID+p.x+48]=c.height===0?-.35:c.height/45;}
 const result=markerHeight(t,c.index);level.markers[c.index]=previous;return result;
})));"""
result=subprocess.run(['node','--input-type=module','-e',js],input=json.dumps(queries),text=True,capture_output=True,check=True,cwd=root)
actual=json.loads(result.stdout)
assert len(actual)==len(expected)
for case,want,got in zip(queries,expected,actual):assert want==got,(case,want,got)
print(f'PASS: {len(queries)} native DO GET_HEIGHT_AT_POS/browser queries; actual native command executed')

# Run the original terrain-check block with real native queries. Only the final
# world-deletion leaf is intercepted, so its request can be compared without an OS/game loop.
removals=[]
def remove_head(cpu,address,size,user):
    sp=cpu.reg_read(UC_X86_REG_ESP)
    removals.append([u32(sp+4)&255,u32(sp+8)&255]);return_value(0)
cpu.hook_add(UC_HOOK_CODE,remove_head,begin=0x4f2160,end=0x4f2160)
cpu.mem_write(0x89b7a5,header[100:612])
fragment=[12,1003,*script['codes'][1370:1470],1004,1019]
assert fragment[2]==1005 and script['codes'][1470]==1005
profiles=[([0]*6,[0]*5),([0,0,0,0,0,45],[0]*5),([0]*6,[0,0,0,0,45]),
          ([0,0,0,0,0,45],[0,0,0,0,45]),([45,-45,0,0,0,0],[45,0,0,0,0]),
          ([-32768,32767,0,0,0,0],[32767,0,0,0,0])]
rules=[dict(turn=turn,south=a,north=b) for turn in (0,28,29,30,60,61,62) for a,b in profiles]
slots=[*range(21,27),*range(45,50),50,52]
expected=[]
for case in rules:
    for marker,h in [*zip(range(35,41),case['south']),*zip(range(25,30),case['north'])]:
        packed=level['markers'][marker];index=((packed&0xfe00)>>9)*128+((packed&254)>>1)
        cpu.mem_write(0x8a03e8+index*16,struct.pack('<h',h))
    blob=bytearray(source);blob[:8192]=bytes(8192)
    struct.pack_into('<'+'H'*len(fragment),blob,0,*fragment)
    cpu.mem_write(program,bytes(blob));cpu.mem_write(tribe+0xc22,b'\1')
    cpu.mem_write(0x89d188,struct.pack('<I',case['turn']))
    cpu.mem_write(stack,struct.pack('<III',stop,tribe,program));cpu.reg_write(UC_X86_REG_ESP,stack)
    removals=[]
    cpu.emu_start(0x48c6b0,stop,timeout=100000,count=100000)
    assert cpu.reg_read(UC_X86_REG_EIP)==stop,'Native campaign terrain block failed to return'
    variables=struct.unpack('<64i',cpu.mem_read(program+0x3000,256))
    assert removals in ([],[[2,222]])
    expected.append(dict(removed=bool(removals),values=[variables[i] for i in slots]))
js="""import level from './app/level-one.ts';import {createWorld,makeTerrain,nativeCellPoint,GRID,tick} from './app/model.ts';
let s='';for await(const c of process.stdin)s+=c;
console.log(JSON.stringify(JSON.parse(s).map(c=>{
 const w=createWorld();w.terrain=makeTerrain();w.turn=c.turn-1;w.ai.variables.fill(0);
 for(const [start,values]of [[35,c.south],[25,c.north]])values.forEach((h,i)=>{const p=nativeCellPoint(level.markers[start+i]);w.terrain[(p.z+48)*GRID+p.x+48]=h===0?-.35:h/45;});
 tick(w,1/12);return {removed:!w.shrines.some(s=>s.kind==='bridge'),values:[21,22,23,24,25,26,45,46,47,48,49,50,52].map(i=>w.ai.variables[i])};
})));"""
result=subprocess.run(['node','--input-type=module','-e',js],input=json.dumps(rules),text=True,capture_output=True,check=True,cwd=root)
actual=json.loads(result.stdout)
assert len(actual)==len(expected)
for case,want,got in zip(rules,expected,actual):assert want==got,(case,want,got)
print(f'PASS: {len(rules)} original terrain-rule/browser turns; native removal requests intercepted')
