import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { runInNewContext } from 'node:vm'
const source = readFileSync(new URL('../scripts/local-render/original-pause-checkpoint-style.mjs', import.meta.url), 'utf8')
test('checkpoint text and geometry inspect native menu regions, not portal adaptations', () => {
  assert.ok(source.includes('dialog.querySelectorAll(\'nav[aria-label="Game menu choices"] button, section button\')'))
  assert.ok(!source.includes("dialog.querySelectorAll('button')"))
})
test('native control inventory rejects missing, extra or wrong-panel buttons', () => {
  const check = source.match(/assert\.deepEqual\(layout\.buttons\.map\(control => control\.label\),\n\s*\['Back', panel === 'save' \? 'Save checkpoint' : 'Load checkpoint'\]\)/)?.[0]
  assert.ok(check)
  // Both expected and observed arrays originate in one realm, as in the scenario.
  const verify = (panel, labels) => runInNewContext(`const layout = { buttons: ${JSON.stringify(labels)}.map(label => ({ label })) }; ${check}`, { assert, panel })
  verify('save', ['Back', 'Save checkpoint'])
  verify('load', ['Back', 'Load checkpoint'])
  for (const labels of [[], ['Save checkpoint'], ['Back'], ['Back', 'Load checkpoint'], ['Back', 'Save checkpoint', 'Fullscreen']]) {
    assert.throws(() => verify('save', labels), { code: 'ERR_ASSERTION' })
  }
})
