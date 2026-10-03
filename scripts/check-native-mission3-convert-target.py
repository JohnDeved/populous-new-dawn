"""Target-leaf proof for the native Mission3 Convert Wild controller.

Runs the existing population/state proof first. Target search and vehicle counts
are unhooked. Reachability supplies only the route-builder result; standability
supplies only terrain height and resting collision. Those wrapper cases are not
proof of full terrain/pathfinding or a live task/cast journey.
"""
import json
import math
import runpy
import struct
from pathlib import Path
from unicorn import UC_HOOK_CODE
from unicorn.x86_const import UC_X86_REG_EAX, UC_X86_REG_ESP

base=runpy.run_path(str(Path(__file__).with_name('check-native-mission3-population-state.py')))
Probe,AI,PERSON,PROGRAM=(base[n] for n in ('Probe','AI','PERSON','PROGRAM'))
TARGET=PROGRAM+0x18000
results={}

# Native macroregion search, including real square-root and linked-list traversal.
def search_expected(origin,counts,people,minimum,maximum):
    winner=None; best_count=0; best_distance=100000
    for region,count in enumerate(counts):
        x=(region%8)*32+16; y=(region//8)*32+16
        dx=abs((origin&255)-x);dy=abs((origin>>8)-y)
        distance=math.isqrt(min(dx,256-dx)**2+min(dy,256-dy)**2)
        if count and minimum<=distance<=maximum and (count>best_count or count==best_count and distance<best_distance):
            winner=region;best_count=count;best_distance=distance
    chosen=[(x&254,y&254) for x,y in people if (x//32)+(y//32)*8==winner]
    if not chosen:return False,origin
    return True,(sum(x for x,y in chosen)//len(chosen))|((sum(y for x,y in chosen)//len(chosen))<<8)

rows=[]
for name,origin,sparse,people,minimum,maximum in [
    ('empty',0x1010,{},[],0,200),
    ('counts_without_people',0x1010,{0:3},[],0,200),
    ('mean_even_coordinates',0x1010,{0:3},[(3,5),(10,12),(20,22)],0,200),
    ('greater_density_beats_distance',0x1010,{0:1,3:2},[(3,5),(100,10),(110,20)],0,200),
    ('equal_density_nearer',0x1010,{1:1,3:1},[(40,12),(100,10)],0,200),
    ('equal_distance_first_region',0x1030,{0:1,2:1},[(10,10),(70,10)],0,200),
    ('wrapped_distance',0x1000,{0:1,7:1},[(10,10),(240,10)],0,200),
    ('inclusive_maximum',0x1010,{1:1},[(40,12)],0,32),
    ('outside_maximum',0x1010,{1:1},[(40,12)],0,31),
    ('inclusive_minimum',0x1010,{1:1},[(40,12)],32,200),
    ('inside_minimum',0x1010,{1:1},[(40,12)],33,200),
]:
    p=Probe();counts=[sparse.get(i,0) for i in range(64)]
    p.cpu.mem_write(0x8e03e4,bytes(counts));p.write(TARGET,'H',origin)
    p.write(0x890334,'I',PERSON if people else 0)
    for i,(x,y) in enumerate(people):
        address=PERSON+i*0x200
        p.write(address+8,'I',address+0x200 if i+1<len(people) else 0)
        p.write(address+0x3d,'HH',(x<<8)|127,(y<<8)|201)
    p.call(0x4f87f0,AI,TARGET,minimum,maximum)
    expected,target=search_expected(origin,counts,people,minimum,maximum)
    assert (bool(p.cpu.reg_read(UC_X86_REG_EAX)),p.read(TARGET,'H'))==(expected,target),name
    assert p.read(0x89d178)==0x12345678
    rows.append(dict(name=name,success=expected,target=target))
results['unhookedTargetSearch']=rows

rows=[]
for values in [(1,2,3,4),(-2,1,-4,7),(32767,32767,-32768,-32768)]:
    for model in [0,1,2,3,4,5]:
        p=Probe();p.write(AI+0xba7,'hhhh',*values);p.call(0x4f6af0,AI,model)
        actual=struct.unpack('<i',struct.pack('<I',p.cpu.reg_read(UC_X86_REG_EAX)))[0]
        expected=sum(values[:2]) if model in (1,2) else sum(values[2:]) if model in (3,4) else 999
        assert actual==expected
        rows.append(dict(values=values,model=model,count=actual))
results['unhookedVehicleCounts']=rows

# Actual wrapper, controlled route builder: verify argument bytes and zero-only flag cleanup.
rows=[]
for target in [0x0000,0xffff,0x52dc]:
    for route_result in [0,1,0xffff]:
        p=Probe();p.shaman();p.write(PERSON+0x3d,'HH',0x1355,0xab77)
        p.write(PERSON+0x10,'I',0x12345678);calls=[]
        def route(*_):
            sp=p.cpu.reg_read(UC_X86_REG_ESP)
            args=[p.read(sp+4+i*4) for i in range(4)]
            calls.append((args[0],p.read(args[1],'H'),p.read(args[2],'H'),args[3]))
            p.return_value(route_result)
        p.cpu.hook_add(UC_HOOK_CODE,route,begin=0x4ea920,end=0x4ea920)
        p.call(0x4f3a70,PERSON,target)
        assert calls==[(PERSON,0xab13,(target&0xfefe)+0x101,0)]
        assert p.read(PERSON+0x10)==(0x02345678 if route_result==0 else 0x12345678)
        expected=0xffffffff if route_result==0xffff else route_result
        assert p.cpu.reg_read(UC_X86_REG_EAX)==expected
        rows.append(dict(target=target,routeResult=route_result,flags4=p.read(PERSON+0x10)))
results['routeWrapperWithSuppliedBuilder']=rows
# Keep native spiral traversal, supply only height/collision outcomes.
def spiral(center,index):
    ring=1
    while (ring+1)*ring*4<=index:ring+=1
    step=index+(1-ring)*ring*4;side=ring*2
    x=-ring+min(step,side)-max(0,min(step-side*2,side))
    y=ring-max(0,min(step-side,side))+max(0,min(step-side*3,side))
    return ((center&255)+x*2)&255|(((((center>>8)+y*2)&255)<<8))
def centered(cell):return (((cell&254)+1)<<8,((((cell>>8)&254)+1)<<8))
rows=[]
for origin in [0x52dc,0xffff]:
    for valid_call in [0,1,24,None]:
        p=Probe();p.write(TARGET,'H',origin);visited=[]
        def height(*_):p.return_value(500)
        def collision(*_):
            sp=p.cpu.reg_read(UC_X86_REG_ESP);point=p.read(sp+4)
            assert p.read(sp+8)==0
            visited.append((p.read(point,'H'),p.read(point+2,'H')))
            assert p.read(point+4,'H')==500
            p.return_value(0 if len(visited)-1==valid_call else 1)
        p.cpu.hook_add(UC_HOOK_CODE,height,begin=0x44e940,end=0x44e940)
        p.cpu.hook_add(UC_HOOK_CODE,collision,begin=0x518200,end=0x518200)
        p.call(0x4f5d30,TARGET)
        expected_cells=[origin]+[spiral(origin,i) for i in range(24)]
        length=25 if valid_call is None else valid_call+1
        assert visited==[centered(c) for c in expected_cells[:length]]
        assert p.read(TARGET,'H')==(origin if valid_call is None else expected_cells[valid_call])
        assert bool(p.cpu.reg_read(UC_X86_REG_EAX))==(valid_call is not None)
        assert p.read(0x89d178)==0x12345678
        rows.append(dict(origin=origin,validCall=valid_call,visited=visited,target=p.read(TARGET,'H')))
results['standabilityWithSuppliedTerrain']=rows

# Real controller phase2 and vehicle sums; terrain/route outcomes supplied.
rows=[]
for counts,standable,reachable in [((0,0,0,0),True,True),((0,0,0,0),True,False),
                                ((1,0,0,0),True,False),((0,0,1,0),True,False),
                                ((1,0,-1,0),True,False),((1,0,0,0),False,True)]:
    p=Probe();p.shaman();p.write(AI+0x74,'I',1);p.write(AI+0x85,'B',2)
    p.write(AI+0x78,'H',2);p.write(AI+0x36,'H',0x52dc)
    p.write(AI+0xba7,'hhhh',*counts);route_calls=[]
    def stand(*_):
        ptr=p.read(p.cpu.reg_read(UC_X86_REG_ESP)+4)
        if standable:p.write(ptr,'H',0x50da)
        p.return_value(int(standable))
    def reach(*_):
        sp=p.cpu.reg_read(UC_X86_REG_ESP)
        route_calls.append((p.read(sp+4),p.read(sp+8)))
        p.return_value(int(reachable))
    p.cpu.hook_add(UC_HOOK_CODE,stand,begin=0x4f5d30,end=0x4f5d30)
    p.cpu.hook_add(UC_HOOK_CODE,reach,begin=0x4f3a70,end=0x4f3a70)
    p.call(0x4623e0,AI)
    bypass=sum(counts)!=0
    expected_phase=4 if standable and (bypass or reachable) else 3
    assert p.read(AI+0x78,'H')==expected_phase
    assert route_calls==([(PERSON,0x50da)] if standable and not bypass else [])
    assert p.read(AI+0x36,'H')==(0x50da if standable else 0x52dc)
    assert p.read(0x89d178)==0x12345678
    rows.append(dict(vehicleCounts=counts,standable=standable,reachable=reachable,phase=expected_phase,routeCalls=len(route_calls)))
results['phase2WithSuppliedTerrainAndRoute']=rows
print(json.dumps(results,indent=2))
print('PASS:11 unhooked target searches,18 unhooked vehicle counts,9 route wrappers,8 standability cases,6 phase2 boundaries')
