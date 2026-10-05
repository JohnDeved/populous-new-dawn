"""Bounded original allocation/list-block proof for two phase-ready ordinary gifts.

Usage: python scripts/probe-native-worship-grant-request-order.py EXE --output DIRECTORY
No fixture, imported asset, browser, original OS, or gameplay source is changed.
Output preserves every native state row; this is not a browser parity checker.
"""
import argparse
import hashlib
import json
import struct
import time
from pathlib import Path

from unicorn import UC_HOOK_CODE, UC_HOOK_MEM_WRITE
from unicorn.x86_const import UC_X86_REG_EAX, UC_X86_REG_EIP, UC_X86_REG_ESP, UC_X86_REG_ECX
from decomp import ROOT, configure_native_constants, native_cpu

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('executable', type=Path)
parser.add_argument('--output', type=Path, required=True)
args = parser.parse_args()
started = time.monotonic()
cpu, identity = native_cpu(args.executable)
configure_native_constants(cpu, args.executable)
cpu.mem_map(0x2000000, 0x100000)
unit, glow, rect, entries = 0x2000000, 0x2000100, 0x2000200, 0x2010000
stack, stop, controller = 0x20fd000, 0x20fe000, 0x98c5a8
palette, companion = 0x2020000, 0x988a88
events, cases, calls, asset_bytes = [], [], [], []
requests, rng_writes = [], []
active_request = None
inside_visit_block = False
current_case = 'panel construction'


def write(address, fmt, *values):
    cpu.mem_write(address, struct.pack('<' + fmt, *values))


def read(address, fmt):
    return struct.unpack('<' + fmt, cpu.mem_read(address, struct.calcsize('<' + fmt)))[0]


def ret(value=0, popped=0):
    sp = cpu.reg_read(UC_X86_REG_ESP)
    cpu.reg_write(UC_X86_REG_EAX, value)
    cpu.reg_write(UC_X86_REG_EIP, read(sp, 'I'))
    cpu.reg_write(UC_X86_REG_ESP, sp + 4 + popped)


constant_bytes = []
constants = json.loads((ROOT / 'app/original-constants.json').read_text())
for index in range(512):
    descriptor = bytes(cpu.mem_read(0x5aa5f0 + index * 31, 31))
    name = descriptor[:25].split(b'\0')[0].decode('ascii')
    if not name:
        break
    if name in constants:
        address = struct.unpack('<I', descriptor[27:])[0]
        constant_bytes.append((address, bytes(cpu.mem_read(address, descriptor[25]))))

search = (args.executable.parent / 'data/mwsearch.dat').read_bytes()
assert hashlib.sha256(search).hexdigest() == '0c39b12d160658863c2df89aa34484dff459e48ea0b5634658b7473ca940fae0'
cpu.mem_write(0x8929cd, search)
pe_bytes = args.executable.read_bytes()
pe_offset = struct.unpack_from('<I', pe_bytes, 60)[0]
section_count = struct.unpack_from('<H', pe_bytes, pe_offset + 6)[0]
optional_size = struct.unpack_from('<H', pe_bytes, pe_offset + 20)[0]
readonly_bytes = []
for index in range(section_count):
    entry = pe_offset + 24 + optional_size + index * 40
    name, virtual_size, virtual_address, raw_size = struct.unpack_from('<8sIII', pe_bytes, entry)
    flags = struct.unpack_from('<I', pe_bytes, entry + 36)[0]
    if flags & 0x40000000 and not flags & 0x80000000:
        address, length = 0x400000 + virtual_address, max(virtual_size, raw_size)
        readonly_bytes.append((address, bytes(cpu.mem_read(address, length))))


def guard():
    assert bytes(cpu.mem_read(0x8929cd, len(search))) == search, 'mapped search changed'
    for address, expected in readonly_bytes:
        assert bytes(cpu.mem_read(address, len(expected))) == expected, ('read-only PE section', hex(address))
    for address, expected in constant_bytes:
        assert bytes(cpu.mem_read(address, len(expected))) == expected, hex(address)
    for address, expected in asset_bytes:
        assert bytes(cpu.mem_read(address, len(expected))) == expected, ('asset changed', hex(address))


def call(address, *values, until=stop):
    guard()
    write(stack, 'I' * (len(values) + 1), stop, *values)
    cpu.reg_write(UC_X86_REG_ESP, stack)
    try:
        cpu.emu_start(address, until, timeout=100000, count=200000)
    except Exception as error:
        raise AssertionError((current_case, hex(address), hex(cpu.reg_read(UC_X86_REG_EIP)), events[-12:])) from error
    assert cpu.reg_read(UC_X86_REG_EIP) == until, (current_case, hex(address), hex(cpu.reg_read(UC_X86_REG_EIP)))
    guard()
    calls.append(dict(entry=f'{address:08x}', stopExclusive=f'{until:08x}', case=current_case))
    return cpu.reg_read(UC_X86_REG_EAX)


def hook(c, address, size, user):
    global active_request
    sp = c.reg_read(UC_X86_REG_ESP)
    arg = read(sp + 4, 'I')
    if address in leaves:
        events.append(['intercept',f'{address:08x}',active_request])
    if address == 0x516270:
        if arg == 0x974560:
            events.append(['palette', 'ghost', None])
        else:
            assert (arg-0x87f000)%4096 == 0, hex(arg)
            consumed = arg+0x2f82
            assert 0x87f000 <= consumed < 0x88f000, hex(consumed)
            index = read(consumed,'B')
            assert index == alpha[consumed-0x87f000]
            assert read(palette+index*4,'I') == struct.unpack_from('<I',pal,index*4)[0]
            events.append(['palette',(arg-0x87f000)//4096,index])
        return  # Execute the real palette selection and RGB conversion.
    if address in observed_entries:
        if address == 0x481550:
            active_request = read(arg+0x24, 'H')
        entry = ['entered', f'{address:08x}', active_request]
        if address in (0x4ed700, 0x4fa8f0, 0x4facf0, 0x481550):
            entry.extend([read(arg+0x24,'H'), read(arg+0x74,'I')])
        events.append(entry)
        if address == 0x481591 and inside_visit_block:
            requests.append(dict(handle=active_request, eventIndex=len(events),
                                 state=request_state()))
        return  # Observation only; every original instruction still executes.
    if address == 0x48a050:
        events.append(['sound', read(sp + 8, 'I'), active_request])
    elif address == 0x44b770:
        # Supplied landscape bounds, same as the viewport fixture. Exact fallback
        # choice/midpoint arithmetic still execute in 00481900.
        for index, value in enumerate((100, 0, 640, 480)):
            write(read(sp + 4 + index * 4, 'I'), 'i', value)
    elif address == 0x44b130:
        events.append(['panel-refresh', read(0x5cae8c, 'I')])
    elif address == 0x479f00:
        events.append(['display-request', *struct.unpack('<3I', c.mem_read(sp + 4, 12))])
    elif address == 0x5162e0:
        frame = (read(sp + 12, 'I') - entries) // 8
        table = read(0x5da0e8, 'I')
        if table == 0x974560:
            selection, rgb = 'ghost', 0xffffff
        else:
            assert (table-0x87f000)%4096 == 0, hex(table)
            assert 0x87f000 <= table+0x2f82 < 0x88f000, hex(table)
            selection = (table-0x87f000)//4096
            index = read(table+0x2f82, 'B')
            value = read(palette+index*4, 'I')
            rgb = ((value & 255)<<16) | (value & 0xff00) | ((value>>16)&255)
        assert read(0x5da0e0, 'I') == rgb, 'real palette consumer differs'
        events.append(['sprite', frame, read(sp+4,'i'), read(sp+8,'i'), selection, rgb, read(0x5da074,'I')])
    elif address == 0x47e070:
        # Real 00484870 emits thiscall(this, x, y, bank, frame, flags, radians, scale).
        # The native callee's ret 0x1c owns exactly seven stack arguments.
        raw = bytes(c.mem_read(sp+4, 28))
        x, y, bank, frame, flags, angle, scale = struct.unpack('<ffIIIff', raw)
        events.append(['spell-raster', x, y, bank, frame & 65535, flags, angle, scale, c.reg_read(UC_X86_REG_ECX), raw.hex()])
        ret(popped=28)
        return
    elif address == 0x4ffae0:
        events.append(['clip', list(struct.unpack('<4i', c.mem_read(arg,16))) if arg else None])
    elif address == 0x4811a0:
        events.append(['arrival-ui', read(sp + 4, 'i'), read(sp + 8, 'i')])
    ret()


leaves = [0x48a050, 0x48a810, 0x44b770, 0x44b130, 0x479f00,
          0x5162e0, 0x47e070, 0x4ffae0, 0x4811a0]
observed_entries = [0x481550, 0x4841b0, 0x481490, 0x481900, 0x484320, 0x516270,
    0x480ea0, 0x482290, 0x44bb30, 0x44be00, 0x4ed8a0, 0x4ed580,
    0x4fa530, 0x4faaf0, 0x4ed640, 0x4fa7f0, 0x4ed700, 0x4fa8f0, 0x4facf0, 0x481591]
for address in leaves + observed_entries:
    cpu.hook_add(UC_HOOK_CODE, hook, begin=address, end=address)

raw_hfx = (args.executable.parent / 'data/hfx0-0.dat').read_bytes()
assert hashlib.sha256(raw_hfx).hexdigest() == json.loads((ROOT / 'app/original-hud.json').read_text())['sha256']['data/hfx0-0.dat']
for index in range(struct.unpack_from('<I', raw_hfx, 4)[0]):
    width, height, pointer = struct.unpack_from('<HHI', raw_hfx, 8 + index * 8)
    write(entries + index * 8, 'IHH', pointer, width, height)
write(0x59df14, 'I', entries)
provenance = json.loads((ROOT/'app/original-hud.json').read_text())['sha256']
pal = (args.executable.parent/'data/pal0-c.dat').read_bytes()
alpha = (args.executable.parent/'data/al0-c.dat').read_bytes()
assert len(pal) == 1024 and len(alpha) == 65536
cpu.mem_write(palette, pal)
cpu.mem_write(0x87f000, alpha)
write(0x87eff8, 'I', palette)
asset_bytes.extend([(palette,pal),(0x87f000,alpha),(entries,bytes(cpu.mem_read(entries,struct.unpack_from('<I',raw_hfx,4)[0]*8)))])
asset_hashes = {name:hashlib.sha256(raw).hexdigest() for name,raw in [('data/hfx0-0.dat',raw_hfx),('data/pal0-c.dat',pal),('data/al0-c.dat',alpha)]}
assert all(provenance[name]==digest for name,digest in asset_hashes.items())
source_assets=json.loads((ROOT/'app/original-effects.json').read_text())
assert {row['source'] for row in source_assets['animations']['sparkle']} >= set(range(1288,1294))
assert {row['source'] for row in source_assets['animations']['hit']} == set(range(1294,1300))

# Construct a real spell panel from the original executable descriptors. Its
# root occupies the native spell slot, after the already occupied main panel.
cpu.mem_write(0x684210, bytes(0x9000))
write(0x684210, 'I', 1)
write(0x68425e + 0x3e + 0x2e, 'I', 1)
write(0x89c6cf, 'HH', 640, 480)
write(0x68450c, 'ii', 300, 300)
write(0x89c6f0, 'B', 0)
write(0x89d1c8 + 0xc22, 'B', 0)
write(0x96070a, 'I', (1 << 3) | (1 << 4) | (1 << 12))
write(0x5d4678, 'I', 1)
root_slot = call(0x44c650, 2) & 65535
assert root_slot == 2, root_slot
panel_rects = {}
for model in (3, 4, 12):
    result = call(0x44be00, rect, model)
    assert result == rect
    values = list(struct.unpack('<4i', cpu.mem_read(rect, 16)))
    assert values[2] > values[0] and values[3] > values[1], (model, values)
    panel_rects[model] = values


def reset(seed, visible=True, model=12):
    global events, active_request
    events=[]
    active_request=None
    cpu.mem_write(0x985b48, bytes(0x6ae1))
    cpu.mem_write(unit, bytes(256))
    write(unit+0x24,'H',900)
    write(unit+0x2a,'3B',6,2,255)
    write(unit+0x35,'H',1 if visible else 0)
    write(unit+0x68,'2h',420,180)
    write(unit+0x74,'I',model)
    write(unit+0x7a,'h',76)
    write(unit+0x7c,'B',11)
    write(unit+0x7e,'3B',0,0,3)
    write(0x890390+900*4,'I',unit)
    write(0x88f026,'4h',100,0,540,480)
    write(0x89c661,'I',0)
    write(0x88f000,'B',2)
    write(0x96ead4,'B',0)
    write(0x89bc72,'I',seed)
    write(0x89d178,'I',0xaabbccdd)
    call(0x516270,0x974560)
    guard()


def request_state():
    return dict(savedHandle=read(controller+0x69,'H'), savedModel=read(controller+0x80,'B'),
        source=list(struct.unpack('<2h',cpu.mem_read(controller,4))),
        target=list(struct.unpack('<2h',cpu.mem_read(controller+0x6b,4))),
        companionSource=list(struct.unpack('<2h',cpu.mem_read(companion,4))),
        spellVisits=read(controller+4,'I'), companionVisits=read(companion+4,'I'),
        cosmeticRng=read(0x89bc72,'I'), gameplayRng=read(0x89d178,'I'),
        pulse=bytes(cpu.mem_read(0x988a68,25)).hex(), pulseActive=read(0x988a76,'B'))


def record_rng_write(c, access, address, size, value, user):
    rng_writes.append(dict(address=f'{address:08x}', size=size, value=value,
                          instruction=f'{c.reg_read(UC_X86_REG_EIP):08x}'))


for address in (0x89bc72, 0x89d178):
    cpu.hook_add(UC_HOOK_MEM_WRITE, record_rng_write, begin=address, end=address+3)


first, second, point, settings = 0x2000400, 0x2000500, 0x2000600, 0x2000700
visit_start, visit_end = 0x4ec898, 0x4ec8cb


def ready_pair(models, handles):
    # Supply free storage only. Original allocation links/unlinks the list and
    # original class initialization selects state 4; neither is intercepted.
    cpu.mem_write(0x8a03e4, bytes(0x40000))
    for address in (0x89031c,0x890320,0x890324,0x89c651,0x89c659,0x89d180):
        write(address,'I',0)
    write(0x89ce37,'B',0)
    write(0x96eac7,'B',0)
    for pointer, handle in zip((first,second),handles):
        cpu.mem_write(pointer,bytes(256))
        write(pointer+0x24,'H',handle)
        write(0x890390+handle*4,'I',pointer)
    write(first+4,'I',second)
    write(second,'I',first)
    write(0x89031c,'I',first)
    allocation_rows=[]
    for index, (pointer, model) in enumerate(zip((first,second),models)):
        write(point,'HHh',768+index*1024,57088,0)
        # Original one-shot 20-byte settings stack: class 11, spell model,
        # grant mode 3, ordinary variant 0. Native allocator consumes this.
        write(settings,'5I',11,model,3,0,0)
        write(0x892443,'I',settings+20)
        write(0x89243a,'B',1)
        assert call(0x4ed8a0,6,2,255,point)==pointer
        assert read(pointer+0x2c,'B')==4
        assert read(pointer+0x74,'I')==model and read(pointer+0x7c,'B')==11
        assert read(pointer+0x7d,'B')==0 and read(pointer+0x80,'B')==3
        assert read(0x892443,'I')==settings and read(0x89243a,'B')==0
        allocation_rows.append(dict(handle=read(pointer+0x24,'H'), model=model,
            listHead=read(0x890324,'I'), previous=read(pointer,'I'),
            next=read(pointer+4,'I'), state=read(pointer+0x2c,'B')))
        # Scope starts at the already initialized, ordinary phase-ready gift.
        # Renderer coordinates and these timer fields do not alter list links.
        write(pointer+0x2d,'B',1)
        write(pointer+0x35,'H',read(pointer+0x35,'H')|1)
        write(pointer+0x68,'2h',420-index*170,180+index*120)
        write(pointer+0x7a,'h',77)
        write(pointer+0x7e,'2B',0,1)
        write(0x96071e+model,'B',0)
    assert read(0x890324,'I')==second
    assert read(second,'I')==0 and read(second+4,'I')==first
    assert read(first,'I')==second and read(first+4,'I')==0
    assert read(0x89031c,'I')==0
    return allocation_rows


status='failed'
try:
    for models in ((12,3),(3,12)):
        for handles in ((900,902),(902,900)):
            for active_pulse in (False,True):
                current_case=f'models-{models[0]}-{models[1]}-handles-{handles[0]}-{handles[1]}-pulse-{int(active_pulse)}'
                reset(1,True,4)
                warmup=[]
                if active_pulse:
                    call(0x481550,unit)
                    for visit in range(26):
                        call(0x480ea0,0)
                        warmup.append(request_state())
                    assert read(0x988a76,'B')==1
                allocation_rows=ready_pair(models,handles)
                before=request_state()
                event_start=len(events)
                rng_writes.clear()
                requests.clear()
                inside_visit_block=True
                # This exact source block loads the allocator-owned head and
                # follows +4 links. It executes the real dispatch/handoff calls.
                # The unrelated outer world/AI/save prologue and tail are excluded.
                call(visit_start,until=visit_end)
                inside_visit_block=False
                after=request_state()
                block_events=events[event_start:]
                expected_order=list(reversed(handles))
                assert [row['handle'] for row in requests]==expected_order
                visits=[e[3] for e in block_events if e[:2]==['entered','004ed700']]
                assert visits==expected_order
                for entry in ('004fa8f0','004facf0','00481550'):
                    assert [e[3] for e in block_events if e[:2]==['entered',entry]]==expected_order
                for row, index in zip(requests,(1,0)):
                    native=row['state']
                    assert (native['savedHandle'],native['savedModel'])==(handles[index],models[index])
                    origin=[420-index*170,180+index*120]
                    rectangle=panel_rects[models[index]]
                    assert native['source']==native['companionSource']==origin
                    assert native['target']==[(rectangle[0]+rectangle[2])//2,(rectangle[1]+rectangle[3])//2]
                    assert native['spellVisits']==native['companionVisits']==0
                    assert native['pulse']==before['pulse']
                    assert native['cosmeticRng']==before['cosmeticRng']
                    assert native['gameplayRng']==before['gameplayRng']
                for entry in ('0044bb30','0044be00','004841b0','00481490'):
                    assert [e[2] for e in block_events if e[:2]==['entered',entry]]==expected_order
                assert [e for e in block_events if e[0]=='sound']==[['sound',0x71,h] for h in expected_order]
                assert not any(e[:2] in (['entered','00480ea0'],['entered','00482290'],['entered','00484320']) for e in block_events)
                assert not rng_writes, rng_writes
                assert after['savedHandle']==handles[0] and after['savedModel']==models[0]
                assert after['pulse']==before['pulse'] and bool(after['pulseActive'])==active_pulse
                gifts=[]
                for pointer in (first,second):
                    assert read(pointer+0x7a,'h')==76 and read(pointer+0x7f,'B')==0
                    assert read(0x96071e+read(pointer+0x74,'I'),'B')==0
                    gifts.append(dict(handle=read(pointer+0x24,'H'),remaining=76,phase=0,
                                      classCounter=read(pointer+0x2e,'B')))
                assert read(0x89c669,'I')&0x40==0
                cases.append(dict(name=current_case,models=models,handles=handles,activePulse=active_pulse,
                    allocations=allocation_rows,warmup=warmup,setupEvents=events[:event_start],before=before,requests=list(requests),
                    after=after,gifts=gifts,events=block_events,rngWrites=list(rng_writes)))
                print(current_case,'requests',expected_order,'winner',after['savedHandle'],'zero intervening UI/RNG')
    status='passed'
    print('PASS: eight original allocation/list-block compositions; newest-first handoffs, oldest ready gift wins')
finally:
    guard()
    args.output.mkdir(parents=True,exist_ok=True)
    result=dict(status=status,executable=identity,probeSha256=hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),
        assetHashes=asset_hashes,calls=calls,elapsedSeconds=time.monotonic()-started,cases=cases,currentCase=current_case,
        constantsGuarded=len(constant_bytes),readonlyRegionsGuarded=[dict(address=f'{a:08x}',bytes=len(b),sha256=hashlib.sha256(b).hexdigest()) for a,b in readonly_bytes],
        assetsGuarded=[dict(address=f'{a:08x}',bytes=len(b),sha256=hashlib.sha256(b).hexdigest()) for a,b in asset_bytes],
        searchSha256=hashlib.sha256(search).hexdigest(),intercepted=[f'{a:08x}' for a in leaves],
        observed=[f'{a:08x}' for a in observed_entries],nativeTraversal=dict(start=f'{visit_start:08x}',stopExclusive=f'{visit_end:08x}'),
        limits=['Executes only original primary-list traversal block; outer world/AI/save prologue and tail excluded.',
                'Supplied free storage, flat terrain, model settings and phase-ready timer/recipient/render state; no natural simultaneous worship completion claim.',
                'Original allocator, initialization, list traversal, dispatch and both handoffs execute without gameplay-owning intercepts.',
                'Prior active pulse is produced through original UI visits before both gifts; no UI visits occur between the ready handoffs.',
                'Existing presentation device/raster/viewport/panel-refresh boundaries remain supplied; no original wall-clock or GPU pixel claim.',
                'No runtime implementation, stock payout timing extension or parity credit.'])
    (args.output/'probe-result.json').write_text(json.dumps(result,indent=2)+'\n')
