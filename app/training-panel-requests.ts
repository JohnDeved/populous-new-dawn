import type { World } from './model.ts'

interface TrainingPanelOwner {
  requestAutomaticTraining(id: number): void
}

// The original request is synchronous, before conversion and later allocators.
// This transient World-to-Scene route is a browser ownership adaptation; neither
// this binding nor the Scene's panel latch belongs in a World checkpoint.
const owners = new WeakMap<World, TrainingPanelOwner>()

export function trainingPanelRequestOwner(world: World) {
  return owners.get(world)
}

export function bindTrainingPanelRequests(world: World, owner: TrainingPanelOwner) {
  owners.set(world, owner)
  return () => {
    if (owners.get(world) === owner) owners.delete(world)
  }
}

export function requestTrainingPanel(world: World, id: number) {
  owners.get(world)?.requestAutomaticTraining(id)
}
