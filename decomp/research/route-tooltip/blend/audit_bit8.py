"""Local static branch audit for bit8 writers reached in the callback direct-call graph."""
from pathlib import Path
p=Path('/tmp/populous-route-blend-review-20261021/audit_static.py')
s=p.read_text().split('results=[]; selected=set()')[0]
s=s.replace("operand.endswith('0x5da074,0xffffffef')", "operand.endswith('0x5da074,0xfffffff7')")
exec(compile(s,str(p),'exec'))
c=json.loads((P/'callback-direct-closure.json').read_text())
sets=[int(line.split(':')[0],16) for line in c['flag_writes'] if 'or ' in line and line.endswith('0x5da074,0x8')]
results=[];selected=set()
for a in sets:
 r,nodes=local_until_clear(a,'bit8');results.append(r);selected|=nodes
(P/'callback-bit8-closure.json').write_text(json.dumps(results,indent=2)+'\n')
(P/'callback-bit8-closure.asm').write_text('\n'.join(ins[a][3] for a in sorted(selected))+'\n')
print(json.dumps({'results':len(results),'uncleared_exits':sum(len(x['uncleared_exits']) for x in results)}))
