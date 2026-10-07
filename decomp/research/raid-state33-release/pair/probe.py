"""One native state33 visit and one frozen port visit; default validates data only."""
from pathlib import Path
import hashlib
import json
import os
import struct
import subprocess
import sys

ROOT = Path.cwd()
PACKET = ROOT / 'decomp/research/raid-state33-release/pair'
sha = lambda data: hashlib.sha256(data).hexdigest()
def write_json(path, value):
    data = json.dumps(value, indent=2) + '\n'
    assert len(data.encode()) <= 3 * 1024 * 1024, 'Bound each proof artifact'
    path.write_text(data)
def git(*args):
    return subprocess.check_output(['git', *args], cwd=ROOT, text=True).strip()
def pe_bytes(blob, address, size):
    pe = struct.unpack_from('<I', blob, 60)[0]
    count = struct.unpack_from('<H', blob, pe + 6)[0]
    optional = struct.unpack_from('<H', blob, pe + 20)[0]
    base = struct.unpack_from('<I', blob, pe + 52)[0]
    for index in range(count):
        _, _, va, length, offset = struct.unpack_from('<8sIIII', blob, pe + 24 + optional + index * 40)
        if va <= address - base and address - base + size <= va + length:
            start = offset + address - base - va
            return blob[start:start + size]
    raise ValueError(f'Unbacked executable range {address:x}+{size}')

def preflight(manifest_sha, head):
    raw = (PACKET / 'launch-manifest.json').read_bytes()
    assert sha(raw) == manifest_sha
    manifest = json.loads(raw)
    assert git('rev-parse', 'HEAD') == head and not git('status', '--porcelain')
    assert git('rev-parse', 'HEAD:app') == manifest['runtimeAppTree']
    assert not git('diff', manifest['runtimeHead'], '--', 'app', 'tests/mission2-raid.test.mjs')
    for item in manifest['files']:
        assert sha((ROOT / item['path']).read_bytes()) == item['sha256'], item['path']
    for item in manifest['tools']:
        assert sha(Path(item['path']).read_bytes()) == item['sha256'], item['path']
    f = json.loads((PACKET / 'fixture.json').read_text())
    raw = json.loads((PACKET / 'raw-input.json').read_text())
    capture = ROOT / 'decomp/research/raid-state33-release/captured-3227/snapshot.bin'
    assert sha(capture.read_bytes()) == f['captureSha256'] == raw['captureSha256']
    executable = Path(manifest['executable'])
    blob = executable.read_bytes()
    assert sha(blob) == f['executableSha256']
    for item in f['sourceData']:
        assert sha((executable.parent / item['path']).read_bytes()) == item['sha256']
    for item in f['regions']:
        for name, expected in [('path','sha256'),('predictedPath','predictedSha256')]:
            data = (PACKET / item[name]).read_bytes()
            assert len(data) == item['bytes'] and sha(data) == item[expected]
    for r in f['abi']['codeRanges']:
        assert sha(pe_bytes(blob,r['start'],r['stopExclusive']-r['start'])) == r['sha256']
    for r in f['abi']['staticRanges']:
        assert sha(pe_bytes(blob,r['address'],r['size'])) == r['sha256']
    for index, p in enumerate(f['people']):
        data=(PACKET/f"person{p['id']}-input.bin").read_bytes()
        person=raw['people'][index]['person']
        assert raw['people'][index]['nativeFlags7f']=={'present':False}
        assert person['computerAssignment']==0 and data[0xaf]==2 and data[0x7f]==0
        for name,(offset,form) in f['fields'].items():
            assert struct.unpack_from('<'+form,data,offset)[0] == (2 if name=='computerAssignment' else person[name]),name
        assert list(struct.unpack_from('<8H',data,0x8b))==person['commands']
        assert struct.unpack_from('<I',data,8)[0] == (f['people'][1]['address'] if index==0 else 0)
    pool=b''.join(struct.pack('<BB4H',*[r[k] for k in ['model','flags','references','object','a','b']]) for r in raw['pool']['records'])
    assert pool==(PACKET/'orders-input.bin').read_bytes() and len(pool)==8000
    assert (PACKET/'pool-counters-input.bin').read_bytes()==struct.pack('<HH',raw['pool']['cursor'],raw['pool']['active'])
    assert raw['cursor']==2 and f['supplied']['portCursor']==1 and f['supplied']['portTurn']==3227
    assert f['allowlist']['interceptions']==[] and f['limits']['retry'] is False
    return manifest, f, executable

def native_once(f, executable, output, tools):
    # The only original-code execution entry; unreachable in preflight mode.
    import unicorn
    from unicorn import x86_const as x86
    from unicorn.unicorn_py3.unicorn import uclib
    assert unicorn.__version__==tools['unicornVersion']
    assert Path(unicorn.__file__).resolve()==Path(tools['unicornModule']).resolve()
    assert Path(uclib._name).resolve()==Path(tools['unicornLibrary']).resolve()
    sys.path.insert(0,str(ROOT/'scripts'))
    from decomp import native_cpu
    cpu, identity=native_cpu(executable)
    abi=f['abi'];stack,stop=abi['stack'],abi['stop']
    cpu.mem_map(abi['scratchAddress'],abi['scratchBytes'])
    for r in f['regions']:cpu.mem_write(r['address'],(PACKET/r['path']).read_bytes())
    cpu.mem_write(stack-4096,bytes([0xa5])*4108)
    cpu.mem_write(stack,struct.pack('<III',stop,*abi['arguments']))
    for name,value in abi['initialRegisters'].items():cpu.reg_write(getattr(x86,'UC_X86_REG_'+name),value)
    cpu.reg_write(x86.UC_X86_REG_ESP,stack)
    def read(address, form):return struct.unpack('<'+form,cpu.mem_read(address,struct.calcsize('<'+form)))[0]
    def snapshot():return {r['name']:bytes(cpu.mem_read(r['address'],r['bytes'])).hex() for r in f['regions']}
    result=dict(kind='One composed original phase6 release on explicitly supplied input',
                identity=identity,interceptions=[],instructionCount=0,calls=[],memory=[],before=snapshot())
    frames=[]; functions={row['entry']:row for row in abi['functions']}
    def returned(address):
        frame=frames.pop()
        assert cpu.reg_read(x86.UC_X86_REG_ESP)==frame['sp']+4,'cdecl stack drift'
        eax=cpu.reg_read(x86.UC_X86_REG_EAX);bits=frame['function']['returnBits']
        result['calls'].append(dict(phase='return',entry=frame['function']['entry'],pc=address,
                                    rawEax=eax,value=(eax&((1<<bits)-1)) if bits else None))
    def code(machine,address,size,_):
        result['instructionCount']+=1
        assert any(r['start']<=address and address+size<=r['stopExclusive'] for r in abi['codeRanges']),f'Unexpected code {address:x}'
        if frames and frames[-1]['return']==address:returned(address)
        if address in functions:
            fn=functions[address];sp=machine.reg_read(x86.UC_X86_REG_ESP)
            args=[read(sp+4+n*4,'I') for n in range(fn['argumentSlots'])]
            frames.append(dict(function=fn,sp=sp,returnAddress=read(sp,'I'),args=args))
            frames[-1]['return']=frames[-1]['returnAddress']
            result['calls'].append(dict(phase='enter',entry=address,sp=sp,args=args))
    def memory(machine,access,address,size,value,_):
        kind='write' if access==unicorn.UC_MEM_WRITE else 'read'
        allowed=all(any(r['address']<=byte<r['address']+r['size'] for r in f['allowlist'][kind]) for byte in range(address,address+size))
        pc=machine.reg_read(x86.UC_X86_REG_EIP)
        flag=f['allowlist']['flags7f']
        if address<=flag['address']<address+size:
            allowed=allowed and address==flag['address'] and size==1 and pc==flag['pc']
        row=dict(kind=kind,pc=pc,address=address,size=size,allowed=allowed,beforeHex=bytes(machine.mem_read(address,size)).hex())
        if kind=='write':row['valueHex']=(value&((1<<(size*8))-1)).to_bytes(size,'little').hex()
        result['memory'].append(row)
        assert allowed,f'Unexpected {kind} {address:x}+{size} at{pc:x}'
    def invalid(machine,access,address,size,value,_):
        result['invalidMemory']=dict(access=access,address=address,size=size)
        return False
    cpu.hook_add(unicorn.UC_HOOK_CODE,code)
    cpu.hook_add(unicorn.UC_HOOK_MEM_READ|unicorn.UC_HOOK_MEM_WRITE,memory)
    cpu.hook_add(unicorn.UC_HOOK_MEM_INVALID,invalid)
    write_json(output/'native-before.json',result['before'])
    try:
        cpu.emu_start(abi['entry'],stop,timeout=f['limits']['nativeMicroseconds'],count=f['limits']['nativeInstructions'])
        assert cpu.reg_read(x86.UC_X86_REG_EIP)==stop,'Native bound or incomplete return'
        assert len(frames)==1 and frames[0]['return']==stop
        returned(stop)
        for name in ['EBX','ESI','EDI','EBP']:
            assert cpu.reg_read(getattr(x86,'UC_X86_REG_'+name))==abi['initialRegisters'][name],name
        result['status']='returned'
    except BaseException as error:
        result.update(status='failed',error=f'{type(error).__name__}: {error}')
        raise
    finally:
        result['after']=snapshot()
        write_json(output/'native.json',result)
    return result

def verify_native(f, result):
    entered=[r for r in result['calls'] if r['phase']=='enter']
    returned=[r for r in result['calls'] if r['phase']=='return']
    assert [r['entry'] for r in entered]==f['predicted']['entrySequence']
    assert len(entered)==len(returned)
    assert entered[0]['args']==[f['tribe'],1]
    for address,values in [(0x462750,[1]),(0x4f2460,[1,1,1,1]),(0x4f39f0,[1,0]),(0x4da1d0,[0])]:
        assert [r['value'] for r in returned if r['entry']==address]==values,hex(address)
    p=f['people'][0]['address'];p11=f['people'][1]['address'];a=f['abi']
    arguments={0x4d14f0:[[f['tribe'],f['task'],1,a['stack']-0x28,a['stack']-0x50,23,1]],
               0x4f2460:[[p,2],[p11,2],[p,2],[p11,2]],0x4f39f0:[[p],[p11]],
               0x4f2440:[[p,0]],0x4364d0:[[p,1]],0x4d4040:[[p,15]],0x4ee700:[[p+0x33,14,48]]}
    for address,expected in arguments.items():
        assert [r['args'] for r in entered if r['entry']==address]==expected,hex(address)
    for r in f['regions']:
        assert bytes.fromhex(result['before'][r['name']])==(PACKET/r['path']).read_bytes()
        assert bytes.fromhex(result['after'][r['name']])==(PACKET/r['predictedPath']).read_bytes(),r['name']
    accesses=[r for r in result['memory'] if r['address']<=p+0x7f<r['address']+r['size']]
    assert [(r['kind'],r['pc'],r['size']) for r in accesses]==[('read',0x4f2448,1),('write',0x4f2448,1)]
    assert accesses[1]['valueHex']=='00'
    elapsed=[r for r in result['memory'] if r['kind']=='write' and r['address']==f['task']+4]
    assert [int.from_bytes(bytes.fromhex(r['valueHex']),'little') for r in elapsed]==[360]

def main():
    assert sys.flags.ignore_environment and sys.flags.no_user_site and not sys.flags.optimize
    assert len(sys.argv)==4,'mode manifestSha reviewedSourceHead'
    mode,manifest_sha,head=sys.argv[1:]
    assert mode in ('--source-preflight','--execute-pair')
    manifest,f,executable=preflight(manifest_sha,head)
    if mode=='--source-preflight':
        print('PASS: native input/source guards; no Unicorn CPU or application instantiated')
        return
    assert os.environ.get('PND_STATE33_PAIR')=='approved-one-pair'
    assert Path(sys.executable).resolve()==Path(manifest['python']).resolve()
    assert os.sched_getaffinity(0)=={int(os.environ['PND_STATE33_PAIR_CPU'])}
    output=ROOT/manifest['output']
    assert output.is_dir() and not (output/'native.json').exists()
    receipt=dict(status='running',sourceHead=head,manifestSha256=manifest_sha,nativeInvocations=0,portInvocations=0)
    write_json(output/'result.json',receipt)
    try:
        receipt['nativeInvocations']=1;write_json(output/'result.json',receipt)
        native=native_once(f,executable,output,manifest['toolIdentity'])
        verify_native(f,native)
        receipt['nativeStatus']='predicted-release-confirmed';write_json(output/'result.json',receipt)
        command=[manifest['node'],'--permission','--allow-inspector','--allow-fs-read='+str(ROOT),str(PACKET/'port.mjs')]
        receipt.update(portInvocations=1,portCommand=command);write_json(output/'result.json',receipt)
        try:
            port=subprocess.run(command,cwd=ROOT,capture_output=True,timeout=f['limits']['portSeconds'])
        except subprocess.TimeoutExpired as error:
            (output/'port.stdout').write_bytes(error.stdout or b'');(output/'port.stderr').write_bytes(error.stderr or b'')
            raise
        (output/'port.stdout').write_bytes(port.stdout);(output/'port.stderr').write_bytes(port.stderr)
        assert port.returncode==0,f'Port comparator exit{port.returncode}'
        data=json.loads(port.stdout)
        assert data['semanticReturn']=='undefined' and all(c['actual']==c['expected'] for c in data['calls'])
        comparison=dict(status='expected-state33-release-gap-confirmed',nativeSemanticReturn='void',portSemanticReturn='undefined',
            native=dict(member10State=10,nativeAssignment=0,command131References=0,poolActive=2,anchor=[38656,28416],elapsed=360,phase=6),
            port=dict(member10State=33,observedAssignment=0,taskMembers=[10,11],command131References=1,poolActive=3,anchor=[34048,30976],elapsed=360,phase=6),
            limits='Conditional two-member constructor/admission projection; no native mission history, scheduler or maintained-test completion claim')
        write_json(output/'comparison.json',comparison)
        preflight(manifest_sha,head)
        receipt['status']=comparison['status']
    except BaseException as error:
        receipt.update(status='failed',error=f'{type(error).__name__}: {error}')
        raise
    finally:write_json(output/'result.json',receipt)
    print(json.dumps(receipt))

if __name__=='__main__':main()
