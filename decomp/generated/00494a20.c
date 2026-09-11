/* Ghidra 12.1.3 pseudocode; entry 00494a20; FUN_00494a20.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


int FUN_00494a20(int param_1,int param_2)

{
  int *piVar1;
  int iVar2;
  byte bVar3;
  short sVar4;
  short sVar5;
  undefined2 *puVar6;
  short *psVar7;
  int iVar8;
  bool bVar9;
  undefined2 uVar11;
  int iVar10;
  int iVar12;
  unit_related_14B *puVar13;
  short *psVar14;
  int local_c;
  int local_8;
  int local_4;

  local_c = 0;
  do {
    if ((param_2 == 0) || ((int)game_state._644608_4_ < 1)) {
      game_state.start_1 = game_state.start_1;
      game_state._644601_3_ = game_state._644601_3_;
      return local_c;
    }
    local_4 = 0;
    local_c = param_1;
    if (param_2 == 0) {
      game_state.start_1 = game_state.start_1;
      game_state._644601_3_ = game_state._644601_3_;
      return param_1;
    }
    do {
      if (((int)game_state._644608_4_ < 1) || ((int)game_state._644600_4_ <= local_4)) break;
      if (0x77 < local_c) {
        local_c = 0;
      }
      iVar2 = local_c * 0x18;
      if (((&game_state.field_0x9d62b)[iVar2] & 1) != 0) {
        sVar4 = *(short *)(&game_state.field_0x9d638 + iVar2);
        uVar11 = (undefined2)((uint)local_c >> 0x10);
        local_4 = local_4 + 1;
        if (sVar4 == 0) {
          param_2 = param_2 + -1;
          if (param_2 == 0) {
            local_c = local_c + 1;
          }
        }
        else {
          local_8 = 0;
          puVar6 = *(undefined2 **)(&game_state.field_0x9d63c + iVar2);
          while( true ) {
            if (((param_2 == 0) || (puVar6 == (undefined2 *)0x0)) ||
               (*(short *)(&game_state.field_0x9d632 + iVar2) < 1)) goto LAB_00494b4f;
            if ((*(byte *)(puVar6 + 2) & 2) == 0) break;
            puVar6 = *(undefined2 **)(puVar6 + 5);
          }
          psVar7 = puVar6 + 1;
          sVar5 = *psVar7;
          iVar10 = FUN_00494d10(CONCAT22(uVar11,*(undefined2 *)(&game_state.field_0x9d62c + iVar2)),
                                *puVar6,unit_land_array[sVar4],psVar7,
                                CONCAT31((int3)(CONCAT22(uVar11,sVar4) >> 8),
                                         (&game_state.field_0x9d62a)[iVar2]));
          if (iVar10 == 0) {
            if (*psVar7 != sVar5) {
              local_8 = 1;
              *(byte *)(puVar6 + 2) = *(byte *)(puVar6 + 2) | 8;
            }
          }
          else {
            *(byte *)(puVar6 + 2) = *(byte *)(puVar6 + 2) | 4;
          }
          *(byte *)(puVar6 + 2) = *(byte *)(puVar6 + 2) | 2;
          *(short *)(&game_state.field_0x9d632 + iVar2) =
               *(short *)(&game_state.field_0x9d632 + iVar2) + -1;
          game_state._644608_4_ = game_state._644608_4_ + -1;
          FUN_00495390(iVar2 + 0x93a7a0);
          param_2 = param_2 + -1;
LAB_00494b4f:
          if (local_8 != 0) {
LAB_00494b5a:
            for (psVar7 = *(short **)(&game_state.field_0x9d63c + iVar2); psVar7 != (short *)0x0;
                psVar7 = *(short **)(psVar7 + 5)) {
              if ((*(byte *)(psVar7 + 2) & 8) != 0) {
                sVar4 = *psVar7;
                bVar3 = *(byte *)(psVar7 + 2);
                sVar5 = psVar7[1];
                if ((bVar3 & 2) == 0) {
                  *(short *)(&game_state.field_0x9d632 + iVar2) =
                       *(short *)(&game_state.field_0x9d632 + iVar2) + -1;
                  game_state._644608_4_ = game_state._644608_4_ + -1;
                }
                *(byte *)(psVar7 + 2) = *(byte *)(psVar7 + 2) & 0xfe;
                piVar1 = (int *)(psVar7 + 5);
                if (*(int *)(psVar7 + 3) == 0) {
                  *(int *)(&game_state.field_0x9d63c + iVar2) = *piVar1;
                }
                else {
                  *(int *)(*(int *)(psVar7 + 3) + 10) = *piVar1;
                }
                if (*piVar1 != 0) {
                  *(undefined4 *)(*piVar1 + 6) = *(undefined4 *)(psVar7 + 3);
                }
                *(short *)(&game_state.field_0x9d630 + iVar2) =
                     *(short *)(&game_state.field_0x9d630 + iVar2) + -1;
                bVar9 = false;
                psVar7 = *(short **)(&game_state.field_0x9d63c + iVar2);
                psVar14 = (short *)0x0;
                goto joined_r0x00494bcf;
              }
            }
            goto LAB_00494cbe;
          }
        }
      }
LAB_00494cd5:
      if (param_2 == 0) {
        return local_c;
      }
      local_c = local_c + 1;
    } while (param_2 != 0);
  } while( true );
joined_r0x00494bcf:
  if (psVar7 == (short *)0x0) goto LAB_00494bf1;
  if (*psVar7 == sVar4) {
    bVar9 = true;
    goto LAB_00494bf1;
  }
  if (psVar7[1] < sVar5) {
    psVar14 = psVar7;
  }
  psVar7 = *(short **)(psVar7 + 5);
  goto joined_r0x00494bcf;
LAB_00494bf1:
  if (bVar9) {
    iVar10 = (int)(psVar7 + -0x49d970) / 0xe;
  }
  else {
    iVar12 = 0;
    puVar13 = game_state.unit_related_array_14B + 1;
    do {
      iVar10 = iVar12;
      if ((puVar13->field_0x4 & 1) == 0) break;
      iVar12 = iVar12 + 1;
      puVar13 = puVar13 + 1;
      iVar10 = -1;
    } while (iVar12 < 0x1e00);
    if (iVar10 != -1) {
      puVar13->field_0x4 = 1;
      *(short *)puVar13 = sVar4;
      *(short *)&puVar13->field_0x2 = sVar5;
      if (iVar10 != -1) {
        iVar12 = iVar10 * 0xe + 0x93b2e0;
        if (psVar14 == (short *)0x0) {
          game_state.unit_related_array_14B[iVar10 + 1].field6_0x6 = 0;
          game_state.unit_related_array_14B[iVar10 + 1].field7_0xa =
               *(undefined4 *)(&game_state.field_0x9d63c + iVar2);
          *(int *)(&game_state.field_0x9d63c + iVar2) = iVar12;
          iVar8 = game_state.unit_related_array_14B[iVar10 + 1].field7_0xa;
        }
        else {
          iVar8 = *(int *)(psVar14 + 5);
          *(int *)(psVar14 + 5) = iVar12;
          game_state.unit_related_array_14B[iVar10 + 1].field6_0x6 = psVar14;
          game_state.unit_related_array_14B[iVar10 + 1].field7_0xa = iVar8;
        }
        if (iVar8 != 0) {
          *(int *)(iVar8 + 6) = iVar12;
        }
        *(short *)(&game_state.field_0x9d630 + iVar2) =
             *(short *)(&game_state.field_0x9d630 + iVar2) + 1;
        *(short *)(&game_state.field_0x9d632 + iVar2) =
             *(short *)(&game_state.field_0x9d632 + iVar2) + 1;
        game_state._644608_4_ = game_state._644608_4_ + 1;
      }
    }
  }
  *(short *)(&game_state.field_0x9d632 + iVar2) = *(short *)(&game_state.field_0x9d632 + iVar2) + -1
  ;
  game_state._644608_4_ = game_state._644608_4_ + -1;
  local_8 = local_8 + -1;
  game_state.unit_related_array_14B[iVar10 + 1].field_0x4 = bVar3;
  game_state.unit_related_array_14B[iVar10 + 1].field_0x4 = bVar3 & 0xf7;
LAB_00494cbe:
  if (local_8 == 0) goto LAB_00494cd5;
  goto LAB_00494b5a;
}
