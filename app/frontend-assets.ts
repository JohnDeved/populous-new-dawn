import art from './original-frontend.json' with { type: 'json' }

// Browser policy: do not keep startup behind optional menu artwork indefinitely.
export const FRONTEND_ASSET_TIMEOUT_MS = 10_000

export interface FrontendAssets {
  composition: Uint8Array | null
  fonts: boolean
  lowFont: boolean
  logo: boolean
  background: boolean
  cursor: boolean
  sliders: boolean
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
  const images = (names: string[]) =>
    Promise.all(
      names.map(async name => {
        const image = new Image()
        image.src = `/original/${name}.png`
        await image.decode()
        return image
      })
    )
  try {
    const [composition, fonts, lowFont, logo, background, cursor, sliders] = await Promise.all([
      settle(
        fetch('/original/frontend/composition.bin', { signal: controller.signal })
          .then(response => {
            if (!response.ok) throw Error('Frontend composition unavailable')
            return response.arrayBuffer()
          })
          .then(bytes => {
            if (bytes.byteLength !== art.binaryBytes) throw Error('Invalid frontend composition')
            return new Uint8Array(bytes)
          })
      ),
      settle(images(['frontend/feft33we', 'frontend/fehi33we'])),
      settle(images(['frontend/felo33we'])),
      settle(images(['frontend/felgspen'])),
      settle(images(['frontend/background'])),
      settle(images(['frontend/pointer'])),
      settle(images([0, 1, 2].map(frame => `options/frontend-${frame}`))),
    ])
    return Object.freeze({
      composition,
      fonts: fonts !== null,
      lowFont: lowFont !== null,
      logo: logo !== null,
      background: background !== null,
      cursor: cursor !== null,
      sliders: sliders !== null,
      images: Object.freeze(
        [fonts, lowFont, logo, background, cursor, sliders].flatMap(group => group ?? [])
      ),
    })
  } finally {
    clearTimeout(timer!)
    controller.abort()
  }
}
