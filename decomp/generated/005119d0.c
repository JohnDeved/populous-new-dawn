/* Ghidra 12.1.3 pseudocode; entry 005119d0; FUN_005119d0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_005119d0(int param_1)

{
  uint uVar1;
  uint uVar2;

  if ((*(byte *)(param_1 + 0xe) & 0x10) == 0) {
    empty_unit_function(param_1);
    *(undefined1 *)(param_1 + 0x2c) = 0x3e;
    init_unit_class(param_1);
  }
  uVar2 = game_state.pseudo_random_val * 0x24a1 + 0x24df;
  uVar1 = uVar2 >> 0xd;
  game_state.pseudo_random_val = uVar1 | uVar2 * 0x80000;
  *(ushort *)(param_1 + 0x6c) = ((ushort)uVar1 & 0x3f) + 0x60;
  *(undefined2 *)(param_1 + 0x68) = 0x10;
  *(undefined2 *)(param_1 + 0x6a) = 0x10;
  unit_set_object(param_1 + 0x33,0x30,0x541);
  *(byte *)(param_1 + 0x36) = *(byte *)(param_1 + 0x36) | 2;
  return;
}
