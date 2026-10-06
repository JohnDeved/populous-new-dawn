"""Frozen supplied-state sermon comparison. Preparation is not execution approval.

--validate: source/input/case/static-disassembly preflight only; no Unicorn or Node.
--execute: ONLY after a separate grant, actual bounded native/port comparison.
The fixed manifest owns paths, hashes and limits. Results never rewrite expectations.
"""
import argparse
import hashlib
import json
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
ORDER = 0x93883a
COSMETIC, SIMULATION, SERIAL = 0x89bc72, 0x89d178, 0x897981
RANGES = [
    (0x43a4d0, 0x43abd7), (0x4d4ee0, 0x4d4f3d),
    (0x4d4040, 0x4d4297), (0x4ee700, 0x4ee76c),
    (0x4ee7b0, 0x4ee7f8), (0x4ee85e, 0x4ee8ed), (0x4ee9cb, 0x4ee9cf),
]
ACTUAL_ENTRIES = {0x43a4d0, 0x4d4ee0, 0x4d4040, 0x4ee700, 0x4ee7b0}
LEAVES = {
    0x43abf0: 'acquisition', 0x48a050: 'audio', 0x4ea460: 'registration',
    0x4da170: 'reveal-check', 0x43aec0: 'release',
}


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


def prepared():
    manifest_bytes = (HERE/'preflight.json').read_bytes()
    manifest = json.loads(manifest_bytes)
    for path, expected in manifest['sourceSha256'].items():
        if sha((ROOT/path).read_bytes()) != expected:
            raise Blocked('Source drift: '+path)
    for path, expected in manifest['inputSha256'].items():
        if sha(Path(path).read_bytes()) != expected:
            raise Blocked('Input drift: '+path)
    if sha(Path(manifest['nodePath']).read_bytes()) != manifest['nodeSha256']:
        raise Blocked('Node binary drift')
    spec = json.loads((HERE/'cases.json').read_text())
    cases = []
    for family in ['main', 'boundaries']:
        for case in spec[family]:
            row = {**spec['defaults'], **case, 'family': family}
            row['person'] = {**spec['defaults']['person'], **case.get('person', {})}
            if set(row['person']) != set(FIELDS):
                raise Blocked('Missing or unbound person field: '+row['id'])
            if row['person']['state'] != 10 or row['person']['vehicle'] or row['person']['class'] != 1:
                raise Blocked('Case outside on-foot live-person scope')
            if row['person']['substate'] not in [2, 3] or row['acquisitionCount'] not in [0, 1]:
                raise Blocked('Case outside approved controller/consumer scope')
            cases.append(row)
    count = sum(c['pairs'] for c in cases)
    if len(spec['boundaries']) > 24 or count != manifest['controllerCalls'] or count > 80:
        raise Blocked('Case budget drift')
    if len({c['id'] for c in cases}) != len(cases):
        raise Blocked('Duplicate case')
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
    if counts != imported or [counts[s] for s in [160,168,176,184]] != [4,6,10,18]:
        raise Blocked('Loaded animation counts differ')
    from capstone import Cs, CS_ARCH_X86, CS_MODE_32
    disassembler = Cs(CS_ARCH_X86, CS_MODE_32)
    exe = Path(manifest['executable']).read_bytes()
    instructions = {}
    for first, end in RANGES:
        raw = read_va(exe, first, end-first)
        expected = manifest['instructionRanges'][f'{first:08x}-{end:08x}']
        if sha(raw) != expected:
            raise Blocked('Instruction-range drift')
        decoded = list(disassembler.disasm(raw, first))
        if not decoded or decoded[-1].address+decoded[-1].size != end:
            raise Blocked('Incomplete instruction boundary')
        for instruction in decoded:
            instructions[instruction.address] = (instruction.mnemonic, instruction.op_str)
    rules = json.loads((ROOT/'app/original-rules.json').read_text())
    for obj in [95,97,98,99]:
        if list(struct.unpack('<hh', read_va(exe,0x5a6858+obj*4,4))) != rules['animationObjects'][obj]:
            raise Blocked('Object table drift')
    return manifest, cases, counts, instructions, rules, manifest_bytes


def run_native(manifest, cases, counts, instructions, rules, result, output):
    # Imports and emulation exist exclusively in the separately authorized path.
    from unicorn import UC_HOOK_CODE, UC_HOOK_MEM_WRITE
    from unicorn.x86_const import (UC_X86_REG_ESP, UC_X86_REG_EIP, UC_X86_REG_EAX,
        UC_X86_REG_EBX, UC_X86_REG_ECX, UC_X86_REG_EDX, UC_X86_REG_ESI,
        UC_X86_REG_EDI, UC_X86_REG_EBP, UC_X86_REG_EFLAGS)
    sys.path.insert(0, str(ROOT/'scripts'))
    from decomp import native_cpu
    cpu, identity = native_cpu(Path(manifest['executable']))
    cpu.mem_map(P, 0x40000)
    deadline = time.monotonic()+60
    controller_calls = 0
    current = {}
    events = []

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
            'order':dict(zip(['model','flags','references','object','a','b'],order_values)),
            'worldAnimationCounter':read(SERIAL,'I'),
            'cosmeticRandom':read(COSMETIC,'I'),'simulationRandom':read(SIMULATION,'I')}

    def event(kind, args, boundary):
        events.append({'visit':current['visit'],'phase':current['phase'],
            'kind':kind,'args':args,'boundary':boundary,'state':snapshot()})

    def code(_cpu, address, size, _user):
        if time.monotonic() >= deadline:
            raise Blocked('60-second total native deadline')
        current['instructions'] += 1
        if current['instructions'] > 100000:
            raise Blocked('100,000-instruction call budget')
        sp = cpu.reg_read(UC_X86_REG_ESP)
        if address in LEAVES:
            person = read(sp+4,'I')
            if person != P:
                raise Blocked('Unexpected supplied-leaf owner')
            kind = LEAVES[address]
            value = 0
            if kind == 'acquisition':
                radius, angle_out = read(sp+8,'I'),read(sp+12,'I')
                if radius != 3 or not STACK-0x2000 <= angle_out <= STACK+0xffc:
                    raise Blocked('Unexpected acquisition arguments')
                event(kind,[P,radius],'supplied-count/status/first-angle')
                value = current['case']['acquisitionCount']
                flags = read(P+0xb2,'B')
                write(P+0xb2,'B',flags|2 if value<=4 else flags&~2)
                if value:
                    write(angle_out,'I',current['case']['firstAngle'])
            elif kind == 'audio':
                cue, argument = read(sp+8,'I'),read(sp+12,'I')
                if cue not in [51,189] or argument != 0:
                    raise Blocked('Unexpected audio request')
                event(kind,[P,cue,argument],'supplied-no-audio/no-extra-RNG')
            elif kind == 'registration':
                if read(P+0x63,'H'):
                    raise Blocked('Unexpected motion-group registration')
                event(kind,[P],'supplied-group0-no-writes')
            elif kind == 'reveal-check':
                if read(P+0x10,'I') & 0x1000:
                    raise Blocked('Unexpected invisibility reveal')
                event(kind,[P],'supplied-visible-no-writes')
            elif kind == 'release':
                radius = read(sp+8,'I')
                if radius != 3 or current['case']['acquisitionCount']:
                    raise Blocked('Unexpected release population')
                event(kind,[P,radius],'supplied-empty-listeners-no-writes')
            cpu.reg_write(UC_X86_REG_EAX,value)
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
            if read(sp+4,'I') != P:
                raise Blocked('Unexpected upper-setter owner')
            event('upper-setter',[P,read(sp+8,'H')],'actual-native')
        elif address == 0x4ee700:
            if read(sp+4,'I') != P+0x33:
                raise Blocked('Unexpected lower-setter owner')
            event('lower-setter',[P+0x33,read(sp+8,'B'),read(sp+12,'H')],'actual-native')

    def memory_write(_cpu, _access, address, size, _value, _user):
        allowed = [(P,P+256),(STACK-0x2000,STACK+0x1000),
                   (COSMETIC,COSMETIC+4),(SIMULATION,SIMULATION+4)]
        if not any(first<=address and address+size<=last for first,last in allowed):
            raise Blocked(f'Unlisted native write {address:08x}+{size}')

    def call(address, *args):
        current['instructions'] = 0
        if time.monotonic() >= deadline:
            raise Blocked('60-second total native deadline')
        cpu.mem_write(STACK-0x2000,bytes(0x3000))
        write(STACK,'I'*(len(args)+1),STOP,*args)
        for register in [UC_X86_REG_EAX,UC_X86_REG_EBX,UC_X86_REG_ECX,
                         UC_X86_REG_EDX,UC_X86_REG_ESI,UC_X86_REG_EDI,UC_X86_REG_EBP]:
            cpu.reg_write(register,0)
        cpu.reg_write(UC_X86_REG_EFLAGS,2)
        cpu.reg_write(UC_X86_REG_ESP,STACK)
        try:
            cpu.emu_start(address,STOP,timeout=1_000_000,count=100_000)
            if cpu.reg_read(UC_X86_REG_EIP) != STOP:
                raise Blocked('Native call stopped before return: time/instruction budget or execution fault')
        except Exception:
            result['interruptedCall'] = {'entry':f'{address:08x}',
                'eip':f'{cpu.reg_read(UC_X86_REG_EIP):08x}', 'case':current['case']['id'],
                'visit':current['visit'], 'phase':current['phase'], 'state':snapshot()}
            raise
        return cpu.reg_read(UC_X86_REG_EAX)&255

    write(0x59df44,'I',COUNTS)
    for index,count in enumerate(counts):
        write(COUNTS+index*6+1,'B',count)
    write(0x89c6f0,'B',0)
    write(0x89d17c,'I',0)
    write(0x895da8,'I',8)
    write(0x895da4,'I',0x10000)
    write(0x96aa70,'I',0)
    for tribe in range(4):
        write(0x89d1c8+tribe*0xc65+0x93d,'I',0)
        write(0x89d1c8+tribe*0xc65+0xc1f,'B',1)
    cpu.hook_add(UC_HOOK_CODE,code)
    cpu.hook_add(UC_HOOK_MEM_WRITE,memory_write)
    result['nativeIdentity'] = identity
    for scenario in cases:
        cpu.mem_write(P,bytes(256))
        for key,(offset,fmt) in FIELDS.items():
            write(P+offset,fmt,scenario['person'][key])
        write(P+0x8b,'H',1)
        cpu.mem_write(0x938830,bytes(20))
        write(ORDER,'BBHHHH',scenario['person']['commandStatus'],0,1,0,
              scenario['person']['x'],scenario['person']['y'])
        write(COSMETIC,'I',scenario['cosmeticRandom'])
        write(SIMULATION,'I',scenario['simulationRandom'])
        write(SERIAL,'I',1000)
        record = {'case':scenario['id'],'rows':[]}
        result['cases'].append(record)
        for visit in range(1,scenario['pairs']+1):
            controller_calls += 1
            if controller_calls > min(80,manifest['controllerCalls']):
                raise Blocked('Controller-call cap')
            current.update(case=scenario,visit=visit,phase='before-controller')
            write(P+0x2e,'B',(read(P+0x2e,'B')+1)&255)
            write(SERIAL,'I',1000+visit)
            events.clear()
            row = {'case':scenario['id'],'visit':visit,'beforeController':snapshot(),
                   'events':events}
            record['rows'].append(row)
            current['phase'] = 'controller'
            row['result'] = call(0x43a4d0,P,ORDER)
            current['phase'] = 'after-controller'
            row['afterController'] = snapshot()
            write(P+0x18,'I',read(SERIAL,'I'))
            current['phase'] = 'before-updater'
            row['beforeUpdater'] = snapshot()
            current['phase'] = 'updater'
            call(0x4ee7b0,P)
            current['phase'] = 'after-updater'
            row['afterUpdater'] = snapshot()
            row['events'] = list(events)
            result['completedControllerCalls'] = controller_calls
        # Durable partial evidence after every fixed case; never extends the plan.
        (output/'native.json').write_text(json.dumps(result,indent=2)+'\n')
    result['status'] = 'completed'


def differences(native, port):
    out = []
    for ncase,pcase in zip(native['cases'],port['cases'],strict=True):
        if ncase['case'] != pcase['case']:
            raise Blocked('Case order mismatch')
        for n,p in zip(ncase['rows'],pcase['rows'],strict=True):
            delta = {'case':n['case'],'visit':n['visit'],'phases':{}}
            for phase in ['beforeController','afterController','beforeUpdater','afterUpdater']:
                ns,ps=n[phase],p[phase]
                changed={key:{'native':value,'port':ps['fields'][key]}
                         for key,value in ns['fields'].items() if value!=ps['fields'][key]}
                raw_n,raw_p=bytes.fromhex(ns['raw']),bytes.fromhex(ps['raw'])
                entry={'fields':changed,
                    'rawByteOffsets':[i for i,(a,b) in enumerate(zip(raw_n,raw_p,strict=True)) if a!=b]}
                for key in ['cosmeticRandom','simulationRandom','commands','order',
                            'objectIdCandidates','worldAnimationCounter']:
                    if ns[key]!=ps[key]:entry[key]={'native':ns[key],'port':ps[key]}
                if changed or entry['rawByteOffsets'] or len(entry)>2:
                    delta['phases'][phase]=entry
            if n['result']!=p['result']:
                delta['result']={'native':n['result'],'port':p['result']}
            # Keep exact raw event sequences, including explicitly supplied adapter boundaries.
            if n['events']!=p['events']:
                delta['events']={'native':n['events'],'port':p['events']}
            if delta['phases'] or 'result' in delta or 'events' in delta:
                out.append(delta)
    return out


def assert_failure_first(native,port):
    n={c['case']:c['rows'] for c in native['cases']}
    p={c['case']:c['rows'] for c in port['cases']}
    for case,source,frame_count in [('gesture98-to-return',176,10),('gesture99-to-return',184,18)]:
        birth=n[case][0]['afterController'];base=p[case][0]['afterController']
        if not (birth['fields']['object']==source and birth['fields']['f1']==1 and
                birth['fields']['f2']==0 and base['fields']['object']==168 and
                birth['cosmeticRandom']!=base['cosmeticRandom']):
            raise Blocked('Seeded missing-producer diagnosis not demonstrated: '+case)
        final=n[case][frame_count-1]['afterUpdater']['fields']
        ret=n[case][-1]
        if not (final['object']==source and final['f2']==frame_count-1 and
                ret['afterController']['fields']['object']==168 and
                ret['afterController']['fields']['f1']==0 and
                ret['afterController']['fields']['f2']==0 and
                ret['afterUpdater']['fields']['f2']==1):
            raise Blocked('Native gesture/return endpoint mismatch: '+case)
    native_entry=n['entry-to-first-loop'];port_entry=p['entry-to-first-loop']
    for index in [0,8]:
        nf=native_entry[index]['afterController']['fields'];pf=port_entry[index]['afterController']['fields']
        if (nf['f1'],nf['f2'])!=(1,0) or (nf['f1'],nf['f2'])==(pf['f1'],pf['f2']):
            raise Blocked('Missing entry phase-reset divergence')
    if not native_entry[-1]['afterController']['fields']['assignment']&16 or port_entry[-1]['afterController']['fields']['assignment']&16:
        raise Blocked('Missing loop-entry assignment divergence')
    active32=n['gesture99-to-return'][16]
    if (active32['beforeController']['fields']['counter']!=32 or
            active32['beforeController']['cosmeticRandom']!=active32['afterController']['cosmeticRandom'] or
            any(event['kind']=='upper-setter' for event in active32['events'])):
        raise Blocked('Active-gesture counter32 redrew or selected another object')
    for case,residue in [('no-gesture-residue2',2),('no-gesture-residue3',3)]:
        row=n[case][0]
        if (row['afterController']['fields']['object']!=168 or
                row['beforeController']['cosmeticRandom']==row['afterController']['cosmeticRandom'] or
                row['afterController']['cosmeticRandom']&3!=residue):
            raise Blocked('No-gesture decision did not consume native cosmetic RNG')


def postflight(manifest, manifest_bytes):
    checks = [('manifest', str(HERE/'preflight.json'), sha(manifest_bytes))]
    checks += [('source', str(ROOT/path), expected) for path,expected in manifest['sourceSha256'].items()]
    checks += [('input', path, expected) for path,expected in manifest['inputSha256'].items()]
    checks.append(('node', manifest['nodePath'], manifest['nodeSha256']))
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
            'boundaries':sum(c['family']=='boundaries' for c in cases),
            'manifestSha256':sha(manifest_bytes)},indent=2))
        return
    output=ROOT/manifest['outputDirectory']
    output.mkdir(parents=True,exist_ok=False)
    result={'status':'running','scope':manifest['scope'],'cases':[],
            'manifestSha256':sha(manifest_bytes),'completedControllerCalls':0}
    (output/'frozen-manifest.json').write_bytes(manifest_bytes)
    blockers=[]
    summary=None
    try:
        run_native(manifest,cases,counts,instructions,rules,result,output)
        (output/'native.json').write_text(json.dumps(result,indent=2)+'\n')
        payload={'fields':FIELDS,'frameCounts':counts,'cases':cases,'addresses':{'person':P}}
        (output/'supplied-input.json').write_text(json.dumps(payload,indent=2)+'\n')
        try:
            process=subprocess.run([manifest['nodePath'],str(HERE/'compare-port.mjs')],
                input=json.dumps(payload),capture_output=True,text=True,cwd=ROOT,timeout=15)
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
        assert_failure_first(result,port)
        summary={'status':'diagnosis-supported','wholeSermonEquality':'rejected',
                 'controllerCalls':result['completedControllerCalls'],'divergentRows':len(inventory),
                 'ordinaryPlay':'not-established','audioRNG':'not-executed; supplied leaf',
                 'manifestSha256':result['manifestSha256']}
    except Exception as error:
        if result['status'] != 'completed':
            result['status']='blocked'
        blockers.append(f'{type(error).__name__}: {error}')
    finally:
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
