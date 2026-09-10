/* Ghidra 12.1.3 pseudocode; entry 00423900; FUN_00423900.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


/* WARNING: Removing unreachable block (ram,0x00423ad3) */
/* WARNING: Removing unreachable block (ram,0x00423ae6) */
/* WARNING: Removing unreachable block (ram,0x00423af6) */
/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

void FUN_00423900(int param_1,int param_2)

{
  undefined4 *puVar1;
  undefined4 *puVar2;
  uint uVar3;
  float10 fVar4;
  bool bVar5;
  union_polygon *puVar6;
  int iVar7;
  pnts_related_struct *ppVar8;
  int iVar9;
  uint uVar10;
  uint uVar11;
  uint uVar12;
  int iVar13;
  pnts_related_struct *ppVar14;
  undefined4 *puVar15;
  int iVar16;
  pnts_related_struct *ppVar17;
  int iVar18;
  int iVar19;
  uint uVar20;
  uint uVar21;
  undefined4 *puVar22;
  undefined4 *puVar23;
  pnts_related_struct *ppVar24;
  int iVar25;
  uint uVar26;
  undefined4 *puVar27;
  float10 fVar28;
  int local_48;
  int local_34;
  temp_4_2B *local_24;
  undefined1 local_20;
  uint local_10 [4];

  local_24 = temp_4_2B_ARRAY_006513f0;
  if (0 < param_2) {
    local_10[3] = param_2;
    do {
      iVar7 = (int)local_24->a;
      if (((0 < iVar7) && (iVar16 = (int)local_24->b, 0 < iVar16)) &&
         (iVar13 = (int)local_24->c, 0 < iVar13)) {
        ppVar8 = temp_pnts_related_array + iVar7;
        ppVar17 = temp_pnts_related_array + iVar16;
        ppVar14 = temp_pnts_related_array + iVar13;
        iVar9 = FUN_0046daa0(ppVar8,ppVar17,ppVar14);
        puVar6 = empty_polygon;
        if (0 < iVar9) {
          if ((((temp_pnts_related_array[iVar7].field_0x18 & 0x80) != 0) ||
              ((temp_pnts_related_array[iVar16].field_0x18 & 0x80) != 0)) ||
             (bVar5 = false, (temp_pnts_related_array[iVar13].field_0x18 & 0x80) != 0)) {
            bVar5 = true;
          }
          if (empty_polygon < polypool_mem_end_2) {
            empty_polygon = (union_polygon *)&(empty_polygon->field0).tex_index;
            iVar25 = temp_pnts_related_array[iVar16].z + 0x7000;
            iVar18 = temp_pnts_related_array[iVar13].z + 0x7000;
            iVar9 = temp_pnts_related_array[iVar7].z + 0x7000;
            if (iVar9 < iVar25) {
              iVar9 = iVar25;
            }
            if (iVar9 < iVar18) {
              iVar9 = iVar18;
            }
            iVar9 = iVar9 + -0x160;
            if (iVar9 < 0x40) {
              iVar9 = 0;
            }
            else {
              iVar9 = (int)(iVar9 + (iVar9 >> 0x1f & 0xfU)) >> 4;
              if (0xe00 < iVar9) {
                iVar9 = 0xe00;
              }
            }
            if ((bVar5) && (iVar9 = iVar9 + -0xd, iVar9 < 0)) {
              iVar9 = 0;
            }
            (puVar6->field0).next = polygons_to_draw[iVar9];
            polygons_to_draw[iVar9] = (polygon_drawn *)puVar6;
            puVar15 = &(puVar6->field0).point_1_x;
            (puVar6->field0).type = 0x1b;
            (puVar6->field0).unknown_1 = 0;
            *puVar15 = temp_pnts_related_array[iVar7].screen_x;
            (puVar6->field0).point_1_y = temp_pnts_related_array[iVar7].screen_y;
            puVar1 = &(puVar6->field0).point_2_x;
            puVar2 = &(puVar6->field0).point_3_x;
            *puVar1 = temp_pnts_related_array[iVar16].screen_x;
            (puVar6->field0).point_2_y = temp_pnts_related_array[iVar16].screen_y;
            *puVar2 = temp_pnts_related_array[iVar13].screen_x;
            (puVar6->field0).point_3_y = temp_pnts_related_array[iVar13].screen_y;
            if ((*(int *)(param_1 + 100) == 0) || (*(int *)(param_1 + 0x68) == 0)) {
              iVar25 = 0;
              iVar18 = 0;
              local_20 = 0;
              local_34 = 0;
            }
            else {
              iVar25 = 0x20;
              iVar18 = 0x20;
              local_34 = 0x20;
              local_20 = 0xf;
            }
            iVar19 = 0;
            if (iVar25 != 0) {
              iVar19 = iVar25 * 0x10000 + -1;
            }
            iVar25 = 0;
            if (iVar18 != 0) {
              iVar25 = iVar18 * 0x10000 + -1;
            }
            if (local_34 != 0) {
              local_34 = local_34 * 0x10000 + -1;
            }
            *(undefined1 *)&(puVar6->field0).tex_index_2 = local_20;
            (puVar6->field0).point_1_u = 0;
            (puVar6->field0).point_1_v = 0;
            (puVar6->field0).point_2_u = iVar19;
            (puVar6->field0).point_2_v = iVar25;
            (puVar6->field0).point_3_u = 0;
            (puVar6->field0).point_3_v = local_34;
            (puVar6->field0).point_1_color = 0x20;
            (puVar6->field0).point_2_color = 0x20;
            (puVar6->field0).point_3_color = 0x20;
            fVar28 = (float10)FUN_0046dbb0(ppVar8,ppVar17,ppVar14);
            fVar4 = (float10)_DAT_0058f138;
            if (fVar4 < fVar28) {
              *(undefined1 *)((int)&(puVar6->field0).tex_index_2 + 1) = 0;
            }
            else {
              *(undefined1 *)((int)&(puVar6->field0).tex_index_2 + 1) = 1;
            }
            if (*(char *)(param_1 + 0x9d) != '\0') {
              bVar5 = true;
              if ((fVar28 <= fVar4) && (0x8c0 < iVar9)) {
                bVar5 = false;
              }
              if (bVar5) {
                uVar10 = *(uint *)&temp_pnts_related_array[iVar7].field_0x18 & 0xf00;
                uVar11 = *(uint *)&temp_pnts_related_array[iVar16].field_0x18 & 0xf00;
                uVar3 = *(uint *)&temp_pnts_related_array[iVar13].field_0x18;
                local_10[0] = *(uint *)&temp_pnts_related_array[iVar7].field_0x18 & 0xf000;
                local_10[1] = *(uint *)&temp_pnts_related_array[iVar16].field_0x18 & 0xf000;
                local_10[2] = uVar3 & 0xf000;
                if ((uVar10 != 0) || (uVar11 != 0)) {
                  uVar20 = 0x100;
                  local_48 = 0;
                  do {
                    puVar6 = empty_polygon;
                    uVar26 = uVar20 & uVar10;
                    uVar12 = uVar20 & uVar11;
                    uVar21 = uVar20 & uVar3 & 0xf00;
                    if (((uVar26 != 0) || (uVar12 != 0)) || (uVar21 != 0)) {
                      iVar7 = 0;
                      if (uVar26 == 0) {
LAB_00423c78:
                        if ((uVar12 != 0) && (uVar12 == uVar21)) {
                          iVar7 = 3;
                        }
                      }
                      else if (uVar12 == uVar26) {
                        iVar7 = 1;
                      }
                      else {
                        if ((uVar26 == 0) || (uVar21 != uVar26)) goto LAB_00423c78;
                        iVar7 = 2;
                      }
                      if (((uVar20 & 0x6000) != 0) && (0x700 < iVar9)) {
                        iVar7 = 0;
                      }
                      if ((iVar7 != 0) && (empty_polygon < polypool_mem_end_2)) {
                        empty_polygon =
                             (union_polygon *)((int)&(empty_polygon->field0).point_3_x + 2);
                        (puVar6->field0).next = polygons_to_draw[iVar9];
                        polygons_to_draw[iVar9] = (polygon_drawn *)puVar6;
                        (puVar6->field0).type = 0x1c;
                        (puVar6->field0).unknown_1 = 0;
                        if (iVar7 == 1) {
                          puVar23 = puVar15;
                          puVar27 = &(puVar6->field0).point_1_x;
                          for (iVar7 = 5; puVar22 = puVar1, iVar7 != 0; iVar7 = iVar7 + -1) {
                            *puVar27 = *puVar23;
                            puVar23 = puVar23 + 1;
                            puVar27 = puVar27 + 1;
                          }
LAB_00423d2d:
                          puVar23 = &(puVar6->field0).point_2_x;
                          for (iVar7 = 5; iVar7 != 0; iVar7 = iVar7 + -1) {
                            *puVar23 = *puVar22;
                            puVar22 = puVar22 + 1;
                            puVar23 = puVar23 + 1;
                          }
                        }
                        else {
                          puVar23 = puVar15;
                          if ((iVar7 == 2) || (puVar23 = puVar1, iVar7 == 3)) {
                            puVar27 = &(puVar6->field0).point_1_x;
                            for (iVar7 = 5; puVar22 = puVar2, iVar7 != 0; iVar7 = iVar7 + -1) {
                              *puVar27 = *puVar23;
                              puVar23 = puVar23 + 1;
                              puVar27 = puVar27 + 1;
                            }
                            goto LAB_00423d2d;
                          }
                        }
                        *(undefined1 *)((int)&(puVar6->field0).point_3_x + 1) = 0;
                        *(undefined1 *)&(puVar6->field0).point_3_x = (undefined1)local_48;
                      }
                    }
                    uVar20 = uVar20 * 2;
                    local_48 = local_48 + 1;
                  } while (local_48 < 4);
                }
                if (((local_10[0] != 0) || (local_10[1] != 0)) || (local_10[2] != 0)) {
                  iVar7 = 0;
                  do {
                    uVar3 = local_10[iVar7];
                    if (uVar3 != 0) {
                      uVar10 = 0x1000;
                      iVar16 = 0;
                      do {
                        puVar6 = empty_polygon;
                        if (((uVar3 & uVar10) != 0) && (empty_polygon < polypool_mem_end_2)) {
                          empty_polygon =
                               (union_polygon *)((int)&(empty_polygon->field0).point_3_x + 2);
                          iVar13 = iVar9;
                          if ((uVar10 != 0x400) && (iVar13 = iVar9 + -8, iVar13 < 0)) {
                            iVar13 = 0;
                          }
                          (puVar6->field0).next = polygons_to_draw[iVar13];
                          polygons_to_draw[iVar13] = (polygon_drawn *)puVar6;
                          (puVar6->field0).type = 0x1c;
                          (puVar6->field0).unknown_1 = 0;
                          if (iVar7 == 0) {
                            puVar23 = puVar15;
                            puVar27 = &(puVar6->field0).point_1_x;
                            for (iVar13 = 5; ppVar24 = ppVar8, iVar13 != 0; iVar13 = iVar13 + -1) {
                              *puVar27 = *puVar23;
                              puVar23 = puVar23 + 1;
                              puVar27 = puVar27 + 1;
                            }
LAB_00423e3c:
                            *(uint *)&ppVar24->field_0x18 = *(uint *)&ppVar24->field_0x18 & ~uVar10;
                          }
                          else {
                            if (iVar7 == 1) {
                              puVar23 = puVar1;
                              puVar27 = &(puVar6->field0).point_1_x;
                              for (iVar13 = 5; ppVar24 = ppVar17, iVar13 != 0; iVar13 = iVar13 + -1)
                              {
                                *puVar27 = *puVar23;
                                puVar23 = puVar23 + 1;
                                puVar27 = puVar27 + 1;
                              }
                              goto LAB_00423e3c;
                            }
                            if (iVar7 == 2) {
                              puVar23 = puVar2;
                              puVar27 = &(puVar6->field0).point_1_x;
                              for (iVar13 = 5; ppVar24 = ppVar14, iVar13 != 0; iVar13 = iVar13 + -1)
                              {
                                *puVar27 = *puVar23;
                                puVar23 = puVar23 + 1;
                                puVar27 = puVar27 + 1;
                              }
                              goto LAB_00423e3c;
                            }
                          }
                          *(undefined1 *)((int)&(puVar6->field0).point_3_x + 1) = 1;
                          *(char *)&(puVar6->field0).point_3_x = (char)iVar16;
                        }
                        iVar16 = iVar16 + 1;
                        uVar10 = uVar10 * 2;
                      } while (iVar16 < 4);
                    }
                    iVar7 = iVar7 + 1;
                  } while (iVar7 < 3);
                }
              }
            }
          }
        }
      }
      local_24 = (temp_4_2B *)&local_24->d;
      local_10[3] = local_10[3] + -1;
    } while (local_10[3] != 0);
  }
  return;
}
