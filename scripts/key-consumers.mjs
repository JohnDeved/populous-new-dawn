#!/usr/bin/env node
// Find likely tracked script/test/QA consumers of a key, so a binding change can
// reconcile them before review. Heuristic and read-only; no browser runs.
//
//   node scripts/key-consumers.mjs --key d
//   node scripts/key-consumers.mjs --key h --key period --json
//
// Kinds:
//   direct    keyboard.press/down/up/type('Shift+D'), locator.press('d'), page.press(sel, 'd')
//   state     injected key state such as scene.keys.add('q') (bypasses bindings)
//   event     { key: 'd' } / { code: 'KeyD' } in files that build or handle key events
//   indirect  a matching literal inside an array (may span lines) in a file that presses keys
//             from variables/templates or handles key events; verify by hand
// Not traced: computed key strings, helpers defined in other files, untracked files.
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync, realpathSync } from 'node:fs'
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

// The final segment of a Playwright chord such as 'Shift+D', 'Control++' or '+'.
export function chordKey(chord) {
  if (chord === '+' || (chord.length > 1 && chord.endsWith('++'))) return '+'
  const parts = chord.split('+')
  return parts[parts.length - 1]
}

const DIRECT = [
  /keyboard\.(?:press|down|up|type)\(\s*(['"`])((?:(?!\1).){1,40})\1/g,
  /\.press\(\s*(['"`])((?:(?!\1).){1,40})\1\s*[,)]/g,
  /\.press\(\s*[^,()]+,\s*(['"`])((?:(?!\1).){1,40})\1/g,
]
// Injected key state, e.g. `scene.keys.add('q')` inside page.evaluate, bypasses bindings.
const STATE = /\bkeys\.(?:add|delete|has)\(\s*(['"`])((?:(?!\1).){1,24})\1/g
const EVENT = /\b(?:key|code)\s*:\s*(['"`])((?:(?!\1).){1,24})\1/g
// Includes handler calls fed through `{ key, code }` shorthand properties.
const EVENT_FILE = /KeyboardEvent|dispatchKeyEvent|key-?down|key-?up|\.keys\s*=|keys\.(?:add|delete)\(|[{,]\s*key\s*[,}]/i
const PRESS_CALL = /keyboard\.(?:press|down|up)\(\s*/g
const ARRAY = /\[[^\[\]]*\]/g
const LITERAL = /(['"`])((?:(?!\1).){1,24})\1/g

// True when a file presses keys from a non-literal argument: identifiers, indexes,
// member expressions or templates with substitutions.
export function pressesFromVariables(text) {
  for (const match of text.matchAll(PRESS_CALL)) {
    const rest = text.slice(match.index + match[0].length, match.index + match[0].length + 80)
    const quote = rest[0]
    if (quote === "'" || quote === '"') continue
    if (quote === '`') {
      const close = rest.indexOf('`', 1)
      if (close > 0 && !rest.slice(1, close).includes('${')) continue
    }
    return true
  }
  return false
}

export function scanSource(text, wanted) {
  const hits = []
  const lines = text.split('\n')
  const starts = [0]
  for (const line of lines) starts.push(starts[starts.length - 1] + line.length + 1)
  const lineAt = offset => {
    let low = 0, high = lines.length - 1
    while (low < high) {
      const mid = (low + high + 1) >> 1
      if (starts[mid] <= offset) low = mid
      else high = mid - 1
    }
    return low
  }
  const seen = new Set()
  const add = (index, kind, key) => {
    const id = `${index}:${kind}:${key}`
    if (seen.has(id)) return
    seen.add(id)
    hits.push({ line: index + 1, kind, key, text: lines[index].trim().slice(0, 160) })
  }
  const keyEvents = EVENT_FILE.test(text)
  lines.forEach((line, index) => {
    for (const pattern of DIRECT) {
      for (const match of line.matchAll(pattern)) if (wanted.has(keyToken(chordKey(match[2])))) add(index, 'direct', match[2])
    }
    for (const match of line.matchAll(STATE)) if (wanted.has(keyToken(match[2]))) add(index, 'state', match[2])
    if (keyEvents) for (const match of line.matchAll(EVENT)) if (wanted.has(keyToken(match[2]))) add(index, 'event', match[2])
  })
  // Arrays may span lines; only count them in files that press or inject keys indirectly.
  if (keyEvents || pressesFromVariables(text)) {
    for (const array of text.matchAll(ARRAY)) {
      for (const match of array[0].matchAll(LITERAL)) {
        if (wanted.has(keyToken(match[2]))) add(lineAt(array.index + match.index), 'indirect', match[2])
      }
    }
  }
  return hits.sort((a, b) => a.line - b.line)
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
    .filter(path => existsSync(join(root, path))) // deleted in the working tree
    .flatMap(path => scanSource(readFileSync(join(root, path), 'utf8'), wanted).map(hit => ({ path, ...hit })))
}

function main(argv) {
  const keys = []
  let json = false
  let root = resolve(fileURLToPath(new URL('..', import.meta.url)))
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--key') keys.push(argv[++i] === undefined ? undefined : chordKey(argv[i]))
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
function invokedDirectly() {
  try {
    return Boolean(process.argv[1]) && realpathSync(resolve(process.argv[1])) === realpathSync(fileURLToPath(import.meta.url))
  } catch {
    return false
  }
}

if (invokedDirectly()) {
  try {
    main(process.argv.slice(2))
  } catch (error) {
    process.stderr.write(`key-consumers: ${error.message}\n`)
    process.exitCode = 2
  }
}
