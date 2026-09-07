/* Ghidra 12.1.3 pseudocode; entry 0048c6b0; interpret_script_upper.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


undefined4 interpret_script_upper(int param_1,int param_2)

{
  short sVar1;
  ushort uVar2;
  ushort uVar3;
  ushort *puVar4;
  short *psVar5;
  int iVar6;
  int iVar7;
  bool bVar8;

  *(int *)(param_2 + 0x3104) = param_2;
  *(int *)(param_2 + 0x3100) = param_2 + 0x2000;
  *(short **)(param_2 + 0x3104) = (short *)(param_2 + 2);
  sVar1 = *(short *)(param_2 + 2);
  while (sVar1 != 0x3fb) {
    psVar5 = (short *)(*(int *)(param_2 + 0x3104) + 2);
    *(short **)(param_2 + 0x3104) = psVar5;
    sVar1 = *psVar5;
    while (sVar1 != 0x3ec) {
      puVar4 = *(ushort **)(param_2 + 0x3104);
      uVar2 = *puVar4;
      if (uVar2 < 0x3e9) {
        if (uVar2 == 1000) {
          iVar6 = 0;
          *(ushort **)(param_2 + 0x3104) = puVar4 + 1;
          switch(puVar4[1]) {
          case 0x3f4:
          case 0x3f5:
          case 0x3f6:
          case 0x3f7:
          case 0x3f8:
          case 0x3f9:
            iVar6 = FUN_0048f130(param_1,param_2);
            break;
          case 0x3fc:
          case 0x3fd:
            iVar6 = FUN_0048f230(param_1,param_2);
          }
          if (iVar6 == 0) {
            bVar8 = true;
            iVar6 = 0;
            do {
              psVar5 = *(short **)(param_2 + 0x3104);
              if (*psVar5 == 0x3eb) {
                iVar6 = iVar6 + 1;
              }
              else if (*psVar5 == 0x3ec) {
                iVar6 = iVar6 + -1;
              }
              if (iVar6 == 0) {
                bVar8 = false;
              }
              *(short **)(param_2 + 0x3104) = psVar5 + 1;
            } while (bVar8);
            if (psVar5[1] == 0x3e9) {
              *(short **)(param_2 + 0x3104) = psVar5 + 2;
              FUN_0048c980(param_1,param_2);
            }
          }
          else {
            FUN_0048c980(param_1,param_2);
            if (**(short **)(param_2 + 0x3104) == 0x3e9) {
              bVar8 = true;
              iVar6 = 0;
              *(short **)(param_2 + 0x3104) = *(short **)(param_2 + 0x3104) + 1;
              do {
                sVar1 = **(short **)(param_2 + 0x3104);
                if (sVar1 == 0x3eb) {
                  iVar6 = iVar6 + 1;
                }
                else if (sVar1 == 0x3ec) {
                  iVar6 = iVar6 + -1;
                }
                if (iVar6 == 0) {
                  bVar8 = false;
                }
                *(short **)(param_2 + 0x3104) = *(short **)(param_2 + 0x3104) + 1;
              } while (bVar8);
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
          iVar7 = 0;
          iVar6 = *(int *)(param_2 + 0x3100);
          *(ushort **)(param_2 + 0x3104) = puVar4 + 1;
          uVar2 = puVar4[1];
          *(ushort **)(param_2 + 0x3104) = puVar4 + 2;
          uVar3 = puVar4[2];
          if (uVar3 != 0x3eb) {
            iVar7 = get_tribe_data(param_1,param_2,iVar6 + (uint)uVar3 * 8);
            *(int *)(param_2 + 0x3104) = *(int *)(param_2 + 0x3104) + 2;
          }
          if ((*(uint *)(iVar6 + (uint)uVar2 * 8 + 4) &
              *(char *)(param_1 + 0xc22) + game_state.offset_counter_2 + iVar7) == 0) {
            FUN_0048c980(param_1,param_2);
          }
          else {
            bVar8 = true;
            iVar6 = 0;
            do {
              sVar1 = **(short **)(param_2 + 0x3104);
              if (sVar1 == 0x3eb) {
                iVar6 = iVar6 + 1;
              }
              else if (sVar1 == 0x3ec) {
                iVar6 = iVar6 + -1;
              }
              if (iVar6 == 0) {
                bVar8 = false;
              }
              *(short **)(param_2 + 0x3104) = *(short **)(param_2 + 0x3104) + 1;
            } while (bVar8);
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
    }
    psVar5 = (short *)(*(int *)(param_2 + 0x3104) + 2);
    *(short **)(param_2 + 0x3104) = psVar5;
    sVar1 = *psVar5;
  }
  return 1;
}
