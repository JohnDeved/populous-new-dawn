/* Ghidra 12.1.3 pseudocode; entry 00511ef0; FUN_00511ef0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_00511ef0(int param_1)

{
  bool bVar1;
  undefined2 uVar2;

  bVar1 = true;
  uVar2 = calc_point_height(*(undefined2 *)(param_1 + 0x3d),*(undefined2 *)(param_1 + 0x3f));
  *(undefined2 *)(param_1 + 0x41) = uVar2;
  *(uint *)(param_1 + 0x10) = *(uint *)(param_1 + 0x10) & 0xfffffbff;
  *(short *)(param_1 + 0x41) = *(short *)(param_1 + 0x41) + 0x400;
  *(undefined4 *)(param_1 + 0x57) = *(undefined4 *)(param_1 + 0x3d);
  *(undefined2 *)(param_1 + 0x5b) = *(undefined2 *)(param_1 + 0x41);
  if ((*(byte *)(param_1 + 0xe) & 0x10) == 0) {
    empty_unit_function(param_1);
    *(undefined1 *)(param_1 + 0x2c) = 0x12;
    init_unit_class(param_1);
  }
  if (((*(byte *)(param_1 + 0x13) & 0x40) != 0) && ((*(byte *)(param_1 + 0x14) & 4) == 0)) {
    bVar1 = false;
  }
  if (bVar1) {
    FUN_004a2950(param_1);
  }
  return;
}
