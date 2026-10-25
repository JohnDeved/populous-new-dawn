"""Execute native panel unload command 0x60 through real order clearing/ejection.
Only exit-position and asset-backed animation setters are supplied. No original world presentation runs.
"""
import sys
from pathlib import Path
root=Path.cwd();sys.path.insert(0,str(root/'scripts'))
source=(root/'scripts/check-native-training-selection.py').read_text().split('input_count=0')[0]
exec(compile(source,str(root/'scripts/check-native-training-selection.py'),'exec'))
write(0x59df44,'I',0x2020000)
leaves=[];exit_valid=True
def supplied(cpu,a,size,user):
 sp=cpu.reg_read(UC_X86_REG_ESP)
 if a==0x466190:
  to=read(sp+8,'I');write(to,'HH',0x4300,0x4100);cpu.reg_write(UC_X86_REG_EAX,int(exit_valid))
 leaves.append(hex(a));cpu.reg_write(UC_X86_REG_EIP,read(sp,'I'));cpu.reg_write(UC_X86_REG_ESP,sp+4)
for a in [0x466190,0x4d4040]:cpu.hook_add(UC_HOOK_CODE,supplied,begin=a,end=a)
cases=[]
for model,capacity,initial_flags2 in [(m,n,f) for m,n in [(1,5),(2,5),(3,2),(4,2)] for f in [0x08020000,0x08024000]]:
 for count in [0,1,capacity]:
  for all_passengers in [0,1]:
   for exit_valid in [False,True]:
    cpu.mem_write(building,bytes(256));write(building+0x24,'H',2);write(building+0x2a,'BBB',4,model,1);write(building+0x3d,'HHh',0x4100,0x4100,128);write(building+0x92,'I',0x100000);write(building+0x9e,'B',count)
    before=[]
    for i in range(capacity):
     p=people+i*256;pid=10+i;cpu.mem_write(p,bytes(256));write(0x890390+pid*4,'I',p);write(p+0x24,'H',pid);write(p+0x2a,'BBB',1,2,10);write(p+0x2f,'B',0);write(p+0x3d,'HHh',0x4100,0x4100,128)
     write(p+0xc,'III',initial_flags2,0x02000200,0);write(p+0x6e,'h',1000);write(p+0x9f,'HH',2,99);write(p+0xa7,'B',3);write(p+0x89,'H',77)
     write(p+0x8b,'8H',1,2,0,0,0,0,0,0);write(p+0x9b,'H',3)
     if i<count:write(building+0x7a+i*2,'H',pid)
    for i in range(1,4):write(0x938830+i*10,'BBHHHH',3,0,capacity,0,0,0)
    write(0x89d178,'I',0x12345678)
    write(command,'IIIBBB',0,2,all_passengers,0x60,0,0);leaves=[];call(0x43e8e0,tribe,command)
    result=[]
    for i in range(capacity):
     p=people+i*256
     result.append(dict(id=10+i,x=read(p+0x3d,'H'),y=read(p+0x3f,'H'),h=read(p+0x41,'h'),vehicle=read(p+0x9f,'H'),savedVehicle=read(p+0xa1,'H'),workTarget=read(p+0x89,'H'),commands=list(struct.unpack('<8H',cpu.mem_read(p+0x8b,16))),immediateCommand=read(p+0x9b,'H'),cursor=read(p+0xa6,'B'),commandStatus=read(p+0xa7,'B'),flags2=read(p+0xc,'I'),flags4=read(p+0x10,'I'),speed=read(p+0x5f,'h'),velocity=list(struct.unpack('<3h',cpu.mem_read(p+0x49,6))),state=read(p+0x2c,'B'),anchorX=read(p+0x68,'H'),anchorY=read(p+0x6a,'H')))
    cases.append(dict(model=model,capacity=capacity,initialFlags2=initial_flags2,count=count,all=all_passengers,exitValid=exit_valid,passengerCount=read(building+0x9e,'B'),passengers=list(struct.unpack('<5H',cpu.mem_read(building+0x7a,10))),navigationFlags=read(building+0x92,'I'),vehicleA0=read(building+0xa0,'B'),vehicleA1=read(building+0xa1,'B'),people=result,randomState=read(0x89d178,'I'),leaves=leaves))

print('Captured',len(cases),'complete native unload commands with real order cleanup/ejection and supplied exit/animation leaves')

for c in cases:
 removed=min(c['count'],c['capacity'] if c['all'] else 1) if c['exitValid'] else 0
 assert c['passengerCount']==c['count']-removed
 for i,p in enumerate(c['people']):
  touched=i<removed or (not c['exitValid'] and c['count'] and i==0)
  assert p['workTarget']==77 and (p['x'],p['y'],p['h'])==(0x4100,0x4100,128)
  if touched:
   assert p['savedVehicle']==0 and not any(p['commands']) and not p['immediateCommand'] and not p['commandStatus']
   assert p['flags2']==(c['initialFlags2']&~0x08000000&(~0x4000 if i<removed else 0xffffffff))
  else:
   assert p['savedVehicle']==99 and p['commands'][:2]==[1,2] and p['immediateCommand']==3
  if i<removed:
   assert p['vehicle']==0 and p['flags4']==0x1000400 and p['velocity']==[160,60,0] and p['state']==10 and p['anchorX']==0 and p['anchorY']==0
  else: assert p['vehicle']==2
 assert bool(c['navigationFlags']&2)==bool(removed)
print('PASS: all96 unload outcomes match removal, unchanged position/state/anchors, savedVehicle/order cleanup, unchanged workTarget, and voluntary launch flags')

script="""import {unloadVehiclePeople} from './app/vehicle-unload.ts';import {clearPersonOrders} from './app/person-orders.ts';
let input='';for await(const chunk of process.stdin)input+=chunk;
console.log(JSON.stringify(JSON.parse(input).map(c=>{
 const rng={randomState:0x12345678},v={id:2,model:c.model,team:'blue',passengerCount:c.count,passengers:Array.from({length:c.count},(_,i)=>10+i),navigationFlags:0x100000};
 const people=Array.from({length:c.capacity},(_,i)=>({id:10+i,model:2,tribe:0,physics:0,assignment:0,substate:0,x:0x4100,y:0x4100,h:128,vehicle:2,savedVehicle:99,workTarget:77,commands:[1,2,0,0,0,0,0,0],immediateCommand:3,commandCursor:0,commandStatus:3,flags2:c.initialFlags2,flags4:0x02000200,flags3:0,speed:0,velocity:{x:0,y:0,z:0},state:10,anchorX:0,anchorY:0}));
 const pool={active:3,cursor:0,records:Array.from({length:4},()=>({model:3,flags:0,references:c.capacity,object:0,a:0,b:0}))};
 unloadVehiclePeople(rng,v,new Map(people.map(p=>[p.id,p])),{exit:()=>({point:{x:0x4300,y:0x4100},found:c.exitValid}),clearOrders:p=>clearPersonOrders(pool,p,{}),launched:()=>{}},!!c.all);
 return {passengerCount:v.passengerCount,navigationFlags:v.navigationFlags,randomState:rng.randomState,people:people.map(p=>Object.fromEntries(Object.keys(c.people[0]).map(key=>[key,key==='velocity'?[p.velocity.x,p.velocity.y,p.velocity.z]:key==='cursor'?p.commandCursor:p[key]])))};
})));"""
run=subprocess.run(['node','--input-type=module','-e',script],cwd=root,input=json.dumps(cases),text=True,capture_output=True)
assert run.returncode==0,run.stderr
for c,actual in zip(cases,json.loads(run.stdout),strict=True):
 expected={key:c[key] for key in ['passengerCount','navigationFlags','randomState','people']}
 assert actual==expected,(c,actual)
print('PASS: 96 native/TypeScript voluntary-unload commands, exact order/person/impulse and RNG consequences')
