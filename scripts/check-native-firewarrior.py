"""Compare the bounded live Firewarrior contract with the verified native probe.
Usage: python3 scripts/check-native-firewarrior.py /path/to/d3dpoptb.exe
"""
import subprocess
import sys
from pathlib import Path

root = Path(__file__).resolve().parents[1]
executable = Path(sys.argv[1])
oracle = root / ".tools/decomp/oracle/bin/python"
subprocess.run([oracle, root / "scripts/probe-native-firewarrior.py", executable], check=True)

browser = r"""
import assert from 'node:assert/strict';
import {createWorld,addBuilding,addUnit,tick} from './app/model.ts';
import {firewarriorCooldown,firewarriorRange,launchFirewarrior,stepFirewarriorShots} from './app/firewarrior.ts';
import {buildingAdmission} from './app/live-building-entry.ts';
import {worldTooltipObject} from './app/tooltips.ts';
const w=createWorld(1);w.units=[];w.effects=[];
const source=addUnit(w,'blue','firewarrior',{x:0,z:0}),target=addUnit(w,'red','brave',{x:8,z:0});
launchFirewarrior(w,source,target);
assert.equal(firewarriorRange,11);assert.equal(firewarriorCooldown,25/12);assert.equal(source.cooldown,25/12);
const shots=w.effects.filter(f=>f.firewarriorShot);assert.equal(shots.length,2);
assert.ok(shots.every(f=>f.sprite?.sequence==='blastShot'&&f.sprite.fixed&&f.firewarriorShot?.source===source.id&&f.firewarriorShot.target===target.id));
const initial={x:shots[0].x,z:shots[0].z,height:shots[0].height};
shots[0].height=100;stepFirewarriorShots(w);assert.ok(shots[0].height>80);
Object.assign(shots[0],initial);shots[0].firewarriorShot.remaining=16;
for(let turn=0;turn<16&&w.effects.some(f=>f.firewarriorShot&&f.duration===Infinity);turn++)tick(w,1/12);
assert.equal(target.hp,30);assert.ok(w.effects.some(f=>f.kind==='hit'));
const school=addBuilding(w,'blue','firewarriorHut',{x:4,z:4}),trainee=addUnit(w,'blue','brave',{x:4,z:4});
trainee.inside=school.id;school.admission=undefined;
const admission=buildingAdmission(w,school);assert.ok(admission.activity&128);assert.ok(admission.trainingCost>0);
assert.equal(worldTooltipObject(w,school.id)?.model,8);
"""
subprocess.run(["npx", "tsx", "-e", browser], cwd=root, check=True)
print("PASS: native/live Firewarrior shot path, school restore and tooltip identity")
