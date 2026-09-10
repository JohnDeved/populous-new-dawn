/* Ghidra 12.1.3 pseudocode; entry 00424320; FUN_00424320.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_00424320(undefined4 param_1,short *param_2,short *param_3,undefined4 param_4)

{
  int iVar1;
  uint uVar2;
  int iVar3;
  uint uVar4;
  undefined2 local_4c;
  undefined2 local_4a;
  uint local_48;
  float local_44;
  int local_40;
  uint local_3c;
  uint local_38;
  undefined4 local_34;
  uint local_30;
  uint local_2c;
  int local_28;
  undefined4 local_24;
  uint local_20;
  uint local_1c;
  undefined4 local_18;
  uint local_14;
  uint local_10;
  float local_c;
  int local_8;
  int local_4;

  if ((*param_3 != *param_2) || (param_3[1] != param_2[1])) {
    vector_conv_16b_to_32b_with_wrapping(param_2,param_3,&local_24,&local_18);
    local_40 = local_24;
    local_3c = local_20;
    local_38 = local_1c;
    local_34 = local_18;
    local_30 = local_14;
    local_2c = local_10;
    if ((int)local_14 < (int)local_20) {
      local_40 = local_18;
      local_3c = local_14;
      local_38 = local_10;
      local_34 = local_24;
      local_30 = local_20;
      local_2c = local_1c;
    }
    if (local_30 - local_3c == 0) {
      local_44 = 0.0;
    }
    else {
      local_44 = (float)(int)(local_2c - local_38) / (float)(int)(local_30 - local_3c);
    }
    uVar4 = local_30 & 0xfffffe00;
    local_48 = local_30;
    for (uVar2 = local_3c + 0x1ff & 0xfffffe00; (int)uVar2 <= (int)uVar4; uVar2 = uVar2 + 0x200) {
      local_4c = __ftol();
      local_4a = __ftol();
      FUN_00423e80(param_1,&local_4c,1,param_4);
    }
    local_3c = local_20;
    local_38 = local_1c;
    local_30 = local_14;
    local_2c = local_10;
    if ((int)local_10 < (int)local_1c) {
      local_3c = local_14;
      local_38 = local_10;
      local_30 = local_20;
      local_2c = local_1c;
    }
    if (local_2c - local_38 == 0) {
      local_44 = 0.0;
    }
    else {
      local_44 = (float)(int)(local_30 - local_3c) / (float)(int)(local_2c - local_38);
    }
    for (uVar2 = local_38 + 0x1ff & 0xfffffe00; (int)uVar2 <= (int)(local_2c & 0xfffffe00);
        uVar2 = uVar2 + 0x200) {
      local_4c = __ftol();
      local_4a = __ftol();
      FUN_00423e80(param_1,&local_4c,2,param_4);
    }
    local_3c = local_20;
    local_38 = local_1c;
    local_30 = local_14;
    local_2c = local_10;
    if ((int)(local_14 - local_10) < (int)(local_20 - local_1c)) {
      local_3c = local_14;
      local_38 = local_10;
      local_30 = local_20;
      local_2c = local_1c;
    }
    local_48 = local_30;
    iVar1 = local_2c - local_38;
    local_8 = local_38 * 2;
    if (iVar1 != local_30 - local_3c) {
      iVar3 = ((local_3c - local_38) + 0x1fe & 0xfffffe00) * 2;
      local_28 = (local_30 - local_2c & 0xfffffe00) * 2;
      if (iVar3 <= local_28) {
        local_4 = iVar1 * 0x400;
        local_44 = (float)(int)(iVar1 - (local_30 - local_3c));
        local_c = (float)local_8;
        do {
          iVar3 = iVar3 + 0x400;
          local_4c = __ftol();
          local_4a = __ftol();
          FUN_00423e80(param_1,&local_4c,4,param_4);
        } while (iVar3 <= local_28);
      }
    }
    local_3c = local_20;
    local_38 = local_1c;
    local_34 = local_18;
    local_30 = local_14;
    local_2c = local_10;
    if ((int)(local_10 + local_14) < (int)(local_20 + local_1c)) {
      local_3c = local_14;
      local_38 = local_10;
      local_34 = local_24;
      local_30 = local_20;
      local_2c = local_1c;
    }
    local_48 = local_30;
    local_8 = local_38 * 2;
    if (local_38 - local_2c != local_30 - local_3c) {
      local_40 = (local_38 + local_3c + 0x1fe & 0xfffffe00) * 2;
      local_28 = (local_2c + local_30 & 0xfffffe00) * 2;
      if (local_40 <= local_28) {
        local_c = (float)((local_2c - local_38) * 0x400);
        local_44 = (float)local_8;
        do {
          iVar1 = local_40 + 0x400;
          local_4c = __ftol();
          local_4a = __ftol();
          FUN_00423e80(param_1,&local_4c,3,param_4);
          local_40 = iVar1;
        } while (iVar1 <= local_28);
      }
    }
  }
  return;
}
