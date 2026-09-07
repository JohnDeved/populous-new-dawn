"""Compare square-ring traversal, full spell target scoring and area summaries.
Usage: python scripts/check-native-spell-targets.py /path/to/d3dpoptb.exe
Scoring executes without supplied leaves. Area assessment supplies only queued
preacher count and the training request consumer.
"""
import json,random,struct,subprocess,sys
from pathlib import Path
from unicorn import UC_HOOK_CODE
from unicorn.x86_const import UC_X86_REG_ESP,UC_X86_REG_EIP,UC_X86_REG_EAX
from decomp import native_cpu,configure_native_constants
root=Path(__file__).resolve().parents[1]
cpu,_=native_cpu(Path(sys.argv[1]));configure_native_constants(cpu,Path(sys.argv[1]));cpu.mem_map(0x2000000,0x40000)
base,stack,stop=0x2000000,0x203d000,0x203e000
rng=random.Random(0x4f4680)
def write(a,fmt,*v):cpu.mem_write(a,struct.pack('<'+fmt,*v))
def read(a,fmt):return struct.unpack('<'+fmt,cpu.mem_read(a,struct.calcsize('<'+fmt)))[0]
def call(a,*args):
    write(stack,'I'*(len(args)+1),stop,*args);cpu.reg_write(UC_X86_REG_ESP,stack)
    cpu.emu_start(a,stop,timeout=1000000,count=2000000)
    assert cpu.reg_read(UC_X86_REG_EIP)==stop,hex(cpu.reg_read(UC_X86_REG_EIP))
    return cpu.reg_read(UC_X86_REG_EAX)
def compare(cases,expected,body):
    js="import * as s from './app/computer-spells.ts';import * as m from './app/native-math.ts';import rules from './app/original-rules.json' with {type:'json'};let text='';for await(const c of process.stdin)text+=c;console.log(JSON.stringify(JSON.parse(text).map(c=>{"+body+"})));"
    r=subprocess.run(['node','--input-type=module','-e',js],input=json.dumps(cases),capture_output=True,text=True,cwd=root);assert r.returncode==0,r.stderr
    actual=json.loads(r.stdout);assert len(actual)==len(expected)
    for i,(a,b) in enumerate(zip(expected,actual)):
        if a!=b:
            p=Path('/private/tmp/populous-spell-target-failure.json');p.write_text(json.dumps(dict(case=cases[i],native=a,browser=b),indent=2));raise AssertionError((i,str(p)))
cases=[];expected=[]
for i in range(4096):
    center=rng.randrange(65536);ring=rng.randrange(1,129)
    index=rng.choice([0,7,8,23,24,47,48,79,80,223,224,65535,rng.randrange(65536),4*ring*(ring-1)])
    rotation=rng.choice([0,1,2,3,4,255]);cases.append(dict(center=center,index=index,rotation=rotation));expected.append(call(0x49c890,center,index,rotation)&65535)
compare(cases,expected,'return m.spiralCell(c.center,c.index,c.rotation);')
print('PASS: 4,096 native square-ring indices, boundaries, rotations and coordinate seams')
current=None;events=[]
def leaf(cpu,address,size,user):
    sp=cpu.reg_read(UC_X86_REG_ESP);value=0
    if address==0x4f2ac0:events.append(['queued']);value=current['queued']&0xffffffff
    else:events.append(['train',read(sp+8,'i'),read(sp+12,'i')])
    cpu.reg_write(UC_X86_REG_EAX,value);cpu.reg_write(UC_X86_REG_EIP,read(sp,'I'));cpu.reg_write(UC_X86_REG_ESP,sp+4)
for a in [0x4f2ac0,0x4e6640]:cpu.hook_add(UC_HOOK_CODE,leaf,begin=a,end=a)
summary_fields={'braves':(0x12,'H'),'warriors':(0x14,'H'),'firewarriors':(0x16,'H'),'preachers':(0x18,'H'),
 'total':(0x22,'H'),'weight':(4,'i'),'requiredBraves':(0x1a,'H'),'requiredWarriors':(0x1c,'H'),'requiredFirewarriors':(0x1e,'H'),'requiredPreachers':(0x20,'H')}
unit_fields={'class':(0x2a,'B'),'model':(0x2b,'B'),'state':(0x2c,'B'),'tribe':(0x2f,'b'),'x':(0x3d,'H'),'y':(0x3f,'H'),'flags2':(0xc,'I'),'flags4':(0x10,'I'),'disguise':(0xb2,'B')}
def terrain(cell):return 0x8a03e4+(((cell>>9)*128)+((cell&254)>>1))*16
all_cases=[]
coverage={'accepted':0,'moved':0,'training':0,'weighted':0}
for batch in range(4):
    cases=[];expected=[];summaries=[]
    for trial in range(256):
        i=batch*256+trial;cpu.mem_write(base,bytes(0x30000));cpu.mem_write(0x89d1c8,bytes(4*0xc65));cpu.mem_write(0x890390,bytes(4096));cpu.mem_write(0x8a03e4,bytes(0x40000))
        owner=i%4;t=0x89d1c8+owner*0xc65;allies=rng.randrange(16);write(t+0xc22,'B',owner);write(0x9608b6+owner,'B',allies)
        center=rng.randrange(65536);cells={};blocks=[];n=0
        for j in range(12):
            x=((center&255)+rng.randrange(-4,5)*2)&255;y=((center>>8)+rng.randrange(-4,5)*2)&255;cell=(x|(y<<8))&0xfefe
            if j==0:cell=center&0xfefe
            if cell in cells:continue
            people=[];first=n+1
            for k in range(rng.randrange(13)):
                n+=1;p=dict(class_=rng.choice([1,1,1,2,3]),model=rng.randrange(9),state=rng.choice([0,2,23]),tribe=rng.choice([-1,0,1,2,3]),
                  x=((cell&255)<<8)|rng.randrange(256),y=(cell&0xff00)|rng.randrange(256),flags2=rng.choice([0,0,0x10000,1]),flags4=rng.choice([0,0,0x1000]),disguise=rng.randrange(256));p['class']=p.pop('class_')
                # Periodic dense enemy groups force positive-person score branches.
                if i%4==0 and j==0:p.update({'class':1,'model':3,'state':0,'tribe':(owner+1)%4,'flags2':0,'flags4':0})
                a=base+n*256;write(0x890390+n*4,'I',a)
                for key,(off,fmt) in unit_fields.items():write(a+off,fmt,p[key])
                if people:write(base+(n-1)*256+0x20,'H',n)
                people.append(p)
            if people:write(terrain(cell)+6,'H',first)
            cells[cell]=people
            if rng.randrange(2):blocks.append(cell);write(terrain(cell),'I',0x200)
        direct=None if i%7 else dict(class_=1,model=7,state=0,tribe=owner,x=0,y=0,flags2=1,flags4=0,disguise=0)
        if direct:
            direct['class']=direct.pop('class_')
            for key,(off,fmt) in unit_fields.items():write(base+0x20000+off,fmt,direct[key])
        model=i%22;c=dict(tribe=owner,alliances=allies,cells=list(cells.items()),blocks=blocks,center=center,model=model,direct=direct,
          radius=rng.randrange(5),training=None if i%3==0 else dict(preachers=rng.choice([0,1,10,32768,65535]),firewarriors=rng.choice([0,3]),braves=rng.choice([5,20,100,65535]),autoTrain=i%2==0,queued=rng.choice([0,1,20,2147483647,-2147483648])))
        accepted=bool(call(0x4f4680,t,model,center,base+0x21000,base+0x20000 if direct else 0));target=read(base+0x21000,'H')
        expected.append(dict(accepted=accepted,cell=target));coverage['accepted']+=accepted;coverage['moved']+=target!=center
        events=[];current=c['training']
        if current:
            for off,key in [(0xa2f,'preachers'),(0xa33,'firewarriors'),(0xa2b,'braves')]:write(t+off,'H',current[key])
            write(0x960818+owner*48,'B',0 if current['autoTrain'] else 1)
        call(0x4f4030,t,base+0x22000,center,c['radius'],int(current is not None))
        summary={key:read(base+0x22000+off,fmt) for key,(off,fmt) in summary_fields.items()};summaries.append(dict(summary=summary,events=events.copy()))
        coverage['training']+=any(e[0]=='train' for e in events);coverage['weighted']+=summary['weight']>0
        cases.append(c)
    world="const w={tribe:c.tribe,alliances:c.alliances,cells:new Map(c.cells),terrainFlags:cell=>c.blocks.includes(cell)?0x200:0};"
    compare(cases,expected,world+'return s.chooseSpellTarget(w,c.model,c.center,c.direct);')
    compare(cases,summaries,world+"const events=[];const training=c.training?{...c.training,queuedPreachers:()=>{events.push(['queued']);return c.training.queued},request:(n,m)=>events.push(['train',n,m])}:null;return {summary:s.summarizeSpellEnemies(w,c.center,c.radius,training),events};")
    all_cases.extend(cases)
    print(f'PASS: 256 full target scorers and area summaries, batch {batch+1}/4')
assert all(coverage.values()),coverage
print('Verified coverage:',coverage)

def setup(c):
    cpu.mem_write(base,bytes(0x30000));cpu.mem_write(0x89d1c8,bytes(4*0xc65));cpu.mem_write(0x890390,bytes(4096));cpu.mem_write(0x8a03e4,bytes(0x40000))
    owner=c['tribe'];t=0x89d1c8+owner*0xc65;write(t+0xc22,'B',owner);write(0x9608b6+owner,'B',c['alliances']);write(0x89d17c,'I',0);write(0x96080a+owner*48,'B',0)
    n=0
    for cell,people in c['cells']:
        first=n+1
        for j,p in enumerate(people):
            n+=1;a=base+n*256;write(0x890390+n*4,'I',a)
            for key,(off,fmt) in unit_fields.items():write(a+off,fmt,p[key])
            if j:write(base+(n-1)*256+0x20,'H',n)
        if people:write(terrain(cell)+6,'H',first)
        write(terrain(cell),'I',0x200 if cell in c['blocks'] else 0)
    return t

def scan_state(t):return dict(cursor=read(t+0x52e,'H'),limit=read(t+0x530,'H'),paused=read(t+0x53a,'B'),targets=list(struct.unpack('<4H',cpu.mem_read(t+0x532,8))))
shore_delay=False
def cast_leaf(cpu,address,size,user):
    sp=cpu.reg_read(UC_X86_REG_ESP);events.append([read(sp+8,'I'),read(sp+12,'I')&65535])
    if shore_delay:write(read(sp+4,'I')+0x5bd,'B',12)
    cpu.reg_write(UC_X86_REG_EIP,read(sp,'I'));cpu.reg_write(UC_X86_REG_ESP,sp+4)
cpu.hook_add(UC_HOOK_CODE,cast_leaf,begin=0x4f4de0,end=0x4f4de0)
cases=[];expected=[];dispatches=[];cast_count=0;retained=0
for i,c in enumerate(all_cases):
    t=setup(c);center=c['center'];pos=dict(x=(center&254)<<8,y=center&0xfe00)
    scan=dict(cursor=rng.choice([0,1,79,167,65500]),limit=rng.randrange(65536),paused=rng.choice([0,0,1,255]),targets=[center,0,center,0] if i%2 else [0,0,0,0])
    write(t+0x52e,'HH',scan['cursor'],scan['limit']);write(t+0x532,'4H',*scan['targets']);write(t+0x53a,'B',scan['paused'])
    exists=i%7!=0;active=i%5!=0;scan_range=255 if i%8==0 else 6;shaman=base+0x24000
    write(t+0x93d,'I',0x80000 if scan_range==255 else 0);write(0x89d188,'I',1)
    write(t+0x89d,'I',shaman if exists else 0);write(t+0x94d,'i',1000000)
    write(shaman+0x2f,'B',c['tribe']);write(shaman+0x2c,'B',22);write(shaman+0x3d,'HHh',pos['x'],pos['y'],256)
    for j in range(8):write(t+0x4ce+j*12,'B',2 if active else 0)
    # State 22 and a non-dispatch turn prevent casting; the range override
    # additionally exercises readiness 255 and 16-bit scan-limit wrap. Native scan
    # and its range, disguise, alliance and ring queries execute unmodified.
    call(0x4d0860,t);expected.append(scan_state(t))
    entries=[dict(model=rng.randrange(22),people=rng.choice([0,1,6,255]),mode=rng.randrange(2)) for _ in range(8)];ranges=[rng.choice([0,6]) for _ in range(8)]
    regions=[];water=[]
    for cell in scan_state(t)['targets']:
        cell&=0xfefe
        if rng.randrange(2):regions.append(cell);write(terrain(cell)+15,'B',1<<(c['tribe']+4))
        if rng.randrange(2):water.append(cell);write(terrain(cell)+12,'B',1)
    for j,e in enumerate(entries):write(t+0x4ce+j*12,'4B',e['model'],ranges[j],e['people'],e['mode'])
    write(shaman+0x2c,'B',0);write(t+0x89d,'I',shaman);write(t+0x93d,'I',0)
    events=[];call(0x4d11b0,t,shaman)
    dispatches.append(dict(scan=scan_state(t),ranges=[read(t+0x4cf+j*12,'B') for j in range(8)],casts=events.copy()))
    cast_count+=bool(events);retained+=any(scan_state(t)['targets'])
    cases.append(dict(**c,scan=scan,pos=pos,exists=exists,active=active,scanRange=scan_range,entries=entries,ranges=ranges,regions=regions,water=water))
body="const w={tribe:c.tribe,alliances:c.alliances,cells:new Map(c.cells),terrainFlags:cell=>c.blocks.includes(cell)?0x200:0};s.scanSpellTargets(w,c.scan,c.exists?c.pos:null,Array(8).fill(c.active?c.scanRange:0),()=>{});"
compare(cases,expected,body+'return c.scan;')
compare(cases,dispatches,body+"const casts=[],caster={...c.pos,height:256,flags2:0,flags4:0,state:0,landIndex:0,building:null,casting:{flags:0,cooldown:0,aiCooldown:0,spells:[]},playerType:1};s.dispatchSpellTargets(w,c.scan,c.entries,c.ranges,caster,0,0,{regionFlags:cell=>c.regions.includes(cell)?1<<(c.tribe+4):0,categoryFlags:cell=>c.water.includes(cell)?2:1,cast:(...args)=>casts.push(args)});return {scan:c.scan,ranges:c.ranges,casts};")
assert cast_count and retained,(cast_count,retained)
print('PASS: 1,024 full native general scans and composed dispatch calls;',cast_count,'casts;',retained,'retained target queues')

# Execute the earlier shoreline routine with its real affordability, square-ring,
# scoring and cast gates. The allocator consumer applies its known AI delay.
shore_delay=True;cases=[];expected=[];shore_casts=0;multiple=0
for i,c in enumerate(all_cases):
    if i<11:
        cells=[]
        for j in ([24,32] if i==0 else [24]):
            cell=call(0x49c890,0,j,0)&65535
            cells.append([cell,[{'class':1,'model':3,'state':0,'tribe':0,'x':(cell&255)<<8,'y':cell&0xff00,'flags2':0,'flags4':0,'disguise':0}]])
        c={**c,'tribe':1,'alliances':0,'center':0,'cells':cells,'blocks':[]}
    t=setup(c);pos=dict(x=(c['center']&254)<<8,y=c['center']&0xfe00);shaman=base+0x24000
    write(t+0x89d,'I',shaman);write(shaman+0x2f,'B',c['tribe']);write(shaman+0x3d,'HHh',pos['x'],pos['y'],256)
    turn=(25-c['tribe'])&31
    if i%7==0 and i>=11:turn+=1
    population=rng.choice([0,9,10,20]);mana=rng.choice([10000,10001,60000,60001,100000]);delay=rng.choice([0,0,0,12])
    flags=0x80000 if i%8==0 else 0;ai_flags=0x40000 if i%3==0 else 0;used=rng.choice([0,4])
    if i<11:mana=200000;ai_flags=0;delay=0
    write(t+0x91d,'i',population);write(t+0x94d,'i',mana);write(t+0x93d,'I',flags);write(t+0x596,'I',ai_flags)
    write(t+0xc1f,'B',1);write(t+0x5bd,'B',delay);write(t+0x546,'B',used);write(0x89d188,'I',turn)
    group=[2,3,0] if i%4==0 else [];reserve=sum(read(0x5a80d4+m*62,'i') for m in group if m)
    if group:
        write(shaman+0xaf,'B',1);write(t+0x36+0x4f,'B',20);write(t+0x36+0x1f,'3B',*group)
    category={}
    for j in range(160):
        cell=call(0x49c890,c['center']&0xfefe,j,0)&65535;model=0 if i<11 else rng.randrange(16);category[cell]=model;write(terrain(cell)+12,'B',model)
    if i<11:
        for cell,people in c['cells']:
            coast=5<=i<=8 or i==10
            if coast:category[cell]=2;write(terrain(cell)+12,'B',2)
            x,y=cell&255,cell>>8;adjacent=[x|(((y+2)&255)<<8),x|(((y-2)&255)<<8),((x+2)&255)|(y<<8),((x-2)&255)|(y<<8)]
            directions=range(4) if i>=9 else [0 if i==0 else (i-1)%4]
            for d in directions:category[adjacent[d]]=1 if coast else 2;write(terrain(adjacent[d])+12,'B',category[adjacent[d]])
    events=[];result=bool(call(0x4c6a20,t));shore_casts+=len(events);multiple+=len(events)>1
    expected.append(dict(result=result,casts=events.copy(),delay=read(t+0x5bd,'B')))
    cases.append(dict(**c,pos=pos,turn=turn,population=population,mana=mana,reserve=reserve,flags=flags,gameFlags=0,aiFlags=ai_flags,used=used,delay=delay,category=list(category.items())))
compare(cases,expected,"const categories=new Map(c.category),flags=rules.terrainCategoryFlags,casts=[];const w={tribe:c.tribe,alliances:c.alliances,cells:new Map(c.cells),terrainFlags:()=>0},caster={...c.pos,height:256,state:0,flags2:0,flags4:0,landIndex:0,building:null,playerType:1,casting:{flags:c.flags,cooldown:0,aiCooldown:c.delay,spells:Array.from({length:22},()=>({used:c.used}))}};const result=s.castShoreBlast(w,caster,c,{categoryFlags:cell=>flags[categories.get(cell)??0],cast:(...args)=>{casts.push(args);caster.casting.aiCooldown=12;}});return {result,casts,delay:caster.casting.aiCooldown};")
assert shore_casts and multiple,(shore_casts,multiple)
print('PASS: 1,024 full native shoreline Blast calls;',shore_casts,'allocations;',multiple,'calls continue allocating under the override')
