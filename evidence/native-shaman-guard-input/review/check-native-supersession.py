"""Bounded original G then ordinary replacement caller, no physics/OS.
Uses accepted baseline fixtures/leaves. Adds only acknowledgment/UI leaf00436330.
"""
import contextlib,hashlib,io,json,runpy,sys
from pathlib import Path
from unicorn import UC_HOOK_CODE
from unicorn.x86_const import UC_X86_REG_ESP,UC_X86_REG_EIP,UC_X86_REG_EAX
base=Path(sys.argv[2])/'work/orchestration/native-guard-lifecycle-20261005/probe-guard-lifecycle.py';o=io.StringIO()
assert hashlib.sha256(base.read_bytes()).hexdigest()=='7f6ad6a478db9138af4b5ff3d69b612969c5dcc8365ec324309d18771ec77064'
with contextlib.redirect_stdout(o):b=runpy.run_path(str(base))
assert hashlib.sha256(o.getvalue().encode()).hexdigest()=='7c7d6eff380665b6240822b29e38e9eff47de1c1a4c8855b58b4b5c71bde3711'
cpu,write,read,call,fixture,snap=[b[k] for k in ['cpu','write','read','call','fixture','snap']];p,tribe,packet=[b[k] for k in ['p','tribe','packet']]
def ack(c,a,size,u):
 sp=c.reg_read(UC_X86_REG_ESP);c.reg_write(UC_X86_REG_EAX,0);c.reg_write(UC_X86_REG_EIP,read(sp,'I'));c.reg_write(UC_X86_REG_ESP,sp+4)
cpu.hook_add(UC_HOOK_CODE,ack,begin=0x436330,end=0x436330)
rows=[]
for guard in [False,True]:
 fixture();write(0x895da8,'I',0x10040)
 if guard:call(0x443b40,0,1)
 write(packet+4,'IIB',3,0x2020|0x20000,0x57)
 b['events'].clear();call(0x444f60,tribe,packet)
 events=[{'name':e['name'],'status':e['before']['status'],'currentModel':e['before']['orders'][e['before']['commands'][0]]['model']} for e in b['events'] if not e.get('supplied')]
 after=snap();b['events'].clear();call(0x4d42a0,p)
 rows.append({'guardBeforeMove':guard,'afterReplacement':after,'replacementEvents':events,'afterNextPreparation':snap(),'nextEvents':[e['name'] for e in b['events']]})
assert all(e['currentModel']!=30 for r in rows for e in r['replacementEvents'] if e['name']=='configure-order')
assert rows[1]['afterReplacement']['flags2']&16
assert not rows[0]['afterReplacement']['flags2']&16
assert 'configure-order' in rows[1]['nextEvents'] and 'configure-order' not in rows[0]['nextEvents']
print(json.dumps({'identity':b['identity'],'addedLeaf':'00436330 acknowledgment','scriptSha256':hashlib.sha256(Path(__file__).read_bytes()).hexdigest(),'cases':rows},indent=2))
