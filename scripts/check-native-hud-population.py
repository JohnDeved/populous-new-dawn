"""Compare native population/class controls, counts, capacity and original pixels.
Usage: python scripts/check-native-hud-population.py /path/to/d3dpoptb.exe [--record]
Supply only CRT integer formatting, coordinate adapters, bank lookup and raster queues.
"""
import hashlib, importlib.util, json, struct, subprocess, sys
from pathlib import Path
from unicorn import UC_HOOK_CODE
from unicorn.x86_const import UC_X86_REG_ESP, UC_X86_REG_EIP, UC_X86_REG_EAX
from PIL import Image
from decomp import native_cpu, configure_native_constants, ROOT
exe=Path(sys.argv[1]);cpu,identity=native_cpu(exe);configure_native_constants(cpu,exe);cpu.mem_map(0x2000000,0x1000000)
button,hfx,fonts,texture,stack,stop=0x2000000,0x2010000,0x2020000,0x2100000,0x2ffd000,0x2ffe000
def write(a,f,*v):cpu.mem_write(a,struct.pack('<'+f,*v))
def read(a,f):return struct.unpack('<'+f,cpu.mem_read(a,struct.calcsize('<'+f)))[0]
def call(a,*args):
    write(stack,'I'*(len(args)+1),stop,*args);cpu.reg_write(UC_X86_REG_ESP,stack)
    try:cpu.emu_start(a,stop,count=1000000)
    except Exception:
        print('Failed at',hex(cpu.reg_read(UC_X86_REG_EIP)),'caller',hex(a));raise
    assert cpu.reg_read(UC_X86_REG_EIP)==stop,hex(cpu.reg_read(UC_X86_REG_EIP))
spec=importlib.util.spec_from_file_location('assets',ROOT/'scripts/import-original.py');a=importlib.util.module_from_spec(spec);spec.loader.exec_module(a)
pal=(exe.parent/'data/pal0-c.dat').read_bytes();raw=(exe.parent/'data/hfx0-0.dat').read_bytes();art=a.sprites(raw,pal)
meta=json.loads((ROOT/'app/original-hud.json').read_text());atlas=Image.open(ROOT/'public/original/hud.png').convert('RGBA')
for name,data in [('pal0-c.dat',pal),('hfx0-0.dat',raw)]:assert hashlib.sha256(data).hexdigest()==meta['sha256']['data/'+name]
font_art={}
for font in (4,5,6,7):
    raw=(exe.parent/f'data/f00t{font}-0.dat').read_bytes();assert hashlib.sha256(raw).hexdigest()==meta['sha256'][f'data/f00t{font}-0.dat']
    glyphs=a.sprites(raw,pal);font_art[font]=glyphs
    write(0x87cbd0+font*4,'I',fonts+font*0x1000)
    for i,(w,h,data) in enumerate(glyphs):
        write(fonts+font*0x1000+i*8,'IHH',0,w,h)
        r=meta['rects'][f'f00t{font}-{i}'];assert atlas.crop((r['x'],r['y'],r['x']+w,r['y']+h)).tobytes()==data
for i,(w,h,_) in enumerate(art):write(hfx+i*8,'IHH',0,w,h)
write(0x59df14,'I',hfx);write(0x5ce0bc,'I',texture)
write(0x5da078,'I',0);write(0x5da074,'I',0);write(0x89c6cf,'HH',640,480)
cpu.mem_write(0xd05528,pal);cpu.mem_write(0x2030000,pal);call(0x42adc0,0x2030000,0x89c6f4)
assert [read(0x5a70e3+i*50,'h') for i in range(5)]==[1]*5
assert [read(0x5a72ae+i*76,'h') for i in range(3)]==[3,5,7]
assert struct.unpack('<6h',cpu.mem_read(0x5cb213,12))==(0,153,0,153,15,36)
assert read(0x5cb223,'I')==0x4a0800
color=0;draws=[];fills=[];text_draws=[];formatted=[]
def observe(cpu,addr,size,user):
    global color
    color=read(cpu.reg_read(UC_X86_REG_ESP)+4,'I')&255
for addr in (0x415f70,0x4525d0):cpu.hook_add(UC_HOOK_CODE,observe,begin=addr,end=addr)
def consume(cpu,addr,size,user):
    sp=cpu.reg_read(UC_X86_REG_ESP);result=0
    if addr in (0x44a1f0,0x44a210):result=read(sp+4,'I')
    elif addr==0x55b5c0:
        dest,fmt=read(sp+4,'I'),read(sp+8,'I');value=read(sp+12,'i')
        assert fmt in (0x5cd2c8,0x5cd2d4)
        width=2 if fmt==0x5cd2c8 else 3
        assert bytes(cpu.mem_read(fmt,10)).decode('utf-16le').rstrip('\0')==f'%0{width}d'
        text=f'{value:0{width}d}';formatted.append(value);cpu.mem_write(dest,(text+'\0').encode('utf-16le'));result=len(text)
    elif addr==0x516170:
        entry=read(sp+4,'I')
        if hfx<=entry<hfx+len(art)*8:font,index=100,(entry-hfx)//8
        else:font,index=(entry-fonts)//0x1000,(entry-fonts)%0x1000//8
        assert font in font_art or font==100
        write(read(sp+8,'I'),'I',font);write(read(sp+12,'I'),'I',index)
    elif addr==0x47dc50:
        x,y,font,index=struct.unpack('<ffII',cpu.mem_read(sp+4,16))
        if font==100:draws.append([index,int(x),int(y),*art[index][:2]])
        else:text_draws.append([font,index,int(x),int(y)])
    elif addr==0x47d980:
        v=[struct.unpack('<2f8xI',cpu.mem_read(read(sp+i*4,'I'),20)) for i in range(1,5)]
        assert all(p[2]==0xff000000|int.from_bytes(pal[color*4:color*4+3],'big') for p in v)
        fills.append([color,[int(v[0][0]),int(v[0][1]),int(v[2][0]),int(v[2][1])]])
    elif addr==0x47def0:
        x,y,w,h=struct.unpack('<4f',cpu.mem_read(sp+4,16))
        assert read(sp+20,'I')==100
        draws.append([read(sp+24,'I')&65535,*map(int,(x,y,w,h))])
    elif addr==0x47dfd0:
        x,y,w,h=struct.unpack('<4f',cpu.mem_read(sp+4,16))
        draws.append([read(sp+32,'I')&65535,int(x+read(0xa68f64,'f')),int(y+read(0xa68f60,'f')),int(w),int(h)])
    else:
        entry=read(sp+12,'I');w,h=read(entry+4,'H'),read(entry+6,'H')
        draws.append([(entry-hfx)//8,read(sp+4,'i'),read(sp+8,'i'),w,h])
    cpu.reg_write(UC_X86_REG_EAX,result);cpu.reg_write(UC_X86_REG_EIP,read(sp,'I'))
    cpu.reg_write(UC_X86_REG_ESP,sp+({0x47dc50:28,0x47d980:28,0x47dfd0:44,0x47def0:36}.get(addr,4)))
for addr in (0x44a1f0,0x44a210,0x55b5c0,0x516170,0x47dc50,0x47d980,0x47dfd0,0x47def0,0x5162e0):cpu.hook_add(UC_HOOK_CODE,consume,begin=addr,end=addr)
def raster(width,height,origin=(0,0)):
    image=Image.new('RGBA',(width,height));ox,oy=origin
    for sprite,left,top,w,h in draws:
        sw,sh,data=art[sprite]
        for y in range(max(0,h)):
            for x in range(max(0,w)):
                pixel=tuple(data[((y%sh)*sw+x%sw)*4:((y%sh)*sw+x%sw)*4+4])
                if pixel[3] and 0<=left+x-ox<width and 0<=top+y-oy<height:image.putpixel((left+x-ox,top+y-oy),pixel)
    for color,(left,top,right,bottom) in fills:
        for y in range(top,bottom):
            for x in range(left,right):image.putpixel((x-ox,y-oy),tuple(pal[color*4:color*4+3])+(255,))
    for font,index,x,y in text_draws:
        w,h,data=font_art[font][index];image.alpha_composite(Image.frombytes('RGBA',(w,h),bytes(data)),(x-ox,y-oy))
    return image
for name,table,w,h in [('follower',0x5caba8,15,36),('follower-hover',0x5cabc0,15,36),('follower-selected',0x5cabd8,15,36),('population',0x5ca9e0,7,22)]:
    write(button+256,'4i',0,0,w,h);draws=[];call(0x4a1f50,button+256,table)
    assert raster(w,h).tobytes()==Image.open(ROOT/f'public/original/hud-{name}.png').convert('RGBA').tobytes(),(name,draws)
# All five stored class counters, both count tables, all three border states.
cases=[]
for model in (0,2,3,4,5,6):
 total=model==0
 for count in (0,1,9,10,99,100,101,199,200,999):
  for alternate in (False,True):
   for hover,selected in ((False,False),(True,False),(False,True)):
    tribe=len(cases)%4;base=0x89d1c8+tribe*0xc65
    cpu.mem_write(base,bytes(0xc65));write(0x89c6f0,'B',tribe)
    write(base+0x93d,'I',128 if alternate else 0)
    counts=[0]*5;counts[model-2 if model else 0]=count
    other=[n+11 for n in counts]
    normal=other if alternate else counts
    write(base+0xa2b,'5h',*normal);write(base+0xa3d,'5h',*(counts if alternate else other))
    write(base+0x921,'i',6);write(base+0xb7f,'3h',2,0,0)
    cpu.mem_write(button,bytes(256))
    sprite={0:0,2:666,3:668,4:672,5:674,6:670}[model]
    for off,value in [(8,1),(12,int(selected)),(16,1),(24,int(hover)),(0x37,0),(0x3b,153),(0x47,15),(0x4b,36),(0x4f,sprite),(99,model)]:write(button+off,'i',value)
    write(0x897981,'I',0);draws=[];fills=[];text_draws=[];formatted=[]
    call(0x4a0800 if total else 0x4a0510,button)
    assert formatted==[count]
    cases.append(dict(model=model,count=count,total=total,alternate=alternate,hover=hover,selected=selected,population=sum(normal)+1,capacity=12,draws=text_draws,icons=[d for d in draws if 666<=d[0]<=675],fills=fills,pixelSha256=hashlib.sha256(raster(15,36,(0,153)).tobytes()).hexdigest()))
# Run the complete housing controller through capacity boundaries and every blink frame.
meters=[]
for capacity in (0,1,6,12,37,199,200):
 for population in sorted({1,2,max(1,capacity-1),max(1,capacity),capacity+1}):
  for frame in (range(512) if population>=capacity else (0,292)):
    base=0x89d1c8;cpu.mem_write(base,bytes(0xc65));write(0x89c6f0,'B',0)
    write(base+0xa2b,'5h',population-1,0,0,0,0);write(base+0x921,'i',capacity)
    for off,value in [(8,1),(12,0),(16,1),(24,0),(0x4f,0)]:write(button+off,'i',value)
    write(0x897981,'I',frame);draws=[];fills=[];text_draws=[];formatted=[]
    call(0x4a0800,button)
    color,rect=fills[-1];assert rect[0:1]+rect[2:]==[6,9,177]
    meters.append(dict(population=population,capacity=capacity,frame=frame,pixels=177-rect[1],color=color))
fixture=dict(executableSha256=identity['sha256'],cases=cases,meters=meters)
js="""import {followerNumber,populationMeter} from './app/hud-population.ts';import h from './app/original-hud.json' with{type:'json'};let s='';for await(const c of process.stdin)s+=c;console.log(JSON.stringify(JSON.parse(s).map(c=>{const n=followerNumber(c.count,c.total,c.alternate);let x=n.x;return n.ids.map(id=>{const [font,index]=id.slice(4).split('-').map(Number),d=[font,index,x,n.y+153];x+=h.rects[id].w;return d})})));"""
r=subprocess.run(['node','--input-type=module','-e',js],input=json.dumps(cases),text=True,capture_output=True,cwd=ROOT)
assert r.returncode==0,r.stderr
for c,got in zip(cases,json.loads(r.stdout)):assert c['draws']==got,(c,got)
js="""import {populationMeter} from './app/hud-population.ts';let s='';for await(const c of process.stdin)s+=c;console.log(JSON.stringify(JSON.parse(s).map(c=>populationMeter(c.population,c.capacity,c.frame))));"""
r=subprocess.run(['node','--input-type=module','-e',js],input=json.dumps(meters),text=True,capture_output=True,cwd=ROOT)
assert r.returncode==0,r.stderr
assert json.loads(r.stdout)==[{k:c[k] for k in ('pixels','color')} for c in meters]
p=ROOT/'tests/fixtures/hud-population.json'
if '--record' in sys.argv:p.write_text(json.dumps(fixture,separators=(',',':'))+'\n')
else:assert json.loads(p.read_text())==fixture
print(f'PASS: {len(cases)} native follower/total count controllers, four count fonts, hover/selection frames, {len(meters):,} full housing/blink controllers and imported glyph pixels')
