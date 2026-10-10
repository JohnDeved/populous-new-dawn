import { hudTaskPeople } from '../../app/follower-tasks-runtime.ts'
import { hudPeople } from '../../app/selection-runtime.ts'
import { followerTaskCounts } from '../../app/hud-tasks.ts'
import { population, populationLimit } from '../../app/model.ts'
import { followerNumber } from '../../app/hud-population.ts'
import art from '../../app/original-hud.json' with { type: 'json' }

export const nearbyLabels = Object.freeze({
  toggle: 'Nearby followers',
  classes: ['Select follower', 'Select brave', 'Select warrior', 'Select firewarrior', 'Select preacher', 'Select spy'],
  models: [0, 2, 3, 6, 4, 5],
  tasks: ['Currently selected', 'Idle', 'Housed', 'Busy'],
  kinds: ['Followers', 'Braves', 'Warriors', 'Firewarriors', 'Preachers', 'Spies'],
})
const peopleCopy = people => people.map(({ source, ...person }) => person)

// No selection helper executes here; those helpers write even their projected
// person records. Only detached scalar records leave this read-only boundary.
export function nearbyCheckpointState({ world }) {
  return {
    level: world.outcome.level, turn: world.turn, paused: world.paused,
    flags: world.castingTribes[0].flags, selected: [...world.selected],
    blue: world.units.filter(u => u.team === 'blue' && u.hp > 0)
      .map(u => ({ id: u.id, kind: u.kind, hp: u.hp, x: u.x, z: u.z, inside: u.inside })),
  }
}

export function nearbySnapshot(scene, store) {
  const world = scene.world
  if (!scene.isCurrent() || world !== store.getWorld()) throw Error('Current nearby snapshot owner required')
  const people = peopleCopy(hudTaskPeople(world)), center = { ...scene.cameraPosition },
    nearby = !!(world.castingTribes[0].flags & 128),
    global = followerTaskCounts(people, center, false), local = followerTaskCounts(people, center, true)
  if (!global.displayTotals || !local.displayTotals)
    throw Error('Reviewed nearby persistent-count integration is unavailable')
  return {
    ...nearbyCheckpointState({ world }), nearby, center, speed: world.speed,
    status: world.status, inputMask: world.inputMask,
    overview: !!(scene.overviewActive || scene.overviewStage),
    people, classPeople: peopleCopy(hudPeople(world)), global, local,
    population: population(world, 'blue'), capacity: populationLimit(world, 'blue'),
    focus: [...scene.hudFocus], taskFocus: [...scene.hudTaskFocus],
    panels: [...scene.objectPanels.panels.keys()],
  }
}

const sprite = id => {
  const rect = art.rects[id]
  if (!rect) throw Error(`Canonical nearby HFX${id} is unavailable`)
  return { position: `${-rect.x}px ${-rect.y}px`, width: `${rect.w}px`, height: `${rect.h}px` }
}
const readSprite = node => node ? {
  position: node.style.backgroundPosition, width: node.style.width, height: node.style.height,
} : null
const readNumber = button => {
  const value = button.querySelector('.follower-number')
  return value ? { count: Number(value.getAttribute('aria-label')),
    glyphs: [...value.querySelectorAll('.hud-sprite')].map(readSprite) } : null
}
const expectedNumber = (count, total, alternate) => ({
  count, glyphs: followerNumber(count, total, alternate).ids.map(sprite),
})

// DOM commitment is observed separately from the synchronous command return.
export function nearbySurface(document, state, { pressed = false } = {}) {
  const one = (selector, label) => {
    const found = [...document.querySelectorAll(selector)]
      .filter(node => node.getAttribute('aria-label') === label)
    if (found.length !== 1) throw Error(`Expected one public ${label} control; found ${found.length}`)
    return found[0]
  }
  const toggle = one('button', nearbyLabels.toggle), active = state.nearby,
    counts = active ? state.local : state.global,
    classes = nearbyLabels.classes.map((label, index) => {
      const button = one('.tribe-classes button', label), model = nearbyLabels.models[index],
        enabled = model === 0 || state.global.totals[model] > 0
      return { label, disabled: button.disabled, expectedDisabled: !enabled,
        number: readNumber(button), expected: enabled
          ? expectedNumber(counts.displayTotals[model], model === 0, active) : null }
    }),
    tasks = nearbyLabels.tasks.flatMap((row, rowIndex) => nearbyLabels.kinds.map((kind, column) => {
      const label = `${row} ${kind}`, button = one('.follower-tasks button', label),
        model = nearbyLabels.models[column]
      return { label, disabled: button.disabled,
        expectedDisabled: model !== 0 && state.global.totals[model] === 0,
        number: readNumber(button), expected: expectedNumber(counts.tasks[model][rowIndex + 1], false, active) }
    }))
  const meter = one('[role="meter"]', 'Population capacity')
  const bounds = node => {
    const r = node.getBoundingClientRect()
    return { x: r.x, y: r.y, width: r.width, height: r.height }
  }
  return {
    toggle: { pressed: toggle.getAttribute('aria-pressed'), disabled: toggle.disabled,
      sprite: readSprite(toggle.querySelector('.hud-sprite')),
      expectedSprite: sprite(875 + Number(active) * 2 + Number(pressed)) },
    meter: meter.getAttribute('aria-valuetext'),
    expectedMeter: `${state.population} of ${state.capacity}`, classes, tasks,
    layout: {
      viewport: [document.documentElement.clientWidth, document.documentElement.clientHeight],
      dpr: document.defaultView.devicePixelRatio, toggle: bounds(toggle),
      sprite: bounds(toggle.querySelector('.hud-sprite')),
      controls: [...document.querySelectorAll('.tribe-classes button,.follower-tasks button')].map(bounds),
    },
  }
}

export function nearbySurfaceMatches(state, surface) {
  return surface.toggle.pressed === String(state.nearby) && !surface.toggle.disabled &&
    JSON.stringify(surface.toggle.sprite) === JSON.stringify(surface.toggle.expectedSprite) &&
    surface.meter === surface.expectedMeter && surface.classes.length === 6 && surface.tasks.length === 24 &&
    [...surface.classes, ...surface.tasks].every(row => row.disabled === row.expectedDisabled &&
      JSON.stringify(row.number) === JSON.stringify(row.expected))
}
