"""Compare the native English tooltip controller and bitmap submissions.
Usage: python scripts/check-native-tooltip-layout.py /path/to/d3dpoptb.exe [--record]
Only the window/raster queue and loaded sprite-bank lookup are supplied.
"""
import hashlib, importlib.util, json, struct, subprocess, sys
from pathlib import Path
from unicorn import UC_HOOK_CODE
from unicorn.x86_const import UC_X86_REG_ESP, UC_X86_REG_EIP, UC_X86_REG_EAX
from PIL import Image
from decomp import native_cpu, ROOT
exe=Path(sys.argv[1]);cpu,identity=native_cpu(exe);cpu.mem_map(0x2000000,0x1000000)
entries,texture,stack,stop=0x2000000,0x2100000,0x2ffd000,0x2ffe000
def write(a,f,*v):cpu.mem_write(a,struct.pack('<'+f,*v))
def read(a,f):return struct.unpack('<'+f,cpu.mem_read(a,struct.calcsize('<'+f)))[0]
def call(a,*args):
    write(stack,'I'*(len(args)+1),stop,*args);cpu.reg_write(UC_X86_REG_ESP,stack)
    cpu.emu_start(a,stop,count=5000000)
    assert cpu.reg_read(UC_X86_REG_EIP)==stop,hex(cpu.reg_read(UC_X86_REG_EIP))
spec=importlib.util.spec_from_file_location('assets',ROOT/'scripts/import-original.py')
a=importlib.util.module_from_spec(spec);spec.loader.exec_module(a)
meta=json.loads((ROOT/'app/original-hud.json').read_text());atlas=Image.open(ROOT/'public/original/hud.png').convert('RGBA')
pal=(exe.parent/'data/pal0-c.dat').read_bytes();cpu.mem_write(0xd05528,pal)
banks={}
for font in (3,4):
    # Verify the original loader's filename and destination pointer, not FONTn.
    record=0x5a3d70+font*0x120
    assert bytes(cpu.mem_read(record,16)).split(b'\0')[0]==f'data\\f00t{font}-0.dat'.encode()
    assert read(record+0x112,'I')==0x87cbd0+font*4
    name=f'data/f00t{font}-0.dat';raw=(exe.parent/name).read_bytes()
    assert hashlib.sha256(raw).hexdigest()==meta['sha256'][name]
    glyphs=a.sprites(raw,pal);assert len(glyphs)==224
    banks[font]=glyphs
    base=entries+font*0x1000;write(0x87cbd0+font*4,'I',base)
    for i,(w,h,data) in enumerate(glyphs):
        write(base+i*8,'IHH',0,w,h)
        r=meta['rects'][f'f00t{font}-{i}']
        assert (r['w'],r['h'])==(w,h)
        assert atlas.crop((r['x'],r['y'],r['x']+w,r['y']+h)).tobytes()==data
write(0x5ce0bc,'I',texture);write(0x684218,'I',1)
write(0x5da078,'I',0);write(0x5da074,'I',0);write(0x89bc6a,'B',0)
window=[];draws=[]
def consume(cpu,address,size,user):
    sp=cpu.reg_read(UC_X86_REG_ESP)
    if address==0x4a24c0:
        window.extend(struct.unpack('<5i',cpu.mem_read(sp+4,20)))
    elif address==0x516170:
        entry=read(sp+4,'I');font=(entry-entries)//0x1000;index=(entry-entries-font*0x1000)//8
        assert font in (3,4) and 0<=index<224
        write(read(sp+8,'I'),'I',font);write(read(sp+12,'I'),'I',index)
    else:
        x,y,font,index,color,flags=struct.unpack('<ff4I',cpu.mem_read(sp+4,24))
        assert color==0xffffff and flags==0
        draws.append([font,index,int(x),int(y)])
    cpu.reg_write(UC_X86_REG_EAX,0);cpu.reg_write(UC_X86_REG_EIP,read(sp,'I'))
    cpu.reg_write(UC_X86_REG_ESP,sp+(28 if address==0x47dc50 else 4))
for address in (0x4a24c0,0x516170,0x47dc50):cpu.hook_add(UC_HOOK_CODE,consume,begin=address,end=address)
strings=json.loads((ROOT/'app/original-tooltips.json').read_text())['strings']
cases=[]
texts=list(dict.fromkeys(strings.values())) + ['A'*140, 'One-two,three.four:five;six seven  eight ', '   Longword'*20]
for i,text in enumerate(texts):
    # Tribal formatting belongs to the existing name/tooltip checks.
    text=text.replace('%s','Dakini')
    sizes=[(640,480),(1440,1000)]
    if '{}' in text or i<3:sizes += [(800,600),(800,601),(1920,1080)]
    for width,height in sizes:
        write(0x89c6cf,'HH',width,height);write(0x68b69d,'I',1);write(0x68c6c0,'B',0)
        write(0x684208,'ii',width//2,height//2)
        cpu.mem_write(0x68b6a1,(text+'\0').encode('utf-16le'))
        window=[];draws=[];call(0x44a2f0)
        assert len(window)==5 and window[4]&255==152,(text,window)
        assert read(0x68b69d,'I')==0
        pixels=Image.new('RGBA',(window[2],window[3]))
        for font,index,x,y in draws:
            w,h,data=banks[font][index]
            pixels.alpha_composite(Image.frombytes('RGBA',(w,h),bytes(data)),(x,y))
        cases.append(dict(text=text,screen=[width,height],width=window[2],height=window[3],draws=draws,pixelSha256=hashlib.sha256(pixels.tobytes()).hexdigest()))
fixture=dict(executableSha256=identity['sha256'],cases=cases)
js="""import {tooltipLayout} from './app/tooltip-layout.ts';let s='';for await(const c of process.stdin)s+=c;
console.log(JSON.stringify(JSON.parse(s).map(c=>tooltipLayout(c.text,...c.screen))));"""
r=subprocess.run(['node','--input-type=module','-e',js],input=json.dumps(cases),capture_output=True,text=True,cwd=ROOT)
assert r.returncode==0,r.stderr
for case,actual in zip(cases,json.loads(r.stdout)):
    assert actual=={k:case[k] for k in ('width','height','draws')},(case,actual)
path=ROOT/'tests/fixtures/tooltip-layout.json'
if '--record' in sys.argv:path.write_text(json.dumps(fixture,separators=(',',':'))+'\n')
else:assert json.loads(path.read_text())==fixture,'Native fixture drift; review before --record'
print(f'PASS: {len(cases)} complete native tooltip controllers, {sum(len(c["draws"]) for c in cases):,} glyph submissions; both loader bindings and all 448 imported glyphs match')
