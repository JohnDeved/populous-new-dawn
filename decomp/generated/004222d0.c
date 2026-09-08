/* Ghidra 12.1.3 pseudocode; entry 004222d0; FUN_004222d0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

void FUN_004222d0(int param_1)

{
  undefined *puVar1;
  uint *puVar2;
  uint uVar3;
  uint uVar4;
  bool bVar5;
  char cVar6;
  uint *puVar7;
  int iVar8;
  uint local_48;
  uint local_44;
  undefined2 local_40;
  int local_3c;
  int local_38;
  uint local_34;
  uint local_30;
  undefined2 local_2c;
  uint local_28;
  uint local_24;
  undefined2 local_20;
  int local_1c;
  uint local_18;
  uint local_14;
  undefined2 local_10;
  uint local_c;
  uint local_8;
  undefined2 local_4;

  param_1 = param_1 * 0xa43;
  puVar1 = &DAT_0064f4aa + param_1;
  local_38 = 0;
  local_3c = 0;
  if (*(int *)((int)&DAT_0064fee8 + param_1) != 3) goto LAB_00422938;
  if ((game_state._755277_1_ == '\0') ||
     ((game_state._755278_1_ != '\0' && (*(char *)((int)&DAT_0064fede + param_1) != '\0')))) {
    DAT_006513d7 = 0;
  }
  else {
    DAT_006513d7 = 1;
  }
  iVar8 = 0;
  bVar5 = false;
  puVar2 = (uint *)((int)&DAT_0064fed6 + param_1);
  do {
    cVar6 = FUN_00422020(puVar2,*(undefined4 *)((int)&DAT_0064fee4 + param_1),puVar1);
    if (cVar6 == '\0') {
      bVar5 = true;
      break;
    }
    iVar8 = iVar8 + 1;
    local_38 = 1;
    *(uint *)((int)&DAT_0064fee4 + param_1) =
         *(int *)((int)&DAT_0064fee4 + param_1) - *(int *)((int)&DAT_0064fee0 + param_1) & 3;
  } while (iVar8 < 4);
  if (!bVar5) {
    *(undefined4 *)((int)&DAT_0064fee8 + param_1) = 2;
    goto LAB_00422938;
  }
  local_1c = *(int *)((int)&DAT_0064fee4 + param_1);
  if (DAT_006513dc == '\0') {
    *puVar2 = *puVar2 + *(int *)(&DAT_0059bd90 + local_1c * 10);
    *(int *)((int)&DAT_0064feda + param_1) =
         *(int *)((int)&DAT_0064feda + param_1) + *(int *)(&DAT_0059bd94 + local_1c * 10);
    local_28 = *(int *)((int)&DAT_0064fee0 + param_1) + *(int *)((int)&DAT_0064fee4 + param_1) & 3;
    local_48 = *puVar2;
    local_44 = *(uint *)((int)&DAT_0064feda + param_1);
    local_40 = *(undefined2 *)((int)&DAT_0064fede + param_1);
    uVar3 = *(uint *)((int)&DAT_0064f4be + param_1);
    uVar4 = *(uint *)((int)&DAT_0064f4c2 + param_1);
    local_10 = *(undefined2 *)((int)&DAT_0064f4c6 + param_1);
    local_34 = *(uint *)((int)&DAT_0064fecc + param_1);
    local_30 = *(uint *)((int)&DAT_0064fed0 + param_1);
    local_2c = *(undefined2 *)((int)&DAT_0064fed4 + param_1);
    if ((game_state._755277_1_ == '\0') ||
       ((game_state._755278_1_ != '\0' && (*(char *)((int)&DAT_0064fede + param_1) != '\0')))) {
      DAT_006513d7 = 0;
    }
    else {
      DAT_006513d7 = 1;
    }
    local_18 = uVar3;
    local_14 = uVar4;
    cVar6 = FUN_00422020(&local_48,local_28,puVar1);
    if (cVar6 == '\0') {
      local_38 = 1;
      *(uint *)((int)&DAT_0064fee4 + param_1) = local_28;
      if (DAT_006513dc != '\0') {
        bVar5 = false;
        local_28 = local_48;
        local_24 = local_44;
        local_20 = local_40;
        if (((char)local_40 != '\0') && ((char)local_10 == '\0')) {
          local_28 = local_48 & 0xfffffffe;
          local_24 = local_44 & 0xfffffffe;
          local_18 = (uint)(CONCAT21((ushort)(byte)local_24 << 8,(char)local_48) & 0xfffffe) << 8;
          cVar6 = FUN_00464f90(*(undefined4 *)((int)&DAT_0064f4ae + param_1),&local_18);
          if (cVar6 != '\0') {
            iVar8 = 0;
            puVar7 = &DAT_00651370;
            do {
              if ((*puVar7 == local_28) && (puVar7[1] == local_24)) {
                bVar5 = true;
                break;
              }
              iVar8 = iVar8 + 1;
              puVar7 = (uint *)((int)puVar7 + 10);
            } while (iVar8 < 8);
          }
        }
        if (bVar5) {
          iVar8 = *(int *)((int)&DAT_0064fec8 + param_1);
          local_3c = 1;
          *(uint *)(puVar1 + iVar8 * 10 + 0x1e) = local_48;
          *(uint *)(puVar1 + iVar8 * 10 + 0x22) = local_44;
          *(undefined2 *)(puVar1 + iVar8 * 10 + 0x26) = local_40;
          *(int *)((int)&DAT_0064fec8 + param_1) = *(int *)((int)&DAT_0064fec8 + param_1) + 1;
          *puVar2 = *(uint *)((int)&DAT_0064f4be + param_1);
          *(undefined4 *)((int)&DAT_0064feda + param_1) =
               *(undefined4 *)((int)&DAT_0064f4c2 + param_1);
          *(undefined2 *)((int)&DAT_0064fede + param_1) =
               *(undefined2 *)((int)&DAT_0064f4c6 + param_1);
          goto LAB_00422421;
        }
        if ((char)local_40 == '\0') {
          *(undefined4 *)((int)&DAT_0064f4ae + param_1) = 0;
        }
      }
    }
    if (local_38 != 0) {
      iVar8 = *(int *)((int)&DAT_0064fec8 + param_1);
      local_3c = 1;
      *(uint *)(puVar1 + iVar8 * 10 + 0x1e) = *puVar2;
      *(undefined4 *)(puVar1 + iVar8 * 10 + 0x22) = *(undefined4 *)((int)&DAT_0064feda + param_1);
      *(undefined2 *)(puVar1 + iVar8 * 10 + 0x26) = *(undefined2 *)((int)&DAT_0064fede + param_1);
      *(int *)((int)&DAT_0064fec8 + param_1) = *(int *)((int)&DAT_0064fec8 + param_1) + 1;
      (&DAT_0064feec)[param_1] = 1;
      switch(local_1c) {
      case 0:
        if ((int)uVar4 < (int)local_44) {
LAB_004226bf:
          (&DAT_0064feec)[param_1] = 0;
        }
        break;
      case 1:
        if ((int)uVar3 < (int)local_48) goto LAB_004226bf;
        break;
      case 2:
        if ((int)local_44 < (int)uVar4) goto LAB_004226bf;
        break;
      case 3:
        if ((int)local_48 < (int)uVar3) goto LAB_004226bf;
      }
    }
    if ((local_48 != uVar3) || (local_44 != uVar4)) {
      if ((char)local_40 != '\0') {
        iVar8 = local_48 - uVar3;
        if (iVar8 < 0) {
          iVar8 = uVar3 - local_48;
        }
        if (iVar8 < 2) {
          iVar8 = local_44 - uVar4;
          if (iVar8 < 0) {
            iVar8 = uVar4 - local_44;
          }
          if (iVar8 < 2) goto LAB_00422421;
        }
      }
      if ((&DAT_0064feec)[param_1] != '\0') {
        switch(*(int *)((int)&DAT_0064fee4 + param_1)) {
        case 0:
          if ((int)uVar4 < (int)local_44) goto LAB_004228d7;
          break;
        case 1:
          if ((int)uVar3 < (int)local_48) goto LAB_004228d7;
          break;
        case 2:
          if ((int)local_44 < (int)uVar4) goto LAB_004228d7;
          break;
        case 3:
          if ((int)local_48 < (int)uVar3) goto LAB_004228d7;
        }
        switch(*(int *)((int)&DAT_0064fee0 + param_1) + *(int *)((int)&DAT_0064fee4 + param_1) & 3)
        {
        case 0:
          if ((int)local_44 < (int)uVar4) goto LAB_004228d7;
          break;
        case 1:
          if ((int)local_48 < (int)uVar3) goto LAB_004228d7;
          break;
        case 2:
          if ((int)uVar4 < (int)local_44) goto LAB_004228d7;
          break;
        case 3:
          if ((int)uVar3 < (int)local_48) goto LAB_004228d7;
        }
        if ((int)local_34 < (int)uVar3) {
          if (((int)(local_34 - 1) <= (int)local_48) && ((int)local_48 <= (int)(uVar3 + 1))) {
LAB_004227d4:
            if ((int)local_30 < (int)uVar4) {
              if (((int)(local_30 - 1) <= (int)local_44) && ((int)local_44 <= (int)(uVar4 + 1))) {
LAB_00422815:
                if ((local_34 != local_48) || (local_30 != local_44)) {
                  local_c = local_48;
                  local_8 = local_44;
                  local_4 = local_40;
                  if ((game_state._755277_1_ == '\0') ||
                     ((game_state._755278_1_ != '\0' &&
                      (*(char *)((int)&DAT_0064fede + param_1) != '\0')))) {
                    DAT_006513d7 = 0;
                  }
                  else {
                    DAT_006513d7 = 1;
                  }
                  cVar6 = FUN_00422020(&local_c,local_1c,puVar1);
                  if (cVar6 == '\0') {
                    iVar8 = *(int *)((int)&DAT_0064fee4 + param_1) * 10;
                    local_c = local_c + *(int *)(&DAT_0059bd90 + iVar8);
                    local_8 = local_8 + *(int *)(&DAT_0059bd94 + iVar8);
                    if (((local_c == uVar3) || (local_8 == uVar4)) ||
                       (cVar6 = FUN_00422020(&local_c,local_1c,puVar1), cVar6 == '\0'))
                    goto LAB_00422421;
                  }
                }
              }
            }
            else if (((int)local_30 <= (int)uVar4) ||
                    (((int)local_44 <= (int)(local_30 + 1) && ((int)(uVar4 - 1) <= (int)local_44))))
            goto LAB_00422815;
          }
        }
        else if (((int)local_34 <= (int)uVar3) ||
                (((int)local_48 <= (int)(local_34 + 1) && ((int)(uVar3 - 1) <= (int)local_48))))
        goto LAB_004227d4;
      }
LAB_004228d7:
      if (((DAT_006513d9 != '\0') && (DAT_00650919 == DAT_0064fed6)) &&
         (DAT_0065091d == DAT_0064feda)) {
        if ((DAT_00650927 + 2U & 3) == DAT_0064fee4) {
          DAT_006513da = 1;
          DAT_0064fee8 = 2;
          DAT_0065092b = 2;
        }
        else {
          DAT_006513d9 = '\0';
        }
      }
      goto LAB_00422938;
    }
  }
  else {
    iVar8 = *(int *)((int)&DAT_0064fec8 + param_1);
    local_3c = 1;
    *(uint *)(puVar1 + iVar8 * 10 + 0x1e) = *puVar2;
    *(undefined4 *)(puVar1 + iVar8 * 10 + 0x22) = *(undefined4 *)((int)&DAT_0064feda + param_1);
    *(undefined2 *)(puVar1 + iVar8 * 10 + 0x26) = *(undefined2 *)((int)&DAT_0064fede + param_1);
    *(int *)((int)&DAT_0064fec8 + param_1) = *(int *)((int)&DAT_0064fec8 + param_1) + 1;
    iVar8 = *(int *)((int)&DAT_0064fee4 + param_1) * 10;
    *puVar2 = *puVar2 + *(int *)(&DAT_0059bd90 + iVar8);
    *(int *)((int)&DAT_0064feda + param_1) =
         *(int *)((int)&DAT_0064feda + param_1) + *(int *)(&DAT_0059bd94 + iVar8);
    *(bool *)((int)&DAT_0064fede + param_1) = *(char *)((int)&DAT_0064fede + param_1) == '\0';
    iVar8 = *(int *)((int)&DAT_0064fec8 + param_1);
    *(uint *)(puVar1 + iVar8 * 10 + 0x1e) = *puVar2;
    *(undefined4 *)(puVar1 + iVar8 * 10 + 0x22) = *(undefined4 *)((int)&DAT_0064feda + param_1);
    *(undefined2 *)(puVar1 + iVar8 * 10 + 0x26) = *(undefined2 *)((int)&DAT_0064fede + param_1);
    *(int *)((int)&DAT_0064fec8 + param_1) = *(int *)((int)&DAT_0064fec8 + param_1) + 1;
  }
LAB_00422421:
  *(undefined4 *)((int)&DAT_0064fee8 + param_1) = 1;
  if (local_38 == 0) {
    iVar8 = *(int *)((int)&DAT_0064fec8 + param_1);
    local_3c = 1;
    *(uint *)(puVar1 + iVar8 * 10 + 0x1e) = *puVar2;
    *(undefined4 *)(puVar1 + iVar8 * 10 + 0x22) = *(undefined4 *)((int)&DAT_0064feda + param_1);
    *(undefined2 *)(puVar1 + iVar8 * 10 + 0x26) = *(undefined2 *)((int)&DAT_0064fede + param_1);
    *(int *)((int)&DAT_0064fec8 + param_1) = *(int *)((int)&DAT_0064fec8 + param_1) + 1;
  }
LAB_00422938:
  if ((local_3c != 0) &&
     ((uint)(int)(short)game_state._755270_2_ <=
      (uint)(*(int *)((int)&DAT_0064fec8 + param_1) + _DAT_00651344))) {
    *(undefined4 *)((int)&DAT_0064fee8 + param_1) = 2;
  }
  return;
}
