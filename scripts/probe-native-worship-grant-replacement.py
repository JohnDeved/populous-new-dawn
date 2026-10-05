"""Bounded dynamic second-gift replacement extension of accepted handoff proofs.

Usage: python scripts/probe-native-worship-grant-replacement.py EXE --output DIRECTORY
No fixture, imported asset, browser, original OS, or gameplay source is changed.
Output preserves every native state row; this is not a browser parity checker.
"""
import argparse
import hashlib
import json
import struct
import time
from pathlib import Path

from unicorn import UC_HOOK_CODE
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
glow_failure = False
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


def call(address, *values):
    guard()
    write(stack, 'I' * (len(values) + 1), stop, *values)
    cpu.reg_write(UC_X86_REG_ESP, stack)
    try:
        cpu.emu_start(address, stop, timeout=100000, count=200000)
    except Exception as error:
        raise AssertionError((current_case, hex(address), hex(cpu.reg_read(UC_X86_REG_EIP)), events[-12:])) from error
    assert cpu.reg_read(UC_X86_REG_EIP) == stop, (current_case, hex(address), hex(cpu.reg_read(UC_X86_REG_EIP)))
    guard()
    return cpu.reg_read(UC_X86_REG_EAX)


def hook(c, address, size, user):
    sp = c.reg_read(UC_X86_REG_ESP)
    arg = read(sp + 4, 'I')
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
    if address in (0x481550, 0x4841b0, 0x481490, 0x481900, 0x484320):
        events.append(['entered', f'{address:08x}'])
        return
    if address == 0x4ed8a0:
        values = list(struct.unpack('<4I', c.mem_read(sp + 4, 16)))
        assert values[:3] == [6, 8, 255], values
        events.append(['allocate-glow', not glow_failure])
        if glow_failure:
            ret(0)
            return
        c.mem_write(glow, bytes(256))
        write(glow + 0x24, 'H', 901)
        write(glow + 0x2a, 'BBB', 6, 8, 255)
        c.mem_write(glow + 0x3d, bytes(c.mem_read(values[3], 6)))
        write(0x890390 + 901 * 4, 'I', glow)
        ret(glow)
        return
    if address in (0x4edcf0, 0x4ef180):
        events.append(['remove-reward', read(arg+0x24,'H')])
        write(arg + 0x2a, 'B', 0)
    elif address == 0x48a050:
        events.append(['sound', read(sp + 8, 'I')])
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
          0x5162e0, 0x47e070, 0x4ffae0, 0x4811a0, 0x4ef180]
observed_entries = [0x481550, 0x4841b0, 0x481490, 0x481900, 0x484320, 0x516270]
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
    global events
    events=[]
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


def state():
    particles=bytes(cpu.mem_read(companion+0x67,200*18))
    motion=bytearray(particles)
    for index in range(200):motion[index*18+14]=0
    live=[struct.unpack_from('<6hH2BbB',particles,index*18) for index in range(200)]
    return dict(companionActive=read(companion+0xe,'B'), companionStep=read(companion+0xf,'h'),
        companionVisits=read(companion+4,'I'), companionNext=read(companion+0x13,'B'),
        activeParticles=sum(row[6]!=0 for row in live), particlesSha256=hashlib.sha256(particles).hexdigest(),
        particleMotionSha256=hashlib.sha256(motion).hexdigest(),
        particleFrames=[row[7] for row in live], cosmeticRng=read(0x89bc72,'I'),gameplayRng=read(0x89d178,'I'),
        spellActive=read(controller+0xe,'B'),spellStep=read(controller+0xf,'h'),spellVisits=read(controller+4,'I'),
        spellPosition=list(struct.unpack('<2h',cpu.mem_read(controller+0x61,4))),
        spellRotation=read(controller+0x6f,'h'),spellScale=read(controller+0x73,'h'),
        remaining=read(unit+0x7a,'h'),pulseActive=read(0x988a76,'B'),pulseFrame=read(0x988a77,'h'),
        pulseRemaining=read(0x988a7d,'h'),limiter=read(0x96ead4,'B'))


def run(name, seed, combined=False, model=12, visible=True, pause_before=None):
    global current_case,events
    current_case=name
    reset(seed,visible,model)
    call(0x481550 if combined else 0x481490,unit)
    rows=[]
    for visit in range(1,61):
        if visit==pause_before:
            write(0x89c661,'I',2)
            for paused_visit in range(3):
                begin=len(events)
                call(0x480ea0,0)
                rows.append(dict(paused=True,state=state(),events=events[begin:]))
            write(0x89c661,'I',0)
        begin=len(events)
        call(0x480ea0,0)
        row=state()
        assert row['gameplayRng']==0xaabbccdd
        assert row['companionStep'] in (1,2,3)
        rows.append(dict(paused=False,state=row,events=events[begin:]))
        if not (row['companionActive'] or row['spellActive'] or row['pulseActive']):break
    assert not any(row[k] for k in ('companionActive','spellActive','pulseActive')), (name,'presentation did not retire')
    assert row['limiter']==0, (name,'limiter leaked')
    sprites=[e for r in rows for e in r['events'] if e[0]=='sprite']
    assert any(1288<=e[1]<=1293 for e in sprites) and any(1294<=e[1]<=1299 for e in sprites)
    assert row['cosmeticRng']!=seed
    paused=[r['state'] for r in rows if r['paused']]
    if paused:
        for field in ('companionStep','companionVisits','activeParticles','particleMotionSha256','cosmeticRng'):
            assert len({r[field] for r in paused})==1, (name,'paused field changed',field)
        assert all(r['gameplayRng']==0xaabbccdd for r in paused)
        if pause_before==4:
            assert len({r['particlesSha256'] for r in paused})==3, 'paused sprite frame consumer must still advance'
    spell_draws=[e for r in rows for e in r['events'] if e[0]=='spell-raster']
    if combined:
        assert spell_draws and all(e[4]==read(0x5a80de+model*62,'H') for e in spell_draws)
        assert row['remaining']==1
        for r in rows:
            for e in r['events']:
                if e[0]=='spell-raster':
                    assert e[1:3]==r['state']['spellPosition']
                    assert abs(e[7]-r['state']['spellScale']*read(0x58f578,'f'))<1e-6
                    assert abs(e[6]-r['state']['spellRotation']*read(0x58f580,'d'))<1e-6
    else:assert not spell_draws and row['remaining']==76
    cases.append(dict(name=name,seed=seed,combined=combined,model=model,visible=visible,
                      pauseBefore=pause_before,rows=rows,summary=dict(uiVisits=len(rows),spriteCalls=len(sprites),spellCalls=len(spell_draws),final=row)))
    print(name,'UI visits',len(rows),'sprites',len(sprites),'spell calls',len(spell_draws),'final cosmetic RNG',hex(row['cosmeticRng']))


second=0x2000300


def replacement_state():
    return dict(ui=state(),savedHandle=read(controller+0x69,'H'),savedModel=read(controller+0x80,'B'),
        firstRemaining=read(unit+0x7a,'h'),secondRemaining=read(second+0x7a,'h'),
        firstClass=read(unit+0x2a,'B'),secondClass=read(second+0x2a,'B'),
        bridgeStockAndGifts=read(0x96071e+12,'B'),lightningStockAndGifts=read(0x96071e+3,'B'),
        pulse=bytes(cpu.mem_read(0x988a68,25)).hex())


status='failed'
try:
    for replacement_visit in (10,26,30):
        current_case=f'bridge-replaced-at-{replacement_visit}'
        reset(1,True,12)
        write(unit+0x2d,'B',1)  # Existing reward already completed visual initialization.
        write(0x96071e+12,'B',0)
        write(0x96071e+3,'B',0)
        cpu.mem_write(second,bytes(256))
        call(0x481550,unit)
        before_rows=[]
        for visit in range(1,replacement_visit+1):
            call(0x480ea0,0)
            before_rows.append(replacement_state())
        before=replacement_state()
        old_timer=1 if replacement_visit==30 else 76
        assert before['firstRemaining']==old_timer
        assert bool(before['ui']['pulseActive']) == (replacement_visit!=10)
        assert before['savedHandle']==900 and before['savedModel']==12
        cpu.mem_write(second,bytes(cpu.mem_read(unit,256)))
        write(second+0x24,'H',902)
        write(second+0x74,'I',3)
        write(second+0x68,'2h',250,300)
        write(second+0x3d,'HHh',4864,63232,800)
        write(second+0x7a,'h',76)
        write(0x890390+902*4,'I',second)
        event_start=len(events)
        call(0x481550,second)
        after=replacement_state()
        assert (after['savedHandle'],after['savedModel'])==(902,3)
        assert after['ui']['spellPosition']==[0,0] and after['ui']['spellVisits']==0
        assert read(controller,'h')==250 and read(controller+2,'h')==300
        assert after['ui']['companionStep']==0 and after['ui']['companionVisits']==0
        assert after['firstRemaining']==old_timer and after['secondRemaining']==76
        assert after['pulse']==before['pulse'], 'handoff itself must not rewrite active pulse'
        assert after['bridgeStockAndGifts']==after['lightningStockAndGifts']==0
        first_next=None
        # Once the older reward has already arrived, its very next original
        # object visit must pay it even while the replacement controller lives.
        if old_timer==1:
            call(0x4facf0,unit)
            first_next=replacement_state()
            assert first_next['firstClass']==0 and first_next['bridgeStockAndGifts']==0x11
            assert first_next['savedHandle']==902 and first_next['secondRemaining']==76
            assert first_next['lightningStockAndGifts']==0
        after_rows=[]
        for visit in range(1,61):
            call(0x480ea0,0)
            row=replacement_state()
            after_rows.append(row)
            assert row['savedHandle']==902 and row['savedModel']==3
            assert row['firstRemaining']==(0 if old_timer==1 else old_timer)
            assert row['ui']['gameplayRng']==0xaabbccdd
            if not (row['ui']['companionActive'] or row['ui']['spellActive'] or row['ui']['pulseActive']):break
        assert not any(row['ui'][key] for key in ('companionActive','spellActive','pulseActive'))
        assert row['secondRemaining']==1 and row['lightningStockAndGifts']==0
        call(0x4facf0,second)
        second_next=replacement_state()
        assert second_next['secondClass']==0 and second_next['lightningStockAndGifts']==0x11
        if old_timer>1:
            assert second_next['bridgeStockAndGifts']==0
            for object_visit in range(1,77):
                call(0x4facf0,unit)
                assert read(0x96071e+12,'B')==(0 if object_visit<76 else 0x11)
            first_next=replacement_state()
        assert read(0x96071e+12,'B')==read(0x96071e+3,'B')==0x11
        assert events.count(['remove-reward',900])==1 and events.count(['remove-reward',902])==1
        call(0x480ea0,0)
        final=replacement_state()
        assert final['bridgeStockAndGifts']==final['lightningStockAndGifts']==0x11
        cases.append(dict(name=current_case,replacementVisit=replacement_visit,beforeRows=before_rows,
            before=before,immediatelyAfter=after,firstNextObject=first_next,secondUiRows=after_rows,
            secondNextObject=second_next,final=final,events=events[event_start:]))
        print(current_case,'old timer',old_timer,'new UI visits',len(after_rows),'both rewards granted exactly once')
    status='passed'
    print('PASS: three original singleton replacement cases, existing pulse preservation and both payout directions')
finally:
    args.output.mkdir(parents=True,exist_ok=True)
    result=dict(status=status,executable=identity,probeSha256=hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),
        assetHashes=asset_hashes,elapsedSeconds=time.monotonic()-started,cases=cases,currentCase=current_case,
        constantsGuarded=len(constant_bytes),readonlyRegionsGuarded=[dict(address=f'{a:08x}',bytes=len(b),sha256=hashlib.sha256(b).hexdigest()) for a,b in readonly_bytes],
        searchSha256=hashlib.sha256(search).hexdigest(),intercepted=[f'{a:08x}' for a in leaves],
        limits=['Separate native UI and object visits; no natural elapsed-time or original frame pacing execution.',
                'Direct second phase-zero handoff with a separate valid reward handle; ordinary head callback ordering is outside scope.',
                'Actual controllers/palette selection/raster arguments execute as in accepted presentation proof; raster/device boundaries remain supplied.',
                '004ef180 removal bookkeeping is supplied exactly as in accepted17-case handoff proof; stock/gift counters execute natively.',
                'No runtime implementation, GPU pixels, browser state or parity credit.'])
    (args.output/'probe-result.json').write_text(json.dumps(result,indent=2)+'\n')
