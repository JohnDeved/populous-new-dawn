/* Ghidra 12.1.3 pseudocode; entry 0049cfe0; FUN_0049cfe0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


undefined4 FUN_0049cfe0(void)

{
  undefined4 uVar1;

  uVar1 = 0x3c;
  if ((game_state._858460_1_ & 1) != 0) {
    uVar1 = 0x18;
  }
  if ((game_state._858460_1_ & 4) != 0) {
    uVar1 = 0x14;
  }
  if ((game_state._858460_1_ & 2) != 0) {
    uVar1 = 0xe;
  }
  return uVar1;
}
