"""Compare object-bank selection and signed-coordinate morphing with original x86.
Usage: python scripts/check-native-models.py /path/to/d3dpoptb.exe
"""
import importlib.util
import json
from pathlib import Path
import random
import struct
import subprocess
import sys
from unicorn import UC_HOOK_CODE
from unicorn.x86_const import UC_X86_REG_ESP, UC_X86_REG_EIP
from decomp import native_cpu

root = Path(__file__).resolve().parents[1]
cpu, _ = native_cpu(Path(sys.argv[1]))
cpu.mem_map(0x2000000, 0x20000)
stack, stop = 0x201d000, 0x201e000
def call(address, *args):
    cpu.mem_write(stack, struct.pack('<'+'I'*(len(args)+1), stop, *args))
    cpu.reg_write(UC_X86_REG_ESP, stack)
    cpu.emu_start(address, stop, timeout=100000, count=100000)
    assert cpu.reg_read(UC_X86_REG_EIP) == stop

selected = []
def load_bank(cpu, address, size, user):
    sp = cpu.reg_read(UC_X86_REG_ESP)
    selected.append(cpu.mem_read(sp+4, 1)[0])
    cpu.reg_write(UC_X86_REG_EIP, struct.unpack('<I', cpu.mem_read(sp,4))[0])
    cpu.reg_write(UC_X86_REG_ESP, sp+4)
hook = cpu.hook_add(UC_HOOK_CODE, load_bank, begin=0x40c690, end=0x40c690)
spec = importlib.util.spec_from_file_location('assets', root/'scripts/import-original.py')
assets = importlib.util.module_from_spec(spec);spec.loader.exec_module(assets)
for requested in range(256):
    call(0x40c670, requested)
    assert selected[-1] == assets.resolve_object_bank(requested)
cpu.hook_del(hook)
print('PASS: all 256 native object-bank selections match the importer')

objects, points = 0x2000000, 0x2001000
for i in range(3):
    cpu.mem_write(objects+i*64, bytes(64))
    cpu.mem_write(objects+i*64+4, struct.pack('<h',1))
    cpu.mem_write(objects+i*64+24, struct.pack('<I',points+i*8))
rng = random.Random(192)
cases = [(a,b,t,40) for a,b in [(0,7),(-7,7),(32767,-32768),(-32768,32767)] for t in range(41)]
cases += [(rng.randint(-32768,32767),rng.randint(-32768,32767),rng.randrange(101),100) for _ in range(256)]
# Include every rendered source coordinate and all frames of the real vault doors.
models = json.loads((root/'app/original-models.json').read_text())
for source,target in ((154,153),(153,155)):
    a,b=models[str(source)],models[str(target)]
    assert a['scale']==b['scale'] and len(a['p'])==len(b['p'])
    for x,y in set(zip(a['p'],b['p'])):
        for t in range(41):cases.append((round(x*a['scale']*3),round(y*b['scale']*3),t,40))
expected=[]
for a,b,frame,duration in cases:
    cpu.mem_write(points+8,struct.pack('<3h',a,a,a));cpu.mem_write(points+16,struct.pack('<3h',b,b,b))
    call(0x40cc60,objects,objects+64,objects+128,frame,duration)
    expected.append(struct.unpack('<h',cpu.mem_read(points,2))[0])
js="""import {morphCoordinate} from './app/morph.ts';
let s='';for await(const c of process.stdin)s+=c;
console.log(JSON.stringify(JSON.parse(s).map(c=>morphCoordinate(...c))));"""
r=subprocess.run(['node','--input-type=module','-e',js],input=json.dumps(cases),cwd=root,text=True,capture_output=True)
assert r.returncode==0,r.stderr
actual=json.loads(r.stdout);assert len(actual)==len(expected)
for case,want,got in zip(cases,expected,actual):assert want==got,(case,want,got)
print(f'PASS: {len(cases)} native morph coordinates, including all vault door frames')
