/* Ghidra 12.1.3 pseudocode; entry 00516170; get_sprite_bank.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


/* WARNING: Enum "_D3DRENDERSTATETYPE": Some values do not have unique names */
/* Find sprite bank for a specific sprite memory address */

void get_sprite_bank(int param_1,int *param_2,uint *param_3)

{
  uint uVar1;
  int iVar2;
  sprite_struct_1 **ppsVar3;
  sprite_file_ext **ppsVar4;

  uVar1 = param_1 - hfx_0_addr >> 3;
  *param_3 = uVar1;
  if (uVar1 < (uint)hfx_0_mem->sprite_num) {
    *param_2 = (int)&hfx_0_sprite_bank;
    return;
  }
  uVar1 = param_1 - hspr_0_addr >> 3;
  *param_3 = uVar1;
  if (uVar1 < (uint)hspr_0_mem->sprite_num) {
    *param_2 = (int)&hspr_0_sprite_bank;
    return;
  }
  iVar2 = get_font_type();
  if (iVar2 == 0) {
    iVar2 = 0;
    ppsVar4 = font_sprite_addr_array;
    ppsVar3 = font_sprites_size_array;
    do {
      uVar1 = param_1 - (int)*ppsVar3 >> 3;
      *param_3 = uVar1;
      if (uVar1 < (uint)(*ppsVar4)->sprite_num) {
        *param_2 = (int)(font_sprite_bank + iVar2);
        return;
      }
      ppsVar4 = ppsVar4 + 1;
      ppsVar3 = ppsVar3 + 1;
      iVar2 = iVar2 + 1;
    } while (ppsVar3 < &DAT_0087cc00);
  }
  uVar1 = param_1 - point_0_end >> 3;
  *param_3 = uVar1;
  if (uVar1 < (uint)point_0_mem->sprite_num) {
    *param_2 = (int)&point_0_sprite_bank;
    return;
  }
  uVar1 = param_1 - igmslidf_sprite_file_ext.mem_start >> 3;
  *param_3 = uVar1;
  if (uVar1 < igmslidf_sprite_file_ext.sprite_num) {
    *param_2 = (int)&igmslidf_sprite_bank;
    return;
  }
  *param_2 = 0;
  return;
}
