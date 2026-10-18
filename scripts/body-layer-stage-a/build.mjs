// Executed from the trusted base checkout, never from either candidate's scripts.
import assert from 'node:assert/strict'
import { build } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/postcss'
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { execFileSync } from 'node:child_process'
import { transformStart, installStartLatch } from './start-latch.mjs'
const [sourceArgument, outputArgument, revision] = process.argv.slice(2)
assert.ok(sourceArgument && outputArgument && /^[a-f0-9]{40}$/.test(revision))
const source = resolve(sourceArgument),
  output = resolve(outputArgument)
assert.equal(
  execFileSync('git', ['rev-parse', 'HEAD'], { cwd: source, encoding: 'utf8' }).trim(),
  revision
)
const fixture = resolve(output, 'fixture'),
  dist = resolve(output, 'dist')
const scenePath = resolve(source, 'app/scene.ts'),
  transformed = transformStart(readFileSync(scenePath, 'utf8'), revision)
const { checkpointCodec } = await import(
  resolve(source, 'scripts/tutorial-browser/checkpoint-codec.mjs')
)
mkdirSync(fixture, { recursive: true })
writeFileSync(
  resolve(output, 'start-transform.json'),
  JSON.stringify(
    {
      revision,
      originalSha256: transformed.originalSha256,
      transformedSha256: transformed.transformedSha256,
    },
    null,
    2
  )
)
writeFileSync(
  resolve(fixture, 'index.html'),
  readFileSync(resolve(source, 'scripts/tutorial-browser/fixture/index.html'))
)
writeFileSync(
  resolve(fixture, 'main.tsx'),
  `import { createRoot } from 'react-dom/client'\nimport Home from ${JSON.stringify(resolve(source, 'app/page.tsx'))}\nimport ${JSON.stringify(resolve(source, 'app/globals.css'))}\nimport * as THREE from 'three'\nObject.assign(window, { __bodyThree: THREE });\n(${installStartLatch.toString()})((${checkpointCodec.toString()}))\ncreateRoot(document.getElementById('root')!).render(<Home />)\n`
)
let startTransforms = 0
await build({
  configFile: false,
  envFile: false,
  mode: 'production',
  root: fixture,
  publicDir: false,
  define: { __PND_BUILD_REVISION__: JSON.stringify(revision) },
  plugins: [
    {
      name: 'exact-startup-latch',
      enforce: 'pre',
      transform(code, id) {
        if (id.split('?')[0] !== scenePath) return null
        startTransforms++
        assert.equal(startTransforms, 1, 'Repeated Scene transform')
        assert.equal(code, readFileSync(scenePath, 'utf8'))
        return { code: transformed.code, map: null }
      },
    },
    react(),
  ],
  // Ignore PR Vite/PostCSS configuration and resolve the locked base dependencies.
  css: { postcss: { plugins: [tailwindcss({ base: source })] } },
  resolve: { dedupe: ['react', 'react-dom', 'three'] },
  build: {
    outDir: dist,
    emptyOutDir: false,
    copyPublicDir: false,
    sourcemap: true,
    reportCompressedSize: false,
  },
})

assert.equal(startTransforms, 1, 'Startup latch transform was not consumed')
