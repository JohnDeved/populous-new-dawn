import test from 'node:test'
import assert from 'node:assert/strict'
import rules from '../app/original-rules.json' with { type: 'json' }
import { createGameStore } from '../app/game-store.ts'
import { createWorld } from '../app/world-initialization.ts'
import { spellButton } from '../app/spell-button.ts'
import {
  spellHudButton,
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
      const rule = rules.spellCharging[spell.model],
        canCast =
          !(world.manaWorld.gameFlags & 32) &&
          (rule.mode !== 2 || !!(world.manaWorld.gameFlags & 256))
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
  const store = createGameStore(),
    fresh = snapshot(store.getWorld())
  await store.saveCheckpoint()
  store.startMission(16)
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
