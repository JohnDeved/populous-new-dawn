/* Ghidra 12.1.3 pseudocode; entry 004a8440; FUN_004a8440.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


bool FUN_004a8440(short *param_1)

{
  unit_struct *puVar1;
  bool bVar2;
  undefined4 uVar3;
  char cVar4;
  char cVar5;
  byte bVar6;
  byte bVar7;
  uint uVar8;
  undefined2 local_1a;
  undefined2 local_16;
  short local_10;
  short sStack_e;
  undefined2 local_c;
  undefined4 local_8;
  undefined4 local_4;

  bVar2 = false;
  cVar4 = get_empty_indexed_xy(2,0,0,0x10);
  if (cVar4 != '\0') {
    local_1a = CONCAT11((char)((ushort)param_1[1] >> 8),(char)((ushort)*param_1 >> 8)) & 0xfefe;
    cVar5 = get_indexed_xy(cVar4,&local_4,&local_8);
    while (cVar5 != '\0') {
      bVar6 = (char)local_4 * '\x02' + (char)local_1a;
      bVar7 = (char)local_8 * '\x02' + local_1a._1_1_;
      local_16 = CONCAT11(bVar7,bVar6);
      uVar8 = (local_16 & 0xfe) * 2 | local_16 & 0xfe00;
      if (((*(byte *)(landscape_height_array + ((&game_state.level_data[0].c_3)[uVar8 * 4] & 0xf)) &
           1) != 0) && (((&game_state.level_data[0].flags)[uVar8] & 0x10606) == 0)) {
        bVar2 = true;
        for (puVar1 = unit_land_array[(short)(&game_state.level_data[0].unit_index)[uVar8 * 2]];
            puVar1 != (unit_struct *)0x0; puVar1 = unit_land_array[puVar1->next_unit_index]) {
          if (!bVar2) goto LAB_004a85eb;
          if (puVar1->unit_class == '\x05') {
            if (puVar1->unit_type != '\x11') goto LAB_004a8572;
          }
          else if (((puVar1->unit_class == '\n') && ((land_flags_1 & 8) == 0)) &&
                  (puVar1->unit_type == '\x10')) {
LAB_004a8572:
            bVar2 = false;
          }
        }
        if (bVar2 != false) {
          local_10 = (bVar6 + 1) * 0x100;
          uVar3 = CONCAT22(sStack_e,local_10);
          sStack_e = (bVar7 + 1) * 0x100;
          local_c = calc_point_height(uVar3,CONCAT22(local_c,sStack_e));
          cVar5 = FUN_00518200(&local_10,0);
          if (cVar5 == '\0') {
            *param_1 = (ushort)bVar6 << 8;
            param_1[1] = (ushort)bVar7 << 8;
            break;
          }
          bVar2 = false;
        }
      }
LAB_004a85eb:
      cVar5 = get_indexed_xy(cVar4,&local_4,&local_8);
    }
    clear_indexed_xy(cVar4);
  }
  return bVar2;
}
