"""Compare native spell range/readiness, payment and initial mana.
Usage: python scripts/check-native-spell-casting.py /path/to/d3dpoptb.exe
Range/readiness run without supplied leaves. Payment runs the real allocator
caller with allocation failure supplied, then the initializer with projectile/UI
consumers supplied; only its mana output is compared, not full initialization.
"""
import json,random,struct,subprocess,sys
from pathlib import Path
from unicorn import UC_HOOK_CODE
from unicorn.x86_const import UC_X86_REG_ESP,UC_X86_REG_EIP,UC_X86_REG_EAX
from decomp import native_cpu,configure_native_constants
root=Path(__file__).resolve().parents[1]
cpu,_=native_cpu(Path(sys.argv[1]));configure_native_constants(cpu,Path(sys.argv[1]));cpu.mem_map(0x2000000,0x20000)
base,stack,stop=0x2000000,0x201d000,0x201e000
rng=random.Random(0x4d1450)
def write(a,fmt,*v):cpu.mem_write(a,struct.pack('<'+fmt,*v))
def read(a,fmt):return struct.unpack('<'+fmt,cpu.mem_read(a,struct.calcsize('<'+fmt)))[0]
def call(a,*args):
    write(stack,'I'*(len(args)+1),stop,*args);cpu.reg_write(UC_X86_REG_ESP,stack)
    cpu.emu_start(a,stop,timeout=1000000,count=1000000)
    assert cpu.reg_read(UC_X86_REG_EIP)==stop,hex(cpu.reg_read(UC_X86_REG_EIP))
    return cpu.reg_read(UC_X86_REG_EAX)
def compare(cases,expected,body):
    js="import * as s from './app/spell-casting.ts';import * as m from './app/native-math.ts';import {createWorld} from './app/model.ts';let text='';for await(const c of process.stdin)text+=c;console.log(JSON.stringify(JSON.parse(text).map(c=>{"+body+"})));"
    r=subprocess.run(['node','--input-type=module','-e',js],input=json.dumps(cases),capture_output=True,text=True,cwd=root);assert r.returncode==0,r.stderr
    actual=json.loads(r.stdout);assert len(actual)==len(expected)
    for i,(a,b) in enumerate(zip(expected,actual)):
        if a!=b:
            p=Path('/private/tmp/populous-spell-casting-failure.json');p.write_text(json.dumps(dict(case=cases[i],native=a,browser=b),indent=2));raise AssertionError((i,str(p)))
def reset():
    cpu.mem_write(base,bytes(0x10000));cpu.mem_write(0x89d1c8,bytes(4*0xc65));cpu.mem_write(0x890390,bytes(4096))
    cpu.mem_write(0x96070a,bytes(56*4));write(0x89d17c,'I',0)

for batch in range(8):
    cases=[];expected=[]
    for trial in range(256):
        reset();tribe=trial%4;t=0x89d1c8+tribe*0xc65
        game=rng.choice([0,0,32]);flags=rng.choice([0,0,8,0x80000]);h=rng.choice([-32768,-129,-128,-1,0,1,127,128,255,256,895,896,897,32767,rng.randrange(-32768,32768)])
        b=rng.choice([None,dict(class_=2,model=4,state=2),dict(class_=2,model=4,state=1),dict(class_=2,model=7,state=2),dict(class_=1,model=4,state=2)])
        if b:b['class']=b.pop('class_')
        caster=dict(height=h,flags2=rng.choice([0,0x800000]),building=b)
        write(0x89d17c,'I',game);write(t+0x93d,'I',flags);write(base+0x2f,'B',tribe)
        write(base+0x41,'h',h);write(base+0xc,'I',caster['flags2']);write(0x8a03ec,'H',1 if b else 0)
        if b:
            write(0x890394,'I',base+256)
            for off,key in [(0x2a,'class'),(0x2b,'model'),(0x2c,'state')]:write(base+256+off,'B',b[key])
        model=rng.randrange(1,22);r=call(0x4c2e30,base,tribe,model);r=r if r<2**31 else r-2**32
        group=None if trial%3==0 else dict(type=rng.choice([0,19,20,20]),spells=[rng.randrange(22) for _ in range(3)])
        if group:
            write(base+0xaf,'B',1);write(t+0x36+0x4f,'B',group['type']);write(t+0x36+0x1f,'3B',*group['spells'])
        reserve=call(0x4f2f50,t,base);reserve=reserve if reserve<2**31 else reserve-2**32
        mana=rng.choice([0,10000,19999,20000,30000,1000000,2147483647,-2147483648]);write(t+0x94d,'i',mana)
        entries=[dict(model=rng.randrange(22),mana=rng.choice([0,10000,1000000,2147483647,-2147483648,-1])) for _ in range(8)]
        for i,e in enumerate(entries):
            write(t+0x4c6+i*12,'i',e['mana']);write(t+0x4ce+i*12,'B',e['model']);write(t+0x4cf+i*12,'B',123)
        exists=trial%5!=0;write(t+0x89d,'I',base if exists else 0);call(0x4d1450,t)
        cases.append(dict(game=game,flags=flags,caster=caster,exists=exists,model=model,mana=mana,entries=entries,group=group))
        expected.append(dict(range=r,reserve=reserve,ready=[read(t+0x4cf+i*12,'B') for i in range(8)]))
    compare(cases,expected,"const reserve=s.reservedSpellMana(c.group);return {range:s.nativeSpellRange(c.game,c.flags,c.caster,c.model),reserve,ready:s.spellEntryRanges(c.game,c.flags,c.mana,c.exists?c.caster:null,c.entries,reserve)};")
print('PASS: 2,048 full native ranges, attack reserves and eight-entry readiness updates')

def leaf(cpu,address,size,user):
    sp=cpu.reg_read(UC_X86_REG_ESP)
    cpu.reg_write(UC_X86_REG_EAX,0xffffffff if address==0x430bd0 else 0)
    cpu.reg_write(UC_X86_REG_EIP,read(sp,'I'));cpu.reg_write(UC_X86_REG_ESP,sp+4)
# Allocation failure, projectile initialization, notification slot unavailable.
for a in [0x4ed8a0,0x4c1b80,0x430bd0]:cpu.hook_add(UC_HOOK_CODE,leaf,begin=a,end=a)
cases=[];expected=[]
for i in range(1024):
    reset();owner=i%4;t=0x89d1c8+owner*0xc65;model=rng.randrange(1,22)
    game=rng.choice([0,32]);flags=rng.choice([0,8]);incoming=rng.choice([0,10000,2147483647,-2147483648])
    stock=dict(available=rng.getrandbits(22),disabled=rng.getrandbits(22),stocks=[rng.randrange(256) for _ in range(22)])
    write(0x89d17c,'I',game);write(t+0x93d,'I',flags);write(t+0x955,'i',incoming);write(t+0xc22,'B',owner);write(t+0xc1f,'B',1)
    write(t+0x89d,'I',base);write(0x96070a+owner*56,'I',stock['available']);write(0x96071a+owner*56,'I',stock['disabled']);write(0x96071e+owner*56,'22B',*stock['stocks'])
    kind=call(0x4c29a0,model,owner)&255
    write(0x892443,'I',base+0x1000);call(0x4f4de0,t,model,0)
    price=read(base+0x1000,'i');stocks=list(cpu.mem_read(0x96071e+owner*56,22))
    # Replay the prepared initialization record as a successfully allocated spell.
    write(base+0x2b,'B',model);write(base+0x2f,'B',owner);write(base+0xc,'I',0x400)
    call(0x4c14c0,base)
    cases.append(dict(game=game,flags=flags,incoming=incoming,owner=owner,model=model,stock=stock))
    expected.append(dict(kind=kind,price=price,stocks=stocks,incoming=read(t+0x955,'i')))
compare(cases,expected,"const w={gameFlags:c.game,spells:Array.from({length:4},()=>structuredClone(c.stock))},t={available:c.incoming};const kind=s.spellPaymentType(c.game,c.flags,c.stock,c.model),price=s.prepareSpellPayment(w,c.owner,c.flags,c.model);s.debitSpellMana(t,c.flags,price);return {kind,price,stocks:w.spells[c.owner].stocks,incoming:t.available};")
print('PASS: 1,024 native payment types, stock consumption on allocation failure and successful-initializer mana debits')
# Run actual tribe clear including actual computer initialization; compare only
# starting retained/pending/incoming mana, not unrelated tribe state.
reset();write(0x89c661,'I',0);write(0x89c6f0,'B',0)
expected=[]
for i in range(4):
    call(0x42b660,i);t=0x89d1c8+i*0xc65
    expected.append(dict(mana=read(t+0x94d,'i'),pending=read(t+0x951,'i'),available=read(t+0x955,'i')))
compare([None],[expected],"return createWorld().manaTribes.map(({mana,pending,available})=>({mana,pending,available}));")
print('PASS: native starting mana for all four tribes')

cases=[];expected=[]
for i in range(2048):
    reset();t=0x89d1c8;game=rng.choice([0,32]);flags=rng.choice([0,0,0x80000]);model=rng.randrange(1,22)
    a=rng.randrange(65536);b=rng.randrange(65536);radius=rng.choice([-1,0,1,3,127,128,255])
    x=rng.randrange(65536);y=rng.randrange(65536);tx=(x+rng.randrange(-8192,8192))&65535;ty=(y+rng.randrange(-8192,8192))&65535
    caster=dict(x=x,y=y,height=rng.randrange(-32768,32768),flags2=0,building=None)
    write(base+0x3d,'HHh',x,y,caster['height']);write(base+0x100,'HH',tx,ty);write(t+0x93d,'I',flags);write(0x89d17c,'I',game)
    cell=(tx>>8)|((ty>>8)<<8)
    expected.append(dict(squared=call(0x49c720,a,b),near=bool(call(0x4f2fc0,a,b,radius&0xffffffff)),distance=call(0x4503f0,base+0x3d,base+0x100),range=bool(call(0x4f3040,base,cell,model))))
    cases.append(dict(a=a,b=b,radius=radius,caster=caster,target=dict(x=tx,y=ty),cell=cell,game=game,flags=flags,model=model))
compare(cases,expected,"return {squared:m.cellDistanceSquared(c.a,c.b),near:m.cellsNear(c.a,c.b,c.radius),distance:m.positionDistance(c.caster,c.target),range:s.computerSpellInRange(c.game,c.flags,c.caster,c.cell,c.model)};")
print('PASS: 2,048 native wrapped cell/position distances, proximity checks and complete AI target range calls')

current=None;events=[]
def target_leaf(cpu,address,size,user):
    sp=cpu.reg_read(UC_X86_REG_ESP);result=0
    if address==0x44b060:events.append(['cursor']);result=current['blocked']
    elif address==0x4bb160:
        events.append(['bridge']);write(read(sp+8,'I'),'HH',current['start']['x'],current['start']['y'])
    elif address==0x499d90:events.append(['notify',read(sp+4,'I'),read(sp+8,'I')])
    else:result=current['defending']
    cpu.reg_write(UC_X86_REG_EAX,result);cpu.reg_write(UC_X86_REG_EIP,read(sp,'I'));cpu.reg_write(UC_X86_REG_ESP,sp+4)
for a in [0x44b060,0x4bb160,0x499d90,0x4f3ef0]:cpu.hook_add(UC_HOOK_CODE,target_leaf,begin=a,end=a)
cases=[];expected=[];coverage={-1:0,-2:0,-3:0,1:0};filter_cases=[];filter_expected=[]
for i in range(2048):
    reset();events=[];t=0x89d1c8
    def point():return dict(x=rng.randrange(65536),y=rng.randrange(65536))
    origin=point();target={k:(v+rng.randrange(-8192,8192))&65535 for k,v in origin.items()}
    game=rng.choice([0,0,32]);flags=rng.choice([0,0,0x80000]);model=rng.choice([0,2,3,12,12,12,21]);terrain=rng.choice([0,2])
    caster=None if i%8==0 else dict(**origin,height=rng.randrange(1024),flags2=rng.choice([0,0,1,2]),flags4=rng.choice([0,0x400,0x2000000]),state=rng.choice([0,0,3,22]),landIndex=rng.choice([0,0,1]),building=None,playerType=rng.choice([1,2]),casting=dict(flags=flags,cooldown=rng.choice([0,0,12]),aiCooldown=rng.choice([0,0,12]),spells=[]))
    c=dict(game=game,flags=flags,origin=origin,caster=caster,model=model,target=target,terrain=terrain,check=i%2==0,notify=i%3!=0,blocked=i%5==0,start=point())
    current=c;write(0x89d17c,'I',game);write(t+0x93d,'I',flags);write(t+0x911,'HH',origin['x'],origin['y']);write(base+0x100,'HH',target['x'],target['y'])
    cell=((target['y']>>9)*128+(target['x']>>9))*16
    # Terrain categories use a 14-byte descriptor; flags at +0, category at cell+c.
    write(0x8a03e4+cell+12,'B',1 if terrain else 0)
    if caster:
        write(t+0x89d,'I',base);write(base+0x3d,'HHh',caster['x'],caster['y'],caster['height']);write(base+0xc,'I',caster['flags2']);write(base+0x10,'I',caster['flags4']);write(base+0x2c,'B',caster['state']);write(base+0x9f,'H',caster['landIndex'])
        write(t+0xc1f,'B',caster['playerType']);write(t+0xc5e,'B',caster['casting']['cooldown']);write(t+0x5bd,'B',caster['casting']['aiCooldown'])
    result=call(0x4c24f0,0,int(c['check']),model,base+0x100,int(c['notify']));result=result if result<2**31 else result-2**32
    expected.append(dict(result=result,events=events.copy()));cases.append(c);coverage[result]+=1
    ranges=[rng.randrange(256) for _ in range(8)];entries=[dict(people=rng.randrange(256),mode=rng.choice([0,1,255])) for _ in range(8)]
    friendly=[rng.randrange(100) for _ in range(3)];enemies=rng.randrange(256);current=dict(defending=i%2)
    for j in range(8):write(t+0x4cf+j*12,'BBB',ranges[j],entries[j]['people'],entries[j]['mode'])
    write(base+0x214,'HHH',*friendly);write(base+0x222,'H',enemies)
    call(0x4d1340,t,0,base+0x200)
    filter_cases.append(dict(ranges=ranges,entries=entries,defending=bool(i%2),friendly=friendly,enemies=enemies));filter_expected.append([read(t+0x4cf+j*12,'B') for j in range(8)])
compare(cases,expected,"const events=[];const result=s.validateSpellTarget(c.game,c.flags,c.origin,c.caster,c.model,c.target,c.terrain,c.check,c.notify,{cursorBlocked:()=>{events.push(['cursor']);return c.blocked},bridgeStart:()=>{events.push(['bridge']);return c.start},notify:(f,m)=>events.push(['notify',f,m])});return {result,events};")
compare(filter_cases,filter_expected,"s.filterSpellEntries(c.ranges,c.entries,c.defending,c.friendly,c.enemies);return c.ranges;")
assert all(coverage.values()),coverage
print('PASS: 2,048 complete player target validations and 2,048 entry mode/population filters; result coverage:',coverage)
