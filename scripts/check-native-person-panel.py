"""Compare original person command icons, panel artwork and lifetime.
Only palette setters and final line/rectangle/sprite consumers are supplied.
Usage: python scripts/check-native-person-panel.py /path/to/d3dpoptb.exe [--record]
"""
import hashlib, json, struct, subprocess, sys
from pathlib import Path
from unicorn import UC_HOOK_CODE
from unicorn.x86_const import UC_X86_REG_ESP, UC_X86_REG_EIP, UC_X86_REG_EAX
from decomp import native_cpu, configure_native_constants, ROOT

exe = Path(sys.argv[1]); cpu, identity = native_cpu(exe); configure_native_constants(cpu, exe)
cpu.mem_map(0x2000000, 0x100000)
panel, building, effect, entries, stack, stop = 0x2000000, 0x2001000, 0x2002000, 0x2010000, 0x20fd000, 0x20fe000
def write(a, f, *v): cpu.mem_write(a, struct.pack('<' + f, *v))
def read(a, f): return struct.unpack('<' + f, cpu.mem_read(a, struct.calcsize('<' + f)))[0]
def call(a, *args):
    write(stack, 'I' * (len(args) + 1), stop, *args); cpu.reg_write(UC_X86_REG_ESP, stack)
    cpu.emu_start(a, stop, count=100000)
    assert cpu.reg_read(UC_X86_REG_EIP) == stop, hex(cpu.reg_read(UC_X86_REG_EIP))
raw = (exe.parent / 'data/hfx0-0.dat').read_bytes()
hud = json.loads((ROOT / 'app/original-hud.json').read_text())
assert hashlib.sha256(raw).hexdigest() == hud['sha256']['data/hfx0-0.dat']
for i in range(struct.unpack_from('<I', raw, 4)[0]):
    w, h, p = struct.unpack_from('<HHI', raw, 8 + i * 8); write(entries + i * 8, 'IHH', p, w, h)
write(0x59df14, 'I', entries); write(0x890390 + 4, 'I', effect)
write(panel + 10, 'H', 1); write(effect + 0x70, 'B', 5)
write(building + 0x24, 'H', 2); write(building + 0x2a, 'BB', 2, 7)
write(0x89c6f4, '4B', 130, 172, 139, 228)
write(0x5da078, 'I', 0) # Hardware presentation path.
events = []; color = 0
def consume(cpu, a, size, user):
    global color
    sp = cpu.reg_read(UC_X86_REG_ESP)
    if a in (0x415f70, 0x4525d0): color = read(sp + 4, 'I') & 255
    elif a == 0x47d980:
        vertices = [struct.unpack('<2f8xI', cpu.mem_read(read(sp+i*4,'I'),20)) for i in range(1,5)]
        events.append(['fill',color,list(map(int,(*vertices[0][:2],*vertices[2][:2]))),vertices[0][2] >> 24])
    elif a == 0x5166c0: events.append(['line', color, list(struct.unpack('<4i', cpu.mem_read(sp + 4, 16)))])
    else:
        sprite = (read(sp + 12, 'I') - entries) // 8
        events.append(['sprite', sprite, read(sp + 4, 'i'), read(sp + 8, 'i'), color if a == 0x516370 else -1, bool(read(0x5da074, 'I') & 8)])
    cpu.reg_write(UC_X86_REG_EAX, 0); cpu.reg_write(UC_X86_REG_EIP, read(sp, 'I'))
    cpu.reg_write(UC_X86_REG_ESP, sp + (28 if a == 0x47d980 else 8 if a in (0x415f70, 0x4525d0) else 4))
for a in (0x415f70, 0x4525d0, 0x47d980, 0x5166c0, 0x5162e0, 0x516370):
    cpu.hook_add(UC_HOOK_CODE, consume, begin=a, end=a)


import random
rng=random.Random(0x4369f0)
icon_cases=[];cases=[]
pool=0x938830
for trial in range(512):
 orders=[dict(model=rng.randrange(35),flags=rng.choice([0,1,8,9]),references=1,object=0,a=3,b=0) for _ in range(12)]
 for i,o in enumerate(orders):write(pool+i*10,'BBHHHH',o['model'],o['flags'],1,0,o['a'],o['b'])
 person=dict(immediateCommand=rng.randrange(12),commands=[rng.randrange(12) for _ in range(8)],commandCursor=rng.choice([*range(8),9,255]))
 target=dict(id=3,**{'class':rng.choice([0,1,4]),'model':rng.randrange(5),'flags2':rng.randrange(2)})
 write(0x890390+12,'I',building+256);write(building+256+0x2a,'BB',target['class'],target['model']);write(building+256+0xc,'I',target['flags2'])
 write(building+0x9b,'H',person['immediateCommand']);write(building+0x8b,'8H',*person['commands']);write(building+0xa6,'B',person['commandCursor'])
 call(0x4369f0,building,panel+0x100,panel+0x200)
 n=cpu.reg_read(UC_X86_REG_EAX)&255
 icons=[dict(model=read(panel+0x100+i,'B'),sprite=read(panel+0x200+i*4,'I')) for i in range(n)]
 icon_cases.append(dict(orders=orders,person=person,target=target,expected=icons))
 write(effect+0x70,'B',2);write(building+0x2a,'BB',1,2)
 health=rng.choice([0,1,200,999,1000,1999,2000]);maximum=2000 if trial%8 else 0
 write(building+0x6c,'hh',maximum,health);write(building+0xa7,'B',n)
 events=[];call(0x504bc0,panel,building,0,0,panel+0x12,panel+0x14,0,0)
 cases.append(dict(health=health,maximum=maximum,icons=[i['sprite'] for i in icons],expected=dict(width=read(panel+0x12,'H'),height=read(panel+0x14,'H'),events=events)))
js="""import {personOrderIcons,personPanel} from './app/person-panel.ts';let s='';for await(const c of process.stdin)s+=c;const v=JSON.parse(s);console.log(JSON.stringify({icons:v.icons.map(c=>personOrderIcons({records:c.orders},c.person,new Map([[3,c.target]])).map(({model,sprite})=>({model,sprite}))),panels:v.panels.map(c=>personPanel(c.health,c.maximum,c.icons))}));"""
actual=json.loads(subprocess.check_output(['node','--input-type=module','-e',js],input=json.dumps(dict(icons=icon_cases,panels=cases)).encode(),cwd=ROOT))
assert actual['icons']==[c['expected'] for c in icon_cases]
for i,c in enumerate(cases):assert actual['panels'][i]==c['expected'],(i,c,actual['panels'][i])
if '--record' in sys.argv:
 (ROOT/'tests/fixtures/person-panel.json').write_text(json.dumps(dict(executableSha256=identity['sha256'],icons=icon_cases[::8],panels=cases[::8]),separators=(',',':'))+'\n')
print('PASS: 512 native command-icon traversals and complete person-panel draw traces')

# Lifetime executes original 0x504920. Position/cell and terminal rendering/deletion
# consumers are supplied; person panels have no automatic building-activity hold.
def terminal(c,a,size,user):
 sp=c.reg_read(UC_X86_REG_ESP)
 c.reg_write(UC_X86_REG_EAX,0);c.reg_write(UC_X86_REG_EIP,read(sp,'I'));c.reg_write(UC_X86_REG_ESP,sp+4)
for a in (0x5090f0,0x4ee580,0x508ee0,0x507900,0x4ef180,0x5079b0):
 cpu.hook_add(UC_HOOK_CODE,terminal,begin=a,end=a)
lifetimes=[]
for trial in range(32):
 address=0x895fb9;cpu.mem_write(address,bytes(158));write(address,'Bb',1,1 if trial&1 else -1)
 write(address+6,'h',20 if trial&1 else 0);write(address+10,'HH',1,2);write(address+0x18,'3HH',3,0,20,0)
 write(address+0x20,'H',3);write(0x895fad,'B',1)
 write(0x890398,'I',building);write(building+0x2a,'B',1)
 holds=[bool(rng.randrange(4)==0) for _ in range(50)]
 initial=dict(phase=1 if trial&1 else -1,remaining=20 if trial&1 else 0,hold=20);expected=[]
 for held in holds:
  if held and read(address+1,'b')==1:write(address+6,'h',20)
  call(0x504920)
  expected.append(dict(phase=read(address+1,'b'),remaining=read(address+6,'h'),alive=bool(read(address,'B'))))
  if not read(address,'B'):break
 lifetimes.append(dict(initial=initial,holds=holds[:len(expected)],expected=expected))
js="""import {stepPersonPanel} from './app/person-panel.ts';let s='';for await(const c of process.stdin)s+=c;console.log(JSON.stringify(JSON.parse(s).map(c=>c.holds.map(held=>{const alive=stepPersonPanel(c.initial,held);return {phase:c.initial.phase,remaining:c.initial.remaining,alive}}))));"""
actual=json.loads(subprocess.check_output(['node','--input-type=module','-e',js],input=json.dumps(lifetimes).encode(),cwd=ROOT))
assert actual==[c['expected'] for c in lifetimes]
# Confirm the shipped neutral-context right-button inspection bindings and predicate.
assert struct.unpack('<BIBBBI',cpu.mem_read(0x5d6598,12))==(241,114,9,0,1,0x4feed0)
assert struct.unpack('<BIBBBI',cpu.mem_read(0x5d65a4,12))==(241,115,12,0,1,0x4ff3f0)
for mode in range(18):
 for picking in (0,1):
  write(0x89c6e7,'B',mode);write(0x87cabc,'B',picking)
  call(0x4feed0);assert cpu.reg_read(UC_X86_REG_EAX)==int(bool(picking and mode==0))
# Resolve the actual modifier rules as well as the context predicate.
from unicorn.x86_const import UC_X86_REG_ECX
bindings=0;table=0x2006000;binding=0x2007000
write(table+241*4,'I',binding)
write(binding,'IBBIBI',114,9,0,0x4feed0,1,binding+15)
write(binding+15,'IBBIBI',115,12,0,0x4ff3f0,1,0)
write(0x89c661,'I',0)
for mode in range(18):
 for picking in (0,1):
  for modifiers in range(8):
   for event in (1,4):
    for held in (0,64):
     write(0x89c6e7,'B',mode);write(0x87cabc,'B',picking);write(0x98e908,'I',held)
     cpu.reg_write(UC_X86_REG_ECX,table);call(0x489470,241,modifiers,event)
     expected=114 if event==1 and not modifiers and picking and mode==0 else 115 if event==4 and not modifiers and held else 0
     assert cpu.reg_read(UC_X86_REG_EAX)==expected
     bindings+=1
print('PASS:',bindings,'native right-button inspection modifier/context bindings')
if '--record' in sys.argv:
 p=ROOT/'tests/fixtures/person-panel.json';fixture=json.loads(p.read_text());fixture['lifetimes']=lifetimes;p.write_text(json.dumps(fixture,separators=(',',':'))+'\n')
print('PASS: 32 complete native panel lifetimes with held refresh and original right-button bindings')

if '--browser' in sys.argv:
    from panel_pixels import check_panel_pixels
    frames = json.loads(Path('/private/tmp/populous-person-panel-pixels.json').read_text())
    check_panel_pixels(exe, frames, cases)
