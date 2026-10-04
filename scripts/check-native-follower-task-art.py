"""Verify imported task frame/root/sprite pixels against executed native draw geometry.
Usage: python scripts/check-native-follower-task-art.py EXE
The accepted raster probe supplies coordinate/format/bank/raster leaves. This is
logical-coordinate draw-request equivalence, not a running original-game screenshot.
"""
import json
import runpy
import sys
import tempfile
from pathlib import Path
from PIL import Image

root = Path(__file__).resolve().parents[1]
with tempfile.TemporaryDirectory(prefix='follower-task-art-') as output:
    sys.argv = [str(root / 'scripts/capture-native-followers-panel.py'), sys.argv[1], output]
    n = runpy.run_path(sys.argv[0])
    # Functions from run_path retain their own global namespace.
    g = n['call'].__globals__
    call, write, cpu = [n[k] for k in ['call','write','cpu']]
    g['draws'] = []; g['text_draws'] = []; g['fills'] = []
    call(0x4a1720, 0x5cd178)
    actual = n['raster'](100,277,(0,204))
    assert actual.tobytes() == Image.open(root/'public/original/follower-task-panel.png').convert('RGBA').tobytes()
    for held, name in [(0,'normal'),(1,'pressed')]:
        b = n['button']; cpu.mem_write(b,bytes(128))
        write(b+8,'I',1); write(b+0x10,'I',1); write(b+0x18,'I',held)
        write(b+0x37,'ii',0,0);write(b+0x47,'ii',15,34)
        g['draws'] = []; g['text_draws'] = []; g['fills'] = []
        call(0x4a0e70,b)
        g['draws'] = g['draws'][:9]
        assert n['raster'](15,34).tobytes() == Image.open(root/f'public/original/follower-task-{name}.png').convert('RGBA').tobytes()
    meta = json.loads((root/'app/original-follower-tasks.json').read_text())
    atlas = Image.open(root/'public/original/follower-tasks.png').convert('RGBA')
    for icon in n['artifacts']:
        r = meta['rects'][str(icon['id'])]
        w,h,data = n['art'][icon['id']]
        assert atlas.crop((r['x'],r['y'],r['x']+w,r['y']+h)).tobytes() == bytes(data)
print('PASS: imported root, normal/pressed34px frames and18 exact original sprites match native logical draw requests')
