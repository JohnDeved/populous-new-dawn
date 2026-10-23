import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { runInNewContext } from 'node:vm'
import ts from 'typescript'
const read = file => readFileSync(new URL('../' + file, import.meta.url), 'utf8')
const component = read('app/fullscreen-control.tsx'), css = read('app/fullscreen-control.module.css')
const hud = JSON.parse(read('app/original-hud.json'))

test('fullscreen uses original unscaled HUD bitmap metrics and a documented new pixel symbol', () => {
  assert.match(component, /import hud from '\.\/original-hud\.json'/)
  assert.match(component, /font0-\$\{letter\.charCodeAt\(0\) - 32\}/)
  assert.match(component, /width: glyph\.w/)
  assert.match(component, /height: glyph\.h/)
  assert.match(component, /backgroundPosition: `-\$\{glyph\.x\}px -\$\{glyph\.y\}px`/)
  assert.match(css, /background: url\('\/original\/hud\.png'\) no-repeat/)
  assert.match(component, /New browser-only symbol, not an original-game sprite/)
  assert.match(component, /width="11"[\s\S]*height="10"[\s\S]*viewBox="0 0 11 10"/)
  assert.doesNotMatch(component, /[⛶↙]/)
  assert.doesNotMatch(css, /Arial|background-size|scale\(|box-shadow|border-color/)
  assert.match(css, /border-image: url\('\/original\/hud-button\.png'\) 8 fill repeat/)
  assert.match(css, /:global\(dialog\[data-original-main-menu\]\) > \.control button \{[^}]*border-image: none/)
  for (const color of css.match(/#[\da-f]{6}/g)) assert.ok(hud.colors.includes(color), `${color} is from PAL0-C`)
  for (const label of ['Fullscreen', 'Exit fullscreen']) {
    const glyphs = [...label].map(letter => hud.rects[`font0-${letter.charCodeAt(0) - 32}`])
    assert.ok(glyphs.every(glyph => glyph && glyph.h === 10))
    assert.ok(glyphs.reduce((width, glyph) => width + glyph.w, 0) + 11 + 5 + 16 <= 150)
  }
})

test('fullscreen keeps an accessible atlas-failure fallback, status and focus treatment', () => {
  assert.match(component, /\[\.\.\.glyphText\]\.some/,'unsupported glyphs retain a readable fallback')
  assert.match(component, /image\.src = '\/original\/hud\.png'/)
  assert.match(component, /\.decode\(\)/)
  assert.match(component, /if \(mounted\) setBitmapReady\(true\)/)
  assert.match(component, /bitmapReady \? \([\s\S]*BitmapText text=\{label\}[\s\S]*styles\.fallback/)
  assert.match(component, /aria-label=\{label\}/)
  assert.match(component, /aria-pressed=\{state\.active\}/)
  assert.match(component, /aria-disabled=\{state\.pending\}/)
  assert.match(component, /role="status"/)
  assert.match(component, /bitmapReady \? styles\.visuallyHidden : styles\.fallback/)
  assert.match(css, /button:focus-visible \{ outline: 1px solid #fff7bb; outline-offset: 2px/)
  assert.match(css, /button\[aria-pressed='true'\]/)
  assert.match(css, /button\[aria-disabled='true'\]/)
})


test('compact fullscreen repeats exact native crops with uncompressed overlapping corners', () => {
  assert.match(component, /className=\{styles\.compactFrame\} aria-hidden="true"/)
  const frame = component.split('className={styles.compactFrame}')[1].split('</span>')[0]
  assert.equal(frame.match(/<i \/>/g)?.length, 6, 'top/bottom strips, then TL/TR/BL/BR')
  assert.match(css, /\.compactFrame i \{[^}]*width: 8px; height: 8px/)
  const crops = [
    ['8px', '0', '-8px 0'], ['8px', '6px', '-8px -16px'],
    ['0', '0', '0 0'], ['9px', '0', '-16px 0'],
    ['0', '6px', '0 -16px'], ['9px', '6px', '-16px -16px'],
  ]
  for (const [index, [left, top, source]] of crops.entries()) {
    const rule = css.split(`.compactFrame i:nth-child(${index + 1}) {`)[1].split('}')[0]
    assert.ok(rule.includes(`left: ${left};`))
    assert.ok(rule.includes(`top: ${top};`))
    assert.ok(rule.includes(`background-position: ${source};`))
    assert.equal(rule.includes('width: 1px;'), index < 2)
  }
})


test('typographic apostrophe uses native pixels without changing accessible or fallback text', () => {
  const source = ts.createSourceFile('fullscreen-control.tsx', component, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
  const bitmap = source.statements.find(node => ts.isFunctionDeclaration(node) && node.name.text === 'BitmapText')
  assert.ok(bitmap)
  const compiled = ts.transpileModule(bitmap.getText(source) + '\nexport { BitmapText }', {
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 },
  }).outputText
  const context = { exports: {}, require: createRequire(import.meta.url), hud, styles: { bitmap: 'bitmap', word: 'word', fallback: 'fallback' } }
  runInNewContext(compiled, context)
  const render = text => context.exports.BitmapText({ text })
  const curly = render('your browser’s View menu.'), straight = render("your browser's View menu.")
  assert.equal(curly.props.className, 'bitmap')
  const pixels = element => element.props.children.flatMap(word => word.props.children.map(glyph => glyph.props.style))
  assert.deepEqual(pixels(curly), pixels(straight), 'visual glyph selection uses the original apostrophe')
  const unknown = render('Unknown character: ☃')
  assert.equal(unknown.props.className, 'fallback')
  assert.equal(unknown.props.children, 'Unknown character: ☃', 'unknown glyph recovery preserves original text')
  assert.match(component, /<span className=\{bitmapReady \? styles\.visuallyHidden : styles\.fallback\}>\s*\{state\.error\}/)
  assert.match(read('app/fullscreen-session.ts'), /browser’s View menu/, 'source status message is unchanged')
})
