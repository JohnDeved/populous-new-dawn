"""Compare complete original building graphic selection and exact RNG consumption.
Usage: python scripts/check-native-building-objects.py /path/to/d3dpoptb.exe
"""
import json,random,struct,subprocess,sys
from pathlib import Path
from unicorn.x86_const import UC_X86_REG_ESP,UC_X86_REG_EIP
from decomp import native_cpu,ROOT
cpu,_=native_cpu(Path(sys.argv[1]));cpu.mem_map(0x2000000,0x20000)
unit,stack,stop=0x2000000,0x201d000,0x201e000
rng=random.Random(0x40b170);cases=[];expected=[]
for model in range(20):
 for tribe in [0,1,2,3,128,255]:
  for _ in range(16):
   seed=rng.randrange(0x100000000)
   cpu.mem_write(unit,bytes(256));cpu.mem_write(unit+0x2b,bytes([model]));cpu.mem_write(unit+0x2f,bytes([tribe]))
   cpu.mem_write(0x89d178,struct.pack('<I',seed))
   cpu.mem_write(stack,struct.pack('<II',stop,unit));cpu.reg_write(UC_X86_REG_ESP,stack)
   cpu.emu_start(0x40b170,stop,count=10000);assert cpu.reg_read(UC_X86_REG_EIP)==stop
   cases.append([model,tribe,seed]);expected.append(dict(object=struct.unpack('<h',cpu.mem_read(unit+99,2))[0],randomState=struct.unpack('<I',cpu.mem_read(0x89d178,4))[0]))
js="import {chooseBuildingObject} from './app/building-shapes.ts';let s='';for await(const c of process.stdin)s+=c;console.log(JSON.stringify(JSON.parse(s).map(([model,tribe,seed])=>{const rng={randomState:seed};const object=chooseBuildingObject(model,tribe,rng);return {object,...rng}})))"
r=subprocess.run(['node','--input-type=module','-e',js],input=json.dumps(cases),capture_output=True,text=True,cwd=ROOT)
assert r.returncode==0,r.stderr
for c,a,b in zip(cases,expected,json.loads(r.stdout)):assert a==b,(c,a,b)
print('PASS:',len(cases),'complete native building-object selections: all 20 models, all tribes/signed owners, three hut families, exact RNG and non-random branches')
