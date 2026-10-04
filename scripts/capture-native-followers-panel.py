"""Capture original Followers-panel native draw requests and supplied HFX pixels.
Usage: python scripts/capture-native-followers-panel.py EXE OUTPUT_DIRECTORY
Supply only CRT integer formatting, coordinate adapters, bank lookup and raster queues.
"""
import hashlib, importlib.util, json, struct, sys
from pathlib import Path
from unicorn import UC_HOOK_CODE
from unicorn.x86_const import UC_X86_REG_ESP, UC_X86_REG_EIP, UC_X86_REG_EAX
from PIL import Image
from decomp import native_cpu, configure_native_constants, ROOT
output=Path(sys.argv[2]);output.mkdir(parents=True,exist_ok=True)
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
        if font==100:draws.append([index,int(x),int(y),*art[index][:2],read(0x5da074,"I")])
        else:text_draws.append([font,index,int(x),int(y)])
    elif addr==0x47d980:
        v=[struct.unpack('<2f8xI',cpu.mem_read(read(sp+i*4,'I'),20)) for i in range(1,5)]
        assert all(p[2]==0xff000000|int.from_bytes(pal[color*4:color*4+3],'big') for p in v)
        fills.append([color,[int(v[0][0]),int(v[0][1]),int(v[2][0]),int(v[2][1])]])
    elif addr==0x47def0:
        x,y,w,h=struct.unpack('<4f',cpu.mem_read(sp+4,16))
        assert read(sp+20,'I')==100
        draws.append([read(sp+24,'I')&65535,*map(int,(x,y,w,h)),read(0x5da074,"I")])
    elif addr==0x47dfd0:
        x,y,w,h=struct.unpack('<4f',cpu.mem_read(sp+4,16))
        draws.append([read(sp+32,'I')&65535,int(x+read(0xa68f64,'f')),int(y+read(0xa68f60,'f')),int(w),int(h),read(0x5da074,"I")])
    else:
        entry=read(sp+12,'I');w,h=read(entry+4,'H'),read(entry+6,'H')
        draws.append([(entry-hfx)//8,read(sp+4,'i'),read(sp+8,'i'),w,h,read(0x5da074,'I')])
    cpu.reg_write(UC_X86_REG_EAX,result);cpu.reg_write(UC_X86_REG_EIP,read(sp,'I'))
    cpu.reg_write(UC_X86_REG_ESP,sp+({0x47dc50:28,0x47d980:28,0x47dfd0:44,0x47def0:36}.get(addr,4)))
for addr in (0x44a1f0,0x44a210,0x55b5c0,0x516170,0x47dc50,0x47d980,0x47dfd0,0x47def0,0x5162e0):cpu.hook_add(UC_HOOK_CODE,consume,begin=addr,end=addr)
def raster(width,height,origin=(0,0)):
    image=Image.new('RGBA',(width,height));ox,oy=origin
    for sprite,left,top,w,h,flags in draws:
        sw,sh,data=art[sprite]
        for y in range(max(0,h)):
            for x in range(max(0,w)):
                pixel=tuple(data[((y%sh)*sw+x%sw)*4:((y%sh)*sw+x%sw)*4+4])
                assert not flags & 8, "Disabled diffuse is outside this enabled-only raster capture"
                if pixel[3] and 0<=left+x-ox<width and 0<=top+y-oy<height:image.putpixel((left+x-ox,top+y-oy),pixel)
    for color,(left,top,right,bottom) in fills:
        for y in range(top,bottom):
            for x in range(left,right):image.putpixel((x-ox,y-oy),tuple(pal[color*4:color*4+3])+(255,))
    for font,index,x,y in text_draws:
        w,h,data=font_art[font][index];image.alpha_composite(Image.frombytes('RGBA',(w,h),bytes(data)),(x-ox,y-oy))
    return image
# Each case uses real descriptor fields and calls real leaf renderers. This is a
# native-command reconstruction, not a screenshot of a running Windows game.
# Fonts/raster queues are supplied at the same boundaries as hud-population probe.
models=[0,2,3,6,4,5]
all_draws=[];all_text=[]
for alternate in (False,True):
 for selected in (False,True):
  cpu.mem_write(0x89d1c8,bytes(4*0xc65));write(0x89c6f0,'B',0)
  write(0x89d1c8+0x93d,'I',128 if alternate else 0)
  for model in range(2,7):
   for category in range(1,5):
    write(0x89dc6d+(model*6+category)*2,'h',model*10+category)
    write(0x89dcd9+(model*6+category)*2,'h',category)
  for i in range(9):
   write(0x89dd9f+i*2,'h',i+1);write(0x89ddb1+i*2,'h',i+2)
   write(0x89ddc3+i*2,'h',i+3);write(0x89ddd5+i*2,'h',i+4)
  draws=[];text_draws=[];fills=[];formatted=[]
  # Panel background and border draw uses the actual root geometry/data descriptor.
  call(0x4a1720,0x5cd178)
  for index in range(36):
   descriptor=0x5cc6f0+index*66
   cpu.mem_write(button,bytes(128))
   x,y=struct.unpack('<2h',cpu.mem_read(descriptor+25,4))
   w,h=struct.unpack('<2h',cpu.mem_read(descriptor+33,4))
   write(button+8,'I',1);write(button+0x10,'I',1)
   write(button+0x18,'I',selected);write(button+0x1c,'I',0)
   write(button+0x37,'ii',x,204+y);write(button+0x47,'ii',w,h)
   write(button+0x4f,'I',read(descriptor+37,'I'))
   write(button+99,'I',read(descriptor+55,'I'))
   call(read(descriptor+41,'I'),button)
  name=f'panel-{"nearby" if alternate else "global"}-{"pressed" if selected else "normal"}'
  raster(104,277,(-4,204)).save(output/f'{name}.png')
  all_draws.append(dict(name=name,draws=draws,text=text_draws,formatted=formatted))
  assert len(formatted)==36
  # Global totals cover the five non-Shaman classes. Nearby totals use alternate matrix.
  assert formatted[:4]==([5,10,15,20] if alternate else [205,210,215,220])
  assert [d[0] for d in draws if d[0] in range(639,656) or d[0] in range(1084,1089)]==[
   *[639+row*2+int(selected) for row in range(4)],
   *[1084+row for model in range(5) for row in range(4)],
   653+int(selected),*[655]*5,647+int(selected),*[1088]*5]
print('PASS: four 36-cell native renderer captures; global/nearby counters, normal/pressed icons, fonts and draw geometry')
# Disabled lower cells retain the opaque task/vehicle silhouette after the frame
# helper clears flag 8. Zero values are formatted but render no number glyphs.
disabled_contracts=[]
for renderer,key in [(0x4a0e70,10+row) for row in range(4)]+[(0x4a1580,2),(0x4a1580,10)]:
    cpu.mem_write(0x89d1c8,bytes(4*0xc65));cpu.mem_write(button,bytes(128))
    write(button+0x10,'I',1);write(button+0x37,'ii',16,210)
    write(button+0x47,'ii',15,34);write(button+99,'I',key)
    draws=[];text_draws=[];formatted=[];fills=[]
    call(renderer,button)
    assert len(draws)==10 and all(d[-1]&8 for d in draws[:9])
    assert not draws[-1][-1]&8 and formatted==[0] and not text_draws
    disabled_contracts.append(dict(renderer=f'{renderer:08x}',key=key,draws=draws))
print('PASS: six disabled lower cells submit flagged frames, opaque silhouettes and no zero digits')

# Recover only the eighteen actually consumed icons. Do not run broad importer.
ids=[*range(639,649),653,654,655,*range(1084,1089)]
from PIL import ImageDraw
sheet=Image.new('RGBA',(9*80,2*110),(48,38,34,255));label=ImageDraw.Draw(sheet)
artifacts=[]
for index,sprite in enumerate(ids):
 w,h,pixels=art[sprite]
 icon=Image.frombytes('RGBA',(w,h),bytes(pixels))
 x,y=(index%9)*80,(index//9)*110
 sheet.alpha_composite(icon.resize((w*3,h*3),Image.Resampling.NEAREST),(x+10,y+23))
 label.text((x+5,y+4),f'HFX {sprite}',fill='white')
 artifacts.append(dict(id=sprite,width=w,height=h,rgbaSha256=hashlib.sha256(pixels).hexdigest()))
sheet.save(output/'panel-sprite-contact-sheet.png')
(output/'native-panel-raster.json').write_text(json.dumps(dict(executable=identity,
 probeSha256=hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),
 inputs={name:hashlib.sha256((exe.parent/name).read_bytes()).hexdigest() for name in
 ['data/hfx0-0.dat','data/pal0-c.dat',*[f'data/f00t{i}-0.dat' for i in (4,5,6,7)]]},
 icons=artifacts,captures=all_draws,disabledDrawContracts=disabled_contracts,
 limits=['Reconstructed native draw queues with supplied coordinate adapters, CRT formatting, bank lookup and raster consumers.',
         'Enabled-cell captures only; disabled diffuse is asserted absent, not approximated.',
         'No game runtime screenshot or browser integration claim.']),indent=2)+'\n')
