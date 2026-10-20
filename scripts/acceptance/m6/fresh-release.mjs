// Earned Mission 6 acceptance stage. Run through check-mission6-earned-victory.mjs.
import { outputPath } from './output-path.mjs'
import assert from 'node:assert/strict'
import { writeFileSync } from 'node:fs'
import { serialize } from 'node:v8'
import { createGameStore } from '../../../app/game-store.ts'
import { command, selectUnit, cancelInteraction, cast, tick } from '../../../app/model.ts'
import { currentPersonOrder } from '../../../app/person-orders.ts'
import { spellInRange } from '../../../app/spell-casting.ts'
import { loadSceneFixture } from '../../../tests/support/bloodlust-scene.mjs'
await loadSceneFixture()
const { skipIntroduction } = await import('../../../app/scene-camera-runtime.ts')
const { createTooltipFrame } = await import('../../../app/scene-tooltip-runtime.ts')
const store = createGameStore()
store.startMission(6)
const w = store.getWorld()
const shaman = w.units.find(u => u.team === 'blue' && u.kind === 'shaman')
const population = team => w.units.filter(u => u.team === team && u.hp > 0).length
const task = () => w.campaignAIs[3].tasks.find(t => t.flags & 1 && t.type === 20)
const summary = () => {
  const green = w.units.find(u => u.team === 'green' && u.kind === 'shaman')
  return {
    turn: w.turn,
    status: w.status,
    population: {
      blue: population('blue'),
      yellow: population('yellow'),
      green: population('green'),
    },
    shots: { ...w.shots },
    bridges: w.stats.bridges,
    task: structuredClone(task()),
    green: green && {
      id: green.id,
      hp: green.hp,
      x: green.x,
      z: green.z,
      state: green.native?.state,
      status: green.native?.commandStatus,
      order: structuredClone(green.native && currentPersonOrder(w.buildingOrders, green.native)),
      registry: !!green.native && w.objectCells.objects.get(green.id) === green.native,
    },
    blue: { id: shaman.id, hp: shaman.hp, x: shaman.x, z: shaman.z, state: shaman.native?.state },
    bridgeEffects: structuredClone(w.effects.filter(e => e.bridge)),
    bridgeProjectiles: structuredClone(w.projectiles.filter(p => p.spell === 'bridge')),
  }
}
function step() {
  tick(w, 1 / 12)
}
function log(event) {
  console.log(JSON.stringify({ event, ...summary() }))
}
function selectShaman() {
  cancelInteraction(w)
  selectUnit(w, shaman.id, false)
  assert.deepEqual(w.selected, [shaman.id])
}
for (let i = 0; i < 40 && !(w.flyby.flags & 1); i++) step()
if (w.flyby.flags & 1 && w.flyby.warmup > 0)
  skipIntroduction({ world: w, tooltipFrame: createTooltipFrame(w.cameras.elapsed), flybyCamera: { x: 0, y: 0, angle: 0, zoom: 0 }, onChange() {} })
assert.equal(w.inputMask, 0)
const vault = w.shrines.find(s => s.reward === 'convertWild')
selectShaman()
assert.ok(command(w, { ...vault, id: vault.id }))
assert.equal(currentPersonOrder(w.buildingOrders, shaman.native)?.model, 33)
log('actual Convert Vault admission')
for (let i = 0; i < 3000 && !w.shots.convertWild; i++) step()
assert.ok(w.shots.convertWild)
log('earned Convert stock')
for (let n = 0; n < 4 && w.shots.convertWild > 0; n++) {
  const wrap = v => ((((v + 128) % 256) + 256) % 256) - 128
  const wild = w.units
    .filter(
      u => u.team === 'wild' && u.hp > 0 && u.inside === null && spellInRange(w, shaman, 17, u)
    )
    .sort(
      (a, b) =>
        Math.hypot(wrap(a.x - shaman.x), wrap(a.z - shaman.z)) -
        Math.hypot(wrap(b.x - shaman.x), wrap(b.z - shaman.z))
    )[0]
  assert.ok(wild)
  const before = population('blue'),
    stock = w.shots.convertWild
  selectShaman()
  assert.ok(cast(w, 'convertWild', { x: wild.x, z: wild.z }))
  assert.equal(w.shots.convertWild, stock - 1)
  for (let i = 0; i < 1200 && population('blue') <= before; i++) step()
  assert.ok(population('blue') > before)
  console.log(
    JSON.stringify({
      event: 'actual recruitment',
      turn: w.turn,
      target: wild.id,
      before,
      after: population('blue'),
      stock: w.shots.convertWild,
    })
  )
}
writeFileSync(outputPath('fresh-after-recruitment.v8'), serialize(w))
log('ordinary recruited prefix')
