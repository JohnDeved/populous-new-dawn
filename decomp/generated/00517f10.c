/* Ghidra 12.1.3 pseudocode; entry 00517f10; FUN_00517f10.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


undefined4 FUN_00517f10(int param_1,int param_2)

{
  short sVar1;
  uint uVar2;
  unit_struct *puVar3;
  undefined4 uVar4;
  unit_struct *puVar5;
  ushort uVar6;
  undefined2 local_2;

  uVar4 = 0;
  uVar2 = *(uint *)(param_1 + 0x10);
  uVar6 = *(ushort *)(param_2 + 8) & 0x3ff;
  puVar5 = unit_land_array[uVar6];
  if ((uVar2 & 1) == 0) {
    if ((uVar2 & 2) == 0) {
      if ((uVar2 & 4) == 0) {
        if ((uVar2 & 0x10000) != 0) {
          puVar5 = (unit_struct *)0x0;
          if (((*(ushort *)(param_1 + 0x72) != 0) &&
              (puVar3 = unit_land_array[*(ushort *)(param_1 + 0x72)],
              (*(byte *)&puVar3->flags_2 & 1) == 0)) && (puVar3->unit_class != '\0')) {
            puVar5 = puVar3;
          }
          if (puVar5 != (unit_struct *)0x0) {
            local_2 = CONCAT11((char)((ushort)(puVar5->pos).y >> 8),
                               (char)((ushort)(puVar5->pos).x >> 8));
            uVar6 = (&game_state.level_data[0].unit_index_2)
                    [((local_2 & 0xfe) * 2 | local_2 & 0xfe00) * 2];
            if (((uVar6 & 0x3ff) != 0) && (((*(ushort *)(param_2 + 8) ^ uVar6) & 0x3ff) == 0)) {
              return 0;
            }
          }
          return 1;
        }
      }
      else if (*(ushort *)(param_1 + 0x89) != uVar6) {
        return 1;
      }
    }
    else {
      if (puVar5->state == '\x01') {
        return 1;
      }
      if (*(ushort *)(param_1 + 0x89) != uVar6) {
        return 1;
      }
    }
  }
  else if (puVar5->state == '\x01') {
    if ((*(ushort *)(param_1 + 0x89) != 0) &&
       (sVar1._0_1_ = unit_land_array[*(ushort *)(param_1 + 0x89)]->num_points,
       sVar1._1_1_ = unit_land_array[*(ushort *)(param_1 + 0x89)]->tex_size_type,
       (int)sVar1 != (uint)uVar6)) {
      return 1;
    }
  }
  else if (puVar5->tribe_index != *(char *)(param_1 + 0x2f)) {
    uVar4 = 1;
  }
  return uVar4;
}
