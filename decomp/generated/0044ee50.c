/* Ghidra 12.1.3 pseudocode; entry 0044ee50; FUN_0044ee50.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


bool FUN_0044ee50(int param_1,uint param_2,byte param_3,byte param_4,undefined4 param_5,char param_6
                 )

{
  undefined1 uVar1;
  ushort uVar2;
  unit_struct *puVar3;
  uint uVar4;
  bool bVar5;
  int iVar6;
  int iVar7;
  unit_type_scenery *puVar8;
  bool bVar9;
  char cVar10;
  char cVar11;
  char cVar12;
  char cVar13;
  ushort uVar14;
  uint uVar15;
  int iVar16;
  int iVar17;
  int iVar18;
  int iVar19;
  char cStack_8;
  char cStack_7;
  char cStack_6;
  char cStack_5;
  undefined1 uStack_4;
  undefined1 uStack_3;

  cVar10 = cStack_7;
  cVar13 = cStack_8;
  uVar15 = (param_2 & 0xfe) * 2 | param_2 & 0xfe00;
  uVar1 = *(undefined1 *)(param_1 + 0xc22);
  iVar16 = uVar15 * 4;
  bVar5 = false;
  uStack_4 = (undefined1)iVar16;
  uStack_3 = (undefined1)((uint)iVar16 >> 8);
  if ((*(byte *)(&game_state.level_data[0].flags + uVar15) & 2) != 0) {
    for (puVar3 = unit_land_array[(short)(&game_state.level_data[0].unit_index)[uVar15 * 2]];
        puVar3 != (unit_struct *)0x0; puVar3 = unit_land_array[puVar3->next_unit_index]) {
      if ((puVar3->unit_class == '\x05') &&
         (puVar8 = unit_type_array_scenery + (byte)puVar3->unit_type, uVar4._0_1_ = puVar8->flags_1,
         uVar4._1_1_ = puVar8->flags, uVar4._2_1_ = puVar8->field14_0x16,
         uVar4._3_1_ = puVar8->field15_0x17, (uVar4 & 0x200000) != 0)) {
        bVar5 = true;
        break;
      }
    }
  }
  if (bVar5) {
    *(uint *)(param_1 + 0x93d) = *(uint *)(param_1 + 0x93d) | 0x20000000;
  }
  else {
    uVar4 = (&game_state.level_data[0].flags)[uVar15];
    if ((uVar4 & 0x4010000) == 0) {
      if ((((((byte)land_flags_1 & 8) == 0) && (*(char *)(param_1 + 0xc1f) != '\x01')) &&
          (((byte)level_flags & 4) != 0)) && ((uVar4 & 8) == 0)) {
        *(uint *)(param_1 + 0x93d) = *(uint *)(param_1 + 0x93d) | 0x40000000;
        return false;
      }
      uVar2 = (&game_state.level_data[0].unit_index_2)[uVar15 * 2];
      uVar14 = uVar2 & 0x3ff;
      if (((uVar14 != 0) && ((ushort)param_5 != uVar14)) &&
         (((uVar4 & 0x400) == 0 ||
          (cVar12 = FUN_004baaf0(unit_land_array[uVar2 & 0x3ff],
                                 CONCAT13(cStack_6,CONCAT12(cStack_7,CONCAT11(cStack_8,uVar1)))),
          cVar12 == '\0')))) {
        *(uint *)(param_1 + 0x93d) = *(uint *)(param_1 + 0x93d) | 0x800000;
        return false;
      }
      if (param_4 == 10) {
        FUN_0044f600(param_2);
        return false;
      }
      cStack_8 = (char)param_2;
      cVar12 = cStack_8;
      cStack_7 = (char)(param_2 >> 8);
      cVar11 = cStack_7;
      if (param_6 == '\0') {
        iVar19 = FUN_0044f600(param_2);
        if ((unit_type_array_building[param_4].field_0x49 & 2) == 0) {
          iVar17 = DAT_005aa458 - iVar19;
          iVar18 = DAT_005aa458;
        }
        else {
          iVar17 = DAT_005aa45c - iVar19;
          iVar18 = DAT_005aa45c;
        }
        bVar5 = SBORROW4(iVar18,iVar19) != iVar17 < 0;
        cStack_8 = cVar13;
        cStack_7 = cVar10;
      }
      else {
        bVar5 = false;
        iVar19 = 3;
        cStack_8 = cStack_8 + -2;
        cStack_7 = cStack_7 + -2;
        cStack_5 = cStack_7;
        do {
          if (bVar5) break;
          iVar18 = 3;
          cStack_6 = cStack_8;
          do {
            if (bVar5) break;
            iVar17 = FUN_0044f600(CONCAT13(uStack_3,CONCAT12(uStack_4,CONCAT11(cStack_5,cStack_6))))
            ;
            if ((unit_type_array_building[param_4].field_0x49 & 2) == 0) {
              iVar7 = DAT_005aa458 - iVar17;
              iVar6 = DAT_005aa458;
            }
            else {
              iVar7 = DAT_005aa45c - iVar17;
              iVar6 = DAT_005aa45c;
            }
            if (SBORROW4(iVar6,iVar17) != iVar7 < 0) {
              bVar5 = true;
            }
            cStack_6 = cStack_6 + '\x02';
            iVar18 = iVar18 + -1;
          } while (iVar18 != 0);
          iVar19 = iVar19 + -1;
          cStack_5 = cStack_5 + '\x02';
        } while (iVar19 != 0);
      }
      bVar5 = !bVar5;
      if (!bVar5) {
        *(uint *)(param_1 + 0x93d) = *(uint *)(param_1 + 0x93d) | 0x10000000;
        return false;
      }
      cVar13 = FUN_0044f220(param_2,param_5,
                            CONCAT13(bVar5,CONCAT12(cStack_7,CONCAT11(cStack_8,uVar1))));
      if (cVar13 == '\0') {
        *(uint *)(param_1 + 0x93d) = *(uint *)(param_1 + 0x93d) | 0x800000;
        return false;
      }
      if ((param_3 & 0xf8) != 0) {
        if (param_4 < 0xd) {
          return bVar5;
        }
        if (0xe < param_4) {
          return bVar5;
        }
        if ((param_3 & 8) == 0) {
          return bVar5;
        }
        if ((*(byte *)(landscape_height_array + ((&game_state.level_data[0].c_3)[iVar16] & 0xf)) & 1
            ) == 0) {
          return false;
        }
        cVar13 = FUN_0044ebe0(param_2,2);
        if (cVar13 == '\0') {
          return false;
        }
        return bVar5;
      }
      bVar9 = true;
      iVar16 = 3;
      cStack_7 = cVar11 + -2;
      do {
        if (!bVar9) goto LAB_0044f1b1;
        iVar19 = 3;
        cStack_8 = cVar12 + -2;
        do {
          if (!bVar9) break;
          if ((*(byte *)(landscape_height_array +
                        ((&game_state.level_data[0].c_3)
                         [((CONCAT11(cStack_7,cStack_8) & 0xfe) * 2 |
                          CONCAT11(cStack_7,cStack_8) & 0xfe00) * 4] & 0xf)) & 1) == 0) {
            bVar9 = false;
          }
          iVar19 = iVar19 + -1;
          cStack_8 = cStack_8 + '\x02';
        } while (iVar19 != 0);
        iVar16 = iVar16 + -1;
        cStack_7 = cStack_7 + '\x02';
      } while (iVar16 != 0);
      if (bVar9) {
        return bVar5;
      }
LAB_0044f1b1:
      *(uint *)(param_1 + 0x93d) = *(uint *)(param_1 + 0x93d) | 0x1000000;
      return false;
    }
  }
  if ((*(byte *)((int)&game_state.level_data[0].flags + iVar16 + 2) & 1) != 0) {
    *(uint *)(param_1 + 0x93d) = *(uint *)(param_1 + 0x93d) | 0x4000000;
  }
  if ((*(byte *)((int)&game_state.level_data[0].flags + iVar16 + 3) & 4) != 0) {
    *(uint *)(param_1 + 0x93d) = *(uint *)(param_1 + 0x93d) | 0x8000000;
  }
  return false;
}
