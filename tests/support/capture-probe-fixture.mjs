import assert from 'node:assert/strict'
import { installCaptureProbe } from '../../scripts/tutorial-browser/capture-probe.mjs'
const { create } = installCaptureProbe()
export const suppliedHeaderPng = 'data:image/png;base64,' + Buffer.from([137,80,78,71,13,10,26,10,0,0,0,0]).toString('base64')
// Supplied API lifecycle fixture only. PNG header is not decoded image evidence.
export function captureProbeFixture(alter = {}, overrides = {}) {
  const trace = [], canvases = [], contexts = []
  let now = 10, counter = 0
  const source = { width: 960, height: 720, isConnected: true }
  const state = { scene: {}, world: {}, person: {}, source, width: 960, height: 720,
    stamp: 453, turn: 379, animationFrame: 10, actorId: 54, actorKind: 'shaman', actorTeam: 'blue', hp: 30,
    started: 379, opponent: 19, fightGroup: 1, action: 'special', speed: 1, paused: false,
    visible: true, connected: true, sceneStoreMatch: true, profile: 'supplied-source-only',
    viewportWidth: 960, viewportHeight: 720, dpr: 1 }
  const selection = { eligible: true, clip: { x: 10, y: 20, width: 2, height: 2 },
    visibility: { bodyCanvasOwned: true, bodyInCanvas: true, cropOverlayClear: true } }
  const document = { createElement(tag) {
    assert.equal(tag, 'canvas')
    const number = counter++
    trace.push(['create', number])
    if (alter.reuseCanvas && canvases.length) return canvases[0]
    if (alter.create) return alter.create({ number, source, canvases })
    const copy = { _width: 0, _height: 0,
      get width() { return this._width }, set width(value) {
        if (value === 0 && alter.cleanup === number) throw Error('supplied cleanup failure')
        this._width = value; trace.push(['width', number, value])
      },
      get height() { return this._height }, set height(value) { this._height = value; trace.push(['height', number, value]) },
      getContext(...args) {
        trace.push(['context', number, ...args])
        if (alter.context === number) return null
        if (alter.contextThrow === number) throw Error('supplied context throw')
        const context = { drawImage(...args) {
          trace.push(['draw', number, args[0] === source, ...args.slice(1)])
          if (alter.draw === number) throw Error('supplied draw failure')
          alter.afterDraw?.({ number, state, source, copy })
        },
        getImageData(x,y,width,height) {
          trace.push(['read', number, x,y,width,height])
          if (alter.read === number) throw Error('supplied read failure')
          const data = new Uint8ClampedArray(width * height * 4)
          for (let at=0; at<data.length; at++) data[at] = at % 256
          if (alter.mismatch === number) data[0]++
          return alter.readDimensions === number ? { width: 1, height: 1, data: new Uint8ClampedArray(4) } : { width, height, data, colorSpace: 'srgb' }
        },
        getContextAttributes: () => alter.attributes ? alter.attributes({ number, args }) : ({ alpha: true, colorSpace: 'srgb', colorType: 'unorm8', desynchronized: false, willReadFrequently: args[1]?.willReadFrequently ?? false }),
        isContextLost: () => alter.lost === number }
        contexts.push(context)
        return alter.reuseContext && contexts.length > 1 ? contexts[0] : context
      },
      toDataURL(type) {
        assert.equal(type, 'image/png'); trace.push(['encode', number])
        if (alter.encode === number) throw Error('supplied encode failure')
        return alter.png?.(number) ?? suppliedHeaderPng
      } }
    canvases.push(copy)
    return copy
  } }
  const probe = create({ document, now: () => ++now, readState: () => state,
    routeStartMs: 0, caseStartMs: 0, launcherDeadlineMs: 180000, episodeId: 'supplied', canonicalPngByteLimit: 8388608,
    ...overrides })
  const sample = () => ({ id: 54, action: state.action, started: state.started, fightGroup: state.fightGroup,
    opponent: state.opponent, object: 19, draw: 5, f1: 0, f2: state.turn - 379, direction: 2,
    turn: state.turn, stamp: state.stamp, rafTimestampMs: now, callbackEntryMs: now })
  const capture = (select = () => structuredClone(selection)) => probe.capture(sample(), select)
  const next = () => { state.turn++; state.stamp++; state.animationFrame++ }
  return { document, probe, trace, state, source, selection, canvases, capture, sample, next, setNow: value => { now = value } }
}