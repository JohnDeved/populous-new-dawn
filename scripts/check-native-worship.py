"""Compare worship work/refill and timed spell rewards with original x86 routines.
Usage: python scripts/check-native-worship.py /path/to/d3dpoptb.exe
Only final object deletion is intercepted; fixtures supply map cells and command records.
"""
import json
from pathlib import Path
import struct
import subprocess
import sys
from unicorn import UC_HOOK_CODE
from unicorn.x86_const import UC_X86_REG_ESP, UC_X86_REG_EIP, UC_X86_REG_EAX
from decomp import native_cpu

root = Path(__file__).resolve().parents[1]
cpu, _ = native_cpu(Path(sys.argv[1]))
cpu.mem_map(0x2000000, 0x20000)
unit, record, people, stack, stop = 0x2000000, 0x2001000, 0x2002000, 0x201d000, 0x201e000
deleted = False
def read(address, fmt):
    return struct.unpack(fmt, cpu.mem_read(address, struct.calcsize(fmt)))[0]
def write(address, fmt, value):
    cpu.mem_write(address, struct.pack(fmt, value))
def call(address, *args):
    cpu.mem_write(stack, struct.pack('<'+'I'*(1+len(args)), stop, *args))
    cpu.reg_write(UC_X86_REG_ESP, stack)
    cpu.emu_start(address, stop, timeout=100000, count=100000)
    assert cpu.reg_read(UC_X86_REG_EIP) == stop, f'Native call {address:x} did not return'
def deletion(cpu, address, size, user):
    global deleted
    sp = cpu.reg_read(UC_X86_REG_ESP)
    assert read(sp+4, '<I') == unit
    deleted = True
    cpu.reg_write(UC_X86_REG_EIP, read(sp, '<I'))
    cpu.reg_write(UC_X86_REG_ESP, sp+4)
    cpu.reg_write(UC_X86_REG_EAX, 0)
cpu.hook_add(UC_HOOK_CODE, deletion, begin=0x4ef180, end=0x4ef180)
cpu.mem_write(0x8a03e4, bytes(0x40000))
write(0x890390, '<I', 0)
write(0x890370, '<I', 0)  # No decorative head; real eligibility checks still execute.
write(0x93883a, '<H', 0x1b)  # Native worship command, active flags.
for i in range(8):
    p = people+i*256
    cpu.mem_write(p, bytes(256))
    cpu.mem_write(p+0x2a, b'\1\2\12\1')
    write(p+0x9b, '<H', 1)
    write(0x890390+(i+1)*4, '<I', p)

cases, expected = [], []
profiles = [[1]*180, [0]*8+[1]*12+[0]*8+[1]*152,
            [2]*16+[0]*8+[4]*156, [0,1,2,3,4,0,0,0]*23]
for required, target, remaining, growth in ((1,28,0,1),(1,32,4,1),(2,8,0,8),
                                           (4,2,1,1),(2,2,-1,1),(1,1,0,0)):
    for profile, counts in enumerate(profiles + [[0]*40, [1]*40]):
        settings = [0]*32
        settings[1], settings[3] = 1, remaining & 255
        for index, value in ((4,required),(26,target),(30,growth)):
            settings[index:index+2] = struct.pack('<h', value)
        cpu.mem_write(unit, bytes(256));cpu.mem_write(unit+0x2a, b'\6\6')
        write(unit+0x6e, '<B', 1)
        cpu.mem_write(record, bytes([6,6,0,0,0,0,0]+settings))
        call(0x485b00, unit, record)
        deleted, trace = False, []
        force_turns = [1,5,7,12,22] if profile >= len(profiles) else []
        for turn, count in enumerate(counts, 1):
            for i in range(count):
                write(people+i*256+0x20, '<H', i+2 if i+1<count else 0)
            write(0x8a03ea, '<H', 1 if count else 0)
            write(unit+0x2e, '<B', turn & 255)
            if turn in force_turns: write(unit+0x6d, '<B', read(unit+0x6d, '<B') | 2)
            before = bool(read(unit+0x6d, '<B') & 1)
            was_deleted = deleted
            if not deleted: call(0x4fb270, unit)
            flags = read(unit+0x6d, '<B')
            trace.append(dict(work=read(unit+0x96,'<i'),target=read(unit+0x9a,'<i'),
                              remaining=read(unit+0x6b,'<b'),cooldown=read(unit+0x90,'<h'),
                              enabled=bool(flags&1),grown=bool(flags&4),reset=bool(read(unit+0x6e,'<B')),
                              active=not deleted and not (remaining<0 and not flags&1),
                              fired=(not was_deleted and deleted) or (before and not flags&1)))
        cases.append(dict(settings=settings,counts=counts,forceTurns=force_turns));expected.append(trace)
js = """import {createWorship,stepWorship} from './app/worship.ts';
let input='';for await(const c of process.stdin)input+=c;
console.log(JSON.stringify(JSON.parse(input).map(c=>{
 const s=createWorship(c.settings);let forced=false;return c.counts.map((count,i)=>{
  if(c.forceTurns.includes(i+1))forced=true;if(s.reset)forced=false;
  const fired=stepWorship(s,i+1,count,forced);
  const {work,target,remaining,cooldown,enabled,grown,reset,active}=s;
  return {work,target,remaining,cooldown,enabled,grown,reset,active,fired};
 });
})));"""
def compare(js, cases, expected):
    result = subprocess.run(['node','--input-type=module','-e',js],input=json.dumps(cases),
                            text=True,capture_output=True,cwd=root)
    assert result.returncode == 0,result.stderr
    actual = json.loads(result.stdout)
    assert len(actual)==len(expected)
    for case,want,got in zip(cases,expected,actual):
        assert len(want)==len(got)
        for turn,(a,b) in enumerate(zip(want,got),1):assert a==b,(case,turn,a,b)
compare(js,cases,expected)
print(f'PASS: {sum(len(c["counts"]) for c in cases)} native worship turns, including decay, refill, depletion and growth')

# Actual reward processor, initialized past its visual setup. Player identity is
# different from the recipient so the hide callback cannot enter the Windows UI.
write(0x89c6f0, '<b', -1)
cases, expected = [], []
for model in (3,12):
    for stock in (0,3,4,5,15,16,0x43,0xe4,0xf3,0xff):
        cpu.mem_write(unit, bytes(256));write(unit+0x2d,'<B',1)
        write(unit+0x7c,'<B',11);write(unit+0x74,'<I',model);write(unit+0x80,'<B',3)
        write(unit+0x7a,'<h',82);write(unit+0x7f,'<B',6)
        write(0x96071e+model,'<B',stock)
        deleted, trace = False, []
        for turn in range(1,84):
            if not deleted: call(0x4facf0,unit)
            value=read(0x96071e+model,'<B')
            trace.append(dict(shots=value&15,gifts=value>>4,pending=not deleted))
        cases.append(dict(model=model,stock=stock));expected.append(trace)
js = """import {createWorld,tick} from './app/model.ts';
let input='';for await(const c of process.stdin)input+=c;
console.log(JSON.stringify(JSON.parse(input).map(c=>{
 const w=createWorld(),kind=c.model===3?'lightning':'bridge';w.charging=false;
 w.shots[kind]=c.stock&15;w.giftCounts[kind]=c.stock>>>4;
 w.gifts=[{kind,x:0,z:0,remaining:82}];const trace=[];
 for(let i=0;i<83;i++){tick(w,1/12);trace.push({shots:w.shots[kind],gifts:w.giftCounts[kind],pending:w.gifts.length>0});}
 return trace;
})));"""
compare(js,cases,expected)
print(f'PASS: {len(cases)*83} native reward turns; delayed grant, four-shot cap and separate gift counter')
