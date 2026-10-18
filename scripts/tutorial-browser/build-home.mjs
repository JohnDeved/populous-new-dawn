import { build } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/postcss'
import { resolve } from 'node:path'
import { buildRevision } from './build-provenance.mjs'
const [fixture, output] = process.argv.slice(2)
if (!fixture || !output) throw Error('Require fixture and fresh output')
await build({
  configFile: false,
  mode: 'production',
  define: { __PND_BUILD_REVISION__: JSON.stringify(buildRevision(resolve(import.meta.dirname, '../..'))) },
  root: resolve(fixture),
  publicDir: false,
  plugins: [react()],
  css: { postcss: { plugins: [tailwindcss({ base: resolve(fixture) })] } },
  build: { outDir: resolve(output), emptyOutDir: false, copyPublicDir: false, sourcemap: true, reportCompressedSize: false },
})
