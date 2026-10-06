"""Fixed supplied-state command17 terminal restart comparison. Preparation is not execution approval.

--validate: source/input/case/static-disassembly preflight only; no Unicorn or Node.
--execute: ONLY after a separate grant, actual bounded native/port comparison.
The fixed manifest owns paths, hashes and limits. Results never rewrite expectations.
"""
import argparse
import hashlib
import json
import os
import signal
from pathlib import Path
import struct
import subprocess
import sys
import time

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[2]
sha = lambda data: hashlib.sha256(data).hexdigest()
FIELDS = {
    'flags2': (0x0c, 'I'), 'flags4': (0x10, 'I'), 'flags3': (0x14, 'I'),
    'stamp': (0x18, 'I'), 'id': (0x24, 'H'), 'angle': (0x26, 'H'),
    'class': (0x2a, 'B'), 'model': (0x2b, 'B'), 'state': (0x2c, 'B'),
    'substate': (0x2d, 'B'), 'counter': (0x2e, 'B'), 'tribe': (0x2f, 'B'),
    'physics': (0x30, 'B'), 'object': (0x33, 'H'), 'renderFlags': (0x35, 'H'),
    'f1': (0x37, 'h'), 'f2': (0x39, 'B'), 'draw': (0x3a, 'B'),
    'morph': (0x3b, 'B'), 'palette': (0x3c, 'B'), 'x': (0x3d, 'H'),
    'y': (0x3f, 'H'), 'h': (0x41, 'h'), 'goalX': (0x4f, 'H'),
    'goalY': (0x51, 'H'), 'turnAngle': (0x57, 'H'), 'heading': (0x5d, 'H'),
    'speed': (0x5f, 'h'), 'motionGroup': (0x63, 'H'), 'motionIndex': (0x67, 'B'),
    'maxLife': (0x6c, 'h'), 'life': (0x6e, 'h'), 'timer': (0x70, 'h'),
    'assignment': (0x76, 'H'), 'cargo': (0x78, 'h'), 'previousState': (0x7d, 'B'),
    'workTarget': (0x89, 'H'), 'immediateCommand': (0x9b, 'H'),
    'vehicle': (0x9f, 'H'), 'commandCursor': (0xa6, 'B'),
    'commandStatus': (0xa7, 'B'), 'animationMode': (0xa8, 'B'),
    'commandAux': (0xa9, 'B'), 'commandPhase': (0xaa, 'B'), 'statusFlags': (0xb2, 'B'),
}
P, COUNTS, STACK, STOP = 0x2000000, 0x2010000, 0x203d000, 0x203f000
ORDER = 0x938830 + 26*10
COSMETIC, SIMULATION, SERIAL = 0x89bc72, 0x89d178, 0x897981
RANGES = [
    (0x43a4d0, 0x43abd7), (0x4d4ee0, 0x4d4f3d),
    (0x4d4040, 0x4d4297), (0x4ee700, 0x4ee76c),
    (0x4ee7b0, 0x4ee7f8), (0x4ee85e, 0x4ee8ed), (0x4ee9cb, 0x4ee9cf),
]
ACTUAL_ENTRIES = {0x43a4d0, 0x4d4ee0, 0x4d4040, 0x4ee700, 0x4ee7b0}
LEAVES = {0x43abf0: 'acquisition'}
PHASES = ['beforeController', 'afterController', 'beforeUpdater', 'afterUpdater']
FIXED_CASE_SHA = 'ea21b949c2e406219e53d2e9d98847b0f2a736ea7c2af34ac991d46b95823a74'
RAW_SHA = '2500416fce721fbd6ea1a73979c125f0f72ca3059d584c82997099c024ca7290'
ORDER_HEX = '110001000000002b009f'
LIMITS = {'cases': 1, 'controllerCalls': 3, 'updaterCalls': 3,
    'instructionsPerCall': 100000, 'secondsPerCall': 1, 'totalNativeSeconds': 10,
    'portSeconds': 15, 'cpu': 4, 'outerSeconds': 27, 'cleanupSeconds': 3}


class Blocked(RuntimeError):
    pass


def read_va(exe, address, size):
    pe = struct.unpack_from('<I', exe, 60)[0]
    sections = struct.unpack_from('<H', exe, pe+6)[0]
    optional = struct.unpack_from('<H', exe, pe+20)[0]
    base = struct.unpack_from('<I', exe, pe+52)[0]
    for i in range(sections):
        _, _, rva, length, offset = struct.unpack_from('<8sIIII', exe, pe+24+optional+i*40)
        if base+rva <= address and address+size <= base+rva+length:
            return exe[offset+address-base-rva:offset+address-base-rva+size]
    raise Blocked(f'Unbacked PE bytes at {address:08x}')


def pack_person(person, commands):
    raw = bytearray(256)
    if set(person) != set(FIELDS) or len(commands) != 8:
        raise Blocked('Missing or additional mapped field/command slot')
    for key, (offset, fmt) in FIELDS.items():
        struct.pack_into('<'+fmt, raw, offset, person[key])
    struct.pack_into('<8H', raw, 0x8b, *commands)
    return bytes(raw)


def fixed_case(raw):
    if sha(raw) != FIXED_CASE_SHA:
        raise Blocked('Fixed case drift; additional cases or altered inputs need review')
    case = json.loads(raw)
    case['person'] = {**case['observedPersonFields'], 'maxLife': case['suppliedFields']['maxLife']['value']}
    if (case['id'] != 'ordinary17-terminal-restart' or case['pairs'] != 3 or
            case['commands'] != [26, 0, 0, 0, 0, 0, 0, 0] or case['order']['id'] != 26 or
            case['nextCounters'] != [150, 151, 152] or case['acquisitionCount'] != 0):
        raise Blocked('Fixed case scope mismatch')
    if sha(pack_person(case['person'], case['commands'])) != RAW_SHA:
        raise Blocked('Final supplied raw256 drift')
    order = case['order']
    raw_order = struct.pack('<BBHHHH', *(order[k] for k in ['model','flags','references','object','a','b']))
    if raw_order.hex() != ORDER_HEX:
        raise Blocked('Order26 record drift')
    return case


def prepared():
    manifest_bytes = (HERE/'preflight.json').read_bytes()
    manifest = json.loads(manifest_bytes)
    if manifest['limits'] != LIMITS or manifest['controllerCalls'] != 3:
        raise Blocked('Fixed execution limits drift')
    verification = postflight(manifest, manifest_bytes)
    if verification['status'] != 'passed':
        raise Blocked('Source/input/tool drift: '+json.dumps(verification))
    if Path(sys.executable).resolve() != Path(manifest['pythonPath']).resolve():
        raise Blocked('Unbound Python interpreter')
    case = fixed_case((HERE/'case-input.json').read_bytes())
    starts = list(struct.iter_unpack('<HH', Path(manifest['gameRoot'],'data/vstart-0.ani').read_bytes()))
    frames = list(struct.iter_unpack('<HBBBBH', Path(manifest['gameRoot'],'data/vfra-0.ani').read_bytes()))
    counts = []
    for first, _mirror in starts:
        frame, seen = first, set()
        while frame and frame not in seen:
            if frame >= len(frames):
                raise Blocked('Invalid VFRA chain')
            seen.add(frame)
            frame = frames[frame][-1]
        if frame not in [0, first]:
            raise Blocked('Unexpected VFRA cycle')
        counts.append(len(seen) & 255)
    imported = json.loads((ROOT/'app/original-units.json').read_text())['frameCounts']
    if counts != imported or [counts[s] for s in [48,160,168]] != [6,4,6]:
        raise Blocked('Loaded animation counts differ')
    count_table = bytearray(len(counts)*6)
    for index,count in enumerate(counts):
        count_table[index*6+1] = count
    if sha(count_table) != manifest['suppliedFrameCountTableSha256']:
        raise Blocked('Six-byte-stride count table drift')
    from capstone import Cs, CS_ARCH_X86, CS_MODE_32
    disassembler = Cs(CS_ARCH_X86, CS_MODE_32)
    exe = Path(manifest['executable']).read_bytes()
    instructions = {}
    for first, end in RANGES:
        raw = read_va(exe, first, end-first)
        if sha(raw) != manifest['instructionRanges'][f'{first:08x}-{end:08x}']:
            raise Blocked('Instruction-range drift')
        decoded = list(disassembler.disasm(raw, first))
        if not decoded or decoded[-1].address+decoded[-1].size != end:
            raise Blocked('Incomplete instruction boundary')
        for instruction in decoded:
            instructions[instruction.address] = (instruction.mnemonic, instruction.op_str)
    rules = json.loads((ROOT/'app/original-rules.json').read_text())
    for table in manifest['tables']:
        raw = read_va(exe, int(table['address'],16), len(bytes.fromhex(table['bytes'])))
        if raw.hex() != table['bytes'] or sha(raw) != table['sha256']:
            raise Blocked('Original table drift: '+table['name'])
    for obj in [17,95,97]:
        if list(struct.unpack('<hh', read_va(exe,0x5a6858+obj*4,4))) != rules['animationObjects'][obj]:
            raise Blocked('Imported object table drift')
    for draw in [14,16,19]:
        if rules['animationDescriptors'][draw]['mode'] != 2:
            raise Blocked('Unexpected updater mode')
    if rules['personAnimationObjects'][4] != 17 or not rules['personModels'][4]['flags'] & 1:
        raise Blocked('Imported stop/model table drift')
    return manifest, [case], counts, instructions, rules, manifest_bytes


def permitted_write(address, size, phase):
    if size < 1:
        return False
    if STACK-0x2000 <= address and address+size <= STACK+0x1000:
        return True
    names = ['f1', 'f2'] if phase == 'updater' else [
        'flags2','substate','object','renderFlags','f1','f2','draw','morph','palette',
        'speed','timer','assignment']
    allowed_bytes = {P+offset+i for name in names
        for offset,fmt in [FIELDS[name]] for i in range(struct.calcsize('<'+fmt))}
    return all(byte in allowed_bytes for byte in range(address,address+size))


def check_state(state, case):
    if len(bytes.fromhex(state['raw'])) != 256 or set(state['fields']) != set(FIELDS):
        raise Blocked('Incomplete state observation')
    if pack_person(state['fields'], state['commands']).hex() != state['raw']:
        raise Blocked('Unexpected unmapped person-byte mutation; raw256 retained')
    if (state['commands'] != case['commands'] or state['order'] != case['order'] or
            state['orderRaw'] != ORDER_HEX or state['owner'] != {
                'personAddress': P, 'personId': 3164, 'orderId': 26, 'orderAddress': ORDER}):
        raise Blocked('Order/owner/command queue drift')
    for key in ['cosmeticRandom','simulationRandom']:
        if state[key] != case[key]:
            raise Blocked('Unexpected RNG change: '+key)
    for key in ['id','class','model','state','flags3','flags4','assignment','statusFlags',
                'animationMode','commandStatus','commandCursor','immediateCommand','vehicle','cargo']:
        if state['fields'][key] != case['person'][key]:
            raise Blocked('Fixed domain changed: '+key)


def run_native(manifest, cases, counts, instructions, rules, result, output):
    # Imported only after the exact-code review and separate execution grant.
    from unicorn import UC_HOOK_CODE, UC_HOOK_MEM_WRITE, UC_HOOK_MEM_READ
    from unicorn.x86_const import (UC_X86_REG_ESP, UC_X86_REG_EIP, UC_X86_REG_EAX,
        UC_X86_REG_EBX, UC_X86_REG_ECX, UC_X86_REG_EDX, UC_X86_REG_ESI,
        UC_X86_REG_EDI, UC_X86_REG_EBP, UC_X86_REG_EFLAGS)
    sys.path.insert(0, str(ROOT/'scripts'))
    from decomp import native_cpu
    deadline = time.monotonic()+10
    cpu, identity = native_cpu(Path(manifest['executable']))
    cpu.mem_map(P, 0x40000)
    current = {'visit': 0, 'phase': 'initial', 'controllerReturn': None}
    events = []
    person_reads = set()
    calls = []
    result['calls'] = calls
    scenario = cases[0]

    def write(address, fmt, *values):
        cpu.mem_write(address, struct.pack('<'+fmt, *values))

    def read(address, fmt):
        return struct.unpack('<'+fmt, cpu.mem_read(address,struct.calcsize('<'+fmt)))[0]

    def snapshot():
        values = {key:read(P+offset,fmt) for key,(offset,fmt) in FIELDS.items()}
        order_values = struct.unpack('<BBHHHH',cpu.mem_read(ORDER,10))
        return {'raw':bytes(cpu.mem_read(P,256)).hex(), 'fields':values,
            'objectIdCandidates':[i for i,pair in enumerate(rules['animationObjects'])
                if pair == [values['object'],values['draw']]],
            'commands':[read(P+0x8b+i*2,'H') for i in range(8)],
            'order':{'id':26, **dict(zip(['model','flags','references','object','a','b'],order_values))},
            'orderRaw':bytes(cpu.mem_read(ORDER,10)).hex(),
            'owner':{'personAddress':P,'personId':values['id'],'orderId':read(P+0x8b,'H'),'orderAddress':ORDER},
            'worldAnimationCounter':read(SERIAL,'I'),
            'controllerReturn':current['controllerReturn'],
            'cosmeticRandom':read(COSMETIC,'I'),'simulationRandom':read(SIMULATION,'I')}

    def event(kind, args, boundary):
        events.append({'visit':current['visit'],'phase':current['phase'],
            'kind':kind,'args':args,'boundary':boundary,'state':snapshot()})

    def code(_cpu, address, size, _user):
        if time.monotonic() >= deadline:
            raise Blocked('10-second total native deadline')
        current['instructions'] += 1
        if current['instructions'] > 100000:
            raise Blocked('100,000-instruction call budget')
        sp = cpu.reg_read(UC_X86_REG_ESP)
        if not STACK-0x2000 <= sp <= STACK:
            raise Blocked('Stack escaped bounded cdecl window')
        if address == 0x43abf0:
            person, radius, angle_out = (read(sp+i,'I') for i in [4,8,12])
            if (person != P or radius != 3 or current['phase'] != 'controller' or
                    current['visit'] not in [1,3] or not STACK-0x2000 <= angle_out <= STACK-4 or
                    scenario['acquisitionCount'] != 0):
                raise Blocked('Unexpected acquisition owner/radius/output/population/visit')
            event('acquisition',[P,radius],'supplied-empty-count/status; stack-out untouched')
            write(P+0xb2,'B',read(P+0xb2,'B') | 2)
            cpu.reg_write(UC_X86_REG_EAX,0)
            cpu.reg_write(UC_X86_REG_EIP,read(sp,'I'))
            cpu.reg_write(UC_X86_REG_ESP,sp+4)
            return
        if address not in instructions:
            raise Blocked(f'Unlisted instruction {address:08x}')
        mnemonic, operands = instructions[address]
        if mnemonic == 'call':
            try:
                target = int(operands,16)
            except ValueError:
                raise Blocked(f'Unlisted indirect call at {address:08x}')
            if target not in ACTUAL_ENTRIES and target not in LEAVES:
                raise Blocked(f'Unlisted call {address:08x}->{target:08x}')
        if address == 0x4d4ee0:
            if read(sp+4,'I') != P:
                raise Blocked('Unexpected stop owner')
            event('stop',[P],'actual-native')
        elif address == 0x4d4040:
            obj = read(sp+8,'I')
            if read(sp+4,'I') != P or obj not in [17,95]:
                raise Blocked('Unexpected upper-setter owner/object')
            event('upper-setter',[P,obj],'actual-native')
        elif address == 0x4ee700:
            args = [read(sp+i,'I') for i in [4,8,12]]
            if args not in [[P+0x33,16,48],[P+0x33,19,160]]:
                raise Blocked('Unexpected lower-setter owner/draw/source')
            event('lower-setter',args,'actual-native')

    def memory_write(_cpu, _access, address, size, value, _user):
        result['writes'].append({'visit':current['visit'],'phase':current['phase'],
            'address':f'{address:08x}','size':size,'value':value,
            'eip':f'{cpu.reg_read(UC_X86_REG_EIP):08x}'})
        if not permitted_write(address,size,current['phase']):
            raise Blocked(f'Unlisted native write {address:08x}+{size}')

    def memory_read(_cpu, _access, address, size, _value, _user):
        if address < P+256 and P < address+size:
            person_reads.update(range(max(address,P)-P,min(address+size,P+256)-P))
            if address < P+0x6e and P+0x6c < address+size:
                raise Blocked('Selected path read unobserved maxLife')

    def call(address, *args):
        current['instructions'] = 0
        if time.monotonic() >= deadline:
            raise Blocked('10-second total native deadline')
        cpu.mem_write(STACK-0x2000,bytes(0x3000))
        write(STACK,'I'*(len(args)+1),STOP,*args)
        for register in [UC_X86_REG_EAX,UC_X86_REG_EBX,UC_X86_REG_ECX,
                         UC_X86_REG_EDX,UC_X86_REG_ESI,UC_X86_REG_EDI,UC_X86_REG_EBP]:
            cpu.reg_write(register,0)
        cpu.reg_write(UC_X86_REG_EFLAGS,2)
        cpu.reg_write(UC_X86_REG_ESP,STACK)
        receipt = {'entry':f'{address:08x}','args':list(args),'visit':current['visit'],
            'phase':current['phase'],'status':'running','callingConvention':'cdecl; ECX=0'}
        calls.append(receipt)
        start = time.monotonic()
        try:
            cpu.emu_start(address,STOP,timeout=1_000_000,count=100_000)
            if cpu.reg_read(UC_X86_REG_EIP) != STOP:
                raise Blocked('Native call stopped before sentinel return: budget or execution fault')
            if cpu.reg_read(UC_X86_REG_ESP) != STACK+4:
                raise Blocked('Unexpected callee stack cleanup')
            if time.monotonic()-start > 1 or time.monotonic() >= deadline:
                raise Blocked('Native call/total wall-time budget')
            receipt['status'] = 'returned'
            receipt['returnAL'] = cpu.reg_read(UC_X86_REG_EAX)&255
            return receipt['returnAL']
        except Exception:
            receipt['status'] = 'blocked'
            result['interruptedCall'] = {**receipt,'eip':f'{cpu.reg_read(UC_X86_REG_EIP):08x}',
                'state':snapshot(),'events':list(events)}
            raise
        finally:
            receipt['instructions'] = current['instructions']
            receipt['seconds'] = time.monotonic()-start
            result['personReadOffsets'] = sorted(person_reads)

    write(0x59df44,'I',COUNTS)
    for index,count in enumerate(counts):
        write(COUNTS+index*6+1,'B',count)
    for address in [0x89d17c,0x895da8,0x895da4]:
        write(address,'I',0)
    cpu.mem_write(P,pack_person(scenario['person'],scenario['commands']))
    cpu.mem_write(ORDER,bytes.fromhex(ORDER_HEX))
    write(COSMETIC,'I',scenario['cosmeticRandom'])
    write(SIMULATION,'I',scenario['simulationRandom'])
    write(SERIAL,'I',scenario['worldAnimationCounter'])
    cpu.hook_add(UC_HOOK_CODE,code)
    cpu.hook_add(UC_HOOK_MEM_WRITE,memory_write)
    cpu.hook_add(UC_HOOK_MEM_READ,memory_read)
    result.update(nativeIdentity=identity,writes=[],personReadOffsets=[])
    record = {'case':scenario['id'],'initial':snapshot(),'rows':[]}
    result['cases'].append(record)
    check_state(record['initial'],scenario)
    for visit, counter in enumerate(scenario['nextCounters'],1):
        if result['completedControllerCalls'] >= 3 or result['completedUpdaterCalls'] >= 3:
            raise Blocked('Controller/updater call cap')
        current.update(visit=visit,phase='before-controller',controllerReturn=None)
        write(P+0x2e,'B',counter)
        write(SERIAL,'I',scenario['worldAnimationCounter']+visit)
        events.clear()
        row = {'case':scenario['id'],'visit':visit,'beforeController':snapshot(),'events':[]}
        record['rows'].append(row)
        current['phase'] = 'controller'
        row['result'] = call(0x43a4d0,P,ORDER)
        result['completedControllerCalls'] += 1
        current['controllerReturn'] = row['result']
        current['phase'] = 'after-controller'
        row['afterController'] = snapshot()
        write(P+0x18,'I',read(SERIAL,'I'))
        current['phase'] = 'before-updater'
        row['beforeUpdater'] = snapshot()
        current['phase'] = 'updater'
        row['updaterReturnAL'] = call(0x4ee7b0,P)
        result['completedUpdaterCalls'] += 1
        current['phase'] = 'after-updater'
        row['afterUpdater'] = snapshot()
        row['events'] = list(events)
        # Persist complete raw observations before checking any result assertion.
        (output/'native.json').write_text(json.dumps(result,indent=2)+'\n')
        for phase in PHASES:
            check_state(row[phase],scenario)
        for item in row['events']:
            check_state(item['state'],scenario)
        if row['result'] != 0:
            raise Blocked('Unexpected controller return/release')
    result['nativeSeconds'] = 10-(deadline-time.monotonic())
    result['status'] = 'completed'


def differences(native, port):
    out = []
    for ncase,pcase in zip(native['cases'],port['cases'],strict=True):
        if ncase['case'] != pcase['case']:
            raise Blocked('Case order mismatch')
        for n,p in zip(ncase['rows'],pcase['rows'],strict=True):
            delta = {'case':n['case'],'visit':n['visit'],'phases':{}}
            for phase in PHASES:
                ns,ps = n[phase],p[phase]
                entry = {key:{'native':ns.get(key),'port':ps.get(key)}
                    for key in sorted(set(ns)|set(ps)) if ns.get(key)!=ps.get(key)}
                if entry:
                    raw_n,raw_p=bytes.fromhex(ns['raw']),bytes.fromhex(ps['raw'])
                    entry['rawByteOffsets']=[i for i,(a,b) in enumerate(zip(raw_n,raw_p,strict=True)) if a!=b]
                    delta['phases'][phase]=entry
            for key in ['result','events']:
                if n[key]!=p[key]:
                    delta[key]={'native':n[key],'port':p[key]}
            if delta['phases'] or 'result' in delta or 'events' in delta:
                out.append(delta)
    return out


def assess(native, port, case):
    for name, result in [('native',native),('port',port)]:
        if (len(result['cases']) != 1 or len(result['cases'][0]['rows']) != 3 or
                result['completedControllerCalls'] != 3 or result['completedUpdaterCalls'] != 3):
            raise Blocked('Incomplete fixed case: '+name)
        check_state(result['cases'][0]['initial'],case)
        for visit,row in enumerate(result['cases'][0]['rows'],1):
            if row['visit'] != visit or row['result'] != 0:
                raise Blocked('Unexpected visit/controller return: '+name)
            for phase in PHASES:
                state = row[phase]
                check_state(state,case)
                if state['fields']['counter'] != 149+visit or state['worldAnimationCounter'] != 4245+visit:
                    raise Blocked('Scheduler supply drift: '+name)
                expected_stamp = 4244+visit if phase in PHASES[:2] else 4245+visit
                if state['fields']['stamp'] != expected_stamp:
                    raise Blocked('Owner stamp drift: '+name)
            for event in row['events']:
                check_state(event['state'],case)
    n = native['cases'][0]['rows']
    p = port['cases'][0]['rows']
    # Preserve every discrepancy; the hypothesis needs the concrete restart family.
    native_pose = [n[1]['afterUpdater']['fields'][key] for key in ['object','draw']]
    port_pose = [p[1]['afterUpdater']['fields'][key] for key in ['object','draw']]
    supported = native_pose == [48,16] and port_pose == [168,14]
    endpoints = []
    for name,rows in [('native',n),('port',p)]:
        for i,row in enumerate(rows):
            f = row['afterUpdater']['fields']
            expected = [840,4,168,14,0,0,0x42220200 if name=='native' else 0x02220200] if i==0 else (
                [840,2,48 if name=='native' else 168,16 if name=='native' else 14,0,1,0x42220200]
                if i==1 else [7,2,160,19,0,0,0x02220200])
            actual = [f[key] for key in ['timer','substate','object','draw','f1','f2','flags2']]
            endpoints.append({'implementation':name,'visit':i+1,'predicted':expected,
                'observed':actual,'matchesPrediction':actual==expected})
    def signatures(rows):
        return [[(e['kind'],e['args']) for e in row['events']] for row in rows]
    acquire = ('acquisition',[P,3])
    stop = ('stop',[P])
    upper17 = ('upper-setter',[P,17])
    upper95 = ('upper-setter',[P,95])
    native_expected = [[acquire],[stop,upper17,('lower-setter',[P+0x33,16,48])],
        [stop,upper17,('lower-setter',[P+0x33,16,48]),upper95,('lower-setter',[P+0x33,19,160]),acquire]]
    port_expected = [[acquire],[],[stop,upper17,('lower-setter-intent',[P+0x33,16,48]),
        upper95,('lower-setter-intent',[P+0x33,19,160]),acquire]]
    expected_events = signatures(n)==native_expected and signatures(p)==port_expected
    return {'status':'hypothesis-supported' if supported and expected_events and all(
                row['matchesPrediction'] for row in endpoints) else 'hypothesis-rejected',
        'restartNativeSourceDraw':native_pose,'restartPortSourceDraw':port_pose,
        'eventPredictionsMatch':expected_events,'endpointPredictions':endpoints,
        'ordinaryRenderedImpact':'not-established',
        'transientEntryBit':'not sufficient evidence of lasting or visible gameplay impact'}


def postflight(manifest, manifest_bytes):
    checks = [('manifest', str(HERE/'preflight.json'), sha(manifest_bytes))]
    checks += [('source', str(ROOT/path), expected) for path,expected in manifest['sourceSha256'].items()]
    checks += [('input', path, expected) for path,expected in manifest['inputSha256'].items()]
    checks += [('tool', path, expected) for path,expected in manifest['toolSha256'].items()]
    rows = []
    for kind,path,expected in checks:
        row = {'kind':kind,'path':path,'expectedSha256':expected}
        try:
            row['actualSha256'] = sha(Path(path).read_bytes())
            row['status'] = 'passed' if row['actualSha256']==expected else 'drift'
        except OSError as error:
            row['status']='unreadable';row['error']=f'{type(error).__name__}: {error}'
        rows.append(row)
    return {'status':'passed' if all(r['status']=='passed' for r in rows) else 'blocked',
            'checks':rows}


def retain_port(output, stdout, stderr, status):
    # TimeoutExpired may carry bytes even when subprocess.run uses text=True.
    for name,value in [('port.stdout.json',stdout),('port.stderr.txt',stderr)]:
        raw = value if isinstance(value,bytes) else (value or '').encode('utf-8')
        (output/name).write_bytes(raw)
    (output/'port-status.json').write_text(json.dumps(status,indent=2)+'\n')


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    mode=parser.add_mutually_exclusive_group(required=True)
    mode.add_argument('--validate',action='store_true')
    mode.add_argument('--execute',action='store_true')
    args=parser.parse_args()
    manifest,cases,counts,instructions,rules,manifest_bytes=prepared()
    if args.validate:
        print(json.dumps({'status':'preflight-passed','nativeExecution':'not-run',
            'portExecution':'not-run','cases':len(cases),'controllerCalls':sum(c['pairs'] for c in cases),
            'raw256Sha256':RAW_SHA,'orderAddress':f'{ORDER:08x}',
            'manifestSha256':sha(manifest_bytes)},indent=2))
        return
    if os.sched_getaffinity(0) != {4}:
        raise Blocked('Execution requires the separately granted single CPU4 lane')
    output=ROOT/manifest['outputDirectory']
    output.mkdir(parents=True,exist_ok=False)
    result={'status':'running','scope':manifest['scope'],'cases':[],
            'manifestSha256':sha(manifest_bytes),'completedControllerCalls':0,'completedUpdaterCalls':0}
    (output/'frozen-manifest.json').write_bytes(manifest_bytes)
    blockers=[]
    summary=None
    def interrupted(signum, _frame):
        raise Blocked(f'Outer signal {signum}; preserve partial evidence, do not retry')
    previous_term = signal.signal(signal.SIGTERM,interrupted)
    previous_int = signal.signal(signal.SIGINT,interrupted)
    try:
        run_native(manifest,cases,counts,instructions,rules,result,output)
        (output/'native.json').write_text(json.dumps(result,indent=2)+'\n')
        payload={'fields':FIELDS,'frameCounts':counts,'cases':cases,'addresses':{'person':P,'order':ORDER}}
        (output/'supplied-input.json').write_text(json.dumps(payload,indent=2)+'\n')
        try:
            process=subprocess.run([manifest['nodePath'],str(HERE/'compare-port.mjs')],
                input=json.dumps(payload),capture_output=True,text=True,cwd=ROOT,timeout=15,
                env={**os.environ,'NODE_OPTIONS':'','NODE_PATH':''})
        except subprocess.TimeoutExpired as error:
            retain_port(output,error.stdout,error.stderr,{'status':'timed-out',
                'timeoutSeconds':error.timeout,'exitCode':None,
                'childTermination':'subprocess.run kills the direct child and waits before raising TimeoutExpired'})
            raise Blocked('Port process timed out; captured streams retained') from error
        retain_port(output,process.stdout,process.stderr,
                    {'status':'exited','exitCode':process.returncode,'timedOut':False})
        if process.returncode:
            raise Blocked(f'Port process exit {process.returncode}')
        port=json.loads(process.stdout)
        inventory=differences(result,port)
        (output/'divergences.json').write_text(json.dumps(inventory,indent=2)+'\n')
        summary=assess(result,port,cases[0])
        summary.update(controllerCalls=result['completedControllerCalls'],
            updaterCalls=result['completedUpdaterCalls'],divergentRows=len(inventory),
            manifestSha256=result['manifestSha256'])
    except Exception as error:
        if result['status'] != 'completed':
            result['status']='blocked'
        blockers.append(f'{type(error).__name__}: {error}')
    finally:
        signal.signal(signal.SIGTERM,previous_term)
        signal.signal(signal.SIGINT,previous_int)
        verification=postflight(manifest,manifest_bytes)
        (output/'postflight.json').write_text(json.dumps(verification,indent=2)+'\n')
        result['postflightStatus']=verification['status']
        if verification['status']!='passed':
            blockers.append('Postflight source/input/manifest identity drift; see postflight.json')
        if blockers:
            result['comparisonStatus']='blocked'
            result['blockers']=blockers
        (output/'native.json').write_text(json.dumps(result,indent=2)+'\n')
    if blockers:
        (output/'blocked.json').write_text(json.dumps({'status':'blocked','reasons':blockers},indent=2)+'\n')
        print('; '.join(blockers),file=sys.stderr)
        raise SystemExit(2)
    summary['postflightStatus']='passed'
    (output/'summary.json').write_text(json.dumps(summary,indent=2)+'\n')
    print(json.dumps(summary))


if __name__=='__main__':
    main()
