/* Ghidra 12.1.3 pseudocode; entry 0050c260; process_sparkle.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void process_sparkle(int param_1)

{
  uint uVar1;
  char cVar2;
  short sVar3;
  int iVar4;
  uint uVar5;

  if (*(char *)(param_1 + 0x2b) == 'J') {
    if (((((*(byte *)(param_1 + 0x2e) & 7) == 0) &&
         (uVar5 = pseudo_random * 0x24a1 + 0x24df, uVar1 = uVar5 >> 0xd,
         pseudo_random = uVar1 | uVar5 * 0x80000, ((byte)uVar1 & 0x1f) < 2)) &&
        (cVar2 = FUN_004edae0(7,0x4b), cVar2 != '\0')) &&
       (iVar4 = alloc_unit_2(7,0x4b,*(undefined1 *)(param_1 + 0x2f),param_1 + 0x3d), iVar4 != 0)) {
      *(undefined1 *)(iVar4 + 0x2d) = 1;
    }
  }
  else if (((*(char *)(param_1 + 0x2b) == 'K') && (*(char *)(param_1 + 0x2d) == '\0')) &&
          (((*(byte *)(param_1 + 0x35) & 0x10) != 0 &&
           (uVar5 = pseudo_random * 0x24a1 + 0x24df, uVar1 = uVar5 >> 0xd,
           pseudo_random = uVar1 | uVar5 * 0x80000, ((byte)uVar1 & 0xf) < 3)))) {
    *(undefined2 *)(param_1 + 0x6c) = 0x10;
    *(ushort *)(param_1 + 0x35) = *(ushort *)(param_1 + 0x35) & 0xffef;
    *(undefined2 *)(param_1 + 0x37) = 0;
    *(undefined1 *)(param_1 + 0x39) = 0;
  }
  if ((0 < *(short *)(param_1 + 0x6c)) &&
     (sVar3 = *(short *)(param_1 + 0x6c) + -1, *(short *)(param_1 + 0x6c) = sVar3, sVar3 == 0)) {
    if (*(char *)(param_1 + 0x2d) == '\0') {
      *(byte *)(param_1 + 0x35) = *(byte *)(param_1 + 0x35) | 0x10;
      return;
    }
    FUN_004ef180(param_1);
  }
  return;
}
