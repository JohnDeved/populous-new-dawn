/* Ghidra 12.1.3 pseudocode; entry 0047ae00; FUN_0047ae00.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

char FUN_0047ae00(char param_1,undefined4 param_2)

{
  unit_struct *puVar1;
  uint uVar2;
  bool bVar3;
  char cVar4;
  ushort uVar5;
  uint uVar6;
  int iVar7;
  unit_struct *puVar8;
  short local_6;
  undefined1 local_4 [4];

  cVar4 = '\0';
  if (param_1 == '\0') {
    if ((-1 < DAT_0089ce51) && (iVar7 = (int)DAT_0089ce51, (&DAT_00895fba)[iVar7 * 0x9e] == '\x01'))
    {
      (&DAT_00895fbf)[iVar7 * 0x4f] = (&DAT_00895fd5)[iVar7 * 0x4f];
    }
    return '\0';
  }
  puVar8 = (unit_struct *)0x0;
  if (((unit_index_1 != 0) &&
      (puVar1 = unit_land_array[unit_index_1], (*(byte *)&puVar1->flags_2 & 1) == 0)) &&
     (puVar1->unit_class != '\0')) {
    puVar8 = puVar1;
  }
  if (puVar8 != (unit_struct *)0x0) {
    cVar4 = FUN_0047b1d0(puVar8,&local_6,param_2);
  }
  if (cVar4 == '\0') {
    puVar8 = (unit_struct *)0x0;
    if (((unit_index_2 != 0) &&
        (puVar1 = unit_land_array[unit_index_2], (*(byte *)&puVar1->flags_2 & 1) == 0)) &&
       (puVar1->unit_class != '\0')) {
      puVar8 = puVar1;
    }
    if (puVar8 != (unit_struct *)0x0) {
      cVar4 = FUN_0047b1d0(puVar8,&local_6,param_2);
    }
    if (cVar4 != '\0') goto LAB_0047b149;
    if ((globe_update_flags & 1) != 0) {
      uVar6 = (_minimap_centre_x & 0xfe) * 2 | _minimap_centre_x & 0xfe00;
      uVar2 = (&game_state.level_data[0].flags)[uVar6];
      if (((uVar2 & 0x400) == 0) ||
         ((uint)((&game_state.level_data[0].c_2)[uVar6 * 4] & 0xf) - (int)player_tribe_num != 1)) {
        if ((uVar2 & 0x200) != 0) {
          puVar8 = (unit_struct *)0x0;
          uVar5 = (&game_state.level_data[0].unit_index_2)[uVar6 * 2] & 0x3ff;
          if (((uVar5 != 0) &&
              (puVar1 = unit_land_array[uVar5], (*(byte *)&puVar1->flags_2 & 1) == 0)) &&
             (puVar1->unit_class != '\0')) {
            puVar8 = puVar1;
          }
          if (puVar8 != (unit_struct *)0x0) {
            iVar7 = FUN_0040b9c0(puVar8,(int)player_tribe_num);
            if (iVar7 == 0) {
              if (((puVar8->unit_type == '\x04') && (puVar8->tribe_index != player_tribe_num)) &&
                 (puVar8->state == '\x02')) {
                cVar4 = FUN_00504060(puVar8,&local_6);
              }
              else if ((player_tribe_num == puVar8->tribe_index) || (puVar8->unit_type == '\x13')) {
                bVar3 = false;
                if (puVar8->state == '\x01') {
                  cVar4 = FUN_00504060(unit_land_array[(short)puVar8->loc_2_y],&local_6);
                  if ((char)param_2 != '\0') {
                    FUN_004afff0(0,puVar8->unit_index);
                  }
                }
                else {
                  if (puVar8->state == '\x06') {
                    if (puVar8->loc_2_y != 0) {
                      cVar4 = FUN_00504060(unit_land_array[(short)puVar8->loc_2_y],&local_6);
                      if ((char)param_2 != '\0') {
                        FUN_004afff0(0,puVar8->unit_index);
                      }
                      goto LAB_0047b0c4;
                    }
                  }
                  bVar3 = true;
                }
LAB_0047b0c4:
                if ((bVar3) && (puVar8->unit_type != '\n')) {
                  cVar4 = FUN_00504060(puVar8,&local_6);
                  if ((char)param_2 != '\0') {
                    FUN_004afff0(0,puVar8->unit_index);
                  }
                }
              }
              else if (puVar8->tribe_index == -1) {
                cVar4 = FUN_00504060(puVar8,&local_6);
                if ((char)param_2 != '\0') {
                  FUN_004afff0(0,puVar8->unit_index);
                }
              }
            }
            else {
              cVar4 = FUN_00504060(puVar8,&local_6);
              if ((char)param_2 != '\0') {
                FUN_004afff0(0,puVar8->unit_index);
              }
            }
          }
        }
      }
      else {
        puVar8 = unit_land_array
                 [(ushort)(&game_state.level_data[0].unit_index_2)[uVar6 * 2] & 0x3ff];
        cVar4 = FUN_00504060(puVar8,&local_6);
        FUN_004ba130(puVar8,local_4);
        if ((char)param_2 != '\0') {
          FUN_004afff0(local_4,0);
        }
      }
      if (cVar4 != '\0') goto LAB_0047b149;
      iVar7 = FUN_0049a220(_minimap_centre_x,(int)player_tribe_num);
      if ((iVar7 != 0) && (cVar4 = FUN_00504060(iVar7,&local_6), (char)param_2 != '\0')) {
        FUN_004afff0(iVar7 + 0x3d,0);
      }
    }
  }
  if (cVar4 == '\0') {
    DAT_0089ce51 = 0xffff;
    DAT_0089c6cd = 0;
    return '\0';
  }
LAB_0047b149:
  DAT_0089ce51 = local_6;
  DAT_0089c6cd = (&DAT_00895fc5)[local_6 * 0x4f];
  return cVar4;
}
