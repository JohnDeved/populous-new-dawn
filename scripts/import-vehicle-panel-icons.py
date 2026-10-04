"""Append only original vehicle unload HFX60/61, preserving all existing HUD pixels.
Usage: python scripts/import-vehicle-panel-icons.py GAME_ROOT [--check]
"""
import argparse
import importlib.util
import io
import json
import os
from pathlib import Path
import tempfile
from PIL import Image
ROOT=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('hud_append',ROOT/'scripts/import-spell-hud-icons.py')
append=importlib.util.module_from_spec(spec);spec.loader.exec_module(append)
parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('source',type=Path);parser.add_argument('--check',action='store_true');args=parser.parse_args()
ids=(60,61);frames=append.original_frames(args.source,ids)
meta_path=ROOT/'app/original-hud.json';image_path=ROOT/'public/original/hud.png'
meta=json.loads(meta_path.read_text());before=Image.open(image_path).convert('RGBA');append.validate_rectangles(meta,before)
for name,expected in append.HASHES.items():
    assert meta['sha256'][name]==expected,name
present=[str(i) in meta['rects'] for i in ids]
assert all(present) or not any(present),'Partial vehicle icon append must be inspected'
if all(present):
    append.validate_installed(meta,before,frames,ids)
    print('PASS: installed HFX60/61 match original pixels')
else:
    assert not args.check,'Missing HFX60/61'
    updated,after=append.append_phase(meta,before,frames,ids)
    buffer=io.BytesIO();after.save(buffer,format='PNG',compress_level=9)
    pending=[]
    try:
        for path,data in [(image_path,buffer.getvalue()),(meta_path,(json.dumps(updated,separators=(',',':'))+'\n').encode())]:
            with tempfile.NamedTemporaryFile(dir=path.parent,prefix='.'+path.name+'.',delete=False) as output:
                output.write(data);output.flush();os.fsync(output.fileno());pending.append((Path(output.name),path))
        for temporary,path in pending:os.replace(temporary,path)
    finally:
        for temporary,_ in pending:
            if temporary.exists():temporary.unlink()
    print(json.dumps(dict(appended=ids,oldSize=before.size,newSize=after.size,preservedRectangles=len(meta['rects']),preservedPixelsSha256=append.sha(before.tobytes()),frames={key:append.sha(frame.tobytes()) for key,frame in frames.items()}),indent=2))
