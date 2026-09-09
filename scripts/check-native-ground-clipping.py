"""Compare 0x46d970, called by ordinary ground 0x46d070, with the shared TS gate.
Executes the original leaf without stubs, using float32 screen coordinates and
53-bit x87 precision. Special-land flag 8 and full ground queue ownership remain
separate. Usage: python scripts/check-native-ground-clipping.py d3dpoptb.exe
"""
import json, random, struct, subprocess, sys
from pathlib import Path
from unicorn.x86_const import UC_X86_REG_ESP, UC_X86_REG_EIP, UC_X86_REG_FPCW
from decomp import native_cpu, ROOT

cpu, identity = native_cpu(Path(sys.argv[1]))
cpu.mem_map(0x2000000, 0x10000)
points, result, stack, stop = 0x2000000, 0x2001000, 0x200f000, 0x200ff00
cpu.reg_write(UC_X86_REG_FPCW, 0x27f)
# Store the x87 return as a double; this is the caller, not a replacement callee.
cpu.mem_write(stop, b'\xdd\x1d' + struct.pack('<I', result))
rng = random.Random(0x46d970)
f32 = lambda value: struct.unpack('<f', struct.pack('<f', value))[0]
cases, expected = [], []
for width, height in [(640,480), (1920,1080), (3440,1440), (3840,2160)]:
    triangles = [
        [(-100,0),(-10,0),(-10,100)],
        [(width,0),(width+10,0),(width,100)],
        [(0,height),(100,height),(0,height+100)],
        [(0,-100),(100,-100),(0,-10)],
        [(0,0),(100,0),(0,100)],
        [(0,0),(0,100),(100,0)],
        [(0,0),(50,50),(100,100)],
    ]
    triangles += [[(rng.uniform(-width,width*2),rng.uniform(-height,height*2)) for _ in range(3)] for _ in range(256)]
    for _ in range(128):
        x, y = rng.uniform(-width,width*2), rng.uniform(-height,height*2)
        triangles.append([(x,y),(x+30,y+20),(x+60,y+40+rng.uniform(-.001,.001))])
    for triangle in triangles:
        projected = [dict(screenX=f32(x),screenY=f32(y)) for x,y in triangle]
        cpu.mem_write(0x87ca90, struct.pack('<HH',width,height))
        for i,p in enumerate(projected):
            cpu.mem_write(points+i*32+12,struct.pack('<ff',p['screenX'],p['screenY']))
        cpu.mem_write(stack,struct.pack('<IIII',stop,points,points+32,points+64))
        cpu.reg_write(UC_X86_REG_ESP,stack)
        cpu.emu_start(0x46d970,stop+6,count=10000)
        assert cpu.reg_read(UC_X86_REG_EIP)==stop+6
        expected.append(struct.unpack('<d',cpu.mem_read(result,8))[0] > 0)
        cases.append([projected,width,height])
run = subprocess.run(['node','--input-type=module','-e',
    "import {modelTriangleVisible} from './app/painter-order.ts';let input='';for await(const c of process.stdin)input+=c;console.log(JSON.stringify(JSON.parse(input).map(c=>modelTriangleVisible(...c))));"],
    cwd=ROOT,input=json.dumps(cases),text=True,capture_output=True)
assert run.returncode==0,run.stderr
actual=json.loads(run.stdout)
assert len(actual)==len(expected)
for i,(want,got) in enumerate(zip(expected,actual)):
    assert want==got,(cases[i],want,got)
print(f"PASS: {len(cases)} native ground/model clipping decisions, shared left/right/bottom rejection, retained top edge, both windings and near-degenerate triangles; executable {identity['sha256']}")
