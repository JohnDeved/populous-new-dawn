"""Execute actual vehicle-panel person/group selection commands with UI/audio leaves supplied."""
import sys
from pathlib import Path
root=Path.cwd();sys.path.insert(0,str(root/'scripts'))
source=(root/'scripts/check-native-training-selection.py').read_text().split('input_count=0')[0]
exec(compile(source,str(root/'scripts/check-native-training-selection.py'),'exec'))
write(building+0x2a,'BB',4,1);write(building+0x9e,'B',3);write(building+0x7a,'5H',10,11,12,0,0)
cases=[]
for group,selected_mask,blocked_mask,flags3 in itertools.product([False,True],range(8),range(8),[0x12345678,0x923456f8]):
 before=[]
 for i in range(3):
  p=people+i*256;flags4=0x20000000|(128 if blocked_mask&(1<<i) else 0);selection=0x25|(128 if selected_mask&(1<<i) else 0)
  write(p+0xc,'III',0,flags4,flags3);write(p+0x7a,'B',selection);write(p+0x9f,'H',2)
  before.append(dict(id=10+i,flags2=0,flags4=flags4,flags3=flags3,selectionFlags=selection))
 write(command,'IIIBBB',0,int(not(selected_mask&2)) if group else 6,2 if group else 11,0x61 if group else 0x2a,0,0)
 call(0x43e8e0,tribe,command)
 after=[dict(id=10+i,flags2=read(people+i*256+0xc,'I'),flags4=read(people+i*256+0x10,'I'),flags3=read(people+i*256+0x14,'I'),selectionFlags=read(people+i*256+0x7a,'B')) for i in range(3)]
 cases.append(dict(people=before,clicked=11,group=group,expected=after))

# Derived state adaptation, independently compared to actual complete native commands.
for c in cases:
 people=c['people'];clicked=people[1];selecting=not(clicked['selectionFlags']&128);expected=[dict(p) for p in people]
 def mark(p,on,keep):
  if on:p['selectionFlags']|=128;p['flags3']=(p['flags3']|0x10000000) if keep else (p['flags3']&~0x10000000)
  else:p['selectionFlags']&=~128;p['flags3']&=~128
 if not selecting:
  for p in expected:mark(p,False,False)
 elif c['group']:
  if any(not(p['flags4']&128) for p in people):
   for p in expected:mark(p,True,False)
 elif not(clicked['flags4']&128):mark(expected[1],True,True)
 assert expected==c['expected'],c
print('PASS:',len(cases),'native vehicle passenger-selection commands; selected primary clears whole craft, Shift any eligible expands whole craft including blocked mates')

script="""import {selectVehicleOccupants} from './app/vehicle-panel.ts';let input='';for await(const x of process.stdin)input+=x;console.log(JSON.stringify(JSON.parse(input).map(c=>{selectVehicleOccupants(c.people,c.clicked,c.group);return c.people;})));"""
run=subprocess.run(['node','--input-type=module','-e',script],cwd=root,input=json.dumps(cases),text=True,capture_output=True)
assert run.returncode==0,run.stderr
for c,actual in zip(cases,json.loads(run.stdout),strict=True):assert actual==c['expected'],(c,actual)
print('PASS: 256 native/TypeScript vehicle passenger selection comparisons')
