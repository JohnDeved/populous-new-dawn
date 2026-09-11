"""Compare the complete outdoor automatic command priority in 0x437750.
Usage: python scripts/check-native-command-context.py EXE [--record]
No native calls are intercepted. Manual-wheel retention and all-inside selection
are deliberately excluded; this checks choice, not eligibility or execution.
"""
import json,random,struct,subprocess,sys
from pathlib import Path
from unicorn.x86_const import UC_X86_REG_ESP,UC_X86_REG_EIP
from decomp import native_cpu,ROOT
cpu,identity=native_cpu(Path(sys.argv[1]));cpu.mem_map(0x2000000,0x10000)
write=lambda a,f,v:cpu.mem_write(a,struct.pack('<'+f,v))
read=lambda a,f:struct.unpack('<'+f,cpu.mem_read(a,struct.calcsize('<'+f)))[0]
rng=random.Random(0x437750);cases=[]
contexts=[0]+[1<<bit for bit in range(25)]+[rng.getrandbits(25) for _ in range(1024)]
for flags in contexts:
 for people in [4,8,16,32,64,128,252,rng.randrange(64)<<2]:
  write(0x89c6f0,'B',0);write(0x89c665,'I',0x20000)
  write(0x89d1c8+0x93d,'I',0);write(0x89d1c8+0xc23,'B',people)
  write(0x895e7a,'I',flags);write(0x895e9d,'B',0);write(0x895ea0,'B',3)
  write(0x200f000,'I',0x200ff00);cpu.reg_write(UC_X86_REG_ESP,0x200f000)
  cpu.emu_start(0x437750,0x200ff00,count=100000)
  assert cpu.reg_read(UC_X86_REG_EIP)==0x200ff00
  assert read(0x895e9f,'B')==1 and read(0x895e9d,'B')==0
  cases.append(dict(flags=flags,people=people,model=read(0x895ea0,'B')))
js="""import {chooseContextCommand} from './app/command-context.ts';let text='';for await(const chunk of process.stdin)text+=chunk;console.log(JSON.stringify(JSON.parse(text).map(c=>chooseContextCommand(c.flags,c.people))));"""
actual=json.loads(subprocess.check_output(['node','--input-type=module','-e',js],input=json.dumps(cases).encode(),cwd=ROOT))
for c,a in zip(cases,actual):assert a==c['model'],(c,a)
print(f'PASS: {len(cases)} complete native automatic outdoor contextual priorities, single/mixed classes and interacting flags')
if '--record' in sys.argv:
 # Keep all individual flag/class cases plus a reproducible mixed sample.
 fixture=cases[:216]+cases[216::32]
 (ROOT/'tests/fixtures/command-context.json').write_text(json.dumps(dict(executableSha256=identity['sha256'],cases=fixture),separators=(',',':'))+'\n')
