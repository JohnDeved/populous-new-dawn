"""Fixed supplied-state acquisition-to-terminal turning comparison. Preparation is not execution approval.

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
ORDER = 0x938934
COSMETIC, SIMULATION, SERIAL = 0x89bc72, 0x89d178, 0x897981
RANGES = [(0x43a4d0,0x43abd7), (0x43abf0,0x43aeb8),
    (0x586074,0x5861b4), (0x4da170,0x4da1d0),
    (0x4ee7b0,0x4ee7f8), (0x4ee85e,0x4ee8ed), (0x4ee9cb,0x4ee9cf)]
CALL_EDGES = {0x43ab52:0x43abf0, 0x43ab62:0x4da170, 0x43ae39:0x586074}
ENTRIES = {0x43abf0:'acquisition',0x586074:'angle',0x4da170:'reveal'}
PHASES = ['beforeController','afterController','beforeUpdater','afterUpdater']
FIXED_CASE_SHA = 'cb82a929da6f450f8232f24a1d8ffde71e5038508d5a894592267df4b5c9a704'
ORDER_HEX = '110001000000002b009f'
LIMITS = {'cases':1,'controllerCalls':3,'updaterCalls':3,'actualAcquisitionCalls':2,
    'instructionsPerCall':100000,'secondsPerCall':1,'totalNativeSeconds':10,
    'portSeconds':15,'cpu':4,'outerSeconds':27,'cleanupSeconds':3}


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


def pack_record(fields, commands, next_id, previous_id):
    if set(fields) != set(FIELDS) or len(commands) != 8:
        raise Blocked('Missing or additional mapped field/command slot')
    raw = bytearray(256)
    for key,(offset,fmt) in FIELDS.items():
        struct.pack_into('<'+fmt,raw,offset,fields[key])
    struct.pack_into('<8H',raw,0x8b,*commands)
    struct.pack_into('<HH',raw,0x20,next_id,previous_id)
    return bytes(raw)


def fixed_case(raw):
    if sha(raw) != FIXED_CASE_SHA:
        raise Blocked('Fixed input drift: extra cases or changed supplies require review')
    case=json.loads(raw)
    if (case['id']!='owned5-produced-bit2-terminal-mode0' or case['caseCount']!=1 or
            case['controllerUpdaterPairs']!=3 or len(case['records'])!=6 or
            case['explicitSupplies']['counter']['nextControllerCounters']!=[14,15,16] or
            case['nextWorldSerials']!=[4244,4245,4246]):
        raise Blocked('Fixed case/call/schedule cap')
    for index,record in enumerate(case['records']):
        raw_record=pack_record(record['fields'],record['commands'],record['cellNext'],record['cellPrevious'])
        if (record['id']!=3164+index or int(record['address'],16)!=P+index*256 or
                raw_record.hex()!=record['raw256Hex'] or sha(raw_record)!=record['raw256Sha256']):
            raise Blocked('Six-record identity/raw256 drift')
    if (case['orderRawHex']!=ORDER_HEX or int(case['orderAddress'],16)!=ORDER or
            case['topology']['nullObjectPointer']['value']!=0):
        raise Blocked('Order/null-pointer supply drift')
    return case


def prepared():
    manifest_bytes=(HERE/'preflight.json').read_bytes()
    manifest=json.loads(manifest_bytes)
    if manifest['limits']!=LIMITS:
        raise Blocked('Fixed execution limits drift')
    verification=postflight(manifest,manifest_bytes)
    if verification['status']!='passed':
        raise Blocked('Source/input/tool drift: '+json.dumps(verification))
    if Path(sys.executable).resolve()!=Path(manifest['pythonPath']).resolve():
        raise Blocked('Unbound Python interpreter')
    case=fixed_case((HERE/'proposal/case-input-proposal.json').read_bytes())
    starts=list(struct.iter_unpack('<HH',Path(manifest['gameRoot'],'data/vstart-0.ani').read_bytes()))
    frames=list(struct.iter_unpack('<HBBBBH',Path(manifest['gameRoot'],'data/vfra-0.ani').read_bytes()))
    counts=[]
    for first,_mirror in starts:
        frame,seen=first,set()
        while frame and frame not in seen:
            if frame>=len(frames): raise Blocked('Invalid VFRA chain')
            seen.add(frame);frame=frames[frame][-1]
        if frame not in [0,first]: raise Blocked('Unexpected VFRA cycle')
        counts.append(len(seen)&255)
    if counts!=json.loads((ROOT/'app/original-units.json').read_text())['frameCounts'] or counts[168]!=6:
        raise Blocked('Loaded animation counts drift')
    table=bytearray(len(counts)*6)
    for index,count in enumerate(counts): table[index*6+1]=count
    if sha(table)!=manifest['suppliedFrameCountTableSha256']:
        raise Blocked('Six-byte-stride frame count table drift')
    from capstone import Cs,CS_ARCH_X86,CS_MODE_32
    disassembler=Cs(CS_ARCH_X86,CS_MODE_32)
    exe=Path(manifest['executable']).read_bytes();instructions={}
    for first,end in RANGES:
        raw=read_va(exe,first,end-first)
        if sha(raw)!=manifest['instructionRanges'][f'{first:08x}-{end:08x}']:
            raise Blocked('Instruction range drift')
        decoded=list(disassembler.disasm(raw,first))
        if not decoded or decoded[-1].address+decoded[-1].size!=end:
            raise Blocked('Incomplete instruction boundary')
        for instruction in decoded:
            instructions[instruction.address]=(instruction.mnemonic,instruction.op_str)
    for table in manifest['tables']:
        raw=read_va(exe,int(table['address'],16),len(bytes.fromhex(table['bytes'])))
        if raw.hex()!=table['bytes'] or sha(raw)!=table['sha256']:
            raise Blocked('Canonical data table drift: '+table['name'])
    rules=json.loads((ROOT/'app/original-rules.json').read_text())
    if (rules['personModels'][2]['flags']!=0x08af or rules['personModels'][2]['physics']!=2 or
            rules['personStateFlags'][23]!=0x2164 or rules['animationDescriptors'][14]['mode']!=2):
        raise Blocked('Imported model/state/updater table drift')
    return manifest,[case],counts,instructions,rules,manifest_bytes


def covered(address,size,ranges):
    return size>0 and all(any(first<=byte<end for first,end in ranges)
                          for byte in range(address,address+size))


def permitted_write(address,size,phase):
    if covered(address,size,[(STACK-0x2000,STACK+0x1000)]): return True
    names=['f1','f2'] if phase=='updater' else ['flags2','timer','substate','assignment','statusFlags']
    if phase not in ['controller','updater']: return False
    return covered(address,size,[(P+FIELDS[n][0],P+FIELDS[n][0]+struct.calcsize('<'+FIELDS[n][1])) for n in names])


def supplied_topology(case):
    top=case['topology']
    return {'objectPointers':[{'id':p['id'],'slotAddress':int(p['slotAddress'],16),
                'address':int(p['personAddress'],16)} for p in top['objectPointers']],
        'cellHeads':[{'cellIndex':i,'address':0x8a03e4+i*16+6,
            'headId':top['headId'] if i==top['cellIndex'] else 0} for i in top['scannedCells']],
        'nullObjectPointer':{'slotAddress':0x890390,'value':0}}


def allowed_reads(case,manifest):
    ranges=[(STACK-0x2000,STACK+0x1000),(ORDER,ORDER+10),
        (SERIAL,SERIAL+4),(0x59df44,0x59df48),(COUNTS+168*6+1,COUNTS+168*6+2)]
    # Canonical chosen model/state/angle/updater and indirect-jump bytes only.
    ranges += [(int(t['address'],16),int(t['address'],16)+len(bytes.fromhex(t['bytes']))) for t in manifest['tables']]
    for record in case['records']:
        base=int(record['address'],16)
        ranges += [(base+off,base+off+struct.calcsize('<'+fmt)) for key,(off,fmt) in FIELDS.items() if key!='maxLife']
        ranges += [(base+0x20,base+0x24),(base+0x8b,base+0x9b)]
    topology=supplied_topology(case)
    ranges += [(p['slotAddress'],p['slotAddress']+4) for p in topology['objectPointers']]
    ranges += [(h['address'],h['address']+2) for h in topology['cellHeads']]
    ranges += [(0x890390,0x890394)]
    return ranges


def check_state(state,case,implementation):
    if len(state['records'])!=6 or state['topology']!=supplied_topology(case):
        raise Blocked('Record/topology observation drift')
    for index,(actual,initial) in enumerate(zip(state['records'],case['records'],strict=True)):
        expected_raw=pack_record(actual['fields'],actual['commands'],actual['cellNext'],actual['cellPrevious']).hex()
        if (expected_raw!=actual['raw'] or actual['id']!=initial['id'] or
                actual['address']!=int(initial['address'],16)):
            raise Blocked('Unmapped byte or raw256/owner observation drift')
        if index and actual['raw']!=initial['raw256Hex']:
            raise Blocked('Unexpected listener mutation')
    first=state['records'][0]
    if (state['raw']!=first['raw'] or state['fields']!=first['fields'] or
            state['commands']!=first['commands'] or state['commands']!=case['records'][0]['commands'] or
            state['order']!=case['order'] or state['orderRaw']!=ORDER_HEX or
            state['owner']!={'personAddress':P,'personId':3164,'orderId':26,'orderAddress':ORDER}):
        raise Blocked('Preacher/order/owner/queue observation drift')
    allowed={'flags2','timer','substate','assignment','statusFlags','counter','stamp','f1','f2'}
    if implementation=='port': allowed.add('animationMode')
    for key,value in case['records'][0]['fields'].items():
        if key not in allowed and state['fields'][key]!=value:
            raise Blocked('Unowned Preacher field mutation: '+key)
    if state['cosmeticRandom']!=case['cosmeticRandom']:
        raise Blocked('Unexpected cosmetic RNG mutation')
    if implementation=='native' and state['simulationRandom']!=case['simulationRandom']:
        raise Blocked('Unexpected native simulation RNG mutation')


def boundary_arguments(entry,slots,case):
    if entry==0x43abf0:
        person,radius,out=slots
        if person!=P or radius!=3 or not STACK-0x2000<=out<=STACK-4:
            raise Blocked('Acquisition owner/radius/output drift')
        return [person,radius,out]
    if entry==0x586074:
        dx,dy=slots
        if [dx,dy]!=[16,0]: raise Blocked('Fixed cdecl angle arguments drift')
        return [dx,dy]
    if entry==0x4da170:
        if slots!=[P]: raise Blocked('Reveal owner drift')
        return slots
    raise Blocked('Unlisted native consumer')


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


def run_native(manifest,cases,counts,instructions,rules,result,output):
    # No Unicorn import or machine-code execution occurs through --validate.
    from unicorn import UC_HOOK_CODE,UC_HOOK_MEM_WRITE,UC_HOOK_MEM_READ
    from unicorn.x86_const import (UC_X86_REG_ESP,UC_X86_REG_EIP,UC_X86_REG_EAX,
        UC_X86_REG_EBX,UC_X86_REG_ECX,UC_X86_REG_EDX,UC_X86_REG_ESI,
        UC_X86_REG_EDI,UC_X86_REG_EBP,UC_X86_REG_EFLAGS)
    sys.path.insert(0,str(ROOT/'scripts'))
    from decomp import native_cpu
    deadline=time.monotonic()+LIMITS['totalNativeSeconds']
    cpu,identity=native_cpu(Path(manifest['executable']))
    cpu.mem_map(P,0x40000)
    scenario=cases[0];read_ranges=allowed_reads(scenario,manifest)
    current={'visit':0,'phase':'initial','controllerReturn':None,'instructions':0}
    events=[];pending=[]
    result.update(nativeIdentity=identity,calls=[],reads=[],writes=[],setup=[],schedulerSupplies=[],
        instructionTrace=[],boundaryCounts={kind:0 for kind in ENTRIES.values()})

    def write(address,fmt,*values): cpu.mem_write(address,struct.pack('<'+fmt,*values))
    def read(address,fmt): return struct.unpack('<'+fmt,cpu.mem_read(address,struct.calcsize('<'+fmt)))[0]
    def setup(address,raw,label):
        result['setup'].append({'address':f'{address:08x}','bytes':raw.hex(),'label':label})
        cpu.mem_write(address,raw)

    def snapshot():
        records=[]
        for supplied in scenario['records']:
            address=int(supplied['address'],16)
            values={key:read(address+off,fmt) for key,(off,fmt) in FIELDS.items()}
            records.append({'id':values['id'],'address':address,'raw':bytes(cpu.mem_read(address,256)).hex(),
                'fields':values,'commands':[read(address+0x8b+slot*2,'H') for slot in range(8)],
                'cellNext':read(address+0x20,'H'),'cellPrevious':read(address+0x22,'H')})
        first=records[0];f=first['fields']
        candidates=[i for i,pair in enumerate(rules['animationObjects']) if pair==[f['object'],f['draw']]]
        topology=supplied_topology(scenario)
        for pointer in topology['objectPointers']: pointer['address']=read(pointer['slotAddress'],'I')
        for head in topology['cellHeads']: head['headId']=read(head['address'],'H')
        topology['nullObjectPointer']['value']=read(0x890390,'I')
        raw_order=bytes(cpu.mem_read(ORDER,10))
        return {'raw':first['raw'],'fields':f,'objectIdCandidates':candidates,
            'sourceCandidates':candidates,'records':records,'topology':topology,
            'commands':first['commands'],'order':{'id':26,**dict(zip(
                ['model','flags','references','object','a','b'],struct.unpack('<BBHHHH',raw_order)))},
            'orderRaw':raw_order.hex(),'owner':{'personAddress':P,'personId':f['id'],
                'orderId':first['commands'][0],'orderAddress':ORDER},
            'worldAnimationCounter':read(SERIAL,'I'),'controllerReturn':current['controllerReturn'],
            'cosmeticRandom':read(COSMETIC,'I'),'simulationRandom':read(SIMULATION,'I')}

    def event(kind,args,extra):
        events.append({'visit':current['visit'],'phase':current['phase'],'kind':kind,
            'args':args,'boundary':'actual-native','state':snapshot(),**extra})

    def code(_cpu,address,size,_user):
        if time.monotonic()>=deadline: raise Blocked('10-second total native deadline')
        current['instructions']+=1
        if current['instructions']>100000: raise Blocked('100000-instruction call budget')
        sp=cpu.reg_read(UC_X86_REG_ESP)
        if not STACK-0x2000<=sp<=STACK: raise Blocked('Stack escaped bounded cdecl window')
        result['instructionTrace'].append({'visit':current['visit'],'phase':current['phase'],
            'address':f'{address:08x}','size':size})
        if pending and address==pending[-1]['returnAddress']:
            finished=pending.pop();eax=cpu.reg_read(UC_X86_REG_EAX)
            if sp!=finished['entryStack']+4: raise Blocked('Unexpected nested cdecl cleanup')
            extra={'rawEAX':eax,'returnAddress':f'{address:08x}',
                'rawStackArgumentWords':finished['slots']}
            if finished['kind']=='acquisition':
                extra.update(returnValue=eax,angleOutput=read(finished['args'][2],'I'))
            elif finished['kind']=='angle': extra['returnValue']=eax&0xffff
            event(finished['kind']+'-return',finished['args'],extra)
            if finished['kind']=='acquisition' and (eax!=5 or extra['angleOutput']!=512):
                raise Blocked('Actual acquisition count/first-angle prediction rejected')
            if finished['kind']=='angle' and eax&0xffff!=512:
                raise Blocked('Actual cdecl angle prediction rejected')
        if address not in instructions: raise Blocked(f'Unlisted instruction {address:08x}')
        # The selected already-owned Brave path skips every fresh eligibility/init branch.
        if 0x43ad00<=address<0x43adce:
            raise Blocked('Unexpected fresh/alliance/Bloodlust/vehicle/spy path')
        if 0x4da17b<=address<0x4da1ce:
            raise Blocked('Unexpected invisible reveal work')
        if address==0x43ac05 and read(P+0x10,'I')&0x800:
            raise Blocked('Unexpected ghost acquisition path')
        mnemonic,operands=instructions[address]
        if mnemonic=='call':
            try: target=int(operands,16)
            except ValueError: raise Blocked(f'Unlisted indirect call {address:08x}')
            if CALL_EDGES.get(address)!=target: raise Blocked(f'Unlisted call {address:08x}->{target:08x}')
        if address in ENTRIES:
            if current['phase']!='controller' or current['visit'] not in [1,3]:
                raise Blocked('Unexpected consumer phase/visit')
            kind=ENTRIES[address]
            slots=[read(sp+i*4,'I') for i in range(1,{0x43abf0:3,0x586074:2,0x4da170:1}[address]+1)]
            args=boundary_arguments(address,slots,scenario)
            result['boundaryCounts'][kind]+=1
            if result['boundaryCounts'][kind]>2: raise Blocked('Two-call consumer cap')
            # No boundary substitutes, register patches, or return interception.
            entry={'kind':kind,'args':args,'slots':slots,'returnAddress':read(sp,'I'),'entryStack':sp}
            pending.append(entry)
            extra={'rawStackArgumentWords':slots,'returnAddress':f"{entry['returnAddress']:08x}"}
            if kind=='acquisition': extra['angleOutputBefore']=read(args[2],'I')
            event(kind+'-entry',args,extra)

    def memory_write(_cpu,_access,address,size,value,_user):
        result['writes'].append({'visit':current['visit'],'phase':current['phase'],
            'address':f'{address:08x}','size':size,'value':value,
            'beforeHex':bytes(cpu.mem_read(address,size)).hex(),
            'eip':f'{cpu.reg_read(UC_X86_REG_EIP):08x}'})
        if not permitted_write(address,size,current['phase']):
            raise Blocked(f'Unlisted native write {address:08x}+{size}')

    def memory_read(_cpu,_access,address,size,_value,_user):
        result['reads'].append({'visit':current['visit'],'phase':current['phase'],
            'address':f'{address:08x}','size':size,'bytes':bytes(cpu.mem_read(address,size)).hex(),
            'eip':f'{cpu.reg_read(UC_X86_REG_EIP):08x}'})
        if not covered(address,size,read_ranges):
            raise Blocked(f'Unlisted native read {address:08x}+{size}; unobserved bytes remain supplied')

    def call(address,*args):
        current['instructions']=0
        if pending: raise Blocked('Unreturned previous native consumer')
        if time.monotonic()>=deadline: raise Blocked('10-second native deadline')
        cpu.mem_write(STACK-0x2000,bytes(0x3000))
        write(STACK,'I'*(len(args)+1),STOP,*args)
        for register in [UC_X86_REG_EAX,UC_X86_REG_EBX,UC_X86_REG_ECX,UC_X86_REG_EDX,
                         UC_X86_REG_ESI,UC_X86_REG_EDI,UC_X86_REG_EBP]: cpu.reg_write(register,0)
        cpu.reg_write(UC_X86_REG_EFLAGS,2);cpu.reg_write(UC_X86_REG_ESP,STACK)
        receipt={'entry':f'{address:08x}','args':list(args),'visit':current['visit'],
            'phase':current['phase'],'status':'running','callingConvention':'cdecl; ECX=0',
            'traceStart':len(result['instructionTrace'])}
        result['calls'].append(receipt);start=time.monotonic()
        try:
            cpu.emu_start(address,STOP,timeout=1_000_000,count=100_000)
            if cpu.reg_read(UC_X86_REG_EIP)!=STOP or cpu.reg_read(UC_X86_REG_ESP)!=STACK+4 or pending:
                raise Blocked('Missing sentinel return, unexpected cdecl cleanup, or unreturned consumer')
            if time.monotonic()-start>1 or time.monotonic()>=deadline:
                raise Blocked('Native call/total wall-time budget')
            receipt.update(status='returned',rawEAX=cpu.reg_read(UC_X86_REG_EAX))
            receipt['returnAL']=receipt['rawEAX']&255
            return receipt['returnAL']
        except Exception:
            receipt['status']='blocked'
            result['interruptedCall']={**receipt,'eip':f'{cpu.reg_read(UC_X86_REG_EIP):08x}',
                'state':snapshot(),'events':list(events),'pendingConsumers':list(pending)}
            raise
        finally:
            receipt.update(instructions=current['instructions'],seconds=time.monotonic()-start,
                traceEnd=len(result['instructionTrace']))

    table=bytearray(len(counts)*6)
    for index,count in enumerate(counts): table[index*6+1]=count
    setup(COUNTS,bytes(table),'supplied loaded frame-count table, six-byte stride')
    setup(0x59df44,struct.pack('<I',COUNTS),'supplied frame-count pointer')
    for address in [0x89d17c,0x895da8,0x895da4]: setup(address,bytes(4),'supplied zero game/updater flags')
    for supplied in scenario['records']:
        setup(int(supplied['address'],16),bytes.fromhex(supplied['raw256Hex']),f"fixed raw256 person {supplied['id']}")
    setup(ORDER,bytes.fromhex(ORDER_HEX),'sole order26')
    topology=supplied_topology(scenario)
    for pointer in topology['objectPointers']:
        setup(pointer['slotAddress'],struct.pack('<I',pointer['address']),f"supplied object pointer {pointer['id']}")
    for head in topology['cellHeads']:
        setup(head['address'],struct.pack('<H',head['headId']),f"supplied cell head {head['cellIndex']}")
    setup(0x890390,bytes(4),'explicit null object pointer slot0')
    for address,value,label in [(COSMETIC,scenario['cosmeticRandom'],'cosmetic RNG'),
        (SIMULATION,scenario['simulationRandom'],'simulation RNG'),
        (SERIAL,scenario['initialWorldSerial'],'initial supplied serial')]:
        setup(address,struct.pack('<I',value),label)
    cpu.hook_add(UC_HOOK_CODE,code);cpu.hook_add(UC_HOOK_MEM_WRITE,memory_write);cpu.hook_add(UC_HOOK_MEM_READ,memory_read)
    record={'case':scenario['id'],'initial':snapshot(),'rows':[]};result['cases'].append(record)
    check_state(record['initial'],scenario,'native')
    for visit,counter in enumerate([14,15,16],1):
        if result['completedControllerCalls']>=3 or result['completedUpdaterCalls']>=3:
            raise Blocked('Three controller/updater call cap')
        current.update(visit=visit,phase='before-controller',controllerReturn=None)
        before_counter=read(P+0x2e,'B');before_serial=read(SERIAL,'I')
        if ((before_counter+1)&255)!=counter or before_serial+1!=scenario['nextWorldSerials'][visit-1]:
            raise Blocked('Single increment scheduling contract drift')
        write(P+0x2e,'B',(before_counter+1)&255);write(SERIAL,'I',before_serial+1)
        supply={'visit':visit,'counterBefore':before_counter,'counterAfter':counter,
            'serialBefore':before_serial,'serialAfter':before_serial+1}
        result['schedulerSupplies'].append(supply)
        events.clear()
        row={'case':scenario['id'],'visit':visit,'beforeController':snapshot(),'events':[]};record['rows'].append(row)
        current['phase']='controller';row['result']=call(0x43a4d0,P,ORDER)
        result['completedControllerCalls']+=1;current['controllerReturn']=row['result']
        current['phase']='after-controller';row['afterController']=snapshot()
        supply['stampBefore']=read(P+0x18,'I');write(P+0x18,'I',read(SERIAL,'I'));supply['stampAfter']=read(SERIAL,'I')
        current['phase']='before-updater';row['beforeUpdater']=snapshot()
        current['phase']='updater';row['updaterReturnAL']=call(0x4ee7b0,P)
        result['completedUpdaterCalls']+=1
        current['phase']='after-updater';row['afterUpdater']=snapshot();row['events']=list(events)
        (output/'native.json').write_text(json.dumps(result,indent=2)+'\n')
        for phase in PHASES: check_state(row[phase],scenario,'native')
        for item in events: check_state(item['state'],scenario,'native')
        if row['result']!=0: raise Blocked('Unexpected controller return/release')
    if result['boundaryCounts']!={'acquisition':2,'angle':2,'reveal':2}:
        raise Blocked('Incomplete actual producer/consumer composition')
    result.update(nativeSeconds=LIMITS['totalNativeSeconds']-(deadline-time.monotonic()),status='completed')


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
                    entry['recordRawByteOffsets']=[{'id':nr['id'],'offsets':[i for i,(a,b) in enumerate(zip(bytes.fromhex(nr['raw']),bytes.fromhex(pr['raw']),strict=True)) if a!=b]} for nr,pr in zip(ns['records'],ps['records'],strict=True) if nr['raw']!=pr['raw']]
                    delta['phases'][phase]=entry
            for key in ['result','events']:
                if n[key]!=p[key]:
                    delta[key]={'native':n[key],'port':p[key]}
            if delta['phases'] or 'result' in delta or 'events' in delta:
                out.append(delta)
    return out


def predicted_state(case,visit,phase,implementation):
    p=dict(case['records'][0]['fields'])
    serial=case['initialWorldSerial']+visit
    completed=visit-1 if phase=='beforeController' else visit
    p.update(counter=13+visit,timer=837+completed,assignment=272 if completed==0 else 336,
        statusFlags=2 if completed==0 else 0,substate=4 if completed==3 else 3,
        flags2=case['records'][0]['fields']['flags2'] | (0x40000000 if completed==3 else 0),
        animationMode=2 if implementation=='port' and completed==3 else 0,
        stamp=serial-1 if phase in PHASES[:2] else serial,
        f2=(3+visit-(phase!='afterUpdater'))%6)
    return {'fields':p,'raw':pack_record(p,case['records'][0]['commands'],
        case['records'][0]['cellNext'],case['records'][0]['cellPrevious']).hex(),
        'simulationRandom':1607832750 if implementation=='port' and completed==3 else case['simulationRandom'],
        'cosmeticRandom':case['cosmeticRandom'],'worldAnimationCounter':serial,
        'controllerReturn':None if phase=='beforeController' else 0}


def assess(native,port,case):
    predictions=[]
    for name,result in [('native',native),('port',port)]:
        if (result['status']!='completed' or len(result['cases'])!=1 or
                len(result['cases'][0]['rows'])!=3 or result['completedControllerCalls']!=3 or
                result['completedUpdaterCalls']!=3): raise Blocked('Incomplete fixed case: '+name)
        initial=result['cases'][0]['initial'];check_state(initial,case,name)
        if (initial['raw']!=case['records'][0]['raw256Hex'] or
                initial['simulationRandom']!=case['simulationRandom'] or
                initial['worldAnimationCounter']!=case['initialWorldSerial'] or initial['controllerReturn'] is not None):
            raise Blocked('Initial state supply drift: '+name)
        for visit,row in enumerate(result['cases'][0]['rows'],1):
            if row['visit']!=visit or row['result']!=0: raise Blocked('Visit/controller return drift')
            for phase in PHASES:
                state=row[phase];check_state(state,case,name)
                expected=predicted_state(case,visit,phase,name)
                delta={key:{'predicted':value,'observed':state.get(key)} for key,value in expected.items() if state.get(key)!=value}
                predictions.append({'implementation':name,'visit':visit,'phase':phase,
                    'matchesPrediction':not delta,'differences':delta})
            for event in row['events']: check_state(event['state'],case,name)
    n=native['cases'][0]['rows'];p=port['cases'][0]['rows']
    native_kinds=['acquisition-entry','angle-entry','angle-return','acquisition-return','reveal-entry','reveal-return']
    port_kinds=['acquisition-adapter-before','acquisition-adapter-after']
    event_checks=[]
    for name,rows,kinds in [('native',n,native_kinds),('port',p,port_kinds)]:
        for visit,row in enumerate(rows,1):
            expected=kinds if visit in [1,3] else []
            event_checks.append({'implementation':name,'visit':visit,'expected':expected,
                'observed':[e['kind'] for e in row['events']],
                'matchesPrediction':[e['kind'] for e in row['events']]==expected})
    supported=all(row['matchesPrediction'] for row in predictions+event_checks)
    return {'status':'hypothesis-supported' if supported else 'hypothesis-rejected',
        'phasePredictions':predictions,'eventPredictions':event_checks,
        'nativeFinal':{key:n[-1]['afterUpdater']['fields'][key] for key in ['assignment','animationMode','timer','substate','object','draw','f1','f2']},
        'portFinal':{key:p[-1]['afterUpdater']['fields'][key] for key in ['assignment','animationMode','timer','substate','object','draw','f1','f2']},
        'nativeSimulation':n[-1]['afterUpdater']['simulationRandom'],
        'portSimulation':p[-1]['afterUpdater']['simulationRandom'],
        'nativeProducer':'Actual acquisition over supplied Brave records/topology; angle/reveal actual',
        'portProducer':'Supplied count5/status-clear adapter; production caller remains unverified here',
        'ordinaryFiveListenerHistory':'not-established','renderedImpact':'not-established'}


def main():
    parser=argparse.ArgumentParser(description=__doc__)
    mode=parser.add_mutually_exclusive_group(required=True)
    mode.add_argument('--validate',action='store_true');mode.add_argument('--execute',action='store_true')
    args=parser.parse_args()
    manifest,cases,counts,instructions,rules,manifest_bytes=prepared()
    if args.validate:
        print(json.dumps({'status':'preflight-passed','nativeExecution':'not-run','portExecution':'not-run',
            'cases':1,'controllerCalls':3,'updaterCalls':3,'actualAcquisitionCalls':2,
            'recordSha256':[r['raw256Sha256'] for r in cases[0]['records']],
            'orderAddress':f'{ORDER:08x}','manifestSha256':sha(manifest_bytes)},indent=2))
        return
    if os.sched_getaffinity(0)!={4}: raise Blocked('Execution requires separate grant and exclusive CPU4')
    output=ROOT/manifest['outputDirectory'];output.mkdir(parents=True,exist_ok=False)
    result={'status':'running','scope':manifest['scope'],'cases':[],
        'manifestSha256':sha(manifest_bytes),'completedControllerCalls':0,'completedUpdaterCalls':0}
    (output/'frozen-manifest.json').write_bytes(manifest_bytes)
    (output/'preflight.json').write_text(json.dumps(postflight(manifest,manifest_bytes),indent=2)+'\n')
    (output/'instructions.json').write_text(json.dumps({f'{address:08x}':value for address,value in instructions.items()},indent=2)+'\n')
    blockers=[];summary=None
    def interrupted(signum,_frame): raise Blocked(f'Outer signal {signum}; preserve partial evidence, no retry')
    previous_term=signal.signal(signal.SIGTERM,interrupted);previous_int=signal.signal(signal.SIGINT,interrupted)
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
            retain_port(output,error.stdout,error.stderr,{'status':'timed-out','timeoutSeconds':error.timeout,
                'exitCode':None,'childTermination':'subprocess.run kills direct child and waits before raising'})
            raise Blocked('Port timeout; raw streams retained') from error
        retain_port(output,process.stdout,process.stderr,{'status':'exited','exitCode':process.returncode,'timedOut':False})
        if process.returncode: raise Blocked(f'Port process exit {process.returncode}; raw partial evidence retained')
        port=json.loads(process.stdout)
        inventory=differences(result,port)
        (output/'divergences.json').write_text(json.dumps(inventory,indent=2)+'\n')
        summary=assess(result,port,cases[0])
        summary.update(controllerCalls=3,updaterCalls=3,actualAcquisitionCalls=2,divergentRows=len(inventory),
            manifestSha256=result['manifestSha256'])
    except Exception as error:
        if result['status']!='completed': result['status']='blocked'
        blockers.append(f'{type(error).__name__}: {error}')
    finally:
        signal.signal(signal.SIGTERM,previous_term);signal.signal(signal.SIGINT,previous_int)
        verification=postflight(manifest,manifest_bytes)
        (output/'postflight.json').write_text(json.dumps(verification,indent=2)+'\n')
        result['postflightStatus']=verification['status']
        if verification['status']!='passed': blockers.append('Postflight source/input/tool drift')
        if blockers: result.update(comparisonStatus='blocked',blockers=blockers)
        (output/'native.json').write_text(json.dumps(result,indent=2)+'\n')
    if blockers:
        (output/'blocked.json').write_text(json.dumps({'status':'blocked','reasons':blockers},indent=2)+'\n')
        print('; '.join(blockers),file=sys.stderr);raise SystemExit(2)
    summary['postflightStatus']='passed'
    (output/'summary.json').write_text(json.dumps(summary,indent=2)+'\n');print(json.dumps(summary))


if __name__=='__main__': main()
