"""Compare computer spell setup and the original mission-one cast-limit block.
Usage: python scripts/check-native-computer.py /path/to/d3dpoptb.exe
The actual interpreter and command handlers execute; no native leaves are intercepted.
"""
import hashlib,json,random,struct,subprocess,sys
from pathlib import Path
from unicorn.x86_const import UC_X86_REG_ESP,UC_X86_REG_EIP
from decomp import native_cpu
root=Path(__file__).resolve().parents[1]
cpu,_=native_cpu(Path(sys.argv[1]));cpu.mem_map(0x2000000,0x20000)
program,tribe,stack,stop=0x2000000,0x2008000,0x201d000,0x201e000
original=json.loads((root/'app/original-script.json').read_text())
source=Path(sys.argv[1]).parent/'levels/cpscr010.dat'
assert hashlib.sha256(source.read_bytes()).hexdigest()==original['sha256']
constants=json.loads((root/'app/original-constants.json').read_text())
rng=random.Random(49230)
def write(p,fmt,*values):cpu.mem_write(p,struct.pack(fmt,*values))
def run(codes,fields,variables):
    blob=bytearray(12552);struct.pack_into('<'+'H'*len(codes),blob,0,*codes)
    for i,field in enumerate(fields):struct.pack_into('<Ii',blob,8192+i*8,*field)
    struct.pack_into('<64i',blob,12288,*variables);cpu.mem_write(program,bytes(blob))
    write(stack,'<III',stop,tribe,program);cpu.reg_write(UC_X86_REG_ESP,stack)
    cpu.emu_start(0x48c6b0,stop,timeout=100000,count=100000)
    assert cpu.reg_read(UC_X86_REG_EIP)==stop
    return list(struct.unpack('<64i',cpu.mem_read(program+0x3000,256)))
def initialize():
    cpu.mem_write(tribe,bytes(0xc65));cpu.mem_write(tribe+0xc22,b'\1')
    write(0x5a8150,'<i',constants['SPELL_BLAST'])
def snapshot():
    states,flags=struct.unpack('<II',cpu.mem_read(tribe+0x596,8))[::-1]
    entries=[]
    for i in range(8):
        mana,range_,_,model,_,people,mode=struct.unpack('<iHHBBBB',cpu.mem_read(tribe+0x4c6+i*12,12))
        entries.append(dict(model=model,mana=mana,range=range_,people=people,mode=mode))
    return dict(states=states,flags=flags,defencePosition=struct.unpack('<H',cpu.mem_read(tribe+0x46e,2))[0],
                defenceRadius=cpu.mem_read(tribe+0x5be,1)[0],spellEntries=entries)
def compare(cases,expected,js):
    result=subprocess.run(['node','--input-type=module','-e',js],input=json.dumps(cases),capture_output=True,text=True,cwd=root)
    assert result.returncode==0,result.stderr
    actual=json.loads(result.stdout);assert len(actual)==len(expected)
    for c,a,b in zip(cases,expected,actual):assert a==b,(c,a,b)

cases,expected=[],[]
for i in range(256):
    states=rng.getrandbits(32);flags=rng.getrandbits(32);position=rng.randrange(65536)
    values=[rng.randint(-65536,65536) for _ in range(6)]
    opcode=[1038,1108,1196][i%3];token=[1022,1023,999][i%3 if opcode!=1038 else i//3%3]
    if opcode==1038:values=values[:2];args=[0,1,token]
    elif opcode==1108:values[0]=i%8;args=list(range(6))
    else:values=values[:1];args=[0]
    # Alternate variable and constant arguments to exercise real field decoding.
    fields=[[i%2,j if i%2 else v] for j,v in enumerate(values)];variables=values+[0]*(64-len(values))
    initialize();write(tribe+0x596,'<II',flags,states);write(tribe+0x46e,'<H',position)
    run([12,1003,1006,opcode,*args,1004,1019],fields,variables)
    cases.append(dict(opcode=opcode,args=args,fields=fields,variables=variables,states=states,flags=flags,position=position));expected.append(snapshot())
js="""import {createWorld,campaignCommand} from './app/model.ts';let s='';for await(const c of process.stdin)s+=c;
const pick=a=>Object.fromEntries(['states','flags','defencePosition','defenceRadius','spellEntries'].map(k=>[k,a[k]]));
console.log(JSON.stringify(JSON.parse(s).map(c=>{const w=createWorld();Object.assign(w.ai,{states:c.states,flags:c.flags,defencePosition:c.position,defenceRadius:0,variables:c.variables,spellEntries:Array.from({length:8},()=>({model:0,mana:0,range:0,people:0,mode:0}))});campaignCommand(w,c.opcode,c.args,{fields:c.fields});return pick(w.ai);})));"""
compare(cases,expected,js)
print(f'PASS: {len(cases)} actual native computer defense/spell command calls, typed fields and integer widths')

# Real initial field references, then the unmodified recurring original block.
initial=[]
for pc in [65,110,115,123]:
    opcode=original['codes'][pc+1];initial+=original['codes'][pc:pc+2+original['commands'][str(opcode)]]
cases,expected=[],[]
for turn in range(32):
    for casts in [0,1,2,3,127,255]:
        initialize();write(0x89d188,'<I',turn);cpu.mem_write(0x89ddee+0xc65+2,bytes([casts]))
        variables=run([12,1003,*initial,*original['codes'][564:601],1004,1019],original['fields'],original['variables'])
        result=snapshot();result['counter']=variables[19];expected.append(result);cases.append(dict(turn=turn,casts=casts))
js="""import {createWorld,campaignCommand,campaignInternal} from './app/model.ts';import {runScript} from './app/popscript.ts';import original from './app/original-script.json' with {type:'json'};
let s='';for await(const c of process.stdin)s+=c;
const script={...original,codes:[12,1003,...original.codes.slice(564,601),1004,1019]};
console.log(JSON.stringify(JSON.parse(s).map(c=>{const w=createWorld();w.ai.states=0x400;w.ai.flags=0x100;w.turn=c.turn;w.spellCasts[1][2]=c.casts;
runScript(script,w.ai,{turn:w.turn,tribe:1,readInternal:id=>campaignInternal(w,id),command:(op,args)=>campaignCommand(w,op,args)});
return {...Object.fromEntries(['states','flags','defencePosition','defenceRadius','spellEntries'].map(k=>[k,w.ai[k]])),counter:w.ai.variables[19]};})));"""
compare(cases,expected,js)
print(f'PASS: {len(cases)} original mission spell-limit blocks, initial setup and odd/even turn phases')
