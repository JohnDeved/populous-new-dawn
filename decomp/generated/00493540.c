/* Ghidra 12.1.3 pseudocode; entry 00493540; FUN_00493540.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


undefined1 FUN_00493540(char param_1)

{
  undefined1 uVar1;

  uVar1 = 0;
  if ((param_1 != -1) && (*(short *)(&game_state.field_0x9d632 + param_1 * 0x18) < 1)) {
    uVar1 = 1;
  }
  return uVar1;
}
