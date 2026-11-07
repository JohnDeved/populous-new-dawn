import assert from 'node:assert/strict'
import { resolve } from 'node:path'
import hud from '../../app/original-hud.json' with { type: 'json' }

// Independent native expectation: 004a1dd0 -> 004f95a0 fades the frame at
// 85/255; 0049fe70 fills (2,2,25,30) after flag8 is cleared. Enabled sprite
// pixels are observed foreground, so that case tests frame composition only.
export function comparePortraitPixels({ actual, frame, foreground, background, enabled, interior }) {
  const scale = actual.width / 30
  assert.ok(Number.isInteger(scale) && scale > 0 && actual.height === 35 * scale)
  let borderChannels = 0, interiorChannels = 0, mismatches = 0, maximumError = 0
  for (let y = 0; y < actual.height; y++) for (let x = 0; x < actual.width; x++) {
    const lx = Math.floor(x / scale), ly = Math.floor(y / scale)
    const at = (y * actual.width + x) * 4, source = (ly * 30 + lx) * 4
    const inside = lx >= 2 && lx < 27 && ly >= 2 && ly < 32
    const alpha = frame[source + 3] / 255 * (enabled ? 1 : 85 / 255)
    for (let channel = 0; channel < 3; channel++) {
      let expected = frame[source + channel] * alpha + background[channel] * (1 - alpha)
      if (!enabled && inside) expected = interior[channel]
      if (enabled) {
        const fg = foreground[source + 3] / 255
        expected = foreground[source + channel] * fg + expected * (1 - fg)
      }
      const error = Math.abs(actual.data[at + channel] - Math.round(expected))
      maximumError = Math.max(maximumError, error)
      if (error > 1) mismatches++
      if (inside) interiorChannels++; else borderChannels++
    }
  }
  return { borderChannels, interiorChannels, mismatches, maximumError, scale }
}

export async function inspectPortraitPixels(page, portrait, output, { name, background, enabled, hover }) {
  await page.locator('.native-hud').evaluate((element, rgb) => {
    element.style.backgroundImage = 'none'
    element.style.backgroundColor = `rgb(${rgb.join(',')})`
  }, background)
  await page.mouse.move(1000, 600)
  if (hover) await portrait.hover()
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))))
  const path = resolve(output, `${name}.png`)
  const png = await portrait.screenshot({ path, animations: 'disabled' })
  const frameName = enabled && hover ? 'portrait-hover' : 'portrait'
  const pixels = await portrait.evaluate(async (button, { bytes, frameName }) => {
    const decode = async blob => {
      const image = await createImageBitmap(blob), canvas = document.createElement('canvas')
      canvas.width = image.width; canvas.height = image.height
      const context = canvas.getContext('2d')
      context.drawImage(image, 0, 0); image.close()
      return { width: canvas.width, height: canvas.height, data: [...context.getImageData(0, 0, canvas.width, canvas.height).data] }
    }
    const actual = await decode(new Blob([new Uint8Array(bytes)], { type: 'image/png' }))
    const frame = await decode(await (await fetch(`/original/hud-${frameName}.png`)).blob())
    const canvas = button.querySelector('canvas')
    return {
      actual, frame: frame.data,
      foreground: [...canvas.getContext('2d').getImageData(33, 114, 30, 35).data],
      diagnostics: { disabled: button.disabled, opacity: getComputedStyle(button).opacity,
        frameOpacity: getComputedStyle(button, '::before').opacity,
        frameBackground: getComputedStyle(button, '::before').backgroundImage },
    }
  }, { bytes: [...png], frameName })
  const interior = hud.colors[172].match(/[a-f\d]{2}/gi).map(value => parseInt(value, 16))
  const comparison = comparePortraitPixels({ ...pixels, background, enabled, interior })
  assert.equal(pixels.diagnostics.disabled, !enabled)
  return { name, path, background, enabled, hover, frameName, ...pixels.diagnostics, ...comparison }
}
