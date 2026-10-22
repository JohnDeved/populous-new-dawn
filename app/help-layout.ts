import { popupGlyph, type PopupFont } from './campaign-popup-layout.ts'

export interface HelpTextNode {
  sourceStart: number
  sourceCount: number
  font: PopupFont
  link: number
  text: string
  x: number
  width: number
  image?: HelpInlineImage
}
export interface HelpInlineImage {
  id: number
  url: string
  width: number
  height: number
}
export interface HelpTextRow {
  height: number
  y: number
  nodes: HelpTextNode[]
  text: string
  width: number
}

/** English 00425400. Unlike popup text, overflowing punctuation stays
 * on its old row and every markup tag resets the current run's break position.
 * Inline images require the caller's verified original sprite resolver. */
export function layoutHelpText(
  text: string,
  width: number,
  titleFont: PopupFont = 3,
  inlineImage?: (index: number) => HelpInlineImage
) {
  if (!Number.isFinite(width) || width < 1) throw new RangeError('Invalid help text width')
  let font: PopupFont = 4
  let link = -1,
    index = 0,
    runWidth = 0,
    lineWidth = 0,
    runCount = 0,
    lastBreak = 0
  const newNode = (sourceStart: number): HelpTextNode => ({
    sourceStart,
    sourceCount: 0,
    font,
    link,
    text: '',
    x: 0,
    width: 0,
  })
  const rows: HelpTextRow[] = []
  const newRow = (): HelpTextRow => {
    const row = { height: popupGlyph('A', font).h, y: 0, nodes: [], text: '', width: 0 }
    rows.push(row)
    return row
  }
  let row = newRow(),
    node = newNode(0)
  row.nodes.push(node)
  while (index < text.length) {
    if (text[index] === '<') {
      const end = text.indexOf('>', index)
      if (end < 0) throw new Error('Unterminated original help markup')
      const tag = text.slice(index + 1, end)
      node.sourceCount += end + 1 - index
      index = end + 1
      if (tag === 'r') {
        row = newRow()
        lineWidth = 0
      } else if (tag === 't') font = titleFont
      else if (tag === 'b' || tag === '/t' || tag === '/b') font = 4
      else if (/^a \d+$/.test(tag)) link = Number(tag.slice(2))
      else if (tag === '/a') link = -1
      else if (tag === 'a/') {
        // Shipped LANG00 topic1029 ends with <a/>, not </a>. Exact tag
        // matching returns0 at00426128;0042559c–b0 consumes its source
        // count but bypasses00425797–b7. Keep the current link/run/break.
        runCount += tag.length + 2
        continue
      } else if (/^i \d+$/.test(tag) && inlineImage) {
        const image = inlineImage(Number(tag.slice(2)))
        if (!image || ![image.width, image.height].every(n => Number.isInteger(n) && n > 0))
          throw new Error('Unsupported original help image')
        lineWidth += image.width
        if (lineWidth > width) {
          row = newRow()
          node = newNode(index)
          row.nodes.push(node)
          // 00425750 clears accumulated width after an overflowing image;
          // do not silently normalize the native bookkeeping to image.width.
          lineWidth = 0
        }
        // 00425765 changes this run into an image. Earlier text in that run is
        // replaced, not preserved as an invented adjacent span. Shipped LANG00
        // uses isolated <r><i N><r> (or final <i N>) sequences instead.
        node.image = image
        row.height = Math.max(row.height, image.height)
      } else throw new Error(`Unsupported original help markup: ${tag}`)
      node = newNode(index)
      row.nodes.push(node)
      runWidth = runCount = lastBreak = 0
      continue
    }
    const character = text[index],
      glyph = popupGlyph(character, font)
    runWidth += glyph.w
    lineWidth += glyph.w
    runCount++
    node.sourceCount++
    if (' -.,:;'.includes(character)) lastBreak = runCount
    if (lineWidth > width && runCount !== lastBreak) {
      if (!lastBreak && lineWidth !== runWidth) {
        row.nodes.pop()
        row = newRow()
        row.nodes.push(node)
        lineWidth = runWidth
      } else if (lastBreak || runCount > 1) {
        node.sourceCount -= lastBreak ? runCount - lastBreak : 1
        index = node.sourceStart + node.sourceCount
        row = newRow()
        node = newNode(index)
        row.nodes.push(node)
        runWidth = lineWidth = runCount = lastBreak = 0
        continue
      }
      // Browser progress safeguard: one glyph wider than an impossible pane
      // is retained. Native's retry loop has no such safe narrow-pane exit.
    }
    row.height = Math.max(row.height, glyph.h)
    index++
  }
  let y = 0
  for (const row of rows) {
    row.y = y
    let x = 0
    for (const node of row.nodes) {
      node.text = node.image
        ? ''
        : text.slice(node.sourceStart, node.sourceStart + node.sourceCount).replace(/<[^>]*>/g, '')
      node.x = x
      node.width =
        node.image?.width ?? [...node.text].reduce((sum, c) => sum + popupGlyph(c, node.font).w, 0)
      x += node.width
    }
    row.text = row.nodes.map(node => node.text).join('')
    row.width = x
    y += row.height + 4
  }
  return { width, height: y - 4, titleFont, rows }
}

export interface HelpRect {
  x: number
  y: number
  width: number
  height: number
}

// 0045e7ad–0045e908. Caller supplies its actual logical screen/HUD dimensions;
// there is no modern backdrop, fixed percentage or stretched half-pane layout.
export function helpPanelLayout(width: number, height: number, hudWidth: number) {
  if (
    ![width, height, hudWidth].every(Number.isFinite) ||
    hudWidth < 0 ||
    width <= hudWidth ||
    height <= 0
  )
    throw new RangeError('Invalid help panel dimensions')
  const world = width - hudWidth
  const margin = Math.trunc(world / (world > 400 ? 14 : 28))
  const x = hudWidth + margin,
    y = margin
  const w = Math.trunc((world - 2 * margin) / 16) * 16
  const h = Math.trunc((height - 2 * margin) / 16) * 16
  const halfW = Math.trunc(w / 32) * 16,
    halfH = Math.trunc(h / 32) * 16
  const outer = {
    contents: { x, y, width: halfW, height: halfH },
    preview: { x, y: y + h - halfH, width: halfW, height: halfH },
    article: { x: x + w - halfW, y, width: halfW, height: h },
  }
  const inset = (r: HelpRect) => ({
    x: r.x + 16,
    y: r.y + 16,
    width: r.width - 32,
    height: r.height - 32,
  })
  const inner = {
    contents: inset(outer.contents),
    preview: inset(outer.preview),
    article: inset(outer.article),
  }
  const navigation = Array.from({ length: 4 }, (_, i) => ({
    x: inner.contents.x + inner.contents.width - 30,
    y: inner.contents.y + 7 + 35 * i,
    width: 24,
    height: 28,
  }))
  return {
    outer,
    inner,
    navigation,
    scrollbar: {
      x: inner.article.x + inner.article.width + 16,
      y: inner.article.y,
      width: 24,
      height: inner.article.height,
    },
  }
}

export function helpScroll(
  contentHeight: number,
  visibleHeight: number,
  trackHeight: number,
  minimumThumb: number,
  position: number
) {
  const thumb =
    contentHeight > visibleHeight
      ? Math.max(Math.trunc((visibleHeight * trackHeight) / contentHeight), minimumThumb)
      : 0
  const maximum = thumb ? Math.max(0, trackHeight - thumb) : 0
  const current = Math.max(0, Math.min(maximum, position))
  return {
    thumb,
    maximum,
    position: current,
    pixels: maximum ? Math.trunc(((contentHeight - visibleHeight) * current) / maximum) : 0,
  }
}
