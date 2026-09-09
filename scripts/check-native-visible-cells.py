"""Capture native ground-cell traversal, before object and terrain raster consumers.
Usage: python scripts/check-native-visible-cells.py EXE [--record]
Runs 00467130 through its setup/row loop and complete 0046d070 cell traversal.
Projection and object consumers are intercepted; stops before frame postprocessing.
"""
import json,random,struct,subprocess,sys
from pathlib import Path
from unicorn import UC_HOOK_CODE
from unicorn.x86_const import UC_X86_REG_ESP,UC_X86_REG_EIP
from decomp import native_cpu,ROOT
cpu,identity=native_cpu(Path(sys.argv[1]));cpu.mem_map(0x2000000,0x20000)
tribe,config,stack,stop=0x2000000,0x2001000,0x201f000,0x201ff00
write=lambda a,f,*v:cpu.mem_write(a,struct.pack('<'+f,*v))
read=lambda a,f:struct.unpack('<'+f,cpu.mem_read(a,struct.calcsize('<'+f)))[0]
def call(address,*args):
 write(stack,'I'*(len(args)+1),stop,*args);cpu.reg_write(UC_X86_REG_ESP,stack)
 cpu.emu_start(address,stop,count=2000000)
 assert cpu.reg_read(UC_X86_REG_EIP)==stop,hex(cpu.reg_read(UC_X86_REG_EIP))
visited=[]
def consumer(c,address,size,u):
 sp=c.reg_read(UC_X86_REG_ESP)
 if address==0x46ec80:visited.append((read(sp+4,'I')-0x8a03e4)//16)
 c.reg_write(UC_X86_REG_EIP,read(sp,'I'));c.reg_write(UC_X86_REG_ESP,sp+4)
for a in [0x46ec80,0x46cb90]:cpu.hook_add(UC_HOOK_CODE,consumer,begin=a,end=a)
def finish(c,a,size,u):c.reg_write(UC_X86_REG_EIP,stop)
cpu.hook_add(UC_HOOK_CODE,finish,begin=0x467289,end=0x467289)
write(0x74a350,'I',tribe);write(0x74a2f8,'I',1);write(0x89bb81,'B',2)
write(0x895da4,'I',0);write(0x895da8,'I',8);write(0x5aa328,'B',0x3e)
# Every cell has an object. The land-only branch skips polygon consumers.
cpu.mem_write(0x8a03e4,struct.pack('<IhH8x',0,0,1)*16384)
views=json.loads((ROOT/'app/original-camera.json').read_text())['views']
rng=random.Random(0x467130);cases=[]
for n in range(64):
 index=n%4;preset=[0,2,3,4][n//4%4];v=views[index*5+preset]
 cx,cy=[rng.choice([0,1,511,512,65535,rng.randrange(65536)]) for _ in range(2)]
 heading=[0,1,255,512,768,1024,1536,2047][n//8]
 write(tribe+0x24,'HH',cx,cy);write(tribe+0x32,'H',heading)
 write(config+48,'hh',v['width'],v['height']);call(0x416e50,config)
 if v['boundsMode']==1:call(0x46e510,config)
 else:call(0x46e450,v['diameter'])
 spans=[list(p) for p in struct.iter_unpack('<hh',cpu.mem_read(0x760d10,888))]
 visited=[];call(0x467130)
 cases.append(dict(center=[cx,cy],heading=heading,spans=spans,visible=sorted(set(visited))))
js="""import {meshCellVisible} from './app/projection.ts';let s='';for await(const c of process.stdin)s+=c;
console.log(JSON.stringify(JSON.parse(s).map(c=>{const result=[];for(let i=0;i<16384;i++){
 if(meshCellVisible(c.spans,{x:(i&127)*512,y:(i>>7)*512},{x:c.center[0],y:c.center[1]}))result.push(i);
}return result;})));"""
r=subprocess.run(['node','--input-type=module','-e',js],input=json.dumps(cases),capture_output=True,text=True,cwd=ROOT);assert r.returncode==0,r.stderr
actual=json.loads(r.stdout)
for i,(a,c) in enumerate(zip(actual,cases)):assert a==c['visible'],(i,len(a),len(c['visible']),list(set(a)^set(c['visible']))[:12])
fixture=ROOT/'tests/fixtures/visible-cells.json'
result=dict(executableSha256=identity['sha256'],cases=cases)
if '--record' in sys.argv:fixture.write_text(json.dumps(result,separators=(',',':'))+'\n')
else:assert json.loads(fixture.read_text())==result
print(f'PASS: 64 native ground traversals, {sum(len(c["visible"]) for c in cases):,} visited cells; all 1,048,576 cell-membership decisions match across bounds, headings and toroidal centers')
