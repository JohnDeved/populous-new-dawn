"""Import first-mission message text, native string IDs and the type-3 icon.
Usage: python3 scripts/import-messages.py /path/to/extracted/game
"""
import hashlib
import importlib.util
import json
from pathlib import Path
import struct
import sys
from decomp import inspect, ROOT

source=Path(sys.argv[1]);exe=source/'d3dpoptb.exe';identity=inspect(exe);b=exe.read_bytes()
pe=struct.unpack_from('<I',b,60)[0];opt=struct.unpack_from('<H',b,pe+20)[0]
sections=[struct.unpack_from('<8sIIII',b,pe+24+opt+i*40) for i in range(struct.unpack_from('<H',b,pe+6)[0])]
def read(address,size):
    for _,vs,va,rs,raw in sections:
        rva=address-0x400000
        if va<=rva and rva+size<=va+min(vs,rs):return b[raw+rva-va:raw+rva-va+size]
    raise ValueError('Unmapped message table')
lang=(source/'language/lang00.dat').read_bytes()
assert len(lang)%2==0 and lang.endswith(b'\0\0')
strings=lang.decode('utf-16le').split('\0')[:-1]
script=json.loads((ROOT/'app/original-script.json').read_text());codes=script['codes'];messages={}
for i in range(len(codes)-2):
    if codes[i:i+2]!=[1006,1176]:continue
    kind,number=script['fields'][codes[i+2]]
    assert kind==0,'Resolve dynamic message IDs before importing'
    string_id=struct.unpack('<H',read(0x5ae310+number*2,2))[0]
    assert 0<=string_id<len(strings)
    messages[number]={'stringId':string_id,'text':strings[string_id]}
record=read(0x59caf8+3*28,28)
assert record[10]==1 and record[11]==0 and record[23]==0 # List category, no type cap or deletion history.
# 0x49f9c0: draw kind at +13, normal/selected icon at +17/+19.
assert struct.unpack_from('<I',record,13)[0]==3
icon=struct.unpack_from('<H',record,17)[0]
defaults={'lifetime':struct.unpack_from('<h',record)[0],'height':struct.unpack_from('<h',record,8)[0],
          'speed':struct.unpack_from('<i',record,4)[0],'flags':struct.unpack_from('<I',record,24)[0],'icon':icon}
spec=importlib.util.spec_from_file_location('assets',ROOT/'scripts/import-original.py')
assets=importlib.util.module_from_spec(spec);spec.loader.exec_module(assets)
palette=(source/'data/pal0-c.dat').read_bytes();hfx=(source/'data/hfx0-0.dat').read_bytes()
w,h,pixels=assets.sprites(hfx,palette)[icon];assets.png(ROOT/'public/original/message.png',w,h,pixels)
out={'executableSha256':identity['sha256'],'sha256':{name:hashlib.sha256((source/name).read_bytes()).hexdigest() for name in ['language/lang00.dat','data/pal0-c.dat','data/hfx0-0.dat']},'defaults':defaults,'messages':messages}
(ROOT/'app/original-messages.json').write_text(json.dumps(out,indent=2)+'\n')
print(f'Imported {len(messages)} original messages and HFX icon {icon}')
