export interface NativeModel {
  p: number[]
  uv: number[]
  scale: number
  faces: number[]
  tiles: number[]
  normals: number[][]
  modes: number[]
  biases: number[]
}

// 0x4673b0: bilinear object tiles span texel centers, 0.5 through 31.5.
// Input is the source atlas coordinate; keep the tile explicit at shared edges.
export function modelTextureUV(tile: number, u: number, v: number) {
  const x = tile & 7,
    y = tile >> 3
  return [
    (x + (0.5 + (u * 8 - x) * 31) / 32) / 8,
    1 - (y + (0.5 + ((1 - v) * 32 - y) * 31) / 32) / 32,
  ]
}

export function modelCapUV(corner: number) {
  const edge = (0x200000 - 2) / 0x200000
  const u = corner === 1 || corner === 2 ? edge : 0
  const v = corner >= 2 ? edge : 0
  return modelTextureUV(250, (2 + u) / 8, 1 - (31 + v) / 32)
}

// Mode zero is pick-only unless a construction cap replaces its material.
export function modelFaceVisible(data: NativeModel, face: number, stage: number) {
  const flags = data.faces[face * 2 + 1]
  return stage === 4
    ? data.modes[face] !== 0
    : !!(flags & (1 << stage)) && (!!data.modes[face] || !!(flags & (16 << stage)))
}

// 0x471c40: low bits select faces in stages 0–3; matching high bits replace
// their texture with tile 250. 0x40cde0 maps that cap to a 32-pixel tile minus
// two fixed-point units. Stage 4 uses the normal complete-object renderer.
export function modelStage(data: NativeModel, stage: number) {
  const p: number[] = [],
    uv: number[] = []
  for (let f = 0, vertex = 0; f < data.faces.length; f += 2) {
    const n = data.faces[f],
      flags = data.faces[f + 1],
      corners = n === 3 ? [0, 1, 2] : [0, 1, 2, 0, 2, 3]
    if (modelFaceVisible(data, f / 2, stage))
      for (let k = 0; k < corners.length; k++) {
        p.push(...data.p.slice((vertex + k) * 3, (vertex + k + 1) * 3))
        if (stage !== 4 && flags & (16 << stage)) uv.push(...modelCapUV(corners[k]))
        else
          uv.push(
            ...modelTextureUV(
              data.tiles[f / 2],
              data.uv[(vertex + k) * 2],
              data.uv[(vertex + k) * 2 + 1]
            )
          )
      }
    vertex += corners.length
  }
  return { p, uv }
}

export function modelDepthBias(data: NativeModel, stage: number) {
  return data.biases.flatMap((bias, face) =>
    modelFaceVisible(data, face, stage) ? Array(data.faces[face * 2] === 3 ? 3 : 6).fill(bias) : []
  )
}

// 0x471c40 replaces construction caps with mode 7; other faces retain their mode.
export function modelTextureModes(data: NativeModel, stage: number) {
  return data.modes.flatMap((mode, face) =>
    modelFaceVisible(data, face, stage)
      ? Array(data.faces[face * 2] === 3 ? 3 : 6).fill(
          stage !== 4 && data.faces[face * 2 + 1] & (16 << stage) ? 7 : mode
        )
      : []
  )
}
