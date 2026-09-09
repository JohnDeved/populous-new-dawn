/* Ghidra 12.1.3 pseudocode; entry 004baaf0; FUN_004baaf0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


undefined1 FUN_004baaf0(int param_1,char param_2)

{
  undefined1 uVar1;

  uVar1 = 0;
  if ((*(char *)(param_1 + 0x9e) == '\x04') && (*(char *)(param_1 + 0x2f) != param_2)) {
    uVar1 = 1;
  }
  return uVar1;
}
