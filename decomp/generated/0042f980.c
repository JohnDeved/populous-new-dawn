/* Ghidra 12.1.3 pseudocode; entry 0042f980; FUN_0042f980.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_0042f980(byte *param_1,uint *param_2,int param_3,int param_4,int param_5,uint param_6)

{
  byte *pbVar1;
  byte bVar2;
  int iVar3;
  uint uVar4;
  uint local_4;

  iVar3 = *(int *)(param_3 + 8);
  if (iVar3 == 0) {
    while (param_5 != 0) {
      param_5 = param_5 + -1;
      bVar2 = *param_1;
      param_1 = param_1 + 1;
      *(byte *)param_2 = bVar2;
      param_2 = (uint *)((int)param_2 + 1);
    }
  }
  else if (iVar3 == 0x10) {
    if (param_5 != 0) {
      do {
        param_5 = param_5 + -1;
        pbVar1 = (byte *)(param_4 + (uint)*param_1 * 4);
        if (param_6 == *param_1) {
          *(undefined2 *)param_2 = 0;
        }
        else {
          *(ushort *)param_2 =
               (ushort)(pbVar1[2] >> (8U - *(char *)(param_3 + 0x14) & 0x1f)) <<
               (*(byte *)(param_3 + 0x24) & 0x1f) |
               (ushort)(pbVar1[1] >> (8U - *(char *)(param_3 + 0x10) & 0x1f)) <<
               (*(byte *)(param_3 + 0x20) & 0x1f) |
               (ushort)(*pbVar1 >> (8U - *(char *)(param_3 + 0xc) & 0x1f)) <<
               (*(byte *)(param_3 + 0x1c) & 0x1f) | *(ushort *)(param_3 + 0x38);
        }
        param_1 = param_1 + 1;
        param_2 = (uint *)((int)param_2 + 2);
      } while (param_5 != 0);
      return;
    }
  }
  else if ((iVar3 == 0x20) && (param_5 != 0)) {
    do {
      param_5 = param_5 + -1;
      pbVar1 = (byte *)(param_4 + (uint)*param_1 * 4);
      if (param_6 == *param_1) {
        *param_2 = 0;
      }
      else {
        local_4 = (uint)(pbVar1[1] >> (8U - *(char *)(param_3 + 0x10) & 0x1f));
        uVar4 = local_4 << (*(byte *)(param_3 + 0x20) & 0x1f);
        local_4 = (uint)(*pbVar1 >> (8U - *(char *)(param_3 + 0xc) & 0x1f));
        *param_2 = (uint)(pbVar1[2] >> (8U - *(char *)(param_3 + 0x14) & 0x1f)) <<
                   (*(byte *)(param_3 + 0x24) & 0x1f) | uVar4 |
                   local_4 << (*(byte *)(param_3 + 0x1c) & 0x1f) | *(uint *)(param_3 + 0x38);
      }
      param_1 = param_1 + 1;
      param_2 = param_2 + 1;
    } while (param_5 != 0);
    return;
  }
  return;
}
