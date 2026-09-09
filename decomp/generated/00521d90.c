/* Ghidra 12.1.3 pseudocode; entry 00521d90; count_ones_and_zeroes.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void count_ones_and_zeroes(int param_1,undefined4 *param_2)

{
  uint uVar1;
  int iVar2;
  int iVar3;
  int iVar4;
  int iVar5;
  undefined4 *puVar6;
  int local_10;
  int local_c;
  int local_8;
  int local_4;

  iVar3 = 0;
  iVar4 = 0;
  puVar6 = param_2;
  for (iVar2 = 0xf; iVar2 != 0; iVar2 = iVar2 + -1) {
    *puVar6 = 0;
    puVar6 = puVar6 + 1;
  }
  param_2[2] = 0;
  if ((*(uint *)(param_1 + 4) & 0x20) == 0) {
    if ((*(uint *)(param_1 + 4) & 8) == 0) {
      iVar2 = 0;
      param_2[2] = *(undefined4 *)(param_1 + 0xc);
      *param_2 = 0;
      param_2[1] = 0;
      for (uVar1 = *(uint *)(param_1 + 0x10); (uVar1 & 1) == 0; uVar1 = uVar1 >> 1) {
        iVar2 = iVar2 + 1;
      }
      local_10 = 0;
      for (; (uVar1 & 1) != 0; uVar1 = uVar1 >> 1) {
        local_10 = local_10 + 1;
      }
      iVar5 = 0;
      for (uVar1 = *(uint *)(param_1 + 0x14); (uVar1 & 1) == 0; uVar1 = uVar1 >> 1) {
        iVar5 = iVar5 + 1;
      }
      local_c = 0;
      for (; (uVar1 & 1) != 0; uVar1 = uVar1 >> 1) {
        local_c = local_c + 1;
      }
      local_4 = 0;
      for (uVar1 = *(uint *)(param_1 + 0x18); (uVar1 & 1) == 0; uVar1 = uVar1 >> 1) {
        local_4 = local_4 + 1;
      }
      local_8 = 0;
      for (; (uVar1 & 1) != 0; uVar1 = uVar1 >> 1) {
        local_8 = local_8 + 1;
      }
      uVar1 = *(uint *)(param_1 + 0x1c);
      if (uVar1 != 0) {
        iVar3 = 0;
        for (; (uVar1 & 1) == 0; uVar1 = uVar1 >> 1) {
          iVar3 = iVar3 + 1;
        }
        iVar4 = 0;
        for (; (uVar1 & 1) != 0; uVar1 = uVar1 >> 1) {
          iVar4 = iVar4 + 1;
        }
      }
      param_2[6] = iVar4;
      param_2[3] = local_10;
      param_2[4] = local_c;
      param_2[5] = local_8;
      param_2[0xb] = *(undefined4 *)(param_1 + 0x10);
      param_2[0xc] = *(undefined4 *)(param_1 + 0x14);
      param_2[0xd] = *(undefined4 *)(param_1 + 0x18);
      param_2[0xe] = *(undefined4 *)(param_1 + 0x1c);
      param_2[7] = iVar2;
      param_2[8] = iVar5;
      param_2[9] = local_4;
      param_2[10] = iVar3;
      return;
    }
    *param_2 = 1;
    param_2[1] = 4;
    return;
  }
  *param_2 = 1;
  param_2[1] = 8;
  return;
}
