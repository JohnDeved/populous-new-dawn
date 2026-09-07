/* Ghidra 12.1.3 pseudocode; entry 004c6760; FUN_004c6760.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_004c6760(int param_1)

{
  int *piVar1;
  byte bVar2;
  unit_struct *puVar3;
  bool bVar4;
  ushort *puVar5;
  int iVar6;
  int iVar7;
  unit_struct *puVar8;
  unit_struct *puVar9;
  int iVar10;
  unit_struct *local_8;

  if (((*(char *)(param_1 + 0xc22) + game_state.offset_counter_2 + 3U & 0x3f) != 0) ||
     (iVar6 = *(int *)(param_1 + 0x885), iVar10 = iVar6, iVar6 == 0)) {
    return;
  }
  do {
    if ((*(char *)(iVar10 + 0x2c) == '\x02') && (*(char *)(iVar10 + 0xa6) != '\0')) {
      bVar2 = *(byte *)(iVar10 + 0x2b);
      if (bVar2 != 0) {
        if (bVar2 < 3) {
          if (*(short *)&unit_type_array_building[bVar2].field_0x36 <= *(short *)(iVar10 + 0xa0)) {
            iVar7 = 0;
            puVar5 = (ushort *)(iVar10 + 0x86);
            bVar4 = true;
            local_8 = (unit_struct *)0x0;
            do {
              puVar9 = (unit_struct *)0x0;
              if (((*puVar5 != 0) &&
                  (puVar8 = unit_land_array[*puVar5], (*(byte *)&puVar8->flags_2 & 1) == 0)) &&
                 (puVar8->unit_class != '\0')) {
                puVar9 = puVar8;
              }
              puVar8 = local_8;
              if ((puVar9 != (unit_struct *)0x0) && (puVar8 = puVar9, puVar9->unit_type == '\x02'))
              {
                bVar4 = false;
                break;
              }
              local_8 = puVar8;
              puVar5 = puVar5 + 1;
              iVar7 = iVar7 + 1;
            } while (iVar7 < 6);
            if ((bVar4) && (local_8 != (unit_struct *)0x0)) {
              if (iVar6 == 0) {
                return;
              }
              while ((((bVar2 = *(byte *)(iVar6 + 0x2b), bVar2 != 1 && (bVar2 != 2)) ||
                      (*(char *)(iVar6 + 0x2c) != '\x02')) ||
                     ((*(short *)&unit_type_array_building[bVar2].field_0x36 <=
                       *(short *)(iVar6 + 0xa0) ||
                      ((int)(uint)(byte)unit_type_array_building[bVar2].field31_0x20 <=
                       (int)*(char *)(iVar6 + 0xa6)))))) {
                iVar6 = *(int *)(iVar6 + 8);
                if (iVar6 == 0) {
                  return;
                }
              }
              FUN_0043b180(local_8,iVar6);
              local_8->flags_3 = local_8->flags_3 | 1;
              return;
            }
          }
        }
        else if (bVar2 == 3) {
          iVar7 = 0;
          puVar5 = (ushort *)(iVar10 + 0x86);
          do {
            puVar9 = (unit_struct *)0x0;
            if (((*puVar5 != 0) &&
                (puVar8 = unit_land_array[*puVar5], (*(byte *)&puVar8->flags_2 & 1) == 0)) &&
               (puVar8->unit_class != '\0')) {
              puVar9 = puVar8;
            }
            if ((puVar9 != (unit_struct *)0x0) && (puVar9->state != '\x0e')) {
              if (iVar6 == 0) {
                return;
              }
              goto LAB_004c6925;
            }
            puVar5 = puVar5 + 1;
            iVar7 = iVar7 + 1;
          } while (iVar7 < 6);
        }
      }
    }
    piVar1 = (int *)(iVar10 + 8);
    iVar10 = *piVar1;
    if (*piVar1 == 0) {
      return;
    }
  } while( true );
LAB_004c6925:
  bVar2 = *(byte *)(iVar6 + 0x2b);
  if (((bVar2 == 1) || (bVar2 == 2)) && (*(char *)(iVar6 + 0x2c) == '\x02')) {
    if ((int)*(char *)(iVar6 + 0xa6) < (int)(uint)(byte)unit_type_array_building[bVar2].field31_0x20
       ) {
      FUN_0043b180(puVar9,iVar6);
      puVar9->flags_3 = puVar9->flags_3 | 1;
      return;
    }
    if (puVar9->unit_type == '\x02') {
      iVar7 = 0;
      puVar5 = (ushort *)(iVar6 + 0x86);
      bVar4 = true;
      local_8 = (unit_struct *)0x0;
      do {
        puVar8 = (unit_struct *)0x0;
        if (((*puVar5 != 0) &&
            (puVar3 = unit_land_array[*puVar5], (*(byte *)&puVar3->flags_2 & 1) == 0)) &&
           (puVar3->unit_class != '\0')) {
          puVar8 = puVar3;
        }
        puVar3 = local_8;
        if ((puVar8 != (unit_struct *)0x0) && (puVar3 = puVar8, puVar8->unit_type == '\x02')) {
          bVar4 = false;
          break;
        }
        local_8 = puVar3;
        puVar5 = puVar5 + 1;
        iVar7 = iVar7 + 1;
      } while (iVar7 < 6);
      if (bVar4) {
        FUN_0043b180(puVar9,iVar6);
        puVar9->flags_3 = puVar9->flags_3 | 1;
        if (local_8 == (unit_struct *)0x0) {
          return;
        }
        FUN_0043b180(local_8,iVar10);
        local_8->flags_3 = local_8->flags_3 | 1;
        return;
      }
    }
  }
  iVar6 = *(int *)(iVar6 + 8);
  if (iVar6 == 0) {
    return;
  }
  goto LAB_004c6925;
}
