// Synthetic data only. This is not a claim of browser module delivery.
export function spyDeliveryFixture() {
  const sha256 = '7ec23575119be18bb18ddba834c393527ed8a93f321a1b5a0acf4e82410270ee'
  return { version: 1, method: 'test-routed-native-esm',
    cachePolicy: 'playwright-routing-disables-http-cache', path: 'scripts/controlled-scene-frames.mjs',
    sha256, bytes: 4308, imports: [], origin: 'http://127.0.0.1:5198',
    pathname: '/scripts/controlled-scene-frames.mjs', url: 'http://127.0.0.1:5198/scripts/controlled-scene-frames.mjs',
    requests: 1, fulfilled: 1, installed: true, removed: true, routeRemoved: true, listenerRemoved: true, cacheReused: true, error: null,
    preflight: { sha256, bytes: 4308, status: 200, beforeCapture: true,
      exports: { keys: ['CONTROLLED_FRAME_MS', 'runSceneFrames'], frameMs: 1000 / 24, runType: 'function' } } }
}

export const corruptSpyDelivery = [
  r => { r.evidenceVersion = 2 }, r => { delete r.delivery },
  r => { r.delivery.cachePolicy = 'natural-http-cache' }, r => { r.delivery.version = 0 }, r => { r.delivery.method = 'production-served' },
  r => { r.delivery.sha256 = 'f'.repeat(64) }, r => { r.delivery.bytes++ },
  r => { r.delivery.imports = ['./unqualified.mjs'] },
  r => { r.delivery.url += '?other' }, r => { r.delivery.origin = 'https://other.invalid' },
  r => { r.delivery.pathname = '/other' }, r => { r.delivery.requests++ },
  r => { r.delivery.fulfilled = 0 }, r => { r.delivery.installed = false },
  r => { r.delivery.removed = false }, r => { r.delivery.routeRemoved = false },
  r => { r.delivery.listenerRemoved = false }, r => { r.delivery.cacheReused = false },
  r => { r.delivery.error = 'foreign handler' }, r => { r.delivery.preflight.beforeCapture = false },
  r => { r.delivery.preflight.sha256 = 'e'.repeat(64) },
  r => { r.delivery.preflight.exports.keys.push('extra') },
]
