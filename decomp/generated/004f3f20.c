/* Ghidra 12.1.3 pseudocode; entry 004f3f20; FUN_004f3f20.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


undefined4 FUN_004f3f20(int param_1,int param_2)

{
  undefined2 uVar1;
  undefined2 uVar2;
  int iVar3;
  byte *pbVar4;
  int iVar5;
  undefined2 unaff_retaddr;

  uVar1 = *(undefined2 *)(param_2 + 0x3d);
  uVar2 = *(undefined2 *)(param_2 + 0x3f);
  iVar5 = 0;
  pbVar4 = (byte *)(param_1 + 0x74);
  do {
    if (((*pbVar4 & 1) != 0) && (pbVar4[0x11] == 8)) {
      iVar3 = FUN_0049c720(CONCAT22(unaff_retaddr,
                                    CONCAT11((char)((ushort)uVar2 >> 8),(char)((ushort)uVar1 >> 8)))
                           & 0xfffffefe,*(undefined2 *)(pbVar4 + -0x2e));
      if (iVar3 < 0x1a) {
        return 1;
      }
    }
    pbVar4 = pbVar4 + 0x52;
    iVar5 = iVar5 + 1;
  } while (iVar5 < 10);
  return 0;
}
