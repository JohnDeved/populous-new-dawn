/* Ghidra 12.1.3 pseudocode; entry 004f95a0; init_polygon_quad_with_sprite_5a.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


/* WARNING: Enum "_D3DRENDERSTATETYPE": Some values do not have unique names */

undefined4 __thiscall
init_polygon_quad_with_sprite_5a
          (int param_1,float param_2,float param_3,undefined4 param_4,undefined4 param_5,int param_6
          ,ushort param_7,uint param_8,undefined4 param_9,undefined4 param_10)

{
  int *piVar1;
  float fVar2;
  float fVar3;
  int iVar4;
  sprite_struct_vtable *local_24;
  undefined4 local_20;
  undefined4 local_1c;
  uint local_10;
  int local_c;
  undefined4 local_8;
  undefined4 local_4;

  *(float *)(param_1 + 0x24) = vertex_shift_x + param_2;
  param_3 = vertex_shift_y + param_3;
  *(undefined4 *)(param_1 + 0x46) = param_4;
  *(ushort *)(param_1 + 0x30) = param_7;
  *(float *)(param_1 + 0x28) = param_3;
  *(undefined4 *)(param_1 + 0x4a) = param_5;
  *(uint *)(param_1 + 0x32) = param_8;
  *(undefined4 *)(param_1 + 0x3e) = param_9;
  *(int *)(param_1 + 0x2c) = param_6;
  *(undefined4 *)(param_1 + 0x42) = param_10;
  *(undefined4 *)(param_1 + 0xc) = 0x10;
  *(undefined4 *)(param_1 + 0x4e) = 0xffffffff;
  *(undefined4 *)(param_1 + 0x52) = 0;
  if ((param_8 & 8) == 0) {
    if ((param_8 & 0x10) == 0) {
      *(undefined4 *)(param_1 + 0xc) = 0x11;
    }
    else {
      *(undefined4 *)(param_1 + 0xc) = 0x51;
      *(uint *)(param_1 + 0x4e) = (-1 - color_related_1) * 0x1000000 | 0xffffff;
    }
  }
  else if (ghost_mem_ptr == &ghost0_mem) {
    *(undefined4 *)(param_1 + 0xc) = 0x51;
    *(uint *)(param_1 + 0x4e) = color_related_1 << 0x18 | 0xffffff;
  }
  else {
    *(undefined4 *)(param_1 + 0xc) = 0x12;
    *(uint *)(param_1 + 0x20) = *(uint *)(param_1 + 0x20) | 2;
  }
  if (((*(uint *)(param_1 + 0x20) & 0x20) != 0) && (ui_struct->uv_related != 4)) {
    *(uint *)(param_1 + 0x20) = *(uint *)(param_1 + 0x20) | 0x40;
  }
  local_10 = *(uint *)(param_1 + 0x20);
  if ((local_10 & 0xc) == 0) {
    local_24 = &sprite_struct_vtable_24;
    iVar4 = (uint)param_7 * 0x24;
    local_20 = *(undefined4 *)(*(int *)(param_6 + 4) + 0x14 + iVar4);
    local_1c = *(undefined4 *)(*(int *)(param_6 + 4) + 0x18 + iVar4);
    local_8 = *(undefined4 *)(*(int *)(param_6 + 4) + 0xc + iVar4);
    local_4 = *(undefined4 *)(*(int *)(param_6 + 4) + 0x10 + iVar4);
    local_c = *(int *)(*(int *)(param_6 + 8) + 0xc) + (uint)param_7 * 8;
    piVar1 = (int *)(*(int *)(param_6 + 4) + 0x1c + iVar4);
    iVar4 = *piVar1;
    if (iVar4 == 0) {
      iVar4 = inc_texture_cache_counter();
      *piVar1 = iVar4;
      iVar4 = *(int *)((uint)*(ushort *)(param_1 + 0x30) * 0x24 + 0x1c +
                      *(int *)(*(int *)(param_1 + 0x2c) + 4));
    }
    if ((*(byte *)(param_1 + 0x20) & 0x10) != 0) {
      piVar1 = (int *)((uint)*(ushort *)(param_1 + 0x30) * 0x24 + 0x20 +
                      *(int *)(*(int *)(param_1 + 0x2c) + 4));
      iVar4 = *piVar1;
      if (iVar4 == 0) {
        iVar4 = inc_texture_cache_counter();
        *piVar1 = iVar4;
        iVar4 = *(int *)((uint)*(ushort *)(param_1 + 0x30) * 0x24 + 0x20 +
                        *(int *)(*(int *)(param_1 + 0x2c) + 4));
      }
    }
    add_sprite_to_texture_cache(iVar4,&local_24);
  }
  if (do_texture_clipping != 0) {
    fVar2 = *(float *)(param_1 + 0x24) + *(float *)(param_1 + 0x46);
    fVar3 = *(float *)(param_1 + 0x28) + *(float *)(param_1 + 0x4a);
    if ((((fVar2 < clipping_x) || (fVar3 < clipping_y)) || (clipping_w < *(float *)(param_1 + 0x24))
        ) || (clipping_h < *(float *)(param_1 + 0x28))) {
      *(undefined4 *)(param_1 + 0x46) = 0;
      *(undefined4 *)(param_1 + 0x4a) = 0;
    }
    else {
      if (*(float *)(param_1 + 0x24) < clipping_x) {
        *(float *)(param_1 + 0x46) =
             *(float *)(param_1 + 0x46) - (clipping_x - *(float *)(param_1 + 0x24));
        *(float *)(param_1 + 0x24) = clipping_x;
      }
      if (*(float *)(param_1 + 0x28) < clipping_y) {
        *(float *)(param_1 + 0x4a) =
             *(float *)(param_1 + 0x4a) - (clipping_y - *(float *)(param_1 + 0x28));
        *(float *)(param_1 + 0x28) = clipping_y;
      }
      if (clipping_w < fVar2) {
        *(float *)(param_1 + 0x46) = clipping_w - *(float *)(param_1 + 0x24);
      }
      if (clipping_h < fVar3) {
        *(float *)(param_1 + 0x4a) = clipping_h - *(float *)(param_1 + 0x28);
      }
    }
  }
  return 0x5a;
}
