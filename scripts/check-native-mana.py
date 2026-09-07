"""Compare full 0x41a590 mana distribution and 0x41ad70 spell eligibility.
Usage: python scripts/check-native-mana.py /path/to/d3dpoptb.exe
Only notification output and its UI predicate are supplied leaves.
"""
import copy,json,random,struct,subprocess,sys
from pathlib import Path
from unicorn import UC_HOOK_CODE
from unicorn.x86_const import UC_X86_REG_ESP,UC_X86_REG_EIP,UC_X86_REG_EAX
from decomp import native_cpu,configure_native_constants
root=Path(__file__).resolve().parents[1]
cpu,_=native_cpu(Path(sys.argv[1]));configure_native_constants(cpu,Path(sys.argv[1]));cpu.mem_map(0x2000000,0x20000)
base,stack,stop=0x2000000,0x201d000,0x201e000
rng=random.Random(0x41a590);events=[];current=None
def write(a,fmt,*v):cpu.mem_write(a,struct.pack('<'+fmt,*v))
def read(a,fmt):return struct.unpack('<'+fmt,cpu.mem_read(a,struct.calcsize('<'+fmt)))[0]
def call(a,*args):
    write(stack,'I'*(len(args)+1),stop,*args);cpu.reg_write(UC_X86_REG_ESP,stack)
    cpu.emu_start(a,stop,timeout=1000000,count=1000000)
    assert cpu.reg_read(UC_X86_REG_EIP)==stop,hex(cpu.reg_read(UC_X86_REG_EIP))
def leaf(cpu,address,size,user):
    sp=cpu.reg_read(UC_X86_REG_ESP);result=0
    if address==0x499970:events.append(['check']);result=current['notifyFull']
    else:events.append(['notify',read(sp+4,'I'),read(sp+8,'I')])
    cpu.reg_write(UC_X86_REG_EAX,result);cpu.reg_write(UC_X86_REG_EIP,read(sp,'I'));cpu.reg_write(UC_X86_REG_ESP,sp+4)
for a in [0x499970,0x499d90]:cpu.hook_add(UC_HOOK_CODE,leaf,begin=a,end=a)
tfields={'spellOwner':(0xc22,'b'),'playerType':(0xc1f,'B'),'mana':(0x94d,'i'),'pending':(0x951,'i'),
 'available':(0x955,'i'),'totalProgress':(0x959,'i'),'previousRate':(0x95d,'i'),'estimatedRate':(0x961,'i'),
 'releaseDelay':(0xa05,'H'),'releaseRate':(0xa07,'H')}
bfields={'id':(0x24,'H'),'model':(0x2b,'B'),'flags3':(0x14,'I'),'activity':(0x9c,'H'),
 'trainingCost':(0x96,'H'),'storedMana':(0x98,'H'),'manaNext':(0xa0,'H')}
wfields={'playerTribe':(0x89c6f0,'b'),'gameFlags':(0x89d17c,'I'),'loadFlags':(0x89c665,'I'),
 'levelFlags':(0x895da8,'I'),'manaFlags':(0x89c66d,'I'),'turn':(0x89d188,'I'),'rateSample':(0x89d161,'B')}
def fixture(c):
    global current,events
    current=c;events=[];cpu.mem_write(base,bytes(0x10000));cpu.mem_write(0x890390,bytes(4096));cpu.mem_write(0x89d1c8,bytes(4*0xc65))
    for key,(a,fmt) in wfields.items():write(a,fmt,c['world'][key])
    t=c['tribe'];a=0x89d1c8+t['id']*0xc65
    for key,(off,fmt) in tfields.items():write(a+off,fmt,t[key])
    write(a+0x969,'22i',*t['spellProgress']);write(a+0x885,'I',base if c['buildings'] else 0)
    for i,b in enumerate(c['buildings']):
        a=base+i*256;write(a+8,'I',a+256 if i+1<len(c['buildings']) else 0);write(0x890390+b['id']*4,'I',a)
        for key,(off,fmt) in bfields.items():write(a+off,fmt,b[key])
    for i,s in enumerate(c['world']['spells']):
        a=0x96070a+i*56;write(a,'I',s['available']);write(a+16,'I',s['disabled']);write(a+20,'22B',*s['stocks'])
def snapshot(c):
    a=0x89d1c8+c['tribe']['id']*0xc65
    t={'id':c['tribe']['id'],**{key:read(a+off,fmt) for key,(off,fmt) in tfields.items()},'spellProgress':list(struct.unpack('<22i',cpu.mem_read(a+0x969,88)))}
    buildings=[{key:read(base+i*256+off,fmt) for key,(off,fmt) in bfields.items()} for i in range(len(c['buildings']))]
    w={key:read(a,fmt) for key,(a,fmt) in wfields.items()};w['spells']=copy.deepcopy(c['world']['spells'])
    for i,s in enumerate(w['spells']):s['stocks']=list(cpu.mem_read(0x96071e+i*56,22))
    return dict(tribe=t,buildings=buildings,world=w,events=events.copy())
def compare(cases,expected,body):
    js="""import {distributeMana,chargingSpells} from './app/mana.ts';let s='';for await(const c of process.stdin)s+=c;
    console.log(JSON.stringify(JSON.parse(s).map(c=>{const events=[];"""+body+"""})));"""
    r=subprocess.run(['node','--input-type=module','-e',js],input=json.dumps(cases),capture_output=True,text=True,cwd=root);assert r.returncode==0,r.stderr
    actual=json.loads(r.stdout);assert len(actual)==len(expected)
    for i,(a,b) in enumerate(zip(expected,actual)):
        if a!=b:
            p=Path('/private/tmp/populous-mana-failure.json');p.write_text(json.dumps(dict(case=cases[i],native=a,browser=b),indent=2));raise AssertionError((i,str(p)))

coverage=dict(charges=0,drain=0,refund=0,computer=0,notification=0)
for batch in range(8):
    cases=[];expected=[];queries=[]
    for trial in range(128):
        i=batch*128+trial
        t=dict(id=i%4,spellOwner=rng.randrange(4),playerType=rng.choice([0,1,2,3]),mana=rng.choice([0,999999,1000000,2147483647]),
          pending=rng.choice([0,0,1,24,35999,36000,361500,2147483647,-1]),available=rng.choice([0,1,2,33,128,10000,1000000,16777216,2147483647,-2147483648,-10000,-1]),
          totalProgress=123,previousRate=rng.choice([0,100,10000]),estimatedRate=234,
          releaseDelay=rng.choice([0,0,1,2,65535]),releaseRate=rng.choice([0,0,1,1500,32768,65535]),
          spellProgress=[rng.choice([0,1,10,1000,9000,10000,100000]) for _ in range(22)])
        buildings=[dict(id=100+j,model=rng.randrange(20),flags3=rng.getrandbits(32),activity=rng.randrange(256),
          trainingCost=rng.choice([0,1,31,32,1024,3500,4375,65535]),storedMana=rng.choice([0,1,99,100,3500,65535]),manaNext=123) for j in range(rng.randrange(8))]
        w=dict(playerTribe=rng.randrange(4),gameFlags=rng.choice([0,0,32,256,288]),loadFlags=rng.choice([0,0x4000000]),levelFlags=0,
          manaFlags=rng.randrange(256),turn=rng.choice([0,1439,1440,10000]),rateSample=rng.choice([0,1,4,127,255]),
          spells=[dict(available=rng.getrandbits(22),disabled=rng.getrandbits(22),stocks=[rng.choice([0,1,3,4,15,32,65,255]) for _ in range(22)]) for _ in range(4)])
        c=dict(tribe=t,buildings=buildings,world=w,notifyFull=i%2)
        fixture(c);call(0x41ad70,t['spellOwner'],base+0xf000,base+0xf004,base+0xf008)
        queries.append(dict(zip(['active','paused','highest'],struct.unpack('<3i',cpu.mem_read(base+0xf000,12)))))
        call(0x41a590,0x89d1c8+t['id']*0xc65);out=snapshot(c)
        coverage['charges']+=any(a!=b for sa,sb in zip(w['spells'],out['world']['spells']) for a,b in zip(sa['stocks'],sb['stocks']))
        coverage['drain']+=any(a>b for a,b in zip(t['spellProgress'],out['tribe']['spellProgress']))
        coverage['refund']+=any(a['storedMana']>b['storedMana'] and not(a['activity']&128) for a,b in zip(buildings,out['buildings']))
        coverage['computer']+=t['playerType']==1 and t['mana']!=out['tribe']['mana']
        coverage['notification']+=bool(events)
        cases.append(c);expected.append(out)
    compare(cases,queries,'return chargingSpells(c.world,c.tribe.spellOwner);')
    compare(cases,expected,"""distributeMana(c.world,c.tribe,c.buildings,{notify:(f,m)=>events.push(['notify',f,m]),shouldNotifyFull:()=>{events.push(['check']);return !!c.notifyFull;}});
      return {...c,events,notifyFull:undefined};""")
    print(f'PASS: 128 native full mana updates and spell queries, batch {batch+1}/8')
assert all(coverage.values()),coverage
print('Verified branch coverage:',coverage)
