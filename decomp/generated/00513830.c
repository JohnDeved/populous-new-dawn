/* Ghidra 12.1.3 pseudocode; entry 00513830; FUN_00513830.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_00513830(int param_1)

{
  uint uVar1;
  undefined2 uVar2;

  uVar2 = calc_point_height(*(undefined2 *)(param_1 + 0x3d),*(undefined2 *)(param_1 + 0x3f));
  *(undefined2 *)(param_1 + 0x41) = uVar2;
  if ((*(byte *)(param_1 + 0xe) & 0x10) == 0) {
    empty_unit_function(param_1);
    *(undefined1 *)(param_1 + 0x2c) = 0x34;
    init_unit_class(param_1);
  }
  FUN_0048a050(param_1,0x2c,0);
  unit_set_object(param_1 + 0x33,0x2c,0x518);
  uVar1 = *(uint *)(param_1 + 0x14);
  *(undefined1 *)(param_1 + 0x3b) = 0xd3;
  *(undefined2 *)(param_1 + 0x6c) = 0x10;
  *(undefined2 *)(param_1 + 0x5f) = 0;
  *(uint *)(param_1 + 0x14) = uVar1 | 0x400;
  *(uint *)(param_1 + 0x14) = uVar1 | 0x40400;
  return;
}
