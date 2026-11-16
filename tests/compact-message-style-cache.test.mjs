import test from 'node:test'
import assert from 'node:assert/strict'
import vm from 'node:vm'
import { execFileSync } from 'node:child_process'
import { compactMessageWitness } from '../scripts/tutorial-browser/compact-message-layout.mjs'

// Historical uncached observer is the equivalence oracle, not invented expected geometry.
const baseline = execFileSync(
  'git',
  [
    'show',
    '811e6d603f15e25e46bcdfe8edf45ce61c0c435d:scripts/tutorial-browser/compact-message-layout.mjs',
  ],
  { encoding: 'utf8' }
)
const original = baseline
  .slice(
    baseline.indexOf('export function compactMessageWitness()'),
    baseline.indexOf('\nexport function assertCompactMessageWitness')
  )
  .replace('export ', '')
function fixture() {
  let styleCalls = 0,
    rectCalls = 0
  const style = {
    visibility: 'visible',
    contain: 'none',
    overflowX: 'hidden',
    overflowY: 'hidden',
    clipPath: 'none',
    clip: 'auto',
    fontSize: '12px',
    lineHeight: '18px',
    display: 'grid',
    getPropertyValue() {
      return '1'
    },
  }
  const node = (name, parent) => ({
    className: name,
    tagName: 'DIV',
    parentElement: parent,
    clientLeft: 0,
    clientTop: 0,
    clientWidth: 100,
    clientHeight: 20,
    scrollWidth: 100,
    scrollHeight: 20,
    textContent: name,
    dataset: { metric: name },
    getBoundingClientRect() {
      rectCalls++
      return { left: 1, top: 1, right: 101, bottom: 21 }
    },
    getClientRects() {
      return [this.getBoundingClientRect()]
    },
  })
  const html = node('HTML', null),
    body = node('BODY', html),
    shell = node('game-shell', body),
    graph = node('fps-graph', shell)
  const rows = Array.from({ length: 15 }, (_, i) => node('row' + i, graph))
  const fields = Array.from({ length: 19 }, (_, i) => node('metric' + i, rows[i % 15]))
  const world = node('status', shell),
    campaign = node('campaign', shell),
    pause = node('pause', shell)
  const map = {
    '.world-message': [world],
    '.campaign-messages details[open]>div p': [campaign],
    '.fps-graph dl>div': rows,
    '.fps-graph [data-metric]': fields,
  }
  const document = {
    documentElement: html,
    querySelectorAll: s => map[s] ?? [],
    querySelector: s =>
      s === '.fps-graph'
        ? graph
        : s === '[data-original-pause-status]'
          ? pause
          : s === '.game-shell'
            ? shell
            : world,
    createTreeWalker(n) {
      const nodes = n === graph ? fields : [n]
      let i = 0
      return {
        nextNode() {
          return i < nodes.length
            ? { textContent: nodes[i].textContent, parentElement: nodes[i++] }
            : null
        },
      }
    },
    createRange() {
      return {
        selectNodeContents() {},
        getClientRects() {
          return [{ left: 1, top: 1, right: 20, bottom: 12 }]
        },
      }
    },
  }
  const environment = {
    document,
    NodeFilter: { SHOW_TEXT: 4 },
    getComputedStyle(node) {
      styleCalls++
      return { ...style, ...node.style }
    },
    localStorage: { getItem: () => 'auto' },
    innerWidth: 640,
    innerHeight: 480,
  }
  return {
    style,
    rows,
    fields,
    shell,
    world,
    environment,
    capture(fn) {
      styleCalls = 0
      rectCalls = 0
      const output = vm.runInNewContext(`(${fn})()`, environment)
      return { output: JSON.parse(JSON.stringify(output)), styleCalls, rectCalls }
    },
  }
}

test('snapshot-local style cache preserves full supplied DOM witness and reduces style reads', () => {
  const f = fixture(),
    before = f.capture(original),
    after = f.capture(compactMessageWitness.toString())
  assert.deepEqual(after.output, before.output)
  assert.ok(after.styleCalls < before.styleCalls / 4)
  assert.equal(after.rectCalls, before.rectCalls)
})
test('styles, clipping, visibility and viewport refresh across successive captures', () => {
  const f = fixture()
  const initial = f.capture(compactMessageWitness.toString())
  for (const mutation of [
    () => {
      f.fields[0].style = { visibility: 'hidden' }
    },
    () => {
      f.shell.style = { contain: 'paint', overflowX: 'visible', overflowY: 'clip' }
    },
    () => {
      f.rows[1].style = { fontSize: '24px', lineHeight: '30px' }
    },
    () => {
      f.world.style = { display: 'contents' }
      f.environment.innerWidth = 900
    },
    () => {
      f.fields[0].style = { visibility: 'visible' }
      f.style.overflowX = 'visible'
    },
  ]) {
    mutation()
    const before = f.capture(original),
      after = f.capture(compactMessageWitness.toString())
    assert.deepEqual(after.output, before.output)
    assert.notDeepEqual(after.output, initial.output)
  }
})
