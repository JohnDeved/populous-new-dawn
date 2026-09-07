"""Compare browser terrain sampling and 3D steps with the original x86 routine in CPU emulation.
Usage: python scripts/check-native-math.py /path/to/d3dpoptb.exe
Requires unicorn==2.1.4 and Node. No Windows startup or OS calls are emulated.
"""
import json
from pathlib import Path
import random
import struct
import subprocess
import sys

from unicorn.x86_const import UC_X86_REG_ESP, UC_X86_REG_EIP, UC_X86_REG_EAX
from decomp import native_cpu

cpu, identity = native_cpu(Path(sys.argv[1]))
stack, point, stop = 0x2001000, 0x2002000, 0x2003000
cpu.mem_map(0x2000000, 0x4000)
rng = random.Random(1998)
cases = [dict(p=dict(x=32760, y=-32760, h=32760), yaw=yaw, pitch=pitch, length=length)
         for yaw in (0, 512, 1024, 1536, 2047, 4095)
         for pitch in (0, 1, 511, 512, 1024, 1536, 2047)
         for length in (0, 1, 70, 1000, -80, -321)]
cases += [dict(p=dict(x=rng.randrange(-32768, 32768), y=rng.randrange(-32768, 32768),
                     h=rng.randrange(-32768, 32768)),
               yaw=rng.randrange(4096), pitch=rng.randrange(4096), length=rng.randrange(-32768, 32768))
          for _ in range(256)]
expected = []
for case in cases:
    cpu.mem_write(point, struct.pack('<hhh', *case['p'].values()))
    cpu.mem_write(stack, struct.pack('<IIIII', stop, point, case['yaw'], case['pitch'], case['length'] & 0xffffffff))
    cpu.reg_write(UC_X86_REG_ESP, stack)
    cpu.emu_start(0x4e6ac0, stop, timeout=100000, count=1000)
    assert cpu.reg_read(UC_X86_REG_EIP) == stop, 'Native routine failed to return'
    expected.append(dict(zip(('x', 'y', 'h'), struct.unpack('<hhh', cpu.mem_read(point, 6)))))
js = "import {nativeStep3D} from './app/model.ts';let s='';for await(const c of process.stdin)s+=c;console.log(JSON.stringify(JSON.parse(s).map(c=>nativeStep3D(c.p,c.yaw,c.pitch,c.length))));"
result = subprocess.run(['node', '--input-type=module', '-e', js], input=json.dumps(cases),
                        text=True, capture_output=True, check=True, cwd=Path(__file__).resolve().parents[1])
actual = json.loads(result.stdout)
assert len(actual) == len(expected)
for case, want, got in zip(cases, expected, actual):
    assert got == want, (case, want, got)
print(f'PASS: {len(cases)} native x86/browser projectile steps; SHA256 {identity["sha256"]}')

# Run the original tile flag setter up to its flag write, before shadow/cliff processing.
# Then call the complete calc_point_height against the same native terrain cells.
terrain_cases = []
for corners in ([0,0,0,0], [0,0,0,1], [0,1,1,0], [1,0,0,1], [0,2,1,0],
                [-32768,32767,32767,-32768], [300,700,900,100]):
    for ix, iy in ((3,5),(127,0),(0,127),(127,127)):
        for fx, fy in ((0,0),(1,1),(255,257),(256,256),(511,511),(509,13)):
            terrain_cases.append(dict(corners=corners,x=ix*512+fx,y=iy*512+fy))
terrain_cases += [dict(corners=[rng.randrange(-32768,32768) for _ in range(4)],
                      x=rng.randrange(65536),y=rng.randrange(65536)) for _ in range(512)]
terrain_expected = []
for case in terrain_cases:
    ix,iy = case['x']>>9,case['y']>>9
    indices = [iy*128+ix,iy*128+((ix+1)&127),((iy+1)&127)*128+ix,((iy+1)&127)*128+((ix+1)&127)]
    for index,h in zip(indices,case['corners']):
        cpu.mem_write(0x8a03e4+index*16,struct.pack('<Ih',0,h))
    cpu.mem_write(0x6906d8,struct.pack('<I',1))
    cpu.mem_write(0x690ae8,struct.pack('<H',ix*2 | (iy*2)<<8))
    cpu.reg_write(UC_X86_REG_ESP,stack)
    cpu.emu_start(0x44df40,0x44e202,timeout=100000,count=1000)
    assert cpu.reg_read(UC_X86_REG_EIP)==0x44e202,'Native tile flag write not reached'
    cross=bool(cpu.mem_read(0x8a03e4+indices[0]*16,1)[0]&1)
    cpu.mem_write(stack,struct.pack('<III',stop,case['x'],case['y']))
    cpu.reg_write(UC_X86_REG_ESP,stack)
    cpu.emu_start(0x44e940,stop,timeout=100000,count=1000)
    assert cpu.reg_read(UC_X86_REG_EIP)==stop,'Native height routine failed to return'
    h=cpu.reg_read(UC_X86_REG_EAX)&65535
    terrain_expected.append(dict(cross=cross,height=h if h<32768 else h-65536))
js = """import {nativeTerrainCross,nativeTerrainHeight} from './app/model.ts';
let s='';for await(const c of process.stdin)s+=c;
console.log(JSON.stringify(JSON.parse(s).map(({corners,x,y})=>{
 const ix=x>>9,iy=y>>9,t=Array(16384).fill(0);
 [iy*128+ix,iy*128+((ix+1)&127),((iy+1)&127)*128+ix,((iy+1)&127)*128+((ix+1)&127)].forEach((i,j)=>t[i]=corners[j]);
 return {cross:nativeTerrainCross(...corners),height:nativeTerrainHeight(t,x,y)};
})));"""
result=subprocess.run(['node','--input-type=module','-e',js],input=json.dumps(terrain_cases),
                      text=True,capture_output=True,check=True,cwd=Path(__file__).resolve().parents[1])
actual=json.loads(result.stdout)
assert len(actual)==len(terrain_expected)
for case,want,got in zip(terrain_cases,terrain_expected,actual):
    assert got==want,(case,want,got)
print(f'PASS: {len(terrain_cases)} native x86/browser terrain flags and heights (including seams, ties and signed limits)')
