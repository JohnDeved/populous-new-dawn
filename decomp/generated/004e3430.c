/* Ghidra 12.1.3 pseudocode; entry 004e3430; FUN_004e3430.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


undefined1 FUN_004e3430(int param_1,char param_2)

{
  undefined1 uVar1;

  uVar1 = 0;
  if (((*(uint *)(param_1 + 0x10) & 0x80) == 0) &&
     (((*(uint *)(param_1 + 0x10) & 0x800) == 0 || (param_2 != '\0')))) {
    uVar1 = 1;
  }
  return uVar1;
}
