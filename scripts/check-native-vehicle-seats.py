"""Bounded seating → voluntary ejection → native person-physics preamble proof.
Run from repository root with an EXE argument. Writes only this ignored directory.
Reuses existing actual physics/cell insertion harness; intercepts asset animation,
exit selection, UI/allocation/path/state leaves as explicitly listed in findings.
"""
import os,sys
from pathlib import Path
root=Path.cwd();sys.path.insert(0,str(root/'scripts'))
source=(root/'scripts/check-native-physics-driver.py').read_text().split("for mode,count,turns in")[0]
exec(compile(source,str(root/'scripts/check-native-physics-driver.py'),'exec'))
root=Path.cwd()
from capstone import Cs,CS_ARCH_X86,CS_MODE_32
from tempfile import TemporaryDirectory
temporary=TemporaryDirectory(prefix='pnd-vehicle-seats-')
out=Path(temporary.name)
md=Cs(CS_ARCH_X86,CS_MODE_32)
for address,length in [(0x4d8250,0xac),(0x465ea0,0x2ef)]:
 (out/f'{address:08x}.asm').write_text('\n'.join(f'{i.address:08x}: {i.mnemonic} {i.op_str}' for i in md.disasm(bytes(cpu.mem_read(address,length)),address))+'\n')
# Flat terrain at native h0, fully walkable; collision and insertion still execute.
for i in range(16384):write(0x8a03e4+i*16,'IhHHHBBH',8,0,0,0,0,0,0,0)
cpu.mem_write(0x96aaba,bytes([255])*8192);write(0x89d17c,'I',0);write(0x895da8,'I',0);write(0x89c6f0,'B',0);write(0x89d178,'I',0x12345678)
write(0x59df44,'I',p+0x10000)
vehicle=p+0x3000;target=p+0x3100
write(0x890390+10*4,'I',vehicle)
animation_calls=[]
def animation(cpu,a,size,u):
 sp=cpu.reg_read(UC_X86_REG_ESP);animation_calls.append([hex(a),read(sp+4,'I'),read(sp+8,'I')]);cpu.reg_write(UC_X86_REG_EAX,0);cpu.reg_write(UC_X86_REG_EIP,read(sp,'I'));cpu.reg_write(UC_X86_REG_ESP,sp+4)
cpu.hook_add(UC_HOOK_CODE,animation,begin=0x4d4040,end=0x4d4040)
result=[]
for model,base_height in [(1,0),(3,999)]:
 for cell_index in range(16384):write(0x8a03e4+cell_index*16+4,'h',base_height)
 for use_seat in [False,True]:
  for direction in [0,512,1024,1536]:
   # Real Mission22 snapshot physics2, actual seat producer and +4000 clearing.
   pp=person(0);pp.update(id=4,x=0x4100,y=0x4100,h=base_height,**{'class':1},model=7,physics=9,state=10,previousState=1,flags2=0x24000,flags3=0,flags4=0x800000,heading=direction,angle=direction,slowTurn=0,speed=0,turnAngle=0x4100,turnY=0x4100,counter=1,motionTimer=0,motionMode=0,recoveryCounter=0,supportHeight=0,life=1000,workTarget=0,velocity=dict(x=0,y=0,z=0),displacement=dict(x=0,y=0,h=0))
   # Match the supplied live-first-tick snapshot rather than changing physics.
   pp['physics']=2 # The real Mission22 browser passenger snapshot is a Brave, physics2.
   pp['model']=2
   put(pp);write(p+0x9f,'H',10);write(p+0x78,'H',0);write(p+0x76,'H',0)
   for cell in touched:write(0x8a03e4+cell*16+6,'H',0)
   touched={index(pp)};write(to,'HHh',pp['x'],pp['y'],pp['h']);call(0x4ee470,p,to)
   cpu.mem_write(vehicle,bytes(256));write(vehicle+0x24,'H',10);write(vehicle+0x2a,'BBB',4,model,1);write(vehicle+0x26,'H',direction);write(vehicle+0x3d,'HHh',0x4100,0x4100,base_height);write(vehicle+0x7a,'H',4);write(vehicle+0x9e,'B',1)
   events=[];case=dict(boat=False,fight=False,ready=False)
   if use_seat:call(0x465ea0,vehicle)
   seated=get();write(target,'HH',0x4500,0x4100);animation_calls=[];call(0x4659d0,vehicle,p,target)
   launched=get();launch_animation=animation_calls[:]
   # Exact first person-handler preamble order, through physics only.
   stages=[]
   for address in [0x4d42a0,0x51fed0,0x4e9050,0x4e6d00]:
    events=[];call(address,p);stages.append(dict(address=hex(address),person=get(),events=copy.deepcopy(events)))
   result.append(dict(model=model,baseHeight=base_height,useSeat=use_seat,direction=direction,seated=seated,launched=launched,animation=launch_animation,stages=stages))
(out/'traces.json').write_text(json.dumps(result,indent=2)+'\n')
for c in result:
 if c['direction']==0:
  print(json.dumps({k:c[k] for k in ['model','baseHeight','useSeat']},sort_keys=True))
  for key,p0 in [('seated',c['seated']),('launched',c['launched']),('after-physics',c['stages'][-1]['person'])]:print(key,{k:p0[k] for k in ['x','y','h','physics','flags2','flags4','velocity']})
assert all(not(c['launched']['flags2']&0x4000) for c in result)
assert all(c['seated']['h']==c['baseHeight']+(48 if c['model']==1 else 60) for c in result if c['useSeat'])
assert all(c['stages'][-1]['person']['h']>c['launched']['h'] and c['stages'][-1]['person']['flags4']&0x400 for c in result if c['useSeat'])
print('PASS:16 seating/unload/native preamble compositions; native seats elevate Boat48/Balloon60, ejection clears4000, next physics preserves upward motion without80000')
# Capture the complete attachment producer across slots, seam positions, orientation
# and actual entry-animation countdown values. No layout/steering leaves supplied.
seat_cases=[]
for model in [1,2,3,4]:
 capacity=read(0x5a7938+model*23+8,'B');group=read(0x5a7938+model*23+9,'B')
 for slot in range(capacity):
  offset=list(struct.unpack('<3h',cpu.mem_read(0x5a89e0+(group*12+slot)*6,6)))
  for direction in [0,317,512,1024,1536,2047]:
   for countdown in [0,1,2,3,4,9]:
    pp=person(0);pp.update(id=4,x=10,y=65530,h=111,**{'class':1},model=2,physics=2,state=10,previousState=1,flags2=0x20080,flags3=0,flags4=0x400,heading=713,angle=713,slowTurn=countdown,speed=0,turnAngle=22,turnY=33,counter=1,motionTimer=0,motionMode=0,recoveryCounter=0,supportHeight=0,life=1000,workTarget=0,velocity=dict(x=0,y=0,z=0),displacement=dict(x=0,y=0,h=0))
    put(pp);write(p+0x76,'H',0)
    for cell in touched:write(0x8a03e4+cell*16+6,'H',0)
    touched={index(pp)};write(to,'HHh',pp['x'],pp['y'],pp['h']);call(0x4ee470,p,to)
    cpu.mem_write(vehicle,bytes(256));write(vehicle+0x24,'H',10);write(vehicle+0x2a,'BBB',4,model,1);write(vehicle+0x26,'H',direction);write(vehicle+0x3d,'HHh',65520,12,222);write(vehicle+0x7a+slot*2,'H',4);write(vehicle+0x9e,'B',1)
    events=[];call(0x465ea0,vehicle)
    seat_cases.append(dict(model=model,slot=slot,offset=offset,direction=direction,countdown=countdown,input=pp,vehicle=dict(x=65520,y=12,h=222),expected=get(),navigationFlags=read(vehicle+0x92,'I'),vehicleA0=read(vehicle+0xa0,'B')))
(out/'seat-traces.json').write_text(json.dumps(seat_cases,indent=2)+'\n')
print('Captured',len(seat_cases),'complete native465ea0 slot/seam/orientation/countdown cases')

settled=[c for c in seat_cases if not c['countdown']]
js="""import {seatVehiclePassenger} from './app/vehicle-seats.ts';let input='';for await(const c of process.stdin)input+=c;console.log(JSON.stringify(JSON.parse(input).map(c=>{const p={...c.input,assignment:0},v={...c.vehicle,model:c.model,heading:c.direction*Math.PI/1024};seatVehiclePassenger(p,v,c.slot,point=>Object.assign(p,point));return Object.fromEntries(['x','y','h','flags2','heading','angle','turnAngle'].map(k=>[k,p[k]]));})));"""
r=subprocess.run(['node','--input-type=module','-e',js],cwd=root,input=json.dumps(settled),text=True,capture_output=True);assert r.returncode==0,r.stderr
for c,actual in zip(settled,json.loads(r.stdout),strict=True):assert actual=={k:c['expected'][k] for k in actual},(c,actual)
print('PASS: 84 complete native/TypeScript settled-seat slot/rotation/seam geometry and flags; countdown interpolation remains outside the live port')
