"""Verify the supplied first mission's fog setting through native load instructions.
Usage: python scripts/check-native-first-mission-fog.py EXE EXTRACTED_LEVELS
Executes the argument-forwarding span 00410da2..00410dc1, then loader selection
0042b286..0042b2a7 including complete 00443910. This is not a full level-loader
emulation: file I/O, campaign setup, object allocation and reveal are outside it.
"""
import hashlib,json,random,struct,subprocess,sys
from pathlib import Path
from unicorn.x86_const import UC_X86_REG_ESP,UC_X86_REG_EIP
from decomp import native_cpu,ROOT
cpu,_=native_cpu(Path(sys.argv[1]));cpu.mem_map(0x2000000,0x10000)
stack=0x200f000
write=lambda a,f,*v:cpu.mem_write(a,struct.pack('<'+f,*v))
read=lambda a,f:struct.unpack('<'+f,cpu.mem_read(a,struct.calcsize('<'+f)))[0]
header=(Path(sys.argv[2])/'levl2001.hdr').read_bytes()
assert len(header)==616
cpu.mem_write(0x89b741,header)
cpu.reg_write(UC_X86_REG_ESP,stack)
cpu.emu_start(0x410da2,0x410dc1,count=1000)
assert cpu.reg_read(UC_X86_REG_EIP)==0x410dc1
sp=cpu.reg_read(UC_X86_REG_ESP)
arguments=list(struct.unpack('<III',cpu.mem_read(sp,12)))
assert arguments==list(header[96:99]),arguments
assert header[98]==0,'The supplied first mission header changed; reassess fog ownership'
rng=random.Random(0x443910);count=0
for flags in range(256):
 for load in [0,0x200,0xffffffff]:
  before=rng.randrange(1<<32);indicator=rng.randrange(256)
  write(0x895da8,'I',before);write(0x89c665,'I',load);write(0x96ead2,'B',indicator)
  write(stack+0x1c,'I',flags);cpu.reg_write(UC_X86_REG_ESP,stack)
  cpu.emu_start(0x42b286,0x42b2a7,count=1000)
  assert cpu.reg_read(UC_X86_REG_EIP)==0x42b2a7
  enabled=bool(flags&1)
  fog=enabled and not load&0x200
  expected=(before&~6)|(2 if enabled else 0)|(4 if fog else 0)
  assert read(0x895da8,'I')==expected,(flags,load)
  assert read(0x96ead2,'B')==(indicator&~1)|int(enabled)
  if flags==header[98]:assert not read(0x895da8,'I')&6
  count+=1
js="""import level from './app/level-one.ts';import {createWorld} from './app/model.ts';
console.log(JSON.stringify({headerSha256:level.headerSha256,landscape:level.landscapeBank,objects:level.objectBank,flags:createWorld().manaWorld.levelFlags}));"""
r=subprocess.run(['node','--input-type=module','-e',js],capture_output=True,text=True,cwd=ROOT);assert r.returncode==0,r.stderr
browser=json.loads(r.stdout)
assert browser['headerSha256']==hashlib.sha256(header).hexdigest()
assert arguments[:2]==[browser['landscape'],browser['objects']]
assert browser['flags']&6==0,'Live first mission must retain the original fog-free setting'
print(f'PASS: original first-mission header forwards banks/flags {arguments}; {count} native fog selections preserve unrelated flags and honor the load-option override; live first mission remains fog-free')
