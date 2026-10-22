// Structural React SSR only: real production TSX and React; CSS class identities
// are stable stand-ins. No effects, DOM mounting, browser layout or pixels here.
import { registerHooks } from 'node:module'
import { existsSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import ts from 'typescript'
registerHooks({
  resolve(specifier, context, next) {
    if (specifier === 'react' && context.parentURL?.endsWith('help-browser-article-surface.tsx?mock-hooks'))
      return next(new URL('./help-surface-hooks.mjs', import.meta.url).href, context)
    if (specifier.startsWith('.') && !/\.[a-z]+$/i.test(new URL(specifier, context.parentURL).pathname)) {
      for (const suffix of ['.ts', '.tsx']) {
        const url = new URL(specifier, context.parentURL)
        url.pathname += suffix
        if (existsSync(url)) return next(url.href, context)
      }
    }
    return next(specifier, context)
  },
  load(url, context, next) {
    if (url.endsWith('.css')) return { format: 'module', shortCircuit: true,
      source: 'export default new Proxy({}, { get: (_, key) => String(key) })' }
    if (url.endsWith('.json')) return { format: 'module', shortCircuit: true,
      source: `export default ${readFileSync(new URL(url), 'utf8')}` }
    if (new URL(url).pathname.endsWith('.tsx')) return { format: 'module', shortCircuit: true,
      source: ts.transpileModule(readFileSync(new URL(url), 'utf8'), { fileName: fileURLToPath(url),
        compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext,
          jsx: ts.JsxEmit.ReactJSX } }).outputText }
    return next(url, context)
  },
})
