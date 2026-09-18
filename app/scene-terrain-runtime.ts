import type { GameScene } from './scene.ts'
import * as THREE from 'three'
import { nativeModels, nativeModel } from './scene-assets.ts'
import {
  readTerrainTextures,
  terrainAtlas,
  updateFootprintTiles,
  terrainTextureBounds,
} from './terrain-texture.ts'
import { terrainTiles } from './terrain-visibility.ts'
import { waterCell, waterPoint, waterTexture } from './water.ts'
import { terrainPointHeight } from './native-terrain.ts'
import {
  nativePosition,
  browserPosition,
  walkable,
  campaignPosition,
  type Point,
  type Tree,
  type Effect,
} from './model'
import { campaignShamanTeams } from './campaign-runtime.ts'
import { vertexLighting } from './projection.ts'
import { reincarnationStoneRise, reincarnationStones } from './reincarnation.ts'
import { timberScale } from './timber.ts'
import { updateWaveShake } from './scene-entities.ts'
import rules from './original-rules.json'

export function initializeTerrain(scene: GameScene) {
  scene.terrainMap.colorSpace = THREE.NoColorSpace
  scene.terrainMap.minFilter = THREE.LinearFilter
  scene.terrainMap.magFilter = THREE.LinearFilter
  scene.waterMap.colorSpace = THREE.NoColorSpace
  scene.waterMap.wrapT = THREE.RepeatWrapping
  scene.waterMap.wrapS = THREE.RepeatWrapping
  scene.waterMap.minFilter = THREE.LinearFilter
  scene.waterMap.magFilter = THREE.LinearFilter
  const ready = Promise.all(
    ['landscape.bin', 'waves.bin'].map(name =>
      fetch(`/original/${name}`, { signal: scene.terrainLoad.signal }).then(response => {
        if (!response.ok) throw new Error(`Terrain texture load failed: ${response.status}`)
        return response.arrayBuffer()
      })
    )
  ).then(([buffer, waves]) => {
    if (scene.terrainLoad.signal.aborted) return
    if (waves.byteLength !== 65536) throw new Error('Invalid original wave table')
    scene.terrainTextures = readTerrainTextures(buffer)
    scene.waves = new Uint8Array(waves)
    const indexed = waterTexture(scene.terrainTextures, 0),
      pixels = scene.waterMap.image.data as Uint8Array,
      palette = scene.terrainTextures.palette
    indexed.forEach((c, i) =>
      pixels.set([palette[c * 4], palette[c * 4 + 1], palette[c * 4 + 2], 255], i * 4)
    )
    scene.waterMap.needsUpdate = true
    scene.updateTerrainTexture()
    scene.waterState = ''
  })
  const terrain = new THREE.InstancedMesh(
    new THREE.BufferGeometry(),
    new THREE.ShaderMaterial({
      uniforms: {
        map: { value: scene.terrainMap },
        waterMap: { value: scene.waterMap },
        scroll: scene.waterScroll,
      },
      vertexShader: `
          attribute vec2 landUv;
          attribute float surface;
          attribute vec3 light;
          attribute vec3 highlight;
          varying vec2 land, waterUV;
          varying float sea;
          varying vec3 diffuse, specular;
          void main() {
            land = landUv;
            waterUV = vec2(uv.x + 8., -uv.y - 8.) / 16.;
            sea = surface;
            diffuse = light;
            specular = highlight;
            gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);
          }`,
      fragmentShader: `
          uniform sampler2D map, waterMap;
          uniform float scroll;
          varying vec2 land, waterUV;
          varying float sea;
          varying vec3 diffuse, specular;
          void main() {
            gl_FragColor = sea > .5 ? texture2D(waterMap, waterUV + scroll) : texture2D(map, land);
            gl_FragColor.rgb = clamp(gl_FragColor.rgb * diffuse + specular, 0., 1.);
          }`,
    }),
    9
  )
  terrainTiles.forEach(([x, z], i) =>
    terrain.setMatrixAt(i, new THREE.Matrix4().makeTranslation(x * 256, 0, z * 256))
  )
  terrain.userData.nativeRelative = true
  terrain.userData.painterGround = true
  terrain.userData.terrainGrid = true
  return { terrain, ready }
}

function placeReincarnationStone(scene: GameScene, group: THREE.Object3D) {
  const point = group.userData.groundPoint as Point
  group.position.y =
    (terrainPointHeight(scene.world.land, nativePosition(scene.world, point)) +
      reincarnationStoneRise(scene.world.turn)) /
    128
}

export function rebuildTerrain(scene: GameScene) {
  const w = scene.world
  let geo = scene.terrain.geometry
  if (geo.getAttribute('position')?.count !== 128 * 128 * 6) {
    geo.dispose()
    geo = new THREE.BufferGeometry()
    for (const [name, size] of [
      ['position', 3],
      ['uv', 2],
      ['landUv', 2],
      ['surface', 1],
      ['light', 3],
      ['highlight', 3],
    ] as const)
      geo.setAttribute(
        name,
        new THREE.Float32BufferAttribute(new Float32Array(128 * 128 * 6 * size), size)
      )
    scene.terrain.geometry = geo
  }
  const positions = geo.getAttribute('position'),
    uv = geo.getAttribute('uv'),
    landUV = geo.getAttribute('landUv'),
    surfaces = geo.getAttribute('surface')
  let vertex = 0
  const [low, high] = terrainTextureBounds(32)
  for (let z = -128; z < 128; z += 2)
    for (let x = -128; x < 128; x += 2) {
      const i = scene.landIndex(x, z + 2),
        sea = Number(waterCell(w.land, i))
      const corners =
        w.land.flags[i] & 1
          ? [
              [0, 0],
              [1, 1],
              [1, 0],
              [0, 0],
              [0, 1],
              [1, 1],
            ]
          : [
              [0, 0],
              [0, 1],
              [1, 0],
              [1, 0],
              [0, 1],
              [1, 1],
            ]
      for (const [dx, dz] of corners) {
        const px = x + dx * 2,
          pz = z + dz * 2
        positions.setXYZ(vertex, px, w.land.heights[scene.landIndex(px, pz)] / 128, pz)
        uv.setXY(vertex, px, pz)
        // Each original terrain texture has its own inset endpoints. Keep
        // these separate from world coordinates used by the scrolling sea.
        landUV.setXY(
          vertex,
          ((x + 128) / 2 + low + dx * (high - low)) / 128,
          ((z + 128) / 2 + low + dz * (high - low)) / 128
        )
        surfaces.setX(vertex, sea)
        vertex++
      }
    }
  for (const attribute of [positions, uv, landUV, surfaces]) attribute.needsUpdate = true
  geo.boundingBox = null
  geo.boundingSphere = null
  // Two unsigned wave samples divided by eight produce heights from 0 to 63.
  scene.view.terrainHeights = [Math.min(0, ...w.land.heights), Math.max(63, ...w.land.heights)]
  scene.updateView()
  scene.terrainVersion = w.landVersion
  scene.waterState = ''
  for (const d of scene.decorations.children) {
    const p = d.userData.point as Point | undefined
    if (p) {
      scene.locate(d, p)
      d.visible = walkable(w.terrain, p)
    }
    if (d.userData.groundPoint) placeReincarnationStone(scene, d)
  }
}

export function updateTerrainTexture(scene: GameScene) {
  if (!scene.terrainTextures) return
  const w = scene.world,
    marks = w.footprints
  const terrainChanged =
    scene.terrainMapVersion !== w.landVersion ||
    !w.land.shadows.every((v, i) => v === scene.terrainShadows[i])
  let fullUpload = false
  if (terrainChanged) {
    scene.terrainAtlasState = terrainAtlas(
      w.land,
      scene.terrainTextures,
      scene.terrainAtlasState,
      32,
      marks.pixels
    )
    fullUpload = scene.terrainAtlasState.updated > 0
    scene.terrainMapVersion = w.landVersion
    scene.terrainShadows.set(w.land.shadows)
  }
  if (!scene.terrainAtlasState || (!fullUpload && !marks.dirty.size)) return
  scene.terrainMap.image = { data: scene.terrainAtlasState.pixels, width: 4096, height: 4096 }
  // An unbound DataTexture supplies CPU pixels directly: one subimage upload
  // per tile, with no staging copies, extra draw calls or 64 MiB atlas upload.
  scene.terrainUpload.image = scene.terrainMap.image
  const region = new THREE.Box2()
  updateFootprintTiles(scene.terrainAtlasState, w.land, scene.terrainTextures, marks, (x, y) => {
    if (fullUpload) return
    region.min.set(x, y)
    region.max.set(x + 32, y + 32)
    scene.renderer.copyTextureToTexture(scene.terrainUpload, scene.terrainMap, region, region.min)
  })
  marks.dirty.clear()
  if (fullUpload) scene.terrainMap.needsUpdate = true
}

export function landIndex(scene: GameScene, x: number, z: number) {
  return ((Math.round((-z - 8) / 2) & 127) << 7) | (Math.round((x + 8) / 2) & 127)
}

export function updateWater(scene: GameScene) {
  if (!scene.waves) return
  const w = scene.world,
    key = `${w.turn}:${w.landVersion}:${w.lightRevision}:${scene.terrain.geometry.id}`
  if (key === scene.waterState) return
  scene.waterState = key
  // ponytail: simulation turns feed both clocks until the native outer
  // command loop is live; the original texture uses its separate outer turn.
  scene.waterScroll.value = (w.turn & 255) / 256
  const pos = scene.terrain.geometry.getAttribute('position'),
    surface = scene.terrain.geometry.getAttribute('surface'),
    light = scene.terrain.geometry.getAttribute('light'),
    highlight = scene.terrain.geometry.getAttribute('highlight')
  for (let j = 0; j < pos.count; j++) {
    const i = scene.landIndex(pos.getX(j), pos.getZ(j)),
      p = waterPoint(w.land, i, w.turn, scene.waves)
    // 0x4673b0 uses the same diffuse conversion on coast and land; only
    // open-water triangles suppress the additive warm light channel.
    const colors = vertexLighting(p.color, surface.getX(j) ? 0 : 0xfdb935)
    pos.setY(j, p.height / 128)
    light.setXYZ(
      j,
      ((colors.diffuse >>> 16) & 255) / 255,
      ((colors.diffuse >>> 8) & 255) / 255,
      (colors.diffuse & 255) / 255
    )
    highlight.setXYZ(
      j,
      ((colors.specular >>> 16) & 255) / 255,
      ((colors.specular >>> 8) & 255) / 255,
      (colors.specular & 255) / 255
    )
  }
  highlight.needsUpdate = true
  light.needsUpdate = true
  pos.needsUpdate = true
}

export function makeDecorations(scene: GameScene) {
  for (const tree of scene.world.trees) {
    if (tree.logs < 1) continue
    if (tree.model === 11) {
      const f: Effect = {
        ...tree,
        kind: 'trail',
        sprite: { sequence: 'log', frame: 0 },
        age: 0,
        duration: 1,
      }
      const g = scene.makeFx(f)
      scene.animateFx(g, f)
      scene.locate(g, tree)
      g.userData.point = tree
      scene.decorations.add(g)
      continue
    }
    const g = new THREE.Group()
    g.add(nativeModel(rules.sceneryObjects[tree.model]))
    scene.locate(g, tree)
    g.userData.point = tree
    scene.decorations.add(g)
  }
  for (const team of campaignShamanTeams(scene.world)) {
    const center = campaignPosition(scene.world, team)
    const stones = reincarnationStones(scene.world.land, nativePosition(scene.world, center))
    for (const stone of stones) {
      const group = new THREE.Group()
      group.name = 'reincarnation-stone'
      group.userData.groundPoint = browserPosition(stone)
      group.add(nativeModel(30))
      scene.locate(group, group.userData.groundPoint)
      scene.orientModel(group, (stone.heading * Math.PI) / 1024)
      placeReincarnationStone(scene, group)
      scene.decorations.add(group)
    }
  }
}

export function updateTerrainFrame(scene: GameScene) {
  if (scene.terrainVersion !== scene.world.landVersion) {
    scene.rebuildTerrain()
  }
  scene.updateTerrainTexture()
}

export function updateDecorationsFrame(scene: GameScene) {
  const trees = scene.world.trees.map(t => (t.logs >= 1 ? '1' : '0')).join('')
  if (trees !== scene.treeSignature) {
    scene.treeSignature = trees
    scene.releaseGroup(scene.decorations)
    scene.decorations.clear()
    scene.makeDecorations()
  }
  for (const group of scene.decorations.children) {
    if (group.userData.groundPoint) placeReincarnationStone(scene, group)
    const tree = group.userData.point as Tree | undefined
    if (tree && tree.model !== 11) {
      updateWaveShake(
        group as THREE.Group,
        tree,
        nativePosition(scene.world, tree),
        scene.gameClock.animationFrame,
        scene.waveFrames
      )
      const mesh = group.children[0] as THREE.Mesh
      mesh.userData.nativeSize =
        tree.burn?.scale ??
        timberScale(
          Math.round(tree.logs * 100),
          rules.sceneryWood[tree.model],
          nativeModels[rules.sceneryObjects[tree.model]].scale
        )
      group.visible = tree.logs > 0
    }
  }
}
