"""Native G key/default-selection-mode boundary; no real input or OS event loop.
Runs real clear_level_global_vars, process_cmd(action0xc1), mode4999d0 and
tribe-command82 dispatch. Palette/globe/reset leaves and outgoing emission are
supplied. The captured emitted argument is copied into a packet fixture before
real dispatch; no claim is made about the intervening native packet scheduler.
"""
import contextlib,hashlib,io,json,runpy,sys
from pathlib import Path
from unicorn import UC_HOOK_CODE
from unicorn.x86_const import UC_X86_REG_ESP,UC_X86_REG_EIP,UC_X86_REG_EAX
baseline=Path(__file__).with_name('probe-guard-lifecycle.py')
assert hashlib.sha256(baseline.read_bytes()).hexdigest()=='7f6ad6a478db9138af4b5ff3d69b612969c5dcc8365ec324309d18771ec77064'
capture=io.StringIO()
with contextlib.redirect_stdout(capture):b=runpy.run_path(str(baseline))
assert hashlib.sha256(capture.getvalue().encode()).hexdigest()=='7c7d6eff380665b6240822b29e38e9eff47de1c1a4c8855b58b4b5c71bde3711'
cpu,read,write,call,fixture,snap=[b[k] for k in ('cpu','read','write','call','fixture','snap')]
p,packet,tribe=[b[k] for k in ('p','packet','tribe')]
events=[]
leaves={0x4a32d0:'palette-reset',0x41ce00:'globe-initialize',0x475530:'auxiliary-reset',0x479cf0:'outgoing-tribe-command'}
def leaf(c,a,n,u):
 sp=c.reg_read(UC_X86_REG_ESP)
 events.append({'address':f'{a:08x}','name':leaves[a],
                'args':[read(sp+4+i*4,'I') for i in range(3)] if a==0x479cf0 else []})
 c.reg_write(UC_X86_REG_EAX,0);c.reg_write(UC_X86_REG_EIP,read(sp,'I'));c.reg_write(UC_X86_REG_ESP,sp+4)
for a in leaves:cpu.hook_add(UC_HOOK_CODE,leaf,begin=a,end=a)
report={'scope':__doc__,'identity':b['identity'],'baselineSha256':hashlib.sha256(baseline.read_bytes()).hexdigest(),
        'baselineResultSha256':hashlib.sha256(capture.getvalue().encode()).hexdigest(),
        'leaves':{f'{a:08x}':name for a,name in leaves.items()},'baselineLeaves':b['report']['suppliedLeaves'],
        'keyRecord':bytes(cpu.mem_read(0x5d6220,12)).hex(),'sourceHashes':{},'cases':[]}
assert report['keyRecord']=='67c100000011000000000000'
for path in (Path(__file__),Path(sys.argv[1]),Path(sys.argv[2])/'scripts/decomp.py'):
 report['sourceHashes'][str(path)]=hashlib.sha256(path.read_bytes()).hexdigest()
for initial,expected in ((0,1),(0x100000,0)):
 fixture();write(0x895da8,'I',initial);events.clear();call(0x42bfa0)
 flags=read(0x895da8,'I');initialization=list(events)
 assert flags==(initial|0x10040)
 helper=call(0x4999d0,0);assert helper==expected
 # Reset supplied ordinary person/tribe data after the native global reset.
 fixture();write(0x895da8,'I',flags);events.clear();call(0x4aab80,0xc1,0,0)
 assert len(events)==1 and events[0]['args']==[0,0x82,expected]
 emitted=list(events)
 write(packet+4,'IIB',emitted[0]['args'][2],0,0x82)
 before=snap();call(0x43e8e0,tribe,packet);after=snap()
 assert after['commands'][0]==1 and after['orders'][1]['model']==30
 assert after['orders'][1]['a']==73 and after['selection']==(128 if expected else 0)
 report['cases'].append({'initialFlags':initial,'initializedFlags':flags,'modeHelperReturn':helper,
      'initializationLeaves':initialization,'emittedCommand':emitted,
      'packetBoundary':'Captured emitted third argument supplied as packet+4; packet+12=0x82',
      'beforeDispatch':before,'afterDispatch':after})
print(json.dumps(report,indent=2))
