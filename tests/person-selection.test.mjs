import test from 'node:test'
import assert from 'node:assert/strict'
import {clickPersonSelection, selectedPersonVoice} from '../app/person-selection.ts'
import {createWorld, addUnit, selectUnit, setSelection, command, tick} from '../app/model.ts'

test('ordinary clicks replace only new selections; Ctrl toggles and blocked clicks preserve the group', () => {
 const people=[1,2,3].map(id=>({id,selectionFlags:1,flags3:0x90000080,flags4:0}))
 const ids=()=>people.filter(p=>p.selectionFlags&128).map(p=>p.id)
 assert.equal(clickPersonSelection(people,1,false),true)
 assert.deepEqual(ids(),[1]);assert.equal(people[0].flags3,0x80000000)
 clickPersonSelection(people,2,true);assert.deepEqual(ids(),[1,2])
 assert.equal(clickPersonSelection(people,1,false),false);assert.deepEqual(ids(),[1,2])
 people[2].flags4=128
 assert.equal(clickPersonSelection(people,3,false),false);assert.deepEqual(ids(),[1,2])
 clickPersonSelection(people,1,true);assert.deepEqual(ids(),[2])
 assert.equal(people[0].selectionFlags,1,'click toggling preserves the previous-selection bit')
 people[2].flags4=0x800
 clickPersonSelection(people,3,false);assert.deepEqual(ids(),[3])
 assert.deepEqual([2,3,4,5,6,7].map(selectedPersonVoice),[0x58,0x58,0x57,0x56,0x58,0x18])
})

test('selection never creates a simulation owner or interrupts existing group orders', () => {
 const w=createWorld();w.units=[];w.buildings=[];w.shrines=[];w.trees=[];w.manaWorld.gameFlags=32
 w.terrain.fill(3);w.terrainVersion++
 for(let i=0;i<3;i++)addUnit(w,'blue',i===2?'warrior':'brave',{x:-25+i*.5,z:8})
 const [a,b,c]=w.units,legacy=structuredClone(w.units)
 selectUnit(w,a.id,false);selectUnit(w,b.id,true);selectUnit(w,c.id,true)
 assert.deepEqual(w.units,legacy,'clicks must not attach native movement records to legacy units')
 assert.equal(w.sounds.at(-1).cue,0x58)
 const sounds=w.sounds.length;selectUnit(w,a.id,false);assert.equal(w.sounds.length,sounds)
 command(w,{x:30,z:8});for(let i=0;i<30;i++)tick(w,1/12)
 const before=structuredClone(w.units),orders=structuredClone(w.buildingOrders),rng=w.randomState
 selectUnit(w,b.id,true)
 before[1].native.selectionFlags&=~128;before[1].native.flags3=(before[1].native.flags3&~128)>>>0
 assert.deepEqual(w.units,before);assert.deepEqual(w.buildingOrders,orders);assert.equal(w.randomState,rng)
 setSelection(w,[a.id,b.id,c.id])
 for(let i=0;i<340;i++)tick(w,1/12)
 assert.ok(w.units.every(u=>u.native.state===19&&u.x>25))
})

test('all native single/group selection voices and pointer acknowledgements are ready before audio activation', async () => {
 const { selectedGroupVoices, SELECTION_CUES } = await import('../app/person-selection.ts')
 const { AUDIO_CUES, cueVariant } = await import('../app/audio.ts')
 const { default: sounds } = await import('../app/original-sound.json', { with: { type: 'json' } })
 const { statSync } = await import('node:fs')
 const emitted = new Set([0x6a])
 for(const model of [2,3,4,5,6,7]) {
  emitted.add(selectedPersonVoice(model))
  for(const count of [1,2,3,4,5,200]) for(const cue of selectedGroupVoices(Array(count).fill(model))) emitted.add(cue)
 }
 assert.deepEqual(selectedGroupVoices([2,3,6,4,4,5,5,5,7]),[0x47,0x49,0x18,0x44])
 assert.deepEqual(selectedGroupVoices([]),[])
 assert.deepEqual(new Set(SELECTION_CUES),new Set([...emitted].filter(c=>c!==0x6a)))
 for(const cue of emitted) {
  assert.ok(AUDIO_CUES.includes(cue),`selection cue ${cue} is preloaded`)
  assert.ok(cueVariant(cue,1))
  for(const sample of sounds.cues[cue].samples)
   assert.ok(statSync(new URL(`../public/original/audio/${sounds.cues[cue].bank}-${sample}.wav`,import.meta.url)).size>44)
 }
})
