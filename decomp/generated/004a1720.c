/* Ghidra 12.1.3 pseudocode; entry 004a1720; draw_hfx_screen_rects.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


/* WARNING: Enum "_D3DRENDERSTATETYPE": Some values do not have unique names */

void draw_hfx_screen_rects(int param_1)

{
  undefined4 *puVar1;
  ushort uVar2;
  ushort uVar3;
  texture_mem_struct *ptVar4;
  uint local_14;
  uint local_10;
  int local_c;
  int local_8;
  texture_mem_struct *local_4;

  local_8 = 0;
  local_c = 0;
  local_10 = 0;
  local_14 = 0;
  local_14 = parameterize_by_screen_width(*(undefined4 *)(param_1 + 0xe));
  local_10 = parameterize_by_screen_height(*(undefined4 *)(param_1 + 0x12));
  local_c = parameterize_by_screen_width(*(int *)(param_1 + 0x16) + *(int *)(param_1 + 0xe));
  local_8 = parameterize_by_screen_height(*(int *)(param_1 + 0x1a) + *(int *)(param_1 + 0x12));
  ptVar4 = texture_mem_start;
  uVar2 = *(ushort *)(hfx_0_addr + 0x1644);
  uVar3 = *(ushort *)(hfx_0_addr + 0x1646);
  local_4 = texture_mem_start;
  puVar1 = &texture_mem_start->vertex_shift_x;
  *puVar1 = (float)local_14;
  vertex_shift_y = (float)local_10;
  ptVar4->vertex_shift_y = vertex_shift_y;
  vertex_shift_x = *puVar1;
  add_polygon_quad_sprite_5a
            (0,0,(float)(int)(local_c - local_14),(float)(int)(local_8 - local_10),
             (float)(int)(local_c - local_14) / (float)uVar2,
             (float)(int)(local_8 - local_10) / (float)uVar3,&hfx_0_sprite_bank,0x2c8,vertices_flags
             ,0xc);
  ptVar4 = texture_mem_start;
  puVar1 = &texture_mem_start->vertex_shift_x;
  *puVar1 = 0;
  ptVar4->vertex_shift_y = 0;
  vertex_shift_x = *puVar1;
  vertex_shift_y = 0.0;
  draw_hfx_ingame_window(&local_14,&DAT_005caa40);
  return;
}
