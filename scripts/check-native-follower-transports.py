"""Compare occupied-transport HUD helpers with executed native count/command/focus owners.
Usage: python scripts/check-native-follower-transports.py EXE
Reuses accepted panel probes. Does not record assets, fixtures or parity.
"""
import json
import random
import runpy
import subprocess
import sys
from pathlib import Path
root = Path(__file__).resolve().parents[1]
sys.argv = [str(root / 'scripts/check-native-followers-panel.py'), sys.argv[1]]
n = runpy.run_path(sys.argv[0])
call, write, read, install = [n[k] for k in ['call','write','read','install_transport']]
people, tribe, command = [n[k] for k in ['people','tribe','command']]
rules=json.loads((root/'app/original-rules.json').read_text())
rng=random.Random(0x4514f0)
cases=[]

def setup(vehicles, roster, nearby, point):
    count,_=install(vehicles,nearby)
    write(tribe+0x24,'HH',point['x'],point['y'])
    browser=[]
    for i,p in enumerate(roster):
        address=people+i*256
        write(address+0x3d,'HH',p['x'],p['y']);write(address+0xa7,'B',p['commandStatus'])
        write(address+0x10,'II',p['flags4'],p['flags3']);write(address+0x7a,'B',p['selectionFlags'])
    cursor=0
    for i,v in enumerate(vehicles):
        address=people+(count+i)*256
        write(address+0x2f,'B',v['owner']);write(address+0xa1,'B',v['countOwner'])
        write(address+0x3d,'HH',v['x'],v['y'])
        ids=list(range(cursor+1,cursor+len(v['passengers'])+1));cursor+=len(ids)
        browser.append(dict(id=count+i+1,model=v['model'],x=v['x'],y=v['y'],owner=v['owner'],countOwner=v['countOwner'],active=True,passengers=ids,passengerCount=len(ids)))
    write(0x89d17c,'I',32);call(0x4ecac0);write(0x89d17c,'I',0)
    return browser

for trial in range(160):
    point=dict(x=257,y=503);nearby=bool(trial&1)
    vehicles=[];roster=[]
    for i in range(7):
        kind=rng.choice([1,2,3,4]); passenger_models=[rng.choice([2,3,4,5,6,7]) for _ in range(rng.randrange(rules['vehicleCapacity'][kind]+1))]
        vehicles.append(dict(model=kind,passengers=passenger_models,owner=rng.choice([0,0,0,1]),countOwner=rng.choice([0,0,0,1]),x=rng.choice([256,7000,6400,6399,500,65535]),y=256))
        for m in passenger_models:
            roster.append(dict(id=len(roster)+1,model=m,x=rng.choice([256,500,7000,65535]),y=256,commandStatus=rng.choice([0,0,1,3,16]),flags4=0x20000000|rng.choice([0,0,128,0x800]),flags3=0x123456f8,selectionFlags=rng.choice([0,0,128,129]),assignment=0))
    kind,model,mode=rng.choice([1,3]),rng.choice([0,2,3,4,5,6]),rng.choice(['single','five','all'])
    browser=setup(vehicles,roster,nearby,point)
    expected={}
    for k,base,near in [(1,0x89dd9f,0x89ddb1),(3,0x89ddc3,0x89ddd5)]:
        expected[k]=dict(present=bool(read(tribe+0x941,'I')&(0x100 if k==1 else 0x200)),counts=[read((near if nearby else base)+m*2,'h') for m in range(9)])
    cases.append(dict(kind='counts',vehicles=browser,people=roster,point=point,nearby=nearby,expected=expected))
    packed=((point['x']>>8)&255)|((point['y']>>8)<<8)
    write(command+4,'IIB',(kind<<16)|model,packed,{'single':0x81,'five':0x80,'all':0x7f}[mode]);call(0x43e8e0,tribe,command)
    expected=[dict(flags3=read(people+i*256+0x14,'I'),selectionFlags=read(people+i*256+0x7a,'B')) for i in range(len(roster))]
    cases.append(dict(kind='select',vehicles=browser,people=roster,vehicleKind=kind,model=model,point=point,nearby=nearby,mode=mode,expected=expected))
    browser=setup(vehicles,roster,nearby,point)
    memory=(0x899f67 if kind==1 else 0x899f79)+model*2
    write(memory,'H',0);expected=[]
    for _ in range(6):call(0x4deb40,kind,model);expected.append(read(memory,'H'))
    cases.append(dict(kind='focus',vehicles=browser,people=roster,vehicleKind=kind,model=model,point=point,nearby=nearby,expected=expected))
script="""import {transportCounts,selectTransportPassengers,focusTransport} from './app/hud-transports.ts';
let input='';for await(const chunk of process.stdin)input+=chunk;
console.log(JSON.stringify(JSON.parse(input).map(c=>{
 if(c.kind==='counts')return transportCounts(c.vehicles,c.people,c.point,c.nearby);
 if(c.kind==='select'){selectTransportPassengers(c.vehicles,c.people,c.vehicleKind,c.model,c.point,c.mode,c.nearby);return c.people.map(({flags3,selectionFlags})=>({flags3,selectionFlags}));}
 let previous=0;return c.expected.map(()=>previous=focusTransport(c.vehicles,c.people,c.vehicleKind,c.model,c.point,previous,c.nearby));
})));"""
result=subprocess.run(['node','--input-type=module','-e',script],cwd=root,input=json.dumps(cases),text=True,capture_output=True)
assert result.returncode==0,result.stderr
for i,(case,actual) in enumerate(zip(cases,json.loads(result.stdout),strict=True)):
    assert actual==json.loads(json.dumps(case['expected'])),(i,case,actual)
print(f'PASS: {len(cases)} native/TypeScript occupied-transport count, passenger-selection and six-click focus cases; real/apparent owners, blocked/selected passengers, variants, priority, nearby and passenger-distance boundaries')
