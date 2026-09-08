/* Ghidra 12.1.3 pseudocode; entry 0051fed0; FUN_0051fed0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_0051fed0(int param_1)

{
  uint uVar1;
  char cVar2;

  uVar1 = *(uint *)(param_1 + 0x10);
  if (((uVar1 & 0x100000) != 0) && (*(char *)(param_1 + 0x2a) != '\n')) {
    if ((*(byte *)(param_1 + 0x2e) & 1) == 0) {
      if (*(char *)(param_1 + 0x31) == '\0') {
        *(uint *)(param_1 + 0x10) = uVar1 & 0xffefffff;
        *(uint *)(param_1 + 0x10) = uVar1 & 0xffcfffff;
      }
      else {
        *(char *)(param_1 + 0x31) = *(char *)(param_1 + 0x31) + -1;
      }
    }
    if ((*(char *)(param_1 + 0x32) != '\0') &&
       (cVar2 = *(char *)(param_1 + 0x32) + -1, *(char *)(param_1 + 0x32) = cVar2, cVar2 == '\0')) {
      *(undefined1 *)(param_1 + 0x31) = 0;
      uVar1 = *(uint *)(param_1 + 0x10);
      *(uint *)(param_1 + 0x10) = uVar1 & 0xffdfffff;
      *(uint *)(param_1 + 0x10) = uVar1 & 0xffcfffff;
    }
  }
  return;
}
