/* Ghidra 12.1.3 pseudocode; entry 00570590; FUN_00570590.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


int * FUN_00570590(int param_1,int param_2,undefined4 param_3)

{
  byte bVar1;
  uint uVar2;
  code *pcVar3;
  short sVar4;
  undefined2 uVar5;
  int iVar6;
  int *piVar7;
  undefined4 uVar8;
  int iVar9;
  undefined4 *puVar10;
  undefined4 *puVar11;
  undefined4 *unaff_FS_OFFSET;
  undefined4 local_48 [10];
  undefined1 local_20 [8];
  undefined4 *local_18;
  void *local_14;
  undefined4 local_10;
  undefined1 *puStack_c;
  undefined4 local_8;

  local_10 = *unaff_FS_OFFSET;
  local_8 = 0xffffffff;
  puStack_c = &LAB_00570a0a;
  *unaff_FS_OFFSET = &local_10;
  local_18 = local_48;
  iVar6 = FUN_00570df0(&local_18,param_2,local_20);
  if (iVar6 != 0) {
    if (local_18[1] == 0) {
      if (param_1 != 0) {
        FUN_00576890();
      }
    }
    else {
      if (param_1 != 0) {
        puVar10 = local_18;
        puVar11 = (undefined4 *)(param_1 + 0x40);
        for (iVar6 = 10; iVar6 != 0; iVar6 = iVar6 + -1) {
          *puVar11 = *puVar10;
          puVar10 = puVar10 + 1;
          puVar11 = puVar11 + 1;
        }
        if ((*(byte *)(param_2 + 0x16) & 4) != 0) {
          *(undefined4 *)(param_1 + 0x90) = *(undefined4 *)(param_2 + 0x1c);
        }
      }
      uVar2 = *(uint *)(param_2 + 0xc);
      if ((uVar2 & 0x8000) == 0) {
        bVar1 = *(byte *)((int)local_18 + 0x1b);
        if ((bVar1 & 0x20) == 0) {
          if ((bVar1 & 0x10) == 0) {
            if ((bVar1 & 0x80) == 0) {
              if ((bVar1 & 0x40) != 0) {
                FUN_00574e10(param_2);
                goto LAB_005705cc;
              }
              if ((param_1 == 0) || (*(char *)(param_1 + 0x20) == '\0')) {
                if ((uVar2 & 0x20000) == 0) {
                  local_14 = operator_new(0x44);
                  iVar6 = 0;
                  local_8 = 9;
                  if (local_14 != (void *)0x0) {
                    iVar6 = FUN_00577680(local_18);
                  }
                }
                else {
                  local_14 = operator_new(0x48);
                  iVar6 = 0;
                  local_8 = 8;
                  if (local_14 != (void *)0x0) {
                    puVar10 = local_18;
                    uVar8 = FUN_0056e050(*(undefined4 *)(param_2 + 4));
                    iVar6 = FUN_00577820(uVar8,puVar10);
                  }
                }
              }
              else {
                local_14 = operator_new(0x48);
                local_8 = 7;
                if (local_14 == (void *)0x0) {
                  iVar6 = 0;
                }
                else {
                  iVar6 = FUN_00577730(local_18,*(ushort *)(param_1 + 0x58) >> 1);
                }
              }
            }
            else if ((param_1 == 0) || (*(char *)(param_1 + 0x20) == '\0')) {
              local_14 = operator_new(0x44);
              local_8 = 6;
              iVar6 = 0;
              if (local_14 != (void *)0x0) {
                iVar6 = FUN_00577880(local_18);
              }
            }
            else {
              local_14 = operator_new(0x44);
              local_8 = 5;
              if (local_14 == (void *)0x0) {
                iVar6 = 0;
              }
              else {
                iVar6 = FUN_005778b0(local_18,*(ushort *)(param_1 + 0x58) >> 1);
              }
            }
          }
          else if ((uVar2 & 0x20000) == 0) {
            local_14 = operator_new(0x5c);
            local_8 = 4;
            iVar6 = 0;
            if (local_14 != (void *)0x0) {
              iVar6 = FUN_00577960(local_18);
            }
          }
          else {
            local_14 = operator_new(0x68);
            local_8 = 3;
            iVar6 = 0;
            if (local_14 != (void *)0x0) {
              puVar10 = local_18;
              uVar8 = FUN_0056e050(*(undefined4 *)(param_2 + 4));
              iVar6 = FUN_00577c30(uVar8,puVar10);
            }
          }
        }
        else if ((uVar2 & 0x20000) == 0) {
          local_14 = operator_new(0x50);
          local_8 = 2;
          iVar6 = 0;
          if (local_14 != (void *)0x0) {
            iVar6 = FUN_00577df0(local_18);
          }
        }
        else {
          local_14 = operator_new(0x60);
          local_8 = 1;
          iVar6 = 0;
          if (local_14 != (void *)0x0) {
            puVar10 = local_18;
            uVar8 = FUN_0056e050(*(undefined4 *)(param_2 + 4));
            iVar6 = FUN_00578030(uVar8,puVar10);
          }
        }
      }
      else {
        local_14 = operator_new(0x44);
        local_8 = 0;
        iVar6 = 0;
        if (local_14 != (void *)0x0) {
          iVar6 = FUN_00578260(local_18);
        }
      }
      local_8 = 0xffffffff;
      piVar7 = (int *)0x0;
      if (iVar6 == 0) goto LAB_005705ce;
      piVar7 = *(int **)(param_2 + 4);
      *(int **)(iVar6 + 0x1c) = piVar7;
      (**(code **)(*piVar7 + 4))();
      piVar7 = (int *)FUN_00570260(param_2,local_18,iVar6);
      if (piVar7 != (int *)0x0) {
        iVar6 = *piVar7;
        (**(code **)(iVar6 + 0x2c))(param_3);
        iVar9 = (**(code **)(iVar6 + 0x28))(param_2);
        if (iVar9 == 0) {
          if ((param_1 != 0) && ((*(byte *)((int)local_18 + 0x1b) & 0x20) != 0)) {
            pcVar3 = *(code **)(iVar6 + 0x54);
            sVar4 = (*pcVar3)();
            if (sVar4 != *(short *)(param_1 + 0x58)) {
              uVar5 = (*pcVar3)();
              *(undefined1 *)(param_1 + 0x20) = 1;
              *(undefined2 *)(param_1 + 0x58) = uVar5;
            }
          }
          uVar2 = *(uint *)(param_2 + 0x14);
          *(uint *)(param_2 + 0x14) = uVar2 & 0xffffff7f;
          *(uint *)(param_2 + 0x14) = uVar2 & 0xffffff77;
          *(uint *)(param_2 + 0x14) = uVar2 & 0xffffff37;
          goto LAB_005705ce;
        }
        free_2(piVar7);
      }
    }
  }
LAB_005705cc:
  piVar7 = (int *)0x0;
LAB_005705ce:
  *unaff_FS_OFFSET = local_10;
  return piVar7;
}
