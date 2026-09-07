/* Ghidra 12.1.3 pseudocode; entry 0048c980; FUN_0048c980.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


undefined4 FUN_0048c980(int param_1,int param_2)

{
  short sVar1;
  ushort uVar2;
  ushort uVar3;
  ushort *puVar4;
  bool bVar5;
  short *psVar6;
  int iVar7;
  int iVar8;

  psVar6 = (short *)(*(int *)(param_2 + 0x3104) + 2);
  *(short **)(param_2 + 0x3104) = psVar6;
  sVar1 = *psVar6;
  do {
    if (sVar1 == 0x3ec) {
      *(int *)(param_2 + 0x3104) = *(int *)(param_2 + 0x3104) + 2;
      return 1;
    }
    puVar4 = *(ushort **)(param_2 + 0x3104);
    uVar2 = *puVar4;
    if (uVar2 < 0x3e9) {
      if (uVar2 == 1000) {
        iVar7 = 0;
        *(ushort **)(param_2 + 0x3104) = puVar4 + 1;
        uVar2 = puVar4[1];
        switch(uVar2) {
        case 0x3f4:
        case 0x3f5:
        case 0x3f6:
        case 0x3f7:
        case 0x3f8:
        case 0x3f9:
          iVar7 = FUN_0048f130(param_1,param_2);
          break;
        case 0x3fc:
        case 0x3fd:
          *(ushort **)(param_2 + 0x3104) = puVar4 + 2;
          iVar7 = FUN_0048f060(param_1,param_2);
          iVar8 = FUN_0048f060(param_1,param_2);
          if (uVar2 == 0x3fc) {
            if ((iVar7 == 0) || (iVar8 == 0)) {
              iVar7 = 0;
            }
            else {
LAB_0048ca6e:
              iVar7 = 1;
            }
          }
          else if (uVar2 == 0x3fd) {
            if ((iVar7 != 0) || (iVar7 = 0, iVar8 != 0)) goto LAB_0048ca6e;
          }
          else {
            iVar7 = 0;
          }
        }
        if (iVar7 == 0) {
          bVar5 = true;
          iVar7 = 0;
          do {
            psVar6 = *(short **)(param_2 + 0x3104);
            if (*psVar6 == 0x3eb) {
              iVar7 = iVar7 + 1;
            }
            else if (*psVar6 == 0x3ec) {
              iVar7 = iVar7 + -1;
            }
            if (iVar7 == 0) {
              bVar5 = false;
            }
            *(short **)(param_2 + 0x3104) = psVar6 + 1;
          } while (bVar5);
          if (psVar6[1] == 0x3e9) {
            *(short **)(param_2 + 0x3104) = psVar6 + 2;
            FUN_0048c980(param_1,param_2);
          }
        }
        else {
          FUN_0048c980(param_1,param_2);
          if (**(short **)(param_2 + 0x3104) == 0x3e9) {
            bVar5 = true;
            *(short **)(param_2 + 0x3104) = *(short **)(param_2 + 0x3104) + 1;
            iVar7 = 0;
            do {
              sVar1 = **(short **)(param_2 + 0x3104);
              if (sVar1 == 0x3eb) {
                iVar7 = iVar7 + 1;
              }
              else if (sVar1 == 0x3ec) {
                iVar7 = iVar7 + -1;
              }
              if (iVar7 == 0) {
                bVar5 = false;
              }
              *(short **)(param_2 + 0x3104) = *(short **)(param_2 + 0x3104) + 1;
            } while (bVar5);
          }
        }
        *(int *)(param_2 + 0x3104) = *(int *)(param_2 + 0x3104) + 2;
      }
      else if (uVar2 == 0) {
        *puVar4 = 0x3ec;
      }
    }
    else {
      switch(uVar2) {
      case 0x3ed:
        iVar8 = 0;
        iVar7 = *(int *)(param_2 + 0x3100);
        *(ushort **)(param_2 + 0x3104) = puVar4 + 1;
        uVar2 = puVar4[1];
        *(ushort **)(param_2 + 0x3104) = puVar4 + 2;
        uVar3 = puVar4[2];
        if (uVar3 != 0x3eb) {
          iVar8 = get_tribe_data(param_1,param_2,iVar7 + (uint)uVar3 * 8);
          *(int *)(param_2 + 0x3104) = *(int *)(param_2 + 0x3104) + 2;
        }
        if ((*(uint *)(iVar7 + (uint)uVar2 * 8 + 4) &
            *(char *)(param_1 + 0xc22) + game_state.offset_counter_2 + iVar8) == 0) {
          FUN_0048c980(param_1,param_2);
        }
        else {
          bVar5 = true;
          iVar7 = 0;
          do {
            sVar1 = **(short **)(param_2 + 0x3104);
            if (sVar1 == 0x3eb) {
              iVar7 = iVar7 + 1;
            }
            else if (sVar1 == 0x3ec) {
              iVar7 = iVar7 + -1;
            }
            if (iVar7 == 0) {
              bVar5 = false;
            }
            *(short **)(param_2 + 0x3104) = *(short **)(param_2 + 0x3104) + 1;
          } while (bVar5);
        }
        break;
      case 0x3ee:
        interpret_script(param_1,param_2);
        break;
      case 0x3ef:
      case 0x3f0:
      case 0x3f1:
        FUN_0048ef00(param_1,param_2);
        break;
      case 0x401:
      case 0x402:
        FUN_0048ed90(param_1,param_2);
      }
    }
    sVar1 = **(short **)(param_2 + 0x3104);
  } while( true );
}
