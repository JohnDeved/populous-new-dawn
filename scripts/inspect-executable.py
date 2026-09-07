"""Read the animation tables from the user-supplied D3DPopTB.exe without executing it.
Usage: python3 scripts/inspect-executable.py /path/to/D3DPopTB.exe
Offsets are for the analyzed executable; fail closed on an unknown build.
"""
import hashlib,json,struct,sys
from pathlib import Path
b=Path(sys.argv[1]).read_bytes()
sha=hashlib.sha256(b).hexdigest()
assert sha=='3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f','Different executable: recheck offsets in Ghidra first'
pe=struct.unpack_from('<I',b,60)[0]
assert b[pe:pe+4]==b'PE\0\0'
n=struct.unpack_from('<H',b,pe+6)[0];opt=struct.unpack_from('<H',b,pe+20)[0]
base=struct.unpack_from('<I',b,pe+24+28)[0]
sections=[struct.unpack_from('<8sIIII',b,pe+24+opt+i*40) for i in range(n)]
def read(address,size):
    rva=address-base
    for _,virtual_size,virtual,raw_size,raw in sections:
        if virtual<=rva and rva+size<=virtual+raw_size:return b[raw+rva-virtual:raw+rva-virtual+size]
    raise ValueError(hex(address))
rows={}
for name,row in [('idle',0),('walk',1),('carryIdle',4),('carry',5),('work',6),('chop',8),('attack',11),('airborne',12),('pray',13)]:
    rows[name]={}
    for kind,index in [('brave',2),('warrior',3),('shaman',7)]:
        obj=struct.unpack('<h',read(0x5a6d50+(row*9+index)*2,2))[0]
        start,draw=struct.unpack('<hh',read(0x5a6858+obj*4,4));record=read(0x5a6ad7+(draw+3)*11,11)
        rows[name][kind]={'start':start,'layer':record[5],'variant':record[6],'turnsPerFrame':record[3]+1}
assert rows['walk']['shaman']['start']==616
assert rows['carry']['brave']['start']==72
print(json.dumps({'sha256':sha,'animationRows':rows,'blastDamage':struct.unpack('<i',read(0x5aa510,4))[0],'blastBuildingDamage':struct.unpack('<i',read(0x5aa50c,4))[0]},indent=2))
