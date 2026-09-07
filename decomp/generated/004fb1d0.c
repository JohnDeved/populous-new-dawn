/* Ghidra 12.1.3 pseudocode; entry 004fb1d0; FUN_004fb1d0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_004fb1d0(int param_1)

{
  undefined2 uVar1;
  undefined2 extraout_var;
  undefined2 extraout_var_00;

  insert_unit_into_land_tile(param_1,(undefined2 *)(param_1 + 0x3d));
  uVar1 = calc_point_height(CONCAT22(extraout_var_00,*(undefined2 *)(param_1 + 0x3d)),
                            CONCAT22(extraout_var,*(undefined2 *)(param_1 + 0x3f)));
  *(uint *)(param_1 + 0x10) = *(uint *)(param_1 + 0x10) & 0xfffffbff;
  *(undefined2 *)(param_1 + 0x41) = uVar1;
  if ((*(byte *)(param_1 + 0xe) & 0x10) == 0) {
    empty_unit_function(param_1);
    *(undefined1 *)(param_1 + 0x2c) = 5;
    init_unit_class(param_1);
  }
  unit_set_object(param_1 + 0x33,2,0x1f);
  *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) | 0x10000000;
  *(byte *)(param_1 + 0x35) = *(byte *)(param_1 + 0x35) | 0x10;
  *(undefined1 *)(param_1 + 0x6e) = 1;
  if ((*(byte *)(param_1 + 0x14) & 4) == 0) {
    *(undefined2 *)(param_1 + 0x8e) = 1;
    *(undefined1 *)(param_1 + 0x69) = 1;
    *(undefined1 *)(param_1 + 0x6b) = 1;
    *(byte *)(param_1 + 0x6d) = *(byte *)(param_1 + 0x6d) | 1;
    *(undefined4 *)(param_1 + 0x9a) = 0xc0;
    *(undefined1 *)(param_1 + 0x6e) = 2;
    *(undefined1 *)(param_1 + 0xa0) = 0xff;
  }
  return;
}
