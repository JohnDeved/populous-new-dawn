// Read existing presentation/picker state only. These diagnostics never decide
// spell eligibility, change pickability, or issue an extra render.
export async function readMission1GuardPresentation(id) {
  const s = window.testSceneRef.current, w = s.world, u = w.units.find(unit => unit.id === id), errors = []
  const read = fn => { try { return fn() } catch (error) { if (errors.length < 4) errors.push(String(error)); return null } }
  let animation = null
  try { const { unitAnimationSource } = await import('/app/selection-runtime.ts'); animation = unitAnimationSource(u) }
  catch (error) { errors.push(String(error)) }
  const g = s.unitMeshes.get(id), layers = g?.userData.layers ?? [], layer = layers.findLast(piece => piece.visible)
  const source = layer && read(() => s.view.painter.source(layer))
  const fields = (value, keys) => value && Object.fromEntries(keys.map(key => [key, value[key] ?? null]))
  const owners = u && [['flight', u.flight], ['fight', u.fight?.motion], ['native', u.native], ['entry', u.entry?.person], ['builder', u.builder?.person]]
  return { turn: w.turn, paused: w.paused, sceneStoreMatches: w === window.testStore.getWorld(),
    guard: fields(u, ['id', 'kind', 'team', 'x', 'z', 'hp', 'inside', 'lift']),
    animationOwner: animation ? owners?.find(([, owner]) => owner === animation)?.[0] ?? 'other' : null,
    animation: fields(animation, ['id', 'model', 'state', 'draw', 'object', 'renderFlags', 'flags2', 'flags3', 'flags4']),
    native: fields(u?.native, ['id', 'model', 'state', 'renderFlags', 'flags2', 'flags3', 'flags4']),
    group: g && { visible: g.visible, ...fields(g.userData, ['pickable', 'frame', 'draw', 'drawFlags', 'spriteBucket', 'signature']) },
    personBounds: g ? read(() => s.picking.personBounds(id, s.renderer.domElement.getBoundingClientRect())) : null,
    layers: layers.slice(0, 8).map(piece => ({ name: piece.name, visible: piece.visible })),
    layerCount: layers.length, lastVisibleLayer: layer?.name ?? null,
    painterSource: fields(source, ['slot', 'alpha', 'bucket', 'cell', 'object', 'face', 'phase', 'order']) ?? null, errors }
}
