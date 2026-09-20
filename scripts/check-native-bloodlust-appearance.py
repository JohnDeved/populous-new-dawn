"""Original Bloodlust-only render branch and isolated imported artwork check.

python -B scripts/check-native-bloodlust-appearance.py EXE --game-root GAME --output NEW_JSON [--evidence-only]

Executes004691ec..00469303 and original00476090 sprite scaling. Inputs are
post-person-render locals and status fields. Palette selection/draw submission
are intercepted, not a native GPU/gameplay replay. Writes only requested report.
"""
import argparse
import hashlib
import importlib.util
import json
import random
import struct
import subprocess
from pathlib import Path
from unicorn import UC_HOOK_CODE
from unicorn.x86_const import UC_X86_REG_EIP, UC_X86_REG_ESP
from decomp import ROOT, native_cpu


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument('exe', type=Path)
    ap.add_argument('--game-root', type=Path, required=True)
    ap.add_argument('--output', type=Path, required=True)
    ap.add_argument('--evidence-only', action='store_true')
    args = ap.parse_args()
    if args.output.exists():
        raise ValueError('Use a new output path to preserve earlier evidence')
    spec = importlib.util.spec_from_file_location('bloodlust_importer', ROOT / 'scripts/import-bloodlust.py')
    importer = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(importer)
    image, data = importer.decode(args.game_root)
    assert image == (ROOT / 'public/original/bloodlust.png').read_bytes()
    assert data == (ROOT / 'app/original-bloodlust.json').read_bytes()
    metadata = json.loads(data)
    raw = (args.game_root / 'data/hfx0-0.dat').read_bytes()
    cpu, identity = native_cpu(args.exe)
    cpu.mem_map(0x2000000, 0x100000)
    unit, camera, bank, stack = 0x2010000, 0x2020000, 0x2030000, 0x20fd000

    def write(address, fmt, *values):
        cpu.mem_write(address, struct.pack('<' + fmt, *values))

    def read(address, fmt):
        return struct.unpack('<' + fmt, cpu.mem_read(address, struct.calcsize('<' + fmt)))[0]

    # The relocated HFX table (unlike HSPR's sentinel slot) starts at index0;
    # reused check-native-hud-health.py relocates raw8+i*8 to entries+i*8.
    for i in range(struct.unpack_from('<I', raw, 4)[0]):
        w, h, ptr = struct.unpack_from('<HHI', raw, 8 + i * 8)
        write(bank + i * 8, 'IHH', ptr, w, h)
    write(0x59df14, 'I', bank)
    write(0x74a350, 'I', camera)
    draws = []

    def leaf(c, address, size, user):
        sp = c.reg_read(UC_X86_REG_ESP)
        if address != 0x516270:
            source = (read(sp + 12, 'I') - bank) // 8
            width = read(bank + source * 8 + 4, 'H') if address == 0x5162e0 else read(sp + 16, 'i')
            height = read(bank + source * 8 + 6, 'H') if address == 0x5162e0 else read(sp + 20, 'i')
            assert read(0x5da074, 'I') & 8
            draws.append(dict(source=source, x=read(sp+4,'i'), y=read(sp+8,'i'), width=width, height=height))
        c.reg_write(UC_X86_REG_EIP, read(sp, 'I'))
        c.reg_write(UC_X86_REG_ESP, sp + 4)

    for address in (0x516270, 0x5162e0, 0x516430):
        cpu.hook_add(UC_HOOK_CODE, leaf, begin=address, end=address)
    views = json.loads((ROOT / 'app/original-camera.json').read_text())['views']
    rng = random.Random(0x4691ec)
    cases, results = [], []
    for i in range(1600):
        view = views[i % len(views)]
        remaining = [0, 8, 120, 128, 1440][i % 5]
        case = dict(remaining=remaining, counter=(i // 5) % 4, animationFrame=(i // 20) % 40,
                    frameHeight=rng.choice([0, 1, 25, 36, 43, 128, 256]), scaled=bool(i & 1),
                    bucket=rng.choice([1, 1000, 1791, 1792, 2500, 3585]), view=view)
        write(unit + 0x14, 'I', 0x80000 if remaining else 0)
        write(unit + 0xb1, 'B', remaining // 8)
        write(unit + 0x2e, 'B', case['counter'])
        write(stack + 0x18, 'iiii', 0, 0, unit, case['frameHeight'])
        write(stack + 0x3c, 'I', int(case['scaled']))
        write(camera + 0x2a, 'i', view['scale'])
        write(0x87ca6c, 'ii', view['spriteScale'], view['shamanScale'])
        write(0x89c669, 'I', 0x100 if case['scaled'] else 0)
        write(0x89bc86, 'i', case['bucket'])
        write(0x897981, 'I', case['animationFrame'])
        write(0x5da074, 'I', 0)
        cpu.reg_write(UC_X86_REG_ESP, stack)
        draws.clear()
        cpu.emu_start(0x4691ec, 0x469303, timeout=100000, count=20000)
        assert cpu.reg_read(UC_X86_REG_EIP) == 0x469303
        assert len(draws) <= 1
        result = draws[0].copy() if draws else None
        if result:
            assert result['source'] == 1478 + case['animationFrame'] % 10
            assert result['y'] == -(case['frameHeight'] * 40 // 36)
        cases.append(case)
        results.append(result)
    if not args.evidence_only:
        js = """import {bloodlustOverlay} from './app/bloodlust-appearance.ts';let s='';
        for await(const c of process.stdin)s+=c;
        console.log(JSON.stringify(JSON.parse(s).map(c=>bloodlustOverlay(c,c.view))));"""
        actual = json.loads(subprocess.check_output(['node','--input-type=module','-e',js],
            input=json.dumps(cases).encode(),cwd=ROOT))
        assert actual == results
    report = dict(status='PASS', identity=identity, nativeCases=len(cases), frames=metadata['frames'],
        pngSHA256=metadata['pngSHA256'], branchStart='004691ec', branchEnd='00469303',
        cases=cases, expected=results,
        limits='Supplied post-person-render locals/status and palette/draw leaves; original gate/frame/anchor/scaling execute; no full native GPU/world replay.')
    args.output.parent.mkdir(parents=True,exist_ok=True)
    args.output.write_text(json.dumps(report,indent=2)+'\n')
    print(json.dumps({k:report[k] for k in ['status','nativeCases','pngSHA256','branchStart','branchEnd','limits']},indent=2))


if __name__ == '__main__':
    main()
