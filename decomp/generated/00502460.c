/* Ghidra 12.1.3 pseudocode; entry 00502460; FUN_00502460.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


uint FUN_00502460(int param_1)

{
  short sVar1;
  uint uVar2;
  uint uVar3;

  if ((*(byte *)(param_1 + 0xe) & 0x10) == 0) {
    empty_unit_function(param_1);
    *(undefined1 *)(param_1 + 0x2c) = 7;
    init_unit_class(param_1);
  }
  insert_unit_into_land_tile(param_1,param_1 + 0x3d);
  unit_set_object(param_1 + 0x33,0x19,0x18);
  *(byte *)(param_1 + 0x36) = *(byte *)(param_1 + 0x36) | 0x80;
  *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) | 0x80;
  uVar3 = game_state.pseudo_random_val * 0x24a1 + 0x24df;
  uVar2 = uVar3 >> 0xd;
  game_state.pseudo_random_val = uVar2 | uVar3 * 0x80000;
  *(undefined2 *)(param_1 + 0x59) = 0x200;
  *(ushort *)(param_1 + 0x57) = (ushort)uVar2 & 0x7ff;
  uVar3 = game_state.pseudo_random_val * 0x24a1 + 0x24df;
  uVar2 = uVar3 >> 0xd;
  game_state.pseudo_random_val = uVar2 | uVar3 * 0x80000;
  *(ushort *)(param_1 + 0x5f) = ((ushort)uVar2 & 0xff) + 0x40;
  uVar3 = game_state.pseudo_random_val * 0x24a1 + 0x24df;
  uVar2 = uVar3 >> 0xd;
  game_state.pseudo_random_val = uVar2 | uVar3 * 0x80000;
  *(undefined1 *)(param_1 + 0x92) = 3;
  *(undefined1 *)(param_1 + 0x93) = 5;
  *(undefined2 *)(param_1 + 0x94) = 0xffff;
  sVar1 = ((ushort)uVar2 & 0x7f) + 0x80;
  *(short *)(param_1 + 0x4b) = sVar1;
  *(short *)(param_1 + 0x96) = sVar1;
  uVar2 = game_state.pseudo_random_val * 0x24a1 + 0x24df;
  game_state.pseudo_random_val = uVar2 >> 0xd | uVar2 * 0x80000;
  *(short *)(param_1 + 0x98) = (short)((ulonglong)game_state.pseudo_random_val % 0xaa) + 0x16;
  uVar2 = game_state.pseudo_random_val * 0x24a1 + 0x24df;
  game_state.pseudo_random_val = uVar2 >> 0xd | uVar2 * 0x80000;
  *(short *)(param_1 + 0x9a) = (short)((ulonglong)game_state.pseudo_random_val % 0xaa) + 0x16;
  uVar2 = game_state.pseudo_random_val * 0x24a1 + 0x24df;
  game_state.pseudo_random_val = uVar2 >> 0xd | uVar2 * 0x80000;
  uVar2 = game_state.pseudo_random_val / 0xaa;
  *(short *)(param_1 + 0x9c) = (short)((ulonglong)game_state.pseudo_random_val % 0xaa) + 0x16;
  return uVar2;
}
