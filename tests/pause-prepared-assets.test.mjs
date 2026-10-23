import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import ts from 'typescript'
const require = createRequire(import.meta.url)
const emitted = ts.transpileModule(readFileSync(new URL('../app/original-pause-menu.tsx', import.meta.url), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 },
}).outputText
const tree = node => [node, ...[node?.props?.children].flat(Infinity).filter(child => child && typeof child === 'object').flatMap(tree)]
for (const fonts of [false, true]) test(`pause prepared font=${fonts} is used on first render and warm remount without decode`, () => {
  const prepared = Object.freeze({ fonts, sliders: true, images: Object.freeze([]) })
  for (let mount = 0; mount < 2; mount++) {
    const effects = [], component = { exports: {} }
    const react = { useRef: current => ({ current }), useState: initial => [initial, () => {}], useEffect: effect => effects.push(effect) }
    const window = { innerWidth: 1280, innerHeight: 800, addEventListener() {}, removeEventListener() {} }
    class Image { constructor() { assert.fail('prepared pause must not construct or decode an image') } }
    new Function('require', 'module', 'exports', 'window', 'Image', emitted)(name => {
      if (name === 'react') return react
      if (name === 'react/jsx-runtime') return require(name)
      if (name.endsWith('.json')) return JSON.parse(readFileSync(new URL('../app/' + name.slice(2), import.meta.url)))
      if (name === './checkpoint-scroll') return { CHECKPOINT_COPY_WIDTH: 368 }
      if (name === './checkpoint-scroll-area') return { CheckpointScrollArea: ({ children }) => require('react/jsx-runtime').jsx('div', { tabIndex: 0, 'aria-label': 'Checkpoint details', children }) }
      if (name === './frontend-composition') return { frontendScale: () => 5 / 3 }
      if (name.endsWith('.module.css')) return {}
      throw Error(`Unexpected dependency: ${name}`)
    }, component, component.exports, window, Image)
    const output = component.exports.OriginalPauseMenu({ prepared, tutorial: false, hasCheckpoint: true })
    const rows = tree(output).filter(node => node?.props && 'ready' in node.props)
    assert.equal(rows.length, 8)
    rows.forEach(row => assert.equal(row.props.ready, fonts))
    effects.map(effect => effect()).forEach(cleanup => cleanup?.())
  }
})
