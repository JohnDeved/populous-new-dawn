"""Execute original ordinary/construction renderers with a controlled triangle.
Projection, winding and polygon allocation run unchanged; no callee stubs.
Usage: python scripts/check-native-model-facing.py /path/to/d3dpoptb.exe [--record]
"""
import json,struct,sys
from pathlib import Path
from unicorn.x86_const import UC_X86_REG_ESP,UC_X86_REG_EIP,UC_X86_REG_FPCW
from decomp import native_cpu, ROOT
cpu,identity=native_cpu(Path(sys.argv[1]));cpu.mem_map(0x2000000,0x1000000)
unit,obj,face,points,camera,ui,pool,stack,stop=0x2000000,0x2010000,0x2020000,0x2030000,0x2040000,0x2050000,0x2400000,0x2ffd000,0x2ffe000
cpu.reg_write(UC_X86_REG_FPCW,0x27f)
def write(a,f,*v):cpu.mem_write(a,struct.pack('<'+f,*v))
def read(a,f):return struct.unpack('<'+f,cpu.mem_read(a,struct.calcsize('<'+f)))[0]
def call(a,*args):
 write(stack,'I'*(len(args)+1),stop,*args);cpu.reg_write(UC_X86_REG_ESP,stack);cpu.emu_start(a,stop,count=1000000)
 assert cpu.reg_read(UC_X86_REG_EIP)==stop,hex(cpu.reg_read(UC_X86_REG_EIP))
# Synthetic fixture owns one triangle; the original renderers consume the normal
# object/face/point records and original palette/projection/queue code unchanged.
write(obj+2,'hh',1,3);write(obj+12,'i',256);write(obj+16,'II',face,face);write(obj+24,'II',points,points)
write(face+6,'BB',3,1);write(face+40,'4h',0,1,2,0);write(face+59,'B',15)
write(0x895ec1,'I',obj);write(0x895ec5,'I',face);write(0x74a350,'I',camera);write(0xafc2f4,'I',ui)
write(0x75d504,'I',pool+65536);write(camera+0x2a,'i',65536)
write(0x74a354,'9i',16384,0,0,0,16384,0,0,0,16384)
for address,value in [(0x87ca5c,0),(0x87ca64,4096),(0x87ca68,12)]:write(address,'i',value)
write(0x87ca90,'hh',1240,1000);write(0x87caa4,'hh',620,500)
write(ui+0xcf8,'ii',4,4);write(ui+0xd00,'ff',.0625,.0625)
call(0x401040)
triangles=[ [[-120,0,0],[120,0,0],[0,120,0]],
            [[-120,0,0],[0,120,0],[120,0,0]],
            [[-120,0,0],[120,0,0],[0,120,240]],
            [[-120,0,0],[0,120,240],[120,0,0]] ]
cases=[]
tribe_tile=next(i for i in range(256) if read(0x5aa218+i,'B')&1)
for stage in range(5):
 for tribal in (False,True):
  write(obj+8,'H',int(tribal));write(face+2,'h',tribe_tile if tribal else 0)
  for raw in triangles:
   cpu.mem_write(unit,bytes(256));write(unit+0x24,'H',1);write(unit+0x2a,'B',2);write(unit+0x78,'B',stage)
   for i,p in enumerate(raw):write(points+i*6,'hhh',*p)
   write(0x75d508,'I',pool);call(0x4708d0 if stage==4 else 0x471c40,unit)
   count=(read(0x75d508,'I')-pool)//70
   projected=[list(struct.unpack('<ff',cpu.mem_read(0x74daf8+i*32+12,8))) for i in range(3)]
   a,b,c=projected;area=(b[0]-a[0])*(c[1]-b[1])-(b[1]-a[1])*(c[0]-b[0])
   assert count==int(stage<4 or area>0),(stage,raw,count,area)
   cases.append(dict(stage=stage,tribal=tribal,raw=raw,projected=projected,submitted=count))
fixture=dict(executableSha256=identity['sha256'],cases=cases)
if '--record' in sys.argv:(ROOT/'tests/fixtures/model-facing.json').write_text(json.dumps(fixture,separators=(',',':'))+'\n')
print(f'PASS: {len(cases)} complete original renderer calls without callee stubs: ordinary models cull rear triangles, all construction stages retain both windings; real camera projection and queued triangles inspected')
