"""Compare the full native production meter, palette, line endpoints and frame.
Usage: python scripts/check-native-hud-mana.py /path/to/d3dpoptb.exe [--record]
Logical 640×480; coordinate adapters and final raster consumers are supplied.
"""
import hashlib, importlib.util, json, struct, subprocess, sys
from pathlib import Path
from unicorn import UC_HOOK_CODE
from unicorn.x86_const import UC_X86_REG_ESP, UC_X86_REG_EIP, UC_X86_REG_EAX
from PIL import Image
from decomp import native_cpu, ROOT
exe=Path(sys.argv[1]);cpu,identity=native_cpu(exe);cpu.mem_map(0x2000000,0x100000)
button,entries,palette,stack,stop=0x2000000,0x2010000,0x2020000,0x20fd000,0x20fe000
def write(a,f,*v):cpu.mem_write(a,struct.pack('<'+f,*v))
def read(a,f):return struct.unpack('<'+f,cpu.mem_read(a,struct.calcsize('<'+f)))[0]
def call(a,*args):
    write(stack,'I'*(len(args)+1),stop,*args);cpu.reg_write(UC_X86_REG_ESP,stack)
    cpu.emu_start(a,stop,count=1000000)
    assert cpu.reg_read(UC_X86_REG_EIP)==stop,hex(cpu.reg_read(UC_X86_REG_EIP))
spec=importlib.util.spec_from_file_location('assets',ROOT/'scripts/import-original.py')
a=importlib.util.module_from_spec(spec);spec.loader.exec_module(a)
pal=(exe.parent/'data/pal0-c.dat').read_bytes();raw=(exe.parent/'data/hfx0-0.dat').read_bytes();art=a.sprites(raw,pal)
meta=json.loads((ROOT/'app/original-hud.json').read_text())
assert hashlib.sha256(pal).hexdigest()==meta['sha256']['data/pal0-c.dat']
assert hashlib.sha256(raw).hexdigest()==meta['sha256']['data/hfx0-0.dat']
for i,(w,h,_) in enumerate(art):write(entries+i*8,'IHH',0,w,h)
write(0x5da078,'I',0);write(0x5da074,'I',0)
write(0x59df14,'I',entries);write(0x89c6cf,'HH',640,480)
cpu.mem_write(palette,pal);cpu.mem_write(0xd05528,pal);call(0x42adc0,palette,0x89c6f4)
assert list(cpu.mem_read(0x89c6f4,4))==[130,172,139,228],list(cpu.mem_read(0x89c6f4,4))
assert struct.unpack('<6h',cpu.mem_read(0x5cb3e1,12))==(4,190,4,190,92,13)
assert read(0x5cb3f1,'I')==0x49e8b0
assert struct.unpack('<hhBBhhBB',cpu.mem_read(0x5cd2a8,12))==(0,200,175,130,0,256,225,231)
for off,value in [(16,1),(0x37,4),(0x3b,190),(0x47,92),(0x4b,13)]:write(button+off,'i',value)
fills=[];draws=[];color=0
def observe_palette(cpu,addr,size,user):
    global color
    color=read(cpu.reg_read(UC_X86_REG_ESP)+4,'I')&255
cpu.hook_add(UC_HOOK_CODE,observe_palette,begin=0x415f70,end=0x415f70)
def consume(cpu,addr,size,user):
    sp=cpu.reg_read(UC_X86_REG_ESP);result=0
    if addr in (0x44a1f0,0x44a210):result=read(sp+4,'I')
    elif addr==0x47d980:
        vertices=[struct.unpack('<2f8xI',cpu.mem_read(read(sp+i*4,'I'),20)) for i in range(1,5)]
        left,top=vertices[0][:2];right,bottom=vertices[2][:2]
        assert all(v[2]==0xff000000|int.from_bytes(pal[color*4:color*4+3],'big') for v in vertices)
        fills.append([color,list(map(int,(left,top,right,bottom)))])
    elif addr==0x47dfd0:
        x,y,w,h=struct.unpack('<4f',cpu.mem_read(sp+4,16))
        draws.append([read(sp+32,'I')&65535,*map(int,(x,y,w,h))])
    else:
        entry=read(sp+12,'I');x,y=read(sp+4,'i'),read(sp+8,'i')
        w,h=(read(entry+4,'H'),read(entry+6,'H')) if addr==0x5162e0 else (read(sp+16,'i'),read(sp+20,'i'))
        draws.append([(entry-entries)//8,x,y,w,h])
    cpu.reg_write(UC_X86_REG_EAX,result);cpu.reg_write(UC_X86_REG_EIP,read(sp,'I'))
    cpu.reg_write(UC_X86_REG_ESP,sp+({0x47dfd0:44,0x47d980:28}.get(addr,4)))
for addr in (0x44a1f0,0x44a210,0x47d980,0x47dfd0,0x5162e0,0x516430):cpu.hook_add(UC_HOOK_CODE,consume,begin=addr,end=addr)
# Frame comparisons retain original draw ordering and tiling, including the 13px height.
write(button+256,'4i',0,0,92,13);call(0x4a1f50,button+256,0x5ca9e0)
frame=Image.new('RGBA',(92,13))
for sprite,left,top,width,height in draws:
    w,h,data=art[sprite];tile=Image.frombytes('RGBA',(w,h),bytes(data))
    for y in range(height):
        for x in range(width):
            pixel=tile.getpixel((x%w,y%h))
            if pixel[3]:frame.putpixel((left+x,top+y),pixel)
assert frame.tobytes()==Image.open(ROOT/'public/original/hud-mana.png').convert('RGBA').tobytes()
cases=[]
for estimate in (0,1,2,10,100,256,1000,65000):
    maximum=estimate+estimate*200//256 if estimate>0 else 256
    rates=sorted({0,1,maximum,maximum+1,*[maximum*i//88 for i in range(90)]})
    for rate in rates:
        for flags,mana_flags,override in [(0,0,False),(32,0,False),(0,1,False),(0,1,True)]:
            tribe=len(cases)%4;write(0x89c6f0,'B',tribe)
            write(0x89d1c8+tribe*0xc65+0x95d,'ii',rate,estimate)
            write(0x89d17c,'I',flags);write(0x89c66d,'I',mana_flags);write(0x89798b,'B',int(override))
            fills=[];draws=[];call(0x49e8b0,button)
            assert fills[0]==[172,[6,192,94,201]],fills
            colors=[];pixels=frame.copy()
            for color,(left,top,right,bottom) in fills:
                if len(colors) or right-left==1:
                    assert (left,top,right,bottom)==(6+len(colors)*2,192,7+len(colors)*2,202)
                    colors.append(color)
                for y in range(top,bottom):
                    for x in range(left,right):pixels.putpixel((x-4,y-190),tuple(pal[color*4:color*4+3])+ (255,))
            assert len(colors)==(0 if flags&32 else 44)
            cases.append(dict(tribe=dict(previousRate=rate,estimatedRate=estimate),world=dict(gameFlags=flags,manaFlags=mana_flags),override=override,colors=colors,pixelSha256=hashlib.sha256(pixels.tobytes()).hexdigest()))
js="""import {manaMeter} from './app/hud-mana.ts';let s='';for await(const c of process.stdin)s+=c;console.log(JSON.stringify(JSON.parse(s).map(c=>manaMeter(c.tribe,c.world,c.override))));"""
r=subprocess.run(['node','--input-type=module','-e',js],input=json.dumps(cases),text=True,capture_output=True,cwd=ROOT)
assert r.returncode==0,r.stderr
assert json.loads(r.stdout)==[c['colors'] for c in cases]
fixture=dict(executableSha256=identity['sha256'],cases=cases)
p=ROOT/'tests/fixtures/hud-mana.json'
if '--record' in sys.argv:p.write_text(json.dumps(fixture,separators=(',',':'))+'\n')
else:assert json.loads(p.read_text())==fixture
print(f'PASS: {len(cases):,} complete native production meters, four tribes, sampled/estimated rate boundaries, suppression/override modes; palette, original frame and one-pixel stripe endpoints')
