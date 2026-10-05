"""Issue214: original per-visit advancement and imported chain audit.
This does not supply or claim a native wall-clock frequency.
"""
import hashlib, json, struct, subprocess, sys
from pathlib import Path
ROOT = Path(__file__).resolve().parents[4]
sys.path.insert(0, str(ROOT / 'scripts'))
from decomp import native_cpu
from unicorn.x86_const import UC_X86_REG_ESP, UC_X86_REG_EIP
import unicorn

exe, output = Path(sys.argv[1]), Path(sys.argv[2])
cpu, identity = native_cpu(exe)
rules = json.loads((ROOT/'app/original-rules.json').read_text())
units = json.loads((ROOT/'app/original-units.json').read_text())
starts = list(struct.iter_unpack('<HH', (exe.parent/'data/vstart-0.ani').read_bytes()))
frames = list(struct.iter_unpack('<HBBBBH', (exe.parent/'data/vfra-0.ani').read_bytes()))
chains = []
for first, mirror in starts:
    current, chain = first, []
    while current and current not in chain:
        chain.append(current)
        current = frames[current][-1]
    assert current in (0, first)
    chains.append(chain)
assert units['frameCounts'] == [len(c) & 255 for c in chains]
imported = []
for signature, animations in units['animations'].items():
    for name, directions in animations.items():
        for direction in directions:
            if 'source' not in direction:
                continue
            source = direction['source']
            actual = [units['frames'][index]['source'] for index in direction['frames']]
            assert actual == chains[source], (signature, name, source)
            imported.append((signature, name, source, len(actual)))
for i, descriptor in enumerate(rules['animationDescriptors']):
    raw = bytes(cpu.mem_read(0x5a6af8+i*11, 11))
    native = dict(hold=struct.unpack('b',raw[1:2])[0], step=struct.unpack('b',raw[3:4])[0], mode=raw[4], person=raw[5], variant=raw[6], palette=raw[7], reset=raw[8], flags=int.from_bytes(raw[9:11],'little'))
    assert native == descriptor, (i, native, descriptor)

cpu.mem_map(0x2000000, 0x20000)
person, counts, stack, stop = 0x2000000, 0x2008000, 0x201d000, 0x201e000
def write(address, fmt, *values): cpu.mem_write(address, struct.pack('<'+fmt,*values))
def read(address, fmt): return struct.unpack('<'+fmt,cpu.mem_read(address,struct.calcsize('<'+fmt)))[0]
write(0x59df44,'I',counts)
for i,chain in enumerate(chains): write(counts+i*6+1,'B',len(chain)&255)
# Disable only the independent footprint consumer through its real level flag.
write(0x895da4,'I',0x10000)
write(0x897981,'I',0)
fields={'object':(0x33,'H'),'renderFlags':(0x35,'H'),'f1':(0x37,'h'),'f2':(0x39,'B'),'draw':(0x3a,'B'),'stamp':(0x18,'I'),'flags3':(0x14,'I'),'morph':(0x3b,'B'),'palette':(0x3c,'B'),'morphTimer':(0x72,'h'),'morphFrames':(0x71,'B')}
cases=[]
for name,draw,obj in [('brave walk',14,40),('brave idle',14,48),('warrior idle',15,48),('firewarrior walk',18,40),('shaman idle',14,424),('shaman walk',14,616),('hut smoke',40,1385),('birth',41,1441),('hit',46,1294)]:
    state={key:0 for key in fields}
    state.update(object=obj,draw=draw)
    cpu.mem_write(person, bytes(256))
    for key,(offset,fmt) in fields.items():write(person+offset,fmt,state[key])
    rows=[]
    for visit in range(48):
        write(stack,'II',stop,person)
        cpu.reg_write(UC_X86_REG_ESP,stack)
        cpu.emu_start(0x4ee7b0,stop,timeout=100000,count=10000)
        assert cpu.reg_read(UC_X86_REG_EIP)==stop
        rows.append({key:read(person+offset,fmt) for key,(offset,fmt) in fields.items()})
    cases.append(dict(name=name,initial=state,native=rows))
js='''import {stepObjectAnimation} from './app/animation.ts'; let input='';for await(const chunk of process.stdin)input+=chunk; const {cases,frameCounts}=JSON.parse(input);console.log(JSON.stringify(cases.map(c=>{const p={...c.initial};return Array.from({length:48},()=>{stepObjectAnimation(p,{counter:0,levelFlags:0,levelFlags2:0x10000},{frameCounts,modelFrames:[],morphDurations:[]},()=>{throw Error('unexpected footprint')});return {...p}})})));'''
result=subprocess.run(['node','--input-type=module','-e',js],input=json.dumps(dict(cases=cases,frameCounts=units['frameCounts'])),capture_output=True,text=True,cwd=ROOT)
assert result.returncode==0,result.stderr
actual=json.loads(result.stdout)
for case,rows in zip(cases,actual):assert case['native']==rows,case['name']
fingerprint=lambda path:hashlib.sha256(path.read_bytes()).hexdigest()
report=dict(status='passed',sourceCommit=subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip(),executable=identity,unicorn=unicorn.__version__,probeSha256=fingerprint(Path(__file__)),inputs={str(p.relative_to(exe.parent)):fingerprint(p) for p in [exe.parent/'data/vstart-0.ani',exe.parent/'data/vfra-0.ani']},sourceHashes={str(p.relative_to(ROOT)):fingerprint(p) for p in [ROOT/'app/animation.ts',ROOT/'app/original-rules.json',ROOT/'app/original-units.json',ROOT/'scripts/decomp.py']},descriptorCount=len(rules['animationDescriptors']),nativeChains=len(chains),importedDirections=len(imported),cases=cases,limits='Isolated native 004ee7b0 per-visit equivalence and exact imported VSTART/VFRA chain retention. No native wall-time, scheduler, original OS, native pixels, or browser observation. No callees intercepted; footprint branch disabled by original flag. Loaded frame-count boundary supplied from source chains.')
output.write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps({key:report[key] for key in ['status','sourceCommit','descriptorCount','nativeChains','importedDirections','limits']}))
