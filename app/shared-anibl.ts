export interface SharedAniblSnapshot {
  readonly bank: 'p'
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
  const selection = (counter: number): SharedAniblSnapshot =>
    Object.freeze({ bank: 'p', epoch, counter, tile: templeFrames[counter] })
  return {
    snapshot: () => state,
    transition: (supported: boolean, retain = false) => {
      if (!supported) state = null
      else if (!retain || !state) {
        epoch++
        state = selection(0)
      }
    },
    advance: () => {
      if (state) state = selection((state.counter + 1) % templeFrames.length)
    },
  }
}
