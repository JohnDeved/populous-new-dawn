"""Compare complete 0x418e30 campaign/multiplayer outcome decisions.
World-effect consumers (camera, defeat effect/cleanup, input, reveal, campaign
progress, results, person release/init/damage) are supplied and their ordered
requests compared. Defeat's known 0x41b8b0 last-tribe prefix is applied.
Usage: python scripts/check-native-outcomes.py /path/to/d3dpoptb.exe
"""
import json,random,struct,subprocess,sys
from pathlib import Path
from unicorn import UC_HOOK_CODE
from unicorn.x86_const import UC_X86_REG_ESP,UC_X86_REG_EIP
from decomp import native_cpu
root=Path(__file__).resolve().parents[1]
cpu,_=native_cpu(Path(sys.argv[1]));cpu.mem_map(0x2000000,0x20000)
base,stack,stop=0x2000000,0x201d000,0x201e000
rng=random.Random(0x418e30);events=[];addresses={}
def write(a,fmt,*v):cpu.mem_write(a,struct.pack('<'+fmt,*v))
def read(a,fmt):return struct.unpack('<'+fmt,cpu.mem_read(a,struct.calcsize('<'+fmt)))[0]
def tribe(i):return 0x89d1c8+i*0xc65
def event(name,*args):events.append([name,list(args),read(0x89c661,'I')])
def leaf(cpu,address,size,user):
    sp=cpu.reg_read(UC_X86_REG_ESP)
    if address==0x41b610:event('camera',read(sp+4,'b'))
    elif address==0x41b8b0:
        id=read(sp+4,'b');write(0x89d165,'b',id);event('defeat',id)
    elif address==0x4af1c0:assert read(sp+4,'I')==1;event('cancelInput')
    elif address==0x450610:assert [read(sp+4,'I'),read(sp+8,'I')]==[1,0];event('reveal')
    elif address==0x4860c0:event('completeLevel',read(sp+4,'i'))
    elif address==0x4164b0:event('networkResult',bool(read(sp+4,'I')),read(sp+8,'I'))
    elif address in [0x4ed6f0,0x4ed640]:
        p=read(sp+4,'I');event('releasePerson' if address==0x4ed6f0 else 'initPerson',addresses[p],read(p+0x2c,'B'),read(p+0x7d,'B'))
    else:
        assert [read(sp+8,'i'),read(sp+16,'I')]==[-1,1]
        p=read(sp+4,'I');event('damage',addresses[p],read(sp+12,'i'),read(p+0x14,'I'))
    cpu.reg_write(UC_X86_REG_EIP,read(sp,'I'));cpu.reg_write(UC_X86_REG_ESP,sp+4)
for a in [0x41b610,0x41b8b0,0x4af1c0,0x450610,0x4860c0,0x4164b0,0x4ed6f0,0x4ed640,0x4da080]:
    cpu.hook_add(UC_HOOK_CODE,leaf,begin=a,end=a)

cases=[];expected=[];coverage={name:0 for name in ['camera','defeat','cancelInput','reveal','completeLevel','networkResult','releasePerson','initPerson','damage']}
for i in range(2064):
    w=dict(turn=rng.choice([0,15,16,17,31,32,32,48,48,64,0xfffffff0,0xffffffff]),
      landFlags=rng.choice([0,0,8,8])|rng.choice([0,0,0x2000000,0x4000000,0x6000000]),playerTribe=rng.randrange(4),
      campaignTribes=rng.randrange(1,5),level=rng.choice([1,25,32767,65535]),progressFlags=rng.randrange(256),
      lastDefeated=rng.randrange(4),defeatedCounts=[rng.choice([0,1,0x7fffffff,-1]) for _ in range(4)],
      alliances=[rng.choice([0,0,15,rng.randrange(16)]) for _ in range(4)])
    ts=[]
    for id in range(4):
        people=[dict(id=id*4+j,model=rng.choice([2,3,7,8]),state=rng.choice([0,3,14,41]),previousState=99,
          flags2=rng.choice([0,0x100000,0x800000]),flags3=rng.getrandbits(32),hp=rng.choice([0,1,1000,32767,-1])) for j in range(3)]
        ts.append(dict(active=bool(rng.randrange(2)),defeatTimer=rng.choice([0,0,0,1,17,81,96,97,-16,-1,-2147483648]),
          flags2=rng.choice([0,1,64]),playerType=1,flags=rng.choice([0,0,0x20000,0x40000,0x60000]),population=rng.choice([0,0,1,10,-1]),people=people))
    if i<16:
        w.update(turn=32,landFlags=8 if i>=8 else 0,playerTribe=0,campaignTribes=4,alliances=[15]*4)
        for id,t in enumerate(ts):t.update(active=True,defeatTimer=0,flags=0,flags2=0,population=0 if id else 1)
        if i==0:w['turn']=16
        if i==1:ts[0]['population']=0
        if i==2:ts[1]['population']=1
        if i==3:ts[1]['population']=1;ts[0]['flags']=0x40000
        if i==4:ts[0]['flags']=0x60000
        if i==5:ts[0]['defeatTimer']=1
        if i==6:ts[1].update(active=False,population=1)
        if i==7:w['landFlags']=0x2000000
        if i==8:ts[0]['population']=0
        if i>=10:ts[1]['population']=1
        if i==11:w['alliances'][0]=0
        if i==12:w['alliances'][1]=0
        if i==13:w['playerTribe']=-1
        if i==14:ts[0]['population']=0
        if i==15:ts[0]['flags2']=1;ts[1]['flags2']=1
    # One sequence proves the one-time defeat transition and timer advance to 97.
    turns=[32,48,64,80,96,112,128,144] if i==2 else [w['turn']]
    cases.append(dict(world=w,tribes=ts,turns=turns));cpu.mem_write(tribe(0),bytes(4*0xc65));cpu.mem_write(base,bytes(0x10000))
    write(0x89c661,'I',w['landFlags']);write(0x89c6f0,'b',w['playerTribe']);write(0x96eac0,'B',w['campaignTribes']);write(0x89c6dd,'H',w['level'])
    write(0x9608b2,'B',w['progressFlags']);write(0x89d165,'b',w['lastDefeated']);cpu.mem_write(0x9608b6,bytes(w['alliances']))
    addresses={}
    for id,t in enumerate(ts):
        a=tribe(id);write(a+0xc20,'B',int(t['active']));write(a+0x949,'i',t['defeatTimer']);write(a+0x941,'I',t['flags2'])
        write(a+0x93d,'I',t['flags']);write(a+0x91d,'i',t['population']);write(0x969dce+id*48,'i',w['defeatedCounts'][id])
        write(a+0x881,'I',base+(id*4+1)*256)
        for j,p in enumerate(t['people']):
            a=base+(id*4+j+1)*256;addresses[a]=p['id'];write(a+8,'I',a+256 if j<2 else 0)
            write(a+0x2b,'BB',p['model'],p['state']);write(a+0x7d,'B',p['previousState']);write(a+0xc,'I',p['flags2'])
            write(a+0x14,'I',p['flags3']);write(a+0x6e,'h',p['hp'])
    results=[]
    for turn in turns:
        write(0x89d188,'I',turn);write(stack,'I',stop);cpu.reg_write(UC_X86_REG_ESP,stack);events=[]
        cpu.emu_start(0x418e30,stop,timeout=1000000,count=1000000);assert cpu.reg_read(UC_X86_REG_EIP)==stop,hex(cpu.reg_read(UC_X86_REG_EIP))
        results.append(dict(landFlags=read(0x89c661,'I'),progressFlags=read(0x9608b2,'B'),lastDefeated=read(0x89d165,'b'),
          defeatedCounts=[read(0x969dce+id*48,'i') for id in range(4)],
          tribes=[dict(defeatTimer=read(tribe(id)+0x949,'i'),flags2=read(tribe(id)+0x941,'I')) for id in range(4)],
          people=[dict(id=id,state=read(a+0x2c,'B'),previousState=read(a+0x7d,'B'),flags3=read(a+0x14,'I')) for a,id in addresses.items()],events=events.copy()))
        for e in events:coverage[e[0]]+=1
    expected.append(results)

js="""import {processOutcome} from './app/tribe-turns.ts';
let input='';for await(const c of process.stdin)input+=c;
console.log(JSON.stringify(JSON.parse(input).map(c=>{
 const w=c.world,events=[],record=(name,...args)=>events.push([name,args,w.landFlags>>>0]);
 const effects={camera:id=>record('camera',id),defeat:id=>record('defeat',id),cancelInput:()=>record('cancelInput'),reveal:()=>record('reveal'),
  completeLevel:index=>record('completeLevel',index),networkResult:(allied,n)=>record('networkResult',allied,n),
  releasePerson:p=>record('releasePerson',p.id,p.state,p.previousState),initPerson:p=>record('initPerson',p.id,p.state,p.previousState),damage:(p,n)=>record('damage',p.id,n,p.flags3)};
 return c.turns.map(turn=>{w.turn=turn;events.length=0;processOutcome(w,c.tribes,effects);
  return structuredClone({landFlags:w.landFlags>>>0,progressFlags:w.progressFlags,lastDefeated:w.lastDefeated,defeatedCounts:w.defeatedCounts,
   tribes:c.tribes.map(({defeatTimer,flags2})=>({defeatTimer,flags2})),people:c.tribes.flatMap(t=>t.people.map(({id,state,previousState,flags3})=>({id,state,previousState,flags3}))),events});
 });
})));"""
r=subprocess.run(['node','--input-type=module','-e',js],input=json.dumps(cases),capture_output=True,text=True,cwd=root);assert r.returncode==0,r.stderr
actual=json.loads(r.stdout);assert len(actual)==len(expected)
for i,(a,b) in enumerate(zip(expected,actual)):
    if a!=b:
        p=Path('/private/tmp/populous-outcome-failure.json');p.write_text(json.dumps(dict(case=cases[i],native=a,browser=b),indent=2));raise AssertionError((i,str(p)))
assert all(coverage.values()),coverage
print('PASS:',sum(map(len,expected)),'complete native outcome calls;',coverage)
