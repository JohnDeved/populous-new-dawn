#!/usr/bin/env python3
"""Original-byte Face Off/LEVL2131 selector and conditional loader evidence.

Requires Python 3.9+ and existing Capstone 5.0.7. Reuses the unchanged SHA-locked
sibling PE32 reader without executing its sky check. Explicit EXE and data-root
inputs enforce the original executable and all six canonical file identities.
An explicit new output directory receives decoded byte windows and evidence.json;
its parent must exist. No Git, scratch report, fixed worktree or cwd discovery.
No target instructions/emulator/network/graphics run, and multiplayer remains
excluded from implementation. Exclusive single-player/demo scope stays unresolved.
"""
from pathlib import Path
from datetime import datetime,timezone
import argparse,hashlib,importlib.util,json,struct,sys
try:
 import capstone
 from capstone.x86 import X86_OP_IMM
except ImportError as error:
 raise SystemExit('Use the existing Python environment with Capstone 5.0.7; nothing is installed automatically.') from error
HERE=Path(__file__).resolve().parent
SHA_READER='74dd55ab6d811f0f0d870c94eb404d2c06915bf96232b6dc39c25f19ceee6da2'
sha=lambda b:hashlib.sha256(b).hexdigest()
# Executable blocks, not arbitrary linear sweeps through jump tables.
WINDOWS={
 0x4c3990:0x6e,0x4853f9:0xbf,0x4c3a00:0x76,0x4c3aca:0x75,
 0x4c3c40:0x3b,0x4c3e62:0x07,0x4c45e0:0x2f,0x40f680:0x32,
 0x45a437:0x0c,0x45a4ac:0x06,0x45b03f:0x59,0x40f6c0:0x34,
 0x45b496:0x22,0x4c3600:0x0b,0x40f7c0:0x66,0x40f96f:0x61,
 0x40f136:0x3e,0x40f27a:0x5f,0x4a55c3:0x50,0x43e890:0x46,
 0x43e8e0:0x49,0x43ece4:0xb8,0x4854c0:0x198,0x492be0:0x43,
 0x42b590:0xc3,0x42b3c0:0x1b,0x4c5a80:0x6a,0x4b36e0:0x114,
 0x4b3510:0x45,0x4b2a78:0xac,
}
# Each tuple is an independently reviewed instruction/operand, not generated from the decoded result.
EXPECTED=[
 (0x4c39bb,'call','0x4852f0'),(0x4c39cd,'mov','word ptr [ecx*2 + 0xa0ce08], si'),
 (0x4c39d9,'mov','byte ptr [ecx + 0xa0d008], al'),(0x4c39e3,'mov','byte ptr [ecx + 0x9fd000], dl'),
 (0x40f6a2,'mov','al, byte ptr [0x96eabf]'),(0x40f6a9,'call','0x4c3a00'),(0x45b093,'call','eax'),
 (0x4c5a80,'mov','dword ptr [0x59d10c], 1'),(0x4c5ad4,'or','dword ptr [0x89c665], 0x80000'),
 (0x4c5ae1,'call','0x4b36e0'),(0x4b3737,'call','0x4b30e0'),
 (0x4b351f,'call','0x4b28d0'),(0x4b3537,'call','0x4b2d20'),(0x4b3547,'or','byte ptr [0x98f746], 0x10'),
 (0x4b2a8b,'push','0x5ce054'),(0x4b2a92,'push','0x5ce044'),(0x4b2ad5,'cmp','eax, 0xd1964'),(0x4b2af7,'call','0x428210'),
 (0x48542b,'cmp','al, 0xa'),(0x48542d,'jae','0x48543a'),
 (0x485445,'call','0x4c3c40'),(0x485458,'mov','dl, byte ptr [esp + 0x284]'),
 (0x48545f,'mov','dword ptr [eax], edx'),(0x48546a,'mov','dword ptr [eax], 1'),
 (0x485472,'mov','ebx, 0x50'),(0x485477,'cmp','byte ptr [esp + ecx + 0x285], bl'),
 (0x48547e,'jae','0x485487'),(0x485487,'mov','dword ptr [eax], 0'),
 (0x4c3a31,'movsx','ebp, byte ptr [eax + 0xa0d008]'),(0x4c3a38,'cmp','ebp, edi'),
 (0x4c3a3c,'cmp','edi, 0xfffffc19'),(0x4c3a44,'cmp','byte ptr [eax + 0x9fd000], cl'),
 (0x4c3a54,'cmp','word ptr [eax*2 + 0xa0ce08], dx'),(0x4c3a5c,'jge','0x4c3a6d'),
 (0x4c3a60,'cmp','word ptr [eax*2 + 0xa0ce08], bx'),(0x4c3a68,'jl','0x4c3a6d'),
 (0x4c3b1f,'call','0x4c3c40'),(0x4c3b27,'add','ebp, 0x214'),(0x4c3b30,'mov','dword ptr [ebp - 8], eax'),
 (0x4c3e62,'mov','edx, 0x2db'),
 (0x4c45ed,'push','0xfffffc19'),(0x4c45fd,'call','0x4c3a00'),
 (0x40f680,'cmp','byte ptr [0x89569c], 0'),(0x40f689,'cmp','dword ptr [0x599940], 0'),
 (0x45a43a,'mov','eax, dword ptr [ecx + 0x28]'),(0x45a4ad,'call','eax'),
 (0x45b07b,'mov','dword ptr [esi + 0x24], eax'),(0x45b081,'mov','eax, dword ptr [ecx + 0x2c]'),
 (0x40f6ca,'mov','edx, dword ptr [eax + 0x24]'),(0x40f6cd,'mov','eax, dword ptr [eax + 0x20]'),
 (0x40f6da,'mov','edx, dword ptr [eax + ecx*4 + 0x20c]'),(0x40f6e6,'mov','word ptr [0x89c6dd], dx'),
 (0x45b496,'cmp','dword ptr [0x749ce0], 1'),(0x45b4a6,'mov','eax, dword ptr [ecx + 0x28]'),(0x45b4b2,'call','eax'),
 (0x4c3600,'push','4'),(0x4c3602,'call','0x45a3c0'),
 (0x40f7c6,'cmp','byte ptr [0x89569d], 0'),(0x40f7d0,'je','0x40f9ed'),
 (0x40f7e2,'test','byte ptr [eax], 0xf'),(0x40f7e7,'cmp','byte ptr [ecx + 0x8956bb], dl'),
 (0x40f7ed,'jne','0x40f89d'),(0x40f7fe,'and','dword ptr [0x89c665], 0xfff7ffff'),
 (0x40f81f,'mov','byte ptr [0x894cf9], 5'),
 (0x40f96f,'mov','ax, word ptr [0x89c6dd]'),(0x40f97b,'mov','word ptr [esp + 0x11], ax'),(0x40f9c8,'call','0x4160d0'),
 (0x40f136,'cmp','byte ptr [0x894cf9], 5'),(0x40f13d,'jne','0x40f2d9'),
 (0x40f16d,'or','dword ptr [0x89c661], 8'),(0x40f27f,'push','2'),(0x40f281,'call','0x442a60'),
 (0x4a55c3,'mov','eax, dword ptr [0x89c661]'),(0x4a55c8,'and','eax, 8'),
 (0x4a55cd,'cmp','dword ptr [0x89d184], 0'),(0x4a55d4,'jne','0x4a563f'),
 (0x4a55db,'mov','eax, 0x89d198'),(0x4a55e4,'cmp','byte ptr [ecx + 0xc20], dl'),
 (0x4a55ec,'mov','byte ptr [eax], 0x1b'),(0x4a55ef,'add','eax, 0xf'),(0x4a55f2,'add','ecx, 0xc65'),
 (0x4a5604,'call','0x43e890'),(0x4a5609,'mov','dword ptr [0x89d184], 1'),
 (0x43e890,'test','byte ptr [0x98f746], 0x10'),(0x43e89b,'jne','0x43e8d1'),
 (0x43e8b6,'cmp','byte ptr [esi + 0xc], bl'),(0x43e8bd,'call','0x43e8e0'),
 (0x43e90b,'mov','cl, byte ptr [eax + 0xc]'),(0x43e91c,'mov','al, byte ptr [ecx + 0x4423f0]'),
 (0x43e922,'jmp','dword ptr [eax*4 + 0x4422c0]'),(0x43ed4c,'jne','0x43ed9c'),
 (0x43ed4e,'movsx','eax, word ptr [0x89c6dd]'),(0x43ed56,'call','0x4854c0'),
 (0x43ed5e,'call','0x486240'),(0x43ed7b,'call','0x42b590'),
 (0x48550f,'call','0x55b450'),(0x48554a,'call','0x525f80'),(0x4855c6,'call','0x525f80'),
 (0x485614,'add','ebx, 0x90'),(0x48561a,'call','0x492be0'),(0x48563f,'cmp','ebx, 0x89bba9'),
 (0x492bfe,'mov','word ptr [eax + 0x9608ba], 0xc'),(0x492c07,'mov','word ptr [eax + 0x9608bc], 0x3eb'),
 (0x492c10,'mov','word ptr [eax + 0x9608be], 0x3ec'),(0x492c19,'mov','word ptr [eax + 0x9608c0], 0x3fb'),
 (0x42b638,'call','0x42b230'),(0x42b3c0,'movsx','eax, word ptr [0x89c6dd]'),(0x42b3c8,'call','0x484a10'),
]
FILES={
 'levels/levl2131.dat':(192137,'048b34772c158b37cc7783bedd5c4bca4da9628a3026a813c53cb4b57616d157'),
 'levels/levl2131.hdr':(616,'08f4ee293d7eea4d53490a54240aadcd87aeb930f555ef1c3bb530cd4162b9cd'),
 'levels/levl2131.inf':(26,'cecd22897e9bedef3bcb59d5cfe012dbd641bd5c3a52510a8a9e6f1704ef4048'),
 'levels/levl2131.ver':(68,'428e57013eb47a4a7abdb3ec649e275f591e0846b219f8e81221cfb87a7ccb6a'),
 'language/lang00.dat':(207264,'e826c478746d666a3ea9ea36cb7804d1d226d5f83084230987b1de293066cf7d'),
 'rddata/rdmn001.dat':(286,'b947d85037945626b58bd085d8bd3996ca2be3ea0072c88eee6621bcc2485f91'),
}

def main():
 p=argparse.ArgumentParser(description=__doc__)
 p.add_argument('--exe',type=Path,required=True,help='supplied SHA-verified original d3dpoptb.exe')
 p.add_argument('--data-root',type=Path,required=True,help='supplied game root containing the six required input files')
 p.add_argument('--reader',type=Path,default=HERE/'check-static-mission18-sky.py',help='SHA-locked PE32 reader; defaults beside this script')
 p.add_argument('--output-dir',type=Path,required=True,help='new evidence directory under an existing parent')
 a=p.parse_args()
 a.exe=a.exe.expanduser().resolve(strict=True)
 a.data_root=a.data_root.expanduser().resolve(strict=True)
 a.reader=a.reader.expanduser().resolve(strict=True)
 if capstone.__version__!='5.0.7':raise ValueError('Existing Capstone5.0.7 required')
 if sha(a.reader.read_bytes())!=SHA_READER:raise ValueError('Reviewed PE32 reader identity mismatch')
 spec=importlib.util.spec_from_file_location('existing_static_reader',a.reader);m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m);pe=m.PE32(a.exe)
 out=a.output_dir.expanduser()
 if out.exists() or out.is_symlink():raise ValueError('Refuse existing output')
 out=out.resolve()
 if not out.parent.is_dir():raise ValueError('Output parent must exist')
 out.mkdir();checks=[];windows={};rows={}
 def equal(actual,expected,name):
  if actual!=expected:raise ValueError(f'{name}: expected {expected!r}, got {actual!r}')
  checks.append(name)
 cs=capstone.Cs(capstone.CS_ARCH_X86,capstone.CS_MODE_32);cs.detail=True
 for address,size in WINDOWS.items():
  data=pe.read(address,size);ins=[]
  for i in cs.disasm(data,address):
   r={'va':f'{i.address:08x}','size':i.size,'bytes':i.bytes.hex(),'mnemonic':i.mnemonic,'op':i.op_str}
   if (i.group(capstone.CS_GRP_CALL)or i.group(capstone.CS_GRP_JUMP))and i.operands and i.operands[0].type==X86_OP_IMM:r['target']=f'{i.operands[0].imm&0xffffffff:08x}'
   ins.append(r);rows[i.address]=r
  equal(sum(i['size']for i in ins),size,f'whole code block {address:08x}')
  windows[f'{address:08x}']={'start':f'{address:08x}','endExclusive':f'{address+size:08x}','sha256':sha(data),'instructions':ins}
  (out/f'{address:08x}.txt').write_text('# Static block only, not executed.\n'+'\n'.join(f"{i['va']} {i['bytes']} {i['mnemonic']} {i['op']}"for i in ins)+'\n')
 for address,mn,operand in EXPECTED:
  if address not in rows:raise ValueError(f'Instruction boundary missing {address:08x}')
  equal((rows[address]['mnemonic'],rows[address]['op']),(mn,operand),f'instruction {address:08x}')
 # Code-backed data dispatch, not filename/tribe-only role inference.
 pairs=[(0x5d9da0,0x5d97c8),(0x5d97c8+6*8,6),(0x5d97c8+6*8+4,0x5d8464),(0x5d848c,0x40f680),(0x5d8490,0x40f6c0),(0x5d97c8+25*8,5),(0x5d97c8+25*8+4,0x5d7f5c),(0x5d7f5c+36,318),(0x5d7f5c+40,0x40f7c0),(0x5d7cc8+36,307),(0x5d7cc8+40,0x4c3600),(0x5d7cf4+36,334),(0x5d7cf4+40,0x4c5a80),(0x45a4cc+5*4,0x45a437)]
 for address,value in pairs:equal(pe.u32(address),value,f'descriptor/table {address:08x}')
 nameCase=pe.u32(0x4c3f00+pe.read(0x4c3fb4+130,1)[0]*4);equal(nameCase,0x4c3e62,'level131 actual label dispatch')
 equal(pe.u32(0x4422c0+pe.read(0x4423f0+15,1)[0]*4),0x43ece4,'command27 consumer')
 for va,value in [(0x599848,'LEVL2'),(0x599830,'HDR'),(0x599838,'%s\\%s%03d.%s'),(0x5ce044,'%s\\RD%03d%s.%s'),(0x5ce054,'GM'),(0x5ce058,'RDDATA')]:equal(pe.cstr(va),value,f'original filename literal {va:08x}')
 targets={i.get('target')for i in windows['004854c0']['instructions']if i['mnemonic']=='call'}
 equal(bool(targets&{'00485660','00486550'}),False,'header-only path has no CPATR/CPSCR loader call')
 equal('00492be0'in targets,True,'header-only path explicitly resets programs')
 inputs=[]
 for name,(size,digest)in FILES.items():
  data=(a.data_root/name).read_bytes();equal(len(data),size,'size '+name);equal(sha(data),digest,'SHA '+name);inputs.append({'path':name,'bytes':len(data),'sha256':digest})
 hdr=(a.data_root/'levels/levl2131.hdr').read_bytes();equal(hdr[88:92],bytes([4,130,130,130]),'canonical tribe/script selectors');equal(hdr[96:98],bytes([17,0]),'canonical landscape/object')
 ver=struct.unpack_from('<I',(a.data_root/'levels/levl2131.ver').read_bytes())[0];equal(ver,11,'metadata version11 passes>=10 guard')
 equal(hdr[56:88].split(b'\0')[0],b'Demo level 4 ply','stale authored header label preserved')
 text=(a.data_root/'language/lang00.dat').read_bytes().decode('utf-16le').split('\0')
 for index,value in [(731,'Face Off'),(307,'Multiplayer'),(318,'Start'),(334,'Rolling Demo')]:equal(text[index],value,'original localized label '+str(index))
 # Arithmetic predicates are reports of the reviewed branch conditions, not emulation.
 equal(131<79,False,'ordinary -999 selector rejects131');equal(131>=80 and hdr[88]==4,True,'four-participant catalog filter admits131');equal(any(x>=80 for x in hdr[89:92]),True,'catalog script flag cleared for130')
 montage=(a.data_root/'rddata/rdmn001.dat').read_text('latin1');commands=[line.split()for line in montage.splitlines()if line.strip()and not line.lstrip().startswith('#')];equal([int(c[1])for c in commands if c[0]=='MONTYPE_GAME'],[1,5,2,6,3],'rolling demo recording IDs, not level IDs')
 result={'at':datetime.now(timezone.utc).isoformat(),'status':'PASS_STATIC_DEMO131_CONDITIONAL_PATH','exeSha256':sha(pe.data),'scriptSha256':sha(Path(__file__).read_bytes()),'readerSha256':SHA_READER,'capstone':capstone.__version__,'assertions':len(checks),'checks':checks,'windows':windows,'dataDispatch':[{'va':f'{v:08x}','value':f'{x:08x}'}for v,x in pairs],'inputs':inputs,'pathResult':{'actualDisplayName':'Face Off','selector':'four-player network lobby extra-level list; ordinary single-player list rejects131','selectedLevel':131,'modeConditions':'lobby host/ready guards then phase5 sets89c661 bit8 and queues state2; initial counter89d184==0 and ordinary command processing required','loader':'command0x1b reaches004854c0 header-only reset; LEVL2131.HDR and DAT use selected number','CPSCR130RequestedByVerifiedStartCommandLoader':False,'scriptDisposition':'three empty version12 programs installed by chosen header-only loader, not a missing-CPSCR read attempt or script122 substitution'},'scopeDecision':'UNRESOLVED for exclusive whole-content single-player/rolling-demo disposition; verified multiplayer path and no-CPSCR requirement do not authorize blanket artifact exclusion.','remaining':['Original boot/session/hit/host readiness and initial counter0 runtime reachability were not executed.','Rolling Demo dispatch uses recorded-state IDs1/5/2/6/3; their historical source-map identity is not established by the LEVL2131 header label.','Broader network phase scheduling and unrelated single-player/custom-map entry modes are not exhaustively classified.'],'limits':'Static source-byte, data-table and canonical-input proof only. No game instructions/emulation/API/network/graphics ran. Existing package-wide CPSCR130 absence is reused separately; no new inventory/extraction or scope/parity record.'}
 (out/'evidence.json').write_text(json.dumps(result,indent=2)+'\n');print(json.dumps({k:v for k,v in result.items()if k not in ['windows','checks','dataDispatch']},indent=2))
if __name__=='__main__':
 try:main()
 except (OSError,ValueError,struct.error)as e:print('FAIL:',e,file=sys.stderr);sys.exit(1)
