import { stepBuildingFetch } from '../app/building-fetch.ts'
import { createMotionRoutes, setDirectPersonDestination } from '../app/person-routes.ts'
import { reserveTimber, timberTransfer } from '../app/timber.ts'
import rules from '../app/original-rules.json' with { type: 'json' }

export function fetchCase(c) {
  const p = { ...c.person, motionGroup: 0, motionIndex: 0 }, task = { ...c.task }, site = structuredClone(c.site), target = { ...c.target }, rng = { randomState: c.seed }, events = []
  const short = n => (n << 16) >> 16
  const point = p => ({ x: p.x, y: p.y })
  const result = stepBuildingFetch(rng, p, task, site, {
    animation: (_, id) => events.push(['animation', id]),
    destination: to => { events.push(['destination', point(to), false]); p.goalX = to.x; p.goalY = to.y; if(c.routeFails)p.flags4 = (p.flags4 | 0x10000000) >>> 0 },
    directDestination: to => { events.push(['destination', point(to), true]); setDirectPersonDestination(createMotionRoutes(), p, to) },
    releaseMotion: () => events.push(['releaseMotion']),
    sound: (cue, flags) => events.push(['sound', cue, flags]),
    target: id => id === target.id ? target : undefined,
    refreshSearch: (to, angle) => { events.push(['refresh', ((to.x >>> 8) & 254) | (to.y & 0xfe00), angle, p.id]); site.searchIndex = c.refreshedIndex },
    findWood: index => { events.push(['find', index]); return c.findStatus === 0 ? target.id : 0 },
    looseWood: (to, tribe) => { events.push(['loose', (to.y >>> 9) * 128 + (to.x >>> 9), tribe]); return c.loose ? target.id : 0 },
    reserve: id => { events.push(['reserve', id]); reserveTimber(target) },
    transfer: (from, to, requested) => {
      events.push(['transfer', from, to, requested])
      if (from === p.id) {
        const amount = timberTransfer(short(p.cargo), site.work, site.class === 9 ? rules.buildingLife[site.model] : 0, requested)
        p.cargo = (p.cargo - amount) & 65535; site.work += amount
      } else {
        const amount = timberTransfer(target.wood, short(p.cargo), short(rules.personWood[p.model]), requested)
        target.wood -= amount; p.cargo = (p.cargo + amount) & 65535
      }
    },
  })
  delete p.motionGroup; delete p.motionIndex
  return { result, person: p, task, site, target, randomState: rng.randomState, events }
}
