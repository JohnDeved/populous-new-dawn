'use client'

import { useEffect, useRef } from 'react'
import { drawMinimapFrame } from './minimap-frame'

export function MinimapFrame() {
  const canvas = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const frame = canvas.current!
    const context = frame.getContext('2d')!
    const atlas = new Image()
    let pending = 0
    const draw = () => {
      pending = 0
      if (!atlas.complete || !atlas.naturalWidth) return
      const bounds = frame.getBoundingClientRect()
      frame.width = Math.max(1, Math.round(bounds.width))
      frame.height = Math.max(1, Math.round(bounds.height))
      drawMinimapFrame(context, atlas, frame.width, frame.height, window.innerWidth)
    }
    // The parent applies the saved HUD size in the same resize event. Draw afterward.
    const resize = () => {
      cancelAnimationFrame(pending)
      pending = requestAnimationFrame(draw)
    }
    atlas.addEventListener('load', resize)
    atlas.src = '/original/minimap-frame.png'
    resize()
    window.addEventListener('resize', resize)
    return () => {
      cancelAnimationFrame(pending)
      atlas.removeEventListener('load', resize)
      window.removeEventListener('resize', resize)
    }
  }, [])
  return <canvas ref={canvas} className="map-frame" aria-hidden="true" />
}
