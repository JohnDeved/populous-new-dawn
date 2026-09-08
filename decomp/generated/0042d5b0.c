/* Ghidra 12.1.3 pseudocode; entry 0042d5b0; add_colored_rect_local_storage.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


/* WARNING: Enum "_D3DRENDERSTATETYPE": Some values do not have unique names */

void add_colored_rect_local_storage(int param_1,int param_2,byte param_3)

{
  int iVar1;
  int iVar2;
  int local_d0;
  int local_cc [3];
  undefined4 local_c0;
  int local_bc;
  int local_b8 [3];
  undefined4 local_ac;
  int local_a8;
  int local_a4 [3];
  undefined4 local_98;
  int local_94;
  int local_90 [3];
  undefined4 local_84;
  float local_80;
  float local_7c;
  undefined4 local_78;
  uint local_70;
  undefined4 local_6c;
  undefined4 local_68;
  undefined4 local_64;
  float local_60;
  float local_5c;
  undefined4 local_58;
  uint local_50;
  undefined4 local_4c;
  undefined4 local_48;
  undefined4 local_44;
  float local_40;
  float local_3c;
  undefined4 local_38;
  uint local_30;
  undefined4 local_2c;
  undefined4 local_28;
  undefined4 local_24;
  float local_20;
  float local_1c;
  undefined4 local_18;
  uint local_10;
  undefined4 local_c;
  undefined4 local_8;
  undefined4 local_4;

  param_2 = param_2 * 0x200;
  param_1 = param_1 * 0x200;
  tex_struct_fn_3(param_1,param_2,&local_bc,local_b8);
  tex_struct_fn_3(param_1 + 0x200,param_2,&local_a8,local_a4);
  tex_struct_fn_3(param_1,param_2 + 0x200,&local_94,local_90);
  tex_struct_fn_3(param_1 + 0x200,param_2 + 0x200,&local_d0,local_cc);
  iVar2 = (local_cc[0] - local_a4[0]) * (local_a8 - local_bc);
  iVar1 = (local_d0 - local_a8) * (local_a4[0] - local_b8[0]);
  if ((iVar2 - iVar1 == 0 || iVar2 < iVar1) &&
     (iVar2 = (local_90[0] - local_cc[0]) * (local_d0 - local_bc),
     iVar1 = (local_94 - local_d0) * (local_cc[0] - local_b8[0]),
     iVar2 - iVar1 == 0 || iVar2 < iVar1)) {
    local_ac = 0x200000;
    local_98 = 0x200000;
    local_84 = 0x200000;
    local_c0 = 0x200000;
    iVar1 = (uint)param_3 * 4;
    local_80 = (float)local_bc;
    local_7c = (float)local_b8[0];
    local_70 = (*(byte *)(system_palette_mem + param_3) | 0xffffff00) << 0x10 |
               (uint)*(byte *)((int)system_palette_mem + iVar1 + 1) << 8 |
               (uint)*(byte *)((int)system_palette_mem + iVar1 + 2);
    local_78 = 0;
    local_6c = 0;
    local_64 = 0;
    local_60 = (float)local_a8;
    local_68 = 0;
    local_58 = 0;
    local_4c = 0;
    local_44 = 0;
    local_5c = (float)local_a4[0];
    local_48 = 0;
    local_38 = 0;
    local_2c = 0;
    local_24 = 0;
    local_28 = 0;
    local_40 = (float)local_94;
    local_3c = (float)local_90[0];
    local_18 = 0;
    local_c = 0;
    local_4 = 0;
    local_8 = 0;
    local_20 = (float)local_d0;
    local_1c = (float)local_cc[0];
    local_50 = local_70;
    local_30 = local_70;
    local_10 = local_70;
    add_polygon_quad_texture_a0(&local_80,&local_60,&local_20,&local_40,0,0);
  }
  return;
}
