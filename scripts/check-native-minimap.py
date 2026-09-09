"""Compare complete native minimap terrain, camera wrapping and final UV transforms.
Usage: python SCRIPT EXE [--record]
Device/cache/copy/submission callbacks are supplied only for the final quad.
"""
import hashlib, json, random, struct, subprocess, sys
from pathlib import Path
from unicorn import UC_HOOK_CODE
from unicorn.x86_const import UC_X86_REG_EAX, UC_X86_REG_EIP, UC_X86_REG_ESP, UC_X86_REG_FPCW
from decomp import native_cpu, ROOT

cpu, identity = native_cpu(Path(sys.argv[1]))
cpu.mem_map(0x2000000, 0x1000000)
colors, full, wrapped, surface, vtable = 0x2000000, 0x2100000, 0x2200000, 0x2300000, 0x2301000
stack, stop, lock, unlock = 0x2ffd000, 0x2ffe000, 0x2ffb000, 0x2ffb100
cpu.reg_write(UC_X86_REG_FPCW, 0x27f)

def write(a, fmt, *values): cpu.mem_write(a, struct.pack('<' + fmt, *values))
def read(a, fmt='I'): return struct.unpack('<' + fmt, cpu.mem_read(a, struct.calcsize('<' + fmt)))[0]
def call(a, *args):
    write(stack, 'I' * (len(args) + 1), stop, *args)
    cpu.reg_write(UC_X86_REG_ESP, stack)
    cpu.emu_start(a, stop, count=10000000)
    assert cpu.reg_read(UC_X86_REG_EIP) == stop, hex(cpu.reg_read(UC_X86_REG_EIP))

source = Path(sys.argv[1]).parent / 'data/bigf0-c.dat'
bank = source.read_bytes()
assert hashlib.sha256(bank).hexdigest() == json.loads((ROOT / 'public/original/provenance.json').read_text())['sha256']['data/bigf0-c.dat']
cpu.mem_write(colors, bank)
write(0x5d45c8, 'I', colors)
write(0x64f474, 'I', full)
write(0x64f478, 'I', wrapped)
write(0x89c6f0, 'B', 0)
write(0x89c6f5, 'B', 172)
write(surface, 'I', vtable)
write(vtable + 0x64, 'I', lock)
write(vtable + 0x80, 'I', unlock)
write(0x9bccc8, 'I', surface)

def device(c, address, size, data):
    sp = c.reg_read(UC_X86_REG_ESP)
    cleanup = 0
    if address == lock:
        cleanup = 20
    elif address == unlock:
        cleanup = 8
    elif address == 0x42fe70:
        cleanup = 24
    elif address == 0x47d980:
        cleanup = 24
        for i in range(4):
            vertex = read(sp + 4 + i * 4)
            quad.append(list(struct.unpack('<2f', c.mem_read(vertex, 8))) +
                        list(struct.unpack('<2f', c.mem_read(vertex + 24, 8))))
    c.reg_write(UC_X86_REG_EAX, 0)
    c.reg_write(UC_X86_REG_EIP, read(sp))
    c.reg_write(UC_X86_REG_ESP, sp + 4 + cleanup)

for address in [lock, unlock, 0x42fe70, 0x509b10, 0x47d980]:
    cpu.hook_add(UC_HOOK_CODE, device, begin=address, end=address)

rng = random.Random(0x4206e0)
land = {k: [] for k in ['heights', 'cliffs', 'flags', 'brightness']}
for i in range(16384):
    h, cliff, flags, light = rng.randrange(1024), rng.randrange(2), rng.choice([0, 8]), rng.randrange(256)
    for k, v in zip(land, [h, cliff, flags, light]): land[k].append(v)
    write(0x8a03e4 + i * 16, 'Ih', flags, h)
    write(0x8a03e4 + i * 16 + 10, 'B', cliff)
    write(0x8a03e4 + i * 16 + 13, 'B', light)
cases = []
for i in range(64):
    width, height = [(100, 96), (200, 144), (225, 200), (128, 128), (256, 256), (1, 1), (127, 99), (255, 193)][i % 8]
    center = dict(x=rng.randrange(65536), y=rng.randrange(65536))
    heading, fog = rng.randrange(2048), bool(i & 1)
    texture_size = 1 << max(width, height).bit_length()
    write(0x895da8, 'I', 4 if fog else 0)
    write(0x64f470, 'I', 2)
    write(0x89d1ec, 'HH', center['x'], center['y'])
    write(0x89d1fa, 'H', heading)
    call(0x4206e0, width, height)
    assert not read(0x64f470) & 3
    terrain = hashlib.sha256(cpu.mem_read(full, width * height)).hexdigest()
    cpu.mem_write(wrapped, bytes([0x5a]) * 65536)
    call(0x420100, width, height)
    crop = b''.join(bytes(cpu.mem_read(wrapped + y * 256, width)) for y in range(height))
    assert all(bytes(cpu.mem_read(wrapped + y * 256 + width, 256 - width)) == bytes([0x5a]) * (256 - width) for y in range(height))
    write(0x5d20f8, 'I', texture_size)
    quad = []
    call(0x41fce0, 0, 0, width, height)
    assert len(quad) == 4
    cases.append(dict(width=width, height=height, center=center, heading=heading, fog=fog,
        terrain=terrain, wrapped=hashlib.sha256(crop).hexdigest(), textureSize=texture_size, quad=quad))

js = """
import {readFileSync} from 'node:fs'; import {createHash} from 'node:crypto';
import {minimapTerrain,minimapScroll,minimapTransform} from './app/minimap.ts';
import {readTerrainTextures} from './app/terrain-texture.ts';
let input='';for await(const b of process.stdin)input+=b;
const {land,cases}=JSON.parse(input),raw=readFileSync('public/original/landscape.bin'),
 t=readTerrainTextures(raw.buffer.slice(raw.byteOffset,raw.byteOffset+raw.byteLength)),hash=a=>createHash('sha256').update(a).digest('hex');
console.log(JSON.stringify(cases.map(c=>{
 const {width:w,height:h}=c,pixels=minimapTerrain(land,land.brightness,t,w,h,c.fog),scroll=minimapScroll(w,h,c.center),crop=new Uint8Array(w*h),m=minimapTransform(w,h,c.heading);
 for(let y=0;y<h;y++)for(let x=0;x<w;x++)crop[y*w+x]=pixels[((y+scroll.y)%h)*w+(x+scroll.x)%w];
 return {terrain:hash(pixels),wrapped:hash(crop),quad:c.quad.map(([x,y])=>[x,y,(m[0]*x+m[2]*y+m[4])/c.textureSize,(m[1]*x+m[3]*y+m[5])/c.textureSize])};
})));
"""
result = subprocess.run(['node', '--input-type=module', '-e', js], input=json.dumps(dict(land=land, cases=cases)), capture_output=True, text=True, cwd=ROOT)
assert result.returncode == 0, result.stderr
for i, (actual, expected) in enumerate(zip(json.loads(result.stdout), cases)):
    assert actual['terrain'] == expected['terrain'], ('terrain', i, actual, expected)
    assert actual['wrapped'] == expected['wrapped'], ('wrapped', i, actual, expected)
    for a, e in zip(actual['quad'], expected['quad']):
        assert all(abs(x-y) < 1e-6 for x,y in zip(a,e)), ('quad', i, a, e)
fixture = dict(executableSha256=identity['sha256'], land=land, cases=cases)
path = ROOT / 'tests/fixtures/minimap.json'
if '--record' in sys.argv: path.write_text(json.dumps(fixture, separators=(',', ':')) + '\n')
else: assert json.loads(path.read_text()) == fixture
print(f'PASS: 64 complete native terrain/camera-wrap/quad paths; {sum(c["width"]*c["height"] for c in cases):,} indexed pixels, padding and 256 rotated UV vertices')

# Complete marker controller and circle selector. Visibility and final drawing
# consumers are supplied; inherited first-building size is explicitly seeded.
entries, objects_base = 0x2400000, 0x2500000
raw = (source.parent / 'hfx0-0.dat').read_bytes()
for i in range(struct.unpack_from('<I', raw, 4)[0]):
    w, h, offset = struct.unpack_from('<HHI', raw, 8 + i * 8)
    write(entries + i * 8, 'IHH', offset, w, h)
write(0x59df14, 'I', entries)
cpu.mem_write(0xd05528, (source.parent / 'pal0-c.dat').read_bytes())
assert list(cpu.mem_read(0x5a89c8, 20)) == [219,223,218,4,222,244,246,242,0,244,237,239,236,1,236,227,229,226,3,226]
marker_draws, visibility, color = [], {}, 0

def marker_consumer(c, address, size, data):
    global color
    sp = c.reg_read(UC_X86_REG_ESP)
    result, cleanup = 0, 0
    if address == 0x4f1370: result = int(visibility[read(sp + 4)])
    elif address == 0x415f70: color = read(sp + 4) & 255; cleanup = 4
    elif address == 0x527d10:
        marker_draws.append(dict(x=read(sp+4,'i'), y=read(sp+8,'i'), color=color))
    elif address in (0x516370, 0x5162e0):
        marker_draws.append(dict(x=read(sp+4,'i'), y=read(sp+8,'i'),
            sprite=(read(sp+12)-entries)//8,
            color=read(sp+20)&255 if address == 0x516370 else -1))
    c.reg_write(UC_X86_REG_EAX, result)
    c.reg_write(UC_X86_REG_EIP, read(sp))
    c.reg_write(UC_X86_REG_ESP, sp + 4 + cleanup)

for address in [0x529400,0x5280f0,0x499900,0x499920,0x4ffae0,0x4f1370,0x415f70,0x527d10,0x516370,0x5162e0]:
    cpu.hook_add(UC_HOOK_CODE, marker_consumer, begin=address, end=address)
marker_cases = []
for i in range(64):
    width, height = [(100,96),(200,144),(225,200),(256,256)][i%4]
    center = dict(x=rng.randrange(65536),y=rng.randrange(65536))
    flags, turn, scale, fog = (i%4)*256, i%8, i%5, bool(i&4)
    objects = []
    for j,(category,model) in enumerate([(2,1),(1,2),(2,1),(1,7),(1,2),(6,2),(2,2),(6,6),(10,8),(10,7),(3,1),(1,7)]):
        p=objects_base+j*0x100
        tribe = -1 if j==4 else (i+j)%4
        visible,hidden = bool(rng.randrange(2)),bool(rng.randrange(2))
        x,y=rng.randrange(65536),rng.randrange(65536)
        objects.append(dict(category=category,model=model,tribe=tribe,visible=visible,hidden=hidden,x=x,y=y))
        cpu.mem_write(p,bytes(0x100))
        write(p+4,'I',p+0x100 if j<11 else 0)
        write(p+0x2a,'BB',category,model);write(p+0x2f,'b',tribe)
        write(p+0x3d,'HH',x,y);write(p+0x10,'I',0x40000000 if hidden else 0)
        visibility[p]=visible
    write(0x890324,'I',objects_base);write(0x895da4,'I',flags)
    write(0x895da8,'I',4 if fog else 0);write(0x89d184,'I',turn);write(0x89c67d,'B',scale)
    write(0x89d1ec,'HH',center['x'],center['y']);write(stack-0x50,'I',1)
    marker_draws=[];call(0x4202d0,wrapped,width,height)
    visible_objects=[p for p in objects if not fog or land['flags'][((p['y']>>9)&127)*128+((p['x']>>9)&127)]&8]
    marker_cases.append(dict(width=width,height=height,center=center,flags=flags,turn=turn,scale=scale,objects=visible_objects,expected=marker_draws))
js = """
import {minimapMarkers} from './app/minimap.ts';import hud from './app/original-hud.json' with {type:'json'};
let input='';for await(const b of process.stdin)input+=b;
console.log(JSON.stringify(JSON.parse(input).map(c=>minimapMarkers(c.objects,c.width,c.height,c.center,c.flags,c.turn,c.scale).flatMap(m=>{
 if(m.sprite!==undefined){if(m.sprite===59){const r=hud.rects[m.sprite];return [{x:m.x-(r.w>>1),y:m.y-(r.h>>1),sprite:m.sprite,color:m.color}]};return [m]}
 return (m.size===1?[[0,0]]:[[0,0],[1,1],[0,1],[1,0]]).map(([x,y])=>({x:m.x+x,y:m.y+y,color:m.color}));
}))));
"""
result=subprocess.run(['node','--input-type=module','-e',js],input=json.dumps(marker_cases),capture_output=True,text=True,cwd=ROOT)
assert result.returncode==0,result.stderr
for i,(actual,c) in enumerate(zip(json.loads(result.stdout),marker_cases)):
    assert actual==c['expected'],('markers',i,actual,c)
path=ROOT/'tests/fixtures/minimap-markers.json'
fixture=dict(executableSha256=identity['sha256'],cases=marker_cases)
if '--record' in sys.argv:path.write_text(json.dumps(fixture,separators=(',',':'))+'\n')
else:assert json.loads(path.read_text())==fixture
print(f'PASS: 64 complete native mixed-object marker controllers and circle selectors; visibility/fog, inherited sizes, all tribe colors, scale shifts and blinking discoveries')

if '--browser' in sys.argv:
    browser_cases = json.loads(Path(sys.argv[sys.argv.index('--browser') + 1]).read_text())
    palette = (source.parent / 'pal0-c.dat').read_bytes()
    def rgba_hash(indexed):
        return hashlib.sha256(b''.join(palette[c*4:c*4+3]+b'\xff' for c in indexed)).hexdigest()
    for case in browser_cases:
        width, height = case['width'], case['height']
        for i,(h,cliff,flags,light) in enumerate(zip(*[case['land'][k] for k in ['heights','cliffs','flags','brightness']])):
            write(0x8a03e4+i*16,'Ih',flags,h)
            write(0x8a03e4+i*16+10,'B',cliff);write(0x8a03e4+i*16+13,'B',light)
        write(0x895da8,'I',4 if case['fog'] else 0);write(0x64f470,'I',2)
        write(0x89d1ec,'HH',case['center']['x']&65535,case['center']['y']&65535)
        write(0x89d1fa,'H',case['heading'])
        call(0x4206e0,width,height)
        assert rgba_hash(cpu.mem_read(full,width*height))==case['terrainHash'],('browser terrain',case['name'])
        if width <= 256 and height <= 256:
            call(0x420100,width,height)
            pixels=b''.join(bytes(cpu.mem_read(wrapped+y*256,width)) for y in range(height))
        else:
            # Compatibility correction: preserve the already-compared native
            # camera scroll, but use dense rows beyond the old 256×256 buffer.
            original=bytes(cpu.mem_read(full,width*height))
            sx=(((((case['center']['x']>>8)&254)+128)&255)*width)>>8
            sy=height-((((((case['center']['y']>>8)&254)+128)&255)*height)>>8)
            pixels=b''.join(original[((y+sy)%height)*width+sx:((y+sy)%height+1)*width]+
                original[((y+sy)%height)*width:((y+sy)%height)*width+sx] for y in range(height))
        assert rgba_hash(pixels)==case['sourceHash'],('browser wrap',case['name'])
        texture_size=1<<max(width,height).bit_length();write(0x5d20f8,'I',texture_size)
        quad=[];call(0x41fce0,0,0,width,height)
        # Browser records the inverse of the matrix actually submitted to Canvas.
        a,b,c,d,e,f=case['transform']
        for x,y,u,v in quad:
            assert abs((a*x+c*y+e)/texture_size-u)<1e-6
            assert abs((b*x+d*y+f)/texture_size-v)<1e-6
    print(f'PASS: {len(browser_cases)} live-browser terrain RGBA hashes and Canvas transforms match complete native routines; wrapped RGBA matches original buffers at legacy sizes and dense-row compatibility beyond 256×256')
