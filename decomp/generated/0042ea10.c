/* Ghidra 12.1.3 pseudocode; entry 0042ea10; globe_landscape_mesh_generation.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

undefined4 __thiscall globe_landscape_mesh_generation(int param_1,undefined4 param_2,uint param_3)

{
  bool bVar1;
  bool bVar2;
  uint uVar3;
  int iVar4;
  int iVar5;
  int iVar6;
  int iVar7;
  int iVar8;
  int iVar9;
  int iVar10;
  uint uVar11;
  uint uVar12;
  uint local_2c;
  int local_28;
  int local_24;
  int local_20;
  sbyte local_1c;
  sbyte local_18;
  sbyte local_14;
  sbyte local_10;

  _DAT_0059c950 = 0;
  globe_vertex_index = 0;
  local_28 = 1;
  if (1 < (param_3 & 0x3fffffff)) {
    do {
      local_28 = local_28 * 2;
    } while (local_28 < (int)(param_3 & 0x3fffffff));
  }
  *(int *)(param_1 + 0x2c) = local_28;
  FUN_0042d940(param_2);
  *(undefined4 *)(param_1 + 0x28) = 0;
  bVar1 = false;
  if (DAT_0059c96c == 0) {
    local_10 = 0x12;
    local_18 = 0x10;
    local_14 = 5;
    local_1c = 5;
  }
  else if (DAT_0059c96c == 1) {
    local_10 = 0x11;
    local_18 = 0x10;
    local_14 = 6;
    local_1c = 6;
  }
  else {
    local_14 = 0x1e;
    local_10 = 0;
    local_1c = 0x1e;
    local_18 = 0;
  }
  local_2c = 0;
  local_24 = 0;
  do {
    uVar3 = local_2c + local_28;
    local_20 = 0;
    iVar10 = 0;
    bVar2 = bVar1;
    do {
      bVar1 = bVar2;
      if (*(int *)(param_1 + 0x108) == 1) {
        landscape_palette_class_ptr =
             object_cache_start[(local_2c & 0xfffffffc) * 8 + (iVar10 >> 2)];
      }
      else if (*(int *)(param_1 + 0x108) != 2) {
        DAT_00d1c004 = ((iVar10 >> local_1c) << local_18) +
                       (((int)local_2c >> local_14) << local_10) + *(int *)(param_1 + 0x38);
      }
      iVar8 = local_28 + iVar10;
      if (bVar1) {
        iVar6 = *(int *)(param_1 + 0x104) >> 4;
        iVar9 = uVar3 * 0x200;
        iVar5 = (local_20 - *(int *)(param_1 + 0x18)) * 0x10000 >> 0x14;
        iVar6 = iVar6 * iVar6;
        iVar4 = (iVar9 - *(int *)(param_1 + 0x1c)) * 0x10000 >> 0x14;
        iVar5 = iVar5 * iVar5;
        if (((iVar4 * iVar4 + iVar5 < iVar6) ||
            (iVar4 = (local_24 - *(int *)(param_1 + 0x1c)) * 0x10000 >> 0x14,
            iVar4 * iVar4 + iVar5 < iVar6)) ||
           (iVar4 = tex_struct_is_point_visible(iVar8 * 0x200,local_24), iVar4 != 0)) {
          add_3_vertices_2(param_2,iVar10,uVar3,iVar10,local_2c,iVar8,local_2c);
        }
        iVar7 = *(int *)(param_1 + 0x104) >> 4;
        iVar5 = (iVar8 * 0x200 - *(int *)(param_1 + 0x18)) * 0x10000 >> 0x14;
        iVar7 = iVar7 * iVar7;
        iVar6 = (local_24 - *(int *)(param_1 + 0x1c)) * 0x10000 >> 0x14;
        iVar5 = iVar5 * iVar5;
        uVar11 = local_2c;
        iVar4 = iVar8;
        uVar12 = uVar3;
        if ((iVar6 * iVar6 + iVar5 < iVar7) ||
           (iVar6 = (iVar9 - *(int *)(param_1 + 0x1c)) * 0x10000 >> 0x14,
           iVar6 * iVar6 + iVar5 < iVar7)) goto LAB_0042ed59;
        iVar5 = tex_struct_is_point_visible(local_20,iVar9);
joined_r0x0042ed44:
        if (iVar5 != 0) goto LAB_0042ed59;
      }
      else {
        iVar6 = (local_20 - *(int *)(param_1 + 0x18)) * 0x10000 >> 0x14;
        iVar5 = (local_24 - *(int *)(param_1 + 0x1c)) * 0x10000 >> 0x14;
        iVar4 = *(int *)(param_1 + 0x104) >> 4;
        if (iVar6 * iVar6 + iVar5 * iVar5 < iVar4 * iVar4) {
LAB_0042ecc8:
          add_3_vertices_2(param_2,iVar10,local_2c,iVar8,local_2c,iVar8,uVar3);
        }
        else {
          iVar4 = tex_struct_is_point_visible(iVar8 * 0x200,local_24);
          if ((iVar4 != 0) ||
             (iVar4 = tex_struct_is_point_visible(iVar8 * 0x200,uVar3 * 0x200), iVar4 != 0))
          goto LAB_0042ecc8;
        }
        iVar5 = (iVar8 * 0x200 - *(int *)(param_1 + 0x18)) * 0x10000 >> 0x14;
        iVar9 = (int)((uVar3 * 0x200 - *(int *)(param_1 + 0x1c)) * 0x10000) >> 0x14;
        iVar6 = *(int *)(param_1 + 0x104) >> 4;
        uVar11 = uVar3;
        iVar4 = iVar10;
        uVar12 = local_2c;
        if ((iVar6 * iVar6 <= iVar5 * iVar5 + iVar9 * iVar9) &&
           (iVar5 = tex_struct_is_point_visible(local_20,uVar3 * 0x200), iVar5 == 0)) {
          iVar5 = tex_struct_is_point_visible(local_20,local_24);
          goto joined_r0x0042ed44;
        }
LAB_0042ed59:
        add_3_vertices_2(param_2,iVar8,uVar11,iVar4,uVar3,iVar10,uVar12);
      }
      local_20 = local_20 + local_28 * 0x200;
      iVar10 = iVar8;
      bVar2 = (bool)(bVar1 ^ 1);
    } while (iVar8 < 0x80);
    local_24 = local_24 + local_28 * 0x200;
    local_2c = uVar3;
    if (0x7f < (int)uVar3) {
      return *(undefined4 *)(param_1 + 0x28);
    }
  } while( true );
}
