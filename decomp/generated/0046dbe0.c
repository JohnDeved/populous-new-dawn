/* Ghidra 12.1.3 pseudocode; entry 0046dbe0; coord_global_convert.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


/* WARNING: Enum "_D3DRENDERSTATETYPE": Some values do not have unique names */

void coord_global_convert(int *param_1)

{
  int iVar1;
  int iVar2;
  longlong lVar3;
  uint uVar4;
  uint uVar5;
  int iVar6;
  int iVar7;
  int iVar8;

  iVar8 = *param_1;
  iVar1 = param_1[1];
  iVar2 = param_1[2];
  iVar6 = iVar2 * matrix_rot_trans.a2 + iVar8 * matrix_rot_trans.a0 >> 0xe;
  *param_1 = iVar6;
  iVar7 = iVar2 * matrix_rot_trans.b2 + iVar1 * matrix_rot_trans.b1 + iVar8 * matrix_rot_trans.b0 >>
          0xe;
  param_1[1] = iVar7;
  iVar8 = iVar2 * matrix_rot_trans.c2 + iVar1 * matrix_rot_trans.c1 + iVar8 * matrix_rot_trans.c0 >>
          0xe;
  param_1[2] = iVar8;
  lVar3 = (longlong)(iVar8 * 2 * iVar8 * 2 + iVar6 * 2 * iVar6 * 2) * (longlong)scaling_correction;
  iVar7 = iVar7 - ((int)((uint)lVar3 >> 0x10 | (int)((ulonglong)lVar3 >> 0x20) << 0x10) >> 0x10);
  param_1[1] = iVar7;
  if (iVar8 + depth_offset < 1) {
    uVar4 = -((int)screen_width_2_half << (ui_struct->field34_0x6fc[0x5fc] + 100 & 0x1f));
    uVar5 = -((int)screen_height_2_half << (ui_struct->field34_0x6fc[0x600] + 100 & 0x1f));
  }
  else {
    iVar8 = (1 << ((char)scaling_perspective_param + 0x10U & 0x1f)) / (iVar8 + depth_offset);
    lVar3 = (longlong)
            (tribe_ptr->matrix_related * iVar6 >> (0x10 - ui_struct->field34_0x6fc[0x5fc] & 0x1f)) *
            (longlong)iVar8;
    uVar4 = (uint)lVar3 >> 0x10 | (int)((ulonglong)lVar3 >> 0x20) << 0x10;
    lVar3 = (longlong)
            (iVar7 * tribe_ptr->matrix_related >> (0x10 - ui_struct->field34_0x6fc[0x600] & 0x1f)) *
            (longlong)iVar8;
    uVar5 = (uint)lVar3 >> 0x10 | (int)((ulonglong)lVar3 >> 0x20) << 0x10;
  }
  param_1[3] = (int)(*(float *)(ui_struct->field34_0x6fc + 0x604) * (float)(int)uVar4 +
                    (float)(int)screen_width_2_half);
  param_1[4] = (int)((float)(int)screen_height_2_half -
                    *(float *)(ui_struct->field34_0x6fc + 0x608) * (float)(int)uVar5);
  if (0x80000000 < (uint)param_1[3]) {
    param_1[6] = param_1[6] | 2;
    return;
  }
  if ((float)(int)screen_width_2 <= (float)param_1[3]) {
    param_1[6] = param_1[6] | 4;
    return;
  }
  if (0x80000000 < (uint)param_1[4]) {
    param_1[6] = param_1[6] | 8;
    return;
  }
  if ((float)(int)screen_height_2 <= (float)param_1[4]) {
    param_1[6] = param_1[6] | 0x10;
  }
  return;
}
