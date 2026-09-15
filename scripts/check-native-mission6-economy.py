"""Execute Mission 6's first native construction producer and phase-0 task setup.
Usage: python scripts/check-native-mission6-economy.py /path/to/d3dpoptb.exe
"""
import hashlib,struct,sys
from pathlib import Path
from unicorn import UC_HOOK_CODE
from unicorn.x86_const import UC_X86_REG_EAX,UC_X86_REG_EIP,UC_X86_REG_ESP
from decomp import native_cpu

exe=Path(sys.argv[1]);expected='3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f'
assert hashlib.sha256(exe.read_bytes()).hexdigest()==expected
cpu,_=native_cpu(exe);cpu.mem_map(0x2000000,0x30000)
ai,stack,stop=0x2000000,0x202d000,0x202e000
def write(address,fmt,*values):cpu.mem_write(address,struct.pack('<'+fmt,*values))
def read(address,fmt='I'):return struct.unpack('<'+fmt,cpu.mem_read(address,struct.calcsize('<'+fmt)))[0]
def call(address,*args):
    write(stack,'I'*(len(args)+1),stop,*args);cpu.reg_write(UC_X86_REG_ESP,stack)
    cpu.emu_start(address,stop,count=500000)
    assert cpu.reg_read(UC_X86_REG_EIP)==stop
    return cpu.reg_read(UC_X86_REG_EAX)&0xffffffff
def ret(value=0):
    sp=cpu.reg_read(UC_X86_REG_ESP);cpu.reg_write(UC_X86_REG_EAX,value)
    cpu.reg_write(UC_X86_REG_EIP,read(sp));cpu.reg_write(UC_X86_REG_ESP,sp+4)
def available(_cpu,_address,_size,_user):ret(6)
cpu.hook_add(UC_HOOK_CODE,available,begin=0x4f67b0,end=0x4f67b0)

profiles=[
    (2,0xd094,[38,0,0,1,0,0,15,40,0,4,9,0,80,30,2,2,0,0,75,0,0,0,0,0,255,1,0,0,25,1,1,1,128,5,0]),
    (3,0x72d8,[28,0,0,0,0,0,5,10,0,2,10,0,88,12,5,2,0,0,90,1,0,0,0,0,255,1,0,0,25,1,1,1,128,7,0]),
]
for tribe,origin,attributes in profiles:
    cpu.mem_write(ai,bytes(0xc65));write(ai+0x59a,'I',0x1e0fef);write(ai+0x5a2,'H',origin)
    write(ai+0xc22,'B',tribe);cpu.mem_write(0x9607ea+tribe*48,bytes(attributes))
    write(0x89d178,'I',0x12345678)
    assert call(0x4e5580,ai,0)==1
    assert (read(ai+0x74),read(ai+0x85,'B'),read(ai+0x68),read(ai+0x6c),read(ai+0x70),read(ai+0x78,'H'))==(1,0,4,origin,0,0)
    assert read(0x89d178)==0x12345678

observed=[]
def search(_cpu,_address,_size,_user):
    observed.append((read(ai+0x36,'H'),read(ai+0x46,'B'),read(ai+0x44,'B'),read(0x89d178),read(ai+0x78,'H')))
    ret(0)
cpu.hook_add(UC_HOOK_CODE,search,begin=0x4f7aa0,end=0x4f7aa0)
for tribe,origin,flags,latch,center in [(2,0xd094,0x40,0xb69a,0xd094),(3,0x72d8,0x20,0x80d0,0x80d0)]:
    cpu.mem_write(ai,bytes(0xc65));write(ai+0x596,'I',flags);write(ai+0x5a4,'H',latch)
    write(ai+0xc22,'B',tribe);write(ai+0x68,'I',4);write(ai+0x6c,'I',origin)
    write(ai+0x78,'H',0);write(0x9607ea+tribe*48+30,'B',1);write(0x89d178,'I',0x12345678)
    call(0x4c6da0,ai,0)
    assert observed[-1]==(center,3,2,0x52d595fe,2)
print('PASS: native Mission 6 construction producers and phase-0 center/RNG setup matched both tribes')
