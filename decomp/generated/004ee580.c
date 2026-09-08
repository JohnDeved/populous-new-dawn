/* Ghidra 12.1.3 pseudocode; entry 004ee580; add_unit_to_cell.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


undefined4 add_unit_to_cell(int param_1,ushort *param_2)

{
  ushort *puVar1;
  undefined2 uVar2;
  ushort uVar3;
  undefined4 uVar4;
  uint uVar5;
  undefined2 local_e;
  undefined2 local_c;
  undefined4 local_8;
  short local_4;

  uVar4 = 0;
  if ((*(byte *)(param_1 + 0x15) & 2) == 0) {
    local_8 = *(undefined4 *)(param_1 + 0x3d);
    local_4 = *(short *)(param_1 + 0x41);
  }
  puVar1 = (ushort *)(param_1 + 0x3d);
  if ((((*param_2 ^ *puVar1) & 0xfe00) != 0) ||
     (((param_2[1] ^ *(ushort *)(param_1 + 0x3f)) & 0xfe00) != 0)) {
    uVar4 = 1;
    local_e = CONCAT11((char)((ushort)*(undefined2 *)(param_1 + 0x3f) >> 8),(char)(*puVar1 >> 8));
    if (*(ushort *)(param_1 + 0x22) == 0) {
      (&game_state.level_data[0].unit_index)[((local_e & 0xfe) * 2 | local_e & 0xfe00) * 2] =
           *(undefined2 *)(param_1 + 0x20);
    }
    else {
      unit_land_array[*(ushort *)(param_1 + 0x22)]->next_unit_index = *(ushort *)(param_1 + 0x20);
    }
    if (*(ushort *)(param_1 + 0x20) != 0) {
      unit_land_array[*(ushort *)(param_1 + 0x20)]->r1 = *(undefined2 *)(param_1 + 0x22);
    }
    *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) & 0xfffdffff;
    uVar2 = *(undefined2 *)(param_1 + 0x24);
    local_c = CONCAT11((char)(param_2[1] >> 8),(char)(*param_2 >> 8));
    uVar5 = (local_c & 0xfe) * 2 | local_c & 0xfe00;
    *(undefined2 *)(param_1 + 0x22) = 0;
    uVar3 = (&game_state.level_data[0].unit_index)[uVar5 * 2];
    *(ushort *)(param_1 + 0x20) = uVar3;
    if (uVar3 != 0) {
      unit_land_array[uVar3]->r1 = uVar2;
    }
    (&game_state.level_data[0].unit_index)[uVar5 * 2] = uVar2;
    *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) | 0x20000;
  }
  *(undefined4 *)puVar1 = *(undefined4 *)param_2;
  *(ushort *)(param_1 + 0x41) = param_2[2];
  if (((*(uint *)(param_1 + 0x14) & 0x100) != 0) && ((*(uint *)(param_1 + 0x14) & 0x200) == 0)) {
    *(ushort *)(param_1 + 0x43) = *puVar1 - (short)local_8;
    *(short *)(param_1 + 0x45) = *(short *)(param_1 + 0x3f) - local_8._2_2_;
    *(short *)(param_1 + 0x47) = *(short *)(param_1 + 0x41) - local_4;
  }
  return uVar4;
}
