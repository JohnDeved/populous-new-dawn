import models from './original-models.json' with { type: 'json' }
import bank6 from './original-models-bank6.json' with { type: 'json' }
import shapes from './original-shapes.json' with { type: 'json' }
import type { NativeModel } from './model-faces.ts'

export const nativeModels: Record<number, NativeModel> = models
const trees: Record<number, NativeModel> = bank6.models
const treeShapes: Record<number, number[]> = bank6.shapes
export interface NativeModelResource {
  readonly id: number
  readonly bank: 2 | 6
  readonly data: NativeModel
  readonly shapeIndices: readonly number[]
}
const resources = new Map<string, NativeModelResource>()

export function nativeModelResource(id: number, bank: 2 | 6 = 2): NativeModelResource {
  const key = `${bank}:${id}`
  let resource = resources.get(key)
  if (!resource) {
    const data = (bank === 6 && trees[id]) || nativeModels[id]
    if (!data) throw new RangeError(`Missing original model ${bank}:${id}`)
    resource = Object.freeze({
      id,
      bank,
      data,
      shapeIndices: Object.freeze([
        ...(bank === 6 && treeShapes[id] ? treeShapes[id] : shapes.objects[id]),
      ]),
    })
    resources.set(key, resource)
  }
  return resource
}
