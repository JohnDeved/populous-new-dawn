"""Compare complete 004bf630/004bf740 calls, including ring reuse and cell saturation.
Usage: python scripts/check-native-footprints.py EXE [--record]
No native calls intercepted. Texture cache slots are present for every map cell.
"""
import hashlib,json,struct,subprocess,sys
from pathlib import Path
from unicorn.x86_const import UC_X86_REG_ESP,UC_X86_REG_EIP
from decomp import native_cpu
root=Path(__file__).resolve().parents[1]
cpu,identity=native_cpu(Path(sys.argv[1]));cpu.mem_map(0x2000000,0x200000)
marks,cells,cache,indices,person,stack,stop=0x2000000,0x2080000,0x20b0000,0x20d0000,0x20e0000,0x21e0000,0x21f0000
def write(a,f,*v):cpu.mem_write(a,struct.pack('<'+f,*v))
write(0x9bcd90,'I',marks);write(0x9bcfd4,'I',cells);write(0x9bcfc8,'I',indices);write(0x9bcfd8,'I',cache);write(0x9bcfd0,'I',0)
for i in range(65536):write(marks+i*8,'II',0,0xffffffff)
for i in range(16384):
 write(cells+i*10,'iiH',-1,-1,0);write(indices+i*2,'h',i);write(cache+i*8+2,'BB',255,0)
# A deterministic sequence can be replayed in portable tests without the EXE.
points=[[0,0],[65535,65535],[16,16],[512,512]]
points += [[1024+(i%32)*16,2048+((i//32)%32)*16] for i in range(1100)]
points += [[1234,2345]]*800
points += [[(i*157)&65535,(i*359)&65535] for i in range(17000)]
checks={0,3,375,1103,1903,8191,16383,len(points)-1}
expected=[]
notifications=[0]*16384
for i,(x,y) in enumerate(points):
 for dx,dy in [(0,0),(-16,0),(-16,-16),(0,-16)]:
  cell=(((y+dy)&65535)>>9)*128+(((x+dx)&65535)>>9);notifications[cell]+=1
 write(person+0x3d,'HH',x,y);write(stack,'II',stop,person);cpu.reg_write(UC_X86_REG_ESP,stack)
 cpu.emu_start(0x4bf630,stop,count=5000)
 assert cpu.reg_read(UC_X86_REG_EIP)==stop
 if i in checks:
  expected.append(dict(at=i,cursor=struct.unpack('<I',cpu.mem_read(0x9bcfd0,4))[0],
   marks=hashlib.sha256(cpu.mem_read(marks,65536*8)).hexdigest(),cells=hashlib.sha256(cpu.mem_read(cells,16384*10)).hexdigest()))
# Every native dirty notification must still preserve the other cache flags.
for i,count in enumerate(notifications):
 assert bytes(cpu.mem_read(cache+i*8+2,2))==bytes([253 if count else 255,count&255]),i
data=dict(executableSha256=identity['sha256'],points=points[:4],checkpoints=expected)
js="""import {createHash} from 'node:crypto';import {createFootprints,stampFootprints} from './app/footprints.ts';let input='';for await(const c of process.stdin)input+=c;const data=JSON.parse(input),f=createFootprints(),out=[];
const points=[...data.points];for(let i=0;i<1100;i++)points.push([1024+(i%32)*16,2048+(Math.floor(i/32)%32)*16]);for(let i=0;i<800;i++)points.push([1234,2345]);for(let i=0;i<17000;i++)points.push([(i*157)&65535,(i*359)&65535]);
const hash=b=>createHash('sha256').update(b).digest('hex');for(let i=0;i<points.length;i++){stampFootprints(f, ...points[i]);if(!data.checkpoints.some(c=>c.at===i))continue;
const marks=Buffer.alloc(65536*8),cells=Buffer.alloc(16384*10);for(let n=0;n<65536;n++){marks.writeUInt32LE(f.positions[n],n*8);marks.writeInt32LE(f.next[n],n*8+4);}for(let n=0;n<16384;n++){cells.writeInt32LE(f.tails[n],n*10);cells.writeInt32LE(f.heads[n],n*10+4);cells.writeUInt16LE(f.totals[n],n*10+8);}out.push({at:i,cursor:f.cursor,marks:hash(marks),cells:hash(cells)});}console.log(JSON.stringify(out));"""
p=subprocess.run(['node','--input-type=module','-e',js],input=json.dumps(data),text=True,capture_output=True,cwd=root)
assert p.returncode==0,p.stderr
actual=json.loads(p.stdout)
assert expected==actual,(expected,actual)
if '--record' in sys.argv:(root/'tests/fixtures/footprints.json').write_text(json.dumps(data,indent=2)+'\n')
print(f'PASS: {len(points)} complete native footprint emissions ({len(points)*4} allocations), wrap, cell saturation, ring replacement and cache invalidation')
