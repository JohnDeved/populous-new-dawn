"""Append original vehicle unload HFX60/61 and palette130 passenger press masks.
Preserves all existing HUD pixels and rectangles.
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
parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('source',type=Path);parser.add_argument('--check',action='store_true');parser.add_argument('--project-root',type=Path,default=ROOT);args=parser.parse_args()
source_ids=(60,61,*range(75,81));frames=append.original_frames(args.source,source_ids)
palette=(args.source/'data/pal0-c.dat').read_bytes()
mask_ids=[]
for ident in range(75,81):
    key=f'vehicle-{ident}-pressed';mask_ids.append(key)
    frame=frames.pop(str(ident));mask=Image.new('RGBA',frame.size,tuple(palette[130*4:130*4+3])+(255,))
    mask.putalpha(frame.getchannel('A'));frames[key]=mask
ids=(60,61,*mask_ids)
meta_path=args.project_root/'app/original-hud.json';image_path=args.project_root/'public/original/hud.png'
meta=json.loads(meta_path.read_text());before=Image.open(image_path).convert('RGBA');append.validate_rectangles(meta,before)
for name,expected in append.HASHES.items():
    assert meta['sha256'][name]==expected,name
# Two explicit append groups support the source60/61 packet followed by reviewed
# palette130 pressed masks. Existing rectangles are never repacked or overwritten.
missing=[];missing_groups=[]
for group in [(60,61),tuple(mask_ids)]:
    present=[str(i) in meta['rects'] for i in group]
    assert all(present) or not any(present),'Partial vehicle icon append must be inspected'
    if all(present):append.validate_installed(meta,before,frames,group)
    else:missing.extend(group);missing_groups.append(group)
if not missing:
    print('PASS: installed HFX60/61 and palette130 passenger masks match original pixels')
else:
    assert not args.check,'Missing vehicle panel source art'
    updated,after=meta,before
    for group in missing_groups:updated,after=append.append_phase(updated,after,frames,group)
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
    print(json.dumps(dict(appended=missing,oldSize=before.size,newSize=after.size,preservedRectangles=len(meta['rects']),preservedPixelsSha256=append.sha(before.tobytes()),frames={key:append.sha(frame.tobytes()) for key,frame in frames.items()}),indent=2))
