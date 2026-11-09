import art from './original-frontend.json' with { type: 'json' }

// Browser policy: do not keep startup behind optional menu artwork indefinitely.
export const FRONTEND_ASSET_TIMEOUT_MS = 10_000

export interface IngameMenuAssets {
  fonts: boolean
  sliders: boolean
  tooltip: boolean
  images: readonly HTMLImageElement[]
}

export interface FrontendAssets {
  badgeVectors: readonly (HTMLImageElement | null)[]
  ingame: IngameMenuAssets
  composition: Uint8Array | null
  fonts: boolean
  lowFont: boolean
  logo: boolean
  background: boolean
  cursor: boolean
  sliders: boolean
  tooltip: boolean
  images: readonly HTMLImageElement[]
}

// One call belongs to one Home session. Each group settles independently; late
// image decodes cannot change the returned snapshot or replace visible fallbacks.
export async function prepareFrontendAssets(): Promise<FrontendAssets> {
  const controller = new AbortController()
  let timer: ReturnType<typeof setTimeout>
  const deadline = new Promise<null>(resolve => {
    timer = setTimeout(() => resolve(null), FRONTEND_ASSET_TIMEOUT_MS)
  })
  const settle = <T>(work: Promise<T>) => Promise.race([work.catch(() => null), deadline])
  try {
    const [
      composition,
      fonts,
      lowFont,
      logo,
      background,
      cursor,
      sliders,
      pauseFont,
      ingameSliders,
      tooltip,
      bullfrogVector,
      qsoundVector,
    ] = await Promise.all([
      settle(
        fetch('/original/frontend/composition.bin', { signal: controller.signal })
          .then(response => {
            if (!response.ok) throw new Error('Frontend composition unavailable')
            return response.arrayBuffer()
          })
          .then(bytes => {
            if (bytes.byteLength !== art.binaryBytes)
              throw new Error('Invalid frontend composition')
            return new Uint8Array(bytes)
          })
      ),
      settle(images(['frontend/feft33we', 'frontend/fehi33we'])),
      settle(images(['frontend/felo33we'])),
      settle(images(['frontend/felgspen'])),
      settle(images(['frontend/background'])),
      settle(images(['frontend/pointer'])),
      settle(images([0, 1, 2].map(frame => `options/frontend-${frame}`))),
      settle(images(['pause-font'])),
      settle(images([0, 1, 2].map(frame => `options/ingame-${frame}`))),
      // One decoded atlas is shared by both skins and every menu/category mount.
      settle(images(['world-selector/text/tooltip-font-c'])),
      settle(image('/frontend-badges/bullfrog.svg')),
      settle(image('/frontend-badges/qsound.svg')),
    ])
    return Object.freeze({
      badgeVectors: Object.freeze([bullfrogVector, qsoundVector]),
      ingame: Object.freeze({
        fonts: pauseFont !== null,
        sliders: ingameSliders !== null,
        tooltip: tooltip !== null,
        images: Object.freeze([pauseFont, ingameSliders, tooltip].flatMap(group => group ?? [])),
      }),
      composition,
      fonts: fonts !== null,
      lowFont: lowFont !== null,
      logo: logo !== null,
      background: background !== null,
      cursor: cursor !== null,
      sliders: sliders !== null,
      tooltip: tooltip !== null,
      images: Object.freeze(
        [fonts, lowFont, logo, background, cursor, sliders, tooltip].flatMap(group => group ?? [])
      ),
    })
  } finally {
    clearTimeout(timer!)
    controller.abort()
  }
}

async function image(src: string) {
  const image = new Image()
  image.src = src
  await image.decode()
  return image
}

function images(names: string[]) {
  return Promise.all(names.map(name => image(`/original/${name}.png`)))
}
