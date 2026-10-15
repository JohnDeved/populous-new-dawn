from pathlib import Path
import struct,json,hashlib
from capstone import Cs,CS_ARCH_X86,CS_MODE_32
p=Path('../original-game-restoration-20261010/game/d3dpoptb.exe'); b=p.read_bytes();pe=struct.unpack_from('<I',b,0x3c)[0];n=struct.unpack_from('<H',b,pe+6)[0]; opt=struct.unpack_from('<H',b,pe+20)[0];base=struct.unpack_from('<I',b,pe+24+28)[0]; sections=[]
for i in range(n):
 o=pe+24+opt+40*i;size,va,rs,ro=struct.unpack_from('<IIII',b,o+8);sections.append((va,rs,ro))
def read(a,z):
 r=a-base
 for va,s,o in sections:
  if va<=r and r+z<=va+s:return b[o+r-va:o+r-va+z]
 raise ValueError(hex(a))
cs=Cs(CS_ARCH_X86,CS_MODE_32)
out={'exeSha256':hashlib.sha256(b).hexdigest(),'mode':'static disassembly only, original instructions not executed','calls':{}}
for a,z in [(0x484a10,0x7d0),(0x42b230,0x359),(0x4ed8a0,0x240)]:
 out['calls'][hex(a)]=[{'address':hex(i.address),'instruction':i.mnemonic+' '+i.op_str} for i in cs.disasm(read(a,z),a) if i.mnemonic=='call']
print(json.dumps(out,indent=2))
