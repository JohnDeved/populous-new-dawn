/* Ghidra 12.1.3 pseudocode; entry 00438730; FUN_00438730.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_00438730(short param_1,byte param_2,int *param_3,byte param_4)

{
  int iVar1;
  byte *pbVar2;
  ushort uVar3;
  int iVar4;
  uint uVar5;
  undefined1 uVar6;
  uint uVar7;
  undefined1 uVar8;
  ushort local_10;
  short local_e;
  ushort local_8;
  short local_6;
  int local_4;

  iVar1 = param_1 * 10;
  pbVar2 = (byte *)((int)(game_state.sunlight_array + 0x32) + iVar1);
  local_4 = 0;
  if ((*pbVar2 != param_2) ||
     (*(int *)((int)(game_state.sunlight_array + 0x32) + iVar1 + 6) != *param_3)) {
    *pbVar2 = param_2;
    *(byte *)((int)(game_state.sunlight_array + 0x32) + iVar1 + 1) =
         *(byte *)((int)(game_state.sunlight_array + 0x32) + iVar1 + 1) | param_4;
    iVar4 = *param_3;
    *(int *)((int)(game_state.sunlight_array + 0x32) + iVar1 + 6) = iVar4;
    uVar5 = *(uint *)(&DAT_005a7dca + (uint)*pbVar2 * 0x16);
    if ((uVar5 & 1) == 0) {
      if ((uVar5 & 4) == 0) {
        if ((uVar5 & 0x800) != 0) {
          local_10 = *(ushort *)((int)(game_state.sunlight_array + 0x32) + iVar1 + 6);
        }
      }
      else {
        local_10 = *(ushort *)((int)(game_state.sunlight_array + 0x32) + iVar1 + 8);
      }
    }
    else {
      local_10 = CONCAT11((char)((ushort)*(undefined2 *)
                                          ((int)(game_state.sunlight_array + 0x32) + iVar1 + 8) >> 8
                                ),(char)((uint)iVar4 >> 8)) & 0xfefe;
    }
    uVar3 = local_10;
    uVar7 = (local_10 & 0xfe) * 2 | local_10 & 0xfe00;
    iVar4 = uVar7 * 4;
    if (((uVar5 & 0x10000) == 0) &&
       ((*(byte *)(landscape_height_array + ((&game_state.level_data[0].c_3)[iVar4] & 0xf)) & 0x3c)
        != 0)) {
      local_4 = 1;
      local_10 = local_10 & 0xfefe;
      local_8 = ((uVar3 & 0xfe) + 1) * 0x100;
      local_6 = ((local_10 >> 8) + 1) * 0x100;
      FUN_004ec630(&local_8,0x200);
      local_e = local_6;
      local_10 = local_8;
    }
    if (((uVar5 & 0x20000) != 0) &&
       ((*(byte *)((int)&game_state.level_data[0].flags + iVar4 + 1) & 2) != 0)) {
      local_4 = 1;
      FUN_004044b0(unit_land_array
                   [(ushort)(&game_state.level_data[0].unit_index_2)[uVar7 * 2] & 0x3ff],&local_8);
      local_e = local_6;
      local_10 = local_8;
    }
    if (local_4 != 0) {
      if ((uVar5 & 1) == 0) {
        uVar6 = (undefined1)(local_10 >> 8);
        uVar8 = (undefined1)((ushort)local_e >> 8);
        if ((uVar5 & 4) == 0) {
          if ((uVar5 & 0x800) != 0) {
            local_10 = CONCAT11(uVar8,uVar6) & 0xfefe;
            *(ushort *)((int)(game_state.sunlight_array + 0x32) + iVar1 + 6) = local_10;
          }
        }
        else {
          local_10 = CONCAT11(uVar8,uVar6) & 0xfefe;
          *(ushort *)((int)(game_state.sunlight_array + 0x32) + iVar1 + 8) = local_10;
        }
      }
      else {
        *(ushort *)((int)(game_state.sunlight_array + 0x32) + iVar1 + 6) = local_10;
        *(short *)((int)(game_state.sunlight_array + 0x32) + iVar1 + 8) = local_e;
      }
    }
    if (((uVar5 & 0x80000) != 0) &&
       (uVar3 = *(ushort *)((int)(game_state.sunlight_array + 0x32) + iVar1 + 6),
       (unit_land_array[uVar3]->field_0x9d & 0x80) != 0)) {
      *pbVar2 = 10;
      *(ushort *)((int)(game_state.sunlight_array + 0x32) + iVar1 + 6) = uVar3;
    }
  }
  return;
}
