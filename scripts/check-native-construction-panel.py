"""Capture original construction-plan panel artwork with physical worker slots.
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

cases=[]
rules=json.loads((ROOT/'app/original-rules.json').read_text())
linked=0x2008000
write(0x890390+3*4,'I',linked);write(linked+0x24,'H',3);write(linked+0x2a,'BB',2,7)
write(effect+0x70,'B',1);write(building+0x2a,'B',9)
for model in range(1,17):
 capacity=rules['buildingMaxWorkers'][model];total=rules['buildingLife'][model]//100
 for count in sorted({0,1,capacity//2,capacity}):
  for attached in (False,True):
   for dismantling,warning,turn,hover,pressed in [(False,False,0,False,False),(True,False,2,False,False),(False,True,0,False,False),(True,True,4,True,True),(False,False,0,True,True)]:
    c=dict(capacity=capacity,occupants=[dict(model=2,selected=j==1) for j in range(count)],wood=0 if count==0 else total if count==capacity else total//2,totalWood=total,linked=attached,dismantling=attached and dismantling,warning=warning,turn=turn,controlHover=attached and hover,controlPressed=attached and pressed)
    cpu.mem_write(building+0x6a,bytes(40))
    for j in range(count):
     p=0x2003000+j*256;write(0x890390+(10+j)*4,'I',p);write(p+0x2a,'BB',1,2);write(p+0x7a,'B',128 if j==1 else 0);write(building+0x6a+(j+1 if count<capacity else j)*2,'H',10+j)
    write(building+0x92,'H',3 if attached else 0);write(building+0x96,'h',c['wood']*100);write(building+0x9a,'B',count);write(building+0x9e,'B',model)
    write(linked+0x9c,'H',0x8000 if dismantling else 0);write(building+0x14,'I',0x1000 if warning else 0)
    write(0x897987,'B',(turn>>1)&1);write(0x897989,'B',(turn>>2)&1)
    write(0x89c6c1,'I',2);write(0x895faf,'B',int(pressed));write(0x5da074,'I',0)
    # Measure first; place the cursor over the last cell in the upper row.
    call(0x504bc0,panel,building,0,0,panel+64,panel+66,1,0)
    width=read(panel+64,'H');write(0x984580,'ii',width-10,10)
    events=[];call(0x504bc0,panel,building,0,0,panel+64,panel+66,0,int(c['controlHover']))
    c['expected']=dict(width=read(panel+64,'H'),height=read(panel+66,'H'),events=events)
    cases.append(c)
fixture=dict(executableSha256=identity['sha256'],cases=cases)
path=ROOT/'tests/fixtures/construction-panel.json'
if '--record' in sys.argv:path.write_text(json.dumps(fixture,separators=(',',':'))+'\n')
else:assert json.loads(path.read_text())==fixture
print(f'Captured {len(cases)} complete original plan-panel draw calls')
if '--capture-only' not in sys.argv:
 js="import{constructionPanel}from'./app/construction-panel.ts';let s='';for await(const c of process.stdin)s+=c;console.log(JSON.stringify(JSON.parse(s).map(c=>{const{width,height,events}=constructionPanel(c);return{width,height,events}})))"
 actual=json.loads(subprocess.check_output(['node','--input-type=module','-e',js],input=json.dumps(cases).encode(),cwd=ROOT))
 for i,(c,a) in enumerate(zip(cases,actual)):
  expected=dict(c['expected'])
  # Original measurement omits the second worker row for an unlinked plan.
  if c['capacity']>7 and not c['linked']:expected['height']+=28
  assert expected==a,(i,c,a)
 print('PASS: all native draw submissions/widths match; unlinked two-row canvas height deliberately includes the clipped row')

if '--browser' in sys.argv:
    from panel_pixels import check_panel_pixels
    frames = json.loads(Path('/private/tmp/populous-construction-panel-pixels.json').read_text())
    check_panel_pixels(exe, frames, cases, lambda c: 28 if c['capacity']>7 and not c['linked'] else 0)
