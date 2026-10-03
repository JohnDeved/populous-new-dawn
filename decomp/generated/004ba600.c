/* Ghidra 12.1.3 pseudocode; entry 004ba600; FUN_004ba600.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


uint FUN_004ba600(uint param_1)

{
  uint uVar1;

  uVar1 = param_1 + 0x3f & 0xffffffc0;
  if ((int)(param_1 - (param_1 & 0xffffffc0)) <= (int)(uVar1 - param_1)) {
    uVar1 = param_1 & 0xffffffc0;
  }
  if ((int)uVar1 < 0x40) {
    uVar1 = 0x40;
  }
  if (0x400 < (int)uVar1) {
    uVar1 = 0x400;
  }
  return uVar1;
}
