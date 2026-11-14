#!/usr/bin/env node
// List every tracked script/test/QA input that presses a given key, so a binding
// change can reconcile all consumers before review. Read-only; no browser runs.
//
//   node scripts/key-consumers.mjs --key d
//   node scripts/key-consumers.mjs --key h --key period --json
//
// Kinds:
//   direct    keyboard.press/down/up/type('Shift+D'), locator.press('d'), page.press(sel, 'd')
//   event     KeyboardEvent-style { key: 'd' } / { code: 'KeyD' } in files that build key events
//   indirect  a matching string literal inside an array in a file that presses keys from a
//             variable (e.g. `for (const key of ['w', 'd']) keyboard.down(key)`); verify by hand
import { execFileSync } from 'node:child_process'
import { readFileSync, realpathSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOTS = ['scripts', 'tests', 'qa']
const EXTENSIONS = /\.(?:mjs|cjs|js|ts|py)$/
const NAMED = new Map([
  ['.', 'period'], [',', 'comma'], ['/', 'slash'], [';', 'semicolon'], ["'", 'quote'],
  ['-', 'minus'], ['=', 'equal'], ['[', 'bracketleft'], [']', 'bracketright'],
  ['\\', 'backslash'], ['`', 'backquote'], [' ', 'space'],
])

// Normalize a KeyboardEvent key/code or Playwright key name to one comparable token.
export function keyToken(name) {
  const value = String(name)
  if (value.length === 1) {
    if (/[a-z]/i.test(value)) return value.toLowerCase()
    if (/[0-9]/.test(value)) return `digit${value}`
    return NAMED.get(value) ?? value
  }
  const lower = value.toLowerCase()
  if (/^key[a-z]$/.test(lower)) return lower.slice(3)
  if (/^digit[0-9]$/.test(lower)) return lower
  if (lower === 'spacebar') return 'space'
  return lower
}

// The final segment of a Playwright chord such as 'Shift+D' or 'Control++'.
function chordKey(chord) {
  if (chord.length > 1 && chord.endsWith('++')) return '+'
  const parts = chord.split('+')
  return parts[parts.length - 1]
}

const DIRECT = [
  /keyboard\.(?:press|down|up|type)\(\s*(['"`])((?:(?!\1).){1,40})\1/g,
  /\.press\(\s*(['"`])((?:(?!\1).){1,40})\1\s*[,)]/g,
  /\.press\(\s*[^,()]+,\s*(['"`])((?:(?!\1).){1,40})\1/g,
]
const EVENT = /\b(?:key|code)\s*:\s*(['"`])((?:(?!\1).){1,24})\1/g
const VARIABLE_PRESS = /keyboard\.(?:press|down|up)\(\s*[A-Za-z_$][\w$.]*\s*[,)]/
const ARRAY = /\[[^\[\]]*\]/g
const LITERAL = /(['"`])((?:(?!\1).){1,24})\1/g

export function scanSource(text, wanted) {
  const hits = []
  const buildsEvents = /KeyboardEvent|dispatchKeyEvent|keydown|keyup/.test(text)
  const variablePress = VARIABLE_PRESS.test(text)
  text.split('\n').forEach((line, index) => {
    const found = new Set()
    const add = (kind, key) => {
      const id = `${kind}:${key}`
      if (!found.has(id)) {
        found.add(id)
        hits.push({ line: index + 1, kind, key, text: line.trim().slice(0, 160) })
      }
    }
    for (const pattern of DIRECT) {
      for (const match of line.matchAll(pattern)) {
        const key = chordKey(match[2])
        if (wanted.has(keyToken(key))) add('direct', match[2])
      }
    }
    if (buildsEvents) {
      for (const match of line.matchAll(EVENT)) if (wanted.has(keyToken(match[2]))) add('event', match[2])
    }
    if (variablePress) {
      for (const array of line.matchAll(ARRAY)) {
        for (const match of array[0].matchAll(LITERAL)) if (wanted.has(keyToken(match[2]))) add('indirect', match[2])
      }
    }
  })
  return hits
}

export function trackedFiles(root) {
  const output = execFileSync('git', ['ls-files', '-z', '--', ...ROOTS], { cwd: root, encoding: 'utf8' })
  return output.split('\0').filter(path => EXTENSIONS.test(path)).sort()
}

export function findKeyConsumers(root, keys) {
  const wanted = new Set(keys.map(keyToken))
  const self = 'scripts/key-consumers.mjs'
  return trackedFiles(root)
    .filter(path => path !== self && !path.startsWith('tests/key-consumers'))
    .flatMap(path => scanSource(readFileSync(join(root, path), 'utf8'), wanted).map(hit => ({ path, ...hit })))
}

function main(argv) {
  const keys = []
  let json = false
  let root = resolve(fileURLToPath(new URL('..', import.meta.url)))
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--key') keys.push(argv[++i])
    else if (argv[i] === '--json') json = true
    else if (argv[i] === '--root') root = resolve(argv[++i])
    else throw new Error(`Unknown argument: ${argv[i]}`)
  }
  if (keys.length === 0 || keys.some(key => key === undefined || key === ''))
    throw new Error('Usage: node scripts/key-consumers.mjs --key <key> [--key <key>] [--json] [--root <repo>]')
  const hits = findKeyConsumers(root, keys)
  if (json) {
    process.stdout.write(`${JSON.stringify({ keys, hits }, null, 1)}\n`)
    return
  }
  for (const hit of hits) process.stdout.write(`${hit.path}:${hit.line}\t${hit.kind}\t${hit.key}\t${hit.text}\n`)
  const files = new Set(hits.map(hit => hit.path)).size
  process.stderr.write(`${hits.length} consumer line(s) in ${files} file(s) for ${keys.join(', ')}; ` +
    'indirect hits need manual confirmation.\n')
}

// Compare real paths: /tmp is a symlink on macOS, so a resolved argv path can differ.
if (process.argv[1] && realpathSync(resolve(process.argv[1])) === realpathSync(fileURLToPath(import.meta.url))) {
  try {
    main(process.argv.slice(2))
  } catch (error) {
    process.stderr.write(`key-consumers: ${error.message}\n`)
    process.exitCode = 2
  }
}
