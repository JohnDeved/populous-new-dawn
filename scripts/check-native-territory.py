"""Compare complete 0x4f6cc0 marks and 0x4f6c20 refreshes without supplied leaves.
Usage: python scripts/check-native-territory.py /path/to/d3dpoptb.exe
"""
import hashlib,json,random,struct,subprocess,sys
from pathlib import Path
from unicorn.x86_const import UC_X86_REG_ESP,UC_X86_REG_EIP
from decomp import native_cpu

root=Path(__file__).resolve().parents[1]
cpu,_=native_cpu(Path(sys.argv[1]));cpu.mem_map(0x2000000,0x100000)
base,marks,stack,stop=0x2000000,0xa64e88,0x20fd000,0x20fe000
rng=random.Random(0x4f6cc0)
def write(a,fmt,*values):cpu.mem_write(a,struct.pack('<'+fmt,*values))
def digest(data):return hashlib.sha256(data).hexdigest()
def call(a,*args):
    write(stack,'I'*(len(args)+1),stop,*args);cpu.reg_write(UC_X86_REG_ESP,stack)
    cpu.emu_start(a,stop,timeout=1000000,count=2000000)
    assert cpu.reg_read(UC_X86_REG_EIP)==stop,hex(cpu.reg_read(UC_X86_REG_EIP))
def building(a,b):
    cpu.mem_write(a,bytes(256));write(a+0x2f,'b',b['tribe']);write(a+0x3d,'HH',b['x'],b['y'])

cases=[];expected=[]
for trial in range(256):
    seed=rng.randrange(256);owner=trial%4;radius=[5,7,9,11,0,255,-1,6][trial%8]
    first=dict(x=rng.choice([0,65535,rng.randrange(65536)]),y=rng.choice([0,65535,rng.randrange(65536)]),tribe=owner)
    second=dict(x=(first['x']+512)&65535,y=first['y'],tribe=owner)
    third=dict(x=first['x'],y=first['y'],tribe=(owner+1)%4)
    tribe=dict(id=owner,playerType=trial%3,defenceRadius=radius&255,buildings=[second,third])
    turn=(111-owner*8)&127;tag=[0,1,253,254,255][trial%5]
    operations=[dict(building=first,radius=radius,remove=False),dict(building=second,radius=radius,remove=False),
      dict(building=third,radius=radius,remove=False),dict(building=first,radius=radius,remove=True),
      dict(turn=turn-1,tribe=tribe),dict(turn=turn,tribe=tribe),
      dict(turn=turn+128,tribe={**tribe,'buildings':[]}),dict(turn=turn+256,tribe=tribe)]
    # Preserve upper category bits, lower region bits and all unrelated terrain
    # bytes; compare every cell after every mutation, including overlaps.
    terrain=bytearray([0x5a]*0x40000)
    for i in range(16384):
        terrain[i*16+12]=(i*17+seed)&255 if i%4==0 else seed&240
        terrain[i*16+15]=(i*13+seed)&255
    cpu.mem_write(0x8a03e4,bytes(terrain));cpu.mem_write(marks,bytes([seed])*16384)
    write(0x5d56b0,'B',tag)
    states=[]
    for op in operations:
        if 'building' in op:
            building(base,op['building']);call(0x4f6cc0,base,op['radius']&0xffffffff,int(op['remove']))
        else:
            t=0x89d1c8+owner*0xc65;cpu.mem_write(t,bytes(0xc65))
            write(t+0xc22,'B',owner);write(t+0xc1f,'B',op['tribe']['playerType']);write(t+0x5be,'B',op['tribe']['defenceRadius'])
            bs=op['tribe']['buildings'];write(t+0x885,'I',base if bs else 0)
            for i,b in enumerate(bs):
                a=base+i*256;building(a,b);write(a+8,'I',a+256 if i+1<len(bs) else 0)
            write(0x89d188,'I',op['turn']&0xffffffff);call(0x4f6c20,t)
        after=bytearray(cpu.mem_read(0x8a03e4,0x40000));regions=after[15::16]
        after[15::16]=terrain[15::16];assert after==terrain,'Unexpected terrain write'
        states.append(dict(regions=digest(regions),marks=digest(cpu.mem_read(marks,16384)),tag=cpu.mem_read(0x5d56b0,1)[0]))
    cases.append(dict(seed=seed,tag=tag,operations=operations));expected.append(states)

js="""
import {createHash} from 'node:crypto';
import {markBuildingTerritory,refreshBuildingTerritory} from './app/territory.ts';
let input='';for await(const c of process.stdin)input+=c;
const digest=a=>createHash('sha256').update(a).digest('hex');
const result=JSON.parse(input).map(c=>{
  const land={categories:Uint8Array.from({length:16384},(_,i)=>i%4===0?(i*17+c.seed)&255:c.seed&240),
    regions:Uint8Array.from({length:16384},(_,i)=>(i*13+c.seed)&255),searchMarks:new Uint8Array(16384).fill(c.seed),searchTag:c.tag};
  return c.operations.map(op=>{
    if(op.building)markBuildingTerritory(land,op.building,op.radius,op.remove);
    else refreshBuildingTerritory(land,op.turn,op.tribe);
    return {regions:digest(land.regions),marks:digest(land.searchMarks),tag:land.searchTag};
  });
});console.log(JSON.stringify(result));
"""
r=subprocess.run(['node','--input-type=module','-e',js],input=json.dumps(cases),capture_output=True,text=True,cwd=root)
assert r.returncode==0,r.stderr
actual=json.loads(r.stdout);assert len(actual)==len(expected)
for i,(a,b) in enumerate(zip(expected,actual)):
    if a!=b:
        p=Path('/private/tmp/populous-territory-failure.json')
        p.write_text(json.dumps(dict(case=cases[i],native=a,browser=b),indent=2));raise AssertionError((i,str(p)))
print('PASS: 2,048 native territory mutations/refreshes; complete 128x128 maps, all footprints, removal overlaps, seams and search-tag wrap')
