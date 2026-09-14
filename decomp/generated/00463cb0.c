/* Ghidra 12.1.3 pseudocode; entry 00463cb0; FUN_00463cb0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_00463cb0(int param_1)

{
  ushort uVar1;
  char cVar2;
  short sVar3;
  undefined2 local_2;

  if (*(short *)(param_1 + 0x98) != 0) {
    sVar3 = *(short *)(param_1 + 0x98) + -1;
    uVar1 = *(ushort *)&unit_type_array_vehicle[*(byte *)(param_1 + 0x2b)].field_0x15;
    *(short *)(param_1 + 0x98) = sVar3;
    if (sVar3 < 1) {
      if (*(char *)(param_1 + 0x2c) == '\b') {
        *(uint *)(param_1 + 0x92) = *(uint *)(param_1 + 0x92) | 0x400000;
      }
      if ((uVar1 & 1) == 0) {
        if ((*(byte *)(param_1 + 0xe) & 0x10) == 0) {
          empty_unit_function(param_1);
          *(undefined1 *)(param_1 + 0x2c) = 5;
          init_unit_class(param_1);
          return;
        }
      }
      else if ((*(byte *)(param_1 + 0xe) & 0x10) == 0) {
        empty_unit_function(param_1);
        *(undefined1 *)(param_1 + 0x2c) = 6;
        init_unit_class(param_1);
        return;
      }
    }
    else {
      if ((*(short *)(param_1 + 0x5f) != 0) || (*(char *)(param_1 + 0x9e) != '\0')) {
        *(short *)(param_1 + 0x98) =
             (short)*(undefined4 *)(unit_type_array_vehicle + *(byte *)(param_1 + 0x2b));
      }
      if ((*(uint *)(param_1 + 0x92) & 0x20000) == 0) {
        if (((*(byte *)(param_1 + 0x2e) & 0x3f) == 0) || ((*(uint *)(param_1 + 0xc) & 0x2004) != 0))
        {
          *(uint *)(param_1 + 0x92) = *(uint *)(param_1 + 0x92) | 0x4000;
        }
        if (((((*(byte *)(param_1 + 0x93) & 0x40) != 0) && (*(char *)(param_1 + 0x2c) != '\a')) &&
            (*(char *)(param_1 + 0x2c) != '\b')) &&
           (((*(char *)(param_1 + 0x9e) == '\0' && (cVar2 = FUN_00465650(param_1), cVar2 == '\0'))
            && ((*(byte *)(param_1 + 0xe) & 0x10) == 0)))) {
          empty_unit_function(param_1);
          *(undefined1 *)(param_1 + 0x2c) = 7;
          init_unit_class(param_1);
        }
        if ((((*(uint *)(param_1 + 0xc) & 0x2004) != 0) || ((*(byte *)(param_1 + 0x2e) & 0xf) == 0))
           && (((uVar1 & 1) == 0 &&
               (((*(char *)(param_1 + 0x2c) != '\b' &&
                 (local_2 = CONCAT11((char)((ushort)*(undefined2 *)(param_1 + 0x3f) >> 8),
                                     (char)((ushort)*(undefined2 *)(param_1 + 0x3d) >> 8)),
                 (*(byte *)(landscape_height_array +
                           ((&game_state.level_data[0].c_3)
                            [((local_2 & 0xfe) * 2 | local_2 & 0xfe00) * 4] & 0xf)) & 1) != 0)) &&
                ((*(uint *)(param_1 + 0xc) & 0x100000) == 0)))))) {
          empty_unit_function(param_1);
          *(undefined1 *)(param_1 + 0x2c) = 8;
          init_unit_class(param_1);
        }
      }
    }
  }
  return;
}
