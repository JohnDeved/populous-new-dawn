/* Ghidra 12.1.3 pseudocode; entry 00435780; FUN_00435780.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_00435780(int param_1,byte param_2,byte param_3,short param_4,ushort param_5,byte param_6)

{
  byte *pbVar1;
  uint uVar2;
  short sVar3;
  byte bVar4;
  byte bStack_1;

  pbVar1 = (byte *)(param_1 + 0x8c1 + (uint)param_2 * 10);
  *pbVar1 = param_3;
  pbVar1[1] = param_6;
  pbVar1[1] = param_6 & 0xfe;
  uVar2 = *(uint *)(&DAT_005a7dca + (uint)param_3 * 0x16);
  if ((uVar2 & 1) == 0) {
    if ((uVar2 & 0x242) != 0) {
      *(short *)(pbVar1 + 6) = param_4;
      goto LAB_00435892;
    }
    if ((uVar2 & 4) != 0) {
      *(short *)(pbVar1 + 6) = param_4;
      *(ushort *)(pbVar1 + 8) = param_5;
      goto LAB_00435892;
    }
    bVar4 = (byte)param_4;
    if ((uVar2 & 0x800) != 0) {
      *(ushort *)(pbVar1 + 6) = param_5;
      pbVar1[8] = (byte)((ushort)param_4 >> 8);
      pbVar1[9] = bVar4;
      goto LAB_00435892;
    }
    if ((uVar2 & 0x400) != 0) {
      pbVar1[6] = bVar4;
      goto LAB_00435892;
    }
    if ((uVar2 & 0x1000000) != 0) {
      pbVar1[6] = bVar4;
      goto LAB_00435892;
    }
    bStack_1 = (byte)(param_5 >> 8) & 0xfe;
    *(ushort *)(pbVar1 + 6) = ((param_5 & 0xfe) + 1) * 0x100;
    sVar3 = (bStack_1 + 1) * 0x100;
  }
  else {
    *(ushort *)(pbVar1 + 6) = param_5 * 0x100 + 0x80;
    sVar3 = (param_5 & 0xff00) + 0x80;
  }
  *(short *)(pbVar1 + 8) = sVar3;
LAB_00435892:
  if (param_3 == 7) {
    bVar4 = pbVar1[1];
    pbVar1[1] = bVar4 & 0xfb;
    bVar4 = bVar4 & 0xf3;
    pbVar1[1] = bVar4;
    if (param_4 == 0) {
      pbVar1[1] = bVar4 | 4;
      pbVar1[1] = bVar4 | 0xc;
      return;
    }
    if (param_4 == 1) {
      pbVar1[1] = bVar4 | 4;
      return;
    }
    if (param_4 != 2) {
      return;
    }
    pbVar1[1] = bVar4 | 8;
  }
  return;
}
