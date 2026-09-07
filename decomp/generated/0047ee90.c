/* Ghidra 12.1.3 pseudocode; entry 0047ee90; load_panel_texture_internal.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


/* WARNING: Enum "_D3DRENDERSTATETYPE": Some values do not have unique names */

undefined4
load_panel_texture_internal(int param_1,undefined4 *param_2,uint param_3,int *param_4,int *param_5)

{
  DDPIXELFORMAT *pDVar1;
  void *pvVar2;
  int iVar3;
  uint uVar4;
  uint uVar5;
  int iVar6;
  undefined4 *puVar7;
  int local_104;
  int local_100;
  int local_fc;
  int local_f8;
  int local_f4;
  int local_f0;
  int local_ec;
  uint local_e8;
  uint local_e4;
  _union_3350 local_e0;
  _union_3351 local_dc;
  _union_3353 local_d8;
  _union_3354 local_d4;
  _union_3349 local_d0;
  undefined4 local_cc;
  undefined4 *local_c8 [2];
  int local_c0;
  int local_bc;
  uint local_a0 [4];
  undefined1 local_90;
  undefined1 local_8f;
  undefined1 local_8e;
  undefined1 local_8d;
  undefined1 local_8c;
  undefined4 local_54;
  undefined1 local_50 [40];
  undefined1 local_28 [40];

  pDVar1 = ui_struct->pixel_format_1;
  puVar7 = system_palette_mem;
  for (iVar3 = 0x100; iVar3 != 0; iVar3 = iVar3 + -1) {
    *puVar7 = *param_2;
    param_2 = param_2 + 1;
    puVar7 = puVar7 + 1;
  }
  local_d0 = pDVar1->field3_0xc;
  local_d4 = pDVar1->field7_0x1c;
  local_d8 = pDVar1->field6_0x18;
  local_dc = pDVar1->field5_0x14;
  local_e0 = pDVar1->field4_0x10;
  local_a0[0] = (uint)*(ushort *)(param_1 + 4);
  local_cc = 0;
  init_surface_mem(local_a0[0],*(undefined2 *)(param_1 + 6),&local_e0,0,0);
  alloc_surface_mem();
  for (uVar4 = (uint)(local_c0 * local_bc) >> 2; uVar4 != 0; uVar4 = uVar4 - 1) {
    *local_c8[0] = 0;
    local_c8[0] = local_c8[0] + 1;
  }
  for (uVar4 = local_c0 * local_bc & 3; uVar4 != 0; uVar4 = uVar4 - 1) {
    *(undefined1 *)local_c8[0] = 0;
    local_c8[0] = (undefined4 *)((int)local_c8[0] + 1);
  }
  set_surface_mem(local_c8);
  set_sprite_index_tbl(0,0,param_1);
  iVar3 = (int)((*(ushort *)(param_1 + 4) - 1) + param_3) / (int)param_3;
  local_f4 = (int)((*(ushort *)(param_1 + 6) - 1) + param_3) / (int)param_3;
  pvVar2 = operator_new(local_f4 * iVar3 * 4);
  *param_4 = (int)pvVar2;
  local_104 = 0;
  if (0 < local_f4) {
    local_f8 = 0;
    uVar4 = param_3;
    do {
      if (0 < iVar3) {
        iVar6 = local_104 << 2;
        local_104 = local_104 + iVar3;
        local_100 = 0;
        uVar5 = param_3;
        local_fc = iVar3;
        do {
          create_dd_surface(ui_struct->direct_draw,param_3,param_3,0,pDVar1,0x1800,*param_4 + iVar6)
          ;
          local_8d = 0;
          local_90 = 0;
          local_8f = 0;
          local_8e = 0;
          local_8c = 0;
          clear_surface_mem();
          local_54 = 0;
          init_d3d_struct(*(undefined4 *)(*param_4 + iVar6),local_a0);
          surface_lock(local_a0,0);
          clear_surface_mem();
          surface_mem_copy_from_d3d(local_28,local_a0);
          clear_surface_mem();
          local_f0 = local_100;
          local_e8 = (uint)*(ushort *)(param_1 + 4);
          if ((int)uVar5 <= (int)(uint)*(ushort *)(param_1 + 4)) {
            local_e8 = uVar5;
          }
          local_ec = local_f8;
          local_e4 = (uint)*(ushort *)(param_1 + 6);
          if ((int)uVar4 <= (int)(uint)*(ushort *)(param_1 + 6)) {
            local_e4 = uVar4;
          }
          iVar6 = iVar6 + 4;
          surface_mem_create_sub_rect(local_50,&local_f0);
          FUN_0052a510(local_28,local_50,0);
          unlock_surface(local_a0);
          uVar5 = uVar5 + param_3;
          local_100 = local_100 + param_3;
          local_fc = local_fc + -1;
        } while (local_fc != 0);
      }
      uVar4 = uVar4 + param_3;
      local_f8 = local_f8 + param_3;
      local_f4 = local_f4 + -1;
    } while (local_f4 != 0);
  }
  free_surface_mem();
  *param_5 = local_104;
  return 0;
}
