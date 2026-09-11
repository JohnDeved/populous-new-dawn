/* Ghidra 12.1.3 pseudocode; entry 00493af0; FUN_00493af0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_00493af0(void)

{
  int *piVar1;
  byte bVar2;
  unit_struct *puVar3;
  bool bVar4;
  undefined4 uVar5;
  undefined4 uVar6;
  short sVar7;
  int iVar8;
  unit_struct *puVar9;
  int iVar10;
  int iVar11;
  int local_4;

  uVar5 = game_state._644636_4_;
  if (0 < (int)game_state._644600_4_) {
    game_state._644628_4_ = game_state._644628_4_ + -1;
    uVar6 = game_state._644628_4_;
    iVar8 = uVar5;
    if ((int)game_state._644628_4_ < 1) {
      iVar8 = 0;
      iVar11 = game_state._644620_4_;
      do {
        uVar6 = game_state._644612_4_;
        if (((iVar11 == 0) || (uVar6 = game_state._644612_4_, (int)game_state._644604_4_ < 1)) ||
           (iVar10 = 0, iVar8 = uVar5, uVar6 = game_state._644612_4_, iVar11 == 0)) break;
        do {
          if (((int)game_state._644604_4_ < 1) || ((int)game_state._644600_4_ <= iVar10)) break;
          if (0x77 < iVar8) {
            iVar8 = 0;
          }
          if ((((&game_state.field_0x9d62b)[iVar8 * 0x18] & 1) != 0) &&
             (iVar10 = iVar10 + 1, ((&game_state.field_0x9d62b)[iVar8 * 0x18] & 2) != 0)) {
            iVar11 = iVar11 + -1;
            FUN_00493fa0(iVar8 * 0x18 + 0x93a7a0);
          }
          iVar8 = iVar8 + 1;
        } while (iVar11 != 0);
      } while( true );
    }
    game_state._644636_4_ = iVar8;
    game_state._644628_4_ = uVar6;
    game_state._644632_4_ = game_state._644632_4_ + -1;
    if ((int)game_state._644632_4_ < 1) {
      game_state._644640_4_ = FUN_00494a20(game_state._644640_4_,game_state._644624_4_);
      game_state._644632_4_ = game_state._644616_4_;
    }
    iVar11 = 0;
    iVar8 = 0x93a7a0;
    bVar4 = false;
    while (iVar11 < (int)game_state._644600_4_) {
      if ((*(byte *)(iVar8 + 3) & 1) != 0) {
        *(short *)(iVar8 + 0xc) = *(short *)(iVar8 + 0xc) + 1;
        iVar11 = iVar11 + 1;
        if (*(ushort *)(iVar8 + 0x10) != 0) {
          puVar3 = unit_land_array[*(ushort *)(iVar8 + 0x10)];
          puVar9 = (unit_struct *)0x0;
          if (((puVar3->flags_2 & 1) == 0) && (puVar3->unit_class != '\0')) {
            puVar9 = puVar3;
          }
          if (puVar9 == (unit_struct *)0x0) {
            *(undefined2 *)(iVar8 + 0x10) = 0;
          }
        }
        sVar7 = *(short *)(iVar8 + 0xe) + 1;
        *(short *)(iVar8 + 0xe) = sVar7;
        if (0x140 < sVar7) {
          *(byte *)(iVar8 + 3) = *(byte *)(iVar8 + 3) | 8;
          bVar4 = true;
        }
      }
      iVar8 = iVar8 + 0x18;
    }
    if (bVar4) {
      iVar8 = 0x93a7a0;
      local_4 = 0x78;
      do {
        bVar2 = *(byte *)(iVar8 + 3);
        if ((bVar2 & 8) != 0) {
          if ((bVar2 & 2) != 0) {
            *(byte *)(iVar8 + 3) = bVar2 & 0xfd;
            if (0 < (int)game_state._644604_4_) {
              game_state._644604_4_ = game_state._644604_4_ + -1;
            }
            game_state._644612_4_ = 1;
            game_state._644620_4_ = 2;
            game_state._644616_4_ = 3;
            game_state._644624_4_ = 1;
            if ((int)game_state._644608_4_ < 1000) {
              if ((int)game_state._644608_4_ < 500) {
                if (299 < (int)game_state._644608_4_) {
                  game_state._644616_4_ = 1;
                  game_state._644624_4_ = 1;
                }
              }
              else {
                game_state._644616_4_ = 1;
                game_state._644624_4_ = 2;
              }
            }
            else {
              game_state._644624_4_ = 3;
              game_state._644616_4_ = 1;
            }
          }
          iVar11 = *(int *)(iVar8 + 0x14);
          while (iVar11 != 0) {
            if ((*(byte *)(iVar11 + 4) & 2) == 0) {
              *(short *)(iVar8 + 10) = *(short *)(iVar8 + 10) + -1;
              game_state._644608_4_ = game_state._644608_4_ + -1;
            }
            *(byte *)(iVar11 + 4) = *(byte *)(iVar11 + 4) & 0xfe;
            piVar1 = (int *)(iVar11 + 10);
            if (*(int *)(iVar11 + 6) == 0) {
              *(int *)(iVar8 + 0x14) = *piVar1;
            }
            else {
              *(int *)(*(int *)(iVar11 + 6) + 10) = *piVar1;
            }
            if (*piVar1 != 0) {
              *(undefined4 *)(*piVar1 + 6) = *(undefined4 *)(iVar11 + 6);
            }
            *(short *)(iVar8 + 8) = *(short *)(iVar8 + 8) + -1;
            iVar11 = *piVar1;
          }
          bVar2 = *(byte *)(iVar8 + 3);
          *(byte *)(iVar8 + 3) = bVar2 & 0xfe;
          *(byte *)(iVar8 + 3) = bVar2 & 0xf6;
          game_state._644600_4_ = game_state._644600_4_ + -1;
        }
        iVar8 = iVar8 + 0x18;
        local_4 = local_4 + -1;
      } while (local_4 != 0);
    }
  }
  return;
}
