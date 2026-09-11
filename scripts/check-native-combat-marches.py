"""Compare complete 00520250 arrival-voice consumption and 0051ff40 release.
Only 0048a050 audio output is hooked. Run with the supplied D3D EXE; --record
keeps representative captures for the portable regression.
"""
import json, random, struct, subprocess, sys
from pathlib import Path
from unicorn import UC_HOOK_CODE
from unicorn.x86_const import UC_X86_REG_ESP, UC_X86_REG_EIP
from decomp import native_cpu, ROOT
cpu, identity = native_cpu(Path(sys.argv[1]))
cpu.mem_map(0x2000000, 0x20000)
base, stack, stop = 0x2000000, 0x201d000, 0x201e000
rng = random.Random(0x520250)
def write(a, f, *v): cpu.mem_write(a, struct.pack('<'+f, *v))
def read(a, f): return struct.unpack('<'+f, cpu.mem_read(a, struct.calcsize('<'+f)))[0]
def call(address, *args):
    write(stack, 'I'*(len(args)+1), stop, *args)
    cpu.reg_write(UC_X86_REG_ESP, stack)
    cpu.emu_start(address, stop, count=100000)
    assert cpu.reg_read(UC_X86_REG_EIP) == stop

def audio(c, address, size, _):
    sp = c.reg_read(UC_X86_REG_ESP)
    person, cue, flags = struct.unpack('<III', c.mem_read(sp+4, 12))
    events.append([(person-base)//256, cue, flags])
    c.reg_write(UC_X86_REG_EIP, read(sp, 'I'))
    c.reg_write(UC_X86_REG_ESP, sp+4)
cpu.hook_add(UC_HOOK_CODE, audio, begin=0x48a050, end=0x48a050)
for id_ in range(1, 101): write(0x890390+id_*4, 'I', base+id_*256)
cases = []
for n in range(1024):
    marches = [dict(count=rng.choice([0,1,2,3,4,127,255]), person=rng.randrange(1,101),
        a=rng.randrange(65536), b=rng.randrange(65536), distance=rng.choice([0,1535,1536,2560,0xffffffff])) for _ in range(n%9)]
    reservation = dict(flags4=rng.getrandbits(32), reactionTimer=rng.choice([0,1,2,255]), reactionDuration=rng.randrange(256))
    write(0xafc288, 'i', len(marches))
    for i, m in enumerate(marches): write(0xafc290+i*11, 'BHHHI', *m.values())
    visits = []
    for _ in range(3):
        events = []
        call(0x520250)
        remaining = [dict(zip(marches[0], struct.unpack('<BHHHI', cpu.mem_read(0xafc290+i*11,11)))) for i in range(read(0xafc288,'i'))]
        visits.append(dict(events=events, marches=remaining))
    write(base+0x10, 'I', reservation['flags4'])
    write(base+0x31, 'BB', reservation['reactionTimer'], reservation['reactionDuration'])
    call(0x51ff40, base)
    released = dict(flags4=read(base+0x10,'I'),reactionTimer=read(base+0x31,'B'),reactionDuration=read(base+0x32,'B'))
    cases.append(dict(input=dict(marches=marches,reservation=reservation), expected=dict(visits=visits,released=released)))
js = """
import {announceCombatMarches} from './app/combat-order-search.ts';
import {releaseAttackReservation} from './app/combat-targets.ts';
let text='';for await(const c of process.stdin)text+=c;
console.log(JSON.stringify(JSON.parse(text).map(({input:c})=>{
 const visits=[];for(let i=0;i<3;i++){const events=[];announceCombatMarches(c.marches,(id,cue)=>events.push([id,cue,0]));visits.push({events,marches:structuredClone(c.marches)});}
 releaseAttackReservation(c.reservation);return {visits,released:c.reservation};
})));
"""
r = subprocess.run(['node','--input-type=module','-e',js],input=json.dumps(cases),capture_output=True,text=True,cwd=ROOT)
assert r.returncode == 0, r.stderr
for n, (actual, case) in enumerate(zip(json.loads(r.stdout),cases)):
    assert actual == case['expected'], (n,actual,case)
print('PASS: 1024 native arrival-voice lists over three visits and attacker reservation releases; thresholds, counts, compaction and preserved duration.')
if '--record' in sys.argv:
    (ROOT/'tests/fixtures/combat-marches.json').write_text(json.dumps(cases[::31],separators=(',',':'))+'\n')
