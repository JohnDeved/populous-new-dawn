/* Ghidra 12.1.3 pseudocode; entry 004bf740; set_res_5_6_pos_index.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void set_res_5_6_pos_index(undefined4 param_1,INT32 param_2)

{
  byte *pbVar1;
  char *pcVar2;
  int iVar3;
  int iVar4;
  res_5_item *prVar5;
  res_6_item *prVar6;
  res_6_item *prVar7;

  iVar4 = (short)(param_1._2_2_ >> 9) * 0x80 + (int)(short)((ushort)param_1 >> 9);
  prVar6 = res_array_6 + iVar4;
  if (0x5db < (short)prVar6->counter) {
    param_2 = prVar6->res_5_index;
  }
  prVar5 = res_array_5 + param_2;
  iVar3 = param_2;
  if (prVar5->next_index != -1) {
    prVar7 = res_array_6 +
             (short)(*(ushort *)((int)&prVar5->land_pos + 2) >> 9) * 0x80 +
             (int)(short)(*(ushort *)&prVar5->land_pos >> 9);
    iVar3 = prVar7->res_5_index;
    if (prVar7->res_5_index_2 == iVar3) {
      prVar7->res_5_index_2 = -1;
      prVar7->res_5_index = -1;
      iVar3 = param_2;
    }
    else {
      prVar7->res_5_index = res_array_5[iVar3].next_index;
    }
    res_array_5[iVar3].next_index = -1;
    prVar7->counter = prVar7->counter + -1;
  }
  res_array_5[iVar3].land_pos = param_1;
  res_array_5[iVar3].next_index = -2;
  if (prVar6->res_5_index_2 == -1) {
    prVar6->res_5_index_2 = iVar3;
    prVar6->res_5_index = iVar3;
  }
  else {
    res_array_5[prVar6->res_5_index_2].next_index = iVar3;
    prVar6->res_5_index_2 = iVar3;
  }
  prVar6->counter = prVar6->counter + 1;
  iVar4 = (int)*(short *)(res_array_3 + iVar4 * 2);
  if (-1 < iVar4) {
    pbVar1 = (byte *)(res_array_1 + 2 + iVar4 * 8);
    *pbVar1 = *pbVar1 & 0xfd;
    pcVar2 = (char *)(res_array_1 + 3 + iVar4 * 8);
    *pcVar2 = *pcVar2 + '\x01';
  }
  return;
}
