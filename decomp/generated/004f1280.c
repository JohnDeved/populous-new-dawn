/* Ghidra 12.1.3 pseudocode; entry 004f1280; can_show_unit_icon.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


undefined4 can_show_unit_icon(int param_1,byte *param_2)

{
  unit_struct *puVar1;
  unit_struct *puVar2;
  ushort *puVar3;
  unit_struct *puVar4;
  int iVar5;

  if (player_tribe_num != *(byte *)(param_1 + 0x2f)) {
    if ((((byte)level_flags & 4) != 0) && ((*param_2 & 8) == 0)) {
      return 0;
    }
    if ((1 << (*(byte *)(param_1 + 0x2f) & 0x1f) & (uint)param_2[0xf]) != 0) {
      return 0;
    }
    if ((*(char *)(param_1 + 0x2a) == '\x01') && (*(ushort *)(param_1 + 0x9f) != 0)) {
      puVar1 = unit_land_array[*(ushort *)(param_1 + 0x9f)];
      puVar2 = (unit_struct *)0x0;
      if (((*(byte *)&puVar1->flags_2 & 1) == 0) && (puVar1->unit_class != '\0')) {
        puVar2 = puVar1;
      }
      if (puVar2 != (unit_struct *)0x0) {
        iVar5 = 0;
        if ('\0' < (char)unit_type_array_vehicle[(byte)puVar2->unit_type].field_0x8) {
          puVar3 = &puVar2->loc_1_x;
          do {
            if (*puVar3 != 0) {
              puVar1 = unit_land_array[*puVar3];
              puVar4 = (unit_struct *)0x0;
              if (((puVar1->flags_2 & 1) == 0) && (puVar1->unit_class != '\0')) {
                puVar4 = puVar1;
              }
              if ((puVar4 != (unit_struct *)0x0) && (puVar4->unit_type == '\x05')) {
                return 0;
              }
            }
            puVar3 = puVar3 + 1;
            iVar5 = iVar5 + 1;
          } while (iVar5 < (char)unit_type_array_vehicle[(byte)puVar2->unit_type].field_0x8);
        }
      }
    }
  }
  return 1;
}
