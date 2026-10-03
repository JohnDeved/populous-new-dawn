"""Bounded type2 phase8 decisions, paired with the Mission3 live adapter.

Density, readiness/range, permission and spell/return effects are supplied. Native
phase dispatch, active-count elapsed update, distance and branch ordering execute.
This does not prove native spell allocation, transport, or the full path journey.
"""
import json
import runpy
from pathlib import Path
from unicorn import UC_HOOK_CODE
from unicorn.x86_const import UC_X86_REG_ESP

base=runpy.run_path(str(Path(__file__).with_name('check-native-mission3-convert-target.py')))
Probe,AI,PERSON=(base[n] for n in ('Probe','AI','PERSON'))
rows=[]
for name,state,position,count,nearby,ready,mana_ok,reach,allowed,casts in [
    ('normal_ready',17,(218,80),4,0,1,True,2,1,True),
    ('exact_range',17,(218,82),4,0,1,True,1,1,True),
    ('no_range_plus_two_slack',17,(218,80),4,0,1,True,1,1,False),
    ('not_ready',17,(218,80),4,0,0,True,2,1,False),
    ('insufficient_mana',17,(218,80),4,0,1,False,2,1,False),
    ('permission_denied',17,(218,80),4,0,1,True,2,0,False),
    ('moving_fallback_ignores_range',10,(218,80),3,5,1,True,0,1,True),
    ('moving_fallback_needs_five',10,(218,80),3,4,1,True,20,1,False),
]:
    p=Probe();p.shaman();p.write(PERSON+0x2c,'B',state)
    p.write(PERSON+0x3d,'HH',position[0]<<8,position[1]<<8)
    p.write(AI+0x74,'I',1);p.write(AI+0x85,'B',2);p.write(AI+0x78,'H',8)
    p.write(AI+0x36,'H',0x52dc);p.write(AI+0x3e,'H',0)
    cost=p.read(0x5a84f2);p.write(AI+0x94d,'I',cost if mana_ok else cost-1)
    calls=[];caster=(position[0]&254)|((position[1]&254)<<8)
    def leaf(cpu,address,size,user):
        sp=p.cpu.reg_read(UC_X86_REG_ESP)
        if address==0x4f79d0:
            cell=p.read(sp+4)&65535
            p.return_value(count if cell==0x52dc else nearby if cell==caster else 0)
        elif address==0x4c2d80:p.return_value(ready)
        elif address==0x4c2e00:p.return_value(reach)
        elif address==0x4f2100:p.return_value(allowed)
        elif address==0x4f4de0:
            calls.append(('cast',p.read(sp+4),p.read(sp+8),p.read(sp+12)&65535));p.return_value(0)
        elif address==0x43b2a0:
            ptr=p.read(sp+8)
            calls.append(('return',p.read(sp+4),p.read(ptr,'H'),p.read(ptr+2,'H')));p.return_value(0)
    for address in [0x4f79d0,0x4c2d80,0x4c2e00,0x4f2100,0x4f4de0,0x43b2a0]:
        p.cpu.hook_add(UC_HOOK_CODE,leaf,begin=address,end=address)
    p.call(0x4623e0,AI)
    expected=[('cast',AI,17,0x52dc),('return',PERSON,position[0]<<8,position[1]<<8)] if casts else []
    assert calls==expected,(name,calls,expected)
    assert p.read(AI+0x78,'H')==(3 if casts else 8),name
    assert p.read(AI+0x3e,'H')==1
    assert p.read(0x89d178)==0x12345678
    rows.append(dict(name=name,phase=p.read(AI+0x78,'H'),calls=calls,elapsed=1))
print(json.dumps(rows,indent=2))
print('PASS:8 controlled native phase8 range/payment/readiness/fallback boundaries')

# Unhooked timeout: blocked state avoids unrelated initializer/RNG. A valid
# first-passenger identity skips cleanup; other route/motion bytes must survive.
rows=[]
for driver in [False,True]:
    p=Probe();p.shaman();p.write(AI+0x74,'I',1);p.write(AI+0x85,'B',2)
    p.write(AI+0x78,'H',8);p.write(AI+0x3e,'H',600)
    p.write(PERSON+0xc,'I',0x20100800);p.write(PERSON+0x3d,'HH',0x2345,0x4567)
    p.write(PERSON+0x4f,'HH',0x7777,0x8888);p.write(PERSON+0x68,'HH',1,2)
    p.write(PERSON+0x82,'B',255);p.write(PERSON+0x61,'H',7);p.write(PERSON+0x66,'B',3)
    p.write(PERSON+0x63,'h',3);p.write(PERSON+0x67,'B',2)
    if driver:
        vehicle=PERSON+0x400
        p.write(PERSON+0x9f,'H',3);p.write(0x890390+3*4,'I',vehicle);p.write(vehicle+0x7a,'H',1)
    p.call(0x4623e0,AI)
    assert p.read(AI+0x78,'H')==3 and p.read(AI+0x3e,'H')==601
    assert p.read(PERSON+0x2c,'B')==17
    assert p.read(PERSON+0xc)==(0x20100800 if driver else 0x101000)
    assert [p.read(PERSON+0x61,'H'),p.read(PERSON+0x66,'B')]==([7,3] if driver else [0,0])
    assert [p.read(PERSON+0x63,'h'),p.read(PERSON+0x67,'B')]==[3,2]
    assert [p.read(PERSON+0x4f,'H'),p.read(PERSON+0x51,'H')]==[0x7777,0x8888]
    assert [p.read(PERSON+0x68,'H'),p.read(PERSON+0x6a,'H'),p.read(PERSON+0x82,'B')]==([1,2,255] if driver else [0x2300,0x4500,0])
    assert p.read(0x89d178)==0x12345678
    rows.append(dict(driver=driver,phase=3,elapsed=601,cleanup=not driver))
print(json.dumps(rows,indent=2))
print('PASS:2 unhooked phase8 timeout/first-passenger cleanup boundaries')
