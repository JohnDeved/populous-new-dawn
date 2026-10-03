"""Bounded original execution for the Mission3 marker-Preacher script slice.

Covers first-near/list/priority behavior, strict19-axis boundary, wrapped distance,
nearest fallback, invalid mode and the selected-only flags3 side effect. Does not
prove world movement or all shared eligibility consumers. The complete script
block supplies world reads/intercepts hosts;1103 replacement cases run unhooked.
"""
import hashlib
import json
import struct
import sys
from pathlib import Path
from unicorn import UC_HOOK_CODE
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

# Full authored128-turn block; world reads and command hosts are controlled here.
script=json.loads((Path(__file__).resolve().parents[1]/'app/original-script-three.json').read_text())
assert hashlib.sha256((exe.parent/'levels'/script['source']).read_bytes()).hexdigest()==script['sha256']
block_results=[]
for turn,pop,priests,near,warriors,blue_warriors,blue_priests,camps,blue_pop,expected in [
    (122,9,1,0,0,0,0,2,20,[]),
    (123,8,1,0,0,0,0,2,20,[1136,1068,1103]),
    (123,9,1,0,3,0,0,2,20,[1136,1092,1074,1068,1103]),
    (123,7,1,4,0,0,0,2,20,[1136,1068,1102]),
    (123,9,0,4,0,0,0,2,20,[1136,1068,1103]),
    (251,9,1,0,0,10,10,2,20,[1176,1180,1179,1136,1074,1068,1103]),
    (123,9,1,0,0,0,0,0,26,[1136,1176,1180,1179,1074,1068,1103]),
]:
    cpu,_=native_cpu(exe);cpu.mem_map(0x2000000,0x20000)
    ai=0x89d1c8+2*0xc65;program=0x2000000;stack=0x201d000;stop=0x201e000
    def write(address,fmt,*values):cpu.mem_write(address,struct.pack('<'+fmt,*values))
    def read(address,fmt='I'):return struct.unpack('<'+fmt,cpu.mem_read(address,struct.calcsize('<'+fmt)))[0]
    def args(n):return struct.unpack('<'+'I'*n,cpu.mem_read(cpu.reg_read(UC_X86_REG_ESP)+4,n*4))
    def ret(value):
        sp=cpu.reg_read(UC_X86_REG_ESP);cpu.reg_write(UC_X86_REG_EAX,value&0xffffffff)
        cpu.reg_write(UC_X86_REG_EIP,read(sp));cpu.reg_write(UC_X86_REG_ESP,sp+4)
    cpu.mem_write(ai,bytes(0xc65));write(ai+0xc22,'B',2);write(0x89d188,'I',turn)
    codes=[12,1003,*script['codes'][570:715],1004,1019];blob=bytearray(12552)
    struct.pack_into('<'+'H'*len(codes),blob,0,*codes)
    for i,field in enumerate(script['fields']):struct.pack_into('<Ii',blob,8192+i*8,*field)
    cpu.mem_write(program,bytes(blob))
    values={1:pop,1148:priests,1147:warriors,1153:blue_warriors,1154:blue_priests,1088:camps,2:blue_pop}
    events=[]
    def internal(*_):
        field=args(3)[2];kind=read(field);value=read(field+4,'i')
        if kind==2 and value in values:ret(values[value])
    def host(*_):
        _,p=args(2);ptr=read(p+0x3104);opcode=read(ptr+2,'H');count=script['commands'][str(opcode)]
        events.append(opcode)
        if opcode==1068:write(p+0x3000+9*4,'I',near)
        write(p+0x3104,'I',ptr+4+2*count);ret(1)
    cpu.hook_add(UC_HOOK_CODE,internal,begin=0x48f350,end=0x48f350)
    cpu.hook_add(UC_HOOK_CODE,host,begin=0x48cc60,end=0x48cc60)
    write(stack,'III',stop,ai,program);cpu.reg_write(UC_X86_REG_ESP,stack)
    cpu.emu_start(0x48c6b0,stop,count=2000000)
    assert cpu.reg_read(UC_X86_REG_EIP)==stop and events==expected,(turn,events,expected)
    assert read(program+0x3000+10*4)==0
    block_results.append(dict(turn=turn,commands=events))
print(json.dumps(block_results,indent=2))
print('PASS:7 complete native block schedule/ordering cases with controlled world/hosts')

# Complete1103 list walk and0x43b2a0 allocation/replacement, no intercepted leaves.
return_results=[]
for state,model,flags,queued,base,exhausted in [
    (10,30,0,False,False,False),(33,30,0,True,True,False),
    (17,30,0,False,False,False),(10,30,1,False,False,False),
    (10,17,0,False,False,False),(10,30,0,False,False,True),
]:
    cpu,_=native_cpu(exe);cpu.mem_map(0x2000000,0x20000)
    ai=0x89d1c8+2*0xc65;person=0x2000000;stack=0x201d000;stop=0x201e000
    def write(a,f,*v):cpu.mem_write(a,struct.pack('<'+f,*v))
    def read(a,f='I'):return struct.unpack('<'+f,cpu.mem_read(a,struct.calcsize('<'+f)))[0]
    cpu.mem_write(ai,bytes(0xc65));write(ai+0xc22,'B',2);write(ai+0x881,'I',person)
    write(ai+0x5b4,'B',int(base));write(ai+0x5a2,'H',0x1357);write(ai+0x36a,'H',0x2468)
    write(person+0x24,'H',1);write(person+0x2a,'BBB',1,4,state);write(person+0x2f,'B',2)
    write(person+(0x8b if queued else 0x9b),'H',1)
    write(0x93883a,'BBHHHH',model,flags,1,0,0,0);write(0x96aa78,'H',2)
    if exhausted:
        for i in range(1,800):write(0x938830+i*10+2,'H',1)
    write(0x89d178,'I',0x12345678)
    before_person=bytes(cpu.mem_read(person,256));before_pool=bytes(cpu.mem_read(0x938830,8000))
    write(stack,'II',stop,ai);cpu.reg_write(UC_X86_REG_ESP,stack)
    cpu.emu_start(0x4f3280,stop,count=2000000)
    assert cpu.reg_read(UC_X86_REG_EIP)==stop
    matching=state in (10,33) and model==30 and not flags&1 and not exhausted
    if matching:
        assert read(person+0x9b,'H')==0 and read(person+0x8b,'H')==2
        assert read(0x938844,'B')==3
        assert [read(0x93884a,'H'),read(0x93884c,'H')]==([0x6800,0x2400] if base else [0x5600,0x1200])
        assert read(person+0x2c,'B')==state and read(person+0xc)&0x10
    else:
        assert bytes(cpu.mem_read(person,256))==before_person
        assert bytes(cpu.mem_read(0x938830,8000))==before_pool
    assert read(0x89d178)==0x12345678
    return_results.append(dict(state=state,model=model,flags=flags,queued=queued,base=base,exhausted=exhausted,replaced=matching))
print(json.dumps(return_results,indent=2))
print('PASS:6 native1103 complete replacement/filter/exhaustion cases without intercepted leaves')

# Original restoration/cleanup resets motion before the blocked-state gate.
# All leaves execute;0x100000 deliberately avoids unrelated state initialization.
cleanup_results=[]
for cleanup in [False,True]:
    cpu,_=native_cpu(exe);cpu.mem_map(0x2000000,0x20000)
    ai=0x89d1c8+2*0xc65;person=0x2000000;stack=0x201d000;stop=0x201e000
    def write(a,f,*v):cpu.mem_write(a,struct.pack('<'+f,*v))
    def read(a,f='I'):return struct.unpack('<'+f,cpu.mem_read(a,struct.calcsize('<'+f)))[0]
    cpu.mem_write(ai,bytes(0xc65));write(ai+0xc22,'B',2);write(ai+0x881,'I',person);write(ai+0x85,'B',11)
    write(person+0x24,'H',1);write(person+0x2a,'BBB',1,4,14);write(person+0x2f,'B',2)
    write(person+0xc,'I',0x20100800);write(person+0x3d,'HH',0x2345,0x4567)
    write(person+0x4f,'HH',0x7777,0x8888);write(person+0x68,'HH',1,2);write(person+0x82,'B',255)
    write(person+0x61,'H',7);write(person+0x66,'B',3);write(person+0x63,'h',3);write(person+0x67,'B',2)
    write(0x89d178,'I',0x12345678)
    write(stack,'III',stop,ai,ai+0x36 if cleanup else 14);cpu.reg_write(UC_X86_REG_ESP,stack)
    cpu.emu_start(0x4f6840 if cleanup else 0x418ce0,stop,count=2000000)
    assert cpu.reg_read(UC_X86_REG_EIP)==stop
    assert read(person+0x2c,'B')==14 and read(person+0xc)==0x101000
    assert read(person+0x61,'H')==0 and read(person+0x66,'B')==0
    assert [read(person+0x63,'h'),read(person+0x67,'B')]==[3,2]
    assert [read(person+0x4f,'H'),read(person+0x51,'H')]==[0x7777,0x8888]
    expected=[0x2300,0x4500,0] if cleanup else [1,2,255]
    assert [read(person+0x68,'H'),read(person+0x6a,'H'),read(person+0x82,'B')]==expected
    assert read(0x89d178)==0x12345678
    cleanup_results.append(dict(cleanup=cleanup,anchor=expected,motionGroup=3,motionIndex=2,state=14))
print(json.dumps(cleanup_results,indent=2))
print('PASS:2 native blocked-state restoration/cleanup cases without intercepted leaves')
