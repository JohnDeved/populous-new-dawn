"""Compare campaign counters with the supplied executable's actual x86 handlers.
Usage: python scripts/check-native-campaign.py /path/to/d3dpoptb.exe
No game-command interception; fixtures supply the surrounding world memory.
"""
import json
from pathlib import Path
import struct
import subprocess
import sys
from unicorn.x86_const import UC_X86_REG_ESP, UC_X86_REG_EIP
from decomp import native_cpu

root = Path(__file__).resolve().parents[1]
cpu, identity = native_cpu(Path(sys.argv[1]))
cpu.mem_map(0x2000000, 0x20000)
program, tribe, head, stack, stop = 0x2000000, 0x2008000, 0x2009000, 0x201d000, 0x201e000

def call(address, *args):
    cpu.mem_write(stack, struct.pack('<'+'I'*(len(args)+1), stop, *args))
    cpu.reg_write(UC_X86_REG_ESP, stack)
    cpu.emu_start(address, stop, timeout=100000, count=100000)
    assert cpu.reg_read(UC_X86_REG_EIP) == stop, f'Native call {address:x} did not return'

def query(opcode, args, fields, variables=None):
    codes = [12, 1003, 1006, opcode, *args, 1004, 1019]
    blob = bytearray(12552)
    struct.pack_into('<'+'H'*len(codes), blob, 0, *codes)
    for i, field in enumerate(fields):
        struct.pack_into('<Ii', blob, 8192+i*8, *field)
    if variables:
        struct.pack_into('<64i', blob, 12288, *variables)
    cpu.mem_write(program, bytes(blob))
    call(0x48c6b0, tribe, program)
    return struct.unpack('<64i', cpu.mem_read(program+0x3000, 256))[fields[args[-1]][1]]

def browser(js, cases):
    result = subprocess.run(['node', '--input-type=module', '-e', js], input=json.dumps(cases),
                            text=True, capture_output=True, cwd=root)
    assert result.returncode == 0, result.stderr
    return json.loads(result.stdout)

cases, expected = [], []
for owner in range(4):
    for model in (0, 1, 2, 3, 12, 16, 18, 21):
        for value in (0, 1, 15, 16, 127, 128, 254, 255):
            for literal in (False, True):
                # Exercise both literal tribe tokens and variable fields. The output aliases
                # the input owner variable and uses a constant-type destination record.
                fields = [[1, 5], [0, model], [0, 5]]
                args = [1118+owner if literal else 0, 1, 2]
                variables = [0]*64
                variables[5] = owner
                cpu.mem_write(0x89ddee+owner*0xc65+model, bytes([value]))
                expected.append(query(1076, args, fields, variables))
                cases.append(dict(opcode=1076, owner=owner, model=model, value=value,
                                  args=args, fields=fields, variables=variables))
for model in (2, 3, 12):
    for value in range(256):
        fields = [[0, 0], [2, 1183+model], [1, 7]]
        cpu.mem_write(0x96071e+model, bytes([value]))
        expected.append(query(1077, [0, 1, 2], fields))
        cases.append(dict(opcode=1077, owner=0, model=model, value=value,
                          args=[0, 1, 2], fields=fields, variables=[0]*64))
js = """import {createWorld,campaignCommand} from './app/model.ts';
let input='';for await(const c of process.stdin)input+=c;
const w=createWorld();console.log(JSON.stringify(JSON.parse(input).map(c=>{
 w.ai.variables=[...c.variables];w.spellCasts[c.owner][c.model]=c.value;
 if(c.opcode===1077)w.shots[{2:'blast',3:'lightning',12:'bridge'}[c.model]]=c.value;
 campaignCommand(w,c.opcode,c.args,{fields:c.fields});return w.ai.variables[c.fields[c.args.at(-1)][1]];
})));"""
actual = browser(js, cases)
assert len(actual) == len(expected)
for case, want, got in zip(cases, expected, actual):
    assert want == got, (case, want, got)
print(f'PASS: {len(cases)} actual native spell-counter/stock DO queries match browser bindings')

# Head queries traverse the real native cell list, skipping a non-head object first.
cpu.mem_write(0x8a03e4, bytes(0x40000))
cpu.mem_write(0x890390, struct.pack('<III', 0, head+0x100, head))
cpu.mem_write(head, bytes(0x200))
cpu.mem_write(head+0x2a, b'\6\6')
cpu.mem_write(head+0x100+0x2a, b'\2\1')
cpu.mem_write(head+0x100+0x20, b'\2\0')
packed = (246 << 8) | 18
index = ((packed & 0xfe00) >> 9)*128 + ((packed & 254) >> 1)
cpu.mem_write(0x8a03ea+index*16, b'\1\0')
cases, expected = [], []
for value in range(256):
    cpu.mem_write(head+0x6b, bytes([value]))
    for x, y in ((18, 246), (19, 247), (274, -10), (16, 246)):
        fields = [[0, x], [0, y], [1, 0]]
        expected.append(query(1131, [0, 1, 2], fields))
        cases.append(dict(value=value, fields=fields))
js = """import {createWorld,campaignCommand} from './app/model.ts';
let input='';for await(const c of process.stdin)input+=c;
const w=createWorld(),head=w.shrines.find(s=>s.kind==='lightning');
console.log(JSON.stringify(JSON.parse(input).map(c=>{
 head.remaining=c.value;campaignCommand(w,1131,[0,1,2],{fields:c.fields});return w.ai.variables[0];
})));"""
actual = browser(js, cases)
assert len(actual) == len(expected)
for case, want, got in zip(cases, expected, actual):
    assert want == got, (case, want, got)
print(f'PASS: {len(cases)} actual native head-counter DO queries, including cell wrapping and signed bytes')

# Execute the full spell initializer, with no shaman, no UI notification, no mana
# spending and no opponent observers. No leaf is intercepted. These surrounding
# conditions isolate the allocation counter; they do not test every initializer branch.
cpu.mem_write(0x89c66d, b'\10')
cases, expected = [], []
for owner in range(4):
    native_tribe = 0x89d1c8+owner*0xc65
    cpu.mem_write(native_tribe, bytes(0xc65))
    cpu.mem_write(native_tribe+0x93d, b'\10')
    cpu.mem_write(native_tribe+0xc1f, b'\2')
    for model in (0, 1, 2, 3, 12, 16, 18, 21, 22, 23, 30):
        for value in (0, 1, 127, 254, 255):
            unit = head
            cpu.mem_write(unit, bytes(0xb3))
            cpu.mem_write(unit+0xe, b'\20')
            cpu.mem_write(unit+0x2b, bytes([model]))
            cpu.mem_write(unit+0x2f, bytes([owner]))
            cpu.mem_write(native_tribe+0xc26+model, bytes([value]))
            call(0x4c14c0, unit)
            expected.append(cpu.mem_read(native_tribe+0xc26+model, 1)[0])
            cases.append(dict(owner=owner, model=model, value=value))
js = """import {createWorld,recordSpellCast} from './app/model.ts';
let input='';for await(const c of process.stdin)input+=c;const w=createWorld();
console.log(JSON.stringify(JSON.parse(input).map(c=>{
 if(c.model<22)w.spellCasts[c.owner][c.model]=c.value;
 recordSpellCast(w,c.owner,c.model);return c.model<22?w.spellCasts[c.owner][c.model]:c.value;
})));"""
actual = browser(js, cases)
assert len(actual) == len(expected)
for case, want, got in zip(cases, expected, actual):
    assert want == got, (case, want, got)
print(f'PASS: {len(cases)} native spell-initializer counters; wrap at 256 and exclude models 22+')

# Rebuild actual native building counters, then execute opcode 1136 and
# both reads through the original interpreter. Mana rebuilding is disabled;
# no calls are intercepted. Browser progress maps native state 2 to completion.
import random
rng=random.Random(1136);cases=[];expected=[]
for trial in range(40):
    rows=[];cpu.mem_write(0x89d1c8,bytes(4*0xc65))
    cpu.mem_write(0x89d17c,struct.pack('<I',0x20));cpu.mem_write(0x89d188,struct.pack('<I',73))
    cpu.mem_write(0x89c6f0,b'\0');cpu.mem_write(0x890330,bytes(4))
    for i in range(24):
        model=rng.choice([1,2,3,4,5,7,18,19]);owner=rng.randrange(2);state=rng.randrange(6);active=bool(rng.randrange(4))
        p=head+i*256;cpu.mem_write(p,bytes(256))
        cpu.mem_write(p+4,struct.pack('<I',p+256 if i<23 else 0))
        cpu.mem_write(p+0x10,struct.pack('<I',0x20000000 if active else 0))
        cpu.mem_write(p+0x2a,bytes([2,model,state]));cpu.mem_write(p+0x2f,bytes([owner]))
        rows.append(dict(model=model,owner=owner,state=state,active=active))
    cpu.mem_write(0x890324,struct.pack('<I',head));call(0x4ecac0)
    results=[]
    for internal in range(1066,1146):
        codes=[12,1003,1006,1136,1007,0,1,1007,2,3,1007,4,3,1004,1019]
        fields=[[1,0],[2,0],[1,1],[2,internal],[1,2]]
        blob=bytearray(12552);struct.pack_into('<'+'H'*len(codes),blob,0,*codes)
        for i,f in enumerate(fields):struct.pack_into('<Ii',blob,8192+i*8,*f)
        cpu.mem_write(program,bytes(blob));call(0x48c6b0,0x89d1c8+0xc65,program)
        results.append([*struct.unpack('<3i',cpu.mem_read(program+0x3000,12)),bool(struct.unpack('<I',cpu.mem_read(0x89d1c8+0xc65+0x596,4))[0]&0x10000)])
    cases.append(rows);expected.append(results)
js="""import {createWorld,campaignCommand,campaignInternal} from './app/model.ts';
let input='';for await(const c of process.stdin)input+=c;
console.log(JSON.stringify(JSON.parse(input).map(rows=>{
 const w=createWorld();w.turn=73;
 w.buildings=rows.filter(b=>b.model<18).map(b=>({team:b.owner===0?'blue':'red',kind:b.model<4?'hut':({4:'tower',5:'temple',7:'camp'})[b.model],level:b.model<4?b.model:1,hp:b.active?100:0,progress:b.state===2?1:0}));
 return Array.from({length:80},(_,i)=>{campaignCommand(w,1136,[]);const turn=campaignInternal(w,0),all=campaignInternal(w,1066+i),complete=campaignInternal(w,1066+i);return [turn,all,complete,w.ai.includeIncompleteBuildings];});
})));"""
actual=browser(js,cases);assert len(actual)==len(expected)
for rows,want,got in zip(cases,expected,actual):
    for index,(a,b) in enumerate(zip(want,got)):assert a==b,(1066+index,rows,a,b)
print(f'PASS: {len(cases)} native building-list rebuilds and {len(cases)*80} one-shot building-query sequences')

# Actual opcode 1151 at every marker; cell traversal skips a non-head.
level=json.loads((root/'app/level-one.ts').read_text().split('export default ',1)[1].rstrip(';\n'))
cpu.mem_write(0x89b7a5,struct.pack('<256H',*level['markers']))
cpu.mem_write(0x8a03e4,bytes(0x40000));cpu.mem_write(head,bytes(512))
cpu.mem_write(head+0x2a,b'\6\6');cpu.mem_write(head+256+0x2a,b'\2\1');cpu.mem_write(head+256+0x20,b'\2\0')
cpu.mem_write(0x890394,struct.pack('<I',head+256));cpu.mem_write(0x890398,struct.pack('<I',head))
cell=(246//2)*128+18//2;cpu.mem_write(0x8a03ea+cell*16,b'\1\0')
expected=[]
for marker in range(256):
    blob=bytearray(12552);struct.pack_into('<7H',blob,0,12,1003,1006,1151,0,1004,1019);struct.pack_into('<Ii',blob,8192,0,marker)
    cpu.mem_write(program,bytes(blob));cpu.mem_write(head+0x6d,b'\1');call(0x48c6b0,tribe,program)
    expected.append(bool(cpu.mem_read(head+0x6d,1)[0]&2))
actual=browser("""import {createWorld,campaignCommand} from './app/model.ts';const w=createWorld(),head=w.shrines.find(s=>s.kind==='lightning');
console.log(JSON.stringify(Array.from({length:256},(_,marker)=>{head.forced=false;campaignCommand(w,1151,[0],{fields:[[0,marker]]});return head.forced;})));""",[])
assert actual==expected
print('PASS: 256 native marker-trigger commands with actual cell lookup')
# Real mission markers miss this head, so include explicit hit/adjacent fixtures.
packed_cases=[(y<<8)|x for x in (16,18,19,20) for y in (244,246,247,248)]
expected=[]
for packed in packed_cases:
    write_marker=struct.pack('<H',packed);cpu.mem_write(0x89b7a5,write_marker)
    blob=bytearray(12552);struct.pack_into('<7H',blob,0,12,1003,1006,1151,0,1004,1019);struct.pack_into('<Ii',blob,8192,0,0)
    cpu.mem_write(program,bytes(blob));cpu.mem_write(head+0x6d,b'\1');call(0x48c6b0,tribe,program)
    expected.append(bool(cpu.mem_read(head+0x6d,1)[0]&2))
actual=browser("""import {createWorld,forceHead} from './app/model.ts';import level from './app/level-one.ts';
let input='';for await(const c of process.stdin)input+=c;const w=createWorld(),head=w.shrines.find(s=>s.kind==='lightning');
console.log(JSON.stringify(JSON.parse(input).map(packed=>{level.markers[0]=packed;head.forced=false;forceHead(w,0);return head.forced;})));""",packed_cases)
assert sum(expected)==4 and actual==expected
print('PASS: 16 marker-trigger hit/adjacent-cell fixtures, including ignored odd bits')
