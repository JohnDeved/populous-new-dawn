/* Ghidra 12.1.3 pseudocode; entry 00517760; blit_minimap.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


uint blit_minimap(void)

{
  uint uVar1;

  uVar1 = texture_block_surface_blit();
  return (uVar1 == 0) - 1 & uVar1;
}
