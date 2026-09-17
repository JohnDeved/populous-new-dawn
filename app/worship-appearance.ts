// 0x4851e0 links class-6/model-6 heads to colocated model-9 scenery; 0x4fbd20 selects the presentation object.
// This issue-22 slice restores only the proved mode-3 Obelisk identity. Stone Head animation remains issue #21.
export const WORSHIP_STONE_HEAD_MODEL = 45
export const WORSHIP_OBELISK_MODEL = 8

export function worshipAppearanceModel(mode: number | undefined): number {
  return mode === 3 ? WORSHIP_OBELISK_MODEL : WORSHIP_STONE_HEAD_MODEL
}
