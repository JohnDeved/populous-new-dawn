"""Capture original spell-button draw calls; coordinate/raster consumers supplied.
Usage: python scripts/check-native-spell-button.py /path/to/d3dpoptb.exe [--record]
"""
import hashlib, itertools, json, struct, subprocess, sys
from pathlib import Path
from unicorn import UC_HOOK_CODE
from unicorn.x86_const import UC_X86_REG_ESP, UC_X86_REG_EIP, UC_X86_REG_EAX
from decomp import native_cpu, configure_native_constants, ROOT
exe=Path(sys.argv[1]);cpu,identity=native_cpu(exe);configure_native_constants(cpu,exe)
cpu.mem_map(0x2000000,0x100000)
button,entries,stack,stop=0x2000000,0x2010000,0x20fd000,0x20fe000
def write(a,f,*v):cpu.mem_write(a,struct.pack('<'+f,*v))
def read(a,f):return struct.unpack('<'+f,cpu.mem_read(a,struct.calcsize('<'+f)))[0]
def call(a,*args):
    write(stack,'I'*(len(args)+1),stop,*args);cpu.reg_write(UC_X86_REG_ESP,stack)
    cpu.emu_start(a,stop,count=1000000)
    assert cpu.reg_read(UC_X86_REG_EIP)==stop,hex(cpu.reg_read(UC_X86_REG_EIP))
    return cpu.reg_read(UC_X86_REG_EAX)
raw=(exe.parent/'data/hfx0-0.dat').read_bytes();count=struct.unpack_from('<I',raw,4)[0]
assert hashlib.sha256(raw).hexdigest()==json.loads((ROOT/'app/original-hud.json').read_text())['sha256']['data/hfx0-0.dat']
for i in range(count):
    w,h,p=struct.unpack_from('<HHI',raw,8+i*8);write(entries+i*8,'IHH',p,w,h)
write(0x59df14,'I',entries);write(0x89c6cf,'HH',640,480);write(button+256,'4i',0,0,31,43)
events=[];color=0
def consumer(cpu,a,size,user):
    global color
    sp=cpu.reg_read(UC_X86_REG_ESP);arg=read(sp+4,'I');result=0
    if a in (0x44a1f0,0x44a210):result=arg # Supplied already-parameterized logical rect.
    elif a==0x44be00:result=button+256
    elif a==0x4a1f50:
        rect=list(struct.unpack('<4i',cpu.mem_read(arg,16)))
        events.append(['border',read(read(sp+8,'I'),'H'),rect])
    elif a==0x516430:events.append(['sprite',(read(sp+12,'I')-entries)//8,read(sp+4,'i'),read(sp+8,'i')])
    elif a in (0x4525d0,0x415f70):color=arg&255
    elif a==0x516890:events.append(['fill',color,list(struct.unpack('<4i',cpu.mem_read(arg,16)))])
    cpu.reg_write(UC_X86_REG_EAX,result);cpu.reg_write(UC_X86_REG_EIP,read(sp,'I'))
    cpu.reg_write(UC_X86_REG_ESP,sp+(8 if a in (0x4525d0,0x415f70) else 4))
for a in (0x44a1f0,0x44a210,0x44be00,0x4a1f50,0x516430,0x4525d0,0x415f70,0x516890):
    cpu.hook_add(UC_HOOK_CODE,consumer,begin=a,end=a)
cases=[];expected=[]
inputs=[]
for model,permanent,charging,hovered,selected,stock,gifts in itertools.product(
    (2,3,4,8,12,13,17),(False,True),(False,True),(False,True),(False,True),(0,1,4),(0,1)
):
    inputs.append(dict(model=model,permanent=permanent,charging=charging,hovered=hovered,selected=selected,stock=stock,gifts=gifts,progress=read(0x5a80d4+model*62,'i')//3))
for model in (2,3,4,8,12,13,17):
    cost=read(0x5a80d4+model*62,'i')
    for progress in (0,1,23,24,415,416,417,cost//24-1,cost//24,cost//24+1,cost-1,cost,cost+1):
        inputs.append(dict(model=model,permanent=True,charging=True,hovered=False,selected=False,stock=0,gifts=0,progress=progress))
for c in inputs:
    model,permanent,charging,hovered,selected,stock,gifts,progress=(c[k] for k in ('model','permanent','charging','hovered','selected','stock','gifts','progress'))
    cpu.mem_write(button,bytes(256));events=[]
    for offset,value in ((8,1),(12,int(selected)),(16,1),(24,int(hovered)),(0x47,31),(0x4b,43),(0x4f,1),(0x63,1)):
        write(button+offset,'i',value)
    write(0x98db08,'B',model);write(0x5cd2a0,'B',1)
    write(0x89c6f0,'B',0);write(0x89d17c,'I',0)
    write(0x96070a,'I',(1<<model) if permanent else 0)
    write(0x96071a,'I',0 if charging else 1<<(model-1))
    write(0x96071e+model,'B',(gifts<<4)|stock)
    write(0x89db31+model*4,'i',progress);write(0x89d1c8+0x951,'i',0) # Spark ownership remains separate.
    call(0x49daf0,button)
    cases.append(c)
    expected.append(events)
write(0x5d4678,'I',1)
order=[call(0x4c2fe0,i)&255 for i in range(1,22)]
order=[m for m in order if m]
fixture=dict(executableSha256=identity['sha256'],cases=cases,expected=expected,order=order)
js="""import {spellButton,spellOrder} from './app/spell-button.ts';let input='';for await(const c of process.stdin)input+=c;
console.log(JSON.stringify({order:spellOrder,draws:JSON.parse(input).map(c=>{
 const v=spellButton(c),draws=[['border',v.border,[0,0,31,43]],...v.sprites.map(s=>['sprite',s.id,s.x,s.y])];
 if(v.fills.length)draws.push(['border',1014,[2,34,28,39]],...v.fills.map(f=>['fill',f.palette,[3,35,3+f.width,38]]));
 return draws;
})}));"""
r=subprocess.run(['node','--input-type=module','-e',js],input=json.dumps(cases),capture_output=True,text=True,cwd=ROOT)
assert r.returncode==0,r.stderr
actual=json.loads(r.stdout)
assert actual['order']==order,(actual['order'],order)
assert len(actual['draws'])==len(expected)
for i,(a,b) in enumerate(zip(actual['draws'],expected)):
    assert a==b,(cases[i],a,b)
if '--record' in sys.argv:
    (ROOT/'tests/fixtures/spell-button.json').write_text(json.dumps(fixture,separators=(',',':'))+'\n')
print(f'PASS: {len(cases):,} complete native spell-button calls and mana-cost slot ordering; border, hover icons, stock markers and layered charging fills')
