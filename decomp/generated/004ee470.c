/* Ghidra 12.1.3 pseudocode; entry 004ee470; insert_unit_into_land_tile.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void insert_unit_into_land_tile(int param_1,undefined2 *param_2)

{
  undefined2 uVar1;
  ushort uVar2;
  uint uVar3;
  undefined2 local_2;

  uVar1 = *(undefined2 *)(param_1 + 0x24);
  local_2 = CONCAT11((char)((ushort)param_2[1] >> 8),(char)((ushort)*param_2 >> 8));
  uVar3 = (local_2 & 0xfe) * 2 | local_2 & 0xfe00;
  *(undefined2 *)(param_1 + 0x22) = 0;
  uVar2 = (&game_state.level_data[0].unit_index)[uVar3 * 2];
  *(ushort *)(param_1 + 0x20) = uVar2;
  if (uVar2 != 0) {
    unit_land_array[uVar2]->r1 = uVar1;
  }
  (&game_state.level_data[0].unit_index)[uVar3 * 2] = uVar1;
  *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) | 0x20000;
  return;
}
