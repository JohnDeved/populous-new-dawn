/* Ghidra 12.1.3 pseudocode; entry 00511a60; FUN_00511a60.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_00511a60(int param_1)

{
  short sVar1;

  sVar1 = calc_point_height(*(undefined2 *)(param_1 + 0x3d),*(undefined2 *)(param_1 + 0x3f));
  if (*(short *)(param_1 + 0x41) < sVar1) {
    *(short *)(param_1 + 0x41) = sVar1;
  }
  if ((*(byte *)(param_1 + 0xe) & 0x10) == 0) {
    empty_unit_function(param_1);
    *(undefined1 *)(param_1 + 0x2c) = 0x27;
    init_unit_class(param_1);
  }
  *(undefined1 *)(param_1 + 0x30) = 10;
  unit_set_object(param_1 + 0x33,0x23,0);
  *(uint *)(param_1 + 0x10) = *(uint *)(param_1 + 0x10) | 0x200;
  *(undefined2 *)(param_1 + 0x6c) = 1;
  *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) | 0x40000;
  *(undefined2 *)(param_1 + 0x5f) = 0;
  return;
}
