"""Controlled original counter writer/reader; no game-play or kill simulation claim."""
import sys, struct, json, hashlib
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))
from decomp import native_cpu
from unicorn.x86_const import UC_X86_REG_ESP, UC_X86_REG_EAX, UC_X86_REG_EIP
exe = Path(sys.argv[1]); cpu, identity = native_cpu(exe)
cpu.mem_map(0x2000000, 0x20000)
obj, tribe, program, field, stack, stop = 0x2000000,0x2001000,0x2003000,0x2007000,0x201d000,0x201e000
base, stride = 0x89d1c8, 0xc65

def call(entry, *args):
    cpu.mem_write(stack,struct.pack('<'+'I'*(len(args)+1),stop,*args))
    cpu.reg_write(UC_X86_REG_ESP,stack)
    cpu.emu_start(entry,stop,timeout=100000,count=10000)
    assert cpu.reg_read(UC_X86_REG_EIP)==stop
    return cpu.reg_read(UC_X86_REG_EAX)

def read(self, internal):
    cpu.mem_write(tribe+0xc22,bytes([self]))
    cpu.mem_write(field,struct.pack('<Ii',2,internal))
    return call(0x48f350,tribe,program,field)

cases=[]
for attacker in range(4):
  for victim in range(4):
    for initial in [0,2,25,65535]:
      cpu.mem_write(base,bytes(stride*4))
      cpu.mem_write(obj,bytes(0x200));cpu.mem_write(obj+0x2f,bytes([victim]))
      address=base+attacker*stride+0xa1f+victim*2
      cpu.mem_write(address,struct.pack('<H',initial))
      cpu.mem_write(0x89c6f0,b'\0')
      call(0x4a3960,attacker,obj)
      expected=(initial+1)&65535
      matrix=[[struct.unpack('<H',cpu.mem_read(base+a*stride+0xa1f+v*2,2))[0] for v in range(4)] for a in range(4)]
      assert matrix==[[expected if (a,v)==(attacker,victim) else 0 for v in range(4)] for a in range(4)]
      assert read(attacker,1176+victim)==expected
      assert read(victim,1180+attacker)==expected
      assert read(attacker,1178)==(expected if victim==2 else 0)
      cases.append(dict(attacker=attacker,victim=victim,initial=initial,after=expected))
# A wild victim is ignored by the original writer.
cpu.mem_write(base,bytes(stride*4));cpu.mem_write(obj+0x2f,b'\xff')
call(0x4a3960,1,obj)
assert read(1,1178)==0
print(json.dumps(dict(status='passed',exeSha256=hashlib.sha256(exe.read_bytes()).hexdigest(),probeSha256=hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),cases=cases,wildIgnored=True,scope='Supplied victim owner and credited tribe; original writer and internal reader, no hooks. Death-path attribution and natural mission timing not executed.'),indent=2))
