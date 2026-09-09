"""Compare English glyph selection/advances and desktop HUD coordinate scaling.
Only the final glyph raster consumer (0x459d00) is supplied.
Usage: python scripts/check-native-hud.py /path/to/d3dpoptb.exe [--record]
"""
import json,struct,subprocess,sys
from pathlib import Path
from unicorn import UC_HOOK_CODE
from unicorn.x86_const import UC_X86_REG_ESP,UC_X86_REG_EIP,UC_X86_REG_EAX
from decomp import native_cpu,ROOT
exe=Path(sys.argv[1]);cpu,identity=native_cpu(exe);cpu.mem_map(0x2000000,0x100000)
stack,stop,descriptor,sprite,entries=0x200e000,0x200f000,0x2010000,0x2010100,0x2020000
write=lambda a,f,*v:cpu.mem_write(a,struct.pack('<'+f,*v))
read=lambda a:struct.unpack('<I',cpu.mem_read(a,4))[0]
write(0xa6904c,'I',descriptor);write(descriptor+32,'I',sprite);write(sprite+12,'I',entries);write(0x89bc6a,'B',0)
def consume(c,a,size,user):
 sp=c.reg_read(UC_X86_REG_ESP);calls.append((read(sp+4),read(sp+8),(read(sp+12)-entries)//8));c.reg_write(UC_X86_REG_EIP,read(sp));c.reg_write(UC_X86_REG_ESP,sp+4)
cpu.hook_add(UC_HOOK_CODE,consume,begin=0x459d00,end=0x459d00)
expected=[];cases=[]
for font in [0,2]:
 raw=(exe.parent/f'data/font{font}-0.dat').read_bytes();count=struct.unpack_from('<I',raw,4)[0];write(sprite+16,'I',count)
 for i in range(count):
  w,h,p=struct.unpack_from('<HHI',raw,8+i*8);write(entries+i*8,'IHH',p,w,h)
 for code in [*range(300),511,1024,65535]:
  calls=[];write(stack,'IIII',stop,23,47,code);cpu.reg_write(UC_X86_REG_ESP,stack);cpu.emu_start(0x4fe270,stop,count=1000);assert cpu.reg_read(UC_X86_REG_EIP)==stop
  assert len(calls)==1 and calls[0][:2]==(23,47)
  expected.append([f'font{font}-{calls[0][2]}',cpu.reg_read(UC_X86_REG_EAX)]);cases.append([font,code])
js="""import {hudGlyph} from './app/hud-font.ts';import native from './app/original-hud.json' with {type:'json'};let s='';for await(const b of process.stdin)s+=b;console.log(JSON.stringify(JSON.parse(s).map(([font,code])=>{const id=hudGlyph(code,font);return [id,native.rects[id].w];})));"""
out=subprocess.check_output(['node','--input-type=module','-e',js],input=json.dumps(cases).encode(),cwd=ROOT)
assert json.loads(out)==expected
print(f'PASS: {len(cases)} native English glyph selections and advances, both bitmap fonts and boundary codes; only final raster consumer supplied')

# The HUD scales normalized X and Y independently, including widescreen modes.
# Logical control placement is supplied; these are the final coordinate converters.
scales=[]
for width,height in [(640,480),(1024,768),(1280,720),(1280,960),(1440,1000),(1920,1080),(2560,1440),(3440,1440)]:
 write(0x89c6cf,'HH',width,height)
 bounds=[]
 for axis,value in [(0,0),(1,0),(0,100),(1,480),(0,64),(1,126),(0,10),(1,22)]:
  normalized=round(value*65536/(640 if axis==0 else 480))
  write(stack,'II',stop,normalized);cpu.reg_write(UC_X86_REG_ESP,stack)
  cpu.emu_start(0x44a1f0 if axis==0 else 0x44a210,stop,count=100)
  assert cpu.reg_read(UC_X86_REG_EIP)==stop
  result=cpu.reg_read(UC_X86_REG_EAX)
  assert abs(result-value*(width/640 if axis==0 else height/480))<=1
  bounds.append(result)
 scales.append(dict(width=width,height=height,sidebar=bounds[:4],health=bounds[4:]))
fixture=dict(executableSha256=identity['sha256'],cases=scales)
path=ROOT/'tests/fixtures/hud-scale.json'
if '--record' in sys.argv:path.write_text(json.dumps(fixture,separators=(',',':'))+'\n')
else:assert json.loads(path.read_text())==fixture
print('PASS: 64 native HUD coordinate conversions across eight desktop sizes; logical placement and fixed-point input normalization supplied')
