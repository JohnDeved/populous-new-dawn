from pathlib import Path
import hashlib,json,struct,sys,time
ROOT=Path(__file__).parent
EXE=Path('/workspace/scratch/69fd8163d94e/training-static-recovery-20261009/game/d3dpoptb.exe')
CONFIG=Path('app/original-constants.json')
EXPECTED='3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f'
sha=lambda b:hashlib.sha256(b).hexdigest()
started=time.monotonic();blob=EXE.read_bytes();before=sha(blob);assert before==EXPECTED
pe=struct.unpack_from('<I',blob,60)[0];assert blob[pe:pe+4]==b'PE\0\0'
n=struct.unpack_from('<H',blob,pe+6)[0];opt=struct.unpack_from('<H',blob,pe+20)[0];base=struct.unpack_from('<I',blob,pe+24+28)[0]
assert base==0x400000
sections=[struct.unpack_from('<8sIIII',blob,pe+24+opt+i*40) for i in range(n)]
def read(address,size):
 rva=address-base
 for name,virtual_size,virtual,raw_size,raw in sections:
  if virtual<=rva and rva+size<=virtual+raw_size:
   offset=raw+rva-virtual;return blob[offset:offset+size],offset
 raise ValueError(hex(address))
addresses=[0x5a7228+model*76+0x3e for model in range(20)]
targets={a+j for a in addresses for j in range(2)}
configBytes=CONFIG.read_bytes();config=json.loads(configBytes);overlaps=[];metadata=[];writes={};termination=None
for i in range(512):
 address=0x5aa5f0+i*31;record,offset=read(address,31);metadata.append(record)
 name=record[:25].split(b'\0')[0].decode('ascii')
 if not name:termination=i;break
 size,flags=record[25:27];destination=struct.unpack_from('<I',record,27)[0];assert size in (1,2,4)
 overlap=sorted(targets.intersection(range(destination,destination+size)))
 if overlap:
  item={'index':i,'descriptorAddress':f'{address:08x}','name':name,'size':size,'flags':flags,'destination':f'{destination:08x}','overlapAddresses':[f'{a:08x}' for a in overlap],'configured':name in config,'recordSha256':sha(record)}
  if name in config:
   value=config[name];value=value*256//100 if flags&1 else value;item['configuredValue']=config[name];item['encodedValue']=value
   for j in range(size):
    if destination+j in targets:writes[destination+j]=(value>>(j*8))&255
  overlaps.append(item)
rows=[]
for model,address in enumerate(addresses):
 raw,offset=read(address,2);effective=bytes(writes.get(address+i,raw[i]) for i in range(2))
 rows.append({'model':model,'address':f'{address:08x}','fileOffset':offset,'fileBytesHex':raw.hex(),'fileSignedWord':int.from_bytes(raw,'little',signed=True),'configuredSignedWord':int.from_bytes(effective,'little',signed=True),'overridden':effective!=raw})
after=sha(EXE.read_bytes());assert after==EXPECTED
result={'inputSha256Before':before,'inputSha256After':after,'inputBytes':len(blob),'extractorSha256':sha(Path(__file__).read_bytes()),'pythonExecutable':sys.executable,'pythonExecutableSha256':sha(Path(sys.executable).resolve().read_bytes()),'base':'005a7228','stride':76,'fieldOffset':62,'models':list(range(20)),'wordBytes':40,'words':rows,'constants':{'tableBase':'005aa5f0','stride':31,'maximumEntries':512,'readEntries':len(metadata),'zeroNameTerminator':termination,'readBytesSha256':sha(b''.join(metadata)),'configPath':str(CONFIG),'configSha256':sha(configBytes),'overlappingRecords':overlaps},'limits':'File defaults plus only the existing import recipe applied to the pinned config. No claim about unbound runtime writes or game execution.','elapsedSeconds':time.monotonic()-started,'nativeExecution':False}
(ROOT/'descriptor-words.json').write_text(json.dumps(result,indent=2)+'\n')
print(json.dumps({'words':[(r['model'],r['fileSignedWord'],r['configuredSignedWord']) for r in rows],'overlappingConstants':overlaps,'readEntries':len(metadata),'inputSha256':after,'extractorSha256':result['extractorSha256']}))
