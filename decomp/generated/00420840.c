/* Ghidra 12.1.3 pseudocode; entry 00420840; FUN_00420840.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

undefined4
FUN_00420840(undefined4 param_1,int param_2,ushort *param_3,ushort *param_4,int param_5,char param_6
            )

{
  ushort *puVar1;
  bool bVar2;
  bool bVar3;
  bool bVar4;
  byte bVar5;
  bool bVar6;
  uint uVar7;
  int iVar8;
  undefined3 extraout_var;
  undefined3 uVar10;
  int *piVar9;
  int *piVar11;
  int iVar12;
  int *piVar13;
  bool bVar14;
  undefined4 local_10;
  uint local_8;
  uint local_4;

  local_4 = 2;
  bVar14 = true;
  bVar3 = false;
  bVar6 = false;
  local_8 = 0;
  *(uint *)(param_2 + 0x10) = *(uint *)(param_2 + 0x10) & 0xfbffffff;
  bVar2 = true;
  uVar7 = (*param_3 & 0xfe) * 2 | *param_3 & 0xfe00;
  if (((*(byte *)(landscape_height_array + ((&game_state.level_data[0].c_3)[uVar7 * 4] & 0xf)) & 1)
       == 0) && (iVar8 = FUN_004665c0(uVar7 * 4 + 0x8a03e4), iVar8 != 0)) {
    *(char *)(param_3 + 1) = '\x01';
    DAT_0064f4a4 = iVar8;
  }
  else {
    *(char *)(param_3 + 1) = '\0';
  }
  puVar1 = param_4 + 1;
  if ((*(byte *)(landscape_height_array +
                ((&game_state.level_data[0].c_3)[((*param_4 & 0xfe) * 2 | *param_4 & 0xfe00) * 4] &
                0xf)) & 1) == 0) {
    *(char *)puVar1 = '\x01';
  }
  else {
    *(char *)puVar1 = '\0';
  }
  game_state._756320_1_ = 0;
  game_state._755288_2_ = param_3[0];
  game_state._755290_2_ = param_3[1];
  game_state._755292_2_ = param_4[0];
  game_state._755294_2_ = param_4[1];
  if (((char)*param_3 == (char)*param_4) &&
     (*(char *)((int)param_4 + 1) == *(char *)((int)param_3 + 1))) {
    local_10 = 0;
  }
  else {
    if ((*(short *)(param_2 + 0x9f) == 0) || (bVar4 = true, (*(byte *)(param_2 + 0x13) & 2) != 0)) {
      bVar4 = false;
    }
    if (((!bVar4) && (bVar14 = param_6 != '\0', (char)*puVar1 != '\0')) &&
       ((*(byte *)(landscape_height_array +
                  ((&game_state.level_data[0].c_3)[((*param_4 & 0xfe) * 2 | *param_4 & 0xfe00) * 4]
                  & 0xf)) & 2) != 0)) {
      bVar2 = false;
    }
    if (bVar2) {
      if (((DAT_0089bc7e == 0) || (!bVar14)) ||
         ((*(byte *)(landscape_height_array +
                    ((&game_state.level_data[0].c_3)
                     [((*param_4 & 0xfe) * 2 | *param_4 & 0xfe00) * 4] & 0xf)) & 1) != 0)) {
        local_8 = 1;
      }
      if (((param_5 != 0) && (DAT_0089bc7e != 0)) && (bVar14)) {
        local_8 = 4;
        local_4 = 5;
      }
      DAT_0064f480 = DAT_0064f480 + 1;
      game_state._755258_2_ = SUB42(land_const_1,0);
      game_state._755280_4_ = param_2;
      bVar5 = DAT_0089ce5e;
      if (game_state.tribes_array[*(char *)(param_2 + 0x2f)].field_0xc1f == '\x01') {
        bVar5 = DAT_0089ce5c;
      }
      game_state._755270_2_ = ZEXT12(bVar5);
      game_state._755277_1_ = bVar14;
      FUN_00420dd0(0x9557d0);
      DAT_006513d6 = '\0';
      uVar10 = extraout_var;
      if ('\0' < DAT_006513d5) {
        do {
          iVar8 = FUN_00420f80(0x9557d0,CONCAT31(uVar10,DAT_006513d6));
          bVar2 = local_8 < local_4;
          uVar7 = local_8;
          while (bVar2) {
            if (uVar7 == 0) {
              game_state._755278_1_ = 0xff;
            }
            else if (uVar7 == 1) {
              game_state._755278_1_ = 0;
            }
            else if (uVar7 == 4) {
              game_state._755278_1_ = (undefined1)param_5;
            }
            iVar12 = 0;
            do {
              if (iVar12 == 0) {
                game_state._841980_4_ = 0x96caba;
              }
              else if (iVar12 == 1) {
                game_state._841980_4_ = 0x96aaba;
              }
              iVar8 = FUN_00421130();
              if (iVar8 == 0) {
                bVar3 = true;
              }
              else if (iVar8 == 2) {
                bVar6 = true;
              }
              if (bVar3) goto LAB_00420ba3;
              iVar12 = iVar12 + 1;
            } while (iVar12 < 2);
            if (bVar6) break;
            uVar7 = uVar7 + 1;
            bVar2 = (int)uVar7 < (int)local_4;
          }
LAB_00420ba3:
          if (bVar3) goto LAB_00420bca;
          DAT_006513d6 = DAT_006513d6 + '\x01';
          uVar10 = (undefined3)((uint)iVar8 >> 8);
        } while (DAT_006513d6 < DAT_006513d5);
      }
      if ((bVar3) || (bVar6)) {
LAB_00420bca:
        bVar6 = false;
        if (bVar3) {
          if (1 < _DAT_00651344) {
            piVar13 = &DAT_00650944;
            iVar8 = _DAT_00651344 - 1;
            piVar11 = &DAT_0065094e;
            piVar9 = &DAT_00650944;
            if (0 < iVar8) {
              do {
                if ((*piVar11 == *piVar13) && (piVar13[1] == piVar11[1])) {
                  bVar6 = true;
                }
                else {
                  if (bVar6) {
                    *piVar9 = *piVar13;
                    piVar9[1] = piVar13[1];
                    *(short *)(piVar9 + 2) = (short)piVar13[2];
                  }
                  piVar9 = (int *)((int)piVar9 + 10);
                }
                piVar13 = (int *)((int)piVar13 + 10);
                piVar11 = (int *)((int)piVar11 + 10);
                iVar8 = iVar8 + -1;
              } while (iVar8 != 0);
            }
            *piVar9 = *piVar13;
            piVar9[1] = piVar13[1];
            *(short *)(piVar9 + 2) = (short)piVar13[2];
            _DAT_00651344 = ((int)piVar9 + -0x65093a) / 10;
          }
          FUN_00421b70(&DAT_00650930,0);
          FUN_00422df0(0x9557a4);
          FUN_00421960(0x9557d0);
          if (DAT_006513db == '\0') {
            game_state._841980_4_ = 0x96aaba;
            return 0;
          }
          *(uint *)(param_2 + 0x10) = *(uint *)(param_2 + 0x10) | 0x4000000;
          game_state._841980_4_ = 0x96aaba;
          return 0;
        }
        bVar3 = true;
        if (game_state._755277_1_ == '\0') {
          game_state._841980_4_ = 0x96aaba;
          return 1;
        }
        if ((*(short *)(param_2 + 0x9f) == 0) || ((*(byte *)(param_2 + 0x13) & 2) != 0)) {
          bVar3 = false;
        }
        bVar6 = false;
        if (bVar3) {
          game_state._841980_4_ = 0x96aaba;
          return 1;
        }
        if (DAT_0064f4a4 == 0) {
          game_state._841980_4_ = 0x96aaba;
          return 1;
        }
        game_state._755277_1_ = 0;
        FUN_00420f80(0x9557d0,DAT_006513d6);
        iVar8 = FUN_00421130();
        if (iVar8 != 0) {
          game_state._841980_4_ = 0x96aaba;
          return 1;
        }
        if (1 < _DAT_00651344) {
          piVar9 = &DAT_00650944;
          iVar8 = _DAT_00651344 - 1;
          piVar11 = &DAT_00650944;
          piVar13 = &DAT_0065094e;
          if (0 < iVar8) {
            do {
              if ((*piVar13 == *piVar11) && (piVar13[1] == piVar11[1])) {
                bVar6 = true;
              }
              else {
                if (bVar6) {
                  *piVar9 = *piVar11;
                  piVar9[1] = piVar11[1];
                  *(short *)(piVar9 + 2) = (short)piVar11[2];
                }
                piVar9 = (int *)((int)piVar9 + 10);
              }
              piVar11 = (int *)((int)piVar11 + 10);
              piVar13 = (int *)((int)piVar13 + 10);
              iVar8 = iVar8 + -1;
            } while (iVar8 != 0);
          }
          *piVar9 = *piVar11;
          piVar9[1] = piVar11[1];
          *(short *)(piVar9 + 2) = (short)piVar11[2];
          _DAT_00651344 = ((int)piVar9 + -0x65093a) / 10;
        }
        FUN_00421b70(&DAT_00650930,0);
        FUN_00422df0(0x9557a4);
        FUN_00421960(0x9557d0);
        game_state._841980_4_ = 0x96aaba;
        return 0;
      }
    }
    local_10 = 1;
  }
  game_state._841980_4_ = 0x96aaba;
  return local_10;
}
