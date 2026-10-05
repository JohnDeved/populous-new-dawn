// Source guidance, not an executable tactical queue. Runtime IDs are discovered
// from the current World; all gameplay changes belong to ordinary UI inputs.
import assert from 'node:assert/strict'

const freeze = value => {
  if (value && typeof value === 'object') {
    Object.values(value).forEach(freeze)
    Object.freeze(value)
  }
  return value
}

const bridgeConditions = count => [
  { type: 'accepted-bridge-casts', count },
  { type: 'stat-at-least', stat: 'bridges', count },
  { type: 'effect-finished', kind: 'bridge' },
]
const camp = [{ type: 'completed-blue-building', kind: 'camp' }]
const warriors = [{ type: 'trained-count', kind: 'warrior', count: 5 }]

export const missionRoutes = freeze({
  1: {
    required: ['bridge-stock', 'central-bridge', 'camp-knowledge', 'camp', 'warriors',
      'lightning-stock', 'checkpoint-reloaded', 'northern-bridge', 'victory'],
    optional: [],
    conditions: {
      'bridge-stock': [{ type: 'stock-at-least', spell: 'bridge', count: 4 }],
      'central-bridge': bridgeConditions(1),
      'camp-knowledge': [{ type: 'camp-unlocked' }],
      camp,
      warriors,
      'lightning-stock': [{ type: 'stock-at-least', spell: 'lightning', count: 4 }],
      'northern-bridge': bridgeConditions(2),
    },
    guide: [
      'Select the ready Shaman and worship the current bridge shrine; await four delivered shots.',
      'Move to the southern dry shore, cast Land Bridge to the central island within current range, and await completion.',
      'Order the Shaman to the vault; let ordinary guard combat finish and reissue worship if needed. Await Warrior knowledge.',
      'Select five Braves, place a valid Camp near home, await completed construction, then order five Braves inside and await five living Warriors.',
      'Worship the lightning shrine and await four delivered shots. Use the real Save/reload/Load wrapper before the northern crossing.',
      'Move the Shaman to the central northern shore. Validate a nearer dry destination before the second Bridge cast; the historical farther target was legitimately out of range.',
      'Send the trained Warriors across using observed enemy targets; move the Shaman into current spell range for acquired Lightning. Await the real victory camera, result control and committed profile.',
    ],
    sources: [
      '4186e9d2173fb865c5663efdf7169c9ca7dd61ea:references/verification/mission-one-controls-2026-10-04/prepare-journey.mjs',
      '4186e9d2173fb865c5663efdf7169c9ca7dd61ea:references/verification/mission-one-controls-2026-10-04/explore-02/actions.jsonl',
      'app/spell-effects-runtime.ts:1139',
      'app/world-turn.ts:527',
    ],
  },
  2: {
    required: ['bridge-activated', 'camp', 'warriors', 'tornado-stock', 'checkpoint-reloaded', 'victory'],
    optional: [],
    conditions: {
      'bridge-activated': [
        { type: 'shrine-kind-used', kind: 'bridgeEffect', uses: 1 },
        { type: 'stat-at-least', stat: 'bridges', count: 1 },
        { type: 'effect-finished', kind: 'bridge' },
      ],
      camp,
      warriors,
      'tornado-stock': [{ type: 'stock-at-least', spell: 'tornado', count: 3 }],
    },
    guide: [
      'Enter only through the visible Mission 1 Continue control and await the newly bound Shaman readiness.',
      'Worship the current bridgeEffect totem with the Shaman. Observe its use, real bridge production and effect completion.',
      'Build a Camp near the starting settlement, train a finite group of five Braves, and retain other followers for construction and worship.',
      'Send two observed followers to the tornado shrine. Require accepted worship orders and two active worshippers, then await three delivered shots.',
      'Add Huts and further finite training groups only as needed for ordinary combat. Use the real Save/reload/Load wrapper after the required acquisition and training marks.',
      'Attack observed Matak buildings and followers with the army; move the Shaman into range before casting. Continue only after the actual victory and committed [1,2] profile proof.',
    ],
    sources: [
      'c94a8194efd721d47401c9f2d649e15729545dba:references/verification/mission-two-controls-2026-10-04/journey-02-recovery/explore.mjs',
      'c94a8194efd721d47401c9f2d649e15729545dba:references/verification/mission-two-controls-2026-10-04/journey-02-recovery/actions.jsonl',
      'app/world-turn.ts:918',
      'app/live-building-entry.ts:662',
    ],
  },
  3: {
    required: ['vault', 'shaman-home', 'temple', 'preacher', 'listener', 'sermon-saved',
      'sermon-cancelled', 'sermon-reloaded', 'conversion', 'erosion', 'victory'],
    optional: ['erosion-start'],
    conditions: {},
    guide: [
      'Enter only through the visible Mission 2 Continue control and rebind to its new World and scene.',
      'Reuse the ordinary vault, Shaman return, Temple construction and single-Preacher training wrappers.',
      'Prospectively declare the sermon, lock the first actually owned listener and save that live sermon through the committed Save wrapper.',
      'Cancel with an accepted ordinary move, reload the actual save, and prove conversion of that same victim in the resumed epoch.',
      'Arm the linked Erosion observer before worship; prove onset and full retirement, then finish bounded ordinary combat and committed [1,2,3] victory. Leave Continue to Mission 4 visible.',
    ],
    sources: [
      '5de3c5715f05cce509a6d7a86c2b17752aac8c2a:qa/mission-three-controls/driver.mjs',
      'app/world-initialization.ts:279',
      'app/world-turn.ts:929',
    ],
  },
})

function routeFor(level) {
  assert.ok(Number.isInteger(level) && Object.hasOwn(missionRoutes, level), `Unsupported mission ${level}`)
  return missionRoutes[level]
}

// These fixed descriptors are the entire arbitrary-mark surface. The driver
// resolves them from observed state; command files cannot supply a predicate.
// accepted-bridge-casts requires same-mission successful UI cast receipts with
// actual stock expenditure and a cast-count increment. A stats total alone is
// insufficient. trained-count counts living Blue units and requires stats.trained
// >= count; it does not assume historical spawned IDs or enemy construction stats.
export function milestoneConditions(level, name) {
  const route = routeFor(level)
  assert.ok(typeof name === 'string' && route.required.includes(name), `Unknown Mission ${level} milestone ${name}`)
  assert.ok(Object.hasOwn(route.conditions, name), `Mission ${level} ${name} requires its proof wrapper`)
  return structuredClone(route.conditions[name])
}

// Accept a complete campaign record or its explicit same-level subset. Never let
// the recurring names camp, warriors or victory borrow proof from another World.
export function validateMissionMilestones(level, milestones) {
  const route = routeFor(level)
  assert.ok(Array.isArray(milestones), 'Milestones must be an array')
  const seen = new Set()
  for (const mark of milestones) {
    assert.ok(mark && typeof mark === 'object' && !Array.isArray(mark), 'Malformed milestone')
    const owner = routeFor(mark.level)
    assert.ok([...owner.required, ...owner.optional].includes(mark.name), `Unknown Mission ${mark.level} milestone ${mark.name}`)
    const key = `${mark.level}:${mark.name}`
    assert.ok(!seen.has(key), `Duplicate Mission ${mark.level} milestone ${mark.name}`)
    seen.add(key)
  }
  const names = milestones.filter(mark => mark.level === level).map(mark => mark.name)
  let previous = -1
  for (const name of route.required) {
    const index = names.indexOf(name)
    assert.ok(index >= 0, `Missing Mission ${level} milestone ${name}`)
    assert.ok(index > previous, `Out-of-order Mission ${level} milestone ${name}`)
    previous = index
  }
  return true
}
