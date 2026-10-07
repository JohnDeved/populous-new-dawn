"""Build one explicit supplied input and source predictions; no Unicorn/app import."""
from pathlib import Path
import hashlib
import json
import struct
import sys

ROOT = Path.cwd()
OUT = ROOT / 'decomp/research/raid-state33-release/pair'
RAW = json.loads((OUT / 'raw-input.json').read_text())
EXE = Path(sys.argv[1])
blob = EXE.read_bytes()
sha = lambda data: hashlib.sha256(data).hexdigest()
assert sha(blob) == '3a5065c7420b3fcde208bf220bc86dfbac95e025ab2492caf9c7ea5308dfbe4f'
pe = struct.unpack_from('<I', blob, 60)[0]
sections = struct.unpack_from('<H', blob, pe + 6)[0]
optional = struct.unpack_from('<H', blob, pe + 20)[0]
base = struct.unpack_from('<I', blob, pe + 52)[0]
def native_bytes(address, size):
    for index in range(sections):
        _, _, va, length, offset = struct.unpack_from('<8sIIII', blob, pe + 24 + optional + index * 40)
        if va <= address - base and address - base + size <= va + length:
            start = offset + address - base - va
            return blob[start:start + size]
    raise ValueError(f'Not file-backed: {address:x}+{size}')

fields = {
    'flags2': (0x0c, 'I'), 'flags4': (0x10, 'I'), 'flags3': (0x14, 'I'),
    'stamp': (0x18, 'I'), 'supportHeight': (0x1c, 'h'),
    'cellNext': (0x20, 'H'), 'cellPrevious': (0x22, 'H'), 'id': (0x24, 'H'), 'angle': (0x26, 'H'),
    'class': (0x2a, 'B'), 'model': (0x2b, 'B'), 'state': (0x2c, 'B'), 'substate': (0x2d, 'B'),
    'counter': (0x2e, 'B'), 'tribe': (0x2f, 'b'), 'physics': (0x30, 'B'),
    'object': (0x33, 'H'), 'renderFlags': (0x35, 'H'), 'f1': (0x37, 'h'), 'f2': (0x39, 'B'),
    'draw': (0x3a, 'B'), 'morph': (0x3b, 'B'), 'palette': (0x3c, 'B'),
    'x': (0x3d, 'H'), 'y': (0x3f, 'H'), 'h': (0x41, 'h'),
    'goalX': (0x4f, 'H'), 'goalY': (0x51, 'H'), 'destinationX': (0x53, 'H'),
    'destinationY': (0x55, 'H'), 'turnAngle': (0x57, 'H'), 'turnY': (0x59, 'H'),
    'heading': (0x5d, 'H'), 'speed': (0x5f, 'h'), 'motionTimer': (0x61, 'H'),
    'recoveryCounter': (0x65, 'B'), 'motionMode': (0x66, 'B'),
    'anchorX': (0x68, 'H'), 'anchorY': (0x6a, 'H'), 'life': (0x6e, 'h'),
    'timer': (0x70, 'h'), 'target': (0x72, 'H'), 'link': (0x74, 'H'),
    'assignment': (0x76, 'H'), 'cargo': (0x78, 'H'), 'selectionFlags': (0x7a, 'B'),
    'previousState': (0x7d, 'B'), 'slowTurn': (0x7e, 'B'), 'formationCell': (0x80, 'H'),
    'anchorFlags': (0x82, 'B'), 'orderLocation': (0x83, 'H'), 'reservationNext': (0x85, 'H'),
    'stateObject': (0x87, 'H'), 'workTarget': (0x89, 'H'), 'immediateCommand': (0x9b, 'H'),
    'workFlags': (0x9d, 'H'), 'vehicle': (0x9f, 'H'), 'savedVehicle': (0xa1, 'H'),
    'burnTrail': (0xa4, 'B'), 'commandCursor': (0xa6, 'B'), 'commandStatus': (0xa7, 'B'),
    'animationMode': (0xa8, 'B'), 'commandAux': (0xa9, 'B'), 'commandPhase': (0xaa, 'B'),
    'orderDelay': (0xab, 'B'), 'computerAssignment': (0xaf, 'B'),
    'damageAttacker': (0xb0, 'B'), 'statusFlags': (0xb2, 'B'),
}
people = []
regions, reads, writes = [], [], []
def region(name, address, data, expected=None):
    path = name + '-input.bin'
    (OUT / path).write_bytes(data)
    expected = bytes(data) if expected is None else bytes(expected)
    expected_path = name + '-predicted.bin'
    (OUT / expected_path).write_bytes(expected)
    regions.append(dict(name=name, address=address, bytes=len(data), path=path,
                        sha256=sha(data), predictedPath=expected_path, predictedSha256=sha(expected)))
def permit(target, address, size, name):
    target.append(dict(address=address, size=size, name=name))
def put(buffer, offset, form, value):
    struct.pack_into('<' + form, buffer, offset, value)
def field_access(target, address, name):
    offset, form = fields[name]
    permit(target, address + offset, struct.calcsize('<' + form), name)

changes = dict(state=10, previousState=33, substate=0, flags2=0x40021000,
               timer=0, motionTimer=0, motionMode=0, commandCursor=0, commandStatus=0,
               anchorX=38656, anchorY=28416, computerAssignment=0)
write_fields = ['state','substate','previousState','flags2','flags3','flags4','renderFlags',
                'object','draw','morph','palette','f1','f2','assignment','timer','motionTimer',
                'motionMode','commandCursor','commandStatus','anchorX','anchorY','anchorFlags',
                'computerAssignment','workFlags','workTarget','stateObject']
for index, raw in enumerate(RAW['people']):
    person = raw['person']; address = 0x2000100 + index * 0x100
    assert raw['nativeFlags7f'] == {'present': False}
    assert person['computerAssignment'] == 0
    data = bytearray([0xa5]) * 256
    for name, (offset, form) in fields.items():
        assert name in person, name
        put(data, offset, form, 2 if name == 'computerAssignment' else person[name])
        field_access(reads, address, name)
    for n, value in enumerate(person['commands']):
        put(data, 0x8b + n * 2, 'H', value)
    permit(reads, address + 0x8b, 16, 'captured queue')
    put(data, 8, 'I', address + 256 if index == 0 else 0)
    permit(reads, address + 8, 4, 'supplied two-person tribe chain')
    put(data, 0x7f, 'B', 0)  # Conditional constructor/admission supply, NEVER a captured value.
    if index == 0:
        permit(reads, address + 0x7f, 1, 'supplied flag byte; PC must be004f2448')
        permit(writes, address + 0x7f, 1, 'real release AND; PC must be004f2448')
    for n, axis in enumerate(['x','y','h']):
        put(data, 0x43 + n * 2, 'h', person['displacement'][axis])
    expected = bytearray(data)
    if index == 0:
        for name, value in changes.items():
            offset, form = fields[name]; put(expected, offset, form, value)
        put(expected, 0x8d, 'H', 0)
        permit(writes, address + 0x8d, 2, 'release queue slot1')
        for name in write_fields: field_access(writes, address, name)
    region('person' + str(raw['id']), address, data, expected)
    people.append(dict(id=raw['id'], address=address, capturedFields=person,
                       nativeFlags7fSupply=0, nativeAssignmentSupply=2,
                       capturedNativeFlags7fPresent=False, capturedAssignment=0,
                       unencodedPortFields=sorted(set(person) - set(fields) - {'commands','displacement'})))

tribes_base = 0x89d1c8
tribe = tribes_base + 3 * 0xc65
task = tribe + 0x36 + 0x52
tribes = bytearray([0xa5]) * (4 * 0xc65)
for index, t in enumerate(RAW['manaTribes']):
    off = index * 0xc65
    for offset, form, value in [(0x941,'I',t['flags2']), (0xc1f,'B',t['playerType']),
                               (0x93d,'I',RAW['castingTribes'][index]['flags']), (0xc22,'b',index)]:
        put(tribes, off + offset, form, value)
for index, t in enumerate(RAW['tasks']):
    off = 3 * 0xc65 + 0x36 + index * 0x52
    put(tribes, off + 0x3e, 'I', t['flags'])
    permit(reads, tribes_base + off + 0x3e, 1, 'captured task active flag' + str(index))
t = RAW['tasks'][1]
assert t['members'] == [10,11] and t['elapsed'] == 359 and t['phase'] == 6
assert sum(bool(t['flags'] & 1) for t in RAW['tasks']) == 1
task_fields = {'elapsed': (4,'i',t['elapsed']), 'visitCounter': (8,'I',0),
               'transportMode': (0x26,'B',0), 'markerSentinel': (0x2f,'B',255),
               'entity': (0x32,'I',t['entity']), 'phase': (0x42,'H',t['phase']),
               'fallback': (0x44,'H',t['fallback'])}
for name, (offset, form, value) in task_fields.items():
    put(tribes, task - tribes_base + offset, form, value)
    permit(reads, task + offset, struct.calcsize('<' + form), name)
for n, value in enumerate(t['spells']): put(tribes, task - tribes_base + 0x1f + n, 'B', value)
put(tribes, 3 * 0xc65 + 0x881, 'I', people[0]['address'])
permit(reads, tribe + 0x881, 4, 'supplied tribe head')
permit(reads, tribe + 0x941, 4, 'captured tribe state flags')
expected = bytearray(tribes)
put(expected, task - tribes_base + 4, 'i', 360)
put(expected, task - tribes_base + 8, 'I', 1)
permit(writes, task + 4, 4, 'elapsed359->360')
permit(writes, task + 8, 4, 'supplied visit-counter0->1')
region('tribes', tribes_base, tribes, expected)

pool = bytearray()
assert len(RAW['pool']['records']) == 800 and RAW['pool']['cursor'] == 144 and RAW['pool']['active'] == 3
for order in RAW['pool']['records']:
    pool.extend(struct.pack('<BB4H', *[order[k] for k in ['model','flags','references','object','a','b']]))
expected = bytearray(pool); put(expected, 131 * 10 + 2, 'H', 0)
region('orders', 0x938830, pool, expected)
permit(reads, 0x938830 + 131 * 10, 10, 'captured order131')
permit(writes, 0x938830 + 131 * 10 + 2, 2, 'order131refs1->0')
region('pool-counters', 0x96aa78, struct.pack('<HH',144,3), struct.pack('<HH',144,2))
permit(reads, 0x96aa7a, 2, 'pool active count')
permit(writes, 0x96aa7a, 2, 'pool active3->2')

target = 0x2000400
building = RAW['target1022']; admission = building['admission']
assert building['id'] == 1022 and building['hp'] == 260 and building['progress'] == 1
assert admission['class'] == 2 and admission['flags2'] == 0
data = bytearray([0xa5]) * 256
put(data,0xc,'I',admission['flags2']); put(data,0x24,'H',1022)
put(data,0x2a,'B',admission['class']); put(data,0x2b,'B',admission['model'])
region('target1022',target,data)
permit(reads,target+0xc,1,'captured live target flag'); permit(reads,target+0x2a,1,'captured target class')
pointers = bytearray([0xa5]) * 4096
for id_, address in [(10,people[0]['address']), (11,people[1]['address']), (1022,target)]:
    put(pointers,id_*4,'I',address)
region('pointers',0x890390,pointers)
permit(reads,0x890390+1022*4,4,'target1022 pointer')
for cell in RAW['cells']:
    data=bytearray([0xa5])*16
    put(data,0,'H',cell['fields']['flags']['value']);put(data,6,'H',cell['head'])
    put(data,8,'H',cell['fields']['buildingIds']['value'])
    address=0x8a03e4+cell['index']*16
    region('cell'+str(cell['index']),address,data)
    if cell['index']==7115:
        assert cell['fields']['flags']['value']==17 and cell['fields']['buildingIds']['value']==0
        permit(reads,address+1,1,'captured unoccupied actor10 cell')

for name,address,form,value,readable in [
    ('simulation-rng',0x89d178,'I',RAW['random'],False),
    ('cosmetic-rng',0x89bc72,'I',RAW['cosmetic'],False),
    ('game-flags',0x89d17c,'I',RAW['manaWorld']['gameFlags'],True),
    ('player-tribe',0x89c6f0,'b',RAW['manaWorld']['playerTribe'],False),
]:
    region(name,address,struct.pack('<'+form,value))
    if readable: permit(reads,address,1,name)

# Real setter only needs the captured standing object's frame count. No morph/table substitutions.
starts_blob=(EXE.parent/'data/vstart-0.ani').read_bytes()
frames_blob=(EXE.parent/'data/vfra-0.ani').read_bytes()
starts=list(struct.iter_unpack('<HH',starts_blob)); frames=list(struct.iter_unpack('<HBBBBH',frames_blob))
frame=starts[48][0]; seen=set()
while frame and frame not in seen:
    assert frame<len(frames);seen.add(frame);frame=frames[frame][-1]
assert frame in [0,starts[48][0]]
frame_count=len(seen)&255
region('frame-table-pointer',0x59df44,struct.pack('<I',0x2006000))
permit(reads,0x59df44,4,'supplied frame table address')
region('object48-frame-count',0x2006000+48*6+1,bytes([frame_count]))
permit(reads,0x2006000+48*6+1,1,'original object48 frame count')

functions = [
    ('processor',0x4cb400,0x4ccac4,2,0), ('settlement',0x4d14f0,0x4d190c,7,0),
    ('active-count',0x462750,0x46276b,1,32), ('membership',0x4f2460,0x4f2478,2,32),
    ('release-predicate',0x4f39f0,0x4f3a19,1,32), ('release-membership',0x4f2440,0x4f2460,2,0),
    ('clear-orders',0x436ca0,0x436cf2,1,0), ('release-order',0x4364d0,0x4366a2,2,0),
    ('working-predicate',0x4da1d0,0x4da235,1,8), ('release-fight',0x501be0,0x501c00,1,0),
    ('reset-motion',0x4e9b40,0x4e9b6c,1,0), ('empty-state-exit',0x4ed6f0,0x4ed6f1,1,0),
    ('class-initializer',0x4ed640,0x4ed660,1,0), ('person-initializer',0x4d2740,0x4d3131,1,0),
    ('clear-work',0x4a3940,0x4a3955,1,0), ('formation',0x4d47d0,0x4d4839,1,0),
    ('empty-order-start',0x432260,0x4324b6,1,0), ('animation-select',0x4d3ea0,0x4d3f7d,1,0),
    ('person-animation',0x4d4040,0x4d4297,2,0), ('object-animation',0x4ee700,0x4ee76c,3,0),
]
code_ranges=[]
for name,entry,stop,args,bits in functions:
    if entry==0x4cb400:
        for a,b in [(0x4cb400,0x4cb4bc),(0x4cb549,0x4cb55e),(0x4cb8b7,0x4cb8e8)]:
            code_ranges.append(dict(start=a,stopExclusive=b,sha256=sha(native_bytes(a,b-a))))
    elif entry==0x432260:
        for a,b in [(0x432260,0x43228b),(0x4324af,0x4324b6)]:
            code_ranges.append(dict(start=a,stopExclusive=b,sha256=sha(native_bytes(a,b-a))))
    else: code_ranges.append(dict(start=entry,stopExclusive=stop,sha256=sha(native_bytes(entry,stop-entry))))
static = [(0x4ccadc,4,'phase6 jump'), (0x4ed6c4,4,'person class jump'),
          (0x4d3134,44*4,'state initializer jump table'), (0x4d3f80,0x70,'animation state dispatch tables'),
          (0x5a6f79+10*5,4,'state10flags6916'),(0x5a6f7a+33*5,1,'oldstate33flag byte'),
          (0x5a6f79+19*5,1,'state19flags byte'),(0x5a7064+2*50,1,'model2default10'),
          (0x5a7090+2*50,2,'model2flags'), (0x5a6d50+2*2,2,'model2standing action15'),
          (0x5a6858+15*4,4,'action15 object48/draw14'),(0x5a6af8+14*11,11,'draw14descriptor')]
static_regions=[]
for address,size,name in static:
    data=native_bytes(address,size)
    static_regions.append(dict(address=address,size=size,name=name,sha256=sha(data)))
    permit(reads,address,size,name)
assert struct.unpack('<I',native_bytes(0x5a6f79+10*5,4))[0]==6916
assert native_bytes(0x5a7064+2*50,1)==b'\x0a'
assert struct.unpack('<HH',native_bytes(0x5a6858+15*4,4))==(48,14)
# Native stack is the only arbitrary runtime scratch supply; its sentinels are checked.
stack,stop=0x201d000,0x201e000
permit(reads,stack-4096,4108,'cdecl stack');permit(writes,stack-4096,4108,'cdecl stack')
sequence=[0x4cb400,0x4f2460,0x4f2460,0x4d14f0,0x462750,0x4f2460,0x4f39f0,
          0x4f2440,0x436ca0,0x4364d0,0x4da1d0,0x501be0,0x4e9b40,0x4ed6f0,
          0x4ed640,0x4d2740,0x4a3940,0x4d47d0,0x432260,0x4d3ea0,0x4d4040,
          0x4ee700,0x4f2460,0x4f39f0]
fixture=dict(kind='One unexecuted supplied state33 composition; predictions from source only',
    captureSha256=RAW['captureSha256'],people=people,fields=fields,regions=regions,
    sourceData=[dict(path='data/vstart-0.ani',sha256=sha(starts_blob)),dict(path='data/vfra-0.ani',sha256=sha(frames_blob))],
    executableSha256=sha(blob),tribe=tribe,task=task,taskIndex=1,frameCount=frame_count,
    supplied=dict(nativeFlags7f=0,nativeAssignment=2,visitCounter=0,portCursor=1,
                  portTurn=3227,tribeChain=[10,11],unmappedBytes='0xa5; no read allowed'),
    abi=dict(entry=0x4cb400,stack=stack,stop=stop,scratchAddress=0x2000000,scratchBytes=0x20000,
             arguments=[tribe,1],functions=[dict(name=n,entry=a,stopExclusive=b,argumentSlots=c,returnBits=d) for n,a,b,c,d in functions],
             codeRanges=code_ranges,staticRanges=static_regions,
             initialRegisters=dict(EAX=0xa1a1a1a1,EBX=0xb2b2b2b2,ECX=0xc3c3c3c3,EDX=0xd4d4d4d4,
                                   ESI=0xe5e5e5e5,EDI=0xf6f6f6f6,EBP=0x17171717,EFLAGS=2)),
    allowlist=dict(read=reads,write=writes,interceptions=[],flags7f=dict(address=people[0]['address']+0x7f,pc=0x4f2448,readCount=1,writeCount=1)),
    predicted=dict(entrySequence=sequence,person10Changes=changes,phase=6,elapsed=360,order131References=0,poolActive=2),
    limits=dict(nativeInstructions=100000,nativeMicroseconds=1000000,portSeconds=5,outerSeconds=15,outputBytes=8388608,retry=False))
(OUT/'fixture.json').write_text(json.dumps(fixture,indent=2)+'\n')
print(json.dumps(dict(status='source-inputs-prepared',regions=len(regions),functions=len(functions),nativeCalls=0,appExecution=False)))
