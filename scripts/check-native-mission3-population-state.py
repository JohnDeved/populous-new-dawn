"""Bounded original proof for Mission3's remaining population/state block.

The interpreter cases supply only two world reads; native attribute assignment and
1030 execute. Producer and existing-task phase probes run without intercepted
leaves. This does not prove the entire type2 Convert Wild movement/cast controller.
"""
import hashlib
import json
import struct
import sys
from pathlib import Path
from unicorn import UC_HOOK_CODE
from unicorn.x86_const import UC_X86_REG_EAX, UC_X86_REG_EIP, UC_X86_REG_ESP
from decomp import native_cpu

ROOT=Path(__file__).resolve().parents[1]
EXE=Path(sys.argv[1]).resolve()
assert hashlib.sha256(EXE.read_bytes()).hexdigest()=='3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f'
SCRIPT=json.loads((ROOT/'app/original-script-three.json').read_text())
assert hashlib.sha256((EXE.parent/'levels'/SCRIPT['source']).read_bytes()).hexdigest()==SCRIPT['sha256']
AI=0x89d1c8+2*0xc65
PROGRAM,PERSON,STACK,STOP=0x2000000,0x2008000,0x201d000,0x201e000
ATTR=0x9607ea+2*48
class Probe:
    def __init__(self):
        self.cpu,_=native_cpu(EXE);self.cpu.mem_map(PROGRAM,0x20000)
        self.cpu.mem_write(AI,bytes(0xc65));self.write(AI+0xc22,'B',2)
        self.write(0x89d178,'I',0x12345678)
    def write(self,address,fmt,*values):self.cpu.mem_write(address,struct.pack('<'+fmt,*values))
    def read(self,address,fmt='I'):return struct.unpack('<'+fmt,self.cpu.mem_read(address,struct.calcsize('<'+fmt)))[0]
    def call(self,address,*args):
        self.write(STACK,'I'*(len(args)+1),STOP,*args);self.cpu.reg_write(UC_X86_REG_ESP,STACK)
        self.cpu.emu_start(address,STOP,count=2000000)
        assert self.cpu.reg_read(UC_X86_REG_EIP)==STOP
    def return_value(self,value):
        sp=self.cpu.reg_read(UC_X86_REG_ESP);self.cpu.reg_write(UC_X86_REG_EAX,value&0xffffffff)
        self.cpu.reg_write(UC_X86_REG_EIP,self.read(sp));self.cpu.reg_write(UC_X86_REG_ESP,sp+4)
    def shaman(self):
        self.write(AI+0x89d,'I',PERSON)
        self.write(PERSON+0x24,'H',1);self.write(PERSON+0x2a,'BBB',1,7,17)
        self.write(PERSON+0x2f,'B',2)

results={}
rows=[]
for turn,population,temples,attribute in [(29,15,1,1),(30,14,1,1),(30,15,1,1),
                                        (30,15,0,1),(30,15,1,2),(62,15,1,1)]:
    p=Probe();codes=[12,1003,*SCRIPT['codes'][768:796],1004,1019]
    blob=bytearray(12552);struct.pack_into('<'+'H'*len(codes),blob,0,*codes)
    for i,field in enumerate(SCRIPT['fields']):struct.pack_into('<Ii',blob,8192+i*8,*field)
    p.cpu.mem_write(PROGRAM,bytes(blob));p.write(0x89d188,'I',turn)
    p.write(ATTR+2,'B',attribute);p.write(AI+0x59a,'I',0xffff)
    p.write(AI+0x74,'I',1);p.write(AI+0x85,'B',2);p.write(AI+0x78,'H',6)
    def internal(*_):
        field=p.read(p.cpu.reg_read(UC_X86_REG_ESP)+12)
        if p.read(field)==2:
            value=p.read(field+4,'i')
            if value in (1,1070):p.return_value(population if value==1 else temples)
    p.cpu.hook_add(UC_HOOK_CODE,internal,begin=0x48f350,end=0x48f350)
    p.call(0x48c6b0,AI,PROGRAM)
    due=((turn+2)&31)==0
    expected_attribute=0 if due and temples>0 and attribute==1 else attribute
    expected_states=0xfffb if due and population>14 else 0xffff
    assert p.read(ATTR+2,'B')==expected_attribute
    assert p.read(AI+0x59a)==expected_states
    assert p.read(AI+0x74)==1 and p.read(AI+0x78,'H')==6
    assert p.read(0x89d178)==0x12345678
    rows.append(dict(turn=turn,population=population,temples=temples,attributeBefore=attribute,
                     attributeAfter=expected_attribute,states=expected_states,existingTaskPhase=6))
results['script']=rows

rows=[]
for wild_count,states,existing in [(0,4,False),(1,0,False),(1,4,True),(1,4,False),(20,4,False)]:
    p=Probe();p.write(0x89bc76,'I',wild_count);p.write(AI+0x59a,'I',states)
    if existing:p.write(AI+0x74+82,'I',1);p.write(AI+0x85+82,'B',2)
    p.call(0x4e5900,AI,0)
    allocated=wild_count>0 and bool(states&4) and not existing
    assert bool(p.cpu.reg_read(UC_X86_REG_EAX))==allocated
    assert bool(p.read(AI+0x74)&1)==allocated
    if allocated:assert [p.read(AI+0x85,'B'),p.read(AI+0x78,'H')]==[2,0]
    assert p.read(0x89d178)==0x12345678
    rows.append(dict(wildCount=wild_count,states=states,existingType2=existing,allocated=allocated))
results['producer']=rows

rows=[]
for states in [0,4]:
    p=Probe();p.shaman();p.write(AI+0x59a,'I',states)
    p.write(AI+0x74,'I',1);p.write(AI+0x85,'B',2);p.write(AI+0x78,'H',6)
    p.call(0x4623e0,AI)
    assert p.read(AI+0x78,'H')==7 and p.read(AI+0x74)==1
    assert p.read(0x89d178)==0x12345678
    rows.append(dict(states=states,phaseBefore=6,phaseAfter=7,active=True))
results['activeTaskIgnoresAllocationState']=rows
p=Probe();p.shaman();p.write(AI+0x74,'I',1);p.write(AI+0x85,'B',2)
p.write(AI+0x596,'I',0x40);p.write(AI+0x5a6,'H',0x52dc)
p.call(0x4623e0,AI)
assert p.read(AI+0x78,'H')==2 and p.read(AI+0x36,'H')==0x52dc
assert not p.read(AI+0x596)&0x40 and p.read(0x89d178)==0x12345678
assert p.read(AI+0x38,'H')==0 and p.read(AI+0x3a,'H')==360 and p.read(AI+0x40,'B')==20
results['markerOverride']={'phase':2,'target':p.read(AI+0x36,'H'),'timer':p.read(AI+0x3a,'H')}
print(json.dumps(results,indent=2))
print('PASS:6 script gates,5 native producer cases,2 active-task OFF boundaries and marker phase0')

# Actual initializer/producer dispatcher wiring, without leaf interception.
p=Probe();p.call(0x461d70,AI)
assert p.read(AI+0x372+20)==0x4e5900
p.write(AI+0x59a,'I',4);p.write(0x89bc76,'I',1)
p.call(0x4625e0,AI)
assert [p.read(AI+0x85,'B'),p.read(AI+0x78,'H'),p.read(AI+0x74)]==[2,0,1]
assert p.read(0x89d178)==0x12345678
print('PASS:native initializer installs004e5900 and actual producer dispatcher allocates type2')
