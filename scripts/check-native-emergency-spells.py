"""Compare complete 0x4d0860 including emergency, preacher and general dispatch.
Only final allocation is supplied; it records the cast and applies AI delay 12.
Usage: python scripts/check-native-emergency-spells.py /path/to/d3dpoptb.exe
"""
import json,random,struct,subprocess,sys
from pathlib import Path
from unicorn import UC_HOOK_CODE
from unicorn.x86_const import UC_X86_REG_ESP,UC_X86_REG_EIP
from decomp import native_cpu,configure_native_constants,load_native_shapes
root=Path(__file__).resolve().parents[1];exe=Path(sys.argv[1]);rules=json.loads((root/'app/original-rules.json').read_text())
cpu,_=native_cpu(exe);configure_native_constants(cpu,exe);cpu.mem_map(0x2000000,0x40000)
base,stack,stop=0x2000000,0x203d000,0x203e000
load_native_shapes(cpu,exe,base+0x30000,base+0x33000)
rng=random.Random(0x4d0860);events=[]
def write(a,fmt,*v):cpu.mem_write(a,struct.pack('<'+fmt,*v))
def read(a,fmt):return struct.unpack('<'+fmt,cpu.mem_read(a,struct.calcsize('<'+fmt)))[0]
def allocate(cpu,address,size,user):
    sp=cpu.reg_read(UC_X86_REG_ESP);events.append([read(sp+8,'I'),read(sp+12,'H')])
    write(read(sp+4,'I')+0x5bd,'B',12)
    cpu.reg_write(UC_X86_REG_EIP,read(sp,'I'));cpu.reg_write(UC_X86_REG_ESP,sp+4)
cpu.hook_add(UC_HOOK_CODE,allocate,begin=0x4f4de0,end=0x4f4de0)
def cell(p):return ((p['x']>>8)&254)|(p['y']&0xfe00)
def tile(c):return 0x8a03e4+((c>>9)*128+((c&254)>>1))*16
fields={'class':(0x2a,'B'),'model':(0x2b,'B'),'state':(0x2c,'B'),'tribe':(0x2f,'b'),
 'x':(0x3d,'H'),'y':(0x3f,'H'),'flags2':(0xc,'I'),'flags4':(0x10,'I'),'assignment':(0x76,'H'),'disguise':(0xb2,'B')}
def person(tribe,x,y,model=7):return {'class':1,'model':model,'state':0,'tribe':tribe,'x':x&65535,'y':y&65535,'flags2':0,'flags4':0,'assignment':0,'disguise':0}

cases=[];expected=[];coverage={2:0,3:0,5:0,'cleared':0,'early':0,'preacher':0}
for i in range(1040):
    owner=i%4;opponent=(owner+1)%4;t=0x89d1c8+owner*0xc65
    own=person(owner,8192,8192);enemy=person(opponent,8704,8192);preacher=person(opponent,8192,8704,4);preacher['assignment']=64
    tower=dict(object=79,angle=0,anchorX=8192,anchorY=8192,model=4,state=2,occupants=1,firstOccupant={'model':6})
    context=dict(turn=1,mana=120000,reserve=0,gameFlags=0,aiFlags=0,blastFrequency=1,stock=dict(available=44,disabled=0,stocks=[0]*22))
    flags=0;delay=0;used=[0]*22;exists=True;enemy_exists=True;allies=0
    entries=[dict(model=2,mana=0,people=0,mode=0)]+[dict(model=0,mana=0,people=0,mode=0) for _ in range(7)]
    scan=dict(cursor=0,limit=123,paused=0,targets=[0,0,0,0]);ready=[17]*8
    if i<16:
        # Two variants of each path: valid casts, then gate/stock boundary cases.
        branch=i%8
        if branch==0:own['state']=25 if i<8 else 29;context.update(turn=0,mana=60001 if i<8 else 60000)
        if branch==1:context['aiFlags']=0x3000;enemy_exists=False;preacher['model']=2
        if branch==2:context.update(aiFlags=0x4000,turn=(-owner)&3,mana=0);context['stock']['stocks'][3]=1 if i<8 else 0
        if branch==3:context.update(aiFlags=0x8000,turn=(-owner-2)&3,mana=0);context['stock']['stocks'][3]=1
        if branch in [4,5,6]:
            context['stock']['available']=1<<[2,5,3][branch-4];enemy_exists=False
            if i>=8:context['mana']=rules['spellCharging'][[2,5,3][branch-4]]['cost']-1
        if branch==7:context['turn']=0;preacher['model']=2;enemy_exists=False
        if i==11:tower['firstOccupant']={'model':2}
    else:
        context.update(turn=rng.choice([0,1,2,3,4,16,127,128,511]),mana=rng.choice([0,9999,10000,60000,60001,79999,80000,120000]),
          aiFlags=rng.choice([0,0x1000,0x2000,0x3000,0x4000,0x8000,0xf000])|rng.choice([0,0x40000]),blastFrequency=rng.choice([0,1,2,3,128,255]),gameFlags=rng.choice([0,0,32]))
        flags=rng.choice([0,0,8,0x80000]);delay=rng.choice([0,0,1,12]);used=[rng.randrange(6) for _ in range(22)]
        exists=i%19!=0;enemy_exists=i%7!=0;allies=rng.randrange(16)
        own.update(state=rng.choice([0,0,3,22,25,29]),flags2=rng.choice([0,0,1,2]),flags4=rng.choice([0,0,0x400]))
        enemy.update(flags2=rng.choice([0,0,1,0x2000,0x80000,0x800000]),flags4=rng.choice([0,0,0x400]),x=rng.choice([8704,65535,32768]))
        preacher.update(model=rng.choice([2,4,4,5]),assignment=rng.choice([0,64]),flags4=rng.choice([0,0,0x1000]),disguise=rng.randrange(256))
        context['stock']['available']=rng.randrange(64);context['stock']['stocks']=[rng.choice([0,0,1,16,17]) for _ in range(22)]
        tower.update(object=rng.choice([79,80]),angle=rng.randrange(4)*512,anchorX=rng.choice([8192,32768,65024]),model=rng.choice([4,4,1]),state=rng.choice([1,2]),occupants=rng.choice([0,1,2]),firstOccupant=rng.choice([None,{'model':2},{'model':4},{'model':6}]))
        scan.update(cursor=rng.choice([0,79,167]),paused=rng.choice([0,0,1]),targets=[cell(enemy),0,cell(preacher),0])
        entries[0].update(model=rng.choice([0,2,3,5]),people=rng.choice([0,1,6]),mode=rng.randrange(2))
    cpu.mem_write(base,bytes(0x20000));cpu.mem_write(0x89d1c8,bytes(4*0xc65));cpu.mem_write(0x890390,bytes(4096));cpu.mem_write(0x8a03e4,bytes(0x40000))
    write(t+0xc22,'B',owner);write(t+0xc1f,'B',1);write(t+0x93d,'I',flags);write(t+0x94d,'i',context['mana']);write(t+0x596,'I',context['aiFlags']);write(t+0x5bd,'B',delay);write(t+0x5ba,'B',opponent)
    write(0x96080a+owner*48,'B',context['blastFrequency']);write(0x9608b6+owner,'B',allies);write(0x89d188,'I',context['turn']);write(0x89d17c,'I',context['gameFlags'])
    write(0x96070a+owner*56,'I',context['stock']['available']);cpu.mem_write(0x96071e+owner*56,bytes(context['stock']['stocks']))
    write(t+0x89d,'I',base+256 if exists else 0);write(0x89d1c8+opponent*0xc65+0x89d,'I',base+512 if enemy_exists else 0)
    for j in range(22):write(t+0x53e+j*4,'B',used[j])
    write(t+0x52e,'HH',scan['cursor'],scan['limit']);write(t+0x53a,'B',scan['paused']);write(t+0x532,'4H',*scan['targets'])
    for j,e in enumerate(entries):write(t+0x4c6+j*12,'i',e['mana']);write(t+0x4ce+j*12,'4B',e['model'],ready[j],e['people'],e['mode'])
    tower_person={**person(opponent,tower['anchorX'],tower['anchorY'],tower['model']),'class':2,'state':tower['state']}
    people=[own]+([enemy] if enemy_exists else [])+[preacher,tower_person];cells={};ids={}
    for j,p in enumerate(people,1):
        a=base+j*256
        # Enemy shaman always uses index 2; keep its pointer null when absent.
        for key,(off,fmt) in fields.items():write(a+off,fmt,p[key])
        write(0x890390+j*4,'I',a);write(a+0x24,'H',j);ids[id(p)]=j
        c=cell(p)
        if c in cells:write(base+cells[c][-1][0]*256+0x20,'H',j)
        else:write(tile(c)+6,'H',j)
        cells.setdefault(c,[]).append((j,p))
    write(base+256+0x41,'h',256)
    b=base+ids[id(tower_person)]*256;write(0x89d1c8+opponent*0xc65+0x885,'I',b)
    write(b+0x33,'H',tower['object']);write(b+0x26,'h',tower['angle']);write(b+0x7a,'HH',tower['anchorX'],tower['anchorY']);write(b+0xa6,'B',tower['occupants'])
    if tower['firstOccupant']:
        write(b+0x86,'H',10);write(0x890390+40,'I',base+2560);write(base+2560+0x2b,'B',tower['firstOccupant']['model'])
    write(stack,'II',stop,t);cpu.reg_write(UC_X86_REG_ESP,stack);events=[]
    cpu.emu_start(0x4d0860,stop,timeout=2000000,count=10000000);assert cpu.reg_read(UC_X86_REG_EIP)==stop,hex(cpu.reg_read(UC_X86_REG_EIP))
    result=dict(scan=dict(cursor=read(t+0x52e,'H'),limit=read(t+0x530,'H'),paused=read(t+0x53a,'B'),targets=list(struct.unpack('<4H',cpu.mem_read(t+0x532,8)))),
      ranges=[read(t+0x4cf+j*12,'B') for j in range(8)],flags=read(t+0x596,'I'),delay=read(t+0x5bd,'B'),casts=events.copy())
    for model,c in events:coverage[model]+=1
    coverage['cleared']+=bool((context['aiFlags']&0x1000) and not(result['flags']&0x1000));coverage['early']+=bool(events and result['ranges']==ready)
    coverage['preacher']+=bool(events and result['ranges']!=ready and preacher['model']==4 and preacher['assignment']==64)
    cases.append(dict(tribe=owner,alliances=allies,own=own,exists=exists,enemy=enemy if enemy_exists else None,tower=tower,cells=[[c,[p for _,p in ps]] for c,ps in cells.items()],context=context,scan=scan,ready=ready,entries=entries,flags=flags,delay=delay,used=used));expected.append(result)

js="""import {processComputerSpells} from './app/computer-spells.ts';
let input='';for await(const c of process.stdin)input+=c;
console.log(JSON.stringify(JSON.parse(input).map(c=>{
 const world={tribe:c.tribe,alliances:c.alliances,cells:new Map(c.cells),terrainFlags:()=>0},casts=[];
 const caster={...c.own,height:256,landIndex:0,building:null,playerType:1,casting:{flags:c.flags,cooldown:0,aiCooldown:c.delay,spells:c.used.map(used=>({used}))}};
 const ranges=processComputerSpells(world,c.scan,c.exists?caster:null,c.context,c.entries,{enemyShaman:c.enemy,enemyBuildings:[c.tower],regionFlags:()=>0,categoryFlags:()=>1,cast:(...args)=>{casts.push(args);caster.casting.aiCooldown=12;}});
 return {scan:c.scan,ranges:ranges??c.ready,flags:c.context.aiFlags>>>0,delay:caster.casting.aiCooldown,casts};
})));"""
r=subprocess.run(['node','--input-type=module','-e',js],input=json.dumps(cases),capture_output=True,text=True,cwd=root);assert r.returncode==0,r.stderr
actual=json.loads(r.stdout);assert len(actual)==len(expected)
for i,(a,b) in enumerate(zip(expected,actual)):
    if a!=b:
        p=Path('/private/tmp/populous-emergency-failure.json');p.write_text(json.dumps(dict(case=cases[i],native=a,browser=b),indent=2));raise AssertionError((i,str(p)))
assert all(coverage.values()),coverage
print('PASS: 1,040 complete native emergency/general spell passes;',coverage)
