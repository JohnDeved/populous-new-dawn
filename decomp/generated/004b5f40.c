/* Ghidra 12.1.3 pseudocode; entry 004b5f40; load_sprite_or_image.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


/* WARNING: Enum "_D3DRENDERSTATETYPE": Some values do not have unique names */

undefined4
load_sprite_or_image(undefined4 param_1,undefined4 param_2,undefined4 param_3,undefined4 param_4)

{
  int iVar1;
  int *local_8c;
  undefined4 local_88;
  undefined4 local_84;
  uint local_80;
  uint local_7c;
  undefined1 local_78 [4];
  uint local_74;
  uint local_70;
  int local_58;
  undefined1 local_50 [40];
  undefined1 local_28 [40];

  clear_surface_mem();
  iVar1 = load_sprite_to_surface_mem(param_1,local_78,0);
  if (iVar1 == 0) {
    if (local_58 == 0x18) {
      surface_mem_downscale(local_78,param_2,param_3);
    }
    else if (local_58 == 0x20) {
      surface_mem_donwscale_2(local_78,param_2,param_3);
    }
    local_8c = (int *)0x0;
    create_dd_surface(ui_struct->direct_draw,local_74 >> ((byte)param_2 & 0x1f),
                      local_70 >> ((byte)param_3 & 0x1f),0,param_4,0x1800,&local_8c);
    clear_surface_mem();
    surface_mem_lock(local_8c,local_50);
    clear_surface_mem();
    local_88 = 0;
    local_84 = 0;
    local_80 = local_74 >> ((byte)param_2 & 0x1f);
    local_7c = local_70 >> ((byte)param_3 & 0x1f);
    surface_mem_create_sub_rect(local_28,&local_88);
    FUN_004306a0(local_28,local_50,0);
    surface_mem_unlock(local_8c);
    d3d_create_material_for_texture_block(local_8c,0,0);
    if (local_8c != (int *)0x0) {
      (**(code **)(*local_8c + 8))(local_8c);
      local_8c = (int *)0x0;
    }
    free_surface_mem();
    return 1;
  }
  return 0;
}
