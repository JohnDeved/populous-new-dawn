exec(compile(open('/tmp/populous-route-blend-review-20261021/audit_static.py').read().split('results=[]; selected=set()')[0], 'audit_static.py', 'exec'))
source=json.loads((P/'source-data.json').read_text())
roots=[int(x,16) for x in source['callbacks'] if int(x,16)]+[0x4a1720,0x525bd0]
funcs={}; allnodes=set()
def function_cfg(root):
 todo=[root]; seen=set();calls=set();indirect=[]
 while todo:
  a=todo.pop()
  if a in seen:continue
  seen.add(a)
  if a not in ins:indirect.append([hex(a),'unmapped']);continue
  op,operand,nxt,line=ins[a]
  if op.startswith('ret') or op in ('int3','ud2'):continue
  if op=='call':
   m=re.match(r'0x([0-9a-f]+)$',operand)
   if m:calls.add(int(m[1],16))
   else:indirect.append([hex(a),'call '+operand])
  if op.startswith('j') or op.startswith('loop'):
   m=re.match(r'0x([0-9a-f]+)$',operand)
   if m:todo.append(int(m[1],16))
   else:indirect.append([hex(a),op+' '+operand]);continue
   if op=='jmp':continue
  todo.append(nxt)
  if len(seen)>30000:raise RuntimeError('broad '+hex(root))
 return seen,calls,indirect
queue=roots[:]
while queue:
 root=queue.pop()
 if root in funcs:continue
 nodes,calls,indirect=function_cfg(root);allnodes|=nodes
 funcs[root]={'calls':list(map(hex,sorted(calls))),'indirect':indirect,'nodes':len(nodes)}
 queue+=list(calls)
 if len(funcs)>1000:raise RuntimeError('broad funcs')
writes=[ins[a][3] for a in sorted(allnodes) if a in ins and '0x5da074,' in ins[a][1] and ins[a][0] in ('or','and','mov')]
result={'roots':list(map(hex,roots)),'function_count':len(funcs),'instruction_count':len(allnodes),'flag_writes':writes,'functions':{hex(k):v for k,v in sorted(funcs.items())}}
(P/'callback-direct-closure.json').write_text(json.dumps(result,indent=2)+'\n')
print(json.dumps({k:v for k,v in result.items() if k!='functions'},indent=2));print('indirect',json.dumps({hex(k):v['indirect'] for k,v in funcs.items() if v['indirect']},indent=2))
