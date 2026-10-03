/* Ghidra 12.1.3 pseudocode; entry 004f5680; FUN_004f5680.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


undefined4 FUN_004f5680(int param_1,ushort param_2,int param_3)

{
  int iVar1;
  char cVar2;
  uint uVar3;
  undefined1 *puVar4;

  for (iVar1 = (&DAT_00890390)
               [(short)(&DAT_008a03ea)[((param_2 & 0xfe) * 2 | param_2 & 0xfe00) * 2]]; iVar1 != 0;
      iVar1 = (&DAT_00890390)[*(ushort *)(iVar1 + 0x20)]) {
    if (((*(char *)(iVar1 + 0x2a) == '\x01') &&
        (*(char *)(param_1 + 0xc22) == *(char *)(iVar1 + 0x2f))) &&
       (cVar2 = FUN_004df0e0(iVar1), cVar2 != '\0')) {
      return 1;
    }
  }
  if (param_3 != 0) {
    for (iVar1 = *(int *)(param_1 + 0x881); iVar1 != 0; iVar1 = *(int *)(iVar1 + 8)) {
      if ((*(char *)(iVar1 + 0x2b) == '\x04') && (cVar2 = FUN_004df0e0(iVar1), cVar2 != '\0')) {
        puVar4 = (undefined1 *)0x0;
        uVar3 = (uint)*(ushort *)(iVar1 + 0x9b);
        if ((uVar3 != 0) ||
           (uVar3 = (uint)*(ushort *)(iVar1 + 0x8b + (uint)*(byte *)(iVar1 + 0xa6) * 2), uVar3 != 0)
           ) {
          puVar4 = &DAT_00938830 + uVar3 * 10;
        }
        if ((puVar4 != (undefined1 *)0x0) && (*(ushort *)(puVar4 + 6) == param_2)) {
          return 1;
        }
      }
    }
  }
  return 0;
}
