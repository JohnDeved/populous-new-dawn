import type { GameScene } from './scene.ts'
import { buildingModel, type Building } from './model.ts'
import rules from './original-rules.json' with { type: 'json' }
import { drawOccupantPanel, occupantPanelControlLayout, paintPanel } from './training-panel.ts'
import { constructionPanel } from './construction-panel.ts'
import { selectBuildingOccupants, dismantleBuilding } from './live-building-entry.ts'
import { nativeUnitModel } from './unit-kinds.ts'
import {
  BALLOON_HUT_CAPACITY,
  BALLOON_HUT_WORKSHOP_PROFILE,
  BOAT_HOUSE_CAPACITY,
  BOAT_HOUSE_WORKSHOP_PROFILE,
  drawWorkshopPanel,
  workshopPanelControls,
  workshopWorkBlocks,
} from './workshop-panel.ts'

export function buildingOccupantPanelProfile(
  b: Pick<Building, 'kind' | 'level' | 'progress'>
): { kind: 'resident' | 'training' | 'workshop'; capacity: 1 | 3 | 4 | 5 | 6 } | null {
  if (b.progress < 1) return null
  if (b.kind === 'hut')
    return { kind: 'resident', capacity: rules.buildingCapacity[buildingModel(b)] as 3 | 4 | 5 }
  if (b.kind === 'tower') return { kind: 'resident', capacity: 1 }
  if (b.kind === 'boatHouse') return { kind: 'workshop', capacity: BOAT_HOUSE_CAPACITY }
  if (b.kind === 'balloonHut') return { kind: 'workshop', capacity: BALLOON_HUT_CAPACITY }
  if (
    b.kind === 'camp' ||
    b.kind === 'temple' ||
    b.kind === 'spyHut' ||
    b.kind === 'firewarriorHut'
  )
    return { kind: 'training', capacity: 5 }
  return null
}

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
  const { world } = scene
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
      profile = buildingOccupantPanelProfile(b),
      school = profile?.kind === 'training',
      workshop = profile?.kind === 'workshop',
      tower = profile?.kind === 'resident' && b.kind === 'tower',
      hut = profile?.kind === 'resident' && b.kind === 'hut',
      admission = b.admission,
      activity = admission?.activity ?? 0
    if ((!plan && !profile) || b.team !== 'blue' || b.hp <= 0 || !scene.visible(b)) continue
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
    const occupants = (ids ?? [])
      .flatMap(id => {
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
      .slice(0, plan ? undefined : profile!.capacity)
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
    } else if (workshop) {
      const workshopProfile =
          b.kind === 'balloonHut' ? BALLOON_HUT_WORKSHOP_PROFILE : BOAT_HOUSE_WORKSHOP_PROFILE,
        controls = workshopPanelControls(workshopProfile),
        progress = workshopWorkBlocks(b.timer, workshopProfile),
        workshopName = b.kind === 'balloonHut' ? 'Balloon Hut' : 'Boat House',
        vehicleName = b.kind === 'balloonHut' ? 'Balloon' : 'Boat'
      drawWorkshopPanel(
        canvas,
        atlas,
        {
          occupants: shared.occupants,
          progress: b.timer,
          dismantling,
          turn: world.turn,
          controlHover: dismantle.matches(':hover'),
          controlPressed: dismantle.matches(':active'),
        },
        workshopProfile
      )
      for (let i = 0; i < buttons.length; i++) {
        const slot = controls.people[i]
        if (!slot) continue
        buttons[i].style.left = `${slot.x}px`
        buttons[i].style.top = `${slot.y}px`
      }
      dismantle.hidden = false
      dismantle.style.left = `${controls.control.x}px`
      dismantle.style.top = `${controls.control.y}px`
      panel.setAttribute(
        'aria-label',
        `${workshopName}: ${occupants.length} of ${workshopProfile.capacity} workers; ${progress} of ${workshopProfile.workBlocks} ${vehicleName} work`
      )
    } else {
      const capacity = profile!.capacity as 1 | 3 | 4 | 5,
        cost = school ? (admission?.trainingCost ?? 0) : 0,
        progress = b.timer,
        active = school && !!(activity & 128),
        controls = occupantPanelControlLayout({ capacity, active, cost })
      drawOccupantPanel(canvas, atlas, {
        ...shared,
        capacity,
        cost,
        progress,
        active,
      })
      for (let i = 0; i < buttons.length; i++) {
        const slot = controls.people[i]
        if (!slot) continue
        buttons[i].style.left = `${slot.x}px`
        buttons[i].style.top = `${slot.y}px`
      }
      dismantle.hidden = false
      dismantle.style.left = `${controls.control.x}px`
      dismantle.style.top = `${controls.control.y}px`
      panel.setAttribute(
        'aria-label',
        tower
          ? `Guard tower: ${occupants.length} of 1 occupants`
          : hut
            ? `Hut: ${occupants.length} of ${capacity} occupants`
            : `${b.kind === 'temple' ? 'Preacher' : b.kind === 'spyHut' ? 'Spy' : b.kind === 'firewarriorHut' ? 'Firewarrior' : 'Warrior'} training: ${occupants.length} of 5 occupants; ${cost ? Math.min(100, Math.trunc((progress * 100) / cost)) : 0}% charged`
      )
    }
    const p = scene.screen(b),
      containerRect = scene.container.getBoundingClientRect(),
      rendererRect = scene.renderer.domElement.getBoundingClientRect(),
      scale = Number.parseFloat(getComputedStyle(panel).getPropertyValue('--hud-scale')) || 1,
      rendererLeft = rendererRect.left - containerRect.left,
      rendererTop = rendererRect.top - containerRect.top,
      anchorX = rendererLeft + ((p.x + 1) * rendererRect.width) / 2,
      anchorY = rendererTop + ((1 - p.y) * rendererRect.height) / 2,
      halfPanelWidth = (canvas.width * scale) / 2,
      panelHeight = canvas.height * scale,
      left = Math.max(
        rendererLeft + halfPanelWidth,
        Math.min(rendererLeft + rendererRect.width - halfPanelWidth, anchorX)
      ),
      top = Math.max(
        rendererTop + panelHeight,
        Math.min(rendererTop + rendererRect.height, anchorY)
      )
    panel.hidden = false
    panel.style.left = `${left}px`
    panel.style.top = `${top}px`
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
        `${plan || workshop ? 'Worker' : school ? 'Trainee' : 'Occupant'} ${i + 1}: ${person.kind}`
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
      spyHut: 'spy training hut',
      firewarriorHut: 'firewarrior hut',
      boatHouse: 'boat house',
      balloonHut: 'balloon hut',
      prison: 'prison',
    }[b.kind]
    dismantle.setAttribute('aria-label', dismantling ? 'Cancel dismantling' : `Dismantle ${name}`)
    dismantle.title = dismantling ? 'Cancel dismantling' : `Dismantle ${name} and recover timber`
  }
}
