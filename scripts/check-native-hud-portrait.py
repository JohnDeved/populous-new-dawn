"""Compare original portrait controller, directional animation and layer submissions.
Usage: python scripts/check-native-hud-portrait.py /path/to/d3dpoptb.exe [--record]
Logical 640×480; only coordinate adapters, palette and final raster consumers supplied.
"""
import hashlib, importlib.util, json, struct, subprocess, sys
from pathlib import Path
from unicorn import UC_HOOK_CODE
from unicorn.x86_const import UC_X86_REG_ESP, UC_X86_REG_EIP, UC_X86_REG_EAX
from PIL import Image, ImageDraw
from decomp import native_cpu, ROOT
exe=Path(sys.argv[1]);cpu,identity=native_cpu(exe);cpu.mem_map(0x2000000,0x1000000)
button,unit,hfx,palette,bank,frames,elements,camera,starts,sequences,stack,stop=(
    0x2000000,0x2001000,0x2010000,0x2020000,0x2100000,0x2200000,
    0x2300000,0x2400000,0x2500000,0x2600000,0x2ffd000,0x2ffe000)
def write(a,f,*v):cpu.mem_write(a,struct.pack('<'+f,*v))
def read(a,f):return struct.unpack('<'+f,cpu.mem_read(a,struct.calcsize('<'+f)))[0]
def call(a,*args):
    write(stack,'I'*(len(args)+1),stop,*args);cpu.reg_write(UC_X86_REG_ESP,stack)
    cpu.emu_start(a,stop,count=1000000)
    assert cpu.reg_read(UC_X86_REG_EIP)==stop,hex(cpu.reg_read(UC_X86_REG_EIP))
spec=importlib.util.spec_from_file_location('assets',ROOT/'scripts/import-original.py')
a=importlib.util.module_from_spec(spec);spec.loader.exec_module(a)
pal=(exe.parent/'data/pal0-c.dat').read_bytes()
hfx_raw=(exe.parent/'data/hfx0-0.dat').read_bytes();hfx_art=a.sprites(hfx_raw,pal)
art=a.sprites((exe.parent/'data/hspr0-0.dat').read_bytes(),pal)
for i,(w,h,_) in enumerate(hfx_art):write(hfx+i*8,'IHH',0,w,h)
for i,(w,h,_) in enumerate(art):write(bank+(i+1)*8,'IHH',0,w,h)
vfra=(exe.parent/'data/vfra-0.ani').read_bytes()
cpu.mem_write(frames,b''.join(vfra[i:i+6] for i in range(0,len(vfra),8)))
vele=bytearray((exe.parent/'data/vele-0.ani').read_bytes())
for i in range(0,len(vele),10):struct.pack_into('<H',vele,i,struct.unpack_from('<H',vele,i)[0]//6*8)
cpu.mem_write(elements,bytes(vele));next_sequence=sequences
for i,(first,flip) in enumerate(struct.iter_unpack('<HH',(exe.parent/'data/vstart-0.ani').read_bytes())):
    chain=[];frame=first
    while frame and frame not in chain:
        chain.append(frame);frame=struct.unpack_from('<H',vfra,frame*8+6)[0]
    write(starts+i*6,'BBI',int(bool(flip)),len(chain)&255,next_sequence)
    if chain:write(next_sequence,'H'*len(chain),*chain)
    next_sequence+=len(chain)*2
for addr,value in [(0x59df14,hfx),(0x59df18,bank),(0x59df48,frames),(0x59df4c,elements),(0x59df44,starts),(0x74a350,camera)]:write(addr,'I',value)
write(0x5ce0bc,'I',0x2700000)
write(0x89c6cf,'HH',640,480);cpu.mem_write(palette,pal);call(0x42adc0,palette,0x89c6f4)
assert struct.unpack('<6h',cpu.mem_read(0x5caefb,12))==(33,114,33,114,30,35)
assert read(0x5caf0b,'I')==0x49fe70
units=json.loads((ROOT/'app/original-units.json').read_text());packed={p['source']:i for i,p in enumerate(units['pieces'])}
fills=[];borders=[];layers=[];color=0
def consume(cpu,addr,size,user):
    global color
    sp=cpu.reg_read(UC_X86_REG_ESP);arg=read(sp+4,'I');result=0
    if addr in (0x44a1f0,0x44a210):result=arg
    elif addr==0x415f70:color=arg&255
    elif addr==0x516890:fills.append([color,list(struct.unpack('<4i',cpu.mem_read(arg,16)))])
    elif addr==0x47dfd0:
        x,y,w,h=struct.unpack('<4f',cpu.mem_read(sp+4,16))
        borders.append([read(sp+32,'I')&65535,int(x+read(0xa68f64,'f')),int(y+read(0xa68f60,'f')),int(w),int(h)])
    else:
        entry=read(sp+12,'I');x,y=read(sp+4,'i'),read(sp+8,'i')
        w,h=(read(entry+4,'H'),read(entry+6,'H')) if addr==0x5162e0 else (read(sp+16,'i'),read(sp+20,'i'))
        if bank<=entry<bank+len(art)*8+8:
            source=(entry-bank)//8-1
            layers.append(dict(piece=packed[source],x=x-47,y=y-144,w=w,h=h,flags=read(0x5da074,'I')))
        else:borders.append([(entry-hfx)//8,x,y,w,h])
    cpu.reg_write(UC_X86_REG_EAX,result);cpu.reg_write(UC_X86_REG_EIP,read(sp,'I'))
    cpu.reg_write(UC_X86_REG_ESP,sp+({0x415f70:8,0x47dfd0:44}.get(addr,4)))
for addr in (0x44a1f0,0x44a210,0x415f70,0x516890,0x47dfd0,0x5162e0,0x516430):cpu.hook_add(UC_HOOK_CODE,consume,begin=addr,end=addr)
for name,table in [('portrait',0x5cac38),('portrait-hover',0x5cac50),('portrait-selected',0x5cac68)]:
    borders=[];write(button+256,'4i',0,0,30,35);call(0x4a1f50,button+256,table)
    image=Image.new('RGBA',(30,35))
    for sprite,x,y,w,h in borders:
        sw,sh,pixels=hfx_art[sprite];tile=Image.frombytes('RGBA',(sw,sh),bytes(pixels))
        for yy in range(0,h,sh):
            for xx in range(0,w,sw):image.alpha_composite(tile.crop((0,0,min(sw,w-xx),min(sh,h-yy))),(x+xx,y+yy))
    assert image.tobytes()==Image.open(ROOT/f'public/original/hud-{name}.png').convert('RGBA').tobytes(),name
cases=[];backgrounds=[]
for state in (0,25,29,26):
    for health in (0,1774,1775,1776,2000):
        for counter in range(8):
            for hover in (False,True):backgrounds.append(dict(shaman=dict(health=health,maximum=2000,state=state),counter=counter,hover=hover))
backgrounds.extend(dict(shaman=None,counter=4,hover=hover) for hover in (False,True))
for case in backgrounds:
    shaman=case['shaman'];cpu.mem_write(button,bytes(256))
    for off,value in [(8,1),(16,1),(24,int(case['hover'])),(0x37,33),(0x3b,114),(0x47,30),(0x4b,35)]:write(button+off,'i',value)
    write(0x89d1c8+0x89d,'I',unit if shaman else 0);write(0x89c6f0,'B',0)
    write(unit+0x2b,'BB',7,shaman['state'] if shaman else 0);write(unit+0x33,'H',424)
    write(unit+0x6c,'hh',2000,shaman['health'] if shaman else 0);write(0x897981,'B',case['counter'])
    fills=[];layers=[];borders=[];call(0x49fe70,button)
    assert len(fills)==1 and fills[0][1]==[35,116,60,146],fills
    case['color']=fills[0][0]
    assert bool(layers)==bool(shaman)
# Exercise every imported shaman action, direction, and both ends of each cycle.
for signature in ('blue-shaman','red-shaman'):
    owner=int(signature.startswith('red'))
    for action,directions in units['animations'][signature].items():
        for direction,cycle in enumerate(directions):
            for step in sorted({0,len(cycle['frames'])-1}):
                frame=cycle['frames'][step];write(unit+0x2f,'B',owner)
                write(unit+0x33,'H',directions[0]['source']-owner*8);write(unit+0x39,'B',step)
                write(unit+0x26,'h',0);write(camera+0x32,'h',(direction*256+0x380)&2047)
                layers=[];call(0x450e60,unit,47,144)
                image=Image.new('RGBA',(100,480));ImageDraw.Draw(image).rectangle((35,116,59,145),fill=tuple(pal[172*4:172*4+3])+(255,))
                for layer in layers:
                    sw,sh,pixels=art[units['pieces'][layer['piece']]['source']]
                    assert layer['flags'] in (0,1),layer
                    tile=Image.frombytes('RGBA',(sw,sh),bytes(pixels))
                    if layer['flags']&1:tile=tile.transpose(Image.Transpose.FLIP_LEFT_RIGHT)
                    image.alpha_composite(tile,(47+layer['x'],144+layer['y']))
                cases.append(dict(signature=signature,action=action,direction=direction,step=step,frame=frame,flip=cycle['flip'],draws=layers,pixelsSha256=hashlib.sha256(image.tobytes()).hexdigest()))
js="""import {portraitBackground} from './app/hud-portrait.ts';import {spriteLayers} from './app/sprite-layers.ts';import u from './app/original-units.json' with {type:'json'};import v from './app/original-camera.json' with {type:'json'};let s='';for await(const c of process.stdin)s+=c;const f=JSON.parse(s);for(const c of f.backgrounds)if(portraitBackground(c.shaman,c.counter,c.hover)!==c.color)throw Error(JSON.stringify(c));for(const c of f.cases){const got=spriteLayers(u.frames[c.frame].layers,u.pieces,{flags:2|Number(c.flip)},v.views[0]);if(JSON.stringify(got)!==JSON.stringify(c.draws))throw Error(JSON.stringify({c,got}));}"""
fixture=dict(executableSha256=identity['sha256'],backgrounds=backgrounds,cases=cases)
r=subprocess.run(['node','--input-type=module','-e',js],input=json.dumps(fixture),capture_output=True,text=True,cwd=ROOT)
assert r.returncode==0,r.stderr
path=ROOT/'tests/fixtures/hud-portrait.json'
if '--record' in sys.argv:path.write_text(json.dumps(fixture,separators=(',',':'))+'\n')
else:assert json.loads(path.read_text())==fixture,'Native fixture drift; review before --record'
print(f'PASS: {len(backgrounds)} native portrait controllers, {len(cases)} complete directional animations/layer submissions, three original border PNGs')
