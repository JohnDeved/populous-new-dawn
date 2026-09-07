/* Ghidra 12.1.3 pseudocode; entry 004d1340; FUN_004d1340.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_004d1340(int param_1,ushort param_2,int param_3)

{
  int iVar1;
  char *pcVar2;
  char *pcVar3;

  iVar1 = FUN_004f3ef0(param_1,((param_2 & 0xfe) * 2 | param_2 & 0xfe00) * 4 + 0x8a03e4);
  if (iVar1 != 0) {
    pcVar3 = (char *)(param_1 + 0x4cf);
    iVar1 = 8;
    pcVar2 = pcVar3;
    do {
      if ((*pcVar2 != '\0') && (pcVar2[2] == '\0')) {
        *pcVar2 = '\0';
      }
      pcVar2 = pcVar2 + 0xc;
      iVar1 = iVar1 + -1;
    } while (iVar1 != 0);
    iVar1 = 8;
    do {
      if (*pcVar3 != '\0') {
        if ((uint)*(ushort *)(param_3 + 0x14) + (uint)*(ushort *)(param_3 + 0x16) +
            (uint)*(ushort *)(param_3 + 0x18) < (uint)(byte)pcVar3[1]) {
          *pcVar3 = '\0';
        }
      }
      pcVar3 = pcVar3 + 0xc;
      iVar1 = iVar1 + -1;
    } while (iVar1 != 0);
    return;
  }
  pcVar3 = (char *)(param_1 + 0x4cf);
  iVar1 = 8;
  pcVar2 = pcVar3;
  do {
    if ((*pcVar2 != '\0') && (pcVar2[2] != '\0')) {
      *pcVar2 = '\0';
    }
    pcVar2 = pcVar2 + 0xc;
    iVar1 = iVar1 + -1;
  } while (iVar1 != 0);
  iVar1 = 8;
  do {
    if (*pcVar3 != '\0') {
      if (*(ushort *)(param_3 + 0x22) < (ushort)(byte)pcVar3[1]) {
        *pcVar3 = '\0';
      }
    }
    pcVar3 = pcVar3 + 0xc;
    iVar1 = iVar1 + -1;
  } while (iVar1 != 0);
  return;
}
