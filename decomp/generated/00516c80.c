/* Ghidra 12.1.3 pseudocode; entry 00516c80; FUN_00516c80.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


/* WARNING: Unknown calling convention */
/* WARNING: Enum "_D3DRENDERSTATETYPE": Some values do not have unique names */

undefined2 FUN_00516c80(int param_1,int param_2,int param_3,int param_4)

{
  int iVar1;
  undefined4 uVar2;
  int local_8;
  undefined4 local_4;

  iVar1 = param_1 + -0x100 + param_4 * 8;
  if (DAT_005da078 != 0) {
    set_sprite_index_tbl(param_2,param_3,iVar1);
    return *(undefined2 *)(iVar1 + 4);
  }
  get_sprite_bank(iVar1,&local_8,&local_4);
  if (local_8 != 0) {
    uVar2 = 0xffffff;
    if ((vertices_flags & 8) != 0) {
      uVar2 = vertex_palette_color;
    }
    add_polygon_quad_sprite_5a_4((float)param_2,(float)param_3,local_8,local_4,uVar2,vertices_flags)
    ;
  }
  return *(undefined2 *)(iVar1 + 4);
}
