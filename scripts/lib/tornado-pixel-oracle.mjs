// Independent retained original PSFB bytes, never the runtime atlas/decoder.
export function originalTornadoPixels(fixture, frame) {
  const source = fixture.frames[frame],
    raw = Buffer.from(source.rawPSFB, 'base64'),
    lookup = Buffer.from(fixture.rgbaLookup, 'base64'),
    rgba = Buffer.alloc(source.w * source.h * 4)
  let cursor = 0
  for (let y = 0; y < source.h; y++) {
    let x = 0
    for (;;) {
      const n = raw.readInt8(cursor++)
      if (!n) break
      if (n < 0) x -= n
      else
        for (let i = 0; i < n; i++, x++) {
          const index = raw[cursor++] * 4
          lookup.copy(rgba, (y * source.w + x) * 4, index, index + 4)
        }
      if (x > source.w) throw new Error('Invalid original PSFB row')
    }
  }
  return rgba
}

// Native encoded-byte modulation then source-alpha blending, not Three's
// material.color (linear-light) metadata. One byte tolerance covers rounding,
// not a color-space conversion. Compare black AND white to identify alpha.
export function originalTornadoPairs(fixture, frame, palette) {
  const rgba = originalTornadoPixels(fixture, frame),
    tint = fixture.paletteTints[palette],
    pairs = new Map()
  for (let at = 0; at < rgba.length; at += 4) {
    const alpha = rgba[at + 3],
      rgb = tint.map((v, c) => (rgba[at + c] * v) / 255),
      black = rgb.map(v => Math.round((v * alpha) / 255)),
      white = rgb.map(v => Math.round((v * alpha) / 255 + 255 - alpha)),
      pair = [...black, ...white]
    pairs.set(pair.join(','), { pair, alpha })
  }
  return [...pairs.values()]
}

export function checkTornadoReadback(histogram, pairs) {
  let transparent = 0,
    fractional = 0,
    visible = 0,
    mismatches = 0
  const examples = []
  for (const [key, count] of Object.entries(histogram)) {
    const sample = key.split(',').map(Number),
      match = pairs.find(({ pair }) => pair.every((v, i) => Math.abs(v - sample[i]) <= 1))
    if (!match) {
      mismatches += count
      if (examples.length < 8) examples.push({ sample, count })
      continue
    }
    if (!match.alpha) transparent += count
    else {
      visible += count
      if (match.alpha < 255) fractional += count
    }
  }
  return { transparent, fractional, visible, mismatches, examples }
}
