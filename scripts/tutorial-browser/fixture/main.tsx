import { campaignShamanReadiness } from '../../campaign-start-readiness.mjs'

// Bundle the shared pure observer in this test host. Production preview cannot
// resolve development-only /scripts imports; the shipped Home entry is unchanged.
Object.defineProperty(globalThis, '__pndCampaignReadiness', {
  value: Object.freeze({ observe: campaignShamanReadiness }),
  writable: false,
  configurable: false,
})

// Query-gated evidence references belong only to this test-host entry.
if (new URLSearchParams(location.search).get('owned-swamp-evidence') === '1') {
  const evidence = import('../../owned-swamp-evidence/fixture.mjs')
  Object.defineProperty(globalThis, '__pndOwnedSwampFixtureReady', {
    value: evidence, writable: false, configurable: false,
  })
  // The evidence runner must await this promise; rejected imports remain failures.
  void evidence.catch(() => {})
}
// Opt-in supplied Spy discovery state in the test host, never the shipped entry.
if (new URLSearchParams(location.search).get('spy-discovery-fixture') === '1') {
  const fixtureReady = import('../spy-discovery-fixture.mjs')
  Object.defineProperty(globalThis, '__pndSpyDiscoveryFixtureReady', {
    value: fixtureReady, writable: false, configurable: false,
  })
  // The runner must await this exact promise; rejected imports remain failures.
  void fixtureReady.catch(() => {})
}
// Supplied worship-slot boundary in the test host only.
if (new URLSearchParams(location.search).get('worship-panel-lifecycle') === '1') {
  void import('../worship-panel-fixture.mjs').then(fixture => {
    Object.defineProperty(globalThis, '__pndWorshipPanelFixture', { value: Object.freeze({ ...fixture }) })
  })
}
import { Matrix4 as PndReaderMatrix4 } from 'three'
Object.defineProperty(globalThis, '__pndReaderTypes', {
  value: Object.freeze({ Matrix4: PndReaderMatrix4 }),
  writable: false,
  configurable: false,
})
// Opt-in lifecycle fixture for the hosted browser test, never the shipped entry.
if (new URLSearchParams(location.search).get('building-panel-identity') === '1') {
  void import('../building-panel-fixture.mjs').then(fixture => {
    Object.defineProperty(globalThis, '__pndBuildingPanelFixture', {
      value: Object.freeze({ ...fixture }),
      writable: false,
      configurable: false,
    })
  })
}
// Hosted-only Tornado acceptance needs production module references after bundling.
if (new URLSearchParams(location.search).get('tornado-appearance') === '1') {
  void import('../tornado-fixture.mjs').then(fixture => {
    Object.defineProperty(globalThis, '__pndTornadoFixture', {
      value: Object.freeze({ ...fixture }),
      writable: false,
      configurable: false,
    })
  })
}
// Query-gated test-host bundle only; production Home never imports this fixture.
if (new URLSearchParams(location.search).get('hypnotise-fixture') === '1') {
  void import('../hypnotise-fixture.mjs').then(fixture => {
    Object.defineProperty(globalThis, '__pndHypnotiseFixture', {
      value: Object.freeze({ ...fixture }), writable: false, configurable: false,
    })
  })
}
// Dedicated modal evidence only. No production entry or existing scenario changes.
if (new URLSearchParams(location.search).get('modal-invalidation') === '1') {
  void import('../../modal-invalidation/fixture.mjs').then(fixture => {
    Object.defineProperty(globalThis, '__pndModalInvalidationFixture', {
      value: Object.freeze({ ...fixture }), writable: false, configurable: false,
    })
  })
}
import { createRoot } from 'react-dom/client'
import Home from '../../../app/page'
import type { GameScene, OrdinaryRenderObserver } from '../../../app/scene'

function followerCorpseRenderObserver(): OrdinaryRenderObserver {
  type World = GameScene['world']
  type Binding = { world: World; visit: (frameTime: number, stamp: number) => void; stop: (reason: string) => unknown }
  const bindings = new WeakMap<GameScene, Binding>()
  function bind(scene: GameScene, world: World, visit: Binding['visit'], stop: Binding['stop']) {
    if (scene.world !== world || bindings.has(scene)) throw Error('Corpse render binding is not unique')
    const binding = { world, visit, stop }
    bindings.set(scene, binding)
    return () => { if (bindings.get(scene) === binding) bindings.delete(scene) }
  }
  // Only the serialized browser observer needs this registration entry point.
  // It is not installed on the shipped page or for other test-host routes.
  Object.defineProperty(globalThis, '__pndBindFollowerCorpseRender', { value: bind })
  return {
    afterFrame(scene, world, frameTime) {
      const binding = bindings.get(scene)
      if (!binding) return
      if (binding.world !== world || scene.renderer.getRenderTarget() !== null) {
        // The observer also checks exact store / canvas ownership and monotonicity.
        binding.visit(frameTime, Number.NaN)
        return
      }
      binding.visit(frameTime, scene.renderer.info.render.frame)
    },
    onDispose(scene) {
      const binding = bindings.get(scene)
      bindings.delete(scene)
      binding?.stop('scene-disposed')
    },
  }
}
import '../../../app/globals.css'
// Separate component-only scroll evidence. Home is imported but never mounted on this route.
if (new URLSearchParams(location.search).get('pause-checkpoint-scroll-stress') === '1') {
  void import('./pause-checkpoint-scroll-stress').then(({ default: Stress }) => {
    createRoot(document.getElementById('root')!).render(<Stress />)
  })
} else {
  const ordinaryRenderObserver = new URLSearchParams(location.search).get('follower-corpse-render') === '1'
    ? followerCorpseRenderObserver() : undefined
  createRoot(document.getElementById('root')!).render(<Home ordinaryRenderObserver={ordinaryRenderObserver} />)
}
