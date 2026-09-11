/* Ghidra 12.1.3 pseudocode; entry 004a8e20; FUN_004a8e20.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_004a8e20(int param_1)

{
  short sVar1;
  byte bVar2;

  if ((*(uint *)(param_1 + 0x10) & 0x100000) == 0) {
    *(undefined1 *)(param_1 + 0x32) = 0x40;
    sVar1 = *(short *)(param_1 + 0x84) / 100;
    if (sVar1 < 1) {
      sVar1 = 1;
    }
    bVar2 = *(char *)(param_1 + 0x31) + 1;
    *(byte *)(param_1 + 0x31) = bVar2;
    if (sVar1 <= (short)(ushort)bVar2) {
      *(uint *)(param_1 + 0x10) = *(uint *)(param_1 + 0x10) | 0x100000;
    }
  }
  return;
}
