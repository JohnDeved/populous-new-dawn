import hud from './original-hud.json' with { type: 'json' }

const glyphs = hud.rects as Record<string, { x: number; y: number; w: number; h: number }>

// English object tooltips: 0x44a2f0 with 0x45ec10 word wrapping and F00T glyphs.
// FONT banks have different artwork at the mouse-button character positions.
export function tooltipLayout(text: string, screenWidth: number, screenHeight: number) {
  const font = screenHeight > 600 ? 3 : 4
  const codes = Array.from(text, char => char.charCodeAt(0) - 32)
  const glyph = (code: number) => glyphs[`f00t${font}-${code}`]
  const measure = (line: number[]) => line.reduce((width, code) => width + glyph(code).w, 0)
  function wrap(width: number) {
    const lines: number[][] = []
    let start = 0
    do {
      let end = start,
        pixels = 0,
        lastBreak = -1
      while (end < codes.length && pixels < width && end - start < 127) {
        const code = codes[end++]
        pixels += glyph(code).w
        if (' -.,:;'.includes(String.fromCharCode(code + 32))) lastBreak = end
      }
      let resume = end
      if (end < codes.length) {
        if (lastBreak >= 0) {
          resume = lastBreak
          end = lastBreak
          if (codes[end - 1] === 0) end--
        }
        while (codes[resume] === 0) resume++
      }
      lines.push(codes.slice(start, end))
      start = resume
    } while (start < codes.length)
    return lines
  }
  const minimum = screenWidth >> 3
  const initial = Math.max(
    minimum,
    Math.min(Math.trunc(measure(codes) / 2), Math.trunc((screenWidth * 2) / 5) - 10) - 60
  )
  let width = initial,
    best = Infinity
  for (let candidate = initial; candidate <= initial + 120; candidate += 10) {
    const penalty = wrap(candidate).reduce((sum, line) => {
      const unused = candidate - measure(line)
      return sum + (unused < 0 ? 100 : unused)
    }, 0)
    if (penalty < best) {
      width = candidate
      best = penalty
    }
  }
  const lines = wrap(width),
    lineHeight = glyph(0).h
  const draws = lines.flatMap((line, row) => {
    let x = (width - measure(line)) >> 1
    return line.map(code => {
      const draw = [font, code, x, row * lineHeight]
      x += glyph(code).w
      return draw
    })
  })
  return { width, height: lines.length * lineHeight, draws }
}

export function drawTooltip(
  canvas: HTMLCanvasElement,
  atlas: HTMLImageElement,
  text: string,
  width: number,
  height: number
) {
  if (!atlas?.complete || !atlas.naturalWidth) return
  const key = JSON.stringify([text, width, height])
  if (canvas.dataset.layout === key) return
  const layout = tooltipLayout(text, width, height)
  canvas.width = layout.width
  canvas.height = layout.height
  const context = canvas.getContext('2d')!
  context.imageSmoothingEnabled = false
  for (const [font, code, x, y] of layout.draws) {
    const r = glyphs[`f00t${font}-${code}`]
    context.drawImage(atlas, r.x, r.y, r.w, r.h, x, y, r.w, r.h)
  }
  canvas.dataset.layout = key
}
