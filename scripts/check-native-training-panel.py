"""Capture kind-5 draw_ui_panel with real HFX dimensions and physical occupant slots.
Only palette setters and final line/rectangle/sprite consumers are supplied.
Usage: python scripts/check-native-training-panel.py /path/to/d3dpoptb.exe [--record]
"""
import hashlib, json, struct, subprocess, sys
from pathlib import Path
from unicorn import UC_HOOK_CODE
from unicorn.x86_const import UC_X86_REG_ESP, UC_X86_REG_EIP, UC_X86_REG_EAX
from decomp import native_cpu, configure_native_constants, ROOT

exe = Path(sys.argv[1]); cpu, identity = native_cpu(exe); configure_native_constants(cpu, exe)
cpu.mem_map(0x2000000, 0x100000)
panel, building, effect, entries, stack, stop = 0x2000000, 0x2001000, 0x2002000, 0x2010000, 0x20fd000, 0x20fe000
def write(a, f, *v): cpu.mem_write(a, struct.pack('<' + f, *v))
def read(a, f): return struct.unpack('<' + f, cpu.mem_read(a, struct.calcsize('<' + f)))[0]
def call(a, *args):
    write(stack, 'I' * (len(args) + 1), stop, *args); cpu.reg_write(UC_X86_REG_ESP, stack)
    cpu.emu_start(a, stop, count=100000)
    assert cpu.reg_read(UC_X86_REG_EIP) == stop, hex(cpu.reg_read(UC_X86_REG_EIP))
raw = (exe.parent / 'data/hfx0-0.dat').read_bytes()
hud = json.loads((ROOT / 'app/original-hud.json').read_text())
assert hashlib.sha256(raw).hexdigest() == hud['sha256']['data/hfx0-0.dat']
for i in range(struct.unpack_from('<I', raw, 4)[0]):
    w, h, p = struct.unpack_from('<HHI', raw, 8 + i * 8); write(entries + i * 8, 'IHH', p, w, h)
write(0x59df14, 'I', entries); write(0x890390 + 4, 'I', effect)
write(panel + 10, 'H', 1); write(effect + 0x70, 'B', 5)
write(building + 0x24, 'H', 2); write(building + 0x2a, 'BB', 2, 7)
write(0x89c6f4, '4B', 130, 172, 139, 228)
write(0x5da078, 'I', 0) # Hardware presentation path.
events = []; color = 0
def consume(cpu, a, size, user):
    global color
    sp = cpu.reg_read(UC_X86_REG_ESP)
    if a in (0x415f70, 0x4525d0): color = read(sp + 4, 'I') & 255
    elif a == 0x47d980:
        vertices = [struct.unpack('<2f8xI', cpu.mem_read(read(sp+i*4,'I'),20)) for i in range(1,5)]
        events.append(['fill',color,list(map(int,(*vertices[0][:2],*vertices[2][:2]))),vertices[0][2] >> 24])
    elif a == 0x5166c0: events.append(['line', color, list(struct.unpack('<4i', cpu.mem_read(sp + 4, 16)))])
    else:
        sprite = (read(sp + 12, 'I') - entries) // 8
        events.append(['sprite', sprite, read(sp + 4, 'i'), read(sp + 8, 'i'), color if a == 0x516370 else -1, bool(read(0x5da074, 'I') & 8)])
    cpu.reg_write(UC_X86_REG_EAX, 0); cpu.reg_write(UC_X86_REG_EIP, read(sp, 'I'))
    cpu.reg_write(UC_X86_REG_ESP, sp + (28 if a == 0x47d980 else 8 if a in (0x415f70, 0x4525d0) else 4))
for a in (0x415f70, 0x4525d0, 0x47d980, 0x5166c0, 0x5162e0, 0x516370):
    cpu.hook_add(UC_HOOK_CODE, consume, begin=a, end=a)

cases = []
for count in range(6):
    for cost in (0, 1, 480, 8192, 65535):
        for progress in sorted({0, cost // 3, cost, 65535}):
            for ejecting, warning, turn in ((False,False,0),(True,False,2),(True,True,4),(False,True,0)):
                c = dict(occupants=[dict(model=(2, 3, 7, 2, 3)[j], selected=j == 1) for j in range(count)], cost=cost, progress=progress,
                         active=cost > 0, ejecting=ejecting, warning=warning, turn=turn)
                cpu.mem_write(building + 0x86, bytes(12))
                # Holes in physical slots must not become gaps in the displayed row.
                for j, p in enumerate(c['occupants']):
                    address = 0x2003000 + j * 256; write(0x890390 + (10+j)*4, 'I', address)
                    write(address + 0x2a, 'BB', 1, p['model']); write(address + 0x7a, 'B', 128 if p['selected'] else 0)
                    write(building + 0x86 + ((j+1) % 6)*2, 'H', 10+j)
                write(building + 0xa6, 'B', count); write(building + 0x96, 'HHH', cost, progress, 0)
                write(building + 0x9c, 'H', (128 if c['active'] else 0) | (0x8000 if c['ejecting'] else 0))
                write(building + 0x14, 'I', 0x1000 if c['warning'] else 0)
                write(0x89d184, 'I', turn)
                cpu.reg_write(UC_X86_REG_ESP, stack); cpu.emu_start(0x4a470b, 0x4a472d, count=100)
                assert read(0x897987, 'B') == ((turn >> 1) & 1)
                assert read(0x897989, 'B') == ((turn >> 2) & 1)
                write(0x5da074, 'I', 0)
                events = []; call(0x504bc0, panel, building, 0, 0, panel+64, panel+66, 0, 0)
                c['expected'] = dict(width=read(panel+64,'H'), height=read(panel+66,'H'), events=events)
                cases.append(c)
fixture = dict(executableSha256=identity['sha256'], cases=cases)
if '--record' in sys.argv:
    (ROOT/'tests/fixtures/training-panel.json').write_text(json.dumps(fixture,separators=(',',':'))+'\n')
else:
    assert json.loads((ROOT/'tests/fixtures/training-panel.json').read_text()) == fixture
js = """import {trainingPanel} from './app/training-panel.ts'; let s='';for await(const c of process.stdin)s+=c;
console.log(JSON.stringify(JSON.parse(s).map(trainingPanel)));"""
actual = json.loads(subprocess.check_output(['node','--input-type=module','-e',js],input=json.dumps(cases).encode(),cwd=ROOT))
exact = 0
def charge(draw): return draw[0] == 'fill' and 222 <= draw[1] <= 239
for c, result in zip(cases, actual):
    if c['expected'] == result:
        exact += 1
        continue
    # Deliberate modern correction, confined to overflowing charge products.
    assert c['cost'] >= 8192 and c['active'] and (not c['warning'] or c['turn'] & 4)
    assert (result['width'], result['height']) == (c['expected']['width'], c['expected']['height'])
    assert [d for d in result['events'] if not charge(d)] == [d for d in c['expected']['events'] if not charge(d)]
    fills = [d for d in result['events'] if charge(d)]
    assert all(3 <= d[2][2] <= 117 for d in fills)
    assert fills[-1] == ['fill',222,[3,1,3+min(114,c['progress']*114//c['cost']),4],255]
print(f'PASS: {len(cases)} native training-panel calls; {exact} complete draw traces identical, {len(cases)-exact} confined to documented charge-overflow correction; native blink phases, real dimensions, physical slot holes and selection marks')

if '--browser' in sys.argv:
    import base64, importlib.util, io
    from PIL import Image, ImageDraw
    spec = importlib.util.spec_from_file_location('assets', ROOT/'scripts/import-original.py')
    assets = importlib.util.module_from_spec(spec); spec.loader.exec_module(assets)
    palette = (exe.parent/'data/pal0-c.dat').read_bytes()
    bank = assets.sprites(raw, palette)
    frames = json.loads(Path('/private/tmp/populous-training-panel-pixels.json').read_text())
    compared = 0
    for frame in frames:
        c = frame['state']; assert c in cases
        expected = Image.new('RGBA', (c['expected']['width'], c['expected']['height']))
        for event in c['expected']['events']:
            layer = Image.new('RGBA', expected.size)
            if event[0] == 'sprite':
                _, sprite, x, y, tint, faded = event
                w,h,data = bank[sprite]; data = bytearray(data)
                for at in range(0,len(data),4):
                    if tint >= 0: data[at:at+3] = palette[tint*4:tint*4+3]
                    if data[at+3]: data[at+3] = 85 if faded else 170 if sprite == 52 else 255
                layer.alpha_composite(Image.frombytes('RGBA',(w,h),bytes(data)), (x,y))
            else:
                kind,color,(left,top,right,bottom),*opacity = event
                if kind == 'line': right=max(left+1,right); bottom=max(top+1,bottom)
                if right <= left or bottom <= top: continue
                rgba=tuple(palette[color*4:color*4+3])+(opacity[0] if opacity else 255,)
                ImageDraw.Draw(layer).rectangle((left,top,right-1,bottom-1),fill=rgba)
            expected.alpha_composite(layer)
        actual = Image.open(io.BytesIO(base64.b64decode(frame['png']))).convert('RGBA')
        assert actual.size == expected.size
        # Canvas premultiplication can round a translucent color by one byte.
        differences = [abs(a-b) for a,b in zip(actual.tobytes(),expected.tobytes())]
        assert max(differences) <= 1, (c, max(differences))
        compared += actual.width*actual.height
    print(f'PASS: {len(frames)} browser canvases, {compared:,} RGBA pixels match source HFX and native draw submissions (one-byte alpha rounding tolerance)')
