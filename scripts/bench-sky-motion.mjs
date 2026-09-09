// Sky motion + lens CPU cost only; this does not measure GPU drawing or game FPS.
import { writeFileSync } from 'node:fs'
import { cpus, platform, arch } from 'node:os'
import { createSkyMotion, updateSkyArray, fillSkyArray } from '../app/sky.ts'
import { advanceSkyMotion } from '../app/sky-motion.ts'

const pose = time => ({ x: (65000 + time * 800) % 65536, y: (200 + time * 300) % 65536, angle: (time * 350) % 2048 })
function run(modern, hz, frames) {
  const grid = new Int32Array(4992), owned = createSkyMotion(), display = createSkyMotion()
  updateSkyArray(owned, pose(0), 0, grid)
  let step = 0, previous = 0
  const start = performance.now()
  for (let frame = 1; frame <= frames; frame++) {
    const time = frame / hz
    if (modern) {
      while ((step + 1) / 24 <= time + 1e-9) {
        advanceSkyMotion(owned, pose(++step / 24), 1 / 24)
      }
      Object.assign(display, owned)
      advanceSkyMotion(display, pose(time), Math.max(0, time - step / 24))
      fillSkyArray(grid, Math.round(display.angle) & 2047, Math.trunc(display.x * 512), Math.trunc(display.y * 512))
    } else {
      const ticks = (Math.floor(time * 1000) - Math.floor(previous * 1000)) * 64
      updateSkyArray(owned, pose(time), ticks, grid)
    }
    previous = time
  }
  return { ms: (performance.now() - start) / frames, checksum: grid[100] }
}
const rows = []
for (const hz of [5, 60, 240]) {
  run(false, hz, 1000)
  run(true, hz, 1000)
  const batches = []
  for (let i = 0; i < 9; i++) {
    const values = {}
    for (const modern of i % 2 ? [true, false] : [false, true]) values[modern] = run(modern, hz, 2000)
    batches.push({ original: values.false, modern: values.true })
  }
  const median = values => values.sort((a, b) => a - b)[4],
    originalMs = median(batches.map(b => b.original.ms)), modernMs = median(batches.map(b => b.modern.ms))
  rows.push({ hz, originalMs, modernMs, deltaMicroseconds: (modernMs - originalMs) * 1000, batches })
}
const rateComparison = [5, 30, 60, 120, 144, 240].map(hz => {
  const oldWind = createSkyMotion(), newWind = createSkyMotion(),
    oldTurn = createSkyMotion(), newTurn = createSkyMotion(), grid = new Int32Array(4992)
  let previous = 0
  for (let frame = 1; frame <= hz; frame++) {
    const milliseconds = Math.floor(frame * 1000 / hz),
      ticks = (milliseconds - previous) * 64, camera = { x: 0, y: 0, angle: 0 }
    updateSkyArray(oldWind, camera, ticks, grid)
    advanceSkyMotion(newWind, camera, 1 / hz)
    camera.angle = frame * 400 / hz
    updateSkyArray(oldTurn, camera, ticks, grid)
    advanceSkyMotion(newTurn, camera, 1 / hz)
    previous = milliseconds
  }
  return { hz, oldWind: [oldWind.x, oldWind.y], newWind: [newWind.x, newWind.y], oldTurn: oldTurn.angle, newTurn: newTurn.angle }
})
const report = { date: new Date().toISOString(), runtime: process.version, cpu: cpus()[0].model,
  os: platform(), arch: arch(), rateComparison, mode: 'Motion and full lens grid; 1000 warmup frames per mode, nine alternating 2000-frame batches; camera snapshots at 24 Hz, no GPU or scene update', rows }
writeFileSync(process.argv[2] ?? '/private/tmp/populous-sky-motion-cpu.json', JSON.stringify(report, null, 2) + '\n')
console.log(JSON.stringify(rows.map(({ batches, ...row }) => row), null, 2))
