/* Ghidra 12.1.3 pseudocode; entry 00424ab0; FUN_00424ab0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


/* WARNING: Removing unreachable block (ram,0x00424c6e) */
/* WARNING: Removing unreachable block (ram,0x00424c78) */

void FUN_00424ab0(void)

{
  ushort uVar1;
  ushort uVar2;
  undefined4 uVar3;
  undefined4 uVar4;
  bool bVar5;
  bool bVar6;
  bool bVar7;
  bool bVar8;
  bool bVar9;
  bool bVar10;
  ushort uVar11;
  int iVar12;
  ushort *puVar13;
  ushort *puVar14;
  undefined4 *puVar15;
  undefined4 *puVar16;
  uint uVar17;
  short *psVar18;
  int iVar19;
  int iVar20;
  uint uVar21;
  ushort *local_60;
  ushort *local_5c;
  int local_48;
  int local_3c;
  ushort local_38 [2];
  undefined4 local_34;
  ushort local_30 [2];
  undefined4 local_2c [11];

  local_5c = (ushort *)&temp_struct_57b_ARRAY_00659730[0].field_0xe;
  if (0 < INT_006513e8) {
    local_3c = INT_006513e8;
    do {
      iVar12 = 0;
      bVar5 = false;
      bVar10 = false;
      bVar9 = false;
      bVar6 = false;
      iVar19 = 7;
      bVar7 = false;
      local_48 = 0;
      bVar8 = false;
      puVar13 = local_5c;
      do {
        iVar20 = (int)(short)*puVar13;
        if (iVar20 != 0) {
          uVar11 = (ushort)temp_pnts_related_array[iVar20].x;
          uVar1 = (ushort)temp_pnts_related_array[iVar20].z;
          if (uVar11 < 0xf800) {
            if (uVar11 < 0x801) {
              bVar6 = true;
            }
          }
          else {
            bVar5 = true;
          }
          if (uVar1 < 0xf800) {
            if (uVar1 < 0x801) {
              bVar8 = true;
            }
          }
          else {
            bVar7 = true;
          }
        }
        puVar13 = puVar13 + 1;
        iVar19 = iVar19 + -1;
      } while (iVar19 != 0);
      if ((bVar5) && (bVar6)) {
        bVar9 = true;
      }
      if ((bVar7) && (bVar8)) {
        bVar10 = true;
      }
      iVar19 = 0;
      local_60 = local_5c;
      puVar15 = &local_34;
      do {
        uVar11 = *local_60;
        iVar20 = (int)(short)uVar11;
        if (iVar20 == 0) break;
        uVar1 = (ushort)temp_pnts_related_array[iVar20].x;
        uVar21 = (uint)uVar1;
        uVar2 = (ushort)temp_pnts_related_array[iVar20].z;
        uVar17 = (uint)uVar2;
        if ((bVar9) && (uVar1 < 0x801)) {
          uVar21 = uVar21 + 0x10000;
        }
        if ((bVar10) && (uVar2 < 0x801)) {
          uVar17 = uVar17 + 0x10000;
        }
        iVar12 = iVar12 + uVar21;
        local_60 = local_60 + 1;
        *(short *)puVar15 = (short)temp_pnts_related_array[iVar20].x;
        iVar19 = iVar19 + 1;
        puVar16 = puVar15 + 2;
        *(short *)((int)puVar15 + 2) = (short)temp_pnts_related_array[iVar20].z;
        local_48 = local_48 + uVar17;
        *(ushort *)((int)puVar15 + -2) = uVar11;
        *(undefined2 *)(puVar15 + -1) = 0;
        puVar15 = puVar16;
      } while (puVar16 < &stack0x00000004);
      if (iVar19 != 0) {
        if (0 < iVar19) {
          psVar18 = (short *)&local_34;
          iVar20 = iVar19;
          do {
            uVar17 = (uint)(ushort)(*psVar18 - (short)(iVar12 / iVar19));
            uVar21 = (uint)(ushort)(psVar18[1] - (short)(local_48 / iVar19));
            if (0x7fff < uVar17) {
              uVar17 = uVar17 - 0x10000;
            }
            if (0x7fff < uVar21) {
              uVar21 = uVar21 - 0x10000;
            }
            uVar11 = calc_angle_quadrant(uVar17,-uVar21);
            psVar18[-2] = uVar11 & 0x7ff;
            iVar20 = iVar20 + -1;
            psVar18 = psVar18 + 4;
          } while (iVar20 != 0);
        }
        do {
          bVar5 = true;
          if (1 < iVar19) {
            iVar12 = iVar19 + -1;
            puVar13 = local_38;
            do {
              puVar14 = puVar13 + 4;
              if ((short)*puVar14 < (short)*puVar13) {
                bVar5 = false;
                uVar3 = *(undefined4 *)puVar13;
                uVar4 = *(undefined4 *)(puVar13 + 2);
                *(undefined4 *)puVar13 = *(undefined4 *)puVar14;
                *(undefined4 *)(puVar13 + 2) = *(undefined4 *)(puVar13 + 6);
                *(undefined4 *)puVar14 = uVar3;
                *(undefined4 *)(puVar13 + 6) = uVar4;
              }
              iVar12 = iVar12 + -1;
              puVar13 = puVar14;
            } while (iVar12 != 0);
          }
        } while (!bVar5);
        if (0 < iVar19) {
          puVar13 = local_38 + 1;
          puVar14 = local_5c;
          do {
            uVar11 = *puVar13;
            puVar13 = puVar13 + 4;
            *puVar14 = uVar11;
            puVar14 = puVar14 + 1;
            iVar19 = iVar19 + -1;
          } while (iVar19 != 0);
        }
      }
      local_5c = local_5c + 7;
      local_3c = local_3c + -1;
    } while (local_3c != 0);
  }
  return;
}
