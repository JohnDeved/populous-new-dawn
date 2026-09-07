/* Ghidra 12.1.3 pseudocode; entry 0047fab0; rotate_basis.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void rotate_basis(int *param_1,ushort param_2,char param_3)

{
  int *piVar1;
  int iVar2;
  int iVar3;
  int iVar4;
  int iVar5;
  int iVar6;
  int iVar7;
  uint local_44;
  uint local_40;
  int local_3c;
  int local_38;
  int local_34;
  int local_30;
  int local_2c;
  int local_28;
  int local_24;
  int local_20;
  int local_1c;
  int local_18;
  int local_14;
  int local_10;
  int local_c;
  int local_8;
  int local_4;

  if (param_3 == '\x01') {
    local_44 = 1;
    local_40 = 2;
    local_24._0_1_ = 0;
  }
  else if (param_3 == '\x02') {
    local_44 = 0;
    local_40 = 2;
    local_24._0_1_ = 1;
  }
  else if (param_3 == '\x03') {
    local_44 = 0;
    local_40 = 1;
    local_24._0_1_ = 2;
  }
  iVar4 = maybe_sin[param_2 & 0x7ff] >> 2;
  iVar7 = maybe_cos[param_2 & 0x7ff] >> 2;
  iVar5 = param_1[(uint)(byte)local_24 * 3 + 1];
  iVar6 = param_1[(uint)(byte)local_24 * 3];
  iVar3 = (param_1 + (uint)(byte)local_24 * 3)[2];
  local_24 = iVar6 * iVar6 >> 0xe;
  local_14 = iVar5 * iVar5 >> 0xe;
  local_4 = iVar3 * iVar3 >> 0xe;
  local_24 = ((0x4000 - local_24) * iVar7 >> 0xe) + local_24;
  local_14 = ((0x4000 - local_14) * iVar7 >> 0xe) + local_14;
  local_4 = ((0x4000 - local_4) * iVar7 >> 0xe) + local_4;
  iVar7 = 0x4000 - iVar7;
  local_3c = (iVar5 * iVar6 >> 0xe) * iVar7 >> 0xe;
  local_18 = iVar4 * iVar3 >> 0xe;
  local_c = (iVar6 * iVar3 >> 0xe) * iVar7 >> 0xe;
  iVar2 = iVar5 * iVar4 >> 0xe;
  local_10 = (iVar5 * iVar3 >> 0xe) * iVar7 >> 0xe;
  iVar5 = iVar6 * iVar4 >> 0xe;
  local_20 = local_3c - local_18;
  local_1c = local_c + iVar2;
  local_c = local_c - iVar2;
  local_8 = local_10 + iVar5;
  local_10 = local_10 - iVar5;
  local_18 = local_18 + local_3c;
  piVar1 = param_1 + (local_44 & 0xff) * 3;
  local_30 = *piVar1;
  local_2c = piVar1[1];
  local_28 = piVar1[2];
  mul_matrix_vector(&local_3c,&local_24,&local_30);
  *piVar1 = local_3c >> 0xe;
  piVar1[1] = local_38 >> 0xe;
  piVar1[2] = local_34 >> 0xe;
  local_28 = param_1[(local_40 & 0xff) * 3 + 2];
  piVar1 = param_1 + (local_40 & 0xff) * 3;
  local_30 = *piVar1;
  local_2c = piVar1[1];
  mul_matrix_vector(&local_3c,&local_24,&local_30);
  *piVar1 = local_3c >> 0xe;
  piVar1[1] = local_38 >> 0xe;
  piVar1[2] = local_34 >> 0xe;
  iVar5 = param_1[6];
  iVar6 = param_1[7];
  iVar3 = param_1[8];
  local_34 = fast_sqrt(iVar3 * iVar3 + iVar6 * iVar6 + iVar5 * iVar5);
  local_3c = (iVar5 << 0xe) / local_34;
  param_1[6] = local_3c;
  local_38 = (iVar6 << 0xe) / local_34;
  param_1[7] = local_38;
  local_34 = (iVar3 << 0xe) / local_34;
  param_1[8] = local_34;
  local_30 = param_1[2] * local_38 - param_1[1] * local_34;
  local_2c = *param_1 * local_34 - param_1[2] * local_3c;
  local_28 = param_1[1] * local_3c - *param_1 * local_38;
  iVar5 = local_30 >> 0xe;
  param_1[3] = iVar5;
  iVar6 = local_2c >> 0xe;
  param_1[4] = iVar6;
  iVar2 = local_28 >> 0xe;
  param_1[5] = iVar2;
  iVar3 = fast_sqrt(iVar6 * iVar6 + iVar5 * iVar5 + iVar2 * iVar2);
  iVar5 = (iVar5 << 0xe) / iVar3;
  param_1[3] = iVar5;
  iVar6 = (iVar6 << 0xe) / iVar3;
  param_1[4] = iVar6;
  iVar3 = (iVar2 << 0xe) / iVar3;
  local_3c = param_1[6];
  local_38 = param_1[7];
  local_34 = param_1[8];
  param_1[5] = iVar3;
  local_30 = local_34 * iVar6 - local_38 * iVar3;
  local_2c = local_3c * iVar3 - local_34 * iVar5;
  local_28 = local_38 * iVar5 - local_3c * iVar6;
  iVar6 = local_30 >> 0xe;
  *param_1 = iVar6;
  iVar2 = local_2c >> 0xe;
  param_1[1] = iVar2;
  iVar3 = local_28 >> 0xe;
  param_1[2] = iVar3;
  iVar5 = fast_sqrt(iVar3 * iVar3 + iVar2 * iVar2 + iVar6 * iVar6);
  *param_1 = (iVar6 << 0xe) / iVar5;
  param_1[1] = (iVar2 << 0xe) / iVar5;
  param_1[2] = (iVar3 << 0xe) / iVar5;
  return;
}
