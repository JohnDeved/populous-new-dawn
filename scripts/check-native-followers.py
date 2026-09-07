"""Rebuild original follower counters and compare campaign reads/mission branches.
Usage: python scripts/check-native-followers.py /path/to/d3dpoptb.exe
No native leaves are intercepted. Mana rebuilding and player-only UI work are
excluded by fixture state. Browser comparison covers currently supported classes.
"""
import hashlib,json,random,struct,subprocess,sys
from pathlib import Path
from unicorn.x86_const import UC_X86_REG_ESP,UC_X86_REG_EIP,UC_X86_REG_EAX
from decomp import native_cpu
root=Path(__file__).resolve().parents[1]
cpu,_=native_cpu(Path(sys.argv[1]));cpu.mem_map(0x2000000,0x30000)
program,people,field,stack,stop=0x2000000,0x2004000,0x200c000,0x202d000,0x202e000
tribes=0x89d1c8;red=tribes+0xc65
rng=random.Random(1147)
def write(p,fmt,*v):cpu.mem_write(p,struct.pack(fmt,*v))
def call(address,*args):
    write(stack,'<'+'I'*(len(args)+1),stop,*args);cpu.reg_write(UC_X86_REG_ESP,stack)
    cpu.emu_start(address,stop,timeout=100000,count=100000)
    assert cpu.reg_read(UC_X86_REG_EIP)==stop,hex(cpu.reg_read(UC_X86_REG_EIP))
    value=cpu.reg_read(UC_X86_REG_EAX);return value if value<0x80000000 else value-0x100000000

def rebuild(rows):
    cpu.mem_write(tribes,bytes(4*0xc65));write(red+0xc22,'<B',1)
    write(0x89d17c,'<I',0x20);write(0x89d188,'<I',73)
    write(0x89c6f0,'<B',3);write(0x890330,'<I',0)
    for i,row in enumerate(rows):
        p=people+i*256;cpu.mem_write(p,bytes(256))
        write(p+4,'<I',p+256 if i+1<len(rows) else 0)
        write(p+0x10,'<I',(0x20000000 if row['active'] else 0)|(0x800 if row['ghost'] else 0))
        write(p+0x2a,'<BBB',1,row['model'],row['state']);write(p+0x2f,'<B',row['owner'])
    write(0x890324,'<I',people if rows else 0);call(0x4ecac0)

def compare(cases,expected,js):
    p=subprocess.run(['node','--input-type=module','-e',"let s='';for await(const c of process.stdin)s+=c;const cases=JSON.parse(s);"+js],input=json.dumps(cases),capture_output=True,text=True,cwd=root)
    assert p.returncode==0,p.stderr
    actual=json.loads(p.stdout);assert len(actual)==len(expected)
    for c,a,b in zip(cases,expected,actual):assert a==b,(c,a,b)

ids=[*range(1,6),*range(1146,1176),*range(1200,1207)]
cases=[];expected=[]
for trial in range(48):
    rows=[dict(owner=rng.randrange(2),model=rng.choice([1,2,3,7]),state=rng.choice([0,10,14,17,33]),active=bool(rng.randrange(4)),ghost=bool(rng.randrange(5)==0)) for _ in range(trial)]
    rebuild(rows);write(red+0x596,'<I',0x10000)
    results=[]
    for id_ in ids:
        write(field,'<Ii',2,id_);results.append(call(0x48f350,red,program,field))
    assert struct.unpack('<I',cpu.mem_read(red+0x596,4))[0]&0x10000,'Person reads must not consume partial building count flag'
    cases.append(rows);expected.append(results)
compare(cases,expected,"""import {createWorld,addUnit,campaignInternal} from './app/model.ts';
const ids=[...Array.from({length:5},(_,i)=>i+1),...Array.from({length:30},(_,i)=>1146+i),...Array.from({length:7},(_,i)=>1200+i)];
console.log(JSON.stringify(cases.map(rows=>{const w=createWorld();w.units=[];w.ai.includeIncompleteBuildings=true;
for(const r of rows){if(r.ghost)continue;const u=addUnit(w,r.model===1?'wild':r.owner===0?'blue':'red',r.model===3?'warrior':r.model===7?'shaman':'brave',{x:0,z:30});u.hp=r.active?100:0;if(r.state===10)u.inside=123;}
const values=ids.map(id=>campaignInternal(w,id));if(!w.ai.includeIncompleteBuildings)throw new Error('Consumed building flag');return values;})));""")
print(f'PASS: {len(cases)*len(ids)} native follower queries/constants after real counter rebuilds')

original=json.loads((root/'app/original-script.json').read_text())
assert hashlib.sha256((Path(sys.argv[1]).parent/'levels/cpscr010.dat').read_bytes()).hexdigest()==original['sha256']
codes=[12,1003,*original['codes'][625:681],1004,1019]
blob=bytearray(12552);struct.pack_into('<'+'H'*len(codes),blob,0,*codes)
for i,f in enumerate(original['fields']):struct.pack_into('<Ii',blob,8192+i*8,*f)
cases=[];expected=[]
for warriors in [0,1,3,4,12,13]:
    rebuild([dict(owner=0,model=3,state=17,active=True,ghost=False) for _ in range(warriors)])
    for stage in [0,2,3]:
        for turn in range(256):
            cpu.mem_write(program,bytes(blob));write(program+0x3000+2*4,'<i',stage)
            write(0x89d188,'<I',turn);write(0x9607ea+48+11,'<B',19)
            call(0x48c6b0,red,program)
            expected.append(cpu.mem_read(0x9607ea+48+11,1)[0]);cases.append(dict(warriors=warriors,stage=stage,turn=turn))
compare(cases,expected,"""import {createWorld,addUnit,campaignInternal} from './app/model.ts';import {runScript} from './app/popscript.ts';import original from './app/original-script.json' with {type:'json'};
const script={...original,codes:[12,1003,...original.codes.slice(625,681),1004,1019]},w=createWorld();
console.log(JSON.stringify(cases.map(c=>{w.units=[];for(let i=0;i<c.warriors;i++)addUnit(w,'blue','warrior',{x:0,z:30});w.ai.attributes[11]=19;w.ai.variables[2]=c.stage;
runScript(script,w.ai,{turn:c.turn,tribe:1,readInternal:id=>campaignInternal(w,id),command:()=>{throw new Error('Unexpected command');}});return w.ai.attributes[11];})));""")
print(f'PASS: {len(cases)} original campaign attack-size branches, warrior thresholds and turn offsets')
