// Reviewed source-owner boundary for the new held-drag cohort only. Candidate
// files are read as bounded data, never imported, parsed as executable code or run.
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

export const dragContract = Object.freeze({ version: 2, phase: 'native-view-drag-warm',
  pointerOffsets: [[1, 0], [0, 0], [1, 0], [0, 0], [1, 0], [0, 0]],
  warmup: { steps: 6, callbacksPerStep: 4, purpose: 'first-use native-drag in this prepared workload',
    retention: 'all raw callbacks; no size trimming', return: 'exact angle-zero pose and geometry; index version advances six' },
  input: 'public held-right pointermove; right-down/release unmeasured',
  firstInputGeometry: 'pre-input native prefix; post-input ordinary prefix',
  firstProjection: 'view-invalidated native projection; settled no-work observations',
  poseWidth: 72, projectionWidth: 44,
  sourceContract: 'atomic exact generic/owned routing profiles; projection kernel remains reviewable',
  limitation: 'Endpoint witnesses and source-owner binding do not observe transient unversioned mutation inside a query.',
})
// Profiles are whole reviewed routes, not independent per-owner alternatives.
export const dragSourceSlices = Object.freeze([
  {
    "id": "input-move",
    "path": "app/scene-input-runtime.ts",
    "start": "export function pointerMove(",
    "end": "\nexport function updateDrag(",
    "sha256": "7903395203655a1d4a0361d8ad6bd00ea878a44844990181128fad8dd22625be"
  },
  {
    "id": "pointer-callback",
    "path": "app/scene-input-runtime.ts",
    "start": "export function updatePointerFrame(",
    "end": "\nexport function updateSpellPointerFrame(",
    "sha256": "8f0549696e9474b1573436a41a7040e553e44c79c7b3bb8e4c2a18a060518c0c"
  },
  {
    "id": "tooltip-order",
    "path": "app/scene-tooltip-runtime.ts",
    "start": "export function publishTooltipInput(",
    "end": "\nexport function cancelTooltipInspection(",
    "sha256": "c39efeea8249b5fe25cbdcaae78552c73fcddf4252e135c3a988130569c8e471"
  },
  {
    "id": "frame-order",
    "path": "app/scene.ts",
    "start": "  animate = (now: number) => {",
    "end": "\n  private updateTerrainFrame()",
    "sha256": "a108152922381c53f20693f2ac62c1ecdc601f3f05e1bad0f383519df8328aa3"
  },
  {
    "id": "frame-facades",
    "path": "app/scene.ts",
    "start": "  private updateTerrainFrame()",
    "end": "\n  private updateSpellPointerFrame(",
    "sha256": "13bc9f25008153680e1526b0cb8854ac337594e8ee7631a283d80efde3677052"
  },
  {
    "id": "view-facade",
    "path": "app/scene.ts",
    "start": "  updateView() {",
    "end": "\n  currentPreset()",
    "sha256": "c87a04b3b8310491049fdfd5b264fd9ef55bcd172f0c5a0b20f8b3123ed2adce"
  },
  {
    "id": "native-route",
    "path": "app/scene-picking.ts",
    "start": "  pick(event:",
    "end": "\n  pickPerson(event:",
    "sha256": "80d43ac8561bb04fbc6f4491ad9a8d0e91395cb63bf08ce1997173298bb3ccc9"
  },
  {
    "id": "submission-key",
    "path": "app/render-view.ts",
    "start": "  pickSubmissionKey(objects:",
    "end": "\n  // Pick the projected triangles themselves.",
    "sha256": "5e18c8d895f34b4b0f161c08993932ab41be6a4f53fe585d77641921e5c9c67a"
  },
  {
    "id": "query-entry",
    "path": "app/render-view.ts",
    "start": "  pickCandidates(",
    "end": "\n  private collectPickCandidates(",
    "sha256": "c0e450b5af50913d7278a6fbba76e50c6b323af1c8a5096f21beb74f2f7d392c"
  },
  {
    "id": "query-inputs",
    "path": "app/render-view.ts",
    "start": "  private collectPickCandidates(",
    "end": "\n          for (let vertex = 0; vertex < count; vertex++) {",
    "sha256": "62d763225a3b4b9499fb0767d40793f4f02ea9ddfa5f8e360fe20dfaf63a2922"
  },
  {
    "id": "camera-producers",
    "path": "app/scene-camera-runtime.ts",
    "start": null,
    "end": null,
    "sha256": "458fa0be8df6e0ab718c1006b0f54f4b703e877850afd2896249544b9dcddad8"
  },
  {
    "id": "terrain-producers",
    "path": "app/scene-terrain-runtime.ts",
    "start": null,
    "end": null,
    "sha256": "a2cb6c361c3c20b2984947a7d6f95abb9626c4183ed729bd4adfbeac2fbb5830"
  },
  {
    "id": "public-terrain-dispatch",
    "path": "app/scene-input-runtime.ts",
    "start": "export function pick(",
    "end": "\nexport function pickWorldObject(",
    "sha256": "17b25565640a5d346ab2ad34089b5a4c4bfcbf693012a29ac018e0243c7be185"
  },
  {
    "id": "terrain-constructor",
    "path": "app/scene.ts",
    "start": "    this.cursor.visible = false\n    this.range.visible = false\n    this.rebuildTerrain()",
    "end": "\n    this.makeDecorations()",
    "sha256": "aa8cae70b0f7701adafdde3568bb3a79e15536fb1d99ddef8804de623f36112a"
  },
  {
    "id": "owned-terrain-helper",
    "path": "app/runtime-terrain-picking.ts",
    "absentFile": true
  },
  {
    "id": "owned-terrain-entry",
    "path": "app/render-view.ts",
    "absentMarker": "  pickOwnedTerrain("
  }
].map(Object.freeze))
const ownedRouteOverrides = {
  "query-entry": {
    "id": "query-entry",
    "path": "app/render-view.ts",
    "start": "  pickCandidates(",
    "end": "\n  private collectPickCandidates(",
    "sha256": "5344885e512cc204ccbd721fb5210977eb9b16efa7dc55de39ee72b235cb1bb8"
  },
  "query-inputs": {
    "id": "query-inputs",
    "path": "app/render-view.ts",
    "start": "  private collectPickCandidates(",
    "end": "\n          for (let vertex = 0; vertex < count; vertex++) {",
    "sha256": "766eeb9c4c381ce38f1e718e13f8ba9cf79ae912bd1b0031fae36dbcb10c2a0e"
  },
  "terrain-producers": {
    "id": "terrain-producers",
    "path": "app/scene-terrain-runtime.ts",
    "start": null,
    "end": null,
    "sha256": "dc14566b740986371148d787257891351a3ca0f7ea236cda730cba542f50a3ad"
  },
  "public-terrain-dispatch": {
    "id": "public-terrain-dispatch",
    "path": "app/scene-input-runtime.ts",
    "start": "export function pick(",
    "end": "\nexport function pickWorldObject(",
    "sha256": "a741a336fe45b51c5225dd75eca1ab2a0a5c27a8f3b29a72ec377d8f7ec3ae2b"
  },
  "terrain-constructor": {
    "id": "terrain-constructor",
    "path": "app/scene.ts",
    "start": "    this.cursor.visible = false\n    this.range.visible = false\n    this.rebuildTerrain()",
    "end": "\n    this.makeDecorations()",
    "sha256": "0a604ca13b5cf53f13bcbabd37a79d240018addd4e9943c95cd90d93dc9f03f2"
  },
  "owned-terrain-helper": {
    "id": "owned-terrain-helper",
    "path": "app/runtime-terrain-picking.ts",
    "start": null,
    "end": null,
    "sha256": "2a43f16d67f4f542d7b281af4e26bacfe19815f0c40565ab873ecde7ad8494d2"
  },
  "owned-terrain-entry": {
    "id": "owned-terrain-entry",
    "path": "app/render-view.ts",
    "start": "  pickOwnedTerrain(",
    "end": "\n  releaseOrdinaryNumericProjection()",
    "sha256": "c69ef62767a9417c736a1cc6636fdfba48ee81e305a995d0001d06d760741e86"
  }
}
const historicalDragSourceProfiles = Object.freeze([
  Object.freeze({ id: 'generic-terrain-v1', slices: dragSourceSlices }),
  Object.freeze({ id: 'owned-numeric-terrain-v1', slices: Object.freeze(dragSourceSlices.map(
    slice => Object.freeze(ownedRouteOverrides[slice.id] ?? slice))) }),
  // The neutral browser cursor adds lifecycle resets and a post-pointer update.
  // Keep historical profiles exact; this route binds both changed frame order
  // and the complete cursor owner. See neutral-canvas-cursor.md source review.
  Object.freeze({ id: 'owned-numeric-terrain-neutral-cursor-v1', slices: Object.freeze([
    ...dragSourceSlices.map(slice => Object.freeze(slice.id === 'frame-order'
      ? { ...slice, sha256: '27ed72fea09df7d40a3e632ca56da9aa487a2df73dc950655f74bf1bb7b93adf' }
      : ownedRouteOverrides[slice.id] ?? slice)),
    Object.freeze({ id: 'neutral-cursor-owner', path: 'app/neutral-cursor.ts', start: null, end: null,
      sha256: '33753cbc3d3ab607f8d6efb1f3fd486ed7d0a5ad51ddd52e90216f3bed6d7ea7' }),
  ]) }),
  // Independently reviewed optional instance-path counters change only the exact
  // query-inputs prefix. Preserve every historical profile and slice boundary.
  Object.freeze({ id: 'owned-numeric-terrain-neutral-cursor-pick-paths-v1', slices: Object.freeze([
    ...dragSourceSlices.map(slice => Object.freeze(slice.id === 'query-inputs'
      ? { ...slice, sha256: 'c3b43f1239d7f441378bca9466f092fa70425e3b2e85e4805d097b31b9f0485c' }
      : slice.id === 'frame-order'
        ? { ...slice, sha256: '27ed72fea09df7d40a3e632ca56da9aa487a2df73dc950655f74bf1bb7b93adf' }
        : ownedRouteOverrides[slice.id] ?? slice)),
    Object.freeze({ id: 'neutral-cursor-owner', path: 'app/neutral-cursor.ts', start: null, end: null,
      sha256: '33753cbc3d3ab607f8d6efb1f3fd486ed7d0a5ad51ddd52e90216f3bed6d7ea7' }),
  ]) }),
  // The reviewed F8 epoch fix changes only the pointer-callback recording argument.
  // Bind its complete route without admitting unreviewed mixtures of old slices.
  Object.freeze({ id: 'owned-numeric-terrain-neutral-cursor-pick-paths-epoch-v1', slices: Object.freeze([
    ...dragSourceSlices.map(slice => Object.freeze(slice.id === 'pointer-callback'
      ? { ...slice, sha256: '741e838886ad865d30e675158c627bb1056b0d4b0c04ee32f0b15296bd2b1895' }
      : slice.id === 'query-inputs'
        ? { ...slice, sha256: 'c3b43f1239d7f441378bca9466f092fa70425e3b2e85e4805d097b31b9f0485c' }
        : slice.id === 'frame-order'
          ? { ...slice, sha256: '27ed72fea09df7d40a3e632ca56da9aa487a2df73dc950655f74bf1bb7b93adf' }
          : ownedRouteOverrides[slice.id] ?? slice)),
    Object.freeze({ id: 'neutral-cursor-owner', path: 'app/neutral-cursor.ts', start: null, end: null,
      sha256: '33753cbc3d3ab607f8d6efb1f3fd486ed7d0a5ad51ddd52e90216f3bed6d7ea7' }),
  ]) }),
  // Terminal CPU-owner guards preserve the active route and recorder epoch.
  // Bind both the complete frame and terrain producer deltas atomically; keep
  // every historical route exact. This admits source, not timing equivalence.
  Object.freeze({ id: 'owned-numeric-terrain-neutral-cursor-pick-paths-epoch-disposed-cpu-v1', slices: Object.freeze([
    ...dragSourceSlices.map(slice => Object.freeze(slice.id === 'pointer-callback'
      ? { ...slice, sha256: '741e838886ad865d30e675158c627bb1056b0d4b0c04ee32f0b15296bd2b1895' }
      : slice.id === 'query-inputs'
        ? { ...slice, sha256: 'c3b43f1239d7f441378bca9466f092fa70425e3b2e85e4805d097b31b9f0485c' }
        : slice.id === 'frame-order'
          ? { ...slice, sha256: 'cb8253460282f1ca9605e4b7a4d43b6c6a2844816fd53b5e3b01ae2d7514cd08' }
          : slice.id === 'terrain-producers'
            ? { ...slice, sha256: '1deea6f19952acbc62e064a4b40c8ba21e85ef677b5e72062b8a3d310fdec012' }
            : ownedRouteOverrides[slice.id] ?? slice)),
    Object.freeze({ id: 'neutral-cursor-owner', path: 'app/neutral-cursor.ts', start: null, end: null,
      sha256: '33753cbc3d3ab607f8d6efb1f3fd486ed7d0a5ad51ddd52e90216f3bed6d7ea7' }),
  ]) }),
  // Reviewed RenderView CPU leases extend the epoch route, not its historical
  // hashes. Bind the new helper body too; call-site hashes alone are insufficient.
  // This admits exact source, not timing equivalence or retrospective reports.
  Object.freeze({ id: 'owned-numeric-terrain-neutral-cursor-pick-paths-epoch-render-cpu-leases-v1', slices: Object.freeze([
    ...dragSourceSlices.map(slice => {
      const inherited = ownedRouteOverrides[slice.id] ?? slice
      const sha256 = {
        'submission-key': '851a6568e0d0cd0e998c4465a04f74648bcf98c8aca7e58889d0533959d71c63',
        'query-entry': '53d968701fa1a46599f3c32470db0d917fe9559cae74c72abb82514a70a8d67e',
        'owned-terrain-entry': '7f554b1b133b1873d4c5f0779c8d9424c0dcc546bfff6d2e87e35edbb45369fa',
        'pointer-callback': '741e838886ad865d30e675158c627bb1056b0d4b0c04ee32f0b15296bd2b1895',
        'query-inputs': 'c3b43f1239d7f441378bca9466f092fa70425e3b2e85e4805d097b31b9f0485c',
        'frame-order': '27ed72fea09df7d40a3e632ca56da9aa487a2df73dc950655f74bf1bb7b93adf',
      }[slice.id]
      return Object.freeze(sha256 ? { ...inherited, sha256 } : inherited)
    }),
    Object.freeze({ id: 'neutral-cursor-owner', path: 'app/neutral-cursor.ts', start: null, end: null,
      sha256: '33753cbc3d3ab607f8d6efb1f3fd486ed7d0a5ad51ddd52e90216f3bed6d7ea7' }),
    Object.freeze({ id: 'pick-operation-leases', path: 'app/render-view.ts',
      start: '  private beginPickOperation()', end: '\n  private resolveCandidates(',
      sha256: '3949a4264ea8c4d612658cdbc0c6923b028af8457ef04656319378dc22f6b41a' }),
  ]) }),
  // Compose both reviewed CPU-lifetime changes as one exact route. Preserve
  // each sibling profile; this is source admission, not measured equivalence.
  Object.freeze({ id: 'owned-numeric-terrain-neutral-cursor-pick-paths-epoch-disposed-cpu-render-cpu-leases-v1', slices: Object.freeze([
    ...dragSourceSlices.map(slice => {
      const inherited = ownedRouteOverrides[slice.id] ?? slice
      const sha256 = {
        'submission-key': '851a6568e0d0cd0e998c4465a04f74648bcf98c8aca7e58889d0533959d71c63',
        'query-entry': '53d968701fa1a46599f3c32470db0d917fe9559cae74c72abb82514a70a8d67e',
        'owned-terrain-entry': '7f554b1b133b1873d4c5f0779c8d9424c0dcc546bfff6d2e87e35edbb45369fa',
        'pointer-callback': '741e838886ad865d30e675158c627bb1056b0d4b0c04ee32f0b15296bd2b1895',
        'query-inputs': 'c3b43f1239d7f441378bca9466f092fa70425e3b2e85e4805d097b31b9f0485c',
        'frame-order': 'cb8253460282f1ca9605e4b7a4d43b6c6a2844816fd53b5e3b01ae2d7514cd08',
        'terrain-producers': '1deea6f19952acbc62e064a4b40c8ba21e85ef677b5e72062b8a3d310fdec012',
      }[slice.id]
      return Object.freeze(sha256 ? { ...inherited, sha256 } : inherited)
    }),
    Object.freeze({ id: 'neutral-cursor-owner', path: 'app/neutral-cursor.ts', start: null, end: null,
      sha256: '33753cbc3d3ab607f8d6efb1f3fd486ed7d0a5ad51ddd52e90216f3bed6d7ea7' }),
    Object.freeze({ id: 'pick-operation-leases', path: 'app/render-view.ts',
      start: '  private beginPickOperation()', end: '\n  private resolveCandidates(',
      sha256: '3949a4264ea8c4d612658cdbc0c6923b028af8457ef04656319378dc22f6b41a' }),
  ]) }),
])
// Reviewed loose-log sprite hits extend only the complete current CPU-owner route.
// Historical routes remain byte-exact; no new-log/old-CPU mixtures are admitted.
// Bind the shared queue resolver too, not just its new call-site submissions.
// This is source admission only, not performance equivalence or a new benchmark.
const mainDragSourceProfiles = Object.freeze([
  ...historicalDragSourceProfiles,
  Object.freeze({ id: 'owned-numeric-terrain-neutral-cursor-pick-paths-epoch-disposed-cpu-render-cpu-leases-loose-log-v1', slices: Object.freeze([
    ...historicalDragSourceProfiles.at(-1).slices.map(slice => Object.freeze(
      slice.id === 'native-route' ? { ...slice,
        sha256: '4c06971b6ece6c52eebc066fe594af406551cf362d9660db2c0e774d5bf9b344' } : slice)),
    Object.freeze({ id: 'resource-queue-owner', path: 'app/world-picking.ts', start: null, end: null,
      sha256: '45d4f2f5a49ba2af665e24eb8c6dc5e671f7aa360788de04b8ca55f40a0bc611' }),
  ]) }),
])
// Preserve the two exact UI historical routes separately from main's branch-local
// inheritance. No historical profile, source boundary or digest is refreshed.
const uiDragSourceProfiles = Object.freeze([
  // The reviewed native route tooltip keeps eligible 24 Hz visits during ordinary
  // pause without advancing flyby or sky. Bind the complete camera owner and keep
  // the historical epoch route exact; no other slice or boundary changes here.
  Object.freeze({ id: 'owned-numeric-terrain-neutral-cursor-pick-paths-epoch-route-tooltip-v1', slices: Object.freeze([
    ...dragSourceSlices.map(slice => Object.freeze(slice.id === 'camera-producers'
      ? { ...slice, sha256: 'cd3b53fce3efc61851ceb0c34d11d35d13a15cac7162753d8b1677c7d2b8875e' }
      : slice.id === 'pointer-callback'
        ? { ...slice, sha256: '741e838886ad865d30e675158c627bb1056b0d4b0c04ee32f0b15296bd2b1895' }
        : slice.id === 'query-inputs'
          ? { ...slice, sha256: 'c3b43f1239d7f441378bca9466f092fa70425e3b2e85e4805d097b31b9f0485c' }
          : slice.id === 'frame-order'
            ? { ...slice, sha256: '27ed72fea09df7d40a3e632ca56da9aa487a2df73dc950655f74bf1bb7b93adf' }
            : ownedRouteOverrides[slice.id] ?? slice)),
    Object.freeze({ id: 'neutral-cursor-owner', path: 'app/neutral-cursor.ts', start: null, end: null,
      sha256: '33753cbc3d3ab607f8d6efb1f3fd486ed7d0a5ad51ddd52e90216f3bed6d7ea7' }),
  ]) }),
  // The native-result integration adds a pause-independent presentation clock
  // before the existing modal/simulation frame gates. Admit that complete frame
  // route only with its exact import, per-scene initialization and clock owner.
  // All older profiles remain byte-for-byte identical. This admits source owners,
  // not native scheduler equivalence or an unmeasured performance comparison.
  Object.freeze({ id: 'owned-numeric-terrain-neutral-cursor-pick-paths-epoch-route-tooltip-result-clock-v1', slices: Object.freeze([
    ...dragSourceSlices.map(slice => Object.freeze(slice.id === 'camera-producers'
      ? { ...slice, sha256: 'cd3b53fce3efc61851ceb0c34d11d35d13a15cac7162753d8b1677c7d2b8875e' }
      : slice.id === 'pointer-callback'
        ? { ...slice, sha256: '741e838886ad865d30e675158c627bb1056b0d4b0c04ee32f0b15296bd2b1895' }
        : slice.id === 'query-inputs'
          ? { ...slice, sha256: 'c3b43f1239d7f441378bca9466f092fa70425e3b2e85e4805d097b31b9f0485c' }
          : slice.id === 'frame-order'
            ? { ...slice, sha256: '5c8dbbf4dc2caaf257c7eedb472dcd7caeca30aeda695dd2fa0294934a6aeb50' }
            : ownedRouteOverrides[slice.id] ?? slice)),
    Object.freeze({ id: 'neutral-cursor-owner', path: 'app/neutral-cursor.ts', start: null, end: null,
      sha256: '33753cbc3d3ab607f8d6efb1f3fd486ed7d0a5ad51ddd52e90216f3bed6d7ea7' }),
    Object.freeze({ id: 'result-clock-owner', path: 'app/result-session.ts',
      start: 'export function createResultClock()', end: '\nexport function resultBlink(',
      sha256: 'e13cdfd3133fb3867b5dac81fcda0bef017db7a7eacdd5174ec5d60339a46976' }),
    Object.freeze({ id: 'result-clock-import', path: 'app/scene.ts',
      start: 'import { createResultClock, advanceResultClock }', end: '\nimport { FollowerNearbyMode }',
      sha256: 'fd473366de9695475cdb1e1ed6190c2dbbfa778851186442377e638dd4b40052' }),
    Object.freeze({ id: 'result-clock-initialization', path: 'app/scene.ts',
      start: '  resultClock = createResultClock()', end: '\n  focusPauseOwned =',
      sha256: 'ac3b234a89c07d24ca0ebc49a91617029e37018708cb32f18ab1329870752f6f' }),
  ]) }),
])
// This new atomic route composes reviewed owner bytes, not independent per-owner
// allowlists. It adds no timing/performance claim or capture/retention allowance.
const composedDragSourceProfile = Object.freeze({
  id: 'owned-numeric-terrain-neutral-cursor-pick-paths-epoch-disposed-cpu-render-cpu-leases-loose-log-route-tooltip-result-clock-v1',
  slices: Object.freeze([
    ...mainDragSourceProfiles.find(profile => profile.id === 'owned-numeric-terrain-neutral-cursor-pick-paths-epoch-disposed-cpu-render-cpu-leases-loose-log-v1').slices
      .map(slice => Object.freeze(slice.id === 'camera-producers'
        ? { ...slice, sha256: 'cd3b53fce3efc61851ceb0c34d11d35d13a15cac7162753d8b1677c7d2b8875e' }
        : slice.id === 'frame-order'
          ? { ...slice, sha256: 'b21655fc1ea8787294beb80db52f8113a36a10f3fefe1ea4a0515a1b8f190cd1' }
          : slice)),
    ...uiDragSourceProfiles.find(profile => profile.id === 'owned-numeric-terrain-neutral-cursor-pick-paths-epoch-route-tooltip-result-clock-v1').slices
      .filter(slice => ['result-clock-owner', 'result-clock-import', 'result-clock-initialization'].includes(slice.id)),
  ]),
})
// Additive callback-retirement composition. Historical profiles stay exact;
// new admission binds both producer changes and the invoked owner predicate.
// No timing, capture, retention, runtime or performance acceptance is implied.
const callbackRetirementDragSourceProfile = Object.freeze({
  id: "owned-numeric-terrain-neutral-cursor-pick-paths-epoch-disposed-cpu-render-cpu-leases-loose-log-route-tooltip-result-clock-tooltip-retirement-v1",
  slices: Object.freeze([
    ...composedDragSourceProfile.slices.map(slice => Object.freeze(
      slice.id === 'camera-producers' ? { ...slice, sha256: "a750b893a1bccc9b547085d6b7bcfe83c4b04c025cee2590c2965374bebe1338" }
        : slice.id === 'frame-order' ? { ...slice, sha256: "5a45d023cdf1e6bfe328d46c2ad87df9a489e16ef5f29bd5b32cfc7560e92cf2" } : slice)),
    Object.freeze({"id": "tooltip-retirement-owner", "path": "app/scene-tooltip-runtime.ts", "start": "export function acquireForcedTooltip(", "end": "\n// Normal world painting clears status ownership.", "sha256": "e3dc96c1980527f5ee816f1e9c2ee1855c92ee8aad06460fa946fb0220b88144"}),
    Object.freeze({"id": "scene-current-owner", "path": "app/scene.ts", "start": "  isCurrent() {", "end": "\n  canRequestNearbyFollowers()", "sha256": "4c75b4cd3726d00472121d5ef31b706ad3c8a003f05ff65ce6e451d8f305c8fd"}),
  ]),
})
export const dragSourceProfiles = Object.freeze([
  ...mainDragSourceProfiles, ...uiDragSourceProfiles, composedDragSourceProfile,
  callbackRetirementDragSourceProfile,
])
const hash = value => createHash('sha256').update(value).digest('hex')
export function inspectDragSource(root, read = path => readFileSync(resolve(root, path), 'utf8')) {
  // Cache success AND failure once across all profile attempts. A missing path is not
  // interchangeable with an unreadable, empty, non-string or oversized source.
  const files = new Map()
  const file = path => {
    if (!files.has(path)) {
      try {
        const text = read(path)
        if (typeof text !== 'string' || Buffer.byteLength(text) > 1024 * 1024) throw Error('source-bound')
        files.set(path, { text })
      } catch (error) { files.set(path, { missing: error?.code === 'ENOENT' }) }
    }
    return files.get(path)
  }
  const profiles = dragSourceProfiles.map(profile => {
    const slices = profile.slices.map(spec => {
      const source = file(spec.path)
      let actualSha256 = null, reason = null
      if (spec.absentFile) {
        if (!source.missing) reason = source.text === undefined ? 'source-unavailable-or-boundary' : 'source-present'
        if (source.text !== undefined) actualSha256 = hash(source.text)
      } else if (source.text === undefined) reason = 'source-unavailable-or-boundary'
      else if (spec.absentMarker) {
        actualSha256 = hash(source.text)
        if (source.text.includes(spec.absentMarker)) reason = 'source-present'
      } else {
        try {
          const text = source.text
          let part = text
          if (spec.start !== null) {
            const start = text.indexOf(spec.start), end = text.indexOf(spec.end)
            if (start < 0 || end <= start || text.indexOf(spec.start, start + spec.start.length) >= 0 ||
                text.indexOf(spec.end, end + spec.end.length) >= 0) throw Error('source-boundary')
            part = text.slice(start, end)
          }
          actualSha256 = hash(part)
          if (actualSha256 !== spec.sha256) reason = 'source-changed'
        } catch { reason = 'source-unavailable-or-boundary' }
      }
      return { id: spec.id, expectedSha256: spec.sha256 ?? null, actualSha256, reason }
    })
    return { id: profile.id, status: slices.every(slice => slice.reason === null) ? 'admitted' : 'unsupported-source-contract', slices }
  })
  const admitted = profiles.filter(profile => profile.status === 'admitted')
  const selected = admitted.length === 1 ? admitted[0] : null
  return { version: 2, status: selected ? 'admitted' : 'unsupported-source-contract',
    profile: selected?.id ?? null, slices: (selected ?? profiles[0]).slices, profiles }
}
