/* Ghidra 12.1.3 pseudocode; entry 004c1d10; spell_unit_processing_1.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void spell_unit_processing_1(int param_1)

{
  undefined2 *puVar1;
  char cVar2;
  char cVar3;
  bool bVar4;
  bool bVar5;
  short sVar6;
  undefined4 *puVar7;
  int iVar8;
  uint uVar9;
  uint uVar10;
  undefined4 uVar11;
  int iVar12;
  unit_struct *puVar13;
  unit_struct *puVar14;
  undefined2 extraout_var;
  unit_struct *puVar15;
  int iVar16;
  undefined2 local_22;
  unit_struct *local_1c;
  undefined4 local_18;
  undefined2 local_14;
  undefined4 local_10;
  undefined2 local_c;
  undefined4 local_8;
  undefined2 local_4;

  cVar2 = *(char *)(param_1 + 0x2f);
  bVar5 = false;
  puVar15 = game_state.tribes_array[cVar2].shaman;
  if ((puVar15 != (unit_struct *)0x0) || ((game_state.tribes_array[cVar2].field_0x93f & 8) != 0)) {
    iVar12 = (uint)*(byte *)(param_1 + 0x2b) * 0x3e;
    if (*(ushort *)(param_1 + 0x6a) != 0) {
      puVar14 = unit_land_array[*(ushort *)(param_1 + 0x6a)];
      puVar13 = (unit_struct *)0x0;
      if (((*(byte *)&puVar14->flags_2 & 1) == 0) && (puVar14->unit_class != '\0')) {
        puVar13 = puVar14;
      }
      if (puVar13 == (unit_struct *)0x0) {
        *(undefined2 *)(param_1 + 0x6a) = 0;
      }
    }
    if (((&DAT_005a80eb)[iVar12] & 0x40) != 0) {
      puVar14 = (unit_struct *)0x0;
      if (((*(ushort *)(param_1 + 0x6a) != 0) &&
          (puVar13 = unit_land_array[*(ushort *)(param_1 + 0x6a)],
          (*(byte *)&puVar13->flags_2 & 1) == 0)) && (puVar13->unit_class != '\0')) {
        puVar14 = puVar13;
      }
      if (puVar14 != (unit_struct *)0x0) {
        *(undefined4 *)(param_1 + 0x6c) = *(undefined4 *)&puVar14->pos;
        *(undefined2 *)(param_1 + 0x70) = (puVar14->pos).z;
      }
    }
    switch(*(undefined1 *)(param_1 + 0x2d)) {
    case 0:
      FUN_004bb230(cVar2,&local_18);
      uVar11 = CONCAT22(extraout_var,*(undefined2 *)(param_1 + 0x6a));
      iVar12 = FUN_004c21e0(param_1,CONCAT31((int3)((uint)uVar11 >> 8),(&DAT_005a80f6)[iVar12]),
                            CONCAT31((int3)((uint)(param_1 + 0x6c) >> 8),
                                     *(undefined1 *)(param_1 + 0x2f)),&local_18,param_1 + 0x6c,
                            uVar11,0);
      if (iVar12 != 0) {
        *(byte *)(iVar12 + 0x35) = *(byte *)(iVar12 + 0x35) | 0x40;
        goto switchD_004c1de0_caseD_5;
      }
      break;
    case 1:
      puVar14 = (unit_struct *)0x0;
      if (((*(ushort *)(param_1 + 0x68) != 0) &&
          (puVar13 = unit_land_array[*(ushort *)(param_1 + 0x68)],
          (*(byte *)&puVar13->flags_2 & 1) == 0)) && (puVar13->unit_class != '\0')) {
        puVar14 = puVar13;
      }
      if (puVar14 != (unit_struct *)0x0) goto switchD_004c1de0_caseD_5;
      iVar12 = FUN_004c21e0(param_1,CONCAT31((int3)((uint)(param_1 + 0x6c) >> 8),
                                             (&DAT_005a80f7)[iVar12]),cVar2,&puVar15->pos,
                            param_1 + 0x6c,*(undefined2 *)(param_1 + 0x6a),puVar15);
      if (iVar12 != 0) {
        if ((puVar15->unit_land_array_index == 0) &&
           (iVar12 = get_adjacent_unit(puVar15,0), iVar12 == 0)) {
          puVar1 = &(puVar15->pos).z;
          *puVar1 = *puVar1 + 0x30;
        }
        goto switchD_004c1de0_caseD_5;
      }
      break;
    case 2:
      puVar15 = (unit_struct *)0x0;
      if (((*(ushort *)(param_1 + 0x68) != 0) &&
          (puVar14 = unit_land_array[*(ushort *)(param_1 + 0x68)],
          (*(byte *)&puVar14->flags_2 & 1) == 0)) && (puVar14->unit_class != '\0')) {
        puVar15 = puVar14;
      }
      if (puVar15 != (unit_struct *)0x0) goto switchD_004c1de0_caseD_5;
      bVar4 = false;
      if ((&DAT_005a80ff)[iVar12] != '\0') {
        local_22 = CONCAT11((char)((ushort)*(undefined2 *)(param_1 + 0x6e) >> 8),
                            (char)((ushort)*(undefined2 *)(param_1 + 0x6c) >> 8));
        for (puVar15 = unit_land_array
                       [(short)(&game_state.level_data[0].unit_index)
                               [((local_22 & 0xfe) * 2 | local_22 & 0xfe00) * 2]];
            puVar15 != (unit_struct *)0x0; puVar15 = unit_land_array[puVar15->next_unit_index]) {
          if (bVar4) goto LAB_004c1fe4;
          bVar4 = false;
          if (((puVar15->unit_class == '\x01') && (puVar15->tribe_index != cVar2)) &&
             ((puVar15->flags_3 & 0x8000) != 0)) {
            bVar4 = true;
            local_1c = puVar15;
          }
        }
      }
      if (bVar4) {
LAB_004c1fe4:
        local_14 = *(undefined2 *)(param_1 + 0x70);
        local_18 = *(undefined4 *)(param_1 + 0x6c);
        uVar9 = game_state.pseudo_random_val * 0x24a1 + 0x24df;
        uVar10 = uVar9 >> 0xd;
        game_state.pseudo_random_val = uVar10 | uVar9 * 0x80000;
        move_pos_angle_length(&local_18,uVar10 & 0x7ff,0x1000);
        iVar12 = FUN_004c21e0(param_1,CONCAT31((int3)((uint)&local_18 >> 8),(&DAT_005a80f7)[iVar12])
                              ,local_1c->tribe_index,(undefined4 *)(param_1 + 0x6c),&local_18,0,0);
        if (iVar12 != 0) goto switchD_004c1de0_caseD_5;
      }
      else {
        iVar16 = 0;
        do {
          cVar3 = (&DAT_005a80f8)[iVar16 + iVar12];
          if (cVar3 != '\0') {
            if (cVar3 == '\x14') {
              local_8 = *(undefined4 *)(param_1 + 0x6c);
              local_4 = *(undefined2 *)(param_1 + 0x70);
              puVar7 = (undefined4 *)(param_1 + 0x72);
            }
            else {
              if (cVar3 == '\x18') {
                puVar7 = (undefined4 *)(param_1 + 0x72);
              }
              else {
                puVar7 = (undefined4 *)(param_1 + 0x6c);
              }
              local_8 = *puVar7;
              local_4 = *(undefined2 *)(puVar7 + 1);
              puVar7 = (undefined4 *)(param_1 + 0x57);
            }
            local_10 = *puVar7;
            local_c = *(undefined2 *)(puVar7 + 1);
            iVar8 = alloc_unit(7,CONCAT31((int3)((uint)&local_10 >> 8),
                                          (&DAT_005a80f8)[iVar16 + iVar12]),cVar2,&local_8);
            if (iVar8 != 0) {
              *(undefined4 *)(iVar8 + 0x57) = local_10;
              *(undefined2 *)(iVar8 + 0x5b) = local_c;
            }
          }
          iVar16 = iVar16 + 1;
        } while (iVar16 < 5);
      }
      break;
    case 3:
      uVar10 = *(uint *)(param_1 + 0xc);
      if ((uVar10 & 0x40000000) != 0) {
        *(undefined2 *)(param_1 + 0x68) = 6;
        uVar10 = uVar10 & 0xbfffffff;
        *(uint *)(param_1 + 0xc) = uVar10;
      }
      sVar6 = *(short *)(param_1 + 0x68) + -1;
      *(short *)(param_1 + 0x68) = sVar6;
      if (0 < sVar6) goto switchD_004c1de0_caseD_5;
      uVar11 = CONCAT22((short)(uVar10 >> 0x10),*(undefined2 *)(param_1 + 0x6a));
      iVar12 = FUN_004c21e0(param_1,CONCAT31((int3)((uint)uVar11 >> 8),(&DAT_005a80f7)[iVar12]),
                            cVar2,&puVar15->pos,param_1 + 0x6c,uVar11,puVar15);
      if (iVar12 != 0) {
        if ((puVar15->unit_land_array_index == 0) &&
           (iVar12 = get_adjacent_unit(puVar15,0), iVar12 == 0)) {
          puVar1 = &(puVar15->pos).z;
          *puVar1 = *puVar1 + 0x30;
        }
        goto switchD_004c1de0_caseD_5;
      }
      break;
    case 4:
      break;
    default:
      goto switchD_004c1de0_caseD_5;
    }
  }
  bVar5 = true;
switchD_004c1de0_caseD_5:
  if (bVar5) {
    update_after_unit_alloc(param_1);
  }
  return;
}
