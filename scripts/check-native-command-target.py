"""Check contextual target identity through original hover, input and order encoding.
Usage: python scripts/check-native-command-target.py EXE [--record]
Native classification/priority/eligibility/encoding run. UI, voice and final command
transport are intercepted; this does not execute command queue ownership or combat.
"""
import json, struct, sys
from pathlib import Path
from unicorn import UC_HOOK_CODE
from unicorn.x86_const import UC_X86_REG_ESP, UC_X86_REG_EIP, UC_X86_REG_EAX
from decomp import native_cpu, load_native_shapes, ROOT
exe=Path(sys.argv[1]);cpu,identity=native_cpu(exe);cpu.mem_map(0x2000000,0x100000)
load_native_shapes(cpu,exe,0x2020000,0x2030000)
people,tribe,stack,stop=0x2000000,0x89d1c8,0x20fd000,0x20fe000
write=lambda a,f,*v:cpu.mem_write(a,struct.pack('<'+f,*v))
read=lambda a,f:struct.unpack('<'+f,cpu.mem_read(a,struct.calcsize('<'+f)))[0]
packets=[]
def consumer(c,a,size,user):
 sp=c.reg_read(UC_X86_REG_ESP)
 if a==0x479cf0:packets.append(list(struct.unpack('<4I',c.mem_read(sp+4,16))))
 c.reg_write(UC_X86_REG_EAX,0);c.reg_write(UC_X86_REG_EIP,read(sp,'I'));c.reg_write(UC_X86_REG_ESP,sp+4)
for a in [0x479cf0,0x47a550,0x48a050]:cpu.hook_add(UC_HOOK_CODE,consumer,begin=a,end=a)
def call(a,*args):
 write(stack,'I'*(len(args)+1),stop,*args);cpu.reg_write(UC_X86_REG_ESP,stack);cpu.emu_start(a,stop,count=1000000)
 assert cpu.reg_read(UC_X86_REG_EIP)==stop,hex(cpu.reg_read(UC_X86_REG_EIP))
cases=[]
for player in [0,1]:
 tribe=0x89d1c8+player*0xc65
 for selected in [2,3,7]:
  for building_owner in [0,1]:
   for clicked, friendly in [(20,False),(30,False),(31,False),(31,True)]:
    for category in [0,1,6]:
     cpu.mem_write(tribe,bytes(0xc65));cpu.mem_write(0x8a03e4,bytes(16384*16))
     for id,cls,model,owner in [(10,1,selected,player),(20,2,1,building_owner),(30,1,2,1-player),(31,1,3,player if friendly else 1-player)]:
      p=people+id*256;cpu.mem_write(p,bytes(256));write(0x890390+id*4,'I',p)
      write(p+0x24,'H',id);write(p+0x2a,'BBB',cls,model,2 if cls==2 else 19);write(p+0x2f,'b',owner)
      write(p+0x3d,'HHh',8192,8192,100);write(p+0x6c,'h',1000)
     write(people+20*256+0x33,'H',107);write(people+20*256+0x7a,'HH',8192,8192)
     write(people+10*256+0x7a,'B',128);write(tribe+0x881,'I',people+10*256);write(tribe+0x8c0,'B',category)
     write(0x8a03e4+(16*128+16)*16,'I',512);write(0x8a03e4+(16*128+16)*16+8,'H',20)
     write(0x87cac2,'H',clicked if clicked!=20 else 0);write(0x87cace,'H',20 if clicked==20 else 0)
     write(0x89c6f0,'B',player);write(0x895e9c,'B',1);write(0x895e9d,'B',0);write(0x895ea0,'B',3)
     write(0x5cae80,'i',-1);write(0x5cae74,'B',0);write(0x87caba,'I',0x12020)
     # Automatic contextual command choice, without retaining a manual wheel choice.
     write(0x89c665,'I',0x20000);write(0x98e908,'H',0)
     call(0x437010,1)
     model,target,enabled=read(0x895ea0,'B'),read(0x895e7e,'I'),read(0x895e9b,'B')
     assert enabled,(selected,building_owner,clicked,model,target,enabled)
     resolved=20 if friendly else clicked
     if model==19:
      assert read(0x895e82,'I')==resolved and target==0
     else:assert target==resolved
 
     packets.clear();call(0x4aa8b0,0,0,0)
     assert len(packets)==1
     owner,command,payload,point=packets[0]
     assert owner==player and command==0x57+category and payload==(target<<16)|model
     # The existing native order encoder consumes the exact transported identity.
     call(0x435780,tribe,category,model,payload>>16,point&65535,0)
     encoded=tribe+0x8c1+category*10
     assert read(encoded+6,'H')==(point&65535 if model==19 else resolved)
     cases.append(dict(player=player,selected=selected,buildingOwner=building_owner,clicked=clicked,friendly=friendly,resolved=resolved,category=category,model=model,target=target,packet=packets[0]))
print(f'PASS: {len(cases)} complete native contextual classifications, command transports and encodings preserve direct person/friendly-building IDs and original enemy-building area encoding')
if '--record' in sys.argv:
 (ROOT/'tests/fixtures/command-target.json').write_text(json.dumps(dict(executableSha256=identity['sha256'],cases=cases),separators=(',',':'))+'\n')
