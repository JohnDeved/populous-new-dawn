import hashlib,json,os,subprocess,sys
from pathlib import Path
root=Path.cwd();folder=Path('work/orchestration/final-e989-01');profile=folder/'profile.json';p=json.loads(profile.read_text())
assert hashlib.sha256(profile.read_bytes()).hexdigest()=='c71c6f62daee5f7e50067c099d6673456f1936890c4df0a7a7b85898c825a659'
def verify():
 assert subprocess.check_output(['git','rev-parse','HEAD'],text=True).strip()==p['source']
 assert not subprocess.check_output(['git','status','--porcelain'],text=True).strip()
 assert (os.stat('node_modules').st_dev,os.stat('node_modules').st_ino)==(p['dependencyDevice'],p['dependencyInode'])
 assert sorted(str(f) for f in Path('tests').glob('*.test.mjs'))==p['standardTestFiles']
 for f,h in {**p['inputs'],**p['testInputs']}.items():assert hashlib.sha256(Path(f).read_bytes()).hexdigest()==h,f
verify()
for stage in p['stages']:
 verify();name=stage['name'];output=folder/(name+'.json');assert not output.exists(),output
 private=folder/(name+'.private');private.mkdir()
 env={**os.environ,**p['offlineEnv']}
 for variable,suffix in [('TMPDIR','tmp'),('XDG_CACHE_HOME','xdg'),('npm_config_cache','npm'),('NODE_COMPILE_CACHE','node')]:
  value=private/suffix;value.mkdir();env[variable]=str(value.resolve())
 inputs=list(p['inputs'])+stage.get('files',[])+[str(profile),str(folder/'run-profile.py')]
 cmd=['timeout','--signal=TERM','--kill-after=5s',str(p['outerSeconds'])+'s','node',p['wrapper'],'--output',str(output)]
 for f in inputs:cmd+=['--input',f]
 cmd+=['--']+stage['command']
 print('START '+name,flush=True)
 with (folder/(name+'.wrapper.log')).open('x') as log:result=subprocess.run(cmd,env=env,stdout=log,stderr=subprocess.STDOUT)
 if not output.exists():print('UNKNOWN '+name,flush=True);sys.exit(1)
 receipt=json.loads(output.read_text());print(json.dumps({'stage':name,'wrapperExit':result.returncode,'status':receipt['status'],'startedAt':receipt['startedAt'],'finishedAt':receipt.get('finishedAt'),'exitCode':receipt.get('exitCode')}),flush=True)
 if result.returncode or receipt['status']!='passed' or receipt.get('source')!=receipt.get('sourceAfter'):sys.exit(1)
verify();print('ALL_STAGES_TERMINAL_PASS',flush=True)
