import type { GameScene } from './scene.ts'
import { buildingModel, type Building } from './model.ts'
import rules from './original-rules.json' with { type: 'json' }
import { drawOccupantPanel, paintPanel } from './training-panel.ts'
import { constructionPanel } from './construction-panel.ts'
import { selectBuildingOccupants, dismantleBuilding } from './live-building-entry.ts'
import { nativeUnitModel } from './unit-kinds.ts'

function createPanel(scene: GameScene, b: Building) {
  const panel = document.createElement('div')
  panel.className = 'training-panel'
  panel.setAttribute('role', 'group')
  const canvas = document.createElement('canvas')
  canvas.setAttribute('aria-hidden', 'true')
  panel.appendChild(canvas)
  for (let i = 0; i < rules.buildingMaxWorkers[buildingModel(b)]; i++) {
    const button = document.createElement('button')
    button.type = 'button'
    button.addEventListener('click', event => {
      if (scene.world.inputMask || scene.overviewActive) return
      selectBuildingOccupants(scene.world, b, Number(button.dataset.person), event.shiftKey)
      scene.onSound(0x6a)
      scene.onChange()
      scene.renderBuildingPanels()
    })
    button.addEventListener('contextmenu', event => {
      event.preventDefault()
      if (scene.world.inputMask || scene.overviewActive) return
      const u = scene.world.units.find(
        unit => unit.id === Number(button.dataset.person) && unit.hp > 0
      )
      if (!u || (u.inside !== b.id && !(b.progress < 1 && b.builders?.includes(u.id)))) return
      scene.focus(u, { animate: true })
      scene.objectPanels.open(u.id, true)
      scene.onSound(0x6a)
    })
    panel.appendChild(button)
  }
  const dismantle = document.createElement('button')
  dismantle.type = 'button'
  dismantle.className = 'dismantle-control'
  dismantle.addEventListener('click', () => {
    if (scene.world.inputMask || scene.overviewActive) return
    dismantleBuilding(scene.world, b)
    scene.onSound(0x6a)
    scene.onChange()
    scene.renderBuildingPanels()
  })
  panel.appendChild(dismantle)
  for (const type of ['pointerdown', 'pointerup', 'pointermove'])
    panel.addEventListener(type, event => event.stopPropagation())
  scene.buildingPanels.set(b.id, panel)
  scene.container.appendChild(panel)
  return panel
}

export function renderBuildingPanels(scene: GameScene, atlas: HTMLImageElement | null) {
  const { world } = scene,
    { width, height } = scene.container.getBoundingClientRect()
  for (const [id, panel] of scene.buildingPanels) {
    if (!world.buildings.some(b => b.id === id && b.hp > 0)) {
      panel.remove()
      scene.buildingPanels.delete(id)
    } else if (
      world.inputMask ||
      scene.overviewActive ||
      (!panel.matches(':hover') && !panel.contains(document.activeElement))
    )
      panel.hidden = true
  }
  if (scene.overviewActive || world.inputMask || !atlas?.complete || !atlas.naturalWidth) return
  for (const b of world.buildings) {
    const plan = b.progress < 1,
      school =
        !plan &&
        (b.kind === 'camp' || b.kind === 'temple' || b.kind === 'firewarriorHut'),
      tower = !plan && b.kind === 'tower',
      admission = b.admission,
      activity = admission?.activity ?? 0
    if ((!plan && !school && !tower) || b.team !== 'blue' || b.hp <= 0 || !scene.visible(b))
      continue
    // ponytail: activity/hover owns visibility until native panel allocation/lifetime is ported.
    if (
      !(activity & (128 | 0x8000)) &&
      !(plan && b.builders?.some(Boolean)) &&
      !(tower && admission?.inside) &&
      scene.hoveredObject !== b.id &&
      (scene.buildingPanels.get(b.id)?.hidden ?? true)
    )
      continue
    const ids = plan ? b.builders : admission?.occupants
    const occupants = (ids ?? []).flatMap(id => {
      const u =
        id &&
        world.units.find(
          unit =>
            unit.id === id && unit.hp > 0 && (plan ? unit.work === b.id : unit.inside === b.id)
        )
      return u
        ? [
            {
              id: u.id,
              model: nativeUnitModel(u.kind),
              kind: u.kind,
              selected: world.selected.includes(u.id),
            },
          ]
        : []
    })
    const old = scene.buildingPanels.get(b.id)
    if (old && old.children.length !== rules.buildingMaxWorkers[buildingModel(b)] + 2) {
      old.remove()
      scene.buildingPanels.delete(b.id)
    }
    const panel = scene.buildingPanels.get(b.id) ?? createPanel(scene, b)
    const canvas = panel.firstElementChild as HTMLCanvasElement,
      dismantle = panel.lastElementChild as HTMLButtonElement
    const buttons = [...panel.children].slice(1, -1) as HTMLButtonElement[]
    const dismantling = !!(activity & 0x8000)
    const shared = {
      occupants: occupants.map(({ model, selected }) => ({ model, selected })),
      dismantling,
      warning: plan ? !!b.woodUnavailable : !!((admission?.flags3 ?? 0) & 0x1000),
      turn: world.turn,
      controlHover: dismantle.matches(':hover'),
      controlPressed: dismantle.matches(':active'),
    }
    panel.classList.toggle('construction-panel', plan)
    panel.classList.toggle('tower-panel', tower)
    if (plan) {
      const model = buildingModel(b),
        state = {
          ...shared,
          capacity: rules.buildingMaxWorkers[model],
          wood: Math.trunc(
            (b.damageState?.plan.remaining ?? b.progress * rules.buildingLife[model]) / 100
          ),
          totalWood: Math.trunc(rules.buildingLife[model] / 100),
          linked: !b.preparation,
        }
      const key = JSON.stringify({
        ...state,
        turn: (state.warning ? world.turn & 4 : 0) | (dismantling ? world.turn & 2 : 0),
      })
      if (canvas.dataset.layout !== key) {
        const layout = constructionPanel(state)
        paintPanel(canvas, atlas, layout)
        canvas.dataset.layout = key
        for (let i = 0; i < buttons.length; i++) {
          const p = layout.people[i]
          if (p) {
            buttons[i].style.left = `${p.x}px`
            buttons[i].style.top = `${p.y}px`
          }
        }
        dismantle.hidden = !layout.control
        if (layout.control) {
          dismantle.style.left = `${layout.control.x}px`
          dismantle.style.top = '0px'
        }
      }
      panel.setAttribute(
        'aria-label',
        `Construction: ${occupants.length} of ${state.capacity} workers; ${state.wood} of ${state.totalWood} timber`
      )
    } else {
      const cost = tower ? 0 : (admission?.trainingCost ?? 0),
        progress = b.timer,
        top = activity & 128 && cost ? 7 : 1
      drawOccupantPanel(canvas, atlas, {
        ...shared,
        capacity: tower ? 1 : 5,
        cost,
        progress,
        active: !tower && !!(activity & 128),
      })
      for (let i = 0; i < buttons.length; i++) {
        buttons[i].style.left = `${(tower ? 1 : 3) + i * 17}px`
        buttons[i].style.top = `${top}px`
      }
      dismantle.hidden = false
      dismantle.style.left = tower ? '21px' : '91px'
      dismantle.style.top = `${top - 1}px`
      panel.setAttribute(
        'aria-label',
        tower
          ? `Guard tower: ${occupants.length} of 1 occupants`
          : `${b.kind === 'temple' ? 'Preacher' : b.kind === 'firewarriorHut' ? 'Firewarrior' : 'Warrior'} training: ${occupants.length} of 5 occupants; ${cost ? Math.min(100, Math.trunc((progress * 100) / cost)) : 0}% charged`
      )
    }
    const p = scene.screen(b)
    panel.hidden = false
    panel.style.left = `${((p.x + 1) * width) / 2}px`
    panel.style.top = `${((1 - p.y) * height) / 2}px`
    panel.style.width = `${canvas.width}px`
    panel.style.height = `${canvas.height}px`
    for (let i = 0; i < buttons.length; i++) {
      const person = occupants[i],
        button = buttons[i]
      button.hidden = !person
      if (!person) continue
      button.dataset.person = String(person.id)
      button.setAttribute(
        'aria-label',
        `${plan ? 'Worker' : tower ? 'Occupant' : 'Trainee'} ${i + 1}: ${person.kind}`
      )
      button.setAttribute('aria-pressed', String(person.selected))
      button.title = 'Click to select; Shift-click for all workers; right-click to focus'
    }
    dismantle.setAttribute('aria-pressed', String(dismantling))
    const name = {
      camp: 'warrior hut',
      hut: 'hut',
      tower: 'guard tower',
      temple: 'temple',
      firewarriorHut: 'firewarrior hut',
    }[b.kind]
    dismantle.setAttribute('aria-label', dismantling ? 'Cancel dismantling' : `Dismantle ${name}`)
    dismantle.title = dismantling ? 'Cancel dismantling' : `Dismantle ${name} and recover timber`
  }
}
