/* Ghidra 12.1.3 pseudocode; entry 0050bf60; FUN_0050bf60.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_0050bf60(int param_1)

{
  short sVar1;
  uint uVar2;

  sVar1 = calc_point_height(*(undefined2 *)(param_1 + 0x3d),*(undefined2 *)(param_1 + 0x3f));
  if (*(short *)(param_1 + 0x41) < sVar1) {
    *(short *)(param_1 + 0x41) = sVar1;
  }
  if ((*(byte *)(param_1 + 0xe) & 0x10) == 0) {
    empty_unit_function(param_1);
    *(undefined1 *)(param_1 + 0x2c) = 3;
    init_unit_class(param_1);
  }
  *(undefined1 *)(param_1 + 0x30) = 10;
  unit_set_object(param_1 + 0x33,1,0x13a);
  *(undefined2 *)(param_1 + 0x6c) = 4;
  uVar2 = pseudo_random * 0x24a1 + 0x24df;
  pseudo_random = uVar2 >> 0xd | uVar2 * 0x80000;
  *(undefined2 *)(param_1 + 0x5f) = 0x14;
  uVar2 = *(uint *)(param_1 + 0xc);
  *(uint *)(param_1 + 0x10) = *(uint *)(param_1 + 0x10) | 0x100;
  *(undefined2 *)(param_1 + 0x59) = 0;
  *(uint *)(param_1 + 0xc) = uVar2 | 0x80;
  *(uint *)(param_1 + 0xc) = uVar2 | 0x40080;
  *(uint *)(param_1 + 0xc) = uVar2 & 0xefffffff | 0x40080;
  *(uint *)(param_1 + 0xc) = uVar2 & 0xefffffff | 0x40180;
  if ((*(char *)(param_1 + 0x2b) == '7') && (*(char *)(param_1 + 0x2f) != player_tribe_num)) {
    *(byte *)(param_1 + 0x35) = *(byte *)(param_1 + 0x35) | 0x10;
  }
  return;
}
