"""Execute native phase-17 command-28 allocation and person attachment.

Usage: python scripts/check-native-command-28.py /path/to/d3dpoptb.exe
The exact helper, order encoder, old-order release and queue attachment execute.
"""
import struct,sys
from pathlib import Path
from unicorn.x86_const import UC_X86_REG_EAX,UC_X86_REG_EIP,UC_X86_REG_ESP
from decomp import native_cpu

cpu,_=native_cpu(Path(sys.argv[1]));cpu.mem_map(0x2000000,0x20000)
person,stack,stop=0x2000000,0x201d000,0x201e000
write=lambda p,f,*v:cpu.mem_write(p,struct.pack('<'+f,*v))
read=lambda p,f:struct.unpack('<'+f,cpu.mem_read(p,struct.calcsize('<'+f)))
def call(address,*args):
    write(stack,'I'*(len(args)+1),stop,*args);cpu.reg_write(UC_X86_REG_ESP,stack)
    cpu.emu_start(address,stop,timeout=1000000,count=2000000)
    assert cpu.reg_read(UC_X86_REG_EIP)==stop,hex(cpu.reg_read(UC_X86_REG_EIP))
    return cpu.reg_read(UC_X86_REG_EAX)

cpu.mem_write(person,bytes(256));cpu.mem_write(0x938830,bytes(8000))
write(0x96aa78,'H',1);write(0x96aa7a,'H',0)
write(person+0xc,'II',0x08000200,0x200);write(person+0xa6,'B',5)
result=call(0x43b670,person,77)
assert result==1,result
first=read(person+0x8b,'H')[0]
assert first==1 and read(0x938830+first*10,'BBHHHH')==(28,0,1,0,77,0)
assert read(0x96aa78,'H')[0]==2 and read(0x96aa7a,'H')[0]==1
assert read(person+0x9b,'H')[0]==0 and not any(cpu.mem_read(person+0x8d,14))
assert cpu.mem_read(person+0xa6,1)[0]==0 and read(person+0xc,'II')==(0x210,0)

assert call(0x43b670,person,91)==1
second=read(person+0x8b,'H')[0]
assert second==2 and read(0x938830+second*10,'BBHHHH')==(28,0,1,0,91,0)
assert read(0x938830+first*10+2,'H')[0]==0 and read(0x96aa7a,'H')[0]==1

before=bytes(cpu.mem_read(person,256));cursor=read(0x96aa78,'H')[0]
for id_ in range(1,800):write(0x938830+id_*10+2,'H',1)
assert call(0x43b670,person,123)==0
assert bytes(cpu.mem_read(person,256))==before and read(0x96aa78,'H')[0]==cursor
print('PASS: native command 28 allocated a private queued order, replaced its predecessor, retained the exact target id, and left the person unchanged when the pool was full')
