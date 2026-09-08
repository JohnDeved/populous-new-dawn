export interface NativeModel {
  p: number[]
  uv: number[]
  scale: number
  faces: number[]
  tiles: number[]
  normals: number[][]
  modes: number[]
}

export function modelCapUV(corner: number) {
  const edge = (0x200000 - 2) / 0x200000
  const u = corner === 1 || corner === 2 ? edge : 0
  const v = corner >= 2 ? edge : 0
  return [(2 + u) / 8, 1 - (31 + v) / 32]
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
  if (stage === 4 && !data.modes.includes(0)) return data
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
        else uv.push(...data.uv.slice((vertex + k) * 2, (vertex + k + 1) * 2))
      }
    vertex += corners.length
  }
  return { p, uv }
}
