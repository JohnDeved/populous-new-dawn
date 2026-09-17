#!/usr/bin/env python3
"""Static Tutorial2079 selector/level/header/script proof; never execute the EXE.

Requires Python 3.9+ and the existing Capstone 5.0.7 dependency. Reuses the
SHA-locked sibling check-static-mission18-sky.py PE32 reader without running
its sky check. The EXE is the only required evidence input; --data-root also
binds the supplied Tutorial label/HDR/DAT/CPSCR/CPATR identities. --output-dir
must name a new directory under an existing parent; reports are never replaced.
No Git, prior report, fixed checkout or working-directory discovery is used.
"""
from pathlib import Path
import argparse,hashlib,importlib.util,json,struct,sys
from datetime import datetime,timezone
try:
    import capstone
    from capstone.x86 import X86_OP_IMM,X86_OP_MEM
except ImportError as error:
    raise SystemExit('Capstone 5.0.7 is required in the selected Python environment; nothing is installed automatically.') from error
HERE=Path(__file__).resolve().parent
EXPECTED_READER='74dd55ab6d811f0f0d870c94eb404d2c06915bf96232b6dc39c25f19ceee6da2'
sha=lambda b:hashlib.sha256(b).hexdigest()
# Deliberately bounded executable code blocks. Jump tables are read as data below.
WINDOWS={
 0x45a3c0:0x10b,0x4c3800:0x41,0x45a151:0x35,
 0x45b6e0:0x61,0x45b9bb:0x80,0x45adb0:0x74,
 0x45ae30:0x25,0x45af87:0xbd,0x45b2ba:0x60,
 0x45b460:0x19,0x45b496:0x22,0x4c5a40:0x3c,0x4b1e10:0xf9,
 0x442a60:0x46,0x442ab0:0x22,0x451330:0x12,
 0x485660:0x286,0x486550:0x14d,0x492be0:0x43,
 0x4854c0:0x198,0x42c790:0x67,0x485df0:0x49,0x485e60:0x11f,
 0x486160:0xd4,0x4583e0:0x80,0x42b590:0xc3,0x42b3c0:0x1b,
}

def main():
    p=argparse.ArgumentParser(description=__doc__)
    p.add_argument('--exe',required=True,type=Path,help='supplied SHA-verified original d3dpoptb.exe')
    p.add_argument('--reader',type=Path,default=HERE/'check-static-mission18-sky.py',help='existing SHA-locked PE32 reader; defaults beside this script')
    p.add_argument('--data-root',type=Path,help='optional supplied game directory; validates the tutorial inputs')
    p.add_argument('--output-dir',required=True,type=Path,help='new directory for evidence.json and decoded byte windows; parent must exist')
    a=p.parse_args()
    if capstone.__version__!='5.0.7':raise ValueError('Use existing validated Capstone5.0.7')
    a.exe=a.exe.expanduser().resolve(strict=True)
    a.reader=a.reader.expanduser().resolve(strict=True)
    if a.data_root is not None:
        a.data_root=a.data_root.expanduser().resolve(strict=True)
    out=a.output_dir.expanduser()
    if out.exists() or out.is_symlink():
        raise ValueError(f'Refusing to replace existing output: {out}')
    out=out.resolve()
    if not out.parent.is_dir():
        raise ValueError(f'Output parent directory does not exist: {out.parent}')
    if sha(a.reader.read_bytes())!=EXPECTED_READER:raise ValueError('Reviewed existing PE reader fingerprint changed')
    spec=importlib.util.spec_from_file_location('read_only_pe32',a.reader)
    reader=importlib.util.module_from_spec(spec);spec.loader.exec_module(reader)
    pe=reader.PE32(a.exe)
    out.mkdir()  # Exclusive creation also rejects concurrent creation; no prior output is removed.
    decoder=capstone.Cs(capstone.CS_ARCH_X86,capstone.CS_MODE_32);decoder.detail=True
    checks=[];rows={};windows={}
    def equal(actual,expected,name):
        if actual!=expected:raise ValueError(f'{name}: expected {expected!r}, got {actual!r}')
        checks.append(name)
    def truth(value,name):equal(bool(value),True,name)
    for va,size in WINDOWS.items():
        data=pe.read(va,size);instructions=[]
        for ins in decoder.disasm(data,va):
            r={'va':f'{ins.address:08x}','size':ins.size,'bytes':ins.bytes.hex(),'mnemonic':ins.mnemonic,'op':ins.op_str}
            for op in ins.operands:
                if op.type==X86_OP_IMM and (ins.group(capstone.CS_GRP_CALL) or ins.group(capstone.CS_GRP_JUMP)):r['target']=f'{op.imm&0xffffffff:08x}'
                if op.type==X86_OP_MEM and op.mem.base==0 and op.mem.index==0 and op.mem.disp in pe.imports:r['import']=pe.imports[op.mem.disp]
            instructions.append(r);rows[ins.address]=r
        equal(sum(r['size'] for r in instructions),size,f'whole requested code block {va:08x}')
        w={'start':f'{va:08x}','endExclusive':f'{va+size:08x}','sha256':sha(data),'instructions':instructions};windows[f'{va:08x}']=w
        (out/f'{va:08x}.txt').write_text('# STATIC CODE BLOCK ONLY; not executed.\n# SHA256 '+w['sha256']+'\n'+'\n'.join(r['va']+' '+r['bytes'].ljust(24)+' '+r['mnemonic']+' '+r['op'] for r in instructions)+'\n')
    def ins(va,mn,op=None):
        r=rows.get(va)
        if r is None:raise ValueError(f'Expected instruction boundary {va:08x}')
        equal(r['mnemonic'],mn,f'mnemonic {va:08x}')
        if op is not None:equal(r['op'],op,f'operand {va:08x}')
    def call(va,to):ins(va,'call',f'0x{to:x}')
    def branch(va,mn,to):ins(va,mn,f'0x{to:x}')

    # Descriptor, menu0 list and type5 jump table values are original data bytes.
    equal(pe.u32(0x5d9ca0),0x5d9660,'menu0 list pointer')
    equal(pe.u32(0x5d9670),5,'Tutorial list entry type5')
    equal(pe.u32(0x5d9674),0x5d7c9c,'Tutorial descriptor pointer')
    equal(pe.u32(0x5d7cc0),299,'Tutorial descriptor label index')
    equal(pe.u32(0x5d7cc4),0x4c5a40,'Tutorial descriptor activation callback')
    equal(pe.u32(0x5d96b8),0x80000000,'menu0 list sentinel')
    equal((0x5d96b8-0x5d9660)//8,11,'menu0 item count from sentinel')
    equal(pe.u32(0x45b69c),0x45b496,'type5 activation dispatch')
    equal(pe.u32(0x45b418+pe.read(0x45b431,1)[0]*4),0x45b007,'type5 mouse-style branch')
    equal(pe.u32(0x45b43c+pe.read(0x45b44d,1)[0]*4),0x45b309,'type5 selected-action branch')
    equal(pe.u32(0x45d6d0),0x45b9bb,'type5 text rendering branch')
    equal(pe.u32(0x45a4dc),0x45a4b2,'type5 menu initialization does not auto-call activation')

    # Menu setter and one conditional caller; boot reachability of its predicates is not inferred.
    ins(0x45a3c0,'mov','eax, dword ptr [esp + 4]');ins(0x45a3c7,'mov','dword ptr [0x749cd8], eax')
    ins(0x45a3ed,'shl','eax, 5');ins(0x45a3f0,'add','eax, 0x5d9c98')
    ins(0x4c3800,'cmp','dword ptr [0xa6905c], 0');branch(0x4c3807,'je',0x4c380e)
    ins(0x4c380e,'test','byte ptr [0x89c66c], 0x80');branch(0x4c3815,'je',0x4c3822)
    ins(0x4c3822,'test','byte ptr [0x5fc9f5], 1');branch(0x4c3829,'je',0x4c3836)
    ins(0x4c3836,'push','0');call(0x4c3838,0x45a3c0)
    ins(0x45a15a,'mov','esi, 0x5d9c9c');ins(0x45a172,'mov','ebx, dword ptr [esi + 4]')
    ins(0x45a175,'cmp','dword ptr [ebx + edx*8], 0x80000000');branch(0x45a17c,'jne',0x45a16b)
    ins(0x45a17e,'dec','dword ptr [esi]');ins(0x45a180,'add','esi, 0x20')

    # The type5 renderer reads the same descriptor+24 label from the language-pointer table.
    ins(0x45b6f2,'shl','eax, 5');ins(0x45b6f7,'add','eax, 0x5d9c98')
    ins(0x45b71e,'mov','edi, dword ptr [eax + 4]');ins(0x45b73a,'jmp','dword ptr [eax*4 + 0x45d6c4]')
    ins(0x45b9df,'mov','edx, dword ptr [edi + 0x24]');ins(0x45b9e3,'mov','ebx, dword ptr [edx*4 + 0x972ba8]')
    ins(0x45b9ea,'push','ebx');call(0x45ba02,0x4fe730)
    ins(0x45ba19,'add','edi, 4');ins(0x45ba2b,'mov','dword ptr [edi], eax');ins(0x45ba33,'mov','dword ptr [edi + 8], ecx')

    # Two conditional action branches reach type5 callback only when action==1.
    ins(0x45adb0,'mov','eax, dword ptr [0x749cd8]');call(0x45adb6,0x45ae30)
    ins(0x45ae37,'shl','eax, 5');ins(0x45ae3c,'add','eax, 0x5d9c98');ins(0x45ae47,'mov','esi, dword ptr [eax + 8]')
    ins(0x45af87,'test','byte ptr [0x749dfc], 0x20');branch(0x45af8e,'je',0x45b2ba)
    ins(0x45af94,'test','byte ptr [0x749dfc], 5');ins(0x45afa1,'cmp','dword ptr [0x749cdc], 0')
    ins(0x45afdc,'mov','esi, dword ptr [eax + 4]');ins(0x45afe1,'test','cl, 1')
    ins(0x45b007,'cmp','dword ptr [esi + 0xc], 0');branch(0x45b00b,'je',0x45b298)
    ins(0x45b011,'test','byte ptr [0x749dfc], 1');ins(0x45b018,'mov','dword ptr [0x749ce0], 1');branch(0x45b022,'jne',0x45b02e)
    ins(0x45b024,'mov','dword ptr [0x749ce0], 3');call(0x45b03a,0x45b460)
    ins(0x45b2ba,'cmp','dword ptr [0x749ce0], 0');ins(0x45b2cb,'mov','eax, dword ptr [ecx + 0x14]')
    ins(0x45b2ce,'cmp','eax, -1');ins(0x45b2d7,'mov','edx, dword ptr [ecx + 0x10]')
    ins(0x45b2da,'shl','edx, 3');ins(0x45b2dd,'add','edx, dword ptr [ecx + 8]');ins(0x45b2e3,'test','byte ptr [eax], 1')
    call(0x45b30a,0x45b460);ins(0x45b496,'cmp','dword ptr [0x749ce0], 1');branch(0x45b49d,'jne',0x45b695)
    ins(0x45b4a3,'mov','ecx, dword ptr [ecx + 4]');ins(0x45b4a6,'mov','eax, dword ptr [ecx + 0x28]');ins(0x45b4b2,'call','eax')

    # Tutorial callback -> explicit number79/mode flag -> named loader, no number-to-menu guess.
    call(0x4c5a40,0x4b1e10);ins(0x4c5a45,'mov','byte ptr [0x749c78], 1')
    ins(0x4c5a4c,'push','2');call(0x4c5a4e,0x442a60)
    ins(0x442a91,'mov','byte ptr [0x88f001], cl');ins(0x442a97,'mov','byte ptr [0x88f002], 5');ins(0x442a9e,'mov','byte ptr [0x88f003], 0')
    ins(0x442ab0,'cmp','byte ptr [0x88f001], 0');ins(0x442abe,'mov','byte ptr [0x88f000], al')
    ins(0x4b1e4e,'or','dword ptr [0x89c665], 0x4000000');ins(0x4b1e27,'and','dword ptr [0x89c665], 0xfff7ffff')
    ins(0x4b1e6f,'mov','word ptr [0x89c6dd], 0x4f');ins(0x4b1e83,'push','0x4f');ins(0x4b1e85,'mov','byte ptr [0x89b73f], bl')
    call(0x4b1e92,0x485660);call(0x4b1ebd,0x486160);ins(0x4b1ec4,'mov','byte ptr [0x89c6f0], bl');call(0x4b1ee0,0x42b590)
    call(0x42b638,0x42b230);ins(0x42b3c0,'movsx','eax, word ptr [0x89c6dd]');call(0x42b3c8,0x484a10)
    truth(not any(x.get('target') in ['00485df0','00485e60','004854c0'] for x in windows['004b1e10']['instructions']),'tutorial initializer bypasses profile-index and header-only path')

    # Standard loader/profile alternative is distinct, not used to derive the tutorial file ID.
    call(0x42c79e,0x485660);ins(0x42c7b5,'test','byte ptr [0x89c668], 0x10');branch(0x42c7bc,'je',0x42c7f2)
    call(0x42c7c6,0x485df0);call(0x42c7db,0x485e60);call(0x42c7f2,0x486160)
    ins(0x485df3,'mov','al, byte ptr [0x89a315]');ins(0x485e00,'mov','eax, 0x63')
    ins(0x485e16,'add','edx, 0x18');ins(0x485e1a,'cmp','edx, 0x89a329');ins(0x485e2c,'cmp','ecx, 0x4f');branch(0x485e2f,'je',0x485e35)
    ins(0x485e35,'mov','eax, ecx');ins(0x485eaa,'cmp','eax, 0x63');branch(0x485ead,'je',0x485f7b)
    ins(0x486197,'mov','esi, 0x89b741');ins(0x48619c,'mov','edi, 0x96070a');ins(0x4861a1,'mov','ecx, 0xe');ins(0x4861b2,'rep movsd','dword ptr es:[edi], dword ptr [esi]')

    # Actual header/CPATR path, one slot for header tribe count2. 54 is skipped; 79 is not.
    ins(0x485670,'cmp','esi, 0x36');branch(0x485673,'je',0x4858dc)
    call(0x4856b7,0x55b450);call(0x4856f2,0x525f80);call(0x48576e,0x525f80);call(0x48577c,0x5009e0)
    call(0x485821,0x525f80);call(0x4858a1,0x525f80);call(0x4858af,0x5009e0)
    ins(0x485852,'mov','al, byte ptr [ebx + 0x89b79a]');call(0x4858d7,0x486550)
    equal(pe.cstr(0x599848),'LEVL2','level stem literal');equal(pe.cstr(0x599830),'HDR','header suffix literal')
    equal(pe.cstr(0x599838),'%s\\%s%03d.%s','numeric level/script filename format')
    equal(pe.cstr(0x5a1e48),'CPATR','attribute-file stem');equal(pe.cstr(0x5a1e70),'CPSCR','script-file stem')
    equal('LEVL2%03d.HDR'%79,'LEVL2079.HDR','format79 to Tutorial header')

    # CPSCR load conditional on count and file reads, not a tutorial-mode suppression branch.
    ins(0x486558,'mov','al, byte ptr [0x89b799]');ins(0x48655f,'dec','eax');branch(0x486564,'jle',0x486694)
    ins(0x48656a,'mov','esi, 0x9608ba');ins(0x486590,'mov','al, byte ptr [edi + 0x89b79a]')
    call(0x4865df,0x525f80);branch(0x4865e9,'je',0x486674);ins(0x486610,'mov','al, byte ptr [edi + 0x89b79a]')
    call(0x48665f,0x525f80);branch(0x486669,'je',0x486674);call(0x48666c,0x492be0)
    ins(0x486674,'lea','eax, [esi + 0x2000]');ins(0x48667a,'add','esi, 0x3108');ins(0x486681,'mov','dword ptr [esi - 8], eax')
    for va,operand in [(0x492bfe,'word ptr [eax + 0x9608ba], 0xc'),(0x492c07,'word ptr [eax + 0x9608bc], 0x3eb'),(0x492c10,'word ptr [eax + 0x9608be], 0x3ec'),(0x492c19,'word ptr [eax + 0x9608c0], 0x3fb')]:ins(va,'mov',operand)
    # Header-only reader calls empty-program reset; it is not interchangeable with load_level_cpatr.
    call(0x48554a,0x525f80);call(0x4855c6,0x525f80);call(0x48561a,0x492be0);ins(0x485614,'add','ebx, 0x90');ins(0x48563f,'cmp','ebx, 0x89bba9')
    truth(not any(x.get('target')=='00486550' for x in windows['004854c0']['instructions']),'header-only reader never invokes CPSCR file loader')
    ins(0x4583e9,'cmp','word ptr [0x89c6dd], 0x4f');branch(0x4583f1,'je',0x45845b);call(0x45845b,0x4b1e10)

    inputs={'status':'NOT_REQUESTED','limits':'EXE-only proof does not identify a supplied language or level-file version.'}
    if a.data_root:
        expected={
          'levels/levl2079.dat':'22bd7ec9aa287245d8a41f42f40f468f06f09663304b87c8ccf75e15101068d8',
          'levels/levl2079.hdr':'58a80720a75c6c7018e4e8e95c1e1e3d87de1038e524b8a712a1bc905a40f641',
          'levels/cpscr057.dat':'cdb5d7abd327933ac22e7824aebae70a60faa504049d05d8ff32dedc730d3603',
          'language/lang00.dat':'e826c478746d666a3ea9ea36cb7804d1d226d5f83084230987b1de293066cf7d',
          'levels/cpatr057.dat':'6f17daf7484583dcef9b5d3a3e7a61ad5037ded27ca2a04a7fb770ab7f5d52c7',
        }
        records=[]
        for name,digest in expected.items():
            data=(a.data_root/name).read_bytes();equal(sha(data),digest,'supplied identity '+name);records.append({'path':name,'bytes':len(data),'sha256':digest})
        header=(a.data_root/'levels/levl2079.hdr').read_bytes()
        equal(len(header),616,'header size');equal(header[88],2,'two declared tribes');equal(header[89],57,'selected single opponent script57')
        equal(header[56:88].split(b'\0')[0],b'TUTORIAL','authored header label')
        equal('CPSCR%03d.DAT'%header[89],'CPSCR057.DAT','selected script path')
        script=(a.data_root/'levels/cpscr057.dat').read_bytes();equal(len(script),12552,'script buffer length');equal(struct.unpack_from('<H',script)[0],12,'supplied VM version12')
        attributes=(a.data_root/'levels/cpatr057.dat').read_bytes();equal(len(attributes),144,'selected CPATR057 exists with144 bytes')
        language=(a.data_root/'language/lang00.dat').read_bytes().decode('utf-16le').split('\0')
        equal(language[299],'Tutorial','actual localized descriptor text');equal(language[235],'Yes','secondary callback descriptor label, not a proved confirmation flow')
        inputs={'status':'PASS_TUTORIAL_INPUT_IDENTITIES','files':records,'header':{'tribes':2,'selectedScripts':[57],'landscape':header[96],'objectBank':header[97]},'label299':language[299],'limits':'Host readable original bytes; no original process file-open, input or script execution was observed.'}
    descriptorBytes=[(0x5d9c98,0x20),(0x5d9660,0x60),(0x5d7c9c,0x2c),(0x45b698,0x24),(0x45b418,0x22),(0x45b43c,0x20),(0x45d6c4+12,4)]
    report={'at':datetime.now(timezone.utc).isoformat(),'status':'PASS_STATIC_TUTORIAL_ENTRY_CONDITIONS','exeSha256':sha(pe.data),'readerSha256':sha(a.reader.read_bytes()),'scriptSha256':sha(Path(__file__).read_bytes()),'capstone':capstone.__version__,'assertions':len(checks),'checks':checks,'windows':windows,'originalData':[{'va':f'{v:08x}','bytes':pe.read(v,n).hex(),'sha256':sha(pe.read(v,n))}for v,n in descriptorBytes],'inputs':inputs,'mapping':'If initialized menu0 exposes enabled type5 Tutorial record and action1 reaches its dispatcher, descriptor callback004c5a40 calls004b1e10, sets level79/mode0x04000000, invokes00485660 to read LEVL2079.HDR, CPATR057.DAT and CPSCR057.DAT. Failure of both CPSCR read attempts falls back to an empty version12 program; HDR/CPATR read failure instead calls005009e0(0x1a); the distinct header-only004854c0 path deliberately clears scripts.','remainingUpstream':[{'producer':'0045a3c0 writes current-menu00749cd8 from its caller; conditional004c3838 selects0','unproved':'Which boot/login/return path reaches that caller under actual mode globals; no original menu runtime observed.'},{'producer':'0045ae30 /0045b2ba require action00749ce0, flags00749dfc, focus/menu count and item enabled/hit state; renderer0045b9bb calls004fe730 and copies resulting hit fields','unproved':'Exact OS mouse/keyboard event-to-action/hit producer chain and actual label/language initialization; no invented input semantics or display claim.'},{'producer':'00485660 /00486550 call00525f80 for original file reads, and00442a60 queues state2','unproved':'Successful Windows file I/O, full state-transition service, startup/recurring CPSCR execution and tutorial completion path not executed or fully proven by this loader mapping.'}],'limits':'Static original-byte/code/data linkage only, not native execution/emulation, a full boot-to-click trace, rendered UI or a complete tutorial playthrough. Other15extra maps and U08 are outside scope.'}
    (out/'evidence.json').write_text(json.dumps(report,indent=2)+'\n')
    print(json.dumps({k:v for k,v in report.items() if k in ['at','status','exeSha256','scriptSha256','assertions','inputs','mapping','remainingUpstream','limits']},indent=2))

if __name__=='__main__':
    try:
        main()
    except (OSError,ValueError,struct.error) as error:
        print(f'FAIL: {error}',file=sys.stderr)
        sys.exit(1)
