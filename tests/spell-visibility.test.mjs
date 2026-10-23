import { createCampaignFixtureStore } from './support/campaign-fixture.mjs'
import test from 'node:test'
import assert from 'node:assert/strict'
import rules from '../app/original-rules.json' with { type: 'json' }
import { chargingSpells } from '../app/mana.ts'
import { cast } from '../app/live-command.ts'
import { createWorld } from '../app/world-initialization.ts'
import { spellButton } from '../app/spell-button.ts'
import {
  spellHudButton,
  spellHudCanCharge,
  spellHudPermanent,
  spellHudRoster,
  spellHudVisibility,
  undiscoveredSpellModels,
} from '../app/spell-visibility.ts'
import { SPELLS } from '../app/world-rules.ts'

const snapshot = world =>
  spellHudRoster(world).map(({ spell, visibility }) => [spell.model, visibility])

test('fresh and later missions use the native owned/reward-source/cast-permission precedence', () => {
  for (const mission of [1, 16]) {
    const world = createWorld(mission),
      before = structuredClone(world),
      rewardModels = undiscoveredSpellModels(world),
      roster = new Map(snapshot(world)),
      player = world.manaWorld.playerTribe,
      owner = world.manaTribes[player].spellOwner

    assert.ok(rewardModels.size > 0)
    for (const spell of SPELLS) {
      const permanent = !!(world.manaWorld.spells[owner].available & (1 << spell.model)),
        stock = world.shots[spell.id] & 15,
        owned = permanent || stock > 0
      if (!owned) {
        assert.equal(
          roster.get(spell.model),
          rewardModels.has(spell.model) ? 'undiscovered' : undefined,
          `mission ${mission} model ${spell.model}`
        )
        continue
      }
      const canCast = !(world.manaWorld.gameFlags & 32)
      assert.equal(
        roster.get(spell.model),
        canCast ? 'visible' : 'visible-disabled',
        `mission ${mission} model ${spell.model}`
      )
    }
    assert.deepEqual(world, before)
  }
})

test('restart and checkpoint restore reproduce fresh Mission 1 HUD visibility', async () => {
  const store = await createCampaignFixtureStore([16]),
    fresh = snapshot(store.getWorld())
  await store.saveCheckpoint()
  assert.equal(store.startMission(16), true)
  assert.notDeepEqual(snapshot(store.getWorld()), fresh)
  assert.equal(store.loadCheckpoint(), true)
  assert.deepEqual(snapshot(store.getWorld()), fresh)
  store.restart()
  assert.deepEqual(snapshot(store.getWorld()), fresh)
})

test('owned stock wins over the mission-load discovery mask', () => {
  const world = createWorld(1),
    entry = spellHudRoster(world).find(candidate => candidate.visibility === 'undiscovered')
  assert.ok(entry)
  const { spell } = entry
  world.shots[spell.id] = 1
  assert.equal(spellHudVisibility(world, spell), 'visible')
  world.shots[spell.id] = 0
  assert.equal(spellHudVisibility(world, spell), 'undiscovered')
})

test('undiscovered art is the native HFX1056 branch and visible-disabled keeps normal art', () => {
  const mode2 = rules.spellCharging.findIndex((rule, model) => model > 0 && rule.mode === 2),
    input = {
      model: mode2,
      permanent: true,
      charging: true,
      hovered: false,
      selected: false,
      stock: 0,
      gifts: 0,
      progress: 0,
    },
    question = spellHudButton('undiscovered', input)

  assert.deepEqual(question, {
    border: 821,
    frame: 'button',
    sprites: [{ id: 1056, x: 5, y: 10 }],
    fills: [],
  })
  assert.deepEqual(spellHudButton('visible-disabled', input), spellButton(input))
})


test('normal campaign initialization removes mode-2 HDR availability before HUD discovery', () => {
  for (const mission of [1, 16, 17, 18, 19]) {
    const world = createWorld(mission)
    for (const spell of SPELLS.filter(spell => rules.spellCharging[spell.model].mode === 2)) {
      assert.equal(spellHudPermanent(world, spell), false)
      assert.equal(world.shots[spell.id], 0)
      assert.equal(spellHudVisibility(world, spell),
        undiscoveredSpellModels(world).has(spell.model) ? 'undiscovered' : 'hidden')
    }
    assert.equal(world.manaWorld.gameFlags & 256, 0)
  }
})

test('earned mode-2 stock permits selection without enabling charging, including legacy masks', () => {
  for (const [mission, id] of [[16, 'bloodlust'], [17, 'armageddon'], [18, 'armageddon'], [19, 'teleport']]) {
    for (const legacy of [false, true]) {
      const world = createWorld(mission), spell = SPELLS.find(spell => spell.id === id)
      if (legacy) world.manaWorld.spells[0].available |= 1 << spell.model
      world.shots[id] = 1
      const before = structuredClone(world)
      assert.equal(spellHudVisibility(world, spell), 'visible')
      assert.equal(spellHudCanCharge(world, spell), false)
      assert.deepEqual(world, before)
      const charging = chargingSpells(world.manaWorld, 0)
      world.manaWorld.spells[0].available &= ~(1 << spell.model)
      assert.deepEqual(chargingSpells(world.manaWorld, 0), charging)
      if (legacy) world.manaWorld.spells[0].available |= 1 << spell.model
      world.shots[id] = 0
      const shaman = world.units.find(unit => unit.team === 'blue' && unit.kind === 'shaman')
      assert.equal(cast(world, id, shaman), false, 'zero stock cannot cast, including legacy availability')
      assert.equal(world.shots[id], 0)
      world.manaWorld.gameFlags = 256
      assert.equal(spellHudCanCharge(world, spell), true)
    }
  }
})

test('earned mode-2 stock and legacy ownership survive save/load unchanged; restart uses new startup', async () => {
  const store = await createCampaignFixtureStore([18, 19])
  assert.equal(store.startMission(18), true)
  store.change(world => {
    world.shots.armageddon = 1
    world.manaWorld.spells[0].available |= 1 << 18
  })
  const spell = SPELLS.find(spell => spell.id === 'armageddon'),
    before = structuredClone(store.getWorld())
  await store.saveCheckpoint()
  assert.equal(store.startMission(19), true)
  assert.equal(store.loadCheckpoint(), true)
  assert.equal(spellHudVisibility(store.getWorld(), spell), 'visible')
  assert.equal(store.getWorld().shots.armageddon, before.shots.armageddon)
  assert.deepEqual(store.getWorld().manaWorld, before.manaWorld)
  store.restart()
  assert.equal(store.getWorld().shots.armageddon, 0)
  assert.equal(spellHudPermanent(store.getWorld(), spell), false)
  assert.equal(spellHudVisibility(store.getWorld(), spell), 'undiscovered')
})
