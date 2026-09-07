/* Ghidra 12.1.3 pseudocode; entry 004bc890; FUN_004bc890.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


/* WARNING: Removing unreachable block (ram,0x004bca50) */
/* WARNING: Removing unreachable block (ram,0x004bca58) */

void FUN_004bc890(int param_1)

{
  short *psVar1;
  short *psVar2;
  char cVar3;
  short sVar4;
  undefined4 uVar5;
  unit_struct *puVar6;
  ushort uVar7;
  ushort uVar8;
  short sVar9;
  uint uVar10;
  unit_struct *puVar11;
  uint uVar12;
  uint uVar13;
  int iVar14;
  uint uVar15;
  int iVar16;
  ushort *puVar17;
  ushort local_18;
  ushort uStack_16;
  short local_14;
  undefined2 uStack_12;
  undefined2 local_10;
  undefined2 uStack_e;
  short local_c;
  int local_8;
  int local_4;

  local_8 = 0;
  local_14 = 0;
  uVar7 = *(ushort *)(param_1 + 0x35);
  cVar3 = *(char *)(param_1 + 0x2d);
  local_4 = (int)*(short *)(param_1 + 0x5f);
  if (cVar3 == '\0') {
    *(undefined1 *)(param_1 + 0x2d) = 1;
    add_unit_to_cell(param_1,param_1 + 0x70);
    *(uint *)(param_1 + 0x14) = *(uint *)(param_1 + 0x14) | 0x100;
    if (((uVar7 & 0x40) != 0) && (*(short *)(param_1 + 0x6a) < 0)) {
      *(undefined2 *)(param_1 + 0x6a) = 0;
    }
    if (*(short *)(param_1 + 0x6a) < 9) {
      if (*(short *)(param_1 + 0x6a) < 0) {
        *(undefined2 *)(param_1 + 0x6a) = 0;
      }
    }
    else {
      *(undefined2 *)(param_1 + 0x6a) = 8;
    }
    if (4 < *(short *)(param_1 + 0x6a)) {
      *(undefined2 *)(param_1 + 0x6a) = 4;
    }
    iVar14 = 0;
    if (0 < *(short *)(param_1 + 0x6a)) {
      do {
        iVar16 = alloc_unit(7,10,*(undefined1 *)(param_1 + 0x2f),param_1 + 0x3d);
        if (iVar16 != 0) {
          *(undefined2 *)(param_1 + 0x88 + iVar14 * 2) = *(undefined2 *)(iVar16 + 0x24);
          *(undefined2 *)(iVar16 + 0x6c) = 0xffff;
          if ((uVar7 & 0x40) == 0) {
            sVar9 = (short)iVar14 + 0x5a1;
          }
          else {
            *(byte *)(iVar16 + 0x35) = *(byte *)(iVar16 + 0x35) | 0x40;
            sVar9 = (short)iVar14 + 0x599;
          }
          *(short *)(iVar16 + 0x33) = sVar9;
          *(byte *)(iVar16 + 0x35) = *(byte *)(iVar16 + 0x35) | 2;
          *(uint *)(iVar16 + 0x14) = *(uint *)(iVar16 + 0x14) | 0x100;
          *(undefined4 *)(iVar16 + 0x43) = *(undefined4 *)(param_1 + 0x43);
          *(undefined2 *)(iVar16 + 0x47) = *(undefined2 *)(param_1 + 0x47);
          if (iVar14 == 0) {
            sunlight_update_unit_landscape(iVar16,4,4,0);
          }
        }
        iVar14 = iVar14 + 1;
      } while (iVar14 < *(short *)(param_1 + 0x6a));
    }
  }
  else if (cVar3 != '\x01') {
    if (cVar3 == '\x02') {
      local_8 = 1;
    }
    goto LAB_004bcb18;
  }
  psVar1 = (short *)(param_1 + 0x76);
  psVar2 = (short *)(param_1 + 0x3d);
  uVar12 = (int)*psVar1 - (int)*psVar2 >> 0x1f;
  if (((((int)(((int)*psVar1 - (int)*psVar2 ^ uVar12) - uVar12) < 0x408) &&
       (uVar12 = (int)*(short *)(param_1 + 0x7a) - (int)*(short *)(param_1 + 0x41),
       uVar13 = (int)uVar12 >> 0x1f, (int)((uVar12 ^ uVar13) - uVar13) < 0x408)) &&
      (uVar12 = (int)*(short *)(param_1 + 0x78) - (int)*(short *)(param_1 + 0x3f),
      uVar13 = (int)uVar12 >> 0x1f, (int)((uVar12 ^ uVar13) - uVar13) < 0x408)) &&
     (iVar14 = FUN_00450520(psVar1,psVar2), iVar14 < local_4)) {
    *(char *)(param_1 + 0x2d) = *(char *)(param_1 + 0x2d) + '\x01';
    local_14 = 1;
    local_4 = iVar14;
  }
  sVar9 = *(short *)(param_1 + 0x41);
  uVar12 = (uint)(ushort)(*psVar1 - *psVar2);
  sVar4 = *(short *)(param_1 + 0x7a);
  uVar13 = (uint)(ushort)(*(short *)(param_1 + 0x78) - *(short *)(param_1 + 0x3f));
  if (0x7fff < uVar12) {
    uVar12 = uVar12 - 0x10000;
  }
  if (0x7fff < uVar13) {
    uVar13 = uVar13 - 0x10000;
  }
  uVar15 = uVar12;
  if ((int)uVar12 < 0) {
    uVar15 = -uVar12;
  }
  uVar10 = uVar13;
  if ((int)uVar13 < 0) {
    uVar10 = -uVar13;
  }
  if ((int)uVar15 <= (int)uVar10) {
    uVar15 = uVar10;
  }
  uVar7 = calc_angle_quadrant(uVar12,-uVar13);
  uStack_16 = uVar7 & 0x7ff;
  uVar8 = calc_angle_quadrant(uVar15,((int)sVar4 - (int)sVar9) * -2);
  local_18 = uVar8 & 0x7ff;
  local_c = *(short *)(param_1 + 0x41);
  local_10 = (undefined2)*(undefined4 *)psVar2;
  uStack_e = (undefined2)((uint)*(undefined4 *)psVar2 >> 0x10);
  FUN_004e6ac0(&local_10,CONCAT22(local_14,uVar7) & 0xffff07ff,CONCAT22(uVar7,uVar8) & 0x7ff07ff,
               local_4);
  sVar9 = calc_point_height(CONCAT22(uStack_e,local_10),CONCAT22(local_c,uStack_e));
  if (local_c < sVar9) {
    local_c = sVar9;
  }
  add_unit_to_cell(param_1,&local_10);
LAB_004bcb18:
  if (local_8 == 0) {
    if (local_14 == 0) {
      iVar14 = 0;
      local_8 = FUN_00450520((undefined4 *)(param_1 + 0x3d),param_1 + 0x70);
      if (0 < *(short *)(param_1 + 0x6a)) {
        do {
          local_14 = 0;
          uStack_12 = 0;
          uVar7 = *(ushort *)(param_1 + 0x88 + iVar14 * 2);
          if (((uVar7 != 0) &&
              (puVar11 = unit_land_array[uVar7], (*(byte *)&puVar11->flags_2 & 1) == 0)) &&
             (puVar11->unit_class != '\0')) {
            local_14 = (short)puVar11;
            uStack_12 = (undefined2)((uint)puVar11 >> 0x10);
          }
          if (CONCAT22(uStack_12,local_14) != 0) {
            local_c = *(undefined2 *)(param_1 + 0x41);
            uVar5 = *(undefined4 *)(param_1 + 0x3d);
            local_10 = (undefined2)uVar5;
            uStack_e = (undefined2)((uint)uVar5 >> 0x10);
            iVar16 = (int)*(short *)(param_1 + 0x6c) * (iVar14 + 1);
            FUN_004e6ac0(&local_10,CONCAT22(local_14,uStack_16),CONCAT22(uStack_16,local_18),-iVar16
                        );
            if (iVar16 - local_8 == 0 || iVar16 < local_8) {
              add_unit_to_cell(CONCAT22(uStack_12,local_14),&local_10);
            }
          }
          iVar14 = iVar14 + 1;
        } while (iVar14 < *(short *)(param_1 + 0x6a));
        return;
      }
    }
    else {
      puVar17 = (ushort *)(param_1 + 0x94);
      iVar14 = 2;
      FUN_004bb290(param_1);
      do {
        puVar11 = (unit_struct *)0x0;
        if (((*puVar17 != 0) && (puVar6 = unit_land_array[*puVar17], (puVar6->flags_2 & 1) == 0)) &&
           (puVar6->unit_class != '\0')) {
          puVar11 = puVar6;
        }
        if (puVar11 != (unit_struct *)0x0) {
          FUN_004ef180(puVar11);
        }
        puVar17 = puVar17 + 1;
        iVar14 = iVar14 + -1;
      } while (iVar14 != 0);
      iVar14 = 0;
      if (0 < *(short *)(param_1 + 0x6a)) {
        puVar17 = (ushort *)(param_1 + 0x88);
        do {
          puVar11 = (unit_struct *)0x0;
          if (((*puVar17 != 0) &&
              (puVar6 = unit_land_array[*puVar17], (*(byte *)&puVar6->flags_2 & 1) == 0)) &&
             (puVar6->unit_class != '\0')) {
            puVar11 = puVar6;
          }
          if (puVar11 != (unit_struct *)0x0) {
            FUN_004ef180(puVar11);
          }
          puVar17 = puVar17 + 1;
          iVar14 = iVar14 + 1;
        } while (iVar14 < *(short *)(param_1 + 0x6a));
        return;
      }
    }
  }
  else {
    update_after_unit_alloc(param_1);
  }
  return;
}
