/* Ghidra 12.1.3 pseudocode; entry 00435cb0; FUN_00435cb0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


undefined1 FUN_00435cb0(int param_1,byte param_2)

{
  byte *pbVar1;
  bool bVar2;
  uint uVar3;
  uint uVar4;
  uint uVar5;
  char cVar6;
  int iVar7;
  int iVar8;
  int iVar9;
  uint uVar10;
  undefined1 *puVar11;
  int *piVar12;
  undefined1 local_29;
  int local_28;
  int local_24 [9];

  iVar8 = 0;
  pbVar1 = (byte *)(param_1 + 0x8c1 + (uint)param_2 * 10);
  local_28 = 0;
  local_29 = 1;
  if (((&DAT_005a7dcd)[(uint)*pbVar1 * 0x16] & 2) == 0) {
    uVar3 = 0;
    bVar2 = false;
    puVar11 = (undefined1 *)
              ((int)(game_state.sunlight_array + 0x32) + (short)game_state._841984_2_ * 10);
    do {
      if (&game_state.field_0x9d5f7 < puVar11) {
        puVar11 = &game_state.field_0x9b6c2;
      }
      if (*(short *)(puVar11 + 2) == 0) {
        bVar2 = true;
        break;
      }
      iVar8 = iVar8 + 1;
      puVar11 = puVar11 + 10;
    } while (iVar8 < 800);
    if (bVar2) {
      puVar11[1] = 0;
      *puVar11 = 0;
      uVar3 = (int)(puVar11 + -0x938830) / 10;
      *(undefined2 *)(puVar11 + 4) = 0;
      game_state._841984_2_ = (short)uVar3 + 1;
      if (799 < (short)game_state._841984_2_) {
        game_state._841984_2_ = 1;
      }
    }
    uVar3 = uVar3 & 0xffff;
    if (uVar3 == 0) {
      local_29 = 0;
    }
    else {
      iVar8 = (int)player_tribe_num;
      piVar12 = local_24;
      for (iVar7 = 9; iVar7 != 0; iVar7 = iVar7 + -1) {
        *piVar12 = 0;
        piVar12 = piVar12 + 1;
      }
      for (iVar7 = *(int *)(param_1 + 0x881); iVar7 != 0; iVar7 = *(int *)(iVar7 + 8)) {
        if ((*(byte *)(iVar7 + 0x7a) & 0x80) != 0) {
          cVar6 = -1;
          iVar9 = 0;
          uVar4 = (uint)*(byte *)(iVar7 + 0xa6);
          do {
            if (7 < (int)uVar4) {
              uVar4 = 0;
            }
            if (*(short *)(iVar7 + 0x8b + uVar4 * 2) == 0) {
              cVar6 = (char)uVar4;
              break;
            }
            iVar9 = iVar9 + 1;
            uVar4 = uVar4 + 1;
          } while (iVar9 < 8);
          uVar5 = uVar4 & 0xffffff00;
          if ((*(byte *)(iVar7 + 0x11) & 8) == 0) {
            uVar10 = 1 << (*(byte *)(iVar7 + 0x2b) & 0x1f);
            uVar5 = CONCAT31((int3)((*(uint *)(&DAT_005a7dc4 + (uint)*pbVar1 * 0x16) & uVar10) >> 8)
                             ,'\x01' - ((*(uint *)(&DAT_005a7dc4 + (uint)*pbVar1 * 0x16) & uVar10)
                                       == 0));
          }
          else {
            uVar10 = (uint)*pbVar1 * 0xb;
            if (((&DAT_005a7dcd)[(uint)*pbVar1 * 0x16] & 4) != 0) {
              uVar5 = CONCAT31((int3)(uVar4 >> 8),1);
            }
          }
          if ((char)uVar5 != '\0') {
            FUN_00438730(uVar3,CONCAT31((int3)(uVar10 >> 8),*pbVar1),pbVar1 + 6,
                         CONCAT31((int3)(uVar5 >> 8),pbVar1[1]));
            FUN_00436d00(iVar7,uVar3,(int)cVar6);
            if ((iVar8 * 0xc65 + 0x89d1c8 == param_1) &&
               (game_state._838930_2_ != *(short *)(iVar7 + 0x24))) {
              game_state._838943_1_ = game_state._838943_1_ & 0xfd;
              game_state._838940_1_ = 0;
              game_state._838930_2_ = *(short *)(iVar7 + 0x24);
            }
            if (local_28 == 0) {
              local_28 = iVar7;
            }
            local_24[*(byte *)(iVar7 + 0x2b)] = local_24[*(byte *)(iVar7 + 0x2b)] + 1;
          }
        }
      }
      FUN_00436330(local_28,local_24);
    }
  }
  else if (*pbVar1 == 0x22) {
    local_29 = FUN_00435ef0(param_1,pbVar1[6]);
  }
  return local_29;
}
