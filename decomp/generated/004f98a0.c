/* Ghidra 12.1.3 pseudocode; entry 004f98a0; FUN_004f98a0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */
/* WARNING: Enum "_D3DRENDERSTATETYPE": Some values do not have unique names */

undefined4 __fastcall FUN_004f98a0(int param_1)

{
  float fVar1;
  undefined4 uVar2;
  uint uVar3;
  uint uVar4;
  uint uVar5;
  ushort *puVar6;
  int iVar7;
  float local_2c;
  float local_24;
  float local_20;
  undefined4 local_1c;
  float fStack_18;
  float local_14;
  float local_10;
  float local_c;
  float local_8;
  int local_4;

  FUN_004ff6f0(*(undefined2 *)(param_1 + 0x30),&local_1c,*(undefined4 *)(param_1 + 0x20));
  uVar4 = *(uint *)(param_1 + 0x20);
  if (((uVar4 & 0x20) == 0) && (local_4 == 0)) {
    local_20 = uv_5 * local_8;
    if (ui_struct->uv_related == 1) {
      if (texture_min_mag_value == 0) {
        *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) | 0x20;
      }
      local_2c = local_8 * _DAT_0058f880;
      local_24 = local_2c;
      goto LAB_004f9952;
    }
    *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) | 0x20;
    local_24 = uv_1;
    local_2c = uv_3;
  }
  else {
    local_20 = 0.0;
    local_24 = uv_4;
    local_2c = uv_2;
  }
  local_2c = local_2c * local_8;
  local_24 = local_24 * local_8;
LAB_004f9952:
  uVar5 = uVar4 & 4;
  *(float *)(param_1 + 0x36) = local_2c + fStack_18;
  *(float *)(param_1 + 0x3a) = local_2c + local_14;
  if (uVar5 == 0) {
    *(float *)(param_1 + 0x3e) = local_24 + fStack_18 + local_10;
  }
  uVar4 = uVar4 & 8;
  if (uVar4 == 0) {
    *(float *)(param_1 + 0x42) = local_24 + local_14 + local_c;
  }
  *(undefined4 *)(param_1 + 0x18) = local_1c;
  if ((*(uint *)(param_1 + 0x32) & 1) == 0) {
    uVar3 = *(uint *)((uint)*(ushort *)(param_1 + 0x30) * 0x24 + 0xc +
                     *(int *)(*(int *)(param_1 + 0x2c) + 4));
  }
  else {
    fVar1 = *(float *)(param_1 + 0x36);
    uVar2 = *(undefined4 *)(param_1 + 0x3e);
    *(float *)(param_1 + 0x3e) = fVar1;
    *(undefined4 *)(param_1 + 0x36) = uVar2;
    *(float *)(param_1 + 0x36) = *(float *)(param_1 + 0x36) + local_20;
    *(float *)(param_1 + 0x3e) = fVar1 + local_20;
    puVar6 = (ushort *)
             ((uint)*(ushort *)(param_1 + 0x30) * 0x24 + *(int *)(*(int *)(param_1 + 0x2c) + 4));
    uVar3 = ((uint)*puVar6 - *(int *)(puVar6 + 10)) - *(int *)(puVar6 + 6);
  }
  local_24 = (float)uVar3;
  if ((*(uint *)(param_1 + 0x32) & 2) == 0) {
    uVar3 = *(uint *)((uint)*(ushort *)(param_1 + 0x30) * 0x24 + 0x10 +
                     *(int *)(*(int *)(param_1 + 0x2c) + 4));
  }
  else {
    fVar1 = *(float *)(param_1 + 0x3a);
    uVar2 = *(undefined4 *)(param_1 + 0x42);
    *(float *)(param_1 + 0x42) = fVar1;
    *(undefined4 *)(param_1 + 0x3a) = uVar2;
    *(float *)(param_1 + 0x3a) = *(float *)(param_1 + 0x3a) + local_20;
    *(float *)(param_1 + 0x42) = fVar1 + local_20;
    iVar7 = (uint)*(ushort *)(param_1 + 0x30) * 0x24 + *(int *)(*(int *)(param_1 + 0x2c) + 4);
    uVar3 = ((uint)*(ushort *)(iVar7 + 2) - *(int *)(iVar7 + 0x10)) - *(int *)(iVar7 + 0x18);
  }
  local_20 = (float)uVar3;
  if (uVar5 == 0) {
    puVar6 = (ushort *)
             ((uint)*(ushort *)(param_1 + 0x30) * 0x24 + *(int *)(*(int *)(param_1 + 0x2c) + 4));
    if ((float)*puVar6 == *(float *)(param_1 + 0x46)) {
      fVar1 = (float)*(uint *)(puVar6 + 10);
    }
    else {
      fVar1 = *(float *)(param_1 + 0x46) / (float)*puVar6;
      local_24 = local_24 * fVar1;
      fVar1 = (float)*(uint *)(puVar6 + 10) * fVar1;
    }
    *(float *)(param_1 + 0x46) = fVar1;
  }
  if (uVar4 == 0) {
    iVar7 = (uint)*(ushort *)(param_1 + 0x30) * 0x24 + *(int *)(*(int *)(param_1 + 0x2c) + 4);
    if ((float)*(ushort *)(iVar7 + 2) == *(float *)(param_1 + 0x4a)) {
      fVar1 = (float)*(uint *)(iVar7 + 0x18);
    }
    else {
      fVar1 = *(float *)(param_1 + 0x4a) / (float)*(ushort *)(iVar7 + 2);
      local_20 = local_20 * fVar1;
      fVar1 = (float)*(uint *)(iVar7 + 0x18) * fVar1;
    }
    *(float *)(param_1 + 0x4a) = fVar1;
  }
  if (*(int *)(param_1 + 0x52) != 0) {
    *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) | 8;
  }
  if ((uVar5 != 0) || (uVar4 != 0)) {
    *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) | 0x80;
  }
  *(float *)(param_1 + 0x24) = *(float *)(param_1 + 0x24) + local_24;
  *(float *)(param_1 + 0x28) = *(float *)(param_1 + 0x28) + local_20;
  return 0x5a;
}
