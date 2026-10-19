// Test-only exact excerpts from rejected, unexecuted protocol revision 3.
// Original page SHA-256: 9feae4bc6cee03fca10473ed3ed0389b952ada21c46f25cf8c8f7ef01da40d0b
// Original protocol SHA-256: 4d0f89d75f4f78e3eec427aa0485de2337a2654d7b69bb7130feb1cc48bc134e
export const protocol = Object.freeze({
  version: 3,
  mode: 'untimed-pixels-only',
  baseline: '5087f2e805097665c4fdcce657553db3a693bb76',
  baselineTree: '6a1d5602531ab9afcf7d517884443fe938361d1e',
  candidate: '8bd14a84e34545f9a0f0b1fe5c1ebbf8267e5f59',
  candidateTree: 'b1e72fb19f19be1161303871b2185918eec2978e',
  viewport: { width: 1600, height: 1200 },
  drawingBuffer: { width: 1440, height: 1000 },
  order: [
    ['camera', 'baseline'],
    ['camera', 'candidate'],
    ['animation', 'baseline'],
    ['animation', 'candidate'],
  ],
  callbacks: 28,
  deltaMs: 1000 / 60,
  initialNow: 100000,
  pointerOffsets: [
    64, 0, 64, 0, 64, 0, 64, 0, 64, 0, 64, 0, 64, 0, 64, 0, 64, 0, 64, 0, 64, 0, 64, 0, 64, 0, 64,
    0,
  ],
  controls: [
    'overview',
    'return',
    'blended',
    'opaque-return',
    'hidden',
    'shown',
    'removed',
    'recreated',
    'override',
    'shared-points',
    'ignored-points',
    'points-hook',
  ],
  controlSizes: [
    { width: 640, height: 480 },
    { width: 1440, height: 1000 },
  ],
  totalMs: 720000,
  buildMs: 120000,
  childMs: 100000,
  childGraceMs: 5000,
  actionMs: 15000,
  launchMs: 30000,
  minimumStartBytes: 2 * 1024 ** 3,
  minimumFreeBytes: 512 * 1024 ** 2,
  maximumEvidenceBytes: 768 * 1024 ** 2,
})

export function controlRender({ name, size }) {
  const s = window.testSceneRef.current,
    T = window.__bodyThree
  cancelAnimationFrame(s.frame)
  if (!window.__bodyControl) {
    const entry = [...s.unitMeshes].find(
      ([, g]) =>
        g.visible && g.userData.layers?.some(l => l.visible && s.view.painter.depth(l, 0, 0) === 3)
    )
    if (!entry) throw Error('No naturally clipped body for control')
    const [id, g] = entry,
      u = s.world.units.find(u => u.id === id)
    if (!u) throw Error('Control unit missing')
    window.__bodyControl = {
      id,
      u,
      index: s.world.units.indexOf(u),
      drawFlags: g.userData.drawFlags,
    }
  }
  const c = window.__bodyControl
  if (window.__bodyExtra) {
    s.scene.remove(window.__bodyExtra)
    window.__bodyExtra.geometry.dispose()
    if (!window.__bodyExtra.userData.shared) window.__bodyExtra.material.dispose()
    delete window.__bodyExtra
  }
  if (s.scene.overrideMaterial) {
    s.scene.overrideMaterial.dispose()
    s.scene.overrideMaterial = null
  }
  s.world.paused = true
  s.overviewActive = name === 'overview'
  s.updateView()
  let g = s.unitMeshes.get(c.id)
  if (name === 'removed') {
    s.world.units.splice(
      s.world.units.findIndex(u => u.id === c.id),
      1
    )
    s.updateUnitsFrame()
  } else if (name === 'recreated') {
    s.world.units.splice(c.index, 0, c.u)
    s.updateUnitsFrame()
    g = s.unitMeshes.get(c.id)
  } else if (name === 'hidden') g.visible = false
  else if (name === 'shown') g.visible = true
  else if (name === 'blended' || name === 'opaque-return') {
    g.userData.drawFlags = name === 'blended' ? c.drawFlags | 4 : c.drawFlags
    if (!Number.isInteger(g.userData.frame)) throw Error('Missing actual displayed body frame')
    const directions = Array.from({ length: 8 }, () => ({
      frames: [g.userData.frame],
      flip: g.userData.frameFlip,
    }))
    s.animatePerson(g, c.u.heading, directions, 0, false, 0)
  } else if (name === 'override')
    s.scene.overrideMaterial = new T.ShaderMaterial({
      vertexShader: 'void main(){gl_Position=vec4(position.xy,0.,1.);}',
      fragmentShader: 'void main(){gl_FragColor=vec4(1.,0.,1.,1.);}',
    })
  else if (name === 'shared-points' || name === 'ignored-points' || name === 'points-hook') {
    const layer = g.userData.layers.find(l => l.visible)
    const extra = new T.Points(
      new T.BufferGeometry().setAttribute('position', new T.Float32BufferAttribute([0, 0, 0], 3)),
      name === 'points-hook' ? new T.PointsMaterial({ color: 0x00ff00 }) : layer.material
    )
    extra.userData.shared = name !== 'points-hook'
    extra.userData.nativeIgnore = name === 'ignored-points'
    if (name === 'points-hook')
      extra.material.onBeforeRender = () => {
        extra.userData.calls = (extra.userData.calls ?? 0) + 1
      }
    window.__bodyExtra = extra
    s.scene.add(extra)
  }
  if (size) {
    s.container.style.width = `${size.width}px`
    s.container.style.height = `${size.height}px`
    s.renderer.domElement.style.width = `${size.width}px`
    s.renderer.domElement.style.height = `${size.height}px`
    s.renderer.setSize(size.width, size.height, false)
    s.updateView()
  }
  s.renderSceneFrame(null, undefined)
  window.__bodyStep++
  return window.__bodyCapture()
}
