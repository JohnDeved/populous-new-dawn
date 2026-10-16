import { waterPoint } from './water.ts'

type Ground = Parameters<typeof waterPoint>[0]
interface WaterPointValues {
  heights: Float64Array
  colors: Float64Array
}

// 256 KiB per live scene. Values are recomputed on every caller key miss;
// only storage is reused, so turns, lighting, land and geometry cannot leave stale values.
const sceneValues = new WeakMap<object, WaterPointValues>()

export function waterPointValues(owner: object, land: Ground, turn: number, waves: Uint8Array) {
  let values = sceneValues.get(owner)
  if (!values) {
    values = { heights: new Float64Array(16384), colors: new Float64Array(16384) }
    sceneValues.set(owner, values)
  }
  for (let i = 0; i < 16384; i++) {
    const point = waterPoint(land, i, turn, waves)
    values.heights[i] = point.height
    values.colors[i] = point.color
  }
  return values
}
