"""Compare actual 00466190 exit point/success and forced unload readiness.
Usage: python scripts/check-native-vehicle-exit.py EXE
No leaves are supplied: terrain categories, flags and quarter-cell masks are synthetic inputs.
"""
import json,random,struct,subprocess,sys
from pathlib import Path
from unicorn.x86_const import UC_X86_REG_ESP,UC_X86_REG_EIP,UC_X86_REG_EAX
from decomp import native_cpu,configure_native_constants
root=Path(__file__).resolve().parents[1];exe=Path(sys.argv[1]);cpu,identity=native_cpu(exe);configure_native_constants(cpu,exe)
cpu.mem_map(0x2000000,0x20000);vehicle,out,stack,stop=0x2000000,0x2001000,0x201e000,0x201f000
rng=random.Random(0x466190);cases=[]
def write(a,f,*v):cpu.mem_write(a,struct.pack('<'+f,*v))
def read(a,f):return struct.unpack('<'+f,cpu.mem_read(a,struct.calcsize('<'+f)))[0]
def call(a,*args):
 write(stack,'I'*(len(args)+1),stop,*args);cpu.reg_write(UC_X86_REG_ESP,stack);cpu.emu_start(a,stop,count=200000);assert cpu.reg_read(UC_X86_REG_EIP)==stop;return cpu.reg_read(UC_X86_REG_EAX)
for i in range(320):
 c=dict(model=1+i%4,x=rng.randrange(65536),y=rng.randrange(65536),angle=rng.randrange(2048),category=i%16,flags=rng.choice([0,0,0,4,512,0x100000]),mask=rng.choice([0,255,255,255]),speed=rng.choice([-1,0,11,12,13,70]),navigationFlags=rng.choice([0,1,0x10000,0x100000]),physics=i%2)
 record=bytearray(16);struct.pack_into('<I',record,0,c['flags']);record[12]=c['category'];cpu.mem_write(0x8a03e4,bytes(record)*16384)
 cpu.mem_write(0x96aaba,bytes([c['mask']])*8192);write(0x96aa74,'I',0x96aaba)
 cpu.mem_write(vehicle,bytes(256));write(vehicle+0x2a,'BB',4,c['model']);write(vehicle+0x26,'H',c['angle']);write(vehicle+0x3d,'HHh',c['x'],c['y'],128);write(vehicle+0x30,'B',c['physics']);write(vehicle+0x5f,'h',c['speed']);write(vehicle+0x92,'I',c['navigationFlags'])
 found=bool(call(0x466190,vehicle,out)&255);c['exit']=dict(found=found,point=dict(x=read(out,'H'),y=read(out+2,'H')))
 c['canUnload']=bool(call(0x466f30,vehicle,1,1)&255);c['afterFlags']=read(vehicle+0x92,'I');cases.append(c)
script="""import {vehicleExit} from './app/live-vehicles.ts';import {vehicleReady} from './app/vehicle-routing.ts';import {vehicleUnloadReady} from './app/vehicle-unload.ts';let input='';for await(const c of process.stdin)input+=c;console.log(JSON.stringify(JSON.parse(input).map(c=>{const v={...c,heading:c.angle*Math.PI/1024},w={land:{flags:new Uint32Array(16384).fill(c.flags),categories:new Uint8Array(16384).fill(c.category),walkMasks:[new Uint8Array(8192).fill(c.mask)]},pathfinding:{state:{walkMask:0}}};const exit=vehicleExit(w,v),canUnload=vehicleUnloadReady(v,vehicleReady(w.land,v),exit.found);return{exit,canUnload,afterFlags:v.navigationFlags};})));"""
r=subprocess.run(['node','--input-type=module','-e',script],cwd=root,input=json.dumps(cases),text=True,capture_output=True);assert r.returncode==0,r.stderr
for c,actual in zip(cases,json.loads(r.stdout),strict=True):assert actual=={k:c[k] for k in ['exit','canUnload','afterFlags']},(c,actual)
print('PASS: 320 composed native/TypeScript exit and forced-readiness cases; exact toroidal point, success, speed and flag gates')
