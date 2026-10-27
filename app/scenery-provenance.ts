import { missionData } from './mission-data.ts'
import type { Shrine, Tree, World } from './world-types.ts'

// Source origins only: neither pool handles, current native class/object identity,
// cell order nor a claim that every runtime adapter has recorded provenance.
export interface ScenerySource {
  version: 1
  sourceSha256: string
  headerSha256: string
}
export type SceneryBirth = 'initial' | 'linked-release' | 'replant' | 'loose-log'
export type SceneryOrigin =
  | { kind: 'unknown' }
  | { kind: 'authored'; slot: number; birth: 'initial' | 'linked-release' }
  | { kind: 'dynamic'; birth: 'replant' | 'loose-log' }

const slotNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isInteger(value) && value >= 0 && value < 2000
const record = (value: unknown): value is Record<string, unknown> =>
  value !== null &&
  typeof value === 'object' &&
  (Object.getPrototypeOf(value) === Object.prototype || Object.getPrototypeOf(value) === null)

function sourceObjects(world: World) {
  const { scenerySource: source } = world
  if (!record(source) || source.version !== 1 || !Number.isInteger(world.outcome?.level))
    return null
  try {
    const { level } = missionData(world.outcome.level)
    if (source.sourceSha256 !== level.sourceSha256 || source.headerSha256 !== level.headerSha256)
      return null
    return new Map(level.objects.map(object => [object.index, object]))
  } catch {
    return null
  }
}

type SourceObjects = NonNullable<ReturnType<typeof sourceObjects>>
function validTree(tree: Tree, objects: SourceObjects | null): boolean {
  if (!record(tree)) return false
  const hasSlot = 'authoredSlot' in tree,
    hasBirth = 'sceneryBirth' in tree
  if (!hasSlot && !hasBirth) return true
  if (!objects || !hasSlot || !hasBirth) return false
  if (tree.sceneryBirth === 'replant' || tree.sceneryBirth === 'loose-log')
    return tree.authoredSlot === null
  if (tree.sceneryBirth !== 'initial' && tree.sceneryBirth !== 'linked-release') return false
  if (!slotNumber(tree.authoredSlot)) return false
  const object = objects.get(tree.authoredSlot)
  return object?.type === 5 && object.model <= 6
}

function validShrines(shrines: Shrine[], objects: SourceObjects | null): boolean {
  const checked = new Set<Shrine>()
  const visit = (shrine: Shrine): boolean => {
    if (!record(shrine)) return false
    if (checked.has(shrine)) return true
    checked.add(shrine)
    const hasTrigger = 'triggerSlot' in shrine,
      hasDecoration = 'verifiedDecorationSlot' in shrine
    if (hasTrigger || hasDecoration) {
      if (!objects || !hasTrigger || !hasDecoration || !slotNumber(shrine.triggerSlot)) return false
      const trigger = objects.get(shrine.triggerSlot)
      if (trigger?.type !== 6 || trigger.model !== 6) return false
      // No general decorative association is proved by this first slice. Do not
      // promote the coordinate-based presentation compatibility helper to proof.
      if (shrine.verifiedDecorationSlot !== null) return false
    }
    if (shrine.linkedTrees !== undefined) {
      if (!Array.isArray(shrine.linkedTrees)) return false
      for (const template of shrine.linkedTrees) {
        if (!record(template) || 'sceneryBirth' in template) return false
        if ('authoredSlot' in template) {
          if (!objects || !slotNumber(template.authoredSlot)) return false
          const object = objects.get(template.authoredSlot)
          if (object?.type !== 5 || object.model > 6) return false
        }
      }
    }
    if (shrine.linkedShrine !== undefined && !visit(shrine.linkedShrine)) return false
    return true
  }
  return shrines.every(visit)
}

// Pure validation at the actual checkpoint boundary. Absence is not normalized
// into a guessed origin, and saved coordinates/model/stock are not source keys.
export function validSceneryProvenance(world: World): boolean {
  const objects = sourceObjects(world)
  if ('scenerySource' in world && !objects) return false
  if (!Array.isArray(world.trees) || !Array.isArray(world.shrines)) return false
  return world.trees.every(tree => validTree(tree, objects)) && validShrines(world.shrines, objects)
}

function origin(tree: Tree, objects: SourceObjects | null): SceneryOrigin {
  if (!validTree(tree, objects)) throw new RangeError('Invalid scenery source provenance')
  if (tree.authoredSlot === undefined && tree.sceneryBirth === undefined) return { kind: 'unknown' }
  if (tree.authoredSlot === null)
    return { kind: 'dynamic', birth: tree.sceneryBirth as 'replant' | 'loose-log' }
  return {
    kind: 'authored',
    slot: tree.authoredSlot!,
    birth: tree.sceneryBirth as 'initial' | 'linked-release',
  }
}

function checkedSourceObjects(world: World): SourceObjects | null {
  const objects = sourceObjects(world)
  if ('scenerySource' in world && !objects)
    throw new RangeError('Invalid scenery source provenance')
  return objects
}

export function treeSceneryOrigin(world: World, tree: Tree): SceneryOrigin {
  return origin(tree, checkedSourceObjects(world))
}

export function resolveTreeSource(world: World, tree: Tree) {
  const objects = checkedSourceObjects(world),
    source = origin(tree, objects)
  return source.kind === 'authored' ? objects!.get(source.slot)! : null
}

export function resolveShrineTriggerSource(world: World, shrine: Shrine) {
  const objects = checkedSourceObjects(world)
  if (!validShrines([shrine], objects)) throw new RangeError('Invalid scenery source provenance')
  return shrine.triggerSlot === undefined ? null : objects!.get(shrine.triggerSlot)!
}
