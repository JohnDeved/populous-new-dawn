"""Compare 0x405b80, including actual shared commands, geometry and occupant exits.
Usage: python scripts/check-native-training-conversion.py /path/to/d3dpoptb.exe
Allocation/registration, deletion, mana credit, panel activation and existing world consumers
are supplied effects. This does not claim a full native allocation or UI-panel port.
"""
import json,random,runpy,struct
from pathlib import Path
from unicorn import UC_HOOK_CODE
from unicorn.x86_const import UC_X86_REG_ESP,UC_X86_REG_EIP,UC_X86_REG_EAX

# Reuse the occupancy fixture without executing its standalone comparisons.
o=runpy.run_path(str(Path(__file__).with_name('check-native-occupants.py')))
cpu=o['cpu'];read=o['read'];write=o['write'];addr=o['addr'];call=o['call']
o['fields']['reservationNext']=(0x85,'H')
o['bfields'].update(tickPhase=(0x2e,'B'),storedMana=(0x98,'H'))
rng=random.Random(0x405b80);current=None;allocated=0
def counter(tribe,model,delta):
    a=0x89d1c8+tribe*0xc65+0xa27+model*2;write(a,'H',(read(a,'H')+delta)&65535)
def leaf(cpu,address,size,user):
    global allocated
    sp=cpu.reg_read(UC_X86_REG_ESP);a,b,c,d=struct.unpack('<4I',cpu.mem_read(sp+4,16));result=0
    events=o['fixture'].__globals__['actions']
    if address==0x509290:
        events.append(['panel',read(a+0x24,'H')]);write(a+0x14,'I',read(a+0x14,'I')|current['panelFlags'])
    elif address==0x438730:
        x,y=struct.unpack('<2H',cpu.mem_read(c,4));events.append(['prepare',a&65535,b&255,x,y,d&255])
        target=0x938830+(a&65535)*10
        write(target,'B',b&255);write(target+1,'B',read(target+1,'B')|(d&255));write(target+6,'2H',x,y)
    elif address==0x4ed8a0:
        x,y,h=struct.unpack('<3H',cpu.mem_read(d,6));init=read(0x892443,'I')-20
        initialization=list(struct.unpack('<5i',cpu.mem_read(init,20)))
        events.append(['allocate',a&255,b&255,c&255,x,y,h,initialization,read(0x89243a,'B')])
        write(0x892443,'I',init);write(0x89243a,'B',0)
        if allocated<current['failAfter']:
            id_=200+allocated;allocated+=1;result=addr(id_)
            write(result+0x2a,'2B',a&255,b&255);write(result+0x2f,'B',c&255)
            write(result+0x3d,'3H',x,y,h);write(result+0x26,'H',initialization[2]&65535)
            counter(c&255,b&255,1)
    elif address==0x41a4f0:
        tribe=(a-0x89d1c8)//0xc65;events.append(['mana',tribe,b,c])
    else:raise AssertionError(hex(address))
    cpu.reg_write(UC_X86_REG_EAX,result);cpu.reg_write(UC_X86_REG_EIP,read(sp,'I'));cpu.reg_write(UC_X86_REG_ESP,sp+4)
for a in [0x509290,0x438730,0x4ed8a0,0x41a4f0]:cpu.hook_add(UC_HOOK_CODE,leaf,begin=a,end=a)
# Capture the argument at the two verified conversion CALL instructions. The
# shared delete leaf then records the call and returns; attached-object cleanup
# remains a separate supplied consumer.
def delete_call(cpu,address,size,user):
    a=read(cpu.reg_read(UC_X86_REG_ESP),'I')
    if read(a+0x2a,'B')==1:counter(read(a+0x2f,'B'),read(a+0x2b,'B'),-1)
    write(a+0x2a,'B',0)
# Only 0x405b80 object deletions; command-attached object deletion stays supplied.
for a in [0x4063c6,0x40641f]:cpu.hook_add(UC_HOOK_CODE,delete_call,begin=a,end=a)

js=o['js_prefix'].replace("import {stepTrainingPerson}","import {stepTrainingConversion} from './app/training-conversion.ts';import {stepTrainingPerson}")
js=js.replace('cursor:1,active:c.active','cursor:c.cursor,active:c.active')
o['compare'].__globals__['js_prefix']=js
body="""w.playerTribe=c.playerTribe;let allocated=0;
const short=n=>(n<<16)>>16;
effects.updateTrainingPanel=b=>{actions.push(['panel',b.id]);b.flags3=(b.flags3|c.panelFlags)>>>0;};
effects.orders.prepare=(order,model,x,y,flags)=>{actions.push(['prepare',w.orders.records.indexOf(order),model,x,y,flags]);
 order.model=model;order.flags|=flags;order.a=x;order.b=y;};
effects.allocateTrainee=(model,tribe,x,y,angle)=>{
 actions.push(['allocate',1,model,tribe,x,y,0,[short(x),short(y),short(angle),0,0],1]);
 if(allocated>=c.failAfter)return;
 const p=w.people.get(200+allocated++);Object.assign(p,{class:1,model,tribe,x,y,height:0,angle});
 w.tribes[tribe].personCounts[model]=short(w.tribes[tribe].personCounts[model]+1);return p;
};
effects.orders.deleteObject=id=>{actions.push(['delete',id]);const p=w.people.get(id);if(p){
 if(p.class===1)w.tribes[p.tribe].personCounts[p.model]=short(w.tribes[p.tribe].personCounts[p.model]-1);p.class=0;}};
effects.addMana=(tribe,amount)=>actions.push(['mana',tribe,amount,0]);
stepTrainingConversion(w,b,effects);return {...snapshot(0),cursor:w.orders.cursor,counts:w.tribes.map(t=>t.personCounts)};
"""

rules=json.loads((o['root']/'app/original-rules.json').read_text())
coverage=dict(completed=0,ghost=0,rollback=0,mana=0,queue=0,exhausted=0)
for batch in range(8):
    cases=[];expected=[]
    for trial in range(128):
        c=o['case']();b=c['building'];i=batch*128+trial
        b.update(model=5+i%5,object=[95,103,131,154][i%4],angle=(i%4)*512,
          anchorX=rng.randrange(128)*512,anchorY=rng.randrange(128)*512,tribe=i%4,
          activity=8|(128 if i%4 else 0),tickPhase=rng.choice([0,1,15,16,255]),
          trainingCost=rng.choice([0,1,100,4375,65535]),storedMana=rng.choice([0,100,4375,65535]),
          flags3=rng.getrandbits(32),lastActivity=rng.getrandbits(32))
        trained=rules['buildingTrainedModel'][b['model']];capacity=rules['buildingCapacity'][b['model']]
        b['class']=9 if i%13==0 else 2
        b['occupants']=[id_ if id_<=capacity and rng.randrange(4) else 0 for id_ in range(1,7)]
        b['inside']=sum(bool(id_) for id_ in b['occupants']);b['queueHead']=6
        for p in c['people']:
            p.update(model=rng.choice([2,2,2,trained,7]),tribe=b['tribe'],flags2=0x800000,
              flags4=0x800 if rng.randrange(9)==0 else 0,commandCursor=rng.randrange(8),
              commands=[rng.choice([0,0,1,2,3,4,5,6,7]) for _ in range(8)],
              reservationNext=7 if p['id']==6 else 0)
        # Empty allocation records are included in snapshots to catch rollback.
        for id_ in range(200,216):
            p={key:0 for key in o['fields']};p.update(id=id_,commands=[0]*8);c['people'].append(p)
        c['orders']+= [dict(model=0,flags=0,references=0,object=0,a=123,b=456) for _ in range(792)]
        for index,order in enumerate(c['orders']):
            order.update(model=rng.choice([3,7,8,11,25]) if index<8 else 0,flags=rng.choice([0,0,1]),object=0,
              references=sum(p['commands'].count(index) for p in c['people']) if index else 0)
        c['cursor']=rng.choice([1,8,799]);c['active']=sum(order['references']>0 for order in c['orders'])
        if i%17==0:
            for order in c['orders'][1:]:order['references']=1
            c['active']=799
        c.update(failAfter=rng.choice([0,1,2,16,16]),playerTribe=rng.randrange(4),panelFlags=rng.choice([0,0x800000]),turn=rng.getrandbits(32))
        for t in c['tribes']:t.update(playerType=rng.choice([1,2]),personCounts=[rng.choice([0,3,4,7,8,12,21]) for _ in range(9)])
        current=c;allocated=0;o['fixture'](c)
        write(0x96aa78,'H',c['cursor']);write(0x89c6f0,'B',c['playerTribe']);write(0x892443,'I',0x202f000);write(0x89243a,'B',0)
        call(0x405b80,addr(100));result=o['snapshot'](c,0)
        result.update(cursor=read(0x96aa78,'H'),counts=[[read(0x89d1c8+t*0xc65+0xa27+m*2,'h') for m in range(9)] for t in range(4)])
        events=result['actions'];created=[e for e in events if e[0]=='allocate'];deleted=[e[1] for e in events if e[0]=='delete']
        completed=bool(created) and result['building']['lastActivity']==c['turn']
        coverage['completed']+=completed
        coverage['ghost']+=completed and any(p['class'] and p['id']>=200 and p['flags4']&0x800 for p in result['people'])
        coverage['rollback']+=any(id_>=200 for id_ in deleted)
        coverage['mana']+=any(e[0]=='mana' for e in events)
        coverage['queue']+=not(b['activity']&128) and result['building']['activity']&0x2000!=0
        coverage['exhausted']+=bool(created) and not any(e[0]=='prepare' for e in events)
        cases.append(c);expected.append(result)
    o['compare'](cases,expected,body,f'training conversion scenarios batch {batch+1}/8; actual exit, cost, shared allocation/attachment/cleanup and geometry')

assert all(coverage.values()),coverage
print('Verified branch coverage:',coverage)
