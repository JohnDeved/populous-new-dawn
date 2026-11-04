import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { stripTypeScriptTypes } from 'node:module'

// Execute the shipped callback bodies with supplied dialog/store boundaries.
// This does not mount React, dispatch browser input, or establish rendered behavior.
const source = readFileSync(new URL('../app/spell-test-menu.tsx', import.meta.url), 'utf8')
const declaration = name => {
  const matches = [...source.matchAll(new RegExp('^  function ' + name + '\\([^]*?^  }', 'gm'))]
  assert.ok(matches.length <= 1, 'ambiguous component function ' + name)
  return matches[0]?.[0] ?? ''
}
const grant = declaration('grant')
assert.ok(grant, 'the actual grant handler must exist')
const selection = source.match(/aria-label=\{\`Test \$\{spell.name\}, \$\{stock\} shots\`\}\s+onClick=\{([^]*?)\}\s*>/)
assert.ok(selection, 'the actual spell-button click must be captured')
const handlers = stripTypeScriptTypes(
  declaration('isCurrent') + '\n' + grant
) + '\nreturn { grant, select: (' + selection[1] + ') }'

function fixture() {
  const world = { stock: 0, mode: null, cheated: false }
  let active = world, allowed = true
  const notices = [], actions = [], selected = []
  const dialog = { current: { open: true } }
  const store = {
    getWorld: () => active,
    applySpellTestCheat(action) {
      actions.push(action)
      if (!allowed) return false
      active.stock++
      active.cheated = true
      return true
    },
  }
  const callbacks = new Function('dialog', 'store', 'world', 'setNotice', 'onSelect', 'spell', handlers)(
    dialog, store, world, message => notices.push(message),
    spell => { active.mode = spell; selected.push(spell) }, { id: 'blast' }
  )
  return {
    world, dialog, notices, actions, selected, ...callbacks,
    current: () => active,
    replace: () => { active = { stock: 0, mode: null, cheated: false }; return active },
    disallow: () => { allowed = false },
  }
}

test('actual F9 buttons still invoke the three existing grant actions', () => {
  assert.deepEqual([...source.matchAll(/onClick=\{\(\) => grant\('([^']+)'\)\}/g)].map(match => match[1]),
    ['unlock', 'refill', 'mana'])
})

test('current open dialog grants each action and retains its success notice', () => {
  for (const action of ['unlock', 'refill', 'mana']) {
    const f = fixture()
    f.grant(action)
    assert.deepEqual(f.actions, [action])
    assert.deepEqual(f.world, { stock: 1, mode: null, cheated: true })
    assert.equal(f.notices.length, 1)
    assert.match(f.notices[0], /refilled/)
  }
})

test('current grant rejection retains the existing locked-controls notice', () => {
  const f = fixture()
  f.disallow()
  f.grant('unlock')
  assert.deepEqual(f.actions, ['unlock'])
  assert.deepEqual(f.world, { stock: 0, mode: null, cheated: false })
  assert.deepEqual(f.notices, ['Cheats are unavailable while mission controls are locked.'])
})

test('current open dialog still selects its spell exactly once', () => {
  const f = fixture()
  f.select()
  assert.deepEqual(f.selected, ['blast'])
  assert.deepEqual(f.world, { stock: 0, mode: 'blast', cheated: false })
  assert.deepEqual(f.actions, [])
  assert.deepEqual(f.notices, [])
})

test('retained grants cannot affect a replacement world with matching values', () => {
  for (const action of ['unlock', 'refill', 'mana']) {
    const f = fixture(), replacement = f.replace()
    f.grant(action)
    assert.notEqual(replacement, f.world)
    assert.deepEqual(replacement, { stock: 0, mode: null, cheated: false })
    assert.deepEqual(f.world, { stock: 0, mode: null, cheated: false })
    assert.deepEqual(f.actions, [])
    assert.deepEqual(f.notices, [])
  }
})

test('retained spell selection cannot affect a replacement world', () => {
  const f = fixture(), replacement = f.replace()
  f.select()
  assert.deepEqual(replacement, { stock: 0, mode: null, cheated: false })
  assert.deepEqual(f.world, { stock: 0, mode: null, cheated: false })
  assert.deepEqual(f.selected, [])
})

for (const state of ['closed', 'unmounted']) {
  test(state + ' dialog callbacks cannot grant or select in the unchanged world', () => {
    const f = fixture()
    if (state === 'closed') f.dialog.current.open = false
    else f.dialog.current = null
    for (const action of ['unlock', 'refill', 'mana']) f.grant(action)
    f.select()
    assert.deepEqual(f.world, { stock: 0, mode: null, cheated: false })
    assert.deepEqual(f.actions, [])
    assert.deepEqual(f.notices, [])
    assert.deepEqual(f.selected, [])
  })
}
