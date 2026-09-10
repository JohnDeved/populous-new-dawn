/* Ghidra 12.1.3 pseudocode; entry 00444f60; FUN_00444f60.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_00444f60(int param_1,int param_2)

{
  byte bVar1;
  uint uVar2;
  unit_struct *puVar3;
  bool bVar4;
  bool bVar5;
  bool bVar6;
  bool bVar7;
  uint uVar8;
  unit_struct *puVar9;
  ushort *puVar10;
  undefined1 uVar11;
  uint uVar12;
  int iVar13;
  unit_struct *puVar14;
  bool bVar15;
  bool bVar16;
  byte local_1d;

  bVar4 = false;
  bVar7 = false;
  bVar15 = false;
  bVar5 = false;
  uVar12 = (uint)*(byte *)(param_2 + 0xc);
  bVar6 = false;
  local_1d = 0;
  switch(uVar12) {
  case 0x1e:
    bVar7 = true;
    bVar4 = true;
    break;
  case 0x37:
  case 0x38:
  case 0x39:
  case 0x3a:
  case 0x3b:
  case 0x3c:
  case 0x3d:
  case 0x3e:
  case 0x57:
  case 0x58:
  case 0x59:
  case 0x5a:
  case 0x5b:
  case 0x5c:
  case 0x5d:
  case 0x5e:
    bVar6 = true;
    bVar4 = 0x56 < *(byte *)(param_2 + 0xc);
    if (bVar4) {
      uVar12 = uVar12 - 0x20;
    }
    uVar2 = *(uint *)(param_2 + 8);
    uVar8 = *(uint *)(param_2 + 4) & 0xffff;
    bVar15 = (uVar2 & 0x20000) != 0;
    bVar16 = (uVar2 & 0x40000) == 0;
    if ((uVar12 == 0x3e) || (((&DAT_005a7dcb)[uVar8 * 0x16] & 0x20) != 0)) {
      bVar4 = true;
    }
    if (DAT_0089bc7e == 0) {
LAB_00445042:
      if (!bVar16) goto LAB_00445046;
    }
    else {
      if (bVar16) {
        if (*(char *)(param_1 + 0xc1f) == '\x02') {
          bVar5 = true;
        }
        goto LAB_00445042;
      }
LAB_00445046:
      local_1d = 0x40;
    }
    if (!bVar4) {
      local_1d = local_1d | 0x80;
    }
    iVar13 = uVar12 - 0x37;
    FUN_00435780(param_1,iVar13,uVar8,*(uint *)(param_2 + 4) >> 0x10,uVar2,CONCAT11(bVar15,local_1d)
                );
    if (iVar13 == 0) {
      FUN_00435c40(param_1);
    }
    FUN_00435cb0(param_1,iVar13);
    if (bVar5) {
      for (iVar13 = *(int *)(param_1 + 0x881); iVar13 != 0; iVar13 = *(int *)(iVar13 + 8)) {
        if ((*(byte *)(iVar13 + 0x7a) & 0x80) != 0) {
          *(uint *)(iVar13 + 0x10) = *(uint *)(iVar13 + 0x10) | 0x200;
        }
      }
    }
    if (uVar12 == 0x3e) {
      bVar7 = true;
    }
  }
  FUN_00435c10(param_1);
  if ((bVar4) && (FUN_00436ff0(param_1), !bVar15)) {
    bVar7 = true;
  }
  if (bVar6) {
    for (iVar13 = *(int *)(param_1 + 0x881); iVar13 != 0; iVar13 = *(int *)(iVar13 + 8)) {
      if (((((*(byte *)(iVar13 + 0x7a) & 0x80) != 0) && (*(char *)(iVar13 + 0x2c) != '\x19')) &&
          (*(char *)(iVar13 + 0x2c) != '\x1d')) &&
         (FUN_004e9b40(iVar13), (*(uint *)(iVar13 + 0xc) & 0x100000) == 0)) {
        *(undefined1 *)(iVar13 + 0x7d) = 0;
        if ((game_state._4_4_ & 2) == 0) {
          bVar1 = *(byte *)(iVar13 + 0x2b);
LAB_00445178:
          uVar11 = unit_type_array_person[bVar1].next_state;
        }
        else {
          bVar1 = *(byte *)(iVar13 + 0x2b);
          if (bVar1 != 7) goto LAB_00445178;
          uVar11 = 0x27;
        }
        empty_unit_function(iVar13);
        *(undefined1 *)(iVar13 + 0x2c) = uVar11;
        init_unit_class(iVar13);
      }
    }
  }
  if (bVar7) {
    for (puVar3 = *(unit_struct **)(param_1 + 0x881); puVar3 != (unit_struct *)0x0;
        puVar3 = puVar3->next_unit) {
      puVar3->flags_3 = puVar3->flags_3 & 0xffffff7f;
      *(byte *)&puVar3->loc_1_x = *(byte *)&puVar3->loc_1_x & 0x7f;
      if (puVar3->unit_land_array_index != 0) {
        puVar14 = unit_land_array[(ushort)puVar3->unit_land_array_index];
        puVar9 = (unit_struct *)0x0;
        if (((puVar14->flags_2 & 1) == 0) && (puVar14->unit_class != '\0')) {
          puVar9 = puVar14;
        }
        if (((puVar9 != (unit_struct *)0x0) && (puVar9->field_0x9e != '\0')) &&
           (iVar13 = (int)(char)unit_type_array_vehicle[(byte)puVar9->unit_type].field_0x8,
           0 < iVar13)) {
          puVar10 = &puVar9->loc_1_x;
          do {
            puVar14 = (unit_struct *)0x0;
            if (((*puVar10 != 0) && (puVar9 = unit_land_array[*puVar10], (puVar9->flags_2 & 1) == 0)
                ) && (puVar9->unit_class != '\0')) {
              puVar14 = puVar9;
            }
            if ((puVar14 != (unit_struct *)0x0) && (puVar3 != puVar14)) {
              puVar14->flags_3 = puVar14->flags_3 & 0xffffff7f;
              *(byte *)&puVar14->loc_1_x = *(byte *)&puVar14->loc_1_x & 0x7f;
            }
            puVar10 = puVar10 + 1;
            iVar13 = iVar13 + -1;
          } while (iVar13 != 0);
        }
      }
    }
  }
  FUN_0047a550(0,param_1);
  return;
}
