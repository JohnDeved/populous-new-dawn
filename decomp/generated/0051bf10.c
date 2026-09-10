/* Ghidra 12.1.3 pseudocode; entry 0051bf10; FUN_0051bf10.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


undefined1 FUN_0051bf10(int param_1,int param_2)

{
  unit_struct *puVar1;
  bool bVar2;
  char cVar3;
  int iVar4;
  uint uVar5;
  uint uVar6;
  undefined1 uVar7;
  unit_struct *puVar8;
  vector_48b *pvVar9;
  ushort local_6;
  ushort local_4;
  ushort local_2;

  uVar7 = 0;
  puVar8 = (unit_struct *)0x0;
  if (((*(ushort *)(param_2 + 6) != 0) &&
      (puVar1 = unit_land_array[*(ushort *)(param_2 + 6)], (*(byte *)&puVar1->flags_2 & 1) == 0)) &&
     (puVar1->unit_class != '\0')) {
    puVar8 = puVar1;
  }
  if ((puVar8 == (unit_struct *)0x0) || (*(short *)&puVar8->field_0x6e < 1)) {
    return 1;
  }
  if ((*(byte *)(param_1 + 0x2e) & 3) == 0) {
    iVar4 = get_adjacent_unit(puVar8,0);
    if (iVar4 == 0) {
      pvVar9 = &puVar8->pos;
      uVar5 = (int)(short)pvVar9->x - (int)*(short *)(param_1 + 0x3d);
      uVar6 = (int)uVar5 >> 0x1f;
      if (((int)((uVar5 ^ uVar6) - uVar6) < 0x438) &&
         (uVar5 = (int)(short)(puVar8->pos).y - (int)*(short *)(param_1 + 0x3f),
         uVar6 = (int)uVar5 >> 0x1f, (int)((uVar5 ^ uVar6) - uVar6) < 0x438)) {
        FUN_004e9dd0(param_1,pvVar9);
      }
      else {
        uVar5 = (int)*(short *)(param_1 + 0x4f) - (int)(short)pvVar9->x;
        uVar6 = (int)uVar5 >> 0x1f;
        if ((0x437 < (int)((uVar5 ^ uVar6) - uVar6)) ||
           (uVar5 = (int)*(short *)(param_1 + 0x51) - (int)(short)(puVar8->pos).y,
           uVar6 = (int)uVar5 >> 0x1f, 0x437 < (int)((uVar5 ^ uVar6) - uVar6))) goto LAB_0051c005;
      }
    }
    else {
      FUN_004044b0(iVar4,&local_4);
      if ((((*(ushort *)(param_1 + 0x4f) ^ local_4) & 0xfe00) != 0) ||
         (((*(ushort *)(param_1 + 0x51) ^ local_2) & 0xfe00) != 0)) {
        pvVar9 = (vector_48b *)&local_4;
LAB_0051c005:
        FUN_004e9d80(param_1,pvVar9);
      }
    }
  }
  if ((*(byte *)(param_1 + 0x13) & 0x10) == 0) {
    return 0;
  }
  bVar2 = false;
  if (((*(byte *)((int)&puVar8->flags_4 + 1) & 4) != 0) ||
     ((cVar3 = FUN_0044f980(&puVar8->pos), cVar3 == '\0' && (puVar8->unit_land_array_index == 0))))
  {
    bVar2 = true;
    uVar7 = 2;
  }
  if (*(char *)(param_1 + 0x2b) != '\x06') {
    if (puVar8->unit_land_array_index != 0) {
      uVar7 = 1;
      bVar2 = true;
    }
    if (*(char *)(param_1 + 0x2b) != '\x06') goto LAB_0051c0df;
  }
  if (puVar8->unit_land_array_index != 0) {
    local_6 = CONCAT11((char)((ushort)(puVar8->pos).y >> 8),(char)((ushort)(puVar8->pos).x >> 8)) &
              0xfefe;
    if ((*(byte *)(landscape_height_array +
                  ((&game_state.level_data[0].c_3)[((local_6 & 0xfe) * 2 | local_6 & 0xfe00) * 4] &
                  0xf)) & 2) != 0) {
      bVar2 = true;
      if ((*(byte *)(param_1 + 0xd) & 8) == 0) {
        FUN_004e9dd0(param_1,&puVar8->pos);
      }
      else {
        uVar7 = 1;
      }
    }
  }
LAB_0051c0df:
  if (!bVar2) {
    return uVar7;
  }
  update_gs_unit_related_array_item(param_1);
  *(uint *)(param_1 + 0x10) = *(uint *)(param_1 + 0x10) & 0xefffffff;
  return uVar7;
}
