// Recreate the retained comparison implementation locally, outside shipped assets.
import { execFileSync } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'

export const painterBaselineCommit =
  process.env.POPULOUS_PAINTER_BASELINE ?? 'd7f33d90e498755cdc1db0802c6729423bd098a0'
export function preparePainterBaseline() {
  const root = new URL('../', import.meta.url)
  const source = execFileSync('git', ['show', `${painterBaselineCommit}:app/painter.ts`], {
    cwd: root,
    encoding: 'utf8',
  }).replaceAll("from './", "from '../../app/")
  mkdirSync(new URL('.tools/performance/', root), { recursive: true })
  writeFileSync(new URL('.tools/performance/painter-baseline.ts', root), source)
}

export async function installPainterBaseline(page) {
  await page.evaluate(async () => {
    const { Painter } = await import('/.tools/performance/painter-baseline.ts')
    const s = window.testScene
    window.painters = [new Painter(s.view), s.view.painter]
    window.selectPainter = optimized => {
      s.view.painter = window.painters[Number(optimized)]
      s.view.painter.landFlags = s.world.land.flags
      s.view.painter.cells = s.world.objectCells
      s.view.uniforms.nativePainter.value = s.view.painter.texture
    }
  })
}
