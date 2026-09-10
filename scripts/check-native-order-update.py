"""Compare native queue advancement, state-10 dispatch and idle handoff.
Usage: python scripts/check-native-order-update.py /path/to/d3dpoptb.exe
Native command lookup, cells, anchor centering, overlap and idle decision execute.
Command bodies and queue/world consumers are supplied, with ordered snapshots.
"""
import copy,json,random,struct,subprocess,sys
from pathlib import Path
from unicorn import UC_HOOK_CODE
from unicorn.x86_const import UC_X86_REG_ESP,UC_X86_REG_EIP,UC_X86_REG_EAX
from decomp import native_cpu,configure_native_constants
root=Path(__file__).resolve().parents[1];cpu,_=native_cpu(Path(sys.argv[1]));configure_native_constants(cpu,Path(sys.argv[1]));rng=random.Random(0x432590)
cpu.mem_map(0x2000000,0x10000);p,stack,stop=0x2000000,0x200e000,0x200f000
fields={'model':(0x2b,'B'),'state':(0x2c,'B'),'substate':(0x2d,'B'),'counter':(0x2e,'B'),'tribe':(0x2f,'b'),'x':(0x3d,'H'),'y':(0x3f,'H'),'goalX':(0x4f,'H'),'goalY':(0x51,'H'),'anchorX':(0x68,'H'),'anchorY':(0x6a,'H'),'anchorFlags':(0x82,'B'),'flags2':(0xc,'I'),'flags3':(0x14,'I'),'flags4':(0x10,'I'),'assignment':(0x76,'H'),'previousState':(0x7d,'B'),'commandCursor':(0xa6,'B'),'commandStatus':(0xa7,'B'),'immediateCommand':(0x9b,'H'),'vehicle':(0x9f,'H')}
ofields={'class':(0x2a,'B'),'model':(0x2b,'B'),'flags2':(0xc,'I'),'tribe':(0x2f,'b'),'x':(0x3d,'H'),'y':(0x3f,'H'),'timer':(0x70,'h'),'signal':(0x7a,'H')}
commands={3:0x4336c0,4:0x433800,6:0x495520,7:0x4340a0,8:0x434610,10:0x497a30,11:0x519f10,13:0x439a00,15:0x439d30,17:0x43a4d0,18:0x433a10,19:0x51a2a0,22:0x435160,27:0x43bcc0,28:0x51fce0,30:0x43daa0,33:0x43c7a0}
consumers={0x4364d0:'remove',0x43d2f0:'resumeVehicle',0x43d0e0:'resumeBuilding',0x436870:'prepareNext',0x432df0:'configure',0x4d4f40:'recover',0x4389c0:'commandPosition',0x435550:'vehicleDestination',0x466f30:'vehicleReady',0x466c80:'leaveVehicle',0x4de760:'changeTribe',0x4de740:'effectiveTribe',0x4044b0:'outside',0x4e9d80:'destination',0x4d58c0:'arrival',0x4d4ee0:'stop',0x4391c0:'formation',0x4366b0:'advance',0x4ed640:'initialize'}
# Resolve the formation call from instructions rather than inferred metadata.
from capstone import Cs,CS_ARCH_X86,CS_MODE_32
calls=[int(i.op_str,16) for i in Cs(CS_ARCH_X86,CS_MODE_32).disasm(bytes(cpu.mem_read(0x432a3e,31)),0x432a3e) if i.mnemonic=='call']
assert len(calls)==1;del consumers[0x4391c0];consumers[calls[0]]='formation'
def write(a,f,*v):cpu.mem_write(a,struct.pack('<'+f,*v))
def read(a,f):return struct.unpack('<'+f,cpu.mem_read(a,struct.calcsize('<'+f)))[0]
def point(a):return dict(x=read(a,'H'),y=read(a+2,'H'))
def get():return {**{k:read(p+off,f) for k,(off,f) in fields.items()},'commands':[read(p+0x8b+i*2,'H') for i in range(8)]}
def orders():return [dict(zip(['model','flags','references','object','a','b'],struct.unpack('<BBHHHH',cpu.mem_read(0x938830+i*10,10)))) for i in range(10)]
def objects():return [{k:read(p+i*256+off,f) for k,(off,f) in ofields.items()} for i in range(1,5)]
def snapshot():return dict(p=get(),orders=orders(),objects=objects())
def leaf(cpu,a,size,u):
 if a==0x4366b0 and mode in ['advance','composed']:return
 sp=cpu.reg_read(UC_X86_REG_ESP);args=[];result=0
 name=consumers.get(a)
 if a in commands.values():name='command';args=[next(k for k,v in commands.items() if v==a)]
 elif name=='remove':args=[read(sp+8,'b')]
 elif name=='commandPosition':args=[(read(sp+4,'I')-0x938830)//10]
 elif name=='vehicleDestination':args=[point(read(sp+8,'I')),read(sp+12,'i')]
 elif name=='vehicleReady':args=[(read(sp+4,'I')-p)//256]
 elif name=='changeTribe':args=[read(sp+8,'B')]
 elif name in ['outside','destination']:args=[point(read(sp+8,'I'))]
 elif name=='arrival':args=[read(sp+8,'i')]
 events.append([name,args,snapshot()])
 if name=='command':
  result=case['commandResult'];write(p+0x14,'I',case['commandFlags3'])
 elif name=='remove':
  slot=args[0];write(p+(0x9b if slot<0 else 0x8b+slot*2),'H',0);write(p+0xa7,'B',0)
 elif name in ['resumeVehicle','resumeBuilding','vehicleDestination','vehicleReady','leaveVehicle','advance']:result=case[name]
 elif name=='commandPosition':write(read(sp+8,'I'),'HH',case['point']['x'],case['point']['y'])
 elif name=='outside':write(read(sp+8,'I'),'HH',case['outside']['x'],case['outside']['y'])
 elif name=='changeTribe':write(p+0x2f,'b',(args[0]+128)%256-128)
 elif name=='effectiveTribe':result=case['effectiveTribe']&255
 elif name=='initialize':write(p+0xc,'I',case['initializedFlags'])
 cpu.reg_write(UC_X86_REG_EAX,result);cpu.reg_write(UC_X86_REG_EIP,read(sp,'I'));cpu.reg_write(UC_X86_REG_ESP,sp+4)
for a in set(consumers)|set(commands.values()):cpu.hook_add(UC_HOOK_CODE,leaf,begin=a,end=a)
def call(a):
 write(stack,'II',stop,p);cpu.reg_write(UC_X86_REG_ESP,stack);cpu.emu_start(a,stop,count=1000000);assert cpu.reg_read(UC_X86_REG_EIP)==stop;return cpu.reg_read(UC_X86_REG_EAX)&255
js="""import {advancePersonOrder} from './app/person-orders.ts';import {stepPersonOrders,personStateAfterOrders} from './app/person-order-update.ts';let s='';for await(const c of process.stdin)s+=c;const input=JSON.parse(s);
console.log(JSON.stringify(input.cases.map(c=>{const p=c.p,pool={records:c.orders,cursor:1,active:0},objects=new Map(c.objects.map((o,i)=>[i+1,o])),events=[];
const snapshot=()=>structuredClone({p,orders:pool.records,objects:[...objects.values()]}),log=(name,...args)=>events.push([name,args,snapshot()]);
const e={commands:Object.fromEntries(input.commands.map(model=>[model,()=>{log('command',model);p.flags3=c.commandFlags3;return c.commandResult;}])),
remove:slot=>{log('remove',slot);if(slot<0)p.immediateCommand=0;else p.commands[slot]=0;p.commandStatus=0;},
resumeVehicle:()=>{log('resumeVehicle');return c.resumeVehicle;},resumeBuilding:()=>{log('resumeBuilding');return c.resumeBuilding;},prepareNext:()=>log('prepareNext'),configure:()=>log('configure'),recover:()=>log('recover'),
commandPosition:o=>{log('commandPosition',pool.records.indexOf(o));return {...c.point};},vehicleDestination:(to,mode)=>{log('vehicleDestination',to,mode);return c.vehicleDestination;},vehicleReady:id=>{log('vehicleReady',id);return c.vehicleReady;},leaveVehicle:()=>{log('leaveVehicle');return c.leaveVehicle;},changeTribe:t=>{log('changeTribe',t);p.tribe=(t+128)%256-128;},effectiveTribe:()=>{log('effectiveTribe');return c.effectiveTribe;},
cellObjects:()=>[objects.get(3),objects.get(4)],outside:to=>{if(c.building){log('outside',to);return {...c.outside};}return to;},destination:to=>log('destination',to),arrival:mode=>log('arrival',mode),stop:()=>log('stop'),formation:()=>log('formation'),advance:()=>{log('advance');return c.advance;},initialize:()=>{log('initialize');p.flags2=c.initializedFlags;}};
const w={orders:pool,landFlags:c.landFlags,levelFlags2:c.levelFlags2,playerTribe:c.playerTribe,objects,survivingTribes:()=>c.tribes.filter(t=>t.active&&!t.defeatTimer).length};
if(input.mode==='composed')e.advance=()=>advancePersonOrder(pool,p,e);
const result=input.mode==='advance'?Number(advancePersonOrder(pool,p,e)):input.mode==='idle'?personStateAfterOrders(w,p):stepPersonOrders(w,p,e);return {...snapshot(),events,result};})));"""
for mode,address in [('advance',0x4366b0),('idle',0x4e32a0),('update',0x432590),('composed',0x432590)]:
 cases=[];expected=[]
 for i in range(4096):
  pp={k:rng.randrange(-128,128) if f=='b' else rng.randrange(65536) if f=='H' else rng.randrange(256) if f=='B' else rng.getrandbits(32) for k,(_,f) in fields.items()}
  pp.update(model=i%9,state=10,substate=i%4,counter=i%256,tribe=rng.randrange(4),commandCursor=rng.randrange(8),commandStatus=i%35,immediateCommand=rng.choice([0,0,9]),vehicle=rng.choice([0,1,2]),commands=[rng.choice([0,n+1]) for n in range(8)])
  if i%2==0:pp.update(flags2=rng.choice([0,0x100000]),flags3=rng.choice([0,1,128,0x10000000,0x10000080]),flags4=rng.choice([0,8,0x10000000]))
  oo=[dict(model=(i+n)%35,flags=rng.choice([0,1,64,128,192]),references=1,object=0,a=rng.randrange(65536),b=rng.randrange(65536)) for n in range(10)]
  for o in oo:
   if o['model']==29:o['a']=3
  ob=[dict(**{'class':rng.choice([0,1,3,10])},model=rng.choice([1,16]),flags2=rng.choice([0,1]),tribe=rng.randrange(4),x=rng.randrange(65536),y=rng.randrange(65536),timer=rng.randrange(-32768,32768),signal=rng.choice([0,1,65535])) for _ in range(4)]
  ob[3].update(**{'class':10},model=16)
  case=dict(p=pp,orders=oo,objects=ob,landFlags=rng.choice([0,8,0x2000000,0x4000000,0x6000000,0x6000008]),levelFlags2=rng.choice([0,0x40000]),playerTribe=rng.randrange(4),tribes=[dict(active=rng.randrange(2),defeatTimer=rng.choice([0,0,1,-1])) for _ in range(4)],building=bool(i&1),point=dict(x=rng.randrange(65536),y=rng.randrange(65536)),outside=dict(x=rng.randrange(65536),y=rng.randrange(65536)),commandResult=rng.choice([0,1,128,256,257]),commandFlags3=rng.getrandbits(32),effectiveTribe=rng.choice([-1,0,1,2,3]),initializedFlags=rng.getrandbits(32),**{k:bool(rng.randrange(2)) for k in ['resumeVehicle','resumeBuilding','vehicleDestination','vehicleReady','leaveVehicle','advance']})
  if i%3==0:pp['goalX']=pp['x'];pp['goalY']=pp['y']
  cpu.mem_write(p,bytes(0x500))
  for k,(off,f) in fields.items():write(p+off,f,pp[k])
  write(p+0x8b,'H'*8,*pp['commands'])
  for n,o in enumerate(oo):write(0x938830+n*10,'BBHHHH',*o.values())
  for n,o in enumerate(ob,1):
   write(0x890390+n*4,'I',p+n*256)
   for k,(off,f) in ofields.items():write(p+n*256+off,f,o[k])
  write(p+3*256+0x20,'H',4)
  # Only these positions are queried; clear each touched native cell per case.
  for to in [pp,ob[2],case['point'],case['outside']]:
   cell=0x8a03e4+((to['y']>>9)*128+(to['x']>>9))*16;write(cell,'IhHH',512 if case['building'] else 0,0,3,2)
  write(0x89c661,'I',case['landFlags']);write(0x895da4,'I',case['levelFlags2']);write(0x89c6f0,'b',case['playerTribe'])
  for n,t in enumerate(case['tribes']):write(0x89d1c8+n*0xc65+0xc20,'B',t['active']);write(0x89d1c8+n*0xc65+0x949,'i',t['defeatTimer'])
  events=[];result=call(address);expected.append(dict(**snapshot(),events=copy.deepcopy(events),result=result));cases.append(case)
 r=subprocess.run(['node','--input-type=module','-e',js],input=json.dumps(dict(mode=mode,cases=cases,commands=list(commands))),capture_output=True,text=True,cwd=root);assert r.returncode==0,r.stderr;actual=json.loads(r.stdout);assert len(actual)==len(expected)
 for i,(a,b) in enumerate(zip(expected,actual)):
  if a!=b:
   path=Path('/private/tmp/populous-order-update-failure.json');path.write_text(json.dumps(dict(mode=mode,index=i,case=cases[i],native=a,browser=b),indent=2));raise AssertionError((mode,i,str(path)))
 print(f'PASS: 4,096 native {mode} comparisons',flush=True)
