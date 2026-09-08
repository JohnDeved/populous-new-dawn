/* Ghidra 12.1.3 pseudocode; entry 00436870; FUN_00436870.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_00436870(int param_1)

{
  int iVar1;
  bool bVar2;
  bool bVar3;
  uint uVar4;
  int iVar5;
  undefined4 uVar6;
  unit_struct *puVar7;
  undefined1 *puVar8;
  undefined2 local_a;
  undefined4 local_4;

  iVar1 = (uint)*(ushort *)(param_1 + 0x8b + (uint)*(byte *)(param_1 + 0xa6) * 2) * 10;
  if (*(char *)((int)(game_state.sunlight_array + 0x32) + iVar1) == '\x1f') {
    bVar3 = false;
    local_a = CONCAT11((char)((ushort)*(undefined2 *)
                                       ((int)(game_state.sunlight_array + 0x32) + iVar1 + 8) >> 8),
                       (char)((ushort)*(undefined2 *)
                                       ((int)(game_state.sunlight_array + 0x32) + iVar1 + 6) >> 8));
    uVar4 = (local_a & 0xfe) * 2 | local_a & 0xfe00;
    if ((*(byte *)((int)&game_state.level_data[0].flags + uVar4 * 4 + 1) & 2) == 0) {
      puVar7 = (unit_struct *)0x0;
    }
    else {
      puVar7 = unit_land_array[(ushort)(&game_state.level_data[0].unit_index_2)[uVar4 * 2] & 0x3ff];
      if ((puVar7 != (unit_struct *)0x0) && (*(char *)(param_1 + 0x2f) == puVar7->tribe_index)) {
        bVar3 = true;
      }
    }
    FUN_004364d0(param_1,*(byte *)(param_1 + 0xa6));
    uVar4 = 0;
    bVar2 = false;
    iVar5 = 0;
    puVar8 = (undefined1 *)
             ((int)(game_state.sunlight_array + 0x32) + (short)game_state._841984_2_ * 10);
    do {
      if (&game_state.field_0x9d5f7 < puVar8) {
        puVar8 = &game_state.field_0x9b6c2;
      }
      if (*(short *)(puVar8 + 2) == 0) {
        bVar2 = true;
        break;
      }
      iVar5 = iVar5 + 1;
      puVar8 = puVar8 + 10;
    } while (iVar5 < 800);
    if (bVar2) {
      puVar8[1] = 0;
      *puVar8 = 0;
      uVar4 = (int)(puVar8 + -0x938830) / 10;
      *(undefined2 *)(puVar8 + 4) = 0;
      game_state._841984_2_ = (short)uVar4 + 1;
      if (799 < (short)game_state._841984_2_) {
        game_state._841984_2_ = 1;
      }
    }
    uVar4 = uVar4 & 0xffff;
    if (uVar4 != 0) {
      if (bVar3) {
        uVar6 = 8;
        local_4 = CONCAT22(local_4._2_2_,puVar7->unit_index);
      }
      else {
        uVar6 = 3;
        local_4 = *(undefined4 *)((int)(game_state.sunlight_array + 0x32) + iVar1 + 6);
      }
      FUN_00438730(uVar4,uVar6,&local_4,0);
      FUN_00436d00(param_1,uVar4,*(undefined1 *)(param_1 + 0xa6));
    }
  }
  return;
}
