"""Compare drag clamping, packed commands, corners and point tests with the PE.
Usage: python scripts/check-native-drag-selection.py EXE
Only the downstream UI refresh and command buffer are intercepted.
"""
import json, random, struct, subprocess, sys
from pathlib import Path
from unicorn import UC_HOOK_CODE
from unicorn.x86_const import UC_X86_REG_EAX, UC_X86_REG_EIP, UC_X86_REG_ESP
from decomp import native_cpu, ROOT

cpu, identity = native_cpu(Path(sys.argv[1]))
cpu.mem_map(0x2000000, 0x100000)
tribe, packet, origin, quad, wide, point, stack, stop = (
    0x2000000,0x2001000,0x2001100,0x2001200,0x2001300,0x2001400,0x20fd000,0x20fe000)
write=lambda a,f,*v:cpu.mem_write(a,struct.pack('<'+f,*v))
read=lambda a,f:struct.unpack('<'+f,cpu.mem_read(a,struct.calcsize('<'+f)))[0]
def call(a,*args):
    write(stack,'I'*(len(args)+1),stop,*args)
    cpu.reg_write(UC_X86_REG_ESP,stack);cpu.emu_start(a,stop,count=1000000)
    assert cpu.reg_read(UC_X86_REG_EIP)==stop,hex(cpu.reg_read(UC_X86_REG_EIP))
    return cpu.reg_read(UC_X86_REG_EAX)
emitted=[];voices=[]
def consumer(c,a,size,user):
    sp=c.reg_read(UC_X86_REG_ESP)
    if a==0x48a050:voices.append(read(sp+8,'I'))
    if a==0x4ffb90:c.reg_write(UC_X86_REG_EAX,point)
    if a==0x479cf0:emitted.append([read(sp+8,'I'),read(sp+12,'I'),read(sp+16,'I')])
    c.reg_write(UC_X86_REG_EIP,read(sp,'I'));c.reg_write(UC_X86_REG_ESP,sp+4)
for a in (0x47a550,0x479cf0):cpu.hook_add(UC_HOOK_CODE,consumer,begin=a,end=a)

rng=random.Random(0x443d30);cases=[]
for trial in range(1024):
    start=[rng.randrange(65536),rng.randrange(65536)]
    end=[rng.randrange(65536),rng.randrange(65536)]
    camera=trial*2
    if trial < 16:
        camera=(trial%4)*512
        dx,dy=[(0,0),(0,512),(512,0),(1,1)][trial//4]
        end=[(start[0]+dx)&65535,(start[1]+dy)&65535]
    write(0x89c6f0,'B',0);write(0x89d1c8+0x32,'H',camera)
    write(packet,'BBIHH',0x6a,0,trial&1,*start);call(0x443d30,tribe,packet)
    assert list(struct.unpack('<2H',cpu.mem_read(tribe+0x8b3,4)))==start
    write(packet,'BBIHH',0x6b,0,0,*end);call(0x443d30,tribe,packet)
    endpoint=list(struct.unpack('<2H',cpu.mem_read(tribe+0x8b7,4)))
    # Invalid pointer keeps the last valid endpoint, including on release.
    write(packet,'BBII',0x6c,0,trial&1,0xffffffff);emitted.clear();call(0x443d30,tribe,packet)
    command,packed_start,packed=emitted[0]
    assert command==(0x79 if trial&1 else 0x6d)
    assert packed_start==start[0]|start[1]<<16
    write(origin,'HH',*start)
    call(0x4440a0,quad,origin,(packed&1023)*2,((packed>>10)&1023)*2,(packed>>20)*8)
    corners=[list(struct.unpack('<2H',cpu.mem_read(quad+i*4,4))) for i in range(4)]
    call(0x444270,quad,point,(packed&1023)*2)
    bx,by,_,_,ex,ey,_,_=struct.unpack('<8H',cpu.mem_read(point,16))
    bounds=dict(x=bx>>9,y=by>>9,endX=ex>>9,endY=ey>>9)
    call(0x444430,quad,wide)
    unwrapped=[list(struct.unpack('<2I',cpu.mem_read(wide+i*12+4,8))) for i in range(4)]
    queries=corners+[[sum(p[0] for p in unwrapped)//4&65535,sum(p[1] for p in unwrapped)//4&65535]]
    # Nearby points exercise native edges without unrelated signed-product overflow.
    queries += [[(start[0]+rng.randrange(-15000,15001))&65535,(start[1]+rng.randrange(-15000,15001))&65535] for _ in range(8)]
    inside=[]
    for p in queries:
        write(point,'HH',*p);inside.append(bool(call(0x4445d0,point,wide)&255))
    cases.append(dict(start=start,end=end,camera=camera,queries=queries,
        expected=dict(endpoint=endpoint,command=packed,corners=corners,bounds=bounds,unwrapped=unwrapped,inside=inside)))
js="""import {dragEndpoint,dragCommand,dragCommandCorners,dragCellBounds,unwrapDragCorners,inDragSelection} from './app/drag-selection.ts';
let s='';for await(const c of process.stdin)s+=c;
const p=([x,y])=>({x,y}),a=({x,y})=>[x,y];
console.log(JSON.stringify(JSON.parse(s).map(c=>{
 const start=p(c.start),end=dragEndpoint(start,p(c.end),c.camera),command=dragCommand(start,end,c.camera)>>>0;
 const corners=dragCommandCorners(start,command),wide=unwrapDragCorners(corners);
 return {endpoint:a(end),command,corners:corners.map(a),bounds:dragCellBounds(corners,(command&1023)*2),unwrapped:wide.map(a),inside:c.queries.map(q=>inDragSelection(p(q),wide))};
})));"""
actual=json.loads(subprocess.check_output(['node','--input-type=module','-e',js],input=json.dumps(cases).encode(),cwd=ROOT))
for i,(result,case) in enumerate(zip(actual,cases)):
    assert result==case['expected'],(i,result,case)
print(f'PASS: {len(cases)} complete native drag transactions, wrapped/clamped endpoints, packed commands, '
      '4096 corners and 13312 point tests')

# Full ordinary-person command: actual native cell chains, eligibility, polygon
# test, first-hit replacement, flags and group voice traversal. Capture playback.
for a in (0x48a050,):cpu.hook_add(UC_HOOK_CODE,consumer,begin=a,end=a)
people, command = 0x2002000,0x2004000
groups=[]
for trial, case in enumerate(cases[:128]):
    cpu.mem_write(0x8a03e4,bytes(16384*16));write(0x890390,'I',0)
    cpu.mem_write(tribe,bytes(0xc65));write(tribe+0x881,'I',people)
    before=[];members=[]
    for i,pos in enumerate(case['queries'][:8]):
        p=people+i*256;raw=bytearray(256)
        struct.pack_into('<I',raw,8,p+256 if i<7 else 0)
        struct.pack_into('<II',raw,0x10,128 if (trial+i)%7==0 else 0,rng.getrandbits(32))
        struct.pack_into('<H',raw,0x24,i+1);raw[0x2a:0x30]=bytes((1,[2,3,7][(trial+i)%3],19,0,0,0))
        struct.pack_into('<HH',raw,0x3d,*pos);raw[0x7a]=(128 if trial&(1<<i) else 0)|1
        cpu.mem_write(p,bytes(raw));write(0x890390+(i+1)*4,'I',p)
        call(0x4ee470,p,p+0x3d)
        members.append(dict(x=pos[0],y=pos[1],model=raw[0x2b],flags4=read(p+0x10,'I'),flags3=read(p+0x14,'I'),selectionFlags=read(p+0x7a,'B')))
    before=[bytes(cpu.mem_read(people+i*256,256)) for i in range(8)]
    write(command+4,'HHIB',*case['start'],case['expected']['command'],0x79 if trial&1 else 0x6d)
    voices.clear();call(0x4449d0,tribe,command)
    expected=[]
    for i,raw in enumerate(before):
        p=people+i*256;after=bytearray(cpu.mem_read(p,256))
        expected.append(dict(flags3=read(p+0x14,'I'),selectionFlags=read(p+0x7a,'B')))
        after[0x14:0x18]=raw[0x14:0x18];after[0x7a]=raw[0x7a]
        assert after==raw,(trial,i,[(hex(j),a,b) for j,(a,b) in enumerate(zip(raw,after)) if a!=b])
    groups.append(dict(start=case['start'],command=case['expected']['command'],extend=bool(trial&1),people=members,expected=dict(people=expected,voices=list(voices))))
js="""import {createWorld,addUnit,selectArea,browserPosition} from './app/model.ts';
import {createLivePerson} from './app/live-people.ts';
let s='';for await(const c of process.stdin)s+=c;
console.log(JSON.stringify(JSON.parse(s).map(c=>{
 const w=createWorld();w.units=[];w.selected=[];
 for(const p of c.people){const u=addUnit(w,'blue',p.model===7?'shaman':p.model===3?'warrior':'brave',browserPosition(p));u.native=createLivePerson(w,u);Object.assign(u.native,p,{state:19});if(p.selectionFlags&128)w.selected.push(u.id);}
 selectArea(w,{x:c.start[0],y:c.start[1]},c.command,c.extend);
 return {people:w.units.map(u=>({flags3:u.native.flags3,selectionFlags:u.native.selectionFlags})),voices:w.sounds.map(s=>s.cue)};
})));"""
actual=json.loads(subprocess.check_output(['node','--input-type=module','-e',js],input=json.dumps(groups).encode(),cwd=ROOT))
for i,(result,case) in enumerate(zip(actual,groups)):
    assert result==case['expected'],(i,result,case)
print('PASS: 128 complete native area commands / 1024 live person flags, actual cell queries, '
      'empty-area retention and Ctrl addition; all other person bytes unchanged')

# Actual per-frame input transition, around the one-unit boundary and signed seam.
for a in (0x4ffb90,0x47acb0):cpu.hook_add(UC_HOOK_CODE,consumer,begin=a,end=a)
write(0x89c661,'I',0x80000) # Disable the independent screen-edge pan producer.
write(0x98e910,'B',0);write(point,'II',100,100)
transitions=[]
for origin_x in (0,255,32767,32768,65535):
    for step in (-258,-257,-256,-255,-1,0,1,255,256,257,258):
        for axis in (0,1):
            start=[origin_x,origin_x];end=list(start);end[axis]=(end[axis]+step)&65535
            write(0x89bb5d,'HH',*start);write(0x87cade,'HH',*end)
            write(0x87cabe,'I',0x10000);write(0x89c6e7,'B',16);write(0x98e908,'I',0x100)
            write(0x89798d,'B',0);call(0x4adbb0)
            transitions.append(dict(start=start,end=end,expected=read(0x89798d,'B')==0x6a))
js="""import {dragMoved} from './app/drag-selection.ts';let s='';for await(const c of process.stdin)s+=c;
console.log(JSON.stringify(JSON.parse(s).map(c=>dragMoved({x:c.start[0],y:c.start[1]},{x:c.end[0],y:c.end[1]}))));"""
actual=json.loads(subprocess.check_output(['node','--input-type=module','-e',js],input=json.dumps(transitions).encode(),cwd=ROOT))
assert actual==[c['expected'] for c in transitions]
print('PASS: 110 complete native order-to-drag input transitions, including signed-seam thresholds')

if '--record' in sys.argv:
    (ROOT/'tests/fixtures/drag-selection.json').write_text(json.dumps(dict(executableSha256=identity['sha256'],cases=cases[:16]+cases[64::64],groups=groups[::8],transitions=transitions),separators=(',',':'))+'\n')
