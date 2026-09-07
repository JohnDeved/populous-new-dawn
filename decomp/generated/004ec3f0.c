/* Ghidra 12.1.3 pseudocode; entry 004ec3f0; FUN_004ec3f0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_004ec3f0(int param_1,short *param_2)

{
  ushort uVar1;
  unit_struct *puVar2;
  ushort uVar3;
  bool bVar4;
  undefined1 uVar5;
  undefined1 uVar6;
  char cVar7;
  char cVar8;
  byte bVar9;
  short *psVar10;
  byte bVar11;
  byte bVar12;
  int iVar13;
  undefined2 *puVar14;
  int iVar15;
  char local_10;
  char cStack_f;
  undefined1 uStack_c;
  undefined1 uStack_b;
  undefined1 local_8 [4];
  undefined1 local_4 [4];

  if (*(ushort *)(param_1 + 0x9f) != 0) {
    puVar2 = unit_land_array[*(ushort *)(param_1 + 0x9f)];
    uStack_c = SUB41(puVar2,0);
    uStack_b = (undefined1)((uint)puVar2 >> 8);
    uVar1 = *(ushort *)&unit_type_array_vehicle[(byte)puVar2->unit_type].field_0x15;
    uVar5 = (undefined1)((ushort)*param_2 >> 8);
    uVar6 = (undefined1)((ushort)param_2[1] >> 8);
    uVar3 = CONCAT11(uVar6,uVar5) & 0xfefe;
    if ((uVar1 & 1) == 0) {
      bVar11 = *(byte *)(landscape_height_array +
                        ((&game_state.level_data[0].c_3)
                         [((uVar3 & 0xfe) * 2 | (CONCAT11(uVar6,uVar5) & 0xfefe) & 0xfe00) * 4] &
                        0xf)) & 2;
    }
    else {
      bVar11 = 1;
    }
    if ((bVar11 != 0) && (cVar7 = get_empty_indexed_xy(2,0,0,0x20), cVar7 != '\0')) {
      iVar15 = (int)(short)game_state._838678_2_;
      do {
        do {
          cVar8 = get_indexed_xy(cVar7,local_8,local_4);
          if (cVar8 == '\0') goto LAB_004ec61d;
          local_10 = (char)uVar3;
          bVar11 = local_8[0] * '\x02' + local_10;
          cStack_f = (char)(uVar3 >> 8);
          bVar9 = local_4[0] * '\x02' + cStack_f;
          if ((uVar1 & 1) == 0) {
            bVar12 = *(byte *)(landscape_height_array +
                              ((&game_state.level_data[0].c_3)
                               [((CONCAT11(bVar9,bVar11) & 0xfe) * 2 |
                                CONCAT11(bVar9,bVar11) & 0xfe00) * 4] & 0xf)) & 2;
          }
          else {
            bVar12 = 1;
          }
        } while ((bVar12 == 0) ||
                (cVar8 = FUN_00465510(CONCAT13(uStack_b,CONCAT12(uStack_c,CONCAT11(bVar9,bVar11))),
                                      puVar2), cVar8 == '\0'));
        iVar13 = 0;
        psVar10 = (short *)&game_state.field_0xccc1a;
        bVar4 = false;
        if (0 < iVar15) {
          do {
            if (((char)psVar10[1] != '\0') &&
               (iVar13 = iVar13 + 1, *psVar10 == CONCAT11(bVar9,bVar11))) {
              bVar4 = true;
              break;
            }
            psVar10 = (short *)((int)psVar10 + 3);
          } while (iVar13 < iVar15);
        }
      } while (bVar4);
      *param_2 = (bVar11 + 1) * 0x100;
      param_2[1] = (bVar9 + 1) * 0x100;
      if (iVar15 < 0x10) {
        iVar15 = 0;
        puVar14 = (undefined2 *)&game_state.field_0xccc1a;
        do {
          if (*(char *)(puVar14 + 1) == '\0') {
            game_state._838678_2_ = game_state._838678_2_ + 1;
            *(undefined1 *)(puVar14 + 1) = 1;
            *puVar14 = CONCAT11(bVar9,bVar11);
            break;
          }
          iVar15 = iVar15 + 1;
          puVar14 = (undefined2 *)((int)puVar14 + 3);
        } while (iVar15 < 0x10);
      }
LAB_004ec61d:
      clear_indexed_xy(cVar7);
    }
  }
  return;
}
