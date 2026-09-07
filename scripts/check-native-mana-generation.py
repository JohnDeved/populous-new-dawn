"""Compare person mana and the generation part of the full native tribe rebuild.
Usage: python scripts/check-native-mana-generation.py /path/to/d3dpoptb.exe
Only local-player UI activity classification is supplied during the full rebuild.
"""
import json,random,struct,subprocess,sys
from pathlib import Path
from unicorn import UC_HOOK_CODE
from unicorn.x86_const import UC_X86_REG_ESP,UC_X86_REG_EIP,UC_X86_REG_EAX
from decomp import native_cpu,configure_native_constants
root=Path(__file__).resolve().parents[1]
cpu,_=native_cpu(Path(sys.argv[1]));configure_native_constants(cpu,Path(sys.argv[1]));cpu.mem_map(0x2000000,0x20000)
base,stack,stop=0x2000000,0x201d000,0x201e000
rng=random.Random(0x41af80)
def write(a,fmt,*v):cpu.mem_write(a,struct.pack('<'+fmt,*v))
def read(a,fmt):return struct.unpack('<'+fmt,cpu.mem_read(a,struct.calcsize('<'+fmt)))[0]
def call(a,*args):
    write(stack,'I'*(len(args)+1),stop,*args);cpu.reg_write(UC_X86_REG_ESP,stack)
    cpu.emu_start(a,stop,timeout=1000000,count=1000000)
    assert cpu.reg_read(UC_X86_REG_EIP)==stop,hex(cpu.reg_read(UC_X86_REG_EIP))
    return cpu.reg_read(UC_X86_REG_EAX)
def ui_activity(cpu,address,size,user):
    sp=cpu.reg_read(UC_X86_REG_ESP)
    cpu.reg_write(UC_X86_REG_EAX,0);cpu.reg_write(UC_X86_REG_EIP,read(sp,'I'));cpu.reg_write(UC_X86_REG_ESP,sp+4)
cpu.hook_add(UC_HOOK_CODE,ui_activity,begin=0x4513e0,end=0x4513e0)
fields={'class':(0x2a,'B'),'model':(0x2b,'B'),'state':(0x2c,'B'),'tribe':(0x2f,'b'),
 'flags2':(0xc,'I'),'flags4':(0x10,'I'),'assignment':(0x76,'H'),'commandStatus':(0xa7,'B'),
 'commandCursor':(0xa6,'B'),'immediateCommand':(0x9b,'H')}
def person(model):
    return dict(model=model,state=rng.randrange(46),tribe=rng.randrange(4),flags2=rng.getrandbits(32),flags4=rng.getrandbits(32),
      assignment=rng.randrange(65536),commandStatus=rng.choice([0,0,1,8,255]),commandCursor=rng.randrange(8),
      immediateCommand=rng.choice([0,0,1,2,3]),commands=[rng.randrange(8) for _ in range(8)],**{'class':rng.choice([1,1,2])})
def fixture(people,orders):
    cpu.mem_write(base,bytes(0x10000));cpu.mem_write(0x938830,bytes(8000))
    for i,p in enumerate(people):
        a=base+i*256;write(a+4,'I',a+256 if i+1<len(people) else 0);write(a+0x24,'H',i+1)
        for key,(off,fmt) in fields.items():write(a+off,fmt,p[key])
        write(a+0x8b,'8H',*p['commands'])
    for i,o in enumerate(orders):write(0x938830+i*10,'BB4H',o['model'],o['flags'],0,0,0,0)
def orders():return [dict(model=rng.choice([0,3,8,17,31,32]),flags=rng.choice([0,0,1]),references=0,object=0,a=0,b=0) for _ in range(8)]
def compare(cases,expected,body):
    js="""import {personMana,executingPreacherOrder,generateFollowerMana} from './app/mana.ts';let s='';for await(const c of process.stdin)s+=c;
    console.log(JSON.stringify(JSON.parse(s).map(c=>{const pool={records:c.orders,cursor:1,active:0};"""+body+'})));'
    r=subprocess.run(['node','--input-type=module','-e',js],input=json.dumps(cases),capture_output=True,text=True,cwd=root);assert r.returncode==0,r.stderr
    actual=json.loads(r.stdout);assert len(actual)==len(expected)
    for i,(a,b) in enumerate(zip(expected,actual)):
        if a!=b:
            p=Path('/private/tmp/populous-mana-generation-failure.json');p.write_text(json.dumps(dict(case=cases[i],native=a,browser=b),indent=2));raise AssertionError((i,str(p)))
cases=[];expected=[]
for i in range(2304):
    p=person(i%9);p['state']=[10,33,17,14][i%4];o=orders();fixture([p],o)
    preaching=bool(call(0x4df0e0,base)&255);call(0x41af80,base,base+0xf000)
    cases.append(dict(person=p,orders=o));expected.append([read(base+0xf000,'i'),preaching])
compare(cases,expected,'return [personMana(pool,c.person),executingPreacherOrder(pool,c.person)];')
print('PASS: 2304 native person-mana and preacher-order queries across all nine models')

cases=[];expected=[];pulses=0
for i in range(1024):
    people=[person(rng.randrange(9)) for _ in range(i%40)];o=orders();fixture(people,o)
    world=dict(gameFlags=rng.choice([0,0,32]),turn=rng.choice([0,1,3,4,8,255,256]))
    tribes=[dict(id=t,playerType=rng.randrange(4),available=rng.choice([0,123,-123,2147483647,-2147483648]),
      previousRate=234,estimatedRate=345) for t in range(4)]
    cpu.mem_write(0x89d1c8,bytes(4*0xc65));write(0x89d17c,'I',world['gameFlags']);write(0x89d188,'I',world['turn'])
    write(0x89c6f0,'B',i%4);write(0x890330,'I',0);write(0x890324,'I',base if people else 0)
    for t in tribes:
        a=0x89d1c8+t['id']*0xc65;write(a+0xc1f,'B',t['playerType']);write(a+0x955,'i',t['available']);write(a+0x95d,'2i',t['previousRate'],t['estimatedRate'])
    call(0x4ecac0)
    out=[dict(id=t['id'],playerType=t['playerType'],available=read(0x89d1c8+t['id']*0xc65+0x955,'i'),
      previousRate=read(0x89d1c8+t['id']*0xc65+0x95d,'i'),estimatedRate=read(0x89d1c8+t['id']*0xc65+0x961,'i')) for t in tribes]
    pulses+=out[0]['estimatedRate']==0
    cases.append(dict(people=people,orders=o,world=world,tribes=tribes));expected.append(out)
compare(cases,expected,'generateFollowerMana(c.world,c.tribes,c.people,pool);return c.tribes;')
assert 0<pulses<len(cases)
print(f'PASS: 1024 actual native tribe rebuilds, including {pulses} mana pulses; contribution/order leaves execute without interception')
