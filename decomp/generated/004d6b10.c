/* Ghidra 12.1.3 pseudocode; entry 004d6b10; FUN_004d6b10.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_004d6b10(int param_1)

{
  char *pcVar1;
  ushort uVar2;
  uint uVar3;
  uint uVar4;

  if (*(char *)(param_1 + 0xa8) == '\x01') {
    uVar2 = *(ushort *)(param_1 + 0x76);
    if ((uVar2 & 0x10) == 0) {
      if ((*(char *)(param_1 + 0x39) == '\0') && (*(short *)(param_1 + 0x37) == 0)) {
        *(undefined1 *)(param_1 + 0xa8) = 2;
        *(ushort *)(param_1 + 0x76) = uVar2 | 0x10;
      }
    }
    else {
      *(ushort *)(param_1 + 0x35) = *(ushort *)(param_1 + 0x35) & 0xfffd;
      *(ushort *)(param_1 + 0x76) = uVar2 & 0xffef;
      *(undefined2 *)(param_1 + 0x37) = 0;
      *(undefined1 *)(param_1 + 0x39) = 0;
    }
  }
  if (*(char *)(param_1 + 0xa8) == '\x02') {
    if ((*(ushort *)(param_1 + 0x76) & 0x10) != 0) {
      *(byte *)(param_1 + 0x35) = *(byte *)(param_1 + 0x35) | 2;
      *(ushort *)(param_1 + 0x76) = *(ushort *)(param_1 + 0x76) & 0xffef;
      *(undefined2 *)(param_1 + 0x37) = 0;
      *(undefined1 *)(param_1 + 0x39) = 0;
      uVar4 = pseudo_random * 0x24a1 + 0x24df;
      uVar3 = uVar4 >> 0xd;
      pseudo_random = uVar3 | uVar4 * 0x80000;
      *(byte *)(param_1 + 0xaa) = ((byte)uVar3 & 7) + 4;
    }
    pcVar1 = (char *)(param_1 + 0xaa);
    *pcVar1 = *pcVar1 + -1;
    if (*pcVar1 == '\0') {
      *(undefined1 *)(param_1 + 0xa8) = 1;
      *(byte *)(param_1 + 0x76) = *(byte *)(param_1 + 0x76) | 0x10;
    }
  }
  return;
}
