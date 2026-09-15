"""Inspect Mission 1/5/6 native ATTACK decoding and the ordinary attack route.

Usage: python scripts/check-native-computer-attack.py /path/to/d3dpoptb.exe
The original interpreter, task allocator, selector, group builder and commit execute.
Person-state, staging-position, payload-preparation and acknowledgement leaves are
supplied; phase-16 target collection remains a controlled world input.
"""
import hashlib,json,struct,sys
from pathlib import Path
from unicorn import UC_HOOK_CODE
from unicorn.x86_const import UC_X86_REG_ESP,UC_X86_REG_EIP,UC_X86_REG_EAX
from decomp import native_cpu

root=Path(__file__).resolve().parents[1]
cpu,_=native_cpu(Path(sys.argv[1]));cpu.mem_map(0x2000000,0x20000)
program,stack,stop=0x2000000,0x201d000,0x201e000
tribes=0x89d1c8;red=tribes+0xc65
markers=0x89b7a5;target_marker=0xfa06;staging=0xf204
original=json.loads((root/'app/original-script.json').read_text())
mission_five=json.loads((root/'app/original-script-five.json').read_text())
mission_six_scripts=json.loads((root/'app/original-script-six.json').read_text())['tribes']
mission_six=mission_six_scripts['3'];mission_six_chumara=mission_six_scripts['2']
source=Path(sys.argv[1]).parent/'levels/cpscr010.dat'
assert hashlib.sha256(source.read_bytes()).hexdigest()==original['sha256']
source_five=Path(sys.argv[1]).parent/'levels/cpscr058.dat'
assert hashlib.sha256(source_five.read_bytes()).hexdigest()==mission_five['sha256']
assert mission_six['sha256']=='01dcc425abaf6bf9680e1d62cede2d5c3a0de9739631d69516d810bc424b8e60'
assert mission_six_chumara['sha256']=='7ee29a7c5e3f49bee4e2a40c1ef0bf5b1796d082dd3396e1a5a85900c917cb1a'
codes=[12,1003,*original['codes'][716:731],1004,1019]
assert codes[2:]==[1006,1059,1118,20,1070,20,160,161,161,161,1078,1,49,49,1,1004,1019]
tribe_codes=[12,1003,*original['codes'][900:915],1004,1019]
assert tribe_codes[2:]==[1006,1059,1118,109,1071,164,160,161,161,161,1078,1,49,49,1,1004,1019]
mission_five_codes=[12,1003,*mission_five['codes'][649:664],1004,1019]
assert mission_five_codes[2:]==[1006,1059,1118,52,1072,124,54,26,84,84,1078,1,51,51,51,1004,1019]
mission_six_codes=[12,1003,*mission_six['codes'][681:751],1004,1002,1004,1004,1019]
mission_six_chumara_codes=[12,1003,*mission_six_chumara['codes'][787:837],1004,1019]
chumara_profile=bytes([38,0,0,1,0,0,15,40,0,4,9,0,80,30,2,2,0,0,75,0,0,0,0,0,255,1,0,0,25,1,1,1,128,5,0])
assert mission_six_codes[2:18]==[1005,154,155,1003,1000,1014,87,1,1003,1000,1020,1012,156,99,1012,103]
assert mission_six_codes[25:42]==[1006,1059,1118,83,1071,158,4,112,19,105,1078,1,1,131,39,1006,1092]
assert mission_six_chumara_codes[26:41]==[1006,1059,1118,11,1071,170,115,30,27,30,1078,1,122,64,64]

def write(p,fmt,*values):cpu.mem_write(p,struct.pack(fmt,*values))
def return_from_leaf(value=0):
    sp=cpu.reg_read(UC_X86_REG_ESP)
    cpu.reg_write(UC_X86_REG_EAX,value&0xffffffff)
    cpu.reg_write(UC_X86_REG_EIP,struct.unpack('<I',cpu.mem_read(sp,4))[0])
    cpu.reg_write(UC_X86_REG_ESP,sp+4)
def initialize(enabled=True,maximum=1,full=False):
    cpu.mem_write(tribes,bytes(4*0xc65))
    for tribe in range(4):write(tribes+tribe*0xc65+0xc22,'<B',tribe)
    write(markers+3*2,'<H',target_marker)
    write(red+0x59a,'<I',(1<<20) if enabled else 0)
    write(red+0x36a,'<H',staging);write(red+0x5b4,'<B',1)
    write(0x960833,'<B',maximum)
    if full:
        for i in range(10):write(red+0x36+i*0x52+0x3e,'<I',1)
def run(script_codes=codes,script=original):
    blob=bytearray(12552);struct.pack_into('<'+'H'*len(script_codes),blob,0,*script_codes)
    for i,field in enumerate(script['fields']):struct.pack_into('<Ii',blob,8192+i*8,*field)
    struct.pack_into('<64i',blob,12288,*script['variables']);cpu.mem_write(program,bytes(blob))
    write(stack,'<III',stop,red,program);cpu.reg_write(UC_X86_REG_ESP,stack)
    cpu.emu_start(0x48c6b0,stop,timeout=100000,count=200000)
    assert cpu.reg_read(UC_X86_REG_EIP)==stop
def tasks():
    result=[]
    for i in range(10):
        p=red+0x36+i*0x52
        flags=struct.unpack('<I',cpu.mem_read(p+0x3e,4))[0]
        if flags&1:
            result.append(dict(index=i,flags=flags,type=cpu.mem_read(p+0x4f,1)[0],
                phase=struct.unpack('<H',cpu.mem_read(p+0x42,2))[0],
                route=struct.unpack('<H',cpu.mem_read(p+0x10,2))[0],
                original=struct.unpack('<H',cpu.mem_read(p+0x1a,2))[0],
                marker=cpu.mem_read(p+0x23,1)[0],
                entity=struct.unpack('<I',cpu.mem_read(p+0x32,4))[0],
                requested=struct.unpack('<i',cpu.mem_read(p+0x36,4))[0],
                damage=struct.unpack('<i',cpu.mem_read(p+0x3a,4))[0]))
    return result

initialize();run();allocated=tasks()
assert len(allocated)==1,allocated
task=allocated[0]
assert task['type']==20 and task['phase']==0 and task['requested']==3 and task['damage']==999,task
assert task['route']==target_marker and task['original']==target_marker,task
assert task['marker']==3 and task['entity']==0,task
target_building=0x2007000;target_route=0xaa12;tribe_probe=False;target_trace=[]
target_shaman=0x2006000;shaman_probe=False
def target_leaf(cpu,address,size,user):
    if address==0x4f25a0:
        if not shaman_probe:return
        sp=cpu.reg_read(UC_X86_REG_ESP)
        assert struct.unpack('<I',cpu.mem_read(sp+4,4))[0]==tribes
        target_trace.append('shaman');return_from_leaf(target_shaman);return
    if not tribe_probe:return
    sp=cpu.reg_read(UC_X86_REG_ESP)
    if address==0x4f6100:
        assert struct.unpack('<I',cpu.mem_read(sp+4,4))[0]==tribes
        target_trace.append('primary');return_from_leaf(target_building)
    if address==0x4f6180:
        assert struct.unpack('<I',cpu.mem_read(sp+4,4))[0]==tribes
        target_trace.append('fallback');return_from_leaf()
    if address==0x404420:
        building,out=struct.unpack('<II',cpu.mem_read(sp+4,8));assert building==target_building
        write(out,'<HH',0x1234,0xabcd);return_from_leaf()
for address in (0x4f25a0,0x4f6100,0x4f6180,0x404420):cpu.hook_add(UC_HOOK_CODE,target_leaf,begin=address,end=address)
cpu.mem_write(target_shaman,bytes(256));write(target_shaman,'<I',1)
write(target_shaman+0x24,'<H',91);write(target_shaman+0x2a,'<BB',1,7)
write(target_shaman+0x3d,'<HH',0xa612,0x8412);write(0x890390+91*4,'<I',target_shaman)
initialize();target_trace.clear();shaman_probe=True;run(mission_five_codes,mission_five);shaman_probe=False
shaman_attack=tasks();assert len(shaman_attack)==1,shaman_attack
task=shaman_attack[0]
assert task['type']==20 and task['requested']==2 and task['damage']==6,task
assert task['marker']==7 and task['entity']==91 and target_trace==['shaman'],(task,target_trace)
cpu.mem_write(target_building,bytes(256));write(target_building+0x24,'<H',77);write(target_building+0x2a,'<B',2)
initialize();write(red+0x91d,'<I',3);target_trace.clear();tribe_probe=True;run(tribe_codes);tribe_probe=False
tribe_attack=tasks();assert len(tribe_attack)==1,tribe_attack
task=tribe_attack[0]
assert task['type']==20 and task['phase']==0 and task['requested']==3 and task['damage']==999,task
assert task['route']==target_route and task['original']==target_route,task
assert task['marker']==0 and task['entity']==77,task
assert target_trace==['primary'],target_trace
mission_six_state={**mission_six,'variables':mission_six['variables'][:]}
mission_six_state['variables'][16]=5;mission_six_state['variables'][32]=150000
for mana,population,warriors,turn,started in [(150000,23,6,622,0),(150001,22,6,622,0),(150001,23,5,622,0),(150001,23,6,621,0),(150001,23,6,622,1)]:
    initialize();write(red+0xc22,'<B',3);write(red+0x94d,'<i',mana);write(0x8a0014,'<I',population)
    write(0x89d188,'<I',turn);write(0x960893,'<B',1);write(red+0xa2d,'<h',warriors)
    blocked_state={**mission_six_state,'variables':mission_six_state['variables'][:]};blocked_state['variables'][20]=started
    run(mission_six_codes,blocked_state)
    assert not [task for task in tasks() if task['type']==20],(mana,population,warriors,turn,started,tasks())
initialize();write(red+0xc22,'<B',3);write(red+0x94d,'<i',150001);write(0x8a0014,'<I',23)
write(0x89d188,'<I',622);write(0x960893,'<B',1)
write(red+0xa2d,'<h',6);target_trace.clear();tribe_probe=True
run(mission_six_codes,mission_six_state);tribe_probe=False
mission_six_attacks=[task for task in tasks() if task['type']==20]
assert len(mission_six_attacks)==1,mission_six_attacks
task=mission_six_attacks[0]
assert task['requested']==5 and task['damage']==128 and task['marker']==0 and task['entity']==77,task
assert target_trace==['primary'],target_trace
assert struct.unpack('<i',cpu.mem_read(program+12288+8*4,4))[0]==1
assert struct.unpack('<i',cpu.mem_read(program+12288+16*4,4))[0]==7
assert struct.unpack('<i',cpu.mem_read(program+12288+20*4,4))[0]==1
for turn,warriors,preachers,started in [(330,5,3,0),(331,4,3,0),(331,5,2,0),(331,5,3,1)]:
    initialize();write(red+0xc22,'<B',2);write(0x89d188,'<I',turn)
    write(red+0xa2d,'<h',warriors);write(red+0xa2f,'<h',preachers)
    cpu.mem_write(0x96084a,chumara_profile)
    state={**mission_six_chumara,'variables':mission_six_chumara['variables'][:]};state['variables'][1]=started
    run(mission_six_chumara_codes,state)
    assert not [task for task in tasks() if task['type']==20],(turn,warriors,preachers,started,tasks())
initialize();write(red+0xc22,'<B',2);write(0x89d188,'<I',331)
write(red+0xa2d,'<h',5);write(red+0xa2f,'<h',3);cpu.mem_write(0x96084a,chumara_profile)
target_trace.clear();tribe_probe=True;run(mission_six_chumara_codes,mission_six_chumara);tribe_probe=False
chumara_attacks=[task for task in tasks() if task['type']==20]
assert len(chumara_attacks)==1,chumara_attacks
task=chumara_attacks[0]
assert task['requested']==4 and task['damage']==20 and task['marker']==0 and task['entity']==77,task
assert target_trace==['primary'],target_trace
assert struct.unpack('<i',cpu.mem_read(program+12288+1*4,4))[0]==1
for enabled,maximum,full in [(False,1,False),(True,0,False),(True,1,True)]:
    initialize(enabled,maximum,full);before=bytes(cpu.mem_read(red+0x36,10*0x52));run()
    assert bytes(cpu.mem_read(red+0x36,10*0x52))==before,(enabled,maximum,full,tasks())
print('PASS: native mission-one ATTACK decoded and allocated type 20; disabled, capped and full queues refused')
print('PASS: native later ATTACK dispatched Blue building selection and retained the controlled id and route')
print('PASS: native mission-five ATTACK selected the living Blue Shaman and retained its id')
print('PASS: native mission-six first Matak ATTACK passed its exact gates, allocated type 20, and latched variables')
print('PASS: native mission-six first Chumara ATTACK passed its exact gates, allocated type 20, and latched variable 1')

# Exercise the deterministic ordinary-person route through phase 14.
people=0x2008000
trace=[]
routing=False
def leaf(cpu,address,size,user):
    sp=cpu.reg_read(UC_X86_REG_ESP)
    if address==0x4f6020:
        trace.append(('staging',staging));return
    if address==0x4ed640:
        p=struct.unpack('<I',cpu.mem_read(sp+4,4))[0]
        trace.append(('select-person',struct.unpack('<H',cpu.mem_read(p+0x24,2))[0]))
        write(p+0x7a,'<B',cpu.mem_read(p+0x7a,1)[0]|128)
        return_from_leaf();return
    if address==0x4ed6f0:
        p=struct.unpack('<I',cpu.mem_read(sp+4,4))[0]
        id_=struct.unpack('<H',cpu.mem_read(p+0x24,2))[0]
        trace.append(('prepare-person',id_))
        return_from_leaf();return
    if address==0x418ce0:
        ai=struct.unpack('<I',cpu.mem_read(sp+4,4))[0]
        p=struct.unpack('<I',cpu.mem_read(ai+0x881,4))[0]
        while p:
            if cpu.mem_read(p+0x2c,1)[0]==14:
                trace.append(('release-person',struct.unpack('<H',cpu.mem_read(p+0x24,2))[0]))
                write(p+0x2c,'<B',17);write(p+0x7a,'<B',cpu.mem_read(p+0x7a,1)[0]&127)
            p=struct.unpack('<I',cpu.mem_read(p+8,4))[0]
        return_from_leaf();return
    if address==0x438730:
        id_,model,data,flags=struct.unpack('<4I',cpu.mem_read(sp+4,16))
        a,b=struct.unpack('<HH',cpu.mem_read(data,4));id_&=0xffff;model&=255
        trace.append(('prepare-order',id_,model,a,b,flags&255))
        write(0x938830+id_*10,'<BB',model,flags&255)
        write(0x938830+id_*10+6,'<HH',a,b)
        return_from_leaf();return
    if address==0x436330:
        trace.append(('acknowledge',));return_from_leaf();return
    if address in (0x43b540,0x4f5950,0x4f2e40):
        trace.append(('bounded-world-leaf',address));return_from_leaf();return
    if address==0x4e9b40:
        return_from_leaf(1);return
    if address in (0x4044b0,0x48c650,0x4f2440):
        if routing:raise AssertionError(f'unexpected native branch {address:#x}')
        return
for address in (0x4f6020,0x4ed6f0,0x4ed640,0x418ce0,0x438730,0x436330,
                0x43b540,0x4f5950,0x4f2e40,0x4044b0,0x48c650,0x4e9b40,0x4f2440):
    cpu.hook_add(UC_HOOK_CODE,leaf,begin=address,end=address)

def native_call(address,*args):
    write(stack,'<'+'I'*(len(args)+1),stop,*[arg&0xffffffff for arg in args])
    cpu.reg_write(UC_X86_REG_ESP,stack);cpu.emu_start(address,stop,timeout=1000000,count=2000000)
    assert cpu.reg_read(UC_X86_REG_EIP)==stop,hex(cpu.reg_read(UC_X86_REG_EIP))
def add_person(id_,model,next_id):
    p=people+id_*256;cpu.mem_write(p,bytes(256))
    write(p+8,'<I',people+next_id*256 if next_id else 0)
    write(p+0x24,'<H',id_);write(p+0x2a,'<BBBB',1,model,17,2)
    write(p+0x3d,'<HH',0xf000+id_*0x100,0x0800+id_*0x100)
    write(0x890390+id_*4,'<I',p)

initialize();write(red+0xc22,'<B',2);write(0x89d188,'<I',331)
write(red+0xa2d,'<h',5);write(red+0xa2f,'<h',3);cpu.mem_write(0x96084a,chumara_profile)
tribe_probe=True;run(mission_six_chumara_codes,mission_six_chumara);tribe_probe=False
allocated=tasks();taskp=red+0x36+allocated[0]['index']*0x52
cpu.mem_write(0x890390,bytes(4096));cpu.mem_write(0x8a03e4,bytes(0x40000))
write(0x890390+77*4,'<I',target_building)
cpu.mem_write(0xa0d108,bytes(4096));cpu.mem_write(0x938830,bytes(8000))
write(0x96aa78,'<HH',1,0)
# Chumara's first raid snapshots AWAY_BRAVE, AWAY_WARRIOR and AWAY_PREACHER.
for id_,model,next_id in [(1,3,2),(2,3,3),(3,3,4),(4,4,0)]:add_person(id_,model,next_id)
write(red+0x881,'<I',people+256)
phases=[]
for _ in range(12):
    native_call(0x4cb400,red,allocated[0]['index'])
    phase=struct.unpack('<H',cpu.mem_read(taskp+0x42,2))[0];phases.append(phase)
    if phase==6:break
assert phases[-1]==6,phases
assert 3 in phases and 4 in phases and 5 in phases,phases
queued=[]
for id_ in range(1,5):
    p=people+id_*256
    ids=[v for v in [struct.unpack('<H',cpu.mem_read(p+0x9b,2))[0],*struct.unpack('<8H',cpu.mem_read(p+0x8b,16))] if v]
    if ids:queued.append((id_,ids,[cpu.mem_read(0x938830+v*10,1)[0] for v in ids]))
assert len(queued)==4 and all(models==[3] for _,_,models in queued),(phases,queued,trace)
assert [cpu.mem_read(people+id_*256+0x2b,1)[0] for id_,_,_ in queued]==[3,3,3,4],queued
shared={id_ for _,ids,_ in queued for id_ in ids}
assert len(shared)==1 and struct.unpack('<H',cpu.mem_read(0x938830+shared.pop()*10+2,2))[0]==4,queued
assert next(event for event in trace if event[0]=='prepare-order')[3:5]==(0x480,0xf280),trace
assert struct.unpack('<I',cpu.mem_read(red+0x596,4))[0]&2==0
assert cpu.mem_read(red+0x5b3,1)[0]==10
assert any(event[0]=='staging' for event in trace) and any(event[0]=='release-person' for event in trace),trace

members=[id_ for id_,_,_ in queued]
assert all(cpu.mem_read(people+id_*256+0xaf,1)[0]==allocated[0]['index']+1 for id_ in members),members
rng=struct.unpack('<I',cpu.mem_read(0x89d178,4))[0]
routing=True;route=[];locks=[];route_trace=len(trace)
for _ in range(14):
    phase=struct.unpack('<H',cpu.mem_read(taskp+0x42,2))[0]
    if phase==10:
        write(people+members[0]*256+0x3d,'<HH',0x1200,0xaa00)
    native_call(0x4cb400,red,allocated[0]['index'])
    phase=struct.unpack('<H',cpu.mem_read(taskp+0x42,2))[0];route.append(phase)
    locks.append((phase,bool(struct.unpack('<I',cpu.mem_read(red+0x596,4))[0]&2),
                  cpu.mem_read(red+0x5b3,1)[0]))
    if phase==10:
        assert struct.unpack('<I',cpu.mem_read(taskp+4,4))[0]==0
    if phase==11:
        assert struct.unpack('<H',cpu.mem_read(taskp+0x12,2))[0]==target_route
        assert struct.unpack('<I',cpu.mem_read(taskp+4,4))[0]==1
        for id_ in members:
            p=people+id_*256
            assert cpu.mem_read(p+0x2c,1)[0]==19
            assert not any(cpu.mem_read(p+0x8b,18))
    if phase==6 and 12 in route:
        assert struct.unpack('<H',cpu.mem_read(taskp+0x44,2))[0]==14
        assert struct.unpack('<I',cpu.mem_read(taskp+4,4))[0]==0
        assert all(cpu.mem_read(people+id_*256+0x2c,1)[0]==17 for id_ in members)
    if phase==14:break
assert route==[18,7,8,6,7,9,10,11,12,6,14],route
assert [item for item in locks if item[0] in (9,12)]==[(9,True,allocated[0]['index']),(12,True,allocated[0]['index'])],locks
assert all(not locked and owner==10 for phase,locked,owner in locks if phase in (10,6,14)),locks
orders=[event for event in trace[route_trace:] if event[0]=='prepare-order']
assert len(orders)==12,orders
assert all(event[2:]==(3,0x0080,0x0080,0) for event in orders[:4]),orders
assert all(event[2:]==(3,0x1280,0xaa80,0) for event in orders[4:]),orders
assert struct.unpack('<I',cpu.mem_read(taskp+4,4))[0]==1
assert struct.unpack('<I',cpu.mem_read(taskp+0x3e,4))[0]&1
assert all(cpu.mem_read(people+id_*256+0xaf,1)[0]==allocated[0]['index']+1 for id_ in members)
assert struct.unpack('<I',cpu.mem_read(0x89d178,4))[0]==rng
native_call(0x4cb400,red,allocated[0]['index'])
assert struct.unpack('<H',cpu.mem_read(taskp+0x42,2))[0]==15
native_call(0x4cb400,red,allocated[0]['index'])
assert struct.unpack('<H',cpu.mem_read(taskp+0x42,2))[0]==16
attack=[]
for id_ in members:
    p=people+id_*256
    ids=[v for v in [struct.unpack('<H',cpu.mem_read(p+0x9b,2))[0],*struct.unpack('<8H',cpu.mem_read(p+0x8b,16))] if v]
    attack.append((id_,ids,[cpu.mem_read(0x938830+v*10,1)[0] for v in ids]))
assert len(attack)==4 and [models for _,_,models in attack]==[[19],[19],[19],[17]],attack
shared={id_ for _,ids,_ in attack[:3] for id_ in ids}
assert len(shared)==1 and len(attack[3][1])==1 and attack[3][1][0] not in shared,attack
preacher_record=0x938830+attack[3][1][0]*10
assert struct.unpack('<HH',cpu.mem_read(preacher_record+6,4))==(0x1280,0xaa80),attack
attack_id=shared.pop();record=0x938830+attack_id*10
assert struct.unpack('<H',cpu.mem_read(record+2,2))[0]==3
payload=struct.unpack('<HH',cpu.mem_read(record+6,4))
assert payload==(target_route,0x0808),payload
assert struct.unpack('<I',cpu.mem_read(red+0x596,4))[0]&2==0
assert cpu.mem_read(red+0x5b3,1)[0]==10
for id_ in members:write(people+id_*256+0xaf,'<B',0)
native_call(0x4cb400,red,allocated[0]['index'])
assert struct.unpack('<H',cpu.mem_read(taskp+0x42,2))[0]==23
native_call(0x4cb400,red,allocated[0]['index'])
assert struct.unpack('<I',cpu.mem_read(taskp+0x3e,4))[0]&1==0
assert struct.unpack('<I',cpu.mem_read(red+0x596,4))[0]&2==0
assert cpu.mem_read(red+0x5b3,1)[0]==10
run();reallocated=tasks()
assert len(reallocated)==1 and reallocated[0]['index']==allocated[0]['index'],reallocated
print(f'PASS: native mixed Chumara type-20 phases {phases+route+[15,16,23]} dispatched one shared attack, retired and reused its slot')
