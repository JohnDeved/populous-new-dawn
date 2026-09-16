import * as THREE from 'three'
import type { GameScene } from './scene.ts'
import type { Command } from './painter.ts'
import { modelMatrix, modelPoint, projectPoint } from './projection.ts'
import { modelFaceVisible, type NativeModel } from './model-faces.ts'
import { modelTriangleVisible, polygonBucket } from './painter-order.ts'
import {
  inHitBounds,
  inHitTriangle,
  personHitBounds,
  pickQueuedObjects,
  modelHitBounds,
  type PickCommand,
} from './world-picking.ts'
import models from './original-models.json' with { type: 'json' }
import frames from './original-units.json' with { type: 'json' }

type ModelCommand = PickCommand & { bucket: number; face: number }
type QueuedHit = PickCommand & { source: Command; bucket: number; face: number }

// Cache screen geometry at the input boundary. Static models do not need another
// transform for every mouse move; picking-only faces never enter a GPU draw call.
export class ScenePicking {
  models = new WeakMap<
    THREE.Mesh,
    { key: string; position: THREE.BufferAttribute; commands: ModelCommand[] }
  >()
  lastKey = ''
  lastId: number | null = null
  lastKind: 'person' | 'model' | null = null
  constructor(readonly scene: GameScene) {}

  model(mesh: THREE.Mesh, viewKey: string) {
    const s = this.scene,
      g = mesh.parent!,
      meta = g.userData,
      shape = mesh.userData
    const position = mesh.geometry.getAttribute('position') as THREE.BufferAttribute
    mesh.updateWorldMatrix(true, false)
    const key = [
      viewKey,
      position.version,
      ...mesh.matrixWorld.elements,
      shape.nativeModel,
      shape.stage,
      shape.nativeSize,
      meta.nativeHeading,
      meta.nativeTilt,
      meta.nativeRoll,
    ].join(',')
    const cached = this.models.get(mesh)
    if (cached?.key === key && cached.position === position) return cached.commands
    const data = (models as Record<number, NativeModel>)[shape.nativeModel],
      { stage } = shape
    const origin = new THREE.Vector3().setFromMatrixPosition(mesh.matrixWorld)
    const nativeOrigin = s.view.relative(origin, (origin.y * 128) / 45)
    const basis = modelMatrix(meta.nativeHeading ?? 0, meta.nativeTilt ?? 0, meta.nativeRoll ?? 0)
    const points = new Map<string, ReturnType<typeof projectPoint>>()
    const commands: ModelCommand[] = []
    let rendered = 0,
      vertex = 0,
      faceNumber = 0
    const id = meta.building ?? meta.shrine ?? meta.point?.id
    for (let face = 0; face < data.tiles.length; face++) {
      const count = data.faces[face * 2] === 3 ? 3 : 6,
        flags = data.faces[face * 2 + 1]
      const visible = modelFaceVisible(data, face, stage)
      const corners = []
      for (let i = 0; i < count; i++) {
        const raw = visible
          ? [position.getX(rendered + i), position.getY(rendered + i), position.getZ(rendered + i)]
          : data.p.slice((vertex + i) * 3, (vertex + i + 1) * 3)
        raw[0] = Math.round(raw[0] * data.scale * 3)
        raw[1] = Math.round(raw[1] * data.scale * 3)
        raw[2] = Math.round(-raw[2] * data.scale * 3)
        const vertexKey = raw.join(',')
        let p = points.get(vertexKey)
        if (!p) {
          p = projectPoint(
            modelPoint(raw, shape.nativeSize ?? data.scale, basis, nativeOrigin),
            s.view.projection
          )
          points.set(vertexKey, p)
        }
        corners.push(p)
      }
      if (stage === 4 || flags & (1 << stage))
        for (let i = 0; i < count; i += 3) {
          const triangle = corners.slice(i, i + 3)
          const front = modelTriangleVisible(
            triangle,
            s.view.projection.width,
            s.view.projection.height
          )
          if (stage === 4 && !front) continue
          // Construction submits both sides, reversing rear-facing triangles.
          if (stage !== 4 && !front) triangle.reverse()
          commands.push({
            kind: 'model',
            id,
            points: triangle.map(p => ({ x: p.screenX, y: p.screenY })),
            bucket: polygonBucket(
              triangle.map(p => p.z),
              data.biases[face]
            ),
            face: faceNumber + i / 3,
          })
        }
      if (visible) rendered += count
      vertex += count
      faceNumber += count / 3
    }
    commands.push({
      kind: 'bounds',
      id,
      ...modelHitBounds([...points.values()]),
      face: faceNumber,
    })
    this.models.set(mesh, { key, position, commands })
    return commands
  }

  personBounds(id: number, rect = this.scene.renderer.domElement.getBoundingClientRect()) {
    const s = this.scene,
      g = s.unitMeshes.get(id),
      anchor = s.unitScreen(id)
    if (!g?.visible || g.userData.pickable === false || !anchor) return null
    const frame = frames.frames[g.userData.frame]
    if (!frame) return null
    const flags = s.view.config.scaledSprites ? 256 : 0
    return personHitBounds(
      {
        x: Math.trunc(((anchor.x + 1) * rect.width) / 2),
        y: Math.trunc(((1 - anchor.y) * rect.height) / 2),
      },
      frame,
      g.userData.spriteBucket,
      flags,
      s.view.config,
      !!(g.userData.signature?.endsWith('shaman') || flags)
    )
  }

  pick(event: { clientX: number; clientY: number }) {
    const s = this.scene,
      { view } = s,
      rect = s.renderer.domElement.getBoundingClientRect()
    const point = {
      x: Math.trunc(event.clientX - rect.left),
      y: Math.trunc(event.clientY - rect.top),
    }
    const viewKey = [
      view.center.x,
      view.center.y,
      view.rawCenter.x,
      view.rawCenter.y,
      ...Object.values(view.projection),
    ].join(',')
    const key = [s.frame, viewKey, point.x, point.y].join(',')
    if (key === this.lastKey) return this.lastId
    const hits: QueuedHit[] = []
    for (const [id, g] of s.unitMeshes) {
      if (!g.visible || g.userData.pickable === false) continue
      const bounds = this.personBounds(id, rect)
      if (!bounds) continue
      if (!inHitBounds(point, bounds)) continue
      const layers = g.userData.layers as THREE.Sprite[]
      const layer = layers.findLast(piece => piece.visible)
      const source = layer && view.painter.source(layer)
      if (source)
        hits.push({
          kind: 'person',
          id,
          bounds,
          eligible: true,
          source,
          bucket: source.bucket,
          face: source.face,
        })
    }
    for (const root of [s.objects, s.decorations])
      root.traverseVisible(object => {
        if (!(object instanceof THREE.Mesh) || object.userData.nativeModel === undefined) return
        const meta = object.parent!.userData
        if (
          meta.building === undefined &&
          meta.shrine === undefined &&
          meta.point?.id === undefined
        )
          return
        const source = view.painter.source(object)
        if (!source) return
        const commands = this.model(object, viewKey),
          bounds = commands.at(-1)!
        if (bounds.kind !== 'bounds' || !inHitBounds(point, bounds.bounds)) return
        hits.push({ ...bounds, source })
        for (const c of commands)
          if (c.kind === 'model' && inHitTriangle(point, c.points)) hits.push({ ...c, source })
      })
    if (hits.some(h => h.kind !== 'bounds')) {
      // Reuse projected vertices, but resolve depth from this frame's commands:
      // building occupancy can change ground ordering even while paused.
      const terrain = view.pick(
        new THREE.Vector2((point.x * 2) / rect.width - 1, 1 - (point.y * 2) / rect.height),
        [s.terrain],
        s.camera,
        true
      )
      const source =
        terrain && view.painter.command(terrain.object, terrain.triangle, terrain.instance)
      // The terrain query already performed the native pixel-edge test.
      if (source)
        hits.push({
          kind: 'ground',
          source,
          bucket: source.bucket,
          face: source.face,
        })
    }
    hits.sort(
      (a, b) =>
        b.bucket - a.bucket ||
        b.source.cell - a.source.cell ||
        b.source.phase - a.source.phase ||
        b.source.object - a.source.object ||
        b.face - a.face
    )
    const picked = pickQueuedObjects(hits, point)
    this.lastKey = key
    this.lastId = picked?.id ?? null
    this.lastKind = picked?.kind ?? null
    return this.lastId
  }

  pickPerson(event: { clientX: number; clientY: number }) {
    const id = this.pick(event)
    return this.lastKind === 'person' ? id : null
  }
}
