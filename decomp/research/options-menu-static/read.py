import importlib.util,struct,json
from pathlib import Path
s=importlib.util.spec_from_file_location('r','scripts/check-static-mission18-sky.py');m=importlib.util.module_from_spec(s);s.loader.exec_module(m)
p=m.PE32(Path('/workspace/scratch/69fd8163d94e/populous-research-inputs/game/app/D3DPopTB.exe'))
for i in range(34):
 t,d=struct.unpack('<2I',p.read(0x5d9970+i*8,8));print(i,hex(i*8+4),t,hex(d),' '.join(f'{x:08x}' for x in struct.unpack('<16I',p.read(d,64))))
print('LAYOUT TYPES',list(p.read(0x4c4c04,12)))
print('RENDER JUMPS', [hex(p.u32(0x45d6c4+i*4)) for i in range(12)])
for a in [0x59994c,0x599970,0x59d33c,0x59d328]: print(hex(a),p.read(a,20))
langpath=Path('/workspace/scratch/69fd8163d94e/populous-research-inputs/game/app/language/lang00.dat');lang=langpath.read_bytes().decode('utf-16le').split('\0');print('lang hash',m.sha256(langpath.read_bytes()))
for i in [233,234,235,236,245,246,265,266,328,393,394,395,397,398,402,403,412,417,425,428,429,430,454,491,1237]:print(i,repr(lang[i]))
for a in [0x5d8db0,0x5d8e08,0x5d8e18,0x5d8e28]:print('CHOICES',hex(a),[hex(p.u32(a+i*4)) for i in range(4)])
for a in [0x59d2b4,0x59d29c]:print('ASSET',hex(a),p.read(a,48).decode('utf-16le',errors='replace'))
for i in [432,433,426,427,399,400,401,413,414]:print(i,repr(lang[i]))
