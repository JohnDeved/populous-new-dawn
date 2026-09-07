/* Ghidra 12.1.3 pseudocode; entry 004f8390; FUN_004f8390.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


undefined4 FUN_004f8390(int param_1,undefined2 param_2,ushort *param_3,int param_4,int param_5)

{
  int iVar1;
  ushort *puVar2;
  int iVar3;
  int iVar4;
  ushort *puVar5;
  undefined2 local_4;
  byte local_2;
  byte bStack_1;

  local_4 = CONCAT11((char)((ushort)*(undefined2 *)(param_1 + 0x3f) >> 8),
                     (char)((ushort)*(undefined2 *)(param_1 + 0x3d) >> 8)) & 0xfefe;
  local_2 = (byte)param_2;
  iVar4 = (uint)(byte)local_4 - (uint)local_2;
  if (iVar4 < 0) {
    iVar4 = (uint)local_2 - (uint)(byte)local_4;
  }
  if (0x80 < iVar4) {
    iVar4 = 0x100 - iVar4;
  }
  bStack_1 = (byte)((ushort)param_2 >> 8);
  iVar1 = (uint)local_4._1_1_ - (uint)bStack_1;
  if (iVar1 < 0) {
    iVar1 = (uint)bStack_1 - (uint)local_4._1_1_;
  }
  if (0x80 < iVar1) {
    iVar1 = 0x100 - iVar1;
  }
  iVar3 = 0;
  puVar5 = param_3;
  if (0 < param_4) {
    do {
      if (iVar4 + iVar1 < (int)(uint)*puVar5) {
        if (param_5 == 100) {
          param_5 = 99;
        }
        if (iVar3 < param_5) {
          iVar3 = param_5 - iVar3;
          puVar2 = param_3 + param_5 * 2;
          do {
            *puVar2 = puVar2[-2];
            iVar3 = iVar3 + -1;
            puVar2[1] = puVar2[-1];
            puVar2 = puVar2 + -2;
          } while (iVar3 != 0);
        }
        *puVar5 = (ushort)(iVar4 + iVar1);
        puVar5[1] = *(ushort *)(param_1 + 0x24);
        return 1;
      }
      puVar5 = puVar5 + 2;
      iVar3 = iVar3 + 1;
    } while (iVar3 < param_4);
  }
  return 0;
}
