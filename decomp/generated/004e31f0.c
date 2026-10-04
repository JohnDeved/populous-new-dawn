/* Ghidra 12.1.3 pseudocode; entry 004e31f0; FUN_004e31f0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


int FUN_004e31f0(int param_1,char param_2,int *param_3)

{
  int iVar1;
  ushort *puVar2;
  int iVar3;
  int iVar4;
  int iVar5;
  int local_4;

  iVar3 = 0;
  local_4 = 0;
  iVar5 = (int)(char)(&DAT_005a7940)[(uint)*(byte *)(param_1 + 0x2b) * 0x17];
  if (0 < iVar5) {
    puVar2 = (ushort *)(param_1 + 0x7a);
    do {
      iVar4 = 0;
      if (((*puVar2 != 0) && (iVar1 = (&DAT_00890390)[*puVar2], (*(byte *)(iVar1 + 0xc) & 1) == 0))
         && (*(char *)(iVar1 + 0x2a) != '\0')) {
        iVar4 = iVar1;
      }
      if (iVar4 != 0) {
        if (param_2 == '\0') {
          FUN_004458d0(iVar4,0,0);
        }
        else if ((*(byte *)(iVar4 + 0x10) & 0x80) == 0) {
          iVar3 = iVar3 + 1;
          FUN_004458d0(iVar4,1,0);
          if (local_4 == 0) {
            local_4 = iVar4;
          }
        }
      }
      puVar2 = puVar2 + 1;
      iVar5 = iVar5 + -1;
    } while (iVar5 != 0);
  }
  if (param_3 != (int *)0x0) {
    *param_3 = local_4;
  }
  return iVar3;
}
