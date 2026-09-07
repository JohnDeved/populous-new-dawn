/* Ghidra 12.1.3 pseudocode; entry 004e93f0; FUN_004e93f0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_004e93f0(short *param_1,undefined4 *param_2,int param_3,uint param_4)

{
  short sVar1;
  short sVar2;
  int iVar3;
  int iVar4;
  short local_8;
  short sStack_6;
  undefined2 local_4;

  local_4 = *(undefined2 *)(param_2 + 1);
  local_8 = (short)*param_2;
  sStack_6 = (short)((uint)*param_2 >> 0x10);
  if (param_3 != 0) {
    sVar1 = calc_point_height(CONCAT22((short)((uint)&local_8 >> 0x10),*(undefined2 *)param_2),
                              CONCAT22(sStack_6,*(undefined2 *)((int)param_2 + 2)));
    param_4 = param_4 & 0x7ff;
    local_8 = local_8 + (short)((uint)(maybe_sin[param_4] << 5) >> 0x10);
    sStack_6 = sStack_6 + (short)((uint)(maybe_cos[param_4] << 5) >> 0x10);
    sVar2 = calc_point_height(CONCAT22(sStack_6,local_8),CONCAT22(local_4,sStack_6));
    iVar4 = (int)sVar1 - (int)sVar2;
    iVar3 = iVar4;
    if (iVar4 < 0) {
      iVar3 = -iVar4;
    }
    if (iVar3 < 1) {
      iVar3 = 1;
    }
    if (0x10 < iVar3) {
      iVar3 = 0x10;
    }
    iVar3 = ((int)(iVar3 * 0x100 + (iVar3 * 0x100 >> 0x1f & 0xfU)) >> 4) * param_3 >> 8;
    if (iVar4 < 0) {
      iVar3 = -iVar3;
    }
    param_3 = param_3 + iVar3;
    if (param_3 < 3) {
      param_3 = 3;
    }
    *param_1 = *param_1 + (short)((uint)(maybe_sin[param_4] * param_3) >> 0x10);
    param_1[2] = param_1[2] + (short)((uint)(maybe_cos[param_4] * param_3) >> 0x10);
  }
  return;
}
