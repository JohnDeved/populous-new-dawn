import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import ts from 'typescript'

export const pageSource = ts.createSourceFile('page.tsx', readFileSync(new URL('../../app/page.tsx', import.meta.url), 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
export function pageNode(predicate) {
  const matches = []
  function visit(node) {
    if (predicate(node)) matches.push(node)
    ts.forEachChild(node, visit)
  }
  visit(pageSource)
  assert.equal(matches.length, 1, 'one actual Page source owner')
  return matches[0]
}
export function pageButton(classNames) {
  return pageNode(node => ts.isJsxElement(node) && node.openingElement.tagName.getText(pageSource) === 'button' && node.openingElement.attributes.properties.some(attribute => attribute.name?.getText(pageSource) === 'className' && ts.isStringLiteral(attribute.initializer) && classNames.includes(attribute.initializer.text)))
}
export function evaluatePage(expression, bindings) {
  const code = ts.transpileModule(`(${expression})`, { compilerOptions: { target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.React } }).outputText
  const React = { createElement: (type, props, ...children) => ({ type, props: props ?? {}, children }) }
  return Function('React', ...Object.keys(bindings), `return ${code}`)(React, ...Object.values(bindings))
}
export function pageEffect(contains, bindings) {
  const call = pageNode(node => ts.isCallExpression(node) && node.expression.getText(pageSource) === 'useEffect' && node.arguments[0]?.getText(pageSource).includes(contains))
  return evaluatePage(call.arguments[0].getText(pageSource), bindings)
}
export function pageNearby(scene, overrides = {}) {
  let pressed = false
  const nearbyPress = { current: null },
    bindings = {
      engine: { current: scene }, world: scene.world, ready: true, startup: 'playing',
      menu: false, selectorOpen: false, nearbyPress,
      setNearbyPressed: value => { pressed = value },
      setMenu: () => {}, setSelectorOpen: () => {}, useCallback: callback => callback, ...overrides,
    }
  const names = ['clearNearbyPress', 'cancelNearbyInput', 'openMenu', 'openSelector', 'currentNearbyScene', 'releaseNearbyPress', 'nearbyControl']
  const bodies = names.map(name => pageNode(node =>
    (ts.isFunctionDeclaration(node) && node.name?.text === name) ||
    (ts.isVariableStatement(node) && node.declarationList.declarations.some(declaration => declaration.name.getText(pageSource) === name))
  ).getText(pageSource)).join('\n')
  const functions = evaluatePage(`function(){${bodies}; return {${names.join(',')}}}`, bindings)()
  return {
    ...functions, nearbyPress, bindings,
    render: () => evaluatePage(pageButton(['nearby-followers-button']).getText(pageSource), {
      ...bindings, ...functions, HudSprite: 'HudSprite', nearby: !!(scene.world.castingTribes[0].flags & 128), nearbyPressed: pressed,
    }),
    get pressed() { return pressed },
  }
}
export const noOp = () => {}
export function nearbyEvent(extra = {}) {
  return { button: 0, detail: 1, pointerId: 9, clientX: 10, clientY: 10,
    shiftKey: false, ctrlKey: false, preventDefault: noOp,
    currentTarget: { disabled: false, blur: noOp, getBoundingClientRect: () => ({ left: 0, top: 0, right: 24, bottom: 18 }) },
    ...extra }
}
