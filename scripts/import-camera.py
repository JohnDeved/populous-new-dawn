"""Import the original 10-resolution, five-view camera configuration table.
Usage: python3 scripts/import-camera.py /path/to/extracted/game
"""
import hashlib, json, struct, sys
from pathlib import Path
from decomp import ROOT, inspect

source=Path(sys.argv[1]);identity=inspect(source/'d3dpoptb.exe')
data=(source/'data/vconfig0.dat').read_bytes()
assert len(data)==50*94
views=[]
for i in range(50):
    row=data[i*94:(i+1)*94]
    def read(fmt,offset):return struct.unpack_from(fmt,row,offset)[0]
    views.append(dict(curvature=read('<i',0),diameter=read('<i',4),scale=read('<i',8),
        spriteScale=read('<i',12),depth=read('<i',16),perspective=read('<i',20),
        pitch=read('<h',32),offsetX=read('<h',42),offsetY=read('<h',44),
        horizon=read('<h',46),width=read('<h',48),height=read('<h',50),
        shamanScale=280,bounds=list(struct.unpack_from('<8h',row,68)),boundsMode=read('<B',84),globe=read('<B',93)))
assert views[0]['curvature']==46000 and views[0]['pitch']==1932
out={'executableSha256':identity['sha256'],'sha256':hashlib.sha256(data).hexdigest(),'views':views}
(ROOT/'app/original-camera.json').write_text(json.dumps(out,indent=2)+'\n')
print('Imported 50 original camera views; 0x417000 shamanScale override applied')
