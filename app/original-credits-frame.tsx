import catalogue from './original-credits.json'
import headingFont from './original-pause-font.json'
import nameArt from './original-result-ui.json'
import { layoutOriginalCredits, type OriginalCreditsLayout } from './original-credits-layout'

const fonts = {
  heading: {
    widths: headingFont.rects.map(glyph => glyph.w),
    aHeight: headingFont.rects[65 - 32].h,
  },
  name: {
    widths: nameArt.font.rects.map(glyph => glyph.w),
    aHeight: nameArt.font.rects[65 - 32].h,
  },
}

export interface OriginalCreditsFrameData extends OriginalCreditsLayout {
  width: number
  height: number
}

/** Bind the accepted original records and atlas metrics to a logical frame. */
export function createOriginalCreditsFrame(
  screen: { width: number; height: number },
  origin: number
): OriginalCreditsFrameData {
  return {
    ...layoutOriginalCredits(catalogue.records, catalogue.headings, fonts, screen, origin),
    width: screen.width,
    height: screen.height,
  }
}

interface Props {
  frame: OriginalCreditsFrameData
  background: readonly [number, number, number]
  fontStatus: 'loading' | 'ready' | 'failed'
}

/**
 * The actual bitmap display surface, with presentation and lifetime owned outside.
 * This is a browser atlas/scissor adapter, not proof of native UV or blend state.
 * No timer, input handler, menu entry, palette default or global state is installed.
 */
export function OriginalCreditsFrame({ frame, background, fontStatus }: Props) {
  if (
    background.length !== 3 ||
    background.some(value => !Number.isInteger(value) || value < 0 || value > 255)
  ) {
    throw new RangeError('Credits background requires three RGB bytes')
  }
  return (
    <section
      aria-label="Original game credits"
      data-original-credits-frame
      data-font-status={fontStatus}
      data-credits-origin={frame.origin}
      style={{
        position: 'relative',
        width: frame.width,
        height: frame.height,
        overflow: 'hidden',
        backgroundColor: `rgb(${background.join(',')})`,
        imageRendering: 'pixelated',
      }}
    >
      {fontStatus === 'ready' ? (
        frame.submissions.map((row, rowIndex) => {
          const bank = row.font === 'heading' ? headingFont : nameArt.font
          const url = row.font === 'heading' ? '/original/pause-font.png' : nameArt.fontUrl
          let offset = 0
          return (
            <span
              key={rowIndex}
              role={row.text.trim() ? 'img' : undefined}
              aria-label={row.text.trim() ? row.text : undefined}
              aria-hidden={row.text.trim() ? undefined : true}
              data-credits-record={row.recordIndex}
              data-credits-font={row.font}
              style={{ position: 'absolute', left: row.x, top: row.y }}
            >
              {Array.from(row.text, (character, index) => {
                const glyph = bank.rects[character.charCodeAt(0) - 32]
                const left = offset
                offset += glyph.w
                return (
                  <i
                    key={index}
                    aria-hidden="true"
                    data-credits-glyph={character.charCodeAt(0)}
                    style={{
                      position: 'absolute',
                      left,
                      top: 0,
                      width: glyph.w,
                      height: glyph.h,
                      backgroundImage: `url('${url}')`,
                      backgroundPosition: `-${glyph.x}px -${glyph.y}px`,
                      backgroundRepeat: 'no-repeat',
                    }}
                  />
                )
              })}
            </span>
          )
        })
      ) : (
        <p role="status" style={{ margin: 0, padding: 16, color: '#fff', backgroundColor: '#000' }}>
          {fontStatus === 'failed'
            ? 'Original Credits artwork could not be loaded.'
            : 'Loading original Credits artwork…'}
        </p>
      )}
    </section>
  )
}
