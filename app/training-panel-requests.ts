import type { World } from './model.ts'

interface TrainingPanelOwner {
  requestAutomaticTraining(id: number): void
  requestAutomaticVault(id: number): void
}

// The original request is synchronous, before conversion and later allocators.
// This transient World-to-Scene route is a browser ownership adaptation; neither
// this binding nor the Scene's panel latch belongs in a World checkpoint.
const owners = new WeakMap<World, { owner: TrainingPanelOwner }>()

export function trainingPanelRequestOwner(world: World) {
  return owners.get(world)?.owner
}

export function bindTrainingPanelRequests(world: World, owner: TrainingPanelOwner) {
  // Release belongs to this binding, even when a later binding reuses its owner.
  const binding = { owner }
  owners.set(world, binding)
  return () => {
    if (owners.get(world) === binding) owners.delete(world)
  }
}

export function requestTrainingPanel(world: World, id: number) {
  owners.get(world)?.owner.requestAutomaticTraining(id)
}

export function requestVaultPanel(world: World, id: number) {
  owners.get(world)?.owner.requestAutomaticVault(id)
}
