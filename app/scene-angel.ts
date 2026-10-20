import * as THREE from 'three'
import { angelBases, angelPosePositions, type AngelBase } from './angel-presentation.ts'
import { nativeModelFromResource, releaseGroup } from './scene-assets.ts'
import type { NativeModelResource } from './model-resources.ts'
import type { AngelState } from './world-types.ts'
import type { WorldEnvironment } from './world-environment.ts'
import original from './original-angel.json' with { type: 'json' }

const resources = new Map<string, NativeModelResource>()

export function angelModelResource(base: AngelBase, owner: number, bank: 2 | 6) {
  if (!Number.isInteger(owner) || owner < -1 || owner > 3)
    throw new RangeError('Invalid Angel owner')
  const key = `${bank}:${base}:${owner}`
  let resource = resources.get(key)
  if (!resource) {
    const source = angelBases[base].model,
      uv = [...source.uv],
      tiles = source.tiles.map(tile =>
        original.tribeTiles.includes(tile) ? tile + owner : tile
      )
    let vertex = 0
    for (let face = 0; face < tiles.length; face++) {
      const from = source.tiles[face],
        to = tiles[face],
        count = source.faces[face * 2] === 3 ? 3 : 6
      if (from !== to)
        for (let corner = 0; corner < count; corner++) {
          uv[(vertex + corner) * 2] += ((to & 7) - (from & 7)) / 8
          uv[(vertex + corner) * 2 + 1] -= ((to >> 3) - (from >> 3)) / 32
        }
      vertex += count
    }
    resource = Object.freeze({
      id: base,
      bank,
      data: { ...source, uv, tiles },
      shapeIndices: Object.freeze([]),
    })
    resources.set(key, resource)
  }
  return resource
}

function addAngelMeshes(group: THREE.Group, owner: number, environment: WorldEnvironment) {
  for (const base of [62, 69] as const) {
    const resource = angelModelResource(base, owner, environment.objects.bank)
    const mesh = nativeModelFromResource(
      resource,
      `angel-${resource.bank}-${base}-${owner}`,
      2,
      4,
      false,
      environment
    )
    mesh.name = `angel-base-${base}`
    mesh.visible = false
    group.add(mesh)
  }
  group.userData.owner = owner
}

export function makeAngelMeshes(owner: number, environment: WorldEnvironment) {
  const group = new THREE.Group()
  group.name = 'angel-of-death'
  addAngelMeshes(group, owner, environment)
  return group
}

export function drawAngelMeshes(
  group: THREE.Group,
  state: AngelState,
  owner: number,
  environment: WorldEnvironment
) {
  if (group.userData.owner !== owner) {
    releaseGroup(group)
    group.clear()
    addAngelMeshes(group, owner, environment)
  }
  const pose = state.presentation.displayed,
    heading = Math.round(((Math.PI - state.heading) * 1024) / Math.PI) & 2047,
    key = `${pose.from}:${pose.to}:${pose.frame}:${pose.duration}`
  group.rotation.y = (-heading * Math.PI) / 1024
  group.userData.nativeHeading = heading
  // The existing gameplay producer has no native approach/speed/banking fields.
  group.userData.nativeTilt = 0
  group.userData.nativeRoll = 0
  for (const child of group.children) {
    const mesh = child as THREE.Mesh
    mesh.visible = mesh.userData.nativeModel === pose.base
    if (!mesh.visible) continue
    if (mesh.userData.angelPose !== key) {
      const position = mesh.geometry.getAttribute('position') as THREE.BufferAttribute
      position.array.set(angelPosePositions(pose))
      position.needsUpdate = true
      mesh.geometry.computeBoundingBox()
      mesh.geometry.computeBoundingSphere()
      mesh.userData.angelPose = key
    }
    mesh.userData.nativeSize = pose.scale
  }
}
