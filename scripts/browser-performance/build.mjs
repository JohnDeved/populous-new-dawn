// Executed from the trusted base checkout, never from either candidate's scripts.
import assert from 'node:assert/strict'
import { build } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/postcss'
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { execFileSync } from 'node:child_process'
const [sourceArgument, outputArgument, revision] = process.argv.slice(2)
assert.ok(sourceArgument && outputArgument && /^[a-f0-9]{40}$/.test(revision))
const source = resolve(sourceArgument), output = resolve(outputArgument)
assert.equal(execFileSync('git', ['rev-parse', 'HEAD'], { cwd: source, encoding: 'utf8' }).trim(), revision)
const fixture = resolve(output, 'fixture'), dist = resolve(output, 'dist')
mkdirSync(fixture, { recursive: true })
writeFileSync(resolve(fixture, 'index.html'), readFileSync(new URL('../tutorial-browser/fixture/index.html', import.meta.url)))
writeFileSync(resolve(fixture, 'main.tsx'), `import { createRoot } from 'react-dom/client'\nimport Home from ${JSON.stringify(resolve(source, 'app/page.tsx'))}\nimport ${JSON.stringify(resolve(source, 'app/globals.css'))}\ncreateRoot(document.getElementById('root')!).render(<Home />)\n`)
await build({ configFile: false, envFile: false, mode: 'production', root: fixture, publicDir: false,
  define: { __PND_BUILD_REVISION__: JSON.stringify(revision) }, plugins: [react()],
  // Ignore PR Vite/PostCSS configuration and resolve the locked base dependencies.
  css: { postcss: { plugins: [tailwindcss({ base: source })] } },
  resolve: { dedupe: ['react', 'react-dom', 'three'] },
  build: { outDir: dist, emptyOutDir: false, copyPublicDir: false, sourcemap: true, reportCompressedSize: false } })
