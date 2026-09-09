/* Ghidra 12.1.3 pseudocode; entry 004b9cc0; FUN_004b9cc0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


undefined4 FUN_004b9cc0(int param_1,int param_2)

{
  undefined2 uVar1;
  undefined4 uVar2;
  int iVar3;
  short *psVar4;
  uint uVar5;

  uVar2 = 0;
  iVar3 = 0;
  uVar5 = (uint)*(ushort *)&unit_type_array_building[*(byte *)(param_2 + 0x9e)].field_0x14;
  if (uVar5 != 0) {
    psVar4 = (short *)(param_2 + 0x6a);
    do {
      if ((*psVar4 != 0) && (*psVar4 == *(short *)(param_1 + 0x24))) {
        uVar2 = 1;
        break;
      }
      psVar4 = psVar4 + 1;
      iVar3 = iVar3 + 1;
    } while (iVar3 < (int)uVar5);
  }
  if (((char)uVar2 == '\0') && (iVar3 = 0, uVar5 != 0)) {
    psVar4 = (short *)(param_2 + 0x6a);
    while (*psVar4 != 0) {
      psVar4 = psVar4 + 1;
      iVar3 = iVar3 + 1;
      if ((int)uVar5 <= iVar3) {
        return uVar2;
      }
    }
    uVar1 = *(undefined2 *)(param_1 + 0x24);
    *(undefined2 *)(param_2 + 0x6a + iVar3 * 2) = uVar1;
    uVar2 = CONCAT31((int3)(CONCAT22((short)((uint)param_1 >> 0x10),uVar1) >> 8),1);
    *(char *)(param_2 + 0x9a) = *(char *)(param_2 + 0x9a) + '\x01';
  }
  return uVar2;
}
