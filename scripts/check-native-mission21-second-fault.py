"""Bounded native VM second-fault scheduling and height decisions.
Actual original bytecode/fields and native GET_HEIGHT execute. Force-trigger,
positioned-message and scenery-cleanup commands are observed at their dispatcher
boundary, not executed. Linked Volcano consumer is covered separately.
"""
import hashlib
import json
from pathlib import Path
import struct
import sys
from unicorn import UC_HOOK_CODE, __version__ as unicorn_version
from unicorn.x86_const import UC_X86_REG_EAX, UC_X86_REG_EIP, UC_X86_REG_ESP
from decomp import native_cpu

exe = Path(sys.argv[1]).resolve()
root = Path(__file__).resolve().parents[1]
paths = {name: exe.parent / 'levels' / name for name in ['cpscr040.dat', 'levl2021.dat', 'levl2021.hdr']}
hashes = {name: hashlib.sha256(path.read_bytes()).hexdigest() for name, path in paths.items()}
assert hashes == {
 'cpscr040.dat': '8619511afaa2bc83a6d0af3ea17900e9a97f48c8e7bc4d03fc36829a5c71ef35',
 'levl2021.dat': 'ddb107eaa9c27f8f3ee8012e5d9bd8179b5ffb76ebb357b7351effbab905a4a5',
 'levl2021.hdr': '923672226657a361567a1c8c356945c0226e28b0ab1291885c364cf97332a675',
}
script = paths['cpscr040.dat'].read_bytes()
header = paths['levl2021.hdr'].read_bytes()
level = paths['levl2021.dat'].read_bytes()
codes = struct.unpack_from('<4096H', script)
fields = list(struct.iter_unpack('<Ii', script[8192:12288]))
assert codes[797:800] == (1005, 175, 1003) and fields[175] == (0, 31)
assert codes[957:966] == (1000,1020,1014,91,1,1012,0,185,1003)
assert fields[185] == (0,2250) and fields[188] == (0,3700)
assert codes[1050] == 1002 and codes[1051] == 1000
marker = struct.unpack_from('<H', header, 100 + 45*2)[0]
cell = ((marker & 0xfe00) >> 9)*128 + ((marker & 254) >> 1)
baseline = struct.unpack_from('<h',level,cell*2)[0]
assert marker == 0xbe3a and baseline == 399
# Authored eruption trigger43 links exactly original Volcano record44.
trigger = level[0x14043+43*55:0x14043+44*55]
linked = level[0x14043+44*55:0x14043+45*55]
assert trigger[:2] == bytes([6,6]) and struct.unpack_from('<H',trigger,13)[0] == 45
assert linked[:2] == bytes([15,7])

cpu, identity = native_cpu(exe)
cpu.mem_map(0x2000000,0x40000)
ai,program,stack,stop=0x2000000,0x2010000,0x203d000,0x203e000
commands = json.loads((root/'app/original-script-twenty-one.json').read_text())['commands']
actions=[]
def write(p,fmt,*v): cpu.mem_write(p,struct.pack('<'+fmt,*v))
def read(p,fmt='I'): return struct.unpack('<'+fmt,cpu.mem_read(p,struct.calcsize('<'+fmt)))[0]
def intercept(_cpu,_address,_size,_user):
 pointer=read(program+0x3104);opcode=read(pointer+2,'H')
 if opcode==1085:return
 n=commands[str(opcode)];args=[]
 for i in range(n):
  token=read(pointer+4+i*2,'H');kind,value=fields[token]
  assert kind in (0,1)
  args.append(value if kind==0 else read(program+0x3000+value*4,'i'))
 actions.append([opcode,args])
 write(program+0x3104,'I',pointer+2*(2+n))
 sp=cpu.reg_read(UC_X86_REG_ESP)
 cpu.reg_write(UC_X86_REG_EAX,1);cpu.reg_write(UC_X86_REG_EIP,read(sp));cpu.reg_write(UC_X86_REG_ESP,sp+4)
cpu.hook_add(UC_HOOK_CODE,intercept,begin=0x48cc60,end=0x48cc60)
def initialize():
 cpu.mem_write(ai,bytes(0xc65));write(ai+0xc22,'B',1)
 blob=bytearray(script)
 words=[12,1003,1005,175,1003,*codes[957:1051],1004,1004,1019]
 blob[:8192]=bytes(8192);struct.pack_into('<'+'H'*len(words),blob,0,*words)
 cpu.mem_write(program,bytes(blob));write(program+0x3000+15*4,'i',baseline)
 cpu.mem_write(0x89b7a5,header[100:612])
 write(0x89d178,'I',0x12345678)
def step(turn,height=baseline):
 actions.clear();write(0x89d188,'I',turn);write(0x8a03e8+cell*16,'h',height)
 write(stack,'III',stop,ai,program);cpu.reg_write(UC_X86_REG_ESP,stack)
 cpu.emu_start(0x48c6b0,stop,count=200000)
 assert cpu.reg_read(UC_X86_REG_EIP)==stop
 assert read(0x89d178)==0x12345678
 return {'turn':turn,'height':height,'state':read(program+0x3000+23*4),'warningLatch':read(program+0x3000+20*4),'actions':json.loads(json.dumps(actions))}
initialize();rows=[step(t) for t in [2239,2254,2255,2271,3679,3711,3743,3775]]
assert [r['state'] for r in rows]==[0,0,0,0,0,1,2,2],rows
assert rows[3]['actions']==[[1151,[46]],[1151,[47]],[1151,[48]]], rows
assert rows[5]['actions']==[[1151,[45]],[1177,[126,58,192,16668]],[1180,[]],[1179,[256]]]
assert rows[6]['actions']==[[1199,[58,190,5]]]
for i in [0,1,2,4,7]:assert not rows[i]['actions']
for height in [398,400]:
 initialize();r=step(2271,height);assert r['state']==2 and r['actions']==[[1199,[58,190,5]]];rows.append(r)
 assert step(3711)['actions']==[]
initialize();step(2271);r=step(2303,398);assert r['state']==2 and r['actions']==[[1199,[58,190,5]]];rows.append(r)
print(json.dumps({'identity':identity,'hashes':hashes,'probeSha256':hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),'unicornVersion':unicorn_version,'pythonVersion':sys.version,'cases':rows,'limits':'Supplied baseline variable and terrain. Native VM + native GET_HEIGHT; other commands intercepted, not full trigger/render/playthrough.'},indent=2))
