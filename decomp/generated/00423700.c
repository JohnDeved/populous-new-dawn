/* Ghidra 12.1.3 pseudocode; entry 00423700; alloc_pnts_related_item.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


short alloc_pnts_related_item(short *param_1,char param_2,uint param_3)

{
  bool bVar1;
  bool bVar2;
  short sVar3;
  int iVar4;
  pnts_related_struct *ppVar5;
  uint uVar6;
  uint uVar7;
  uint uVar8;
  undefined2 local_8;
  short local_6;
  char local_4;

  bVar1 = false;
  local_6 = 0;
  uVar7 = (uint)*param_1;
  uVar8 = (uint)param_1[1];
  if (param_2 == '\0') {
    bVar2 = false;
    if (((char)*param_1 == '\0') && (local_4 = (char)param_1[1], local_4 == '\0')) {
      if (((uVar7 & 0x1ff) == 0) && ((uVar8 & 0x1ff) == 0)) {
        bVar1 = true;
      }
      else if (((uVar7 + 0x100 & 0x1ff) == 0) && ((uVar8 + 0x100 & 0x1ff) == 0)) {
        bVar2 = true;
      }
    }
    if ((bVar1) || (bVar2)) {
      iVar4 = 0;
      ppVar5 = temp_pnts_related_array;
      if (0 < temp_pnts_related_counter_1) {
        do {
          ppVar5 = ppVar5 + 1;
          if ((ppVar5->x == uVar7) && (ppVar5->z == uVar8)) {
            local_6 = (short)iVar4 + 1;
            *(uint *)&ppVar5->field_0x18 = *(uint *)&ppVar5->field_0x18 | param_3;
            break;
          }
          iVar4 = iVar4 + 1;
        } while (iVar4 < temp_pnts_related_counter_1);
      }
    }
  }
  if (local_6 == 0) {
    local_6 = 0;
    if (temp_pnts_related_counter_1 < 0x7ce) {
      temp_pnts_related_counter_1 = temp_pnts_related_counter_1 + 1;
      local_6 = (short)temp_pnts_related_counter_1;
    }
    if (local_6 != 0) {
      if (param_2 == '\0') {
        sVar3 = calc_point_height(uVar7,uVar8);
        uVar6 = (int)sVar3;
      }
      else if (param_2 == '\x01') {
        local_8 = CONCAT11((char)((ushort)param_1[1] >> 8),(char)((ushort)*param_1 >> 8));
        uVar6 = (int)(short)(&game_state.level_data[0].height)
                            [((local_8 & 0xfe) * 2 | local_8 & 0xfe00) * 2];
      }
      else {
        uVar6 = uVar8;
        if (param_2 == '\x02') {
          sVar3 = calc_point_height(uVar7,uVar8);
          uVar6 = (int)sVar3;
        }
      }
      local_8 = CONCAT11((char)((ushort)param_1[1] >> 8),(char)((ushort)*param_1 >> 8));
      temp_pnts_related_array[local_6].x = uVar7;
      temp_pnts_related_array[local_6].y = uVar6;
      temp_pnts_related_array[local_6].z = uVar8;
      temp_pnts_related_array[local_6].maybe_color = 0x20;
      *(uint *)&temp_pnts_related_array[local_6].field_0x18 = param_3;
      if ((*(byte *)(landscape_height_array +
                    ((&game_state.level_data[0].c_3)[((local_8 & 0xfe) * 2 | local_8 & 0xfe00) * 4]
                    & 0xf)) & 1) == 0) {
        *(uint *)&temp_pnts_related_array[local_6].field_0x18 = param_3 | 0x80;
      }
    }
  }
  return local_6;
}
