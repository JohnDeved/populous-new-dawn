/* Ghidra 12.1.3 pseudocode; entry 00422020; FUN_00422020.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


undefined1 FUN_00422020(byte *param_1,int param_2,int *param_3)

{
  int iVar1;
  byte bVar2;
  undefined1 uVar3;
  char cVar4;
  int iVar5;
  byte bVar6;
  byte bStack_7;
  undefined4 local_6;
  short local_2;

  uVar3 = 0;
  DAT_006513dc = '\0';
  bVar6 = (char)*(undefined4 *)(&DAT_0059bd90 + param_2 * 10) + *param_1;
  bVar2 = (char)*(undefined4 *)(&DAT_0059bd94 + param_2 * 10) + param_1[4];
  local_6._0_2_ = CONCAT11(bVar2,bVar6);
  iVar5 = (uint)bVar6 + (uint)bVar2 * 0x100;
  if ((*(byte *)(game_state._841980_4_ + (iVar5 >> 3)) & '\x01' << ((byte)iVar5 & 7)) == 0) {
    return 3;
  }
  iVar5 = (((ushort)local_6 & 0xfe) * 2 | (ushort)local_6 & 0xfe00) * 4;
  iVar1 = iVar5 + 0x8a03e4;
  if (*param_3 == iVar1) {
    return (char)param_3[2];
  }
  if (param_1[8] == 0) {
    if ((*(uint *)(game_state._755280_4_ + 0x10) & 0x10007) == 0) {
      if ((*(byte *)((int)&game_state.level_data[0].flags + iVar5 + 1) & 2) == 0) {
        if ((*(byte *)(landscape_height_array + ((&game_state.level_data[0].c_3)[iVar5] & 0xf)) & 1)
            == 0) {
          if ((*(byte *)(landscape_height_array + ((&game_state.level_data[0].c_3)[iVar5] & 0xf)) &
              0x3c) == 0) {
            uVar3 = 4;
          }
          else if (DAT_006513d7 == '\0') {
            uVar3 = 4;
          }
          else {
            iVar5 = FUN_004663c0(game_state._755280_4_,iVar1);
            if ((iVar5 == 0) || (param_3[1] == iVar5)) {
              uVar3 = 4;
            }
            else {
              DAT_006513dc = '\x01';
              param_3[1] = iVar5;
            }
          }
        }
      }
      else {
        uVar3 = 1;
      }
    }
    else if ((*(byte *)(landscape_height_array + ((&game_state.level_data[0].c_3)[iVar5] & 0xf)) & 1
             ) == 0) {
      if ((*(byte *)(landscape_height_array + ((&game_state.level_data[0].c_3)[iVar5] & 0xf)) & 0x3c
          ) == 0) {
        uVar3 = 4;
      }
      else if (DAT_006513d7 == '\0') {
        uVar3 = 4;
      }
      else {
        iVar5 = FUN_004663c0(game_state._755280_4_,iVar1);
        if ((iVar5 == 0) || (param_3[1] == iVar5)) {
          uVar3 = 4;
        }
        else {
          DAT_006513dc = '\x01';
          param_3[1] = iVar5;
        }
      }
    }
    else if ((*(byte *)((int)&game_state.level_data[0].flags + iVar5 + 1) & 2) != 0) {
      uVar3 = FUN_00517f10(game_state._755280_4_,iVar1);
    }
    goto LAB_0042229a;
  }
  if (param_1[8] != 1) goto LAB_0042229a;
  bVar2 = *(byte *)(landscape_height_array + ((&game_state.level_data[0].c_3)[iVar5] & 0xf));
  if ((bVar2 & 1) != 0) {
    if (DAT_006513d7 == '\0') {
      uVar3 = 5;
    }
    else {
      bStack_7 = param_1[4] & 0xfe;
      local_6 = CONCAT22((ushort)(*param_1 & 0xfe) << 8,(ushort)local_6);
      local_2 = (ushort)bStack_7 << 8;
      cVar4 = FUN_00464f90(param_3[1],(int)&local_6 + 2);
      if (cVar4 == '\0') {
        uVar3 = 5;
      }
      else {
        DAT_006513dc = '\x01';
      }
    }
    goto LAB_0042229a;
  }
  if ((bVar2 & 0x3c) == 0) {
    cVar4 = FUN_00465510(local_6,param_3[1]);
joined_r0x00422296:
    if (cVar4 != '\0') goto LAB_0042229a;
  }
  else if ((bVar2 & 0x10) == 0) {
    cVar4 = FUN_00465510(local_6,param_3[1]);
    goto joined_r0x00422296;
  }
  uVar3 = 6;
LAB_0042229a:
  if (DAT_006513dc == '\0') {
    *param_3 = iVar1;
    *(undefined1 *)(param_3 + 2) = uVar3;
    return uVar3;
  }
  *param_3 = 0;
  return uVar3;
}
