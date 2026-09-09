/* Ghidra 12.1.3 pseudocode; entry 00500e20; init_unit_class_10.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void init_unit_class_10(int param_1)

{
  undefined2 uVar1;

  switch(*(byte *)(param_1 + 0x2c)) {
  case 1:
    return;
  case 2:
    uVar1 = calc_point_height(*(undefined2 *)(param_1 + 0x3d),
                              CONCAT22((short)(*(byte *)(param_1 + 0x2c) - 1 >> 0x10),
                                       *(undefined2 *)(param_1 + 0x3f)));
    *(undefined2 *)(param_1 + 0x41) = uVar1;
    *(uint *)(param_1 + 0x10) = *(uint *)(param_1 + 0x10) & 0xfffffbff;
    return;
  case 4:
    *(undefined1 *)(param_1 + 0x2d) = 0;
    *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) | 0x40000000;
    return;
  case 5:
    return;
  case 6:
    return;
  case 8:
    FUN_00518620(param_1);
    return;
  case 0xc:
    FUN_005029d0(param_1);
  }
  return;
}
