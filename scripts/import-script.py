"""Import original mission PopScript bytecode without executing it.
Usage: python3 scripts/import-script.py /path/to/extracted/levels [mission]
"""
import hashlib
import json
from pathlib import Path
import struct
import sys

source = Path(sys.argv[1])
mission = int(sys.argv[2]) if len(sys.argv) > 2 else 1
suffix = {1: '', 2: '-two', 3: '-three', 4: '-four', 5: '-five', 6: '-six', 7: '-seven', 8: '-eight', 9: '-nine', 10: '-ten', 11: '-eleven', 12: '-twelve', 13: '-thirteen', 14: '-fourteen', 15: '-fifteen', 16: '-sixteen', 17: '-seventeen', 18: '-eighteen', 19: '-nineteen', 20: '-twenty', 21: '-twenty-one', 22: '-twenty-two', 23: '-twenty-three', 79: '-tutorial'}.get(mission)
if suffix is None:
    raise ValueError('Only recovered missions 1 through 23 and Tutorial 79 are supported')
header = (source / f'levl{2000 + mission:04}.hdr').read_bytes()
if len(header) != 616:
    raise ValueError('Expected a 616-byte original mission header')
def read_script(script_id):
    name = f'cpscr{script_id:03}.dat'
    data = (source / name).read_bytes()
    if len(data) != 12552 or struct.unpack_from('<H', data)[0] != 12:
        raise ValueError('Expected a version-12 PopScript record')
    codes = list(struct.unpack_from('<4096H', data))
    codes = codes[:codes.index(1019) + 1]
    fields = list(struct.iter_unpack('<Ii', data[8192:12288]))
    used = {code for code in codes[1:] if code < 512}
    if any(t not in (0, 1, 2) or (t == 1 and not 0 <= v < 64) for t, v in (fields[i] for i in used)):
        raise ValueError('Invalid script field or variable index')
    # DO arguments are field references or literal enum tokens, ending at the next statement.
    # Preserve observed arities; their game-side semantics must be reconstructed separately.
    boundaries = {*range(1000, 1010), 1019, 1025, 1026}
    commands = {}
    for i, code in enumerate(codes):
        if code != 1006:
            continue
        opcode = codes[i + 1]
        end = i + 2
        while end < len(codes) and codes[end] not in boundaries:
            end += 1
        count = end - i - 2
        if opcode in commands and commands[opcode] != count:
            raise ValueError(f'Inconsistent command arity: {opcode}')
        commands[opcode] = count
    fields = fields[:max(used) + 1]
    return dict(source=name, sha256=hashlib.sha256(data).hexdigest(), codes=codes, fields=fields,
                variables=list(struct.unpack_from('<64i', data, 12288)), commands=commands)

if header[88] > 2:
    out = {'tribes': {str(tribe): read_script(header[88 + tribe]) for tribe in range(1, header[88])}}
else:
    out = read_script(header[89])
(Path(__file__).resolve().parents[1] / f'app/original-script{suffix}.json').write_text(json.dumps(out, separators=(',', ':')) + '\n')
if header[88] > 2:
    print('Imported', ', '.join(f'tribe {tribe}: {script["source"]}' for tribe, script in out['tribes'].items()))
else:
    print(f'Imported {out["source"]}: {len(out["codes"])} words, {len(out["commands"])} command signatures; SHA256 {out["sha256"]}')
