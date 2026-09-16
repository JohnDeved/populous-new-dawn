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
    rules['hudSelectionPriority']=list(read(0x59cd94,7))
    rules['buildingSlopeLimit']=value(0x5aa458)
    rules['buildingSteepSlopeLimit']=value(0x5aa45c)
    rules['buildingFlags']=[value(0x5a7228+i*76+72) for i in range(20)]
    rules['buildingObjects']=[value(0x5a7228+i*76,2) for i in range(20)]
    rules['buildingShade']=[struct.unpack('<b',read(0x5a7228+i*76+53,1))[0] for i in range(20)]
    rules['sceneryShade']=[struct.unpack('<b',read(0x5a79b0+i*24+19,1))[0] for i in range(20)]
    rules['sceneryObjects']=[value(0x5a79b0+i*24+10,2) for i in range(20)]
    rules['sceneryFlags']=[value(0x5a79b0+i*24+21,1) for i in range(20)]
    rules['sceneryResourceFlags']=[value(0x5a79b0+i*24+20) for i in range(20)]
    rules['sceneryWood']=[value(0x5a79b0+i*24+4,2) for i in range(20)]
    rules['sceneryGrowth']=[value(0x5a79b0+i*24+6,2) for i in range(20)]
    rules['sceneryReplantDelay']=[value(0x5a79b0+i*24+8,2) for i in range(20)]
    rules['objectTextureAlpha']=[bool(value(0x5d2910+i*4)) for i in range(256)]
    rules['buildingAttackers']=[value(0x5a7228+i*76+33,1) for i in range(20)]
    rules['buildingCapacity']=[value(0x5a7228+i*76+32,1) for i in range(20)]
    rules['buildingTrainedModel']=[value(0x5a7228+i*76+49,1) for i in range(20)]
    rules['buildingMaxWorkers']=[value(0x5a7228+i*76+20,2) for i in range(20)]
    rules['buildingMinWorkers']=[value(0x5a7228+i*76+18,2) for i in range(20)]
    rules['buildingTimeoutWorkers']=[value(0x5a7228+i*76+22,2) for i in range(20)]
    rules['buildingPreparationWork']=[value(0x5a7228+i*76+24,2) for i in range(20)]
    rules['buildingLevelWorkers']=[value(0x5a7228+i*76+31,1) for i in range(20)]
    rules['buildingLevelStep']=[value(0x5a7228+i*76+66,2) for i in range(20)]
    rules['buildingGroundStep']=[value(0x5a7228+i*76+68,2) for i in range(20)]
    rules['buildingGroundTolerance']=[value(0x5a7228+i*76+70,2) for i in range(20)]
    rules['blastPersonDamage']=value(0x5aa510)
    rules['blastBuildingDamage']=value(0x5aa50c)
    rules['blastAlliedLimit']=value(0x5aa5b8)
    rules['shieldDamageShift']=value(0x5aa5b0)
    rules['buildingPreparationTasks']=[value(0x5a80c1+i*2,1) for i in range(7)]
    rules['buildingWorkRadius']=[value(0x5a7228+i*76+34,2) for i in range(20)]
    rules['buildingLife']=[value(0x5a7228+i*76+26,2) for i in range(20)]
    rules['buildingDamageThreshold']=[value(0x5a7228+i*76+46,2) for i in range(20)]
    rules['buildingRepairDelay']=value(0x5aa4fc)
    rules['buildingSmokeDuration']=value(0x5aa59c)
    rules['celebrationWeights']=[list(struct.unpack('<hbb',read(0x5d4858+i*4,4))) for i in range(3)]
    rules['celebrationChain']=[list(read(0x5d4868+i*6,6)) for i in range(4)]
    rules['cameraRampUp']=[struct.unpack('<h',read(0x59bbd0+i*2,2))[0] for i in range(4)]
    rules['cameraRampDown']=[struct.unpack('<h',read(0x59bbd8+i*2,2))[0] for i in range(11)]
    rules['personTraining']=[{'weight':value(0x5a7060+i*50+31,2),'humanMana':value(0x5a7060+i*50+36),'computerMana':value(0x5a7060+i*50+40)} for i in range(9)]
    rules['personHealing']=[value(0x5a7060+i*50+26,1) for i in range(9)]
    rules['personBuildingDamage']=[value(0x5a7060+i*50+22,1)>>2 for i in range(9)]
    rules['personWood']=[value(0x5a7060+i*50+20,2) for i in range(9)]
    rules['personHarvestTurns']=[value(0x5a7060+i*50+29,1) for i in range(9)]
    rules['vehicleCapacity']=[value(0x5a7938+i*23+8,1) for i in range(5)]
    rules['vehicleLife']=[value(0x5a7938+i*23,2) for i in range(5)]
    rules['vehicleRestFlags']=[value(0x5a7938+i*23+21,1) for i in range(5)]
    rules['pathSearchStepLimit']=value(0x59bd8c)
    rules['pathSteps']=[dict(zip(['x','y'],struct.unpack('<ii',read(0x59bd90+i*10,8)))) for i in range(4)]
    rules['marchingFormationOffsets']=[list(struct.unpack('<hh',read(0x5d6bc8+i*4,4))) for i in range(12)]
    rules['personArrivalRadius']=[value(0x5a7060+i*50+46,1)*32 for i in range(9)]
    rules['restingAnimationFrameSource']=value(0x5a6adc,2)
    rules['personMana']=[value(0x5a7060+i*50+14,2) for i in range(9)]
    rules['personThreat']=[value(0x5a7060+i*50+35,1) for i in range(9)]
    rules['personCommands']=[{'people':value(0x5a7dc4+i*22),'flags':value(0x5a7dca+i*22),'rangeMode':value(0x5a7dc3+i*22,1),'icon':value(0x5a7db9+i*22,2)} for i in range(35)]
    rules['personModels']=[{'nextState':value(0x5a7060+i*50+4,1),'idleState':value(0x5a7060+i*50+5,1),'physics':value(0x5a7060+i*50+6,1),'flags':value(0x5a7060+i*50+48,2),'idleRange':value(0x5a7060+i*50+24,1),'orderedRange':value(0x5a7060+i*50+25,1),'scanMask':value(0x5a7060+i*50+47,1),'fightRank':value(0x5a7060+i*50+23,1),'fightDamage':value(0x5a7060+i*50+27,2)} for i in range(9)]
    rules['engagementHeightFactors']=[value(0x5aa558+i*4) for i in range(8)]
    rules['personSpeeds']=[value(0x5a7b90+i*26+4,2) for i in range(20)]
    rules['personRunningSpeeds']=[value(0x5a7b90+i*26+6,2) for i in range(20)]
    rules['personTurning']=[value(0x5a7b90+i*26,2) for i in range(20)]
    rules['personVerticalLimits']=[value(0x5a7b90+i*26+10,2) for i in range(20)]
    rules['personImpulseLimits']=[list(struct.unpack('<hh',read(0x5a7b90+i*26+12,4))) for i in range(20)]
    rules['personSlopeLimits']=[value(0x5a7b90+i*26+16,2) for i in range(20)]
    rules['personPhysicsFlags']=[value(0x5a7b90+i*26+24,2) for i in range(20)]
    rules['personGravity']=[value(0x5a7b90+i*26+18,2) for i in range(20)]
    rules['personFriction']=[[value(0x5a7b90+i*26+offset,2) for offset in (20,22)] for i in range(20)]
    rules['personFallDamage']=value(0x5aa534)
    rules['buildingSupportHeight']=[value(0x5a7228+i*76+38,2) for i in range(20)]
    rules['personVelocityLimits']=[value(0x5a7b90+i*26+8,2) for i in range(20)]
    rules['personAnimationObjects']=list(struct.unpack('<252h',read(0x5a6d50,252*2)))
    rules['animationObjects']=[list(struct.unpack('<hh',read(0x5a6858+i*4,4))) for i in range(168)]
    rules['animationDescriptors']=[dict(hold=struct.unpack('<b',read(0x5a6af8+i*11+1,1))[0],step=struct.unpack('<b',read(0x5a6af8+i*11+3,1))[0],mode=value(0x5a6af8+i*11+4,1),person=value(0x5a6af8+i*11+5,1),variant=value(0x5a6af8+i*11+6,1),palette=value(0x5a6af8+i*11+7,1),reset=value(0x5a6af8+i*11+8,1),flags=value(0x5a6af8+i*11+9,2)) for i in range(49)]
    rules['tribeEffectPalettes']=[value(0x5a89c8+i*5+3,1) for i in range(4)]
    rules['spellCharging']=[{'mode':value(0x5a80d0+i*62,2),'cost':value(0x5a80d4+i*62),
        'icons':list(struct.unpack('<3h',read(0x5a80e0+i*62,6))),
        'cursor':value(0x5a80dc+i*62,2),'cursorBlockedOffset':list(read(0x5a810c+i*62,2)),'flags':value(0x5a80ea+i*62,2),
        'normalRange':value(0x5a80ee+i*62),'alternateRange':value(0x5a80f2+i*62),
        'normalLimit':value(0x5a80fd+i*62,1),'alternateLimit':value(0x5a80fe+i*62,1),
        'rate':value(0x5a810a+i*62,2)} for i in range(22)]
    cursor=value(0x5a7dff,2)
    rules['spellRangeCursor']=list(struct.unpack('<hbb',read(0x5add60+cursor*4,4)))
    rules['spellRangeBands']=[value(0x5aa538+i*4) for i in range(8)]
    rules['skyPoints']=[list(struct.unpack('<ii',read(0x58f910+i*8,8))) for i in range(31)]
    rules['skyTriangles']=[list(struct.unpack('<iii',read(0x58fa08+i*12,12))) for i in range(42)]
    rules['skyConstants']=list(struct.unpack('<8f',read(0x58fc00,32)))
    rules['pathLandLimit']=value(0x5aa450)
    rules['terrainCategoryDirections']=[struct.unpack('<b',read(0x5aa329+i*14,1))[0] for i in range(16)]
    rules['terrainCategoryFlags']=[value(0x5aa328+i*14,1) for i in range(16)]
    rules['terrainCategoryMasks']=[list(read(0x5aa32e+i*14,8)) for i in range(16)]
    rules['terrainCategories']=list(read(0x5aa318,16))
    rules['textureFlags']=list(read(0x5aa218,256))
    rules['landHeightConstant']=value(0x5aa450)
    rules['alternateLandHeightConstant']=value(0x5aa454)
    rules['territoryWidths']=[list(read(address,length)) for address,length in [(0x5d56b4,5),(0x5d56bc,7),(0x5d56c8,9),(0x5d56d8,11)]]
    assert [rules['sine'][i] for i in [0,512,1024,1536]]==[0,65536,0,-65536]
    assert rules['atan'][0]==0 and rules['atan'][256]==256
    assert rules['manaUpdateMask']==3 and rules['hutCapacity']==[3,4,5]
    assert rules['breedingBands'][0]==76 and rules['hutBreedingWork'][0]==4000
    report.update(runtimeRules=rules,ignoredConstants=sorted(constants.keys()-recognized))
    if len(sys.argv)>3:Path(sys.argv[3]).write_text(json.dumps(rules,indent=2)+'\n')
print(json.dumps(report,indent=2))
