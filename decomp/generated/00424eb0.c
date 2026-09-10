/* Ghidra 12.1.3 pseudocode; entry 00424eb0; FUN_00424eb0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


/* WARNING: Removing unreachable block (ram,0x00424f89) */
/* WARNING: Removing unreachable block (ram,0x00424f93) */

void FUN_00424eb0(int param_1)

{
  ushort uVar1;
  uint uVar2;
  uint uVar3;
  int iVar4;
  pnts_related_struct *ppVar5;
  short local_2c;
  short local_2a;
  short local_28;
  short local_26;
  int local_24;
  int local_20;
  int local_1c;
  int local_18;
  int local_14;
  int local_10;
  int local_c;
  int local_8;
  int local_4;

  local_24 = *(int *)(param_1 + 0x50);
  local_c = *(int *)(param_1 + 0x58);
  uVar2 = (*(int *)(param_1 + 0x54) - local_24) - 0x200U & 0x7ff;
  local_10 = maybe_sin[uVar2];
  local_8 = maybe_cos[uVar2];
  uVar2 = (uint)((longlong)local_c * (longlong)local_8) >> 0x10 |
          (int)((ulonglong)((longlong)local_c * (longlong)local_8) >> 0x20) << 0x10;
  uVar3 = (uint)((longlong)local_c * (longlong)local_10) >> 0x10 |
          (int)((ulonglong)((longlong)local_c * (longlong)local_10) >> 0x20) << 0x10;
  if ((int)uVar2 < 0) {
    uVar2 = -uVar2;
  }
  if ((int)uVar3 < 0) {
    uVar3 = -uVar3;
  }
  local_2c = (short)*(undefined4 *)(param_1 + 4);
  *(uint *)(param_1 + 100) = uVar2;
  local_2a = (short)*(undefined4 *)(param_1 + 8);
  *(uint *)(param_1 + 0x68) = uVar3;
  if (((uVar2 != 0) && (uVar3 != 0)) &&
     (ppVar5 = temp_pnts_related_array, iVar4 = temp_pnts_related_counter_1, local_4 = local_c,
     0 < temp_pnts_related_counter_1)) {
    do {
      ppVar5 = ppVar5 + 1;
      local_28 = (short)ppVar5->x;
      uVar2 = (uint)(ushort)(local_28 - local_2c);
      local_26 = (short)ppVar5->z;
      uVar3 = (uint)(ushort)(local_26 - local_2a);
      if (0x7fff < uVar2) {
        uVar2 = uVar2 - 0x10000;
      }
      if (0x7fff < uVar3) {
        uVar3 = uVar3 - 0x10000;
      }
      uVar1 = calc_angle_quadrant(uVar2,-uVar3);
      local_1c = calc_distance_toroidal(&local_2c,&local_28);
      uVar2 = ((uVar1 & 0x7ff) - local_24) - 0x200 & 0x7ff;
      local_18 = maybe_cos[uVar2];
      local_20 = maybe_sin[uVar2];
      uVar2 = (uint)((longlong)local_1c * (longlong)local_18) >> 0x10 |
              (int)((ulonglong)((longlong)local_1c * (longlong)local_18) >> 0x20) << 0x10;
      uVar3 = (uint)((longlong)local_1c * (longlong)local_20) >> 0x10 |
              (int)((ulonglong)((longlong)local_1c * (longlong)local_20) >> 0x20) << 0x10;
      if ((int)uVar2 < 0) {
        uVar2 = -uVar2;
      }
      if ((int)uVar3 < 0) {
        uVar3 = -uVar3;
      }
      ppVar5->maybe_color = uVar2;
      iVar4 = iVar4 + -1;
      *(uint *)&ppVar5->field_0x1c = uVar3;
      local_14 = local_1c;
    } while (iVar4 != 0);
  }
  return;
}
