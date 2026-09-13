import * as THREE from 'three'
import nativeModelData from './original-models.json'
import { modelDepthBias, modelStage, modelTextureModes, type NativeModel } from './model-faces.ts'
import { modelLighting, modelWaveOffsets } from './model-lighting.ts'
import nativeUnits from './original-units.json'
import nativeEffects from './original-effects.json'
import { lightningTexture } from './lightning.ts'

export const nativeModels: Record<number, NativeModel> = nativeModelData
export const material = (color: number, extra = {}) =>
  new THREE.MeshStandardMaterial({ color, roughness: 1, ...extra })
const textures = new Map<string, { texture: THREE.Texture; ready: Promise<boolean> }>()
export function texture(kind: string) {
  return loadTexture(kind).texture
}
export function loadTexture(kind: string) {
  const cached = textures.get(kind)
  if (cached) return cached
  let loaded!: (success: boolean) => void
  const ready = new Promise<boolean>(resolve => {
    loaded = resolve
  })
  const t =
    kind === 'lightning-bolt'
      ? new THREE.DataTexture(lightningTexture(), 32, 32)
      : new THREE.TextureLoader().load(
          `/original/${kind}.png`,
          () => loaded(true),
          undefined,
          error => {
            console.error(`Texture load failed: ${kind}`, error)
            loaded(false)
          }
        )
  if (kind === 'lightning-bolt') {
    loaded(true)
    t.needsUpdate = true
    t.minFilter = THREE.LinearFilter
    t.magFilter = THREE.LinearFilter
    t.generateMipmaps = false
  }
  t.colorSpace =
    kind.endsWith('detail') || kind === 'lightning-bolt' ? THREE.NoColorSpace : THREE.SRGBColorSpace
  t.wrapT = THREE.RepeatWrapping
  t.wrapS = THREE.RepeatWrapping
  t.anisotropy = 8
  if (kind === 'atlas' || kind === 'sky' || kind === 'clouds' || kind === 'clouds-high') {
    // 0x47cc60 / 0x47d6f0: ordinary smoothed textures use bilinear
    // filtering of encoded palette colors, without mipmaps or anisotropy.
    t.colorSpace = THREE.NoColorSpace
    t.userData.encodedColors = true
    t.minFilter = THREE.LinearFilter
    t.magFilter = THREE.LinearFilter
    t.generateMipmaps = false
    t.anisotropy = 1
  }
  if (
    kind === nativeUnits.atlas ||
    kind === 'effects' ||
    kind === 'selection' ||
    kind === 'unit-health'
  ) {
    t.minFilter = THREE.NearestFilter
    t.magFilter = THREE.NearestFilter
    t.generateMipmaps = false
  }
  const result = { texture: t, ready }
  textures.set(kind, result)
  return result
}
export function effectFrame(sprite: THREE.Sprite, frame: { index: number; w: number; h: number }) {
  const uv = (sprite.userData.atlasTransform ??= new THREE.Vector4())
  uv.set(
    frame.w / nativeEffects.width,
    frame.h / nativeEffects.height,
    ((frame.index % 8) * 256) / nativeEffects.width,
    1 - (Math.floor(frame.index / 8) * 256 + frame.h) / nativeEffects.height
  )
  sprite.scale.set(frame.w, frame.h, 1)
}
export function nativeModel(id: number, scale = 2, stage = 4) {
  const data = nativeModels[id]
  const geo = geometry(`original-${id}-${stage}`, () => {
    const { p, uv } = modelStage(data, stage),
      g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3))
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2))
    g.setAttribute('painterBias', new THREE.Float32BufferAttribute(modelDepthBias(data, stage), 1))
    g.setAttribute(
      'textureMode',
      new THREE.Float32BufferAttribute(modelTextureModes(data, stage), 1)
    )
    g.setAttribute(
      'nativeWaveOffset',
      new THREE.Float32BufferAttribute(new Float32Array((p.length / 3) * 2), 2)
    )
    g.computeVertexNormals()
    return g
  })
  const mesh = new THREE.Mesh(
    geo.clone(),
    // Native screen-space winding is clockwise after the WebGL Y inversion.
    // 0x4708d0 culls rear faces; 0x471c40 keeps both construction-stage sides.
    new THREE.MeshBasicMaterial({
      map: texture('atlas'),
      side: stage === 4 ? THREE.BackSide : THREE.DoubleSide,
      alphaTest: 0.5,
    })
  )
  mesh.scale.setScalar(scale)
  mesh.material.defines = { USE_MODEL_WAVE: '' }
  mesh.userData.nativeModel = id
  mesh.userData.stage = stage
  mesh.userData.nativeScale = data.scale
  mesh.userData.highlight = { value: 0 }
  mesh.material.onBeforeCompile = shader => {
    shader.uniforms.modelHighlight = mesh.userData.highlight
    shader.vertexShader =
      `attribute float faceShade;
attribute vec3 faceAnchor;
attribute float textureMode;
varying float modelLight;
varying float modelTextureMode;
` + shader.vertexShader
    shader.vertexShader = shader.vertexShader.replace(
      '#include <begin_vertex>',
      `
      #include <begin_vertex>
      modelTextureMode=textureMode;
      ivec3 anchor=ivec3(faceAnchor);
      anchor=ivec3(nativeMul(anchor.x,int(nativeObjectScale)),nativeMul(anchor.y,int(nativeObjectScale)),nativeMul(anchor.z,int(nativeObjectScale)))>>8;
      anchor=(ivec3(nativeDot(anchor,nativeObjectBasis[0]),nativeDot(anchor,nativeObjectBasis[1]),nativeDot(anchor,nativeObjectBasis[2]))>>14)+nativeOrigin(modelMatrix[3].xyz);
      int depth=nativeDot(anchor,nativeBasis[2])>>14;
      modelLight=float(depth>-3328?max(1,int(faceShade)+nativeMul(-3328-depth,32)/8192):int(faceShade));
    `
    )
    shader.fragmentShader =
      'uniform float modelHighlight;\nvarying float modelLight;\nvarying float modelTextureMode;\n' +
      shader.fragmentShader
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <colorspace_fragment>',
      `
      #include <colorspace_fragment>
      int shade=int(modelLight+.5), strength=clamp(shade*5-160,0,256);
      vec3 highlight=vec3((ivec3(253,185,53)*strength)>>8)/255.;
      float diffuse=modelHighlight>0.?modelHighlight:float(shade<32?shade*8:255);
      // 0x4673b0 overrides diffuse after lighting, retaining numeric specular.
      if(modelTextureMode==3.||modelTextureMode==4.||modelTextureMode==32.)diffuse=255.;
      gl_FragColor.rgb=gl_FragColor.rgb*diffuse/255.+(modelHighlight>0.?vec3(0.):highlight);
    `
    )
  }
  mesh.material.customProgramCacheKey = () => 'native-model-light'
  return mesh
}
export function updateModelLighting(object: THREE.Object3D) {
  if (!(object instanceof THREE.Mesh) || object.userData.nativeModel === undefined) return
  const { nativeModel: id, nativeSize, stage } = object.userData,
    heading = object.parent?.userData.nativeHeading ?? 0,
    tilt = object.parent?.userData.nativeTilt ?? 0,
    roll = object.parent?.userData.nativeRoll ?? 0,
    position = object.geometry.getAttribute('position') as THREE.BufferAttribute,
    key = `${heading}-${tilt}-${roll}-${nativeSize}-${position.version}`
  const wave = object.parent?.userData.nativeWave as
      | { phase: number; origin: number; x: number; y: number }
      | undefined,
    waveKey = wave
      ? `${wave.phase}-${wave.origin}-${wave.x}-${wave.y}-${heading}-${tilt}-${roll}-${nativeSize}-${position.version}`
      : '0'
  if (object.userData.waveKey !== waveKey) {
    const attribute = object.geometry.getAttribute('nativeWaveOffset') as THREE.BufferAttribute
    attribute.array.fill(0)
    if (wave)
      attribute.array.set(
        modelWaveOffsets(
          nativeModels[id],
          position.array,
          nativeSize ?? nativeModels[id].scale,
          heading,
          wave,
          wave.origin,
          wave.phase,
          tilt,
          roll
        )
      )
    attribute.needsUpdate = true
    object.userData.waveKey = waveKey
  }
  if (object.userData.lightKey === key) return
  const { shades, anchors } = modelLighting(
    nativeModels[id],
    position.array,
    stage,
    heading,
    nativeSize,
    tilt,
    roll
  )
  for (const [name, values, size] of [
    ['faceShade', shades, 1],
    ['faceAnchor', anchors, 3],
  ] as const) {
    const attribute = object.geometry.getAttribute(name) as THREE.BufferAttribute | undefined
    if (attribute) {
      attribute.array.set(values)
      attribute.needsUpdate = true
    } else object.geometry.setAttribute(name, new THREE.Float32BufferAttribute(values, size))
  }
  object.userData.lightKey = key
}
const meshes = new Map<string, THREE.BufferGeometry>()
export function geometry(key: string, create: () => THREE.BufferGeometry) {
  if (!meshes.has(key)) meshes.set(key, create())
  return meshes.get(key)!
}
export const box = (x: number, y: number, z: number) =>
  geometry(`b${x},${y},${z}`, () => new THREE.BoxGeometry(x, y, z))
export function part(
  group: THREE.Group,
  geo: THREE.BufferGeometry,
  mat: THREE.Material,
  x = 0,
  y = 0,
  z = 0
) {
  const m = new THREE.Mesh(geo, mat)
  m.position.set(x, y, z)
  m.castShadow = true
  m.receiveShadow = true
  group.add(m)
  return m
}
export function releaseGroup(g: THREE.Object3D) {
    const materials = new Set<THREE.Material>(),
      sharedTextures = new Set([...textures.values()].map(asset => asset.texture))
    g.traverse(o => {
      if (o instanceof THREE.Sprite) {
        // Atlas images belong to the shared texture cache, not individual particles.
        if (o.material.map && !sharedTextures.has(o.material.map)) o.material.map.dispose()
        materials.add(o.material)
      }
      if (o instanceof THREE.Mesh || o instanceof THREE.Line) {
        if (![...meshes.values()].includes(o.geometry)) o.geometry.dispose()
        ;(Array.isArray(o.material) ? o.material : [o.material]).forEach(m => materials.add(m))
      }
    })
    materials.forEach(m => m.dispose())
  }
