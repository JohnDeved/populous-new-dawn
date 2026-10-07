from pathlib import Path
import ast,hashlib,json,subprocess
root=Path.cwd();out=root/'work/orchestration/preacher-raid-regressions-20261006';manifest=json.loads((out/'preflight.json').read_text())
assert subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip()==manifest['sourceHead']
assert not subprocess.check_output(['git','status','--porcelain'],text=True)
for row in manifest['files']+manifest['tools']:
 p=Path(row['path']);p=p if p.is_absolute() else root/p
 assert hashlib.sha256(p.read_bytes()).hexdigest()==row['sha256'],row['path']
for p in ['guardian.py','prepare-source.py']:ast.parse((out/p).read_text())
for p in ['observer.mjs','mission1.mjs','mission2.mjs','diagnostic.mjs','closure-host.mjs']:
 subprocess.run([manifest['node'],'--check',str(out/p)],check=True)
cases=json.loads((out/'cases.json').read_text());assert len(cases['names'])==3
for i,name in enumerate(cases['names']):
 p=root/('tests/game.test.mjs' if i<2 else 'tests/mission2-raid.test.mjs');text=p.read_text();start=text.index("test('"+name+"'");end=text.find('\ntest(',start+1);body=text[start:end if end!=-1 else len(text)]
 assert body==(out/f'case-{i+1}-source.txt').read_text();assert body.replace("'../app/","'../../../app/") in (out/('mission1.mjs' if i<2 else 'mission2.mjs')).read_text()
assert not (out/'trace.jsonl').exists()
print('PASS: three exact maintained cases, source/tool hashes, Python AST and five Node syntax checks; no app/native execution or package access')
