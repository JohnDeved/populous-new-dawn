import type { WorldEnvironment } from './world-environment.ts'

type Landscape = Pick<WorldEnvironment['landscape'], 'bank' | 'modelAtlas'>

export interface SharedAniblSnapshot {
  readonly bank: Landscape['bank']
  readonly modelAtlas: Landscape['modelAtlas']
  readonly epoch: number
  readonly counter: number
  readonly tile: number
}

export interface PresentationBinding {
  isCurrent(): boolean
  advance(): void
  snapshot(): SharedAniblSnapshot | null
  release(): void
}

const templeFrames = [92, 93, 94, 95, 100, 101, 102, 103, 108] as const

// Transient shared resource selection. The caller owns nominal presentation visits;
// neither drawing, acquisition lifetime nor checkpoint serialization owns this phase.
export function createSharedAniblResource() {
  let epoch = 0,
    state: SharedAniblSnapshot | null = null
  const selection = (landscape: Landscape, counter: number): SharedAniblSnapshot =>
    Object.freeze({
      bank: landscape.bank,
      modelAtlas: landscape.modelAtlas,
      epoch,
      counter,
      tile: templeFrames[counter],
    })
  return {
    snapshot: () => state,
    transition: (landscape: Landscape | null, retain = false) => {
      if (!landscape) state = null
      else if (
        !retain ||
        !state ||
        state.bank !== landscape.bank ||
        state.modelAtlas !== landscape.modelAtlas
      ) {
        epoch++
        state = selection(landscape, 0)
      }
    },
    advance: () => {
      if (state) state = selection(state, (state.counter + 1) % templeFrames.length)
    },
  }
}
