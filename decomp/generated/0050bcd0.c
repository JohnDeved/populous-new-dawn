/* Ghidra 12.1.3 pseudocode; entry 0050bcd0; FUN_0050bcd0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_0050bcd0(int param_1)

{
  ushort uVar1;
  short sVar2;
  undefined2 extraout_var;
  undefined2 extraout_var_00;

  insert_unit_into_land_tile(param_1,(undefined2 *)(param_1 + 0x3d));
  sVar2 = calc_point_height(CONCAT22(extraout_var_00,*(undefined2 *)(param_1 + 0x3d)),
                            CONCAT22(extraout_var,*(undefined2 *)(param_1 + 0x3f)));
  if (*(short *)(param_1 + 0x41) < sVar2) {
    *(short *)(param_1 + 0x41) = sVar2;
  }
  if ((*(byte *)(param_1 + 0xe) & 0x10) == 0) {
    empty_unit_function(param_1);
    *(undefined1 *)(param_1 + 0x2c) = 0;
    init_unit_class(param_1);
  }
  unit_set_object(param_1 + 0x33,0,0);
  uVar1 = *(ushort *)(param_1 + 0x35);
  *(undefined1 *)(param_1 + 0x30) = 10;
  *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) | 0x10000000;
  *(undefined2 *)(param_1 + 0x6c) = 0xffff;
  *(ushort *)(param_1 + 0x35) = uVar1 | 0x8000;
  *(ushort *)(param_1 + 0x35) = uVar1 | 0x8010;
  *(undefined2 *)(param_1 + 0x68) = 0x100;
  *(undefined2 *)(param_1 + 0x6a) = 0x100;
  return;
}
