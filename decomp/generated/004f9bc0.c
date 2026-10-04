/* Ghidra 12.1.3 pseudocode; entry 004f9bc0; FUN_004f9bc0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

undefined4 __fastcall FUN_004f9bc0(int param_1)

{
  int iVar1;
  float *pfVar2;
  float *pfVar3;
  float10 fVar4;
  float10 fVar5;
  float local_30;
  float local_2c;
  float local_28;
  float local_24;
  float local_20 [5];
  undefined4 local_c;
  undefined4 local_8;
  undefined4 local_4;

  if (((int)DAT_00a68f6c - _DAT_00a68f5c >> 1) + 6U < 0x2001) {
    *DAT_00a68f6c = DAT_00a68f54;
    DAT_00a68f6c[1] = DAT_00a68f54 + 1;
    DAT_00a68f6c[2] = DAT_00a68f54 + 2;
    DAT_00a68f6c[3] = DAT_00a68f54 + 2;
    DAT_00a68f6c[4] = DAT_00a68f54 + 3;
    DAT_00a68f6c[5] = DAT_00a68f54;
    DAT_00a68f6c = DAT_00a68f6c + 6;
    if (*(int *)(param_1 + 0x56) == 0) {
      local_30 = *(float *)(param_1 + 0x46);
      local_24 = *(float *)(param_1 + 0x4a);
      local_2c = 0.0;
      local_28 = 0.0;
    }
    else {
      fVar4 = (float10)fcos((float10)*(float *)(param_1 + 0x56));
      local_30 = (float)((float10)*(float *)(param_1 + 0x46) * fVar4);
      fVar5 = (float10)fsin((float10)*(float *)(param_1 + 0x56));
      local_2c = (float)-((float10)*(float *)(param_1 + 0x46) * fVar5);
      local_28 = (float)(fVar5 * (float10)*(float *)(param_1 + 0x4a));
      local_24 = (float)(fVar4 * (float10)*(float *)(param_1 + 0x4a));
      *(float *)(param_1 + 0x24) =
           *(float *)(param_1 + 0x24) - (local_30 * _DAT_0058f884 + local_28 * _DAT_0058f884);
      *(float *)(param_1 + 0x28) =
           *(float *)(param_1 + 0x28) - (local_2c * _DAT_0058f884 + local_24 * _DAT_0058f884);
    }
    local_20[0] = *(float *)(param_1 + 0x24);
    local_20[1] = (float)*(undefined4 *)(param_1 + 0x28);
    local_20[2] = (float)*(undefined4 *)(param_1 + 0x14);
    local_20[4] = (float)*(undefined4 *)(param_1 + 0x4e);
    local_c = *(undefined4 *)(param_1 + 0x52);
    local_8 = *(undefined4 *)(param_1 + 0x36);
    local_20[3] = 1.0;
    local_4 = *(undefined4 *)(param_1 + 0x3a);
    pfVar2 = local_20;
    pfVar3 = DAT_00a68f58;
    for (iVar1 = 8; iVar1 != 0; iVar1 = iVar1 + -1) {
      *pfVar3 = *pfVar2;
      pfVar2 = pfVar2 + 1;
      pfVar3 = pfVar3 + 1;
    }
    local_8 = *(undefined4 *)(param_1 + 0x3e);
    local_20[0] = *(float *)(param_1 + 0x24) + local_30;
    local_20[1] = *(float *)(param_1 + 0x28) + local_2c;
    pfVar2 = local_20;
    pfVar3 = DAT_00a68f58 + 8;
    for (iVar1 = 8; iVar1 != 0; iVar1 = iVar1 + -1) {
      *pfVar3 = *pfVar2;
      pfVar2 = pfVar2 + 1;
      pfVar3 = pfVar3 + 1;
    }
    local_4 = *(undefined4 *)(param_1 + 0x42);
    local_20[0] = *(float *)(param_1 + 0x24) + local_28 + local_30;
    local_20[1] = *(float *)(param_1 + 0x28) + local_24 + local_2c;
    pfVar2 = local_20;
    pfVar3 = DAT_00a68f58 + 0x10;
    for (iVar1 = 8; iVar1 != 0; iVar1 = iVar1 + -1) {
      *pfVar3 = *pfVar2;
      pfVar2 = pfVar2 + 1;
      pfVar3 = pfVar3 + 1;
    }
    local_8 = *(undefined4 *)(param_1 + 0x36);
    local_20[0] = *(float *)(param_1 + 0x24) + local_28;
    local_20[1] = *(float *)(param_1 + 0x28) + local_24;
    pfVar2 = local_20;
    pfVar3 = DAT_00a68f58 + 0x18;
    for (iVar1 = 8; iVar1 != 0; iVar1 = iVar1 + -1) {
      *pfVar3 = *pfVar2;
      pfVar2 = pfVar2 + 1;
      pfVar3 = pfVar3 + 1;
    }
    DAT_00a68f54 = DAT_00a68f54 + 4;
    DAT_00a68f58 = DAT_00a68f58 + 0x20;
    return 0x5a;
  }
  return 0x5a;
}
