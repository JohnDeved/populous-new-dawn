// Retain the real previous selector, not a new approximation of its work.
import { execFileSync } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'

export const terrainCopiesBaseline = 'be78f473d1358cb1d437a2c7a6c2fe7bc91484eb'
export function prepareTerrainCopiesBaseline() {
  const root = new URL('../', import.meta.url)
  const source = execFileSync('git', ['show', `${terrainCopiesBaseline}:app/render-view.ts`], {
    cwd: root,
    encoding: 'utf8',
  }).replaceAll("from './", "from '../../app/")
  mkdirSync(new URL('.tools/performance/', root), { recursive: true })
  writeFileSync(new URL('.tools/performance/terrain-baseline.ts', root), source)
}

export async function installTerrainCopiesBaseline(page) {
  await page.evaluate(async () => {
    const { RenderView } = await import('/.tools/performance/terrain-baseline.ts')
    const { terrainTiles } = await import('/app/terrain-visibility.ts')
    const s = window.testScene,
      update = s.view.updateTerrainVisibility,
      viewUpdate = s.view.update
    window.selectViewportBounds = optimized => {
      s.view.update = optimized ? viewUpdate : RenderView.prototype.update
      s.updateView()
    }
    window.selectTerrainCopies = optimized => {
      s.view.updateTerrainVisibility = optimized
        ? update
        : RenderView.prototype.updateTerrainVisibility
      if (!optimized)
        s.scene.traverse(object => {
          if (!object.isInstancedMesh || !object.userData.terrainGrid) return
          const matrix = object.matrixWorld.clone()
          terrainTiles.forEach(([x, z], i) =>
            object.setMatrixAt(i, matrix.makeTranslation(x * 256, 0, z * 256))
          )
          object.count = terrainTiles.length
          object.instanceMatrix.needsUpdate = true
        })
    }
  })
}
