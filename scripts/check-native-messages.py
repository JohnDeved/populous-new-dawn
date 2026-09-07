"""Compare native type-3 message allocation and first-mission discovery branches.
Usage: python scripts/check-native-messages.py /path/to/d3dpoptb.exe /path/to/cpscr010.dat
Sound playback is intercepted; original allocation, list ordering and RNG execute.
"""
import json, random, struct, subprocess, sys
from pathlib import Path
from unicorn import UC_HOOK_CODE
from unicorn.x86_const import UC_X86_REG_ESP,UC_X86_REG_EIP
from decomp import native_cpu
root=Path(__file__).resolve().parents[1];cpu,_=native_cpu(Path(sys.argv[1]))
cpu.mem_map(0x2000000,0x20000)
program,tribe,stack,stop=0x2000000,0x2008000,0x201d000,0x201e000
base=0x683b92

def write(p,fmt,*values):cpu.mem_write(p,struct.pack(fmt,*values))
def read(p,fmt):return struct.unpack(fmt,cpu.mem_read(p,struct.calcsize(fmt)))[0]
def call(address,*args):
    write(stack,'<'+'I'*(len(args)+1),stop,*args);cpu.reg_write(UC_X86_REG_ESP,stack)
    cpu.emu_start(address,stop,timeout=100000,count=100000)
    assert cpu.reg_read(UC_X86_REG_EIP)==stop
sounds=[]
def sound(cpu,address,size,user):
    sp=cpu.reg_read(UC_X86_REG_ESP);sounds.append(read(sp+8,'<I'))
    cpu.reg_write(UC_X86_REG_EIP,read(sp,'<I'));cpu.reg_write(UC_X86_REG_ESP,sp+4)
cpu.hook_add(UC_HOOK_CODE,sound,begin=0x48a050,end=0x48a050)

def browser(js,cases):
    r=subprocess.run(['node','--input-type=module','-e',js],input=json.dumps(cases),text=True,capture_output=True,cwd=root)
    assert r.returncode==0,r.stderr
    return json.loads(r.stdout)

def reset(seed,serial=0):
    cpu.mem_write(0x683b70,bytes(0x680));write(0x89bc72,'<I',seed)
    write(0x6841e8,'<H',serial);write(0x89c669,'<I',0)

def snapshot():
    result=[]
    for i in range(32):
        p=base+i*45
        result.append(None if read(p+32,'<B')==0 else dict(age=read(p,'<i'),serial=read(p+28,'<H'),stringId=read(p+18,'<H'),flags=read(p+33,'<I'),height=read(p+8,'<i'),speed=read(p+12,'<i'),lifetime=read(p+16,'<h')))
    return dict(slots=result,nextSerial=read(0x6841e8,'<H'))

rng=random.Random(1176);cases=[];expected=[]
for filled in [0,1,15,31,32]:
    for trial in range(32):
        seed=rng.getrandbits(32);serial=rng.choice([0,1,32767,65535]);reset(seed,serial)
        # 480px reference normalization, including its native odd-height correction.
        write(0x89c6d1,'<I',480)
        slots=[None]*32
        for i in range(filled):
            age=rng.randrange(1,1000);p=base+i*45
            write(p,'<i',age);write(p+32,'<B',3);write(p+33,'<I',0xd1)
            slots[i]=dict(age=age,serial=0,stringId=0,flags=0xd1,height=0,speed=0,lifetime=0)
        write(0x683b8b,'<B',filled);write(0x6841e3,'<B',filled)
        string_id=rng.choice([615,616,619,1220]);sounds.clear();call(0x48eae0,string_id)
        expected.append(dict(state=snapshot(),randomState=read(0x89bc72,'<I'),slot=read(0x6841e7,'<b'),sounds=list(sounds)))
        cases.append(dict(state=dict(slots=slots,nextSerial=serial),seed=seed,stringId=string_id))
js="""import {addMessage} from './app/messages.ts';import {audioRandom} from './app/audio.ts';
let s='';for await(const c of process.stdin)s+=c;console.log(JSON.stringify(JSON.parse(s).map(c=>{
 let rng=c.seed;const slot=addMessage(c.state,c.stringId,()=>rng=audioRandom(rng));
 return {state:c.state,randomState:rng,slot,sounds:[0xe3]};})));"""
actual=browser(js,cases);assert len(actual)==len(expected)
for c,want,got in zip(cases,expected,actual):assert want==got,(c,want,got)
print(f'PASS: {len(cases)} native message allocations, slot eviction, text binding and RNG')

# The real original bytecode, head query, spell-stock query and message command.
# Only audio dispatch remains intercepted; no script command is intercepted.
import hashlib
source=Path(sys.argv[2]).read_bytes()
assert hashlib.sha256(source).hexdigest()=='cf694564b0a4a8debbd488b79c0921abf72d9ab9df33e1dc51ce15edf2536901'
original=list(struct.unpack_from('<4096H',source))
codes=[12,1003,*original[1242:1322],1004,1019]
blob=bytearray(source);blob[:8192]=bytes(8192)
struct.pack_into('<'+'H'*len(codes),blob,0,*codes)
cpu.mem_write(tribe,bytes(0xc65));write(tribe+0xc22,'<B',1)
head=0x2009000;cpu.mem_write(head,bytes(256));cpu.mem_write(head+0x2a,b'\6\6')
cpu.mem_write(0x8a03e4,bytes(0x40000));write(0x890394,'<I',head)
cell=(246//2)*128+18//2;write(0x8a03ea+cell*16,'<H',1)
cases=[];expected=[]
for turn in range(64):
    for remaining,stock,busy,lightning_done,bridge_done in [(4,0,0,0,0),(3,1,0,0,0),(0,0,0,0,0),(-1,15,1,0,0),(3,4,0,1,1)]:
        seed=rng.getrandbits(32);reset(seed);sounds.clear()
        write(0x89c6d1,'<I',480);write(0x89d188,'<I',turn)
        write(head+0x6b,'<b',remaining);write(0x96071e+12,'<B',stock)
        variables=[0]*64;variables[29]=busy;variables[38]=lightning_done;variables[43]=bridge_done
        cpu.mem_write(program,bytes(blob));cpu.mem_write(program+0x3000,struct.pack('<64i',*variables))
        call(0x48c6b0,tribe,program)
        expected.append(dict(variables=list(struct.unpack('<64i',cpu.mem_read(program+0x3000,256))),state=snapshot(),randomState=read(0x89bc72,'<I'),sounds=list(sounds)))
        cases.append(dict(turn=turn,remaining=remaining,stock=stock,seed=seed,variables=variables))
js="""import {createWorld,campaignCommand,campaignInternal} from './app/model.ts';
import {runScript} from './app/popscript.ts';import original from './app/original-script.json' with {type:'json'};
const script={...original,codes:[12,1003,...original.codes.slice(1242,1322),1004,1019]};
let input='';for await(const c of process.stdin)input+=c;
console.log(JSON.stringify(JSON.parse(input).map(c=>{
 const w=createWorld();w.ai.variables=c.variables;w.turn=c.turn;w.randomState=c.seed;
 w.shrines.find(s=>s.kind==='lightning').remaining=c.remaining;w.shots.bridge=c.stock;
 runScript(script,w.ai,{turn:w.turn,tribe:1,readInternal:id=>campaignInternal(w,id),command:(op,args)=>campaignCommand(w,op,args)});
 return {variables:w.ai.variables,state:w.messages,randomState:w.randomState,sounds:w.sounds.map(s=>s.cue)};
})));"""
actual=browser(js,cases);assert len(actual)==len(expected)
for c,want,got in zip(cases,expected,actual):assert want==got,(c,want,got)
print(f'PASS: {len(cases)} native discovery-script turns, actual queries, message command and RNG')

# Removal runs the original leaf and list rebuild with type-3 slots only.
reset(1);write(0x89c6d1,'<I',480)
for string_id in (615,616,619):call(0x48eae0,string_id)
before=snapshot();call(0x430fe0,1);expected=snapshot()
actual=browser("""import {removeMessage} from './app/messages.ts';let s='';for await(const c of process.stdin)s+=c;
const state=JSON.parse(s);removeMessage(state,1);console.log(JSON.stringify(state));""",before)
assert actual==expected
print('PASS: native message removal and surviving slots')
