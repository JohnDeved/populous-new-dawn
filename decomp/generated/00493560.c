/* Ghidra 12.1.3 pseudocode; entry 00493560; FUN_00493560.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


uint FUN_00493560(char param_1,char param_2)

{
  uint in_EAX;
  uint uVar1;

  uVar1 = in_EAX & 0xffffff00;
  if (param_1 != -1) {
    uVar1 = CONCAT31((int3)((uint)(param_1 * 0x18 + 0x93a7a0) >> 8),
                     (&game_state.field_0x9d62b)[param_1 * 0x18]);
    if (param_2 != '\0') {
      uVar1 = uVar1 & 0xffffff20;
      return CONCAT31((int3)(uVar1 >> 8),(byte)uVar1 >> 5);
    }
    uVar1 = uVar1 & 0xffffff10;
    uVar1 = CONCAT31((int3)(uVar1 >> 8),(byte)uVar1 >> 4);
  }
  return uVar1;
}
