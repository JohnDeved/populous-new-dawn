/* Ghidra 12.1.3 pseudocode; entry 0043d0e0; FUN_0043d0e0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


undefined1 FUN_0043d0e0(int param_1)

{
  bool bVar1;
  bool bVar2;
  char cVar3;
  ushort uVar4;
  uint uVar5;
  unit_struct *puVar6;
  uint uVar7;
  int iVar8;
  unit_struct *puVar9;
  undefined1 *puVar10;
  undefined1 local_7;
  ushort local_6;
  undefined2 local_4;
  ushort local_2;

  local_7 = 0;
  if (*(short *)(param_1 + 0x83) == 0) {
    return 0;
  }
  uVar5 = (int)*(short *)(param_1 + 0x83) - 1;
  uVar5 = (uVar5 & 0xfe) * 2 | uVar5 & 0xfe00;
  uVar4 = (&game_state.level_data[0].unit_index_2)[uVar5 * 2] & 0x3ff;
  if (uVar4 == 0) goto LAB_0043d2c8;
  puVar6 = unit_land_array[uVar4];
  puVar9 = (unit_struct *)0x0;
  if (((*(byte *)&puVar6->flags_2 & 1) == 0) && (puVar6->unit_class != '\0')) {
    puVar9 = puVar6;
  }
  if ((puVar9 == (unit_struct *)0x0) || (puVar9->tribe_index != *(char *)(param_1 + 0x2f)))
  goto LAB_0043d2c8;
  if ((*(byte *)(param_1 + 0xe) & 0x80) == 0) {
LAB_0043d171:
    bVar2 = true;
  }
  else {
    puVar6 = (unit_struct *)get_adjacent_unit(param_1,0);
    bVar2 = false;
    if (puVar6 != puVar9) goto LAB_0043d171;
  }
  bVar1 = false;
  if (bVar2) {
    iVar8 = 0;
    uVar7 = 0;
    puVar10 = (undefined1 *)
              ((int)(game_state.sunlight_array + 0x32) + (short)game_state._841984_2_ * 10);
    do {
      if (&game_state.field_0x9d5f7 < puVar10) {
        puVar10 = &game_state.field_0x9b6c2;
      }
      if (*(short *)(puVar10 + 2) == 0) {
        bVar1 = true;
        break;
      }
      iVar8 = iVar8 + 1;
      puVar10 = puVar10 + 10;
    } while (iVar8 < 800);
    if (bVar1) {
      puVar10[1] = 0;
      *puVar10 = 0;
      uVar7 = (int)(puVar10 + -0x938830) / 10;
      *(undefined2 *)(puVar10 + 4) = 0;
      game_state._841984_2_ = (short)uVar7 + 1;
      if (799 < (short)game_state._841984_2_) {
        game_state._841984_2_ = 1;
      }
    }
    uVar7 = uVar7 & 0xffff;
    if (uVar7 != 0) {
      if (((*(byte *)((int)&game_state.level_data[0].flags + uVar5 * 4 + 1) & 2) == 0) ||
         (puVar9->state != '\x02')) {
        local_4 = puVar9->unit_index;
        iVar8 = 6;
        local_6 = CONCAT11((char)((ushort)(puVar9->pos).y >> 8),(char)((ushort)(puVar9->pos).x >> 8)
                          ) & 0xfefe;
        local_2 = local_6;
      }
      else {
        local_4 = puVar9->unit_index;
        iVar8 = 8;
      }
      cVar3 = '\0';
      if ((*(byte *)(param_1 + 0x11) & 8) == 0) {
        cVar3 = '\x01' - ((*(uint *)(&DAT_005a7dc4 + iVar8 * 0x16) &
                          1 << (*(byte *)(param_1 + 0x2b) & 0x1f)) == 0);
      }
      else if (((&DAT_005a7dcd)[iVar8 * 0x16] & 4) != 0) {
        cVar3 = '\x01';
      }
      if (cVar3 != '\0') {
        local_7 = 1;
        *(undefined1 *)(param_1 + 0xa6) = 0;
        FUN_00438730(uVar7,iVar8,&local_4,0x20);
        FUN_00436d00(param_1,uVar7,*(undefined1 *)(param_1 + 0xa6));
      }
    }
  }
LAB_0043d2c8:
  *(uint *)(param_1 + 0x14) = *(uint *)(param_1 + 0x14) & 0xfdffffff;
  *(undefined2 *)(param_1 + 0x83) = 0;
  return local_7;
}
