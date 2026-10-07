from pathlib import Path
import hashlib,json,shutil
root=Path.cwd();out=root/'work/orchestration/preacher-raid-regressions-20261006'
game=(root/'tests/game.test.mjs').read_text();m2=(root/'tests/mission2-raid.test.mjs').read_text()
names=['mission-one Dakini launches its native attack route when Blue enters marker three','mission-one Dakini launches its later building attack when Blue overwhelms it','Mission 2 naturally earns Matak kills and launches the organized raid']
def section(text,name):
 start=text.index("test('"+name+"'");end=text.find('\ntest(',start+1)
 return text[start:end if end!=-1 else len(text)]
prefix=game[:game.index("test('")].replace("import test from 'node:test';","import { test, observeTick } from './observer.mjs';").replace(' tick,',' tick as underlyingTick,').replace("'./level-start-fixture.mjs'","'../../../tests/level-start-fixture.mjs'").replace("'../app/","'../../../app/")
prefix+='\nfunction tick(w,dt){return observeTick(underlyingTick,w,dt)}\n'
prefix+=next(line for line in game.splitlines() if line.startswith('function until('))+'\n'
scenarios=[section(game,names[0]),section(game,names[1]),section(m2,names[2])]
(out/'mission1.mjs').write_text(prefix+'\n'.join(s.replace("'../app/","'../../../app/") for s in scenarios[:2]))
prefix=m2[:m2.index("test('")].replace("import test from 'node:test'","import { test, observeTick } from './observer.mjs'").replace('  tick,','  tick as underlyingTick,').replace("'../app/","'../../../app/")
prefix+='\nfunction tick(w,dt){return observeTick(underlyingTick,w,dt)}\n'
(out/'mission2.mjs').write_text(prefix+scenarios[2].replace("'../app/","'../../../app/"))
for index,scenario in enumerate(scenarios): (out/f'case-{index+1}-source.txt').write_text(scenario)
(out/'cases.json').write_text(json.dumps({'names':names,'count':3,'sourceFiles':{'tests/game.test.mjs':hashlib.sha256(game.encode()).hexdigest(),'tests/mission2-raid.test.mjs':hashlib.sha256(m2.encode()).hexdigest()},'transform':'Original imports/scenarios; only relative import relocation, node:test registration and read-only post-tick alias; assertions/setup unchanged','scenarioHashes':[hashlib.sha256(s.encode()).hexdigest() for s in scenarios]},indent=2)+'\n')
