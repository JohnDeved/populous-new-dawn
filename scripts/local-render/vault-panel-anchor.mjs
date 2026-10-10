import { terrainPointHeight } from '../../app/native-terrain.ts'
import { projectPoint, relativeCoordinate } from '../../app/projection.ts'

// Passive, stage-time M3 reference. The authored socket is explicit so this does
// not obtain its expectation from the live panel placement helper under test.
export function readVaultPanelAnchor(scene, targetId) {
  const { world, view } = scene, head = world.shrines.find(s => s.id === targetId)
  if (world.outcome.level !== 3 || head?.kind !== 'vault' || head.mode !== 4 ||
    head.x !== -37 || head.z !== -133 || head.angle !== 0 || ![152, 153, 154, 155].includes(head.model))
    throw Error('Authored M3 Vault pose required for socket reference')
  const socket = { x: 58112, y: 32000, heightOffset: 480 }
  const ground = terrainPointHeight(world.land, socket)
  const rect = element => {
    const { left, top, width, height } = element.getBoundingClientRect()
    return { left, top, width, height }
  }
  const renderer = rect(scene.renderer.domElement), container = rect(scene.container)
  const panel = scene.objectPanels.panels.get(targetId), element = panel?.element
  const scale = element ? Number.parseFloat(getComputedStyle(element).getPropertyValue('--hud-scale')) || 1 : null
  const width = panel?.canvas.width ?? 0, height = panel?.canvas.height ?? 0
  const rendererLeft = renderer.left - container.left, rendererTop = renderer.top - container.top
  const expected = heightOffset => {
    const projected = projectPoint({ x: relativeCoordinate(socket.x, view.center.x),
      y: ground + heightOffset, z: relativeCoordinate(socket.y, view.center.y) }, view.projection)
    const raw = { x: rendererLeft + projected.screenX * renderer.width / view.projection.width,
      y: rendererTop + projected.screenY * renderer.height / view.projection.height }
    const clamped = { x: Math.max(rendererLeft + width * scale / 2,
      Math.min(rendererLeft + renderer.width - width * scale / 2, raw.x)),
    y: Math.max(rendererTop + height * scale, Math.min(rendererTop + renderer.height, raw.y)) }
    return { heightOffset, projected, raw, clamped }
  }
  const bounds = element ? rect(element) : null
  return {
    turn: world.turn, animationFrame: scene.gameClock.animationFrame, panelFrame: scene.objectPanels.frame,
    head: { id: head.id, kind: head.kind, mode: head.mode, model: head.model, x: head.x, z: head.z, angle: head.angle },
    socket, ground, renderer, container, scale, width, height,
    camera: { center: { ...view.center }, rawCenter: { ...view.rawCenter }, angle: view.angle,
      overview: view.overview, projection: structuredClone(view.projection) },
    expected: { socket0: expected(480), legacy: expected(1028), reward: expected(1072) },
    dom: element ? { connected: element.isConnected, hidden: element.hidden, bounds,
      inline: { x: Number.parseFloat(element.style.left), y: Number.parseFloat(element.style.top) },
      tail: { x: bounds.left + bounds.width / 2 - container.left,
        y: bounds.top + bounds.height - container.top } } : null,
  }
}
