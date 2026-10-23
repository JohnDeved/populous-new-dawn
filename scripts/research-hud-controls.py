"""Read bounded original HUD control descriptors and code, never execute the game.

python3 -B scripts/research-hud-controls.py VERIFIED_EXE > native.json
Only stdout is written. Compare with decomp/research/ordinary-hud-controls/native.json.
"""
import hashlib
import importlib.util
import json
from pathlib import Path
import struct
import sys

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('static_pe', ROOT/'scripts/import-result-ui.py')
source = importlib.util.module_from_spec(spec)
spec.loader.exec_module(source)
executable = Path(sys.argv[1])
data = executable.read_bytes()
identity = hashlib.sha256(data).hexdigest()
if identity != source.EXPECTED['d3dpoptb.exe']:
    raise ValueError('Original executable identity mismatch')
pe = source.StaticPE(data)
inputs = {'d3dpoptb.exe': identity}
for name in ('data/hfx0-0.dat', 'data/pal0-c.dat'):
    raw = (executable.parent/name).read_bytes()
    inputs[name] = hashlib.sha256(raw).hexdigest()
    if inputs[name] != source.EXPECTED[name]:
        raise ValueError('Original artwork identity mismatch: ' + name)
hfx = (executable.parent/'data/hfx0-0.dat').read_bytes()
help_icons = {str(sprite): list(struct.unpack_from('<HH', hfx, 8+sprite*8))
              for sprite in (105, 106)}


def control(address):
    raw = pe.read(address, 66)
    return dict(address=f'{address:08x}', raw=raw.hex(),
                type=struct.unpack_from('<I', raw, 4)[0],
                rectangle=list(struct.unpack_from('<6h', raw, 25)),
                callbacks={name: f'{struct.unpack_from("<I", raw, offset)[0]:08x}'
                           for name, offset in [('left', 13), ('right', 17), ('hover', 21),
                                                ('renderer', 41), ('refresh', 59)]},
                sprite=struct.unpack_from('<I', raw, 37)[0],
                tooltip=struct.unpack_from('<H', raw, 45)[0],
                key=struct.unpack_from('<I', raw, 55)[0], mode=raw[65])


roots = []
for address in (0x5cd0fc, 0x5cd13a, 0x5cd178):
    raw = pe.read(address, 62)
    roots.append(dict(address=f'{address:08x}', raw=raw.hex(),
                      id=struct.unpack_from('<I', raw)[0],
                      rectangle=list(struct.unpack_from('<4i', raw, 14)),
                      renderer=f'{struct.unpack_from("<I", raw, 30)[0]:08x}'))
frames = {}
for name, address in [('commands', 0x5caa40), ('helpNormal', 0x5caba8),
                      ('helpHeld', 0x5cabc0), ('helpHover', 0x5cabd8)]:
    frames[name] = dict(address=f'{address:08x}',
                        ids=list(struct.unpack('<9H', pe.read(address, 18))))
tribe_frames = []
for tribe in range(4):
    pointers = struct.unpack('<3I', pe.read(0x5cd270+tribe*12, 12))
    tribe_frames.append([dict(address=f'{address:08x}',
                              ids=list(struct.unpack('<9H', pe.read(address, 18))))
                         for address in pointers])
spans = []
for name, start, end in [
    ('helpAction', 0x49d150, 0x49d1c6),
    ('helpRenderer', 0x49d1d0, 0x49d293),
    ('tribeDisplayVariant', 0x49d2a0, 0x49d3d7),
    ('tribeAllianceVariant', 0x49d3e0, 0x49d536),
    ('tribeAction', 0x49d540, 0x49d5ee),
    ('tribeHoverAndVisibility', 0x49d5f0, 0x49d67e),
    ('commandRootRenderer', 0x4a1720, 0x4a18b5),
]:
    raw = pe.read(start, end-start)
    spans.append(dict(name=name, start=f'{start:08x}', end=f'{end:08x}',
                      sha256=hashlib.sha256(raw).hexdigest(), hex=raw.hex()))
print(json.dumps(dict(executableSha256=identity, inputs=inputs, roots=roots,
                     help=control(0x5cb386),
                     helpIconDimensions=help_icons,
                     tribes=[control(0x5cb02c+index*66) for index in range(6)],
                     frames=frames, tribeFrames=tribe_frames, code=spans), indent=2))
