"""Read the animation tables from the user-supplied D3DPopTB.exe without executing it.
Usage: python3 scripts/inspect-executable.py /path/to/D3DPopTB.exe [constants.json [rules-output.json]]
Offsets are for the analyzed executable; fail closed on an unknown build.
"""
import hashlib,json,struct,sys
from pathlib import Path
b=Path(sys.argv[1]).read_bytes()
sha=hashlib.sha256(b).hexdigest()
assert sha=='3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f','Different executable: recheck offsets in Ghidra first'
pe=struct.unpack_from('<I',b,60)[0]
assert b[pe:pe+4]==b'PE\0\0'
n=struct.unpack_from('<H',b,pe+6)[0];opt=struct.unpack_from('<H',b,pe+20)[0]
base=struct.unpack_from('<I',b,pe+24+28)[0]
sections=[struct.unpack_from('<8sIIII',b,pe+24+opt+i*40) for i in range(n)]
def read(address,size):
    rva=address-base
    for _,virtual_size,virtual,raw_size,raw in sections:
        if virtual<=rva and rva+size<=virtual+raw_size:return b[raw+rva-virtual:raw+rva-virtual+size]
    raise ValueError(hex(address))
rows={}
for name,row in [('idle',0),('walk',1),('carryIdle',4),('carry',5),('work',6),('chop',8),('attack',10),('strike',8),('special',16),('recoil',9),('airborne',12),('pray',13)]:
    rows[name]={}
    for kind,index in [('brave',2),('warrior',3),('shaman',7)]:
        obj=struct.unpack('<h',read(0x5a6d50+(row*9+index)*2,2))[0]
        start,draw=struct.unpack('<hh',read(0x5a6858+obj*4,4));record=read(0x5a6ad7+(draw+3)*11,11)
        rows[name][kind]={'start':start,'layer':record[5],'variant':record[6],'turnsPerFrame':record[3]+1}
assert rows['walk']['shaman']['start']==616
assert rows['carry']['brave']['start']==72
report={'sha256':sha,'animationRows':rows,'blastDamage':struct.unpack('<i',read(0x5aa510,4))[0],'blastBuildingDamage':struct.unpack('<i',read(0x5aa50c,4))[0]}
if len(sys.argv)>2:
    # Apply only names recognized by this executable, with its integer percentage conversion.
    constants=json.loads(Path(sys.argv[2]).read_text());memory={};recognized=set()
    for i in range(512):
        record=read(0x5aa5f0+i*31,31);name=record[:25].split(b'\0')[0].decode('ascii')
        if not name:break
        size,flags=record[25:27];address=struct.unpack_from('<I',record,27)[0]
        assert size in (1,2,4)
        if name in constants:
            recognized.add(name);v=constants[name];v=v*256//100 if flags&1 else v
            for j in range(size):memory[address+j]=(v>>(j*8))&255
    def value(address,size=4):
        return int.from_bytes(bytes(memory.get(address+i,read(address+i,1)[0]) for i in range(size)),'little')
    rules={'manaUpdateMask':value(0x5aa44c),'manaIdleBrave':value(0x5aa5bc),'manaBusyBrave':value(0x5aa5c4),'manaIdleWarrior':value(0x5aa5c0),'manaBusyWarrior':value(0x5aa5c8),'humanManaFactor':value(0x5aa41c),'computerManaFactor':value(0x5aa420),'breedingBands':[value(0x5aa47c+i*4) for i in range(20)],'trainingBands':[value(0x5aa578+i*4) for i in range(6)],'hutCapacity':[value(0x5a7228+i*76+32,1) for i in (1,2,3)],'hutUpgradeWork':[value(0x5a7228+i*76+54,2) for i in (1,2,3)],'hutBreedingWork':[value(0x5a7228+i*76+60,2) for i in (1,2,3)]}
    rules['sine']=list(struct.unpack('<2048i',read(0x5ddde8,2048*4)))
    rules['atan']=list(struct.unpack('<257h',read(0x5861b4,257*2)))
    physics=[value(0x5a7060+i*50+6,1) for i in (2,3,7)]
    friction=[value(0x5a7b90+i*26+20,2) for i in physics]
    assert friction==[28,28,28]
    rules['groundFriction']=friction[0]
    rules['personStateFlags']=[value(0x5a6f79+i*5) for i in range(46)]
    rules['buildingFlags']=[value(0x5a7228+i*76+72) for i in range(20)]
    rules['buildingCapacity']=[value(0x5a7228+i*76+32,1) for i in range(20)]
    rules['buildingTrainedModel']=[value(0x5a7228+i*76+49,1) for i in range(20)]
    rules['personCommands']=[{'people':value(0x5a7dc4+i*22),'flags':value(0x5a7dca+i*22)} for i in range(35)]
    rules['personModels']=[{'nextState':value(0x5a7060+i*50+4,1),'physics':value(0x5a7060+i*50+6,1),'flags':value(0x5a7060+i*50+48,2)} for i in range(9)]
    rules['personSpeeds']=[value(0x5a7b90+i*26+4,2) for i in range(20)]
    rules['personAnimationObjects']=list(struct.unpack('<234h',read(0x5a6d50,234*2)))
    assert [rules['sine'][i] for i in [0,512,1024,1536]]==[0,65536,0,-65536]
    assert rules['atan'][0]==0 and rules['atan'][256]==256
    assert rules['manaUpdateMask']==3 and rules['hutCapacity']==[3,4,5]
    assert rules['breedingBands'][0]==76 and rules['hutBreedingWork'][0]==4000
    report.update(runtimeRules=rules,ignoredConstants=sorted(constants.keys()-recognized))
    if len(sys.argv)>3:Path(sys.argv[3]).write_text(json.dumps(rules,indent=2)+'\n')
print(json.dumps(report,indent=2))
