"""Execute native0x4f7dc0 with controlled eligible Preacher records, no leaf hooks.

Covers first-near/list/priority behavior, strict19-axis boundary, wrapped distance,
nearest fallback, invalid mode and the selected-only flags3 side effect. Does not
prove world movement or all shared eligibility consumers.
"""
import hashlib
import json
import struct
import sys
from pathlib import Path
from unicorn.x86_const import UC_X86_REG_ESP, UC_X86_REG_EIP, UC_X86_REG_EAX
from decomp import native_cpu

exe=Path(sys.argv[1]).resolve()
assert hashlib.sha256(exe.read_bytes()).hexdigest()=='3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f'
cases=[
    ([[118,118,0],[100,100,0]],0x6464,1,1),
    ([[120,100,0],[100,100,0]],0x6464,1,2),
    ([[140,100,0],[124,100,0]],0x6464,1,2),
    ([[118,118,0],[100,100,1]],0x6464,1,1),
    ([[140,100,0],[102,100,1]],0x6464,1,2),
    ([[120,100,0],[100,100,0]],0x6565,1,2),
    ([[250,250,0],[2,2,0]],0x0202,1,1),
    ([[140,100,0],[102,100,1]],0x6464,0,1),
    ([[100,100,0]],0x6464,2,0),
]
results=[]
for rows,target,mode,expected in cases:
    cpu,_=native_cpu(exe)
    cpu.mem_map(0x2000000,0x20000)
    ai=0x89d1c8+2*0xc65
    cpu.mem_write(ai,bytes(0xc65))
    def write(address,fmt,*values): cpu.mem_write(address,struct.pack('<'+fmt,*values))
    write(ai+0xc22,'B',2)
    write(ai+0x881,'I',0x2000000)
    write(0x89d178,'I',0x12345678)
    for i,(x,y,priority) in enumerate(rows):
        p=0x2000000+i*256
        write(p+8,'I',p+256 if i+1<len(rows) else 0)
        write(p+0x24,'H',i+1)
        write(p+0x2a,'BBB',1,4,17)
        write(p+0x2f,'B',2)
        write(p+0x3d,'HH',x<<8,y<<8)
        write(p+0x76,'H',priority<<12)
        write(p+0x14,'I',1)
    stack,stop=0x201d000,0x201e000
    write(stack,'8I',stop,ai,4,4,0xffffffff,mode,target,0x47)
    cpu.reg_write(UC_X86_REG_ESP,stack)
    cpu.emu_start(0x4f7dc0,stop,count=2000000)
    assert cpu.reg_read(UC_X86_REG_EIP)==stop
    pointer=cpu.reg_read(UC_X86_REG_EAX)
    selected=(pointer-0x2000000)//256+1 if pointer else 0
    assert selected==expected,(rows,selected,expected)
    flags=[struct.unpack('<I',cpu.mem_read(0x2000014+i*256,4))[0] for i in range(len(rows))]
    assert flags==[0 if i+1==expected else 1 for i in range(len(rows))]
    assert struct.unpack('<I',cpu.mem_read(0x89d178,4))[0]==0x12345678
    results.append(dict(rows=rows,target=target,mode=mode,selected=selected,flags3=flags))
print(json.dumps(results,indent=2))
print('PASS:9 native single-person selection cases without intercepted leaves')
