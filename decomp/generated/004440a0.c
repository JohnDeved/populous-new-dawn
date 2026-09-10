/* Ghidra 12.1.3 pseudocode; entry 004440a0; create_line_wide.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void create_line_wide(short *param_1,undefined4 *param_2,int param_3,int param_4,int param_5)

{
  int iVar1;
  int iVar2;
  undefined4 uVar3;
  uint uVar4;
  uint uVar5;
  short local_70;
  short local_38;
  short local_36;
  undefined2 local_34;
  undefined1 local_30 [4];
  int local_2c;
  int local_28;
  int local_20;
  int local_1c;
  int local_14;
  int local_10;

  local_38 = (short)*param_2;
  *(undefined4 *)param_1 = *param_2;
  local_36 = param_1[1];
  local_34 = 0;
  move_pos_angle_length(&local_38,param_4,param_5);
  param_1[4] = local_38;
  param_1[5] = local_36;
  uVar5 = (param_4 - param_3) - 0x200U & 0x7ff;
  uVar4 = 0x200U - param_3 & 0x7ff;
  iVar1 = maybe_sin[uVar4];
  iVar2 = maybe_cos[uVar4];
  uVar4 = (uint)((longlong)param_5 * (longlong)maybe_cos[uVar5]) >> 0x10 |
          (int)((ulonglong)((longlong)param_5 * (longlong)maybe_cos[uVar5]) >> 0x20) << 0x10;
  uVar5 = (uint)((longlong)param_5 * (longlong)maybe_sin[uVar5]) >> 0x10 |
          (int)((ulonglong)((longlong)param_5 * (longlong)maybe_sin[uVar5]) >> 0x20) << 0x10;
  local_70 = (short)((ulonglong)((longlong)(int)uVar4 * (longlong)iVar1) >> 0x10);
  param_1[2] = local_70 + *param_1;
  param_1[3] = param_1[1] - (short)((ulonglong)((longlong)(int)uVar4 * (longlong)iVar2) >> 0x10);
  param_1[6] = *param_1 - (short)((ulonglong)((longlong)(int)uVar5 * (longlong)iVar2) >> 0x10);
  param_1[7] = param_1[1] - (short)((ulonglong)((longlong)(int)uVar5 * (longlong)iVar1) >> 0x10);
  comp_distances(param_1,local_30);
  if (0 < (local_20 - local_14) * (local_1c - local_28) +
          (local_10 - local_1c) * (local_20 - local_2c)) {
    uVar3 = *(undefined4 *)(param_1 + 2);
    *(undefined4 *)(param_1 + 2) = *(undefined4 *)(param_1 + 6);
    *(undefined4 *)(param_1 + 6) = uVar3;
  }
  return;
}
