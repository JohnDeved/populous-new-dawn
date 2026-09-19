import rules from './original-rules.json' with { type: 'json' }
import hud from './original-hud.json' with { type: 'json' }
import { missionData } from './mission-data.ts'
import { spellButton } from './spell-button.ts'
import { SPELLS } from './world-rules.ts'
import type { World } from './world-types.ts'

export type SpellHudVisibility = 'hidden' | 'undiscovered' | 'visible-disabled' | 'visible'

type SpellDescriptor = (typeof SPELLS)[number]
type VisibilityWorld = Pick<World, 'manaWorld' | 'manaTribes' | 'shots' | 'outcome'>
type SpellButtonInput = Parameters<typeof spellButton>[0]

const questionRect = (hud.rects as Record<string, { x: number; y: number; w: number; h: number }>)[
  '1056'
]

if (!questionRect) throw new Error('Original undiscovered spell sprite 1056 is unavailable')

// 0x42cbc0, called once during normal level initialization: collect every
// class-6/model-2 spell-reward source whose settings mode is 11.
export function undiscoveredSpellModels(world: Pick<World, 'outcome'>) {
  const models = new Set<number>()
  for (const object of missionData(world.outcome.level).level.objects)
    if (object.type === 6 && object.model === 2 && object.settings?.[0] === 11)
      models.add(object.settings[1])
  return models
}

// 0x4c3110 -> 0x4c31e0 precedence, with 0x49e650/0x4c2ca0 click permission
// kept separate from visual ownership/discovery.
export function spellHudVisibility(
  world: VisibilityWorld,
  spell: SpellDescriptor,
  undiscovered = undiscoveredSpellModels(world)
): SpellHudVisibility {
  const tribe = world.manaWorld.playerTribe,
    owner = world.manaTribes[tribe]?.spellOwner ?? tribe,
    stock = world.shots[spell.id] & 15,
    permanent = !!(world.manaWorld.spells[owner]?.available & (1 << spell.model))
  if (!permanent && !stock) return undiscovered.has(spell.model) ? 'undiscovered' : 'hidden'

  const rule = rules.spellCharging[spell.model],
    canCast =
      !(world.manaWorld.gameFlags & 32) && (rule.mode !== 2 || !!(world.manaWorld.gameFlags & 256))
  return canCast ? 'visible' : 'visible-disabled'
}

export function spellHudRoster(world: VisibilityWorld) {
  const undiscovered = undiscoveredSpellModels(world)
  return SPELLS.map(spell => ({
    spell,
    visibility: spellHudVisibility(world, spell, undiscovered),
  })).filter(entry => entry.visibility !== 'hidden')
}

// 0x49daf0 state 4: permanent-border table, HFX1056 centered at the
// logical 31x43 spell-control size, with no stock markers or charge fill.
export function spellHudButton(visibility: SpellHudVisibility, input: SpellButtonInput) {
  if (visibility !== 'undiscovered') return spellButton(input)
  return {
    border: 821,
    frame: 'button',
    sprites: [
      {
        id: 1056,
        x: 15 - Math.trunc(questionRect.w / 2),
        y: 21 - Math.trunc(questionRect.h / 2),
      },
    ],
    fills: [],
  }
}
