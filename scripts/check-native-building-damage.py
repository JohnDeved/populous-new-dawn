"""Native defeat cleanup, plan health/stages and building damage controller.
World-effect consumers are supplied; compare their order plus entity fields/RNG.
Usage: python scripts/check-native-building-damage.py /path/to/d3dpoptb.exe
"""
import json,random,struct,subprocess,sys
from pathlib import Path
from unicorn import UC_HOOK_CODE
from unicorn.x86_const import UC_X86_REG_ESP,UC_X86_REG_EIP,UC_X86_REG_EAX
from decomp import native_cpu,configure_native_constants
root=Path(__file__).resolve().parents[1];exe=Path(sys.argv[1]);cpu,_=native_cpu(exe);configure_native_constants(cpu,exe);cpu.mem_map(0x2000000,0x40000)
base,stack,stop=0x2000000,0x203d000,0x203e000
rng=random.Random(0x4092a0);events=[];current={};mode=''
def write(a,fmt,*v):cpu.mem_write(a,struct.pack('<'+fmt,*v))
def read(a,fmt):return struct.unpack('<'+fmt,cpu.mem_read(a,struct.calcsize('<'+fmt)))[0]
def call(a,*args):
    write(stack,'I'*(len(args)+1),stop,*[v&0xffffffff for v in args]);cpu.reg_write(UC_X86_REG_ESP,stack)
    cpu.emu_start(a,stop,timeout=1000000,count=1000000);assert cpu.reg_read(UC_X86_REG_EIP)==stop,hex(cpu.reg_read(UC_X86_REG_EIP));return cpu.reg_read(UC_X86_REG_EAX)
def reset():
    cpu.mem_write(base,bytes(0x20000));cpu.mem_write(0x89d1c8,bytes(4*0xc65));cpu.mem_write(0x890390,bytes(4096));write(0x96eabf,'B',0)
def compare(cases,expected,body):
    js="import * as d from './app/building-damage.ts';let input='';for await(const c of process.stdin)input+=c;console.log(JSON.stringify(JSON.parse(input).map(c=>{"+body+"})));"
    r=subprocess.run(['node','--input-type=module','-e',js],input=json.dumps(cases),capture_output=True,text=True,cwd=root);assert r.returncode==0,r.stderr
    actual=json.loads(r.stdout);assert len(actual)==len(expected)
    for i,(a,b) in enumerate(zip(expected,actual)):
        if a!=b:
            p=Path('/private/tmp/populous-building-damage-failure.json');p.write_text(json.dumps(dict(mode=mode,case=cases[i],native=a,browser=b),indent=2));raise AssertionError((i,str(p)))

def leaf(cpu,address,size,user):
    sp=cpu.reg_read(UC_X86_REG_ESP);p=read(sp+4,'I');result=0
    if address==0x4ed8a0:
        assert [p,read(sp+8,'I')]==[7,77]
        events.append(['allocate',read(sp+12,'b'),list(struct.unpack('<5i',cpu.mem_read(base+0x18000,20)))])
    elif address==0x44ff80:events.append(['reveal',list(struct.unpack('<3H',cpu.mem_read(p,6)))])
    elif address==0x4ef180:events.append(['remove',read(p+0x24,'H')])
    elif address==0x403a00:events.append(['move'])
    elif address==0x4ed6f0:events.append(['release',read(p+0x2c,'B')])
    elif address==0x4ed640:events.append(['init',read(p+0x2c,'B')])
    elif address==0x498140:events.append(['ensurePlan'])
    elif address==0x407490:events.append(['occupant']);write(p+0xa6,'B',read(p+0xa6,'B')-1)
    elif address==0x40b320:events.append(['smoke']);result=base+0x1000 if current['smoke'] else 0
    elif address==0x407860:events.append(['debris',read(sp+16,'b')])
    elif address==0x4f2430:result=int(current['respond'][read(p+0x24,'H')-10][0])
    elif address==0x40ba20:result=int(current['respond'][read(p+0x24,'H')-10][1])
    elif address==0x4f2560:events.append(['reserve',read(p+0x24,'H')])
    elif address==0x40b230:events.append(['removePlan'])
    elif address==0x41b550:events.append(['notify',read(sp+4,'b'),read(sp+8,'I'),read(sp+12,'I')])
    elif address==0x48a050:events.append(['sound',read(sp+8,'I'),read(sp+12,'I')])
    cpu.reg_write(UC_X86_REG_EAX,result);cpu.reg_write(UC_X86_REG_EIP,read(sp,'I'));cpu.reg_write(UC_X86_REG_ESP,sp+4)
for a in [0x4ed8a0,0x44ff80,0x4ef180,0x403a00,0x4ed6f0,0x4ed640,0x498140,0x407490,0x40b320,0x407860,0x4f2430,0x40ba20,0x4f2560,0x40b230,0x41b550,0x48a050,0x51fed0,0x4f0f60]:
    cpu.hook_add(UC_HOOK_CODE,leaf,begin=a,end=a)

mode='defeat';cases=[];expected=[]
for i in range(1024):
    reset();owner=i%4;flags=rng.choice([0,0x10000]);turn=rng.choice([0,32,33,0xffffffff]);sky=rng.randrange(256);position=[rng.randrange(65536) for _ in range(3)]
    units=[]
    for j in range(16):
        p=dict(id=j+1,**{'class':rng.choice([1,1,2,2,7,10]),'model':rng.choice([1,2,7,8,12,18]),'tribe':rng.randrange(4)},flags4=rng.choice([0,0x800]),hp=rng.randrange(300),buildingFlags=rng.randrange(65536),damage=rng.randrange(-32768,32768),internalModel=rng.choice([0,7]))
        units.append(p);a=base+j*256
        write(a+4,'I',a+256 if j<15 else 0);write(a+0x24,'H',p['id']);write(a+0x2a,'BB',p['class'],p['model']);write(a+0x2f,'b',p['tribe'])
        write(a+0x10,'I',p['flags4']);write(a+0x6e,'h',p['hp']);write(a+0x9c,'Hh',p['buildingFlags'],p['damage']);write(a+0x75,'B',p['internalModel'])
    write(0x890324,'I',base);write(0x89d188,'I',turn);write(0x89d166,'B',sky);write(0x89d1c8+owner*0xc65+0x93d,'I',flags);write(0x89d1c8+owner*0xc65+0x911,'3H',*position);write(0x892443,'I',base+0x18000)
    events=[];call(0x41b8b0,owner)
    expected.append(dict(lastDefeated=read(0x89d165,'b'),skyCounter=read(0x89d166,'B'),units=[dict(hp=read(base+j*256+0x6e,'h'),buildingFlags=read(base+j*256+0x9c,'H'),damage=read(base+j*256+0x9e,'h')) for j in range(16)],events=events.copy()))
    cases.append(dict(owner=owner,flags=flags,position=position,world=dict(turn=turn,lastDefeated=0,skyCounter=sky,units=units)))
compare(cases,expected,"const events=[],w=c.world;d.defeatTribe(w,c.owner,c.flags,{x:c.position[0],y:c.position[1],h:c.position[2]},{allocate:(id,r)=>events.push(['allocate',id,r]),reveal:p=>events.push(['reveal',[p.x,p.y,p.h]]),remove:p=>events.push(['remove',p.id])});return {lastDefeated:w.lastDefeated,skyCounter:w.skyCounter,units:w.units.map(({hp,buildingFlags,damage})=>({hp,buildingFlags,damage})),events};")
print('PASS: 1,024 complete native defeat cleanups')

mode='plan';cases=[];expected=[]
for i in range(1024):
    reset();b=dict(model=rng.choice([1,4,7,10,14,18]),stage=rng.choice([0,1,2,3,4,127,255]),state=rng.randrange(7),flags2=rng.choice([0,1,0x100000]),attacker=rng.randrange(256))
    plan=dict(remaining=rng.choice([-32768,-1,0,1,100,299,300,799,800,32767]),attacker=rng.randrange(256),repairDelay=0)
    amount=rng.choice([-65536,-32768,-100,-1,0,1,100,32767,65536]);exists=i%7!=0;overlay=i%3!=0
    write(base+0x96,'h',plan['remaining']);write(base+0xa0,'B',plan['attacker']);write(base+0x92,'H',1 if exists else 0)
    write(0x890394,'I',base+256);write(base+256+0x2a,'BBB',2,b['model'],b['state']);write(base+256+0xc,'I',b['flags2']);write(base+256+0x78,'B',b['stage']);write(base+256+0xaf,'B',b['attacker']);write(base+256+0x94,'H',2 if overlay else 0)
    write(0x890398,'I',base+512);write(base+512+0x2a,'B',2);write(base+512+0x78,'B',77)
    events=[];changed=bool(call(0x4ba2c0,base,amount)&255)
    expected.append(dict(changed=changed,remaining=read(base+0x96,'h'),attacker=read(base+0xa0,'B'),stage=read(base+256+0x78,'B'),state=read(base+256+0x2c,'B'),buildingAttacker=read(base+256+0xaf,'B'),overlay=read(base+512+0x78,'B'),events=events.copy()))
    cases.append(dict(building=b,plan=plan,amount=amount,exists=exists,overlay=overlay))
compare(cases,expected,"const b=c.building,p=c.plan,o={stage:77},events=[];const changed=d.changeBuildingWork(p,c.amount,c.exists&&!(b.flags2&1)?b:null,c.overlay?o:null,{move:()=>events.push(['move']),release:()=>events.push(['release',b.state]),init:()=>events.push(['init',b.state])});return {changed,remaining:p.remaining,attacker:p.attacker,stage:b.stage,state:b.state,buildingAttacker:b.attacker,overlay:o.stage,events};")
print('PASS: 1,024 native plan damage/repair and building-stage changes')

mode='damage';cases=[];expected=[]
for i in range(1024):
    reset();current=dict(smoke=i%3!=0,respond=[[bool(rng.randrange(2)),bool(rng.randrange(2))] for _ in range(4)])
    b=dict(model=rng.choice([1,4,7,10,14,18]),stage=rng.choice([0,1,2,3,4]),state=1,flags2=0,flags3=rng.choice([0,0,128]),buildingFlags=0,counter=rng.randrange(256),damage=rng.choice([0,1999,2000,2001,4000,-1,-32768]),attacker=rng.choice([0,1,255]),occupants=rng.randrange(5))
    plan=dict(remaining=rng.choice([1,100,200,300,800,32767]),attacker=255,repairDelay=0);exists=i%9!=0;seed=rng.getrandbits(32)
    write(base+0x24,'H',1);write(base+0x2a,'BBB',2,b['model'],b['state']);write(base+0x2e,'B',b['counter']);write(base+0x2f,'b',1);write(base+0x14,'I',b['flags3'])
    write(base+0x78,'B',b['stage']);write(base+0x9e,'h',b['damage']);write(base+0xaf,'B',b['attacker']);write(base+0xa6,'B',b['occupants']);write(base+0x82,'H',2 if exists else 0)
    write(0x890394,'I',base);write(0x890398,'I',base+256);write(base+256+0x24,'H',2);write(base+256+0x2a,'B',9);write(base+256+0x92,'H',1);write(base+256+0x96,'h',plan['remaining']);write(base+256+0xa0,'B',255)
    write(0x89d178,'I',seed);write(0x96eabf,'B',2)
    for id in range(2):
        t=0x89d1c8+id*0xc65;write(t+0xc1f,'B',1);write(t+0x881,'I',base+0x2000+id*512)
        for j in range(2):
            a=base+0x2000+(id*2+j)*256;write(a+8,'I',a+256 if j==0 else 0);write(a+0x24,'H',10+id*2+j)
    events=[];call(0x4092a0,base)
    expected.append(dict(damage=read(base+0x9e,'h'),stage=read(base+0x78,'B'),remaining=read(base+256+0x96,'h'),repairDelay=read(base+256+0x94,'h'),attacker=read(base+256+0xa0,'B'),occupants=read(base+0xa6,'B'),randomState=read(0x89d178,'I'),smokeDuration=read(base+0x1000+0x6c,'h'),events=events.copy()))
    cases.append(dict(building=b,plan=plan,exists=exists,seed=seed,**current))
compare(cases,expected,"""const b=c.building,p=c.plan,events=[],smoke={duration:0},w={randomState:c.seed,tribes:[{playerType:1,people:[10,11]},{playerType:1,people:[12,13]}]};
 d.processBuildingDamage(w,b,{ensurePlan:()=>events.push(['ensurePlan']),plan:()=>c.exists?p:null,
 changeWork:(p,n)=>d.changeBuildingWork(p,n,b,null,{move:()=>events.push(['move']),release:()=>events.push(['release',b.state]),init:()=>events.push(['init',b.state])}),
 removeOccupant:()=>{events.push(['occupant']);b.occupants--;},smoke:()=>{events.push(['smoke']);return c.smoke?smoke:null;},debris:n=>events.push(['debris',n]),
 canRespond:id=>c.respond[id-10].every(Boolean),reserve:id=>events.push(['reserve',id]),removePlan:()=>{events.push(['removePlan']);events.push(['remove',2]);},
 notify:()=>events.push(['notify',1,7,1]),removeBuilding:()=>events.push(['remove',1]),sound:()=>events.push(['sound',52,0])});
 return {damage:b.damage,stage:b.stage,remaining:p.remaining,repairDelay:p.repairDelay,attacker:p.attacker,occupants:b.occupants,randomState:w.randomState,smokeDuration:smoke.duration,events};""")
print('PASS: 1,024 complete native building damage calls with real plan changes')

mode='collapse-prefix';cases=[];expected=[]
cpu.hook_add(UC_HOOK_CODE,lambda cpu,a,s,u:cpu.emu_stop(),begin=0x4092a0,end=0x4092a0)
shake_fields={'buildingFlags':(0x9c,'H'),'renderFlags':(0x35,'H'),'tilt':(0x6c,'h'),'roll':(0x6e,'h'),'remaining':(0xa7,'b')}
for i in range(1024):
    reset();seed=rng.getrandbits(32);damage=rng.choice([-32768,-1,0,1999,2000,32767]);flags=rng.choice([0,1,2,3,64,66,68]);counter=i%256
    shake=dict(buildingFlags=flags,renderFlags=rng.randrange(65536),tilt=rng.randrange(-10,11),roll=rng.randrange(-10,11),remaining=rng.choice([-128,-1,0,1,2,6,16,127]))
    write(base+0x2a,'BBB',2,1,1);write(base+0x2e,'B',counter);write(base+0x9e,'h',damage);write(0x89d178,'I',seed);write(0x89c669,'I',0)
    for k,(off,f) in shake_fields.items():write(base+off,f,shake[k])
    write(stack,'II',stop,base);cpu.reg_write(UC_X86_REG_ESP,stack)
    cpu.emu_start(0x403280,0x4092a0,timeout=1000000,count=1000000);assert cpu.reg_read(UC_X86_REG_EIP)==0x4092a0
    expected.append(dict(randomState=read(0x89d178,'I'),damage=read(base+0x9e,'h'),shake={k:read(base+off,f) for k,(off,f) in shake_fields.items()}));cases.append(dict(seed=seed,damage=damage,counter=counter,shake=shake))
compare(cases,expected,"const w={randomState:c.seed},b={damage:c.damage,...c.shake};d.stepBuildingShake(b,c.counter);d.advanceCollapse(w,b);const {damage,...shake}=b;return {randomState:w.randomState,damage,shake};")
print('PASS: 1,024 original building-processor prefixes through defence gate, shake lifetime/angles and collapse RNG/word accumulation')
if '--record' in sys.argv:
    (root/'tests/fixtures/building-shake.json').write_text(json.dumps([dict(input=c,expected=e) for c,e in zip(cases,expected)],separators=(',',':'))+'\n')
