/* Ghidra 12.1.3 pseudocode; entry 00407150; FUN_00407150.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


undefined1 FUN_00407150(int param_1,int param_2)

{
  byte bVar1;
  short sVar2;
  unit_struct *puVar3;
  bool bVar4;
  ushort *puVar5;
  uint uVar6;
  int iVar7;
  unit_struct *puVar8;
  ushort *puVar9;
  undefined1 local_11;
  uint local_10;
  int local_c;
  int local_8;
  int local_4;

  bVar4 = true;
  local_11 = 0;
  bVar1 = *(byte *)(param_2 + 0x2b);
  if (((*(char *)(param_1 + 0x2f) == *(char *)(param_2 + 0x2f)) ||
      ((unit_type_array_building[bVar1].field_0x4a & 0x10) != 0)) &&
     ((*(byte *)(param_2 + 0x9c) & 8) != 0)) {
    if ((int)(uint)(byte)unit_type_array_building[bVar1].field31_0x20 <=
        (int)*(char *)(param_2 + 0xa6)) {
      if (*(char *)(param_1 + 0x2b) == '\a') {
        remove_person_from_hut(param_2,0);
      }
      else {
        bVar4 = false;
      }
    }
    if (bVar4) {
      iVar7 = 0;
      puVar9 = (ushort *)(param_2 + 0x86);
      puVar5 = puVar9;
      do {
        if (*puVar5 == 0) break;
        puVar5 = puVar5 + 1;
        iVar7 = iVar7 + 1;
      } while (iVar7 < 6);
      if (iVar7 < 6) {
        local_11 = 1;
        uVar6 = *(uint *)&unit_type_array_building[bVar1].field_0x48;
        if ((uVar6 & 0x40) == 0) {
          uVar6 = (uint)(((uVar6 & 1) == 0) - 1U & 3);
        }
        else {
          uVar6 = CONCAT31((int3)(uVar6 >> 8),3);
        }
        *(char *)(param_2 + 0xa6) = *(char *)(param_2 + 0xa6) + '\x01';
        *(undefined2 *)(param_2 + 0x86 + iVar7 * 2) = *(undefined2 *)(param_1 + 0x24);
        FUN_004d80e0(param_1,uVar6);
        if (*(char *)(param_2 + 0x2b) == '\x04') {
          game_state._858454_1_ =
               game_state._858454_1_ | '\x01' << (*(byte *)(param_2 + 0x2f) & 0x1f);
        }
        uVar6 = (uint)*(byte *)(param_2 + 0x2b);
        local_c = uVar6 * 0x4c;
        if ((unit_type_array_building[uVar6].field_0x48 & 1) != 0) {
          *(uint *)(param_2 + 0x14) = *(uint *)(param_2 + 0x14) & 0xffffefff;
          *(undefined2 *)(param_2 + 0x9a) = 0;
          local_4 = 0;
          local_8 = 0;
          if (*(char *)(param_2 + 0xa6) != '\0') {
            if (unit_type_array_building[uVar6].field31_0x20 != 0) {
              local_10 = (uint)(byte)unit_type_array_building[uVar6].field31_0x20;
              puVar5 = puVar9;
              do {
                puVar8 = (unit_struct *)0x0;
                if (((*puVar5 != 0) &&
                    (puVar3 = unit_land_array[*puVar5], (*(byte *)&puVar3->flags_2 & 1) == 0)) &&
                   (puVar3->unit_class != '\0')) {
                  puVar8 = puVar3;
                }
                if ((puVar8 != (unit_struct *)0x0) &&
                   (unit_type_array_building[uVar6].unit_type1 != puVar8->unit_type)) {
                  local_8 = local_8 + (short)unit_type_array_person[(byte)puVar8->unit_type].conv;
                }
                puVar5 = puVar5 + 1;
                local_10 = local_10 - 1;
              } while (local_10 != 0);
            }
            if ((short)unit_type_array_person[(byte)unit_type_array_building[uVar6].unit_type1].conv
                <= local_8) {
              local_4 = local_8;
            }
          }
          if (local_4 == 0) {
            iVar7 = 0;
            *(ushort *)(param_2 + 0x9c) = *(ushort *)(param_2 + 0x9c) & 0xff7f;
            if (unit_type_array_building[uVar6].field31_0x20 != '\0') {
              do {
                puVar8 = (unit_struct *)0x0;
                if (((*puVar9 != 0) &&
                    (puVar3 = unit_land_array[*puVar9], (puVar3->flags_2 & 1) == 0)) &&
                   (puVar3->unit_class != '\0')) {
                  puVar8 = puVar3;
                }
                if ((puVar8 != (unit_struct *)0x0) &&
                   (puVar8->tribe_index == *(char *)(param_2 + 0x2f))) {
                  puVar8->obj_index_anim_prev_2 = puVar8->obj_index_anim_prev_2 & 0xfffb;
                }
                puVar9 = puVar9 + 1;
                iVar7 = iVar7 + 1;
              } while (iVar7 < (int)(uint)(byte)unit_type_array_building[*(byte *)(param_2 + 0x2b)].
                                                field31_0x20);
            }
          }
          else {
            *(byte *)(param_2 + 0x9c) = *(byte *)(param_2 + 0x9c) | 0x80;
            local_10 = 0;
            sVar2 = unit_type_array_person[(byte)unit_type_array_building[uVar6].unit_type1].conv;
            iVar7 = FUN_00408d20(param_2);
            FUN_0041b0c0(param_2,&local_10,unit_type_array_building[uVar6].unit_type1,
                         iVar7 / (int)sVar2);
            if (0xffff < (int)local_10) {
              local_10 = 0xffff;
            }
            iVar7 = 0;
            *(short *)(param_2 + 0x96) = (short)local_10;
            if (unit_type_array_building[*(byte *)(param_2 + 0x2b)].field31_0x20 != '\0') {
              do {
                puVar8 = (unit_struct *)0x0;
                if (((*puVar9 != 0) &&
                    (puVar3 = unit_land_array[*puVar9], (puVar3->flags_2 & 1) == 0)) &&
                   (puVar3->unit_class != '\0')) {
                  puVar8 = puVar3;
                }
                if ((puVar8 != (unit_struct *)0x0) &&
                   (puVar8->tribe_index == *(char *)(param_2 + 0x2f))) {
                  *(byte *)&puVar8->obj_index_anim_prev_2 = (byte)puVar8->obj_index_anim_prev_2 | 4;
                }
                puVar9 = puVar9 + 1;
                iVar7 = iVar7 + 1;
              } while (iVar7 < (int)(uint)(byte)unit_type_array_building[*(byte *)(param_2 + 0x2b)].
                                                field31_0x20);
            }
          }
        }
        FUN_0040c4e0(param_2);
        *(ushort *)(param_2 + 0x9c) = *(ushort *)(param_2 + 0x9c) & 0xfbff;
        *(undefined2 *)(param_1 + 0x83) = 0;
      }
    }
  }
  return local_11;
}
