import assert from 'node:assert/strict'
import test from 'node:test'
import { createWorld, tick } from '../app/model.ts'
import { unitAnimationSource } from '../app/unit-animation-source.ts'

const person = u => unitAnimationSource(u) ?? u.native
const recruits = [9, 1097, 1098, 1118, 1139]
const byId = (w,id) => w.units.find(u => u.id === id)
const order = u => person(u)?.computerAssignment ?? 0

test('authored Mission 6 raid stamps its own recruits, then dispatch releases only the owning slot', () => {
  const w = createWorld(6, 'scalable')
  for (let i = 0; i < 6776 && w.turn < 6776 && w.status === 'playing'; i++) {
    const before = w.turn
    tick(w, 1/12)
    assert.equal(w.turn, before + 1, 'natural raid setup must advance each visit')
  }
  assert.equal(w.turn, 6776)
  const ai = w.campaignAIs[3]
  const task = ai.tasks[1]
  assert.deepEqual([task.flags & 1, task.type, task.phase], [1, 20, 3])
  assert.ok(recruits.every(id => order(byId(w,id)) === 0))
  tick(w, 1/12)
  assert.equal(w.turn, 6777)
  assert.deepEqual([task.flags & 1, task.phase], [1, 4])
  assert.deepEqual([...task.members].sort((a,b)=>a-b), recruits)
  const cohort = recruits.map(id => byId(w,id))
  for (const u of cohort) {
    const p = person(u)
    assert.equal(u.team,'green')
    assert.equal(p.state,14)
    assert.equal(w.objectCells.objects.get(u.id),p)
    assert.equal(p.computerAssignment,2, 'natural recruitment ownership')
  }

  // Controlled retirement: keep actual dispatcher and the exact authored cohort.
  // Register independent same-tribe and cross-tribe ownership-vs-color controls.
  const control = w.units.find(u => u.team === 'green' && !recruits.includes(u.id) && u.hp > 0 && person(u) && !order(u))
  const other = w.units.find(u => u.team === 'yellow' && u.hp > 0 && person(u) && !order(u))
  assert.ok(control && other)
  person(control).computerAssignment = 7
  person(other).computerAssignment = 2
  for (const u of [...cohort,control,other]) {
    u.nativeFlags7f = 0xab
    person(u).flags3 |= 0x2000
  }
  task.phase = 23
  for (let i = 0; i < 13 && (task.flags & 1) && w.turn < 6790; i++) {
    const before = w.turn
    tick(w, 1/12)
    assert.equal(w.turn, before + 1, 'controlled retirement must advance each visit')
  }
  assert.equal(task.flags & 3,0)
  assert.equal(task.phase, 23)
  assert.deepEqual(task.members, [])
  for (const u of cohort) {
    const p = person(u)
    assert.equal(w.objectCells.objects.get(u.id),p)
    assert.equal(p.computerAssignment,0,'dispatch ownership retirement')
    assert.equal(u.nativeFlags7f,0xaa,'preserve +7f upper bits')
    assert.equal(p.flags3 & 0x2000,0,'retirement clears the combat reservation bit')
  }
  for(const [u,owner] of [[control,7],[other,2]]) {
    assert.equal(person(u).computerAssignment,owner)
    assert.equal(u.nativeFlags7f,0xab)
    assert.equal(person(u).flags3 & 0x2000,0x2000)
  }
})
