/* Ghidra 12.1.3 pseudocode; entry 004bdcb0; set_water_texture.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void set_water_texture(void)

{
  uint uVar1;
  undefined1 *puVar2;
  undefined1 *puVar3;
  int iVar4;
  int iVar5;

  if ((((byte)resource_flags & 8) != 0) && (((byte)resource_flags & 0x10) != 0)) {
    iVar4 = 0;
    puVar3 = water_texture;
    do {
      iVar5 = 0;
      puVar2 = puVar3;
      do {
        puVar3 = puVar2 + 1;
        uVar1 = game_state.offset_counter + iVar5;
        iVar5 = iVar5 + 1;
        *puVar2 = *(undefined1 *)
                   (((int)(*(char *)((game_state.offset_counter + iVar4 & 0xffU) * 0x100 +
                                     (uVar1 & 0xff) + disp0_mem) * 0x1a9 & 0xfffffc03U) >> 2) +
                    0x4b80 + bigf0_mem);
        puVar2 = puVar3;
      } while (iVar5 < 0x100);
      iVar4 = iVar4 + 1;
    } while (iVar4 < 0x100);
  }
  return;
}
