"""Import message/tooltip text, native string IDs and interface artwork.
Usage: python3 scripts/import-messages.py /path/to/extracted/game [--messages-only]
"""
import hashlib
import importlib.util
import json
from pathlib import Path
import struct
import sys
from decomp import inspect, ROOT

source=Path(sys.argv[1]);messages_only='--messages-only' in sys.argv[2:]
exe=source/'d3dpoptb.exe';identity=inspect(exe);b=exe.read_bytes()
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
messages={}
for script_name,opcode in [('original-script.json',1176),('original-script-two.json',1174)]:
    script=json.loads((ROOT/'app'/script_name).read_text());codes=script['codes']
    for i in range(len(codes)-2):
        if codes[i:i+2]!=[1006,opcode]:continue
        kind,number=script['fields'][codes[i+2]]
        assert kind==0,'Resolve dynamic message IDs before importing'
        string_id=struct.unpack('<H',read(0x5ae310+number*2,2))[0]
        assert 0<=string_id<len(strings)
        messages[number]={'stringId':string_id,'text':strings[string_id]}
def profile(kind,cap):
    record=read(0x59caf8+kind*28,28)
    assert record[10]==1 and record[11]==cap and record[23]==0
    assert struct.unpack_from('<I',record,13)[0]==3
    icon=struct.unpack_from('<H',record,17)[0]
    assert struct.unpack_from('<H',record,19)[0]==icon
    return {'lifetime':struct.unpack_from('<h',record)[0],'height':struct.unpack_from('<h',record,8)[0],
            'speed':struct.unpack_from('<i',record,4)[0],'flags':struct.unpack_from('<I',record,24)[0],'icon':icon}
type1=profile(1,1);defaults=profile(3,0);icon=defaults['icon']
spec=importlib.util.spec_from_file_location('assets',ROOT/'scripts/import-original.py')
assets=importlib.util.module_from_spec(spec);spec.loader.exec_module(assets)
palette=(source/'data/pal0-c.dat').read_bytes();hfx=(source/'data/hfx0-0.dat').read_bytes()
if not messages_only:
    w,h,pixels=assets.sprites(hfx,palette)[icon];assets.png(ROOT/'public/original/message.png',w,h,pixels)
w,h,pixels=assets.sprites(hfx,palette)[type1['icon']];assets.png(ROOT/'public/original/message-type1.png',w,h,pixels)
out={'executableSha256':identity['sha256'],'sha256':{name:hashlib.sha256((source/name).read_bytes()).hexdigest() for name in ['language/lang00.dat','data/pal0-c.dat','data/hfx0-0.dat']},'defaults':defaults,'type1':type1,'messages':messages}
(ROOT/'app/original-messages.json').write_text(json.dumps(out,indent=2)+'\n')
print(f"Imported {len(messages)} original messages and HFX icons {type1['icon']}, {icon}")
if messages_only:raise SystemExit

# 0x4f0f90: class-specific names, including enemy and multiplayer variants.
names={}
for kind,address,count,stride,offset,pair in [(1,0x5a7060,9,50,0,True),(2,0x5a7228,20,76,4,True),
                                            (4,0x5a7938,5,23,6,False),(5,0x5a79b0,20,24,2,False)]:
    names[kind]=[list(struct.unpack('<hh' if pair else '<h',read(address+i*stride+offset,4 if pair else 2))) for i in range(count)]
ids={848,*range(888,900),597,598,600,601,609}
for entries in names.values():
    for entry in entries:
        ids.update(n for n in entry if n)
        if len(entry)==2 and entry[1]:ids.add(entry[1]+1)
assert all(0<i<len(strings) for i in ids)
window=list(struct.unpack('<9H',read(0x5caae8,18)))
assert window==[591,595,592,597,0,598,593,596,594]
bank=assets.sprites(hfx,palette);pixels=bytearray(12*12*4)
for i,sprite in enumerate(window):
    if not sprite:continue
    w,h,data=bank[sprite];assert (w,h)==(4,4)
    for y in range(4):
        start=((i//3*4+y)*12+i%3*4)*4;pixels[start:start+16]=data[y*16:y*16+16]
assets.png(ROOT/'public/original/tooltip-border.png',12,12,pixels)
# 0x44a9e8: ordinary object tooltips pass AL=0x98 to draw_ingame_window.
# 0x44a38b: text uses palette_index_1=0x50. The earlier 0x3a is ':' parsing.
assert read(0x44a9e8,2)==b'\xb0\x98'
assert read(0x44a38b,7)==b'\xc6\x05\x9c\x48\x98\x00\x50'
background,foreground=read(0x44a9e9,1)[0],read(0x44a391,1)[0]
tooltip={'executableSha256':identity['sha256'],'languageSha256':hashlib.sha256(lang).hexdigest(),
         'paletteSha256':hashlib.sha256(palette).hexdigest(),'hfxSha256':hashlib.sha256(hfx).hexdigest(),
         'names':names,'strings':{i:strings[i] for i in sorted(ids)},'window':window,
         'backgroundIndex':background,'foregroundIndex':foreground,
         'background':list(palette[background*4:background*4+3]),'foreground':list(palette[foreground*4:foreground*4+3])}
(ROOT/'app/original-tooltips.json').write_text(json.dumps(tooltip,indent=2)+'\n')
print(f'Imported {len(ids)} tooltip strings and eight original window-border sprites')

# 0x524a30: the first color in each five-byte tribe ramp tints the defeat sky.
sky_indices=[read(0x5a89c8+i*5,1)[0] for i in range(4)]
sky={'executableSha256':identity['sha256'],'paletteSha256':hashlib.sha256(palette).hexdigest(),
     'indices':sky_indices,'colors':[list(palette[i*4:i*4+3]) for i in sky_indices]}
(ROOT/'app/original-sky.json').write_text(json.dumps(sky,indent=2)+'\n')
print('Imported four native defeat-sky colors')
