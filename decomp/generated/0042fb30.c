/* Ghidra 12.1.3 pseudocode; entry 0042fb30; FUN_0042fb30.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_0042fb30(byte *param_1,uint *param_2,int param_3,int param_4,int param_5,int param_6,
                 uint param_7)

{
  byte *pbVar1;
  int iVar2;
  uint uVar3;
  byte bVar4;
  uint uVar5;
  uint local_4;

  iVar2 = *(int *)(param_3 + 8);
  if (iVar2 == 0) {
    while (param_5 != 0) {
      param_5 = param_5 + -1;
      *(byte *)param_2 = *param_1;
      param_1 = param_1 + 1;
      param_2 = (uint *)((int)param_2 + 1);
    }
  }
  else if (iVar2 == 0x10) {
    if (param_5 != 0) {
      do {
        param_5 = param_5 + -1;
        bVar4 = *param_1;
        if (bVar4 == param_7) {
          uVar5 = 0;
        }
        else {
          uVar5 = bVar4 & 0xf;
        }
        if (uVar5 == 0) {
          bVar4 = 0;
        }
        else {
          bVar4 = *(byte *)((uint)(bVar4 | 0xf) * 0x100 + param_6);
        }
        param_1 = param_1 + 1;
        pbVar1 = (byte *)(param_4 + (uint)bVar4 * 4);
        *(ushort *)param_2 =
             (ushort)(pbVar1[1] >> (8U - *(char *)(param_3 + 0x10) & 0x1f)) <<
             (*(byte *)(param_3 + 0x20) & 0x1f) |
             (ushort)(pbVar1[2] >> (8U - *(char *)(param_3 + 0x14) & 0x1f)) <<
             (*(byte *)(param_3 + 0x24) & 0x1f) |
             (ushort)(*pbVar1 >> (8U - *(char *)(param_3 + 0xc) & 0x1f)) <<
             (*(byte *)(param_3 + 0x1c) & 0x1f) |
             (short)((int)uVar5 >> (4U - *(char *)(param_3 + 0x18) & 0x1f)) <<
             (*(byte *)(param_3 + 0x28) & 0x1f);
        param_2 = (uint *)((int)param_2 + 2);
      } while (param_5 != 0);
      return;
    }
  }
  else if ((iVar2 == 0x20) && (param_5 != 0)) {
    do {
      param_5 = param_5 + -1;
      bVar4 = *param_1;
      if (bVar4 == param_7) {
        uVar5 = 0;
      }
      else {
        uVar5 = bVar4 & 0xf;
      }
      if (uVar5 == 0) {
        bVar4 = 0;
      }
      else {
        bVar4 = *(byte *)((uint)(bVar4 | 0xf) * 0x100 + param_6);
      }
      param_1 = param_1 + 1;
      pbVar1 = (byte *)(param_4 + (uint)bVar4 * 4);
      local_4 = (uint)(pbVar1[2] >> (8U - *(char *)(param_3 + 0x14) & 0x1f));
      uVar3 = local_4 << (*(byte *)(param_3 + 0x24) & 0x1f);
      local_4 = (uint)(*pbVar1 >> (8U - *(char *)(param_3 + 0xc) & 0x1f));
      *param_2 = (uint)(pbVar1[1] >> (8U - *(char *)(param_3 + 0x10) & 0x1f)) <<
                 (*(byte *)(param_3 + 0x20) & 0x1f) | uVar3 |
                 local_4 << (*(byte *)(param_3 + 0x1c) & 0x1f) |
                 ((int)uVar5 >> (4U - *(char *)(param_3 + 0x18) & 0x1f)) <<
                 (*(byte *)(param_3 + 0x28) & 0x1f);
      param_2 = param_2 + 1;
    } while (param_5 != 0);
    return;
  }
  return;
}
