import fs from 'node:fs'
import assert from 'node:assert/strict'
const source=fs.readFileSync(new URL('./check-browser-spy-combat-lifecycle.mjs',import.meta.url),'utf8')
const part=source.slice(source.indexOf('async function ordinaryEncounter'))
const callback=part.slice(part.indexOf('    async ({ spyId'),part.indexOf('\n    { spyId, schoolId, targetId }')).trim().replace(/,$/,'').replace("await import('/app/model.ts')",'({ tick: testTick })')
function run(mode){
  const w={turn:0,status:'playing',selected:[],units:[{id:1,hp:30,native:{disguise:64}}]}
  function testTick(w){
    w.turn++
    const s=w.units.find(x=>x.id===1)
    if(w.turn<=4){
      s.native={state:25,disguise:0}
      if(mode!=='noFightDeath' && (mode!=='delayed'||w.turn>=2)) s.fight={opponent:185,motion:{state:29,disguise:0}}
      w.units=w.units.filter(x=>x.id===1)
      if(w.turn<4) w.units.push({id:185,hp:10})
      // clicked186 is absent from first tick: it cannot finish encounter.
      if(mode==='noFightDeath'&&w.turn===3) s.hp=0
      if(w.turn===4) s.fight=undefined
    }
  }
  const window={testStore:{getWorld:()=>w}}
  return eval('('+callback+')')({spyId:1,schoolId:9,targetId:186})
}
for(const mode of ['immediate','delayed']){
 const r=await run(mode)
 assert.equal(r.outcome.turn,4)
 assert.equal(r.encounteredOpponentId,185)
 assert.equal(r.clickedTargetId,186)
 assert.equal(r.cleanup.enemyAlive,false)
}
const r=await run('noFightDeath')
assert.equal(r.outcome.turn,3)
assert.equal(r.outcome.spyAlive,false)
assert.equal(r.encounteredOpponentId,null)
console.log('PASS: 3 synthetic checker-callback scenarios; not gameplay/browser evidence')
