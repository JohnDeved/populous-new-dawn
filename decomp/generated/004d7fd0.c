/* Ghidra 12.1.3 pseudocode; entry 004d7fd0; FUN_004d7fd0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


int FUN_004d7fd0(int param_1,undefined1 param_2,short *param_3)

{
  short sVar1;
  char cVar2;
  int iVar3;
  int iVar4;
  undefined2 unaff_retaddr;

  *DAT_00892443 = (int)*param_3;
  DAT_00892443[1] = (int)param_3[1];
  sVar1 = *(short *)(param_1 + 0x26);
  DAT_00892443[2] = (int)sVar1;
  DAT_00892443[3] = 0;
  DAT_00892443[4] = 0;
  DAT_00892443 = DAT_00892443 + 5;
  DAT_0089243a = 1;
  iVar3 = FUN_004ed8a0(1,2,CONCAT31((int3)(char)((ushort)sVar1 >> 8),param_2),param_1 + 0x3d);
  if (iVar3 != 0) {
    if ((*(byte *)(param_1 + 0x7f) & 2) == 0) {
      *(uint *)(iVar3 + 0x10) = *(uint *)(iVar3 + 0x10) | 0x40000;
    }
    iVar4 = FUN_004ed8a0(7,0x3a,0xff,param_1 + 0x3d);
    if (iVar4 != 0) {
      FUN_0048a050(param_1,5,0);
      *(undefined2 *)(iVar4 + 0x72) = *(undefined2 *)(iVar3 + 0x24);
      if ((((byte)DAT_00895da8 & 4) != 0) && (*(char *)(iVar3 + 0x2f) == DAT_0089c6f0)) {
        cVar2 = FUN_004e69c0(iVar3);
        if (cVar2 != '\0') {
          FUN_00450610(2,CONCAT22(unaff_retaddr,
                                  CONCAT11((char)((ushort)*(undefined2 *)(iVar3 + 0x3f) >> 8),
                                           (char)((ushort)*(undefined2 *)(iVar3 + 0x3d) >> 8))) &
                         0xfffffefe);
        }
      }
    }
    FUN_004d4b50(param_1);
  }
  return iVar3;
}
