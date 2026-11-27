import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { runInNewContext } from 'node:vm'
import ts from 'typescript'
import { hudScale } from '../app/hud-layout.ts'
import { pauseStatusLayout } from '../app/pause-status-layout.ts'

test('the ordinary Home resize callback retains native message-strip width independently of height and HUD preference', () => {
  const text = readFileSync(new URL('../app/page.tsx', import.meta.url), 'utf8')
  const ast = ts.createSourceFile('page.tsx', text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
  const declarations = ast.statements.filter(s => ts.isVariableStatement(s) &&
    s.declarationList.declarations.some(d => d.name.getText(ast) === 'messageScreenX'))
  const home = ast.statements.find(s => ts.isFunctionDeclaration(s) && s.name?.getText(ast) === 'Home')
  const effects = home.body.statements.filter(s => ts.isExpressionStatement(s) && ts.isCallExpression(s.expression) &&
    s.expression.expression.getText(ast) === 'useEffect' && s.getText(ast).includes("'--message-width'"))
  assert.equal(declarations.length, 1)
  assert.equal(effects.length, 1)
  const code = ts.transpileModule(declarations[0].getText(ast) + '\n' + effects[0].getText(ast), {
    compilerOptions: { target: ts.ScriptTarget.ES2022 },
  }).outputText
  for (const hudSize of ['auto', '1', '4']) {
    const writes = new Map(), handlers = new Map()
    const window = {
      innerWidth: 640, innerHeight: 480,
      addEventListener(type, handler) { handlers.set(type, handler) },
      removeEventListener(type, handler) { assert.equal(handlers.get(type), handler); handlers.delete(type) },
    }
    let cleanup
    // Execute the shipping observer callback against CPU window/style sinks,
    // not a DOM rectangle or a second implementation of the app's callback.
    runInNewContext(code, {
      window, hudSize, hudScale, pauseStatusLayout, setMessageViewportHeight() {},
      shell: { current: { style: { setProperty(key, value) { writes.set(key, value) } } } },
      useEffect(effect) { cleanup = effect() },
    })
    assert.equal(writes.get('--message-width'), '32px')
    // Fixed widths from the independent original 0044a1f0 / 004314c0 calculation.
    for (const [width, height, expected] of [[621, 480, 32], [641, 480, 32], [641, 700, 32], [800, 600, 41],
      [1024, 300, 52], [1440, 1000, 74], [3440, 1440, 177]]) {
      Object.assign(window, { innerWidth: width, innerHeight: height })
      handlers.get('resize')()
      assert.equal(writes.get('--message-width'), expected + 'px', `${width}×${height} at HUD size ${hudSize}`)
    }
    cleanup()
    assert.equal(handlers.size, 0)
  }
})
