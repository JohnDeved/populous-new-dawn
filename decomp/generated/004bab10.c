/* Ghidra 12.1.3 pseudocode; entry 004bab10; init_unit_type_8.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void init_unit_type_8(int param_1)

{
  undefined4 uVar1;
  undefined1 uVar2;
  undefined2 local_4;
  undefined2 local_2;

  switch(*(undefined1 *)(param_1 + 0x2b)) {
  case 1:
    *(undefined1 *)(param_1 + 0x7f) = 4;
    *(undefined2 *)(param_1 + 0x5f) = 0x578;
    *(undefined4 *)(param_1 + 0x76) = *(undefined4 *)(param_1 + 0x3d);
    *(undefined2 *)(param_1 + 0x7a) = *(undefined2 *)(param_1 + 0x41);
    *(undefined2 *)(param_1 + 0x6a) = 0x14;
    FUN_004badd0(CONCAT22(*(char *)(param_1 + 0x2f) >> 7,
                          *(undefined2 *)
                           (game_state.tribes_array[*(char *)(param_1 + 0x2f)].field1414_0x969 +
                           0x28)),&local_4);
    *(undefined2 *)(param_1 + 0x70) = local_4;
    *(undefined2 *)(param_1 + 0x72) = local_2;
    uVar2 = 1;
    *(undefined2 *)(param_1 + 0x74) = 0xa80;
    if (*(char *)(param_1 + 0x2b) == '\x02') {
      uVar2 = 2;
    }
    if ((*(byte *)(param_1 + 0xe) & 0x10) == 0) {
      empty_unit_function(param_1);
      *(undefined1 *)(param_1 + 0x2c) = uVar2;
      init_unit_class(param_1);
      return;
    }
    break;
  case 2:
    *(undefined1 *)(param_1 + 0x7f) = 4;
    *(undefined2 *)(param_1 + 0x5f) = 0x578;
    *(undefined2 *)(param_1 + 0x6a) = 0x14;
    *(undefined4 *)(param_1 + 0x76) = *(undefined4 *)(param_1 + 0x3d);
    *(undefined2 *)(param_1 + 0x7a) = *(undefined2 *)(param_1 + 0x41);
    FUN_004badd0(CONCAT22(*(char *)(param_1 + 0x2f) >> 7,
                          *(undefined2 *)
                           (game_state.tribes_array[*(char *)(param_1 + 0x2f)].field1414_0x969 +
                           0x28)),&local_4);
    *(undefined2 *)(param_1 + 0x70) = local_4;
    *(undefined2 *)(param_1 + 0x72) = local_2;
    uVar2 = 1;
    *(undefined2 *)(param_1 + 0x74) = 0xa80;
    if (*(char *)(param_1 + 0x2b) == '\x02') {
      uVar2 = 2;
    }
    if ((*(byte *)(param_1 + 0xe) & 0x10) == 0) {
      empty_unit_function(param_1);
      *(undefined1 *)(param_1 + 0x2c) = uVar2;
      init_unit_class(param_1);
      return;
    }
    break;
  case 3:
    insert_unit_into_land_tile(param_1,(undefined4 *)(param_1 + 0x3d));
    if ((*(byte *)(param_1 + 0xe) & 0x10) == 0) {
      empty_unit_function(param_1);
      *(undefined1 *)(param_1 + 0x2c) = 3;
      init_unit_class(param_1);
    }
    unit_set_object(param_1 + 0x33,0x29,0x599);
    *(undefined2 *)(param_1 + 0x5f) = 1000;
    *(ushort *)(param_1 + 0x35) = *(ushort *)(param_1 + 0x35) & 0xbfff;
    uVar1 = *(undefined4 *)(param_1 + 0x3d);
    *(undefined4 *)(param_1 + 0x76) = uVar1;
    *(uint *)(param_1 + 0x10) = *(uint *)(param_1 + 0x10) | 0x400000;
    *(undefined2 *)(param_1 + 0x7a) = *(undefined2 *)(param_1 + 0x41);
    *(undefined2 *)(param_1 + 0x6a) = 8;
    *(undefined2 *)(param_1 + 0x6c) = 0x5c;
    FUN_004bb230(CONCAT31((int3)((uint)uVar1 >> 8),*(undefined1 *)(param_1 + 0x2f)),param_1 + 0x70);
    add_unit_to_cell(param_1,param_1 + 0x70);
    return;
  case 4:
    FUN_004bb350(param_1);
    return;
  case 5:
    *(undefined2 *)(param_1 + 0x6a) = 9;
    *(undefined4 *)(param_1 + 0x76) = *(undefined4 *)(param_1 + 0x3d);
    *(undefined2 *)(param_1 + 0x7a) = *(undefined2 *)(param_1 + 0x41);
    *(undefined2 *)(param_1 + 0x6c) = 800;
    FUN_004badd0(CONCAT22((short)((uint)(*(char *)(param_1 + 0x2f) * 0xb) >> 0x10),
                          *(undefined2 *)
                           (game_state.tribes_array[*(char *)(param_1 + 0x2f)].field1414_0x969 +
                           0x28)),&local_4);
    *(undefined2 *)(param_1 + 0x74) = 0xa80;
    *(undefined2 *)(param_1 + 0x70) = local_4;
    *(undefined2 *)(param_1 + 0x72) = local_2;
    if ((*(byte *)(param_1 + 0xe) & 0x10) == 0) {
      empty_unit_function(param_1);
      *(undefined1 *)(param_1 + 0x2c) = 5;
      init_unit_class(param_1);
      return;
    }
    break;
  case 6:
    FUN_004bbcf0(param_1);
    return;
  case 7:
    FUN_004bc500(param_1);
    return;
  case 8:
    FUN_004bc500(param_1);
  }
  return;
}
