import { type World, type Vehicle } from './world-types.ts'
import { selectVehicleOccupants } from './vehicle-panel.ts'
import { vehicleExit } from './live-vehicles.ts'
import { vehicleReady } from './vehicle-routing.ts'
import { unloadVehiclePeople, vehicleUnloadReady } from './vehicle-unload.ts'
import { clearPersonOrders } from './person-orders.ts'
import { orderEffects } from './live-movement.ts'
import { setLivePersonAnimation } from './live-people.ts'
import rules from './original-rules.json' with { type: 'json' }
import sprites from './original-units.json' with { type: 'json' }

export function liveVehiclePassengers(w: World, v: Vehicle) {
  return v.passengers.slice(0, rules.vehicleCapacity[v.model]).flatMap(id => {
    const unit = w.units.find(u => u.id === id && u.hp > 0),
      person = w.pathfinding.people.get(id) ?? unit?.native
    return unit && person ? [{ unit, person }] : []
  })
}
export function selectVehiclePassenger(w: World, v: Vehicle, id: number, all: boolean) {
  const people = liveVehiclePassengers(w, v).map(({ person }) => ({
    ...person,
    selectionFlags: (person.selectionFlags & ~128) | (w.selected.includes(person.id) ? 128 : 0),
  }))
  selectVehicleOccupants(people, id, all)
  for (const p of people) {
    const source = w.pathfinding.people.get(p.id) ?? w.units.find(u => u.id === p.id)?.native
    if (source) {
      source.selectionFlags = p.selectionFlags
      source.flags3 = p.flags3
    }
  }
  const ids = new Set(people.map(p => p.id))
  w.selected = [
    ...w.selected.filter(id => !ids.has(id)),
    ...people.filter(p => p.selectionFlags & 128).map(p => p.id),
  ]
}
export function canUnloadVehicle(w: World, v: Vehicle) {
  return (
    !!v.active &&
    !!v.passengerCount &&
    vehicleUnloadReady(v, vehicleReady(w.land, v), vehicleExit(w, v).found)
  )
}
export function unloadLiveVehicle(w: World, v: Vehicle) {
  if (!canUnloadVehicle(w, v)) return false
  unloadVehiclePeople(
    w,
    v,
    new Map(liveVehiclePassengers(w, v).map(({ person }) => [person.id, person])),
    {
      exit: () => vehicleExit(w, v),
      clearOrders: p => clearPersonOrders(w.buildingOrders, p, orderEffects(w)),
      launched: p => {
        const unit = w.units.find(u => u.id === p.id)
        if (!unit) return
        // Expose the ordinary physics owner without destruction's extra flags.
        unit.flight = p
        unit.lift = 1
        setLivePersonAnimation(w, p, rules.personAnimationObjects[(p.cargo ? 4 : 7) * 9 + p.model])
        if (!p.cargo) {
          p.f2 = 0
          p.f1 = rules.animationDescriptors[p.draw].hold
        }
        p.assignment |= 128
        p.slowTurn =
          ((sprites.frameCounts[p.object] * (rules.animationDescriptors[p.draw].step + 1)) << 24) >>
          24
      },
    }
  )
  return true
}
