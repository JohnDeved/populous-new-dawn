"""Compare original kind-7 ordinary guard-tower panel drawing.
Only palette setters and final line/rectangle/sprite consumers are supplied.
Usage: python scripts/check-native-training-panel.py /path/to/d3dpoptb.exe [--record]
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

# Table metadata gives the completed guard tower kind 7, with no birth/upgrade bars.
assert read(0x5a7228+4*76+0x34,'B')==0
assert read(0x5a7228+4*76+0x48,'I')&0x441==0
write(effect+0x70,'BB',7,0);write(building+0x2b,'B',4)
cases=[]
for model in (0,2,3,4,5,6,7):
 for selected in (False,True):
  for slot in (0,5):
   for dismantling,turn,hover,pressed in [(False,0,False,False),(False,0,True,False),(False,0,True,True),(True,0,False,False),(True,2,False,False),(True,2,True,True)]:
    c=dict(capacity=1,occupants=[] if not model else [dict(model=model,selected=selected)],active=False,cost=0,progress=0,warning=False,dismantling=dismantling,turn=turn,controlHover=hover,controlPressed=pressed)
    cpu.mem_write(building+0x86,bytes(12));p=0x2003000
    write(0x890390+10*4,'I',p);write(p+0x2a,'BB',1,model);write(p+0x7a,'B',128 if selected else 0)
    if model:write(building+0x86+slot*2,'H',10)
    write(building+0xa6,'B',int(bool(model)));write(building+0x9c,'H',0x8000 if dismantling else 0)
    write(0x897987,'B',(turn>>1)&1);write(0x89c6c1,'I',2);write(0x984580,'ii',30,10);write(0x895faf,'B',int(pressed));write(0x5da074,'I',0)
    events=[];call(0x504bc0,panel,building,0,0,panel+64,panel+66,0,int(hover))
    c['expected']=dict(width=read(panel+64,'H'),height=read(panel+66,'H'),events=events);cases.append(c)
fixture=dict(executableSha256=identity['sha256'],cases=cases)
path=ROOT/'tests/fixtures/tower-panel.json'
if '--record' in sys.argv:path.write_text(json.dumps(fixture,separators=(',',':'))+'\n')
else:assert json.loads(path.read_text())==fixture
js="import{occupantPanel}from'./app/training-panel.ts';let s='';for await(const c of process.stdin)s+=c;console.log(JSON.stringify(JSON.parse(s).map(occupantPanel)))"
actual=json.loads(subprocess.check_output(['node','--input-type=module','-e',js],input=json.dumps(cases).encode(),cwd=ROOT))
assert actual==[c['expected'] for c in cases]
print(f'PASS: {len(cases)} complete original tower panel calls, slot holes, classes, selection, blink and control states')

if '--browser' in sys.argv:
    from panel_pixels import check_panel_pixels
    frames = json.loads(Path('/private/tmp/populous-tower-panel-pixels.json').read_text())
    check_panel_pixels(exe, frames, cases)
