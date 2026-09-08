/* Ghidra 12.1.3 pseudocode; entry 004b8bb0; FUN_004b8bb0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_004b8bb0(int param_1)

{
  uint *puVar1;
  byte bVar2;
  ushort uVar3;
  unit_struct *puVar4;
  int iVar5;
  bool bVar6;
  short sVar7;
  uint uVar8;
  int *piVar9;
  int *piVar10;
  int iVar11;
  ushort *puVar12;
  undefined1 uVar13;
  int iVar14;
  undefined2 local_ea;
  uint local_e8;
  unit_struct *local_e0;
  int *local_d8;
  uint local_d4;
  int local_c8 [7];
  int local_ac;
  int local_a0 [20];
  int local_50 [20];

  bVar6 = false;
  local_e0 = (unit_struct *)0x0;
  if (((*(ushort *)(param_1 + 0x92) != 0) &&
      (puVar4 = unit_land_array[*(ushort *)(param_1 + 0x92)], (*(byte *)&puVar4->flags_2 & 1) == 0))
     && (puVar4->unit_class != '\0')) {
    local_e0 = puVar4;
  }
  if ((*(uint *)(param_1 + 0xc) & 4) != 0) {
    *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) & 0xfffffffb;
  }
  FUN_004ba1b0(param_1);
  local_d4 = (uint)*(byte *)(param_1 + 0x9a);
  uVar3 = *(ushort *)&unit_type_array_building[*(byte *)(param_1 + 0x9e)].field_0x12;
  iVar11 = (uint)*(ushort *)&unit_type_array_building[*(byte *)(param_1 + 0x9e)].field_0x1a -
           (int)*(short *)(param_1 + 0x96);
  if (1 < *(ushort *)(param_1 + 0x94)) {
    *(ushort *)(param_1 + 0x94) = *(ushort *)(param_1 + 0x94) - 1;
  }
  local_e8 = local_d4;
  if (local_d4 != 0) {
    uVar8 = local_d4 / 2;
    if (uVar8 == 0) {
      uVar8 = 1;
    }
    iVar14 = 0;
    bVar2 = *(byte *)(param_1 + 0x9a);
    if (bVar2 != 0) {
      puVar12 = (ushort *)(param_1 + 0x6a);
      piVar9 = local_a0;
      do {
        piVar10 = piVar9;
        if (*puVar12 != 0) {
          piVar10 = piVar9 + 1;
          iVar14 = iVar14 + 1;
          *piVar9 = (int)unit_land_array[*puVar12];
        }
        puVar12 = puVar12 + 1;
        piVar9 = piVar10;
      } while (iVar14 < (int)(uint)bVar2);
    }
    piVar9 = local_c8;
    for (iVar14 = 10; iVar14 != 0; iVar14 = iVar14 + -1) {
      *piVar9 = 0;
      piVar9 = piVar9 + 1;
    }
    FUN_004ba260(param_1,local_a0,local_c8,local_50);
    if ((((*(byte *)(param_1 + 0x2e) & 0xf) == 0) && (local_e0 != (unit_struct *)0x0)) &&
       ((local_e0->state == '\x04' && (local_e8 = 0, local_d4 != 0)))) {
      local_d8 = local_a0;
      do {
        iVar14 = *local_d8;
        local_ea = CONCAT11((char)((ushort)*(undefined2 *)(iVar14 + 0x3f) >> 8),
                            (char)((ushort)*(undefined2 *)(iVar14 + 0x3d) >> 8));
        if (((&game_state.level_data[0].unit_index_2)
             [((local_ea & 0xfe) * 2 | local_ea & 0xfe00) * 2] & 0x3ff) == 0) {
          FUN_004e9b40(iVar14);
          if ((*(byte *)(iVar14 + 0xe) & 0x10) != 0) goto LAB_004b8dee;
          *(undefined1 *)(iVar14 + 0x7d) = *(undefined1 *)(iVar14 + 0x2c);
          if ((game_state.level_flags & 2) == 0) {
            bVar2 = *(byte *)(iVar14 + 0x2b);
LAB_004b8dcf:
            uVar13 = unit_type_array_person[bVar2].next_state;
          }
          else {
            bVar2 = *(byte *)(iVar14 + 0x2b);
            if (bVar2 != 7) goto LAB_004b8dcf;
            uVar13 = 0x27;
          }
          empty_unit_function(iVar14);
          *(undefined1 *)(iVar14 + 0x2c) = uVar13;
LAB_004b8de5:
          init_unit_class(iVar14);
        }
        else if ((*(byte *)(iVar14 + 0xe) & 0x10) == 0) {
          *(undefined1 *)(iVar14 + 0x7d) = *(undefined1 *)(iVar14 + 0x2c);
          empty_unit_function(iVar14);
          *(undefined1 *)(iVar14 + 0x2c) = 0x1a;
          goto LAB_004b8de5;
        }
LAB_004b8dee:
        local_d8 = local_d8 + 1;
        local_d4 = local_d4 - 1;
      } while (local_d4 != 0);
    }
    if (local_e8 < uVar3) {
      bVar6 = true;
      if (((iVar11 != 0) && (local_c8[2] < (int)local_e8)) && (local_e8 != 0)) {
        piVar9 = local_a0;
        uVar8 = local_e8;
        do {
          iVar14 = *piVar9;
          piVar9 = piVar9 + 1;
          *(undefined1 *)(iVar14 + 0x2d) = 2;
          puVar1 = (uint *)(iVar14 + 0xc);
          *puVar1 = *puVar1 | 0x40000000;
          uVar8 = uVar8 - 1;
        } while (uVar8 != 0);
      }
      goto LAB_004b8ec2;
    }
    if ((*(byte *)(param_1 + 0x2e) & 0xf) != 0) goto LAB_004b8ec2;
    if ((*(short *)(param_1 + 0x94) != 0) &&
       (sVar7 = *(short *)(param_1 + 0x94) + -1, *(short *)(param_1 + 0x94) = sVar7, sVar7 == 0)) {
      FUN_0040afd0(param_1);
    }
    if (*(short *)(param_1 + 0x94) != 0) goto LAB_004b8ec2;
    if (0 < iVar11) {
      iVar14 = uVar8 - local_ac;
      if (iVar11 < (int)(uVar8 - local_ac)) {
        iVar14 = iVar11;
      }
      if (0 < local_c8[2]) {
        piVar9 = local_50;
        do {
          if (iVar14 < 1) break;
          iVar5 = *piVar9;
          piVar9 = piVar9 + 1;
          local_c8[2] = local_c8[2] + -1;
          iVar14 = iVar14 + -1;
          *(undefined1 *)(iVar5 + 0x2d) = 7;
          puVar1 = (uint *)(iVar5 + 0xc);
          *puVar1 = *puVar1 | 0x40000000;
        } while (0 < local_c8[2]);
      }
      goto LAB_004b8ec2;
    }
  }
  bVar6 = true;
LAB_004b8ec2:
  if ((bVar6) && (iVar11 < 1)) {
    bVar6 = true;
    if ((local_e8 != 0) && (local_e8 != 0)) {
      piVar9 = local_a0;
      do {
        iVar11 = *piVar9;
        if (*(char *)(iVar11 + 0x2d) != '\x01') {
          if (*(char *)(iVar11 + 0x2d) == '\t') {
            if (*(char *)(iVar11 + 0xa8) != '\x06') {
              bVar6 = false;
            }
          }
          else {
            *(undefined1 *)(iVar11 + 0x2d) = 9;
            *(uint *)(iVar11 + 0xc) = *(uint *)(iVar11 + 0xc) | 0x40000000;
            bVar6 = false;
          }
        }
        piVar9 = piVar9 + 1;
        local_e8 = local_e8 - 1;
      } while (local_e8 != 0);
    }
    if (bVar6) {
      if (local_e0 != (unit_struct *)0x0) {
        local_e0->loc_2_y = 0;
      }
      FUN_004ef180(param_1);
    }
  }
  return;
}
