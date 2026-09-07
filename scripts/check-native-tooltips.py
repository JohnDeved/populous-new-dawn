"""Compare native tooltip naming, forced object selection and lifetime.
Usage: python scripts/check-native-tooltips.py /path/to/d3dpoptb.exe
Only text formatting is intercepted; selection, name lookup and counters execute.
"""
import json, struct, subprocess, sys
from pathlib import Path
from unicorn import UC_HOOK_CODE
from unicorn.x86_const import UC_X86_REG_ESP, UC_X86_REG_EIP, UC_X86_REG_EAX, UC_X86_REG_ECX
from decomp import native_cpu
root=Path(__file__).resolve().parents[1];cpu,_=native_cpu(Path(sys.argv[1]))
cpu.mem_map(0x2000000,0x20000)
unit,head,other,output,stack,stop=0x2000000,0x2000200,0x2000400,0x2000600,0x201d000,0x201e000
def write(p,fmt,*v):cpu.mem_write(p,struct.pack(fmt,*v))
def read(p,fmt):return struct.unpack(fmt,cpu.mem_read(p,struct.calcsize(fmt)))[0]
def call(address,*args):
    write(stack,'<'+'I'*(len(args)+1),stop,*[a&0xffffffff for a in args]);cpu.reg_write(UC_X86_REG_ESP,stack)
    cpu.emu_start(address,stop,timeout=100000,count=100000)
    assert cpu.reg_read(UC_X86_REG_EIP)==stop
    return cpu.reg_read(UC_X86_REG_EAX)
def browser(js,cases):
    r=subprocess.run(['node','--input-type=module','-e',"import * as t from './app/tooltips.ts';let s='';for await(const c of process.stdin)s+=c;"+js],input=json.dumps(cases),text=True,capture_output=True,cwd=root)
    assert r.returncode==0,r.stderr
    return json.loads(r.stdout)
cpu.mem_write(0x890390,struct.pack('<IIII',0,unit,head,other))
cpu.mem_write(unit,bytes(0x600));cpu.mem_write(head+0x2a,b'\6\6');write(head+0x24,'<H',2)
write(0x8a03ea,'<H',2)
cases,expected=[],[]
for kind,count in [(1,9),(2,20),(4,5),(5,20),(10,17)]:
    for model in range(count):
        for owner in [-1,0,1,2,3]:
            for multi in [False,True]:
                for player in [0,1]:
                    cpu.mem_write(unit+0x2a,bytes([kind,model]));write(unit+0x2f,'<b',owner)
                    write(0x89c6f0,'<b',player);write(0x89c661,'<B',8 if multi else 0)
                    value=call(0x4f0f90,unit,output)
                    expected.append(dict(stringId=value,tribe=bool(read(output,'<B'))))
                    cases.append(dict(object=dict(id=1,x=0,z=0,type=kind,model=model,owner=owner,tutorial=0,head=dict(type=0,flags=0)),player=player,multi=multi))
for kind,model in [(2,18),(5,9)]:
    cpu.mem_write(unit+0x2a,bytes([kind,model]))
    for present in [False,True]:
        write(0x8a03ea,'<H',2 if present else 0)
        for mode in range(6):
            for flags in [0,16,32,48]:
                for tutorial in range(5):
                    write(head+0x68,'<B',mode);write(head+0x6d,'<B',flags);write(unit+0x8b,'<B',tutorial)
                    value=call(0x4f0f90,unit,output)
                    expected.append(dict(stringId=value,tribe=bool(read(output,'<B'))))
                    cases.append(dict(object=dict(id=1,x=0,z=0,type=kind,model=model,owner=-1,tutorial=tutorial,head=dict(type=mode,flags=flags) if present else None),player=0,multi=False))
actual=browser("console.log(JSON.stringify(JSON.parse(s).map(c=>t.tooltipName(c.object,c.player,c.multi))));",cases)
for c,want,got in zip(cases,expected,actual):assert want==got,(c,want,got)
print(f'PASS: {len(cases)} native tooltip name selections, tribe variants and linked worship categories')

# Observe the native selected object and text ID without entering Windows CRT formatting.
# Name pointers are synthetic IDs; the naming routine itself remains untouched.
for i in range(1000):write(0x972ba8+i*4,'<I',i)
formatted=[]
def format_text(cpu,address,size,user):
    sp=cpu.reg_read(UC_X86_REG_ESP)
    formatted.append(read(sp+(12 if address==0x55b5c0 else 8),'<I'))
    cpu.reg_write(UC_X86_REG_EIP,read(sp,'<I'));cpu.reg_write(UC_X86_REG_ESP,sp+4)

for address in [0x55b5c0,0x4539a0]:cpu.hook_add(UC_HOOK_CODE,format_text,begin=address,end=address)
cases,expected=[],[]
for mode,kind,model in [(1,5,9),(2,2,7),(2,2,18)]:
    for present in [False,True]:
        for duration in [0,1,2,47,144,-1]:
            for packed in [0,257,64002,64259]:
                cpu.mem_write(unit,bytes(0x600));write(unit+0x24,'<H',1)
                cpu.mem_write(unit+0x2a,bytes([kind,model]));write(unit+0x2f,'<b',1)
                cpu.mem_write(head+0x2a,b'\6\6');write(head+0x68,'<B',4 if model==18 else 0);write(head+0x6d,'<B',16 if model==18 else 32)
                cpu.mem_write(other+0x2a,b'\1\1');write(other+0x20,'<H',1)
                write(unit+0x20,'<H',2);write(unit+0x3d,'<HH',(packed&254)<<8,packed&0xfe00)
                cell=((packed&254)*2|(packed&0xfe00))*4+0x8a03e4
                write(cell,'<I',512 if present else 0);write(cell+6,'<H',3 if present else 0);write(cell+8,'<H',0xfc01)
                write(0x89c6f0,'<b',0);write(0x89c661,'<B',0)
                formatted.clear();call(0x44d7f0,mode,packed,duration)
                expected.append(dict(target=read(0x68c6bb,'<H'),flags=read(0x68c6c0,'<B'),remaining=read(0x68c6bd,'<h'),stringId=formatted[-1] if formatted else 0))
                cases.append(dict(object=dict(id=1,x=0,z=0,type=kind,model=model,owner=1,tutorial=0,head=dict(type=4 if model==18 else 0,flags=16 if model==18 else 32)) if present else None,duration=duration))
actual=browser("console.log(JSON.stringify(JSON.parse(s).map(c=>{const state=t.createTooltip();t.showObjectTooltip(state,c.object,c.duration);return {target:state.target,flags:state.flags,remaining:state.remaining,stringId:c.object?t.tooltipName(c.object).stringId:0}})));",cases)
for c,want,got in zip(cases,expected,actual):assert want==got,(c,want,got)
print(f'PASS: {len(cases)} native forced tooltip selections, cell masking, list traversal and durations')

cases,expected=[],[]
for remaining in [0,1,2,4,40,32767,-1,-32768]:
    for flags in [0,2,4,6,8,12]:
        for valid in [False,True]:
            for fps in [8,12,24,60]:
                call(0x44b100);write(0x68c6bb,'<H',1);write(0x68c6c0,'<B',flags);write(0x68c6bd,'<h',remaining)
                write(0x68b6a1,'<H',65);write(0x68c6bf,'<B',1);write(0x68b69d,'<I',0);write(0x68c6b3,'<i',7);write(0x68c6b7,'<i',8)
                write(unit+0xc,'<I',0 if valid else 1);write(unit+0x2a,'<B',2);write(0x5ca850,'<i',fps)
                result=call(0x44db60)&255
                expected.append(dict(result=bool(result),state=dict(target=read(0x68c6bb,'<H'),flags=read(0x68c6c0,'<B'),remaining=read(0x68c6bd,'<h'),text='A' if read(0x68b6a1,'<H') else '',fixed=read(0x68c6bf,'<B'),draw=read(0x68b69d,'<I'),hold=read(0x68c6b3,'<i'),scroll=read(0x68c6b7,'<i'))))
                cases.append(dict(remaining=remaining,flags=flags,valid=valid,fps=fps))
actual=browser("console.log(JSON.stringify(JSON.parse(s).map(c=>{const state={...t.createTooltip(),target:1,remaining:c.remaining,flags:c.flags,text:'A',fixed:1,hold:7,scroll:8};const result=t.stepTooltip(state,c.valid,c.fps);return {result,state}})));",cases)
for c,want,got in zip(cases,expected,actual):assert want==got,(c,want,got)
print(f'PASS: {len(cases)} native lifetime updates, signed wrap, invalid targets and draw requests')

# Execute the real color conversion and window rectangle/quad generation. Only
# final polygon submission and the separately imported border sprites are skipped.
palette=(Path(sys.argv[1]).parent/'data/pal0-c.dat').read_bytes()
cpu.mem_write(0xd05528,palette)
for index in range(256):
    cpu.reg_write(UC_X86_REG_ECX,output);call(0x415f70,index)
    r,g,b=palette[index*4:index*4+3]
    assert bytes(cpu.mem_read(output,5))==bytes([b,g,r,255,index])
quads=[]
def draw(cpu,address,size,user):
    sp=cpu.reg_read(UC_X86_REG_ESP)
    if address==0x47d980:
        quads.append([struct.unpack('<2f8xI',cpu.mem_read(read(sp+i*4,'<I'),20)) for i in range(1,5)])
    cpu.reg_write(UC_X86_REG_EIP,read(sp,'<I'))
    cpu.reg_write(UC_X86_REG_ESP,sp+(28 if address==0x47d980 else 4)) # Quad submission is thiscall, six stack arguments.
for address in [0x47d980,0x4a1f50]:cpu.hook_add(UC_HOOK_CODE,draw,begin=address,end=address)
write(0x5da074,'<I',0);write(0x5da078,'<I',0)
for index in range(256):
    call(0x4a24c0,20,30,100,40,index)
    r,g,b=palette[index*4:index*4+3];color=0xff000000|r<<16|g<<8|b
    assert quads[-1]==[(16.,26.,color),(123.,26.,color),(123.,73.,color),(16.,73.,color)]
imported=json.loads((root/'app/original-tooltips.json').read_text())
assert imported['backgroundIndex']==cpu.mem_read(0x44a9e9,1)[0]==152
assert imported['foregroundIndex']==cpu.mem_read(0x44a391,1)[0]==80
for key in ['background','foreground']:
    index=imported[key+'Index'];assert imported[key]==list(palette[index*4:index*4+3])
print('PASS: 256 native color conversions and 256 opaque window quads; tooltip color operands verified')
