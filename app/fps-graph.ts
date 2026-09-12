import { hudGlyph } from './hud-font.ts'
import hud from './original-hud.json' with { type: 'json' }

// Presentation cadence, not simulation speed or GPU execution time.
export class FpsGraph {
  element = document.createElement('aside')
  elapsed = 0
  frames = 0
  history: number[] = []

  constructor() {
    this.element.className = 'fps-graph'
    this.element.setAttribute('aria-label', 'Live requestAnimationFrame callback cadence')
    this.element.innerHTML = `<div class="fps-reading"><strong></strong><span></span><small></small></div>
      <svg viewBox="0 0 160 40" aria-hidden="true"><path d="M0 1H160M0 20H160M0 39H160"/><polyline fill="none"/></svg>
      <div class="fps-caption"><span></span><span class="fps-scale"></span></div>`
    this.text('.fps-reading>span', 'RAF/S')
    this.text('.fps-caption>span', 'RAF CALLBACK CADENCE')
    this.update(0)
  }

  text(selector: string, value: string) {
    const element = this.element.querySelector(selector)!
    if (element.textContent === value) return
    element.setAttribute('aria-label', value)
    element.replaceChildren(
      ...Array.from(value, char => {
        const r = (hud.rects as Record<string, { x: number; y: number; w: number; h: number }>)[
          hudGlyph(char.charCodeAt(0))
        ]
        const glyph = document.createElement('i')
        glyph.className = 'hud-sprite'
        glyph.textContent = char
        glyph.setAttribute('aria-hidden', 'true')
        Object.assign(glyph.style, {
          width: `${r.w}px`,
          height: `${r.h}px`,
          backgroundPosition: `-${r.x}px -${r.y}px`,
        })
        return glyph
      })
    )
  }

  update(milliseconds: number) {
    if (milliseconds <= 0) {
      this.elapsed = this.frames = 0
      this.history.length = 0
      this.text('strong', '--')
      this.text('small', '-- MS/RAF')
      this.element.querySelector('polyline')!.setAttribute('points', '')
      this.text('.fps-scale', '0-60')
      return
    }
    this.elapsed += milliseconds
    this.frames++
    if (this.elapsed < 250) return
    const rate = (this.frames * 1000) / this.elapsed
    this.history.push(rate)
    if (this.history.length > 40) this.history.shift()
    const ceiling = Math.max(60, Math.ceil(Math.max(...this.history) / 60) * 60)
    this.text('strong', rate.toFixed(0))
    this.text('small', `${(this.elapsed / this.frames).toFixed(1)} MS/RAF`)
    this.text('.fps-scale', `0-${ceiling}`)
    this.element
      .querySelector('polyline')!
      .setAttribute(
        'points',
        this.history
          .map(
            (value, index) =>
              `${160 - (this.history.length - 1 - index) * 4},${39 - (value / ceiling) * 38}`
          )
          .join(' ')
      )
    this.elapsed = this.frames = 0
  }
}
