#!/usr/bin/env python3
"""Verify supplied original selector layout without executing the executable."""
import argparse
import hashlib
import importlib.util
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]

def decode_layout(data):
    decoded = bytes((~(value ^ (1 << ((i - 3) & 7)))) & 255 for i, value in enumerate(data))
    worlds = []
    for line in decoded.decode('ascii').splitlines():
        if not line.strip() or line.startswith('#'):
            continue
        index, radius, parent, orbit, angle, velocity, mission = map(float, line.split())
        worlds.append(dict(index=int(index), radius=radius, parent=int(parent),
                           orbitRadius=orbit, startAngle=angle,
                           angularVelocity=velocity, mission=int(mission)))
    return worlds

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('executable', type=Path)
    args = parser.parse_args()
    spec = importlib.util.spec_from_file_location('pe', ROOT / 'scripts/check-static-mission18-sky.py')
    reader = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(reader)
    pe = reader.PE32(args.executable)
    # Exact pinned x86 consumers. Ghidra exports are supporting interpretation,
    # not original source, a native runtime capture, or a browser pixel oracle.
    assert pe.read(0x411ea0, 5).hex() == '68089b5900'  # data/plsspace.spr
    assert pe.read(0x41fb40, 5).hex() == '686cbd5900'  # data/plsbackg.dat
    assert pe.cstr(0x599b3c) == 'plsdata.dat'
    assert pe.cstr(0x599b50) == 'data/plstx%03d.dat'
    assert pe.cstr(0x599b8c) == 'data/plspl0-%c.dat'
    raw = (args.executable.parent / 'data/plsdata.dat').read_bytes()
    worlds = decode_layout(raw)
    source = (ROOT / 'app/world-selector-data.ts').read_text()
    checked_in = json.loads(source.split('readonly SelectorWorld[] = ', 1)[1].split('\n\nexport const', 1)[0])
    assert worlds == checked_in, 'Selector layout drifted from original data'
    assert len(worlds) == 25
    assert [worlds[i]['mission'] for i in (24,23,22)] == [1,2,3]
    print(json.dumps({'status':'passed', 'executableSha256':hashlib.sha256(pe.data).hexdigest(),
                      'layoutSha256':hashlib.sha256(raw).hexdigest(), 'worlds':len(worlds),
                      'limits':['Static bytes and authored layout; no original executable session',
                                'Browser projection, artwork, unlock producer and interactions require separate checks']}, indent=2))

if __name__ == '__main__':
    main()
