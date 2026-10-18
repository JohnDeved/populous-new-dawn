// Reviewed source-owner boundary for the new held-drag cohort only. Candidate
// files are read as bounded data, never imported, parsed as executable code or run.
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

export const dragContract = Object.freeze({ version: 1, phase: 'native-view-drag',
  pointerOffsets: [[1, 0], [0, 0], [1, 0], [0, 0], [1, 0], [0, 0]],
  input: 'public held-right pointermove; right-down/release unmeasured',
  firstInputGeometry: 'pre-input native prefix; post-input ordinary prefix',
  firstProjection: 'view-invalidated native projection; settled no-work observations',
  poseWidth: 72, projectionWidth: 44,
  sourceContract: 'exact reviewed routing/admission owners; projection kernel remains reviewable',
  limitation: 'Endpoint witnesses and source-owner binding do not observe transient unversioned mutation inside a query.',
})
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
    "end": "\n          // Share only exact shipped-grid corners newly projected in this query.",
    "sha256": "1a361b3eb7ccc4ece3b1ed98f62faad0330da56184eaa03f9984dcc947c2ff95"
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
  }
])
const hash = value => createHash('sha256').update(value).digest('hex')
export function inspectDragSource(root, read = path => readFileSync(resolve(root, path), 'utf8')) {
  const files = new Map(), slices = []
  for (const spec of dragSourceSlices) {
    let actualSha256 = null, reason = null
    try {
      if (!files.has(spec.path)) {
        const text = read(spec.path)
        if (typeof text !== 'string' || Buffer.byteLength(text) > 1024 * 1024) throw Error('source-bound')
        files.set(spec.path, text)
      }
      const text = files.get(spec.path)
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
    slices.push({ id: spec.id, expectedSha256: spec.sha256, actualSha256, reason })
  }
  return { version: 1, status: slices.every(slice => slice.reason === null) ? 'admitted' : 'unsupported-source-contract', slices }
}
