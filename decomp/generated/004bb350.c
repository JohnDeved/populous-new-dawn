/* Ghidra 12.1.3 pseudocode; entry 004bb350; FUN_004bb350.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_004bb350(int param_1)

{
  short *psVar1;
  ushort uVar2;
  byte bStack_1;

  insert_unit_into_land_tile(param_1,(undefined4 *)(param_1 + 0x3d));
  if ((*(byte *)(param_1 + 0xe) & 0x10) == 0) {
    empty_unit_function(param_1);
    *(undefined1 *)(param_1 + 0x2c) = 4;
    init_unit_class(param_1);
  }
  psVar1 = (short *)(param_1 + 0x33);
  unit_set_object(psVar1,0x28,0x460);
  *(undefined2 *)(param_1 + 0x5f) = 1000;
  *(ushort *)(param_1 + 0x35) = *(ushort *)(param_1 + 0x35) & 0xbfff;
  *(undefined2 *)(param_1 + 0x6a) = 4;
  *psVar1 = *psVar1 + 3;
  *(uint *)(param_1 + 0x10) = *(uint *)(param_1 + 0x10) | 0x400000;
  *(undefined4 *)(param_1 + 0x76) = *(undefined4 *)(param_1 + 0x3d);
  *(undefined2 *)(param_1 + 0x7a) = *(undefined2 *)(param_1 + 0x41);
  *(undefined2 *)(param_1 + 0x6c) = 0x50;
  uVar2 = *(ushort *)(game_state.tribes_array[*(char *)(param_1 + 0x2f)].field1414_0x969 + 0x28);
  bStack_1 = (byte)(uVar2 >> 8) & 0xfe;
  *(undefined2 *)(param_1 + 0x74) = 0xa80;
  *(short *)(param_1 + 0x70) = ((uVar2 & 0xfe) + 1) * 0x100;
  *(ushort *)(param_1 + 0x72) = (bStack_1 + 1) * 0x100;
  add_unit_to_cell(param_1,(short *)(param_1 + 0x70));
  *(byte *)(param_1 + 0x6e) = *(byte *)(param_1 + 0x6e) | 1;
  return;
}
