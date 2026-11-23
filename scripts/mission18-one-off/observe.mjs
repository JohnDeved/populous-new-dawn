// Passed directly to page.evaluate; reads the attached world but never writes game state.
export function snapshotMission18() {
  const scene = window.testSceneRef?.current, world = window.testStore?.getWorld()
  if (!world || scene?.world !== world || !scene.renderer?.domElement?.isConnected ||
      document.querySelector('.loading-world')) return null
  const site = world.levelStart.map(x => ({
    tribe: x.tribe, shaman: x.shaman, phase: x.phase, liveWave: x.wave != null,
    visibleStones: x.stoneTurns.filter(turn => turn != null).length,
  }))
  const authored = new Set([464, 465, 466, 467, 468, 469])
  const ids = predicate => world.units.filter(predicate).map(p => p.id).sort((a, b) => a - b)
  const gl = scene.renderer.getContext()
  const ext = gl.getExtension('WEBGL_debug_renderer_info')
  const p = scene.camera.position, q = scene.camera.quaternion
  return {
    turn: world.turn, level: world.outcome.level, status: world.status,
    pause: world.paused, speed: world.speed, inputMask: world.inputMask, lastMessage: world.lastMessage,
    originalWildmen: ids(p => p.team === 'wild' && authored.has(p.id)),
    blueBraves: ids(p => p.team === 'blue' && p.kind === 'brave'),
    blueShaman: ids(p => p.team === 'blue' && p.kind === 'shaman'),
    convertWild: world.shots.convertWild, site,
    contextLost: gl.isContextLost(),
    renderer: gl.getParameter(ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER),
    webglVersion: gl.getParameter(gl.VERSION),
    buffer: [gl.drawingBufferWidth, gl.drawingBufferHeight],
    viewport: [window.innerWidth, window.innerHeight, window.devicePixelRatio],
    camera: [p.x, p.y, p.z, q.x, q.y, q.z, q.w],
  }
}

// 'wait' is not evidence; the caller polls within its own deadline. Do not clear
// a pause by direct state alteration, skip, or blind click.
export function classifyMission18(s, role, stage) {
  const bounds = { early:[0,20], active:[12,70], later:[70,150] }
  const [first,last] = bounds[stage] ?? []
  if (!['baseline','candidate'].includes(role) || first === undefined) throw Error('Unreviewed arm or phase')
  if (!s) return 'wait'
  if (s.level !== 18 || s.status !== 'playing' || s.speed !== 1 || !Number.isInteger(s.turn) ||
      s.contextLost !== false || !/^WebGL 2\.0/.test(s.webglVersion) || s.convertWild !== 0 ||
      s.blueShaman.length !== 1 || s.blueShaman[0] !== 339)
    return 'invalid'
  if (s.turn > last) return 'missed'
  // Respect native inputMask during the flyby (observation only). Synchronous
  // an attached World may be paused for a message; caller must bracket afresh.
  if (s.pause !== false) return 'paused'
  const units = s.originalWildmen.length, braves = s.blueBraves.length
  if (new Set([...s.originalWildmen,...s.blueBraves]).size !== units + braves ||
      s.originalWildmen.some(i => !Number.isInteger(i) || i < 464 || i > 469) ||
      braves + units !== 6) return 'invalid'
  const x = s.site[0]
  if (role === 'baseline') {
    if (s.site.length !== 0 || units !== 6 || braves !== 0) return 'invalid'
    return s.turn >= (stage === 'active' ? 23 : first) ? 'take' : 'wait'
  }
  if (s.site.length !== 1 || x.tribe !== 0 || x.shaman !== 339 ||
      ![0,1,2,3,4].includes(x.phase) || (x.liveWave && x.phase !== 2)) return 'invalid'
  if (s.turn < first) return 'wait'
  if (stage === 'early') return x.phase <= 2 && units > 0 ? 'take' : 'missed'
  if (stage === 'active') {
    if (x.phase < 2 || braves === 0) return 'wait'
    if (x.phase === 2 && x.liveWave) return 'take'
    if (x.phase === 3 && x.visibleStones > 0) return 'take'
    return x.phase === 4 ? 'missed' : 'wait'
  }
  return x.phase === 4 && units === 0 && braves === 6 && !x.liveWave ? 'take' : 'wait'
}
