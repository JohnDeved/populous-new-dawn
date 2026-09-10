"""Compare original worship panel drawing.
Draw comparisons supply palette/raster consumers and a controlled person lookup.
Input consumers are captured; standing geometry and speed gates run in the PE.
Usage: python scripts/check-native-worship-panel.py /path/to/d3dpoptb.exe [--record]
"""
import hashlib, itertools, json, struct, subprocess, sys
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
trigger, people = 0x2003000, 0x2004000
write(0x890398,'I',building);write(0x89039c,'I',trigger)
write(building+0x2a,'BB',5,9);write(building+0x3d,'HH',256,256)
write(trigger+0x24,'H',3);write(trigger+0x2a,'BB',6,6)
write(0x8a03ea,'H',3)
write(0x89c6f0,'B',0)
write(effect+0x70,'B',3)
roster=[]
def person_lookup(cpu,a,size,user):
    sp=cpu.reg_read(UC_X86_REG_ESP);index=read(sp+8,'I');i=read(index,'I')
    value=people+i*256 if i<len(roster) else 0
    cpu.reg_write(UC_X86_REG_EAX,value);cpu.reg_write(UC_X86_REG_EIP,read(sp,'I'));cpu.reg_write(UC_X86_REG_ESP,sp+4)
lookup_hook=cpu.hook_add(UC_HOOK_CODE,person_lookup,begin=0x43c600,end=0x43c600)
cases=[]
for required in [1,2,4,7,8,9,16]:
 for count in [0,1,required]:
  for enabled in [True,False]:
   for shaman_only in [False,True]:
    for fraction in [0,0.5,1]:
     roster=[dict(model=2+i%2,selected=bool(i%2)) for i in range(count)]
     for i,p in enumerate(roster):
      write(people+i*256+0x24,'H',10+i);write(people+i*256+0x2a,'BB',1,p['model']);write(people+i*256+0x7a,'B',128 if p['selected'] else 0)
     state=dict(required=required,people=roster,enabled=enabled,shamanOnly=shaman_only,work=int(28*required*required*fraction),target=28,growth=100,cooldown=int(100*(1-fraction)))
     write(trigger+0x6d,'B',int(enabled)|(16 if shaman_only else 0));write(trigger+0x8e,'h',required);write(trigger+0x86,'h',count)
     write(trigger+0x9a,'i',state['target']);write(trigger+0x96,'i',state['work'])
     write(trigger+0x94,'h',state['growth']);write(trigger+0x90,'h',state['cooldown'])
     events.clear();write(0x5da074,'I',0)
     call(0x504bc0,panel,building,0,0,panel+0x300,panel+0x302,0,0)
     cases.append(dict(state=state,expected=dict(width=read(panel+0x300,'h'),height=read(panel+0x302,'h'),events=events.copy())))
# Vaults resolve the player's shaman directly while she performs command 33.
write(building+0x2a,'BB',2,18);write(effect+0x70,'B',13)
write(0x89da65,'I',people);write(trigger+0x68,'B',4)
for enabled,count,working in itertools.product((False,True),(0,1),(False,True)):
 write(trigger+0x6d,'B',int(enabled));write(trigger+0x86,'h',count);write(trigger+0x8e,'h',1)
 write(trigger+0x9a,'i',28);write(trigger+0x96,'i',14);write(trigger+0x94,'h',100);write(trigger+0x90,'h',50)
 write(people+0x2b,'BB',7,10);write(people+0xa7,'B',33 if working else 0);write(people+0x7a,'B',128)
 state=dict(required=1,people=([dict(model=7,selected=True)] if working else [None]) if count else [],enabled=enabled,shamanOnly=True,work=14,target=28,growth=100,cooldown=50)
 events.clear();write(0x5da074,'I',0)
 call(0x504bc0,panel,building,0,0,panel+0x300,panel+0x302,0,0)
 cases.append(dict(state=state,expected=dict(width=read(panel+0x300,'h'),height=read(panel+0x302,'h'),events=events.copy())))
write(building+0x2a,'BB',5,9);write(effect+0x70,'B',3)
js="""import {worshipPanel} from './app/worship-panel.ts';let s='';for await(const c of process.stdin)s+=c;console.log(JSON.stringify(JSON.parse(s).map(c=>worshipPanel(c.state))));"""
actual=json.loads(subprocess.check_output(['node','--input-type=module','-e',js],input=json.dumps(cases).encode(),cwd=ROOT))
for i,c in enumerate(cases):
 expected={**c['expected']}
 # 0x504bc0 reports only one row, despite drawing a second row and tail below it.
 if c['state']['required']>=8:expected['height']+=hud['rects']['75']['h']+5
 assert actual[i]==expected,(i,c,actual[i])
print(f'PASS: {len(cases)} complete native worship/recharge panel draw traces; two-row canvas extent corrected')

# Real panel input resolves the displayed head slot; final UI consumers are captured.
import itertools
input_events=[]
def input_consumer(cpu,address,size,user):
 sp=cpu.reg_read(UC_X86_REG_ESP)
 if address==0x48a050:input_events.append(['sound',read(sp+8,'I')])
 elif address==0x417ca0:
  point=read(sp+4,'I');input_events.append(['focus',read(point,'H'),read(point+2,'H')])
 elif address==0x504590:input_events.append(['person-panel',read(read(sp+4,'I')+0x24,'H')])
 cpu.reg_write(UC_X86_REG_EAX,0);cpu.reg_write(UC_X86_REG_EIP,read(sp,'I'));cpu.reg_write(UC_X86_REG_ESP,sp+4)
for address in (0x40b9c0,0x48a050,0x417ca0,0x504590,0x47a550,0x489c40):
 cpu.hook_add(UC_HOOK_CODE,input_consumer,begin=address,end=address)
roster=[{}, {}, {}]
for i in range(3):
 write(0x890390+(10+i)*4,'I',people+i*256)
 write(people+i*256+0x3d,'HH',1000+i*300,2000+i*400)
input_count=0
for event,modifier,selected,blocked,busy in itertools.product((0xf0,0xf1),(0,1,2,4),(0,128),(0,0x800),(0,99)):
 write(0x895fb0,'B',1);write(0x895fb3,'H',2);write(0x895fb5,'h',1)
 write(0x89c661,'I',blocked);write(people+256+0x7a,'B',selected)
 cpu.mem_write(0x897997,bytes(15));write(0x897997+12,'B',busy)
 input_events.clear();call(0x47b460,event,modifier,0)
 assert input_events==([['sound',106]] if event==0xf0 else [['sound',106],['focus',1300,2400],['person-panel',11]])
 if event==0xf0 and not blocked and not busy:
  assert read(0x897997+12,'B')==(0x71 if modifier&1 else 0x2a)
  assert read(0x897997+4,'I')==(int(not selected) if modifier&1 else 6),(event,modifier,read(0x897997+4,'I'))
  assert read(0x897997+8,'I')==(2 if modifier&1 else 11)
 else:assert read(0x897997+12,'B')==busy
 input_count+=1
print(f'PASS: {input_count} native stone-head panel input cases, including camera/person focus and blocked/busy command buffers')

# Recover actual standing geometry; do not replace the roster with a radius query.
cpu.hook_del(lookup_hook)
call(0x429ad0)
offsets=list(struct.iter_unpack('<hh',cpu.mem_read(0x974048,200)))
positions=[]
for x,y in [(0,0),(65535,65535),(32219,17501)]:
 for quarter in range(4):
  head=dict(x=x,y=y,angle=quarter*512)
  write(building+0x3d,'HH',x,y);write(building+0x26,'h',head['angle'])
  expected=[]
  for i,(dx,dy) in enumerate(offsets):
   dx,dy=((dx,dy),(dy,-dx),(-dx,-dy),(-dy,dx))[quarter]
   point=dict(x=((x&0xfe00)+256+dx)&65535,y=((y&0xfe00)+256+dy)&65535)
   expected.append(point)
   cpu.mem_write(0x8a03e4,bytes(128*128*16))
   cpu.mem_write(people,bytes(256));write(people+0x24,'H',10);write(people+0x2a,'BB',1,2)
   write(people+0x3d,'HH',point['x'],point['y']);write(0x890390+40,'I',people)
   cell=(point['y']>>9)*128+(point['x']>>9);write(0x8a03ea+cell*16,'H',10)
   write(panel+0x400,'I',i);call(0x43c600,building,panel+0x400,0)
   assert cpu.reg_read(UC_X86_REG_EAX)==people and read(panel+0x400,'I')==i
   # Nonzero speed is a signed SHORT, not the byte suggested by inferred types.
   for speed in (1,256,-256):
    write(people+0x5f,'h',speed);write(panel+0x400,'I',i);call(0x43c600,building,panel+0x400,0)
    assert cpu.reg_read(UC_X86_REG_EAX)==0
  positions.append(dict(head=head,expected=expected))
js="""import {worshipPositions} from './app/worship.ts';let s='';for await(const c of process.stdin)s+=c;console.log(JSON.stringify(JSON.parse(s).map(c=>worshipPositions(c.head))));"""
actual=json.loads(subprocess.check_output(['node','--input-type=module','-e',js],input=json.dumps(positions).encode(),cwd=ROOT))
assert actual==[c['expected'] for c in positions]
if '--record' in sys.argv:
 (ROOT/'tests/fixtures/worship-panel.json').write_text(json.dumps(dict(executableSha256=identity['sha256'],cases=cases,positions=positions),separators=(',',':'))+'\n')
print(f'PASS: native 50-slot initializer and {len(positions)*50} rotated/wrapped roster positions; 1,800 moving-person exclusions')

if '--browser' in sys.argv:
 from panel_pixels import check_panel_pixels
 frames=json.loads(Path('/private/tmp/populous-worship-panel-pixels.json').read_text())
 check_panel_pixels(exe,frames,cases,lambda c: 28 if c['state']['required']>=8 else 0)
