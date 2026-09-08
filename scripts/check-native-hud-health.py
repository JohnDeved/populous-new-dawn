"""Compare the complete native shaman meter and its frame submissions.
Usage: python scripts/check-native-hud-health.py /path/to/d3dpoptb.exe [--record] [--browser]
"""
import hashlib, importlib.util, json, struct, subprocess, sys
from pathlib import Path
from unicorn import UC_HOOK_CODE
from unicorn.x86_const import UC_X86_REG_ESP, UC_X86_REG_EIP, UC_X86_REG_EAX
from PIL import Image, ImageDraw
from decomp import native_cpu, ROOT
exe=Path(sys.argv[1]);cpu,identity=native_cpu(exe);cpu.mem_map(0x2000000,0x100000)
button,unit,entries,palette,stack,stop=0x2000000,0x2001000,0x2010000,0x2020000,0x20fd000,0x20fe000
def write(a,f,*v):cpu.mem_write(a,struct.pack('<'+f,*v))
def read(a,f):return struct.unpack('<'+f,cpu.mem_read(a,struct.calcsize('<'+f)))[0]
def call(a,*args):
    write(stack,'I'*(len(args)+1),stop,*args);cpu.reg_write(UC_X86_REG_ESP,stack)
    cpu.emu_start(a,stop,count=1000000)
    assert cpu.reg_read(UC_X86_REG_EIP)==stop,hex(cpu.reg_read(UC_X86_REG_EIP))
raw=(exe.parent/'data/hfx0-0.dat').read_bytes();pal=(exe.parent/'data/pal0-c.dat').read_bytes()
meta=json.loads((ROOT/'app/original-hud.json').read_text())
for name,data in [('hfx0-0.dat',raw),('pal0-c.dat',pal)]:
    assert hashlib.sha256(data).hexdigest()==meta['sha256']['data/'+name]
count=struct.unpack_from('<I',raw,4)[0]
for i in range(count):
    w,h,p=struct.unpack_from('<HHI',raw,8+i*8);write(entries+i*8,'IHH',p,w,h)
write(0x59df14,'I',entries);write(0x89c6cf,'HH',640,480)
cpu.mem_write(palette,pal);call(0x42adc0,palette,0x89c6f4)
foreground,background=cpu.mem_read(0x89c6f4,2)
assert (foreground,background)==(130,172)
# Original packed control record has two position pairs followed by width/height.
assert struct.unpack('<6h',cpu.mem_read(0x5caf3d,12))==(64,126,64,126,10,22)
assert read(0x5caf4d,'I')==0x4a0050
fills=[];draws=[];color=0
def consume(cpu,a,size,user):
    global color
    sp=cpu.reg_read(UC_X86_REG_ESP);arg=read(sp+4,'I');result=0
    if a in (0x44a1f0,0x44a210):result=arg # Supplied logical coordinates; resizing is separate.
    elif a==0x415f70:color=arg&255
    elif a==0x516890:fills.append([color,list(struct.unpack('<4i',cpu.mem_read(arg,16)))])
    elif a==0x47dfd0:
        x,y,w,h=struct.unpack('<4f',cpu.mem_read(sp+4,16))
        draws.append([read(sp+32,'I')&65535,*map(int,(x,y,w,h))])
    elif a==0x5162e0:
        entry=read(sp+12,'I');draws.append([(entry-entries)//8,read(sp+4,'i'),read(sp+8,'i'),read(entry+4,'H'),read(entry+6,'H')])
    cpu.reg_write(UC_X86_REG_EAX,result);cpu.reg_write(UC_X86_REG_EIP,read(sp,'I'))
    cpu.reg_write(UC_X86_REG_ESP,sp+({0x415f70:8,0x47dfd0:44}.get(a,4)))
for a in (0x44a1f0,0x44a210,0x415f70,0x516890,0x47dfd0,0x5162e0):
    cpu.hook_add(UC_HOOK_CODE,consume,begin=a,end=a)
# Real frame renderer runs; only its final sprite/quad queue consumers are supplied.
spec=importlib.util.spec_from_file_location('assets',ROOT/'scripts/import-original.py')
assets=importlib.util.module_from_spec(spec);spec.loader.exec_module(assets);bank=assets.sprites(raw,pal)
for name,w,h in [('health',10,22),('charge',26,5)]:
    draws=[];write(button+256,'4i',0,0,w,h);call(0x4a1f50,button+256,0x5ca9e0)
    pixels=bytearray(w*h*4)
    for sprite,left,top,width,height in draws:
        sw,sh,data=bank[sprite]
        for y in range(height):
            for x in range(width):
                src=((y%sh)*sw+x%sw)*4;at=((top+y)*w+left+x)*4
                if data[src+3]:pixels[at:at+4]=data[src:src+4]
    image=Image.open(ROOT/f'public/original/hud-{name}.png').convert('RGBA')
    assert image.size==(w,h) and image.tobytes()==pixels,name
cases=[[2000,h] for h in range(2002)]
for maximum in (0,1,100,2001,3000,32767):
    cases.extend([maximum,h] for h in sorted({0,1,maximum,maximum+1 if maximum<32767 else maximum,*[maximum*i//18 for i in range(19)]}))
cases.append([0,None]);expected=[]
for i,(maximum,health) in enumerate(cases):
    tribe=i%4;write(0x89c6f0,'B',tribe);write(0x89d1c8+tribe*0xc65+0x89d,'I',unit if health is not None else 0)
    write(unit+0x6c,'hh',maximum,health or 0)
    cpu.mem_write(button,bytes(256))
    for off,value in [(16,1),(0x37,64),(0x3b,126),(0x47,10),(0x4b,22)]:write(button+off,'i',value)
    fills=[];draws=[];call(0x4a0050,button)
    assert fills[0]==[background,[66,128,72,146]],fills
    assert len(draws)==8,draws
    assert all(c in (foreground,background) for c,r in fills)
    last_color,rect=fills[-1]
    expected.append(146-rect[1] if last_color==foreground else 0)
write(button+16,'i',0);fills=[];draws=[];call(0x4a0050,button);assert not fills and not draws
fixture=dict(executableSha256=identity['sha256'],cases=cases,pixels=expected)
js="""import {healthBarPixels} from './app/hud-health.ts';let s='';for await(const c of process.stdin)s+=c;
console.log(JSON.stringify(JSON.parse(s).map(([maximum,health])=>healthBarPixels(health??0,maximum))));"""
r=subprocess.run(['node','--input-type=module','-e',js],input=json.dumps(cases),capture_output=True,text=True,cwd=ROOT)
assert r.returncode==0,r.stderr
assert json.loads(r.stdout)==expected
if '--record' in sys.argv:(ROOT/'tests/fixtures/hud-health.json').write_text(json.dumps(fixture,separators=(',',':'))+'\n')
if '--browser' in sys.argv:
    frame=Image.open(ROOT/'public/original/hud-health.png').convert('RGBA');draw=ImageDraw.Draw(frame)
    draw.rectangle((2,2,7,19),fill=meta['colors'][background]);draw.rectangle((2,11,7,19),fill=meta['colors'][foreground])
    screenshot=Image.open('/private/tmp/populous-health-meter-v115.png').convert('RGBA')
    assert screenshot.size==(20,44) and screenshot.tobytes()==frame.resize((20,44),Image.Resampling.NEAREST).tobytes()
    print('PASS: 880 browser health-frame/fill pixels match original art and native half-health rectangle')
print(f'PASS: {len(cases):,} complete native shaman-meter calls, four tribe pointers, missing/zero/overfull health, hidden control; original palette initialization and both frame PNGs match native submissions')
