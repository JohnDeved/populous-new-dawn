/* Ghidra 12.1.3 pseudocode; entry 004772e0; FUN_004772e0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_004772e0(int param_1)

{
  byte bVar1;
  bool bVar2;
  char cVar3;
  short sVar4;
  uint uVar5;
  uint uVar6;
  int iVar7;
  int iVar8;
  undefined4 uVar9;
  int iVar10;

  bVar2 = false;
  cVar3 = *(char *)(param_1 + 0x2d);
  if (cVar3 == '\0') {
    if ((*(uint *)(param_1 + 0xc) & 0x40000000) != 0) {
      *(undefined1 *)(param_1 + 0x88) = 0;
      *(undefined1 *)(param_1 + 0x84) = 1;
      *(undefined1 *)(param_1 + 0x85) = 1;
      *(undefined1 *)(param_1 + 0x86) = 1;
      *(undefined2 *)(param_1 + 0x72) = 0x80;
      *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) & 0xbfffffff;
    }
    if (*(char *)(param_1 + 0x84) != '\0') {
      cVar3 = FUN_00477d50(param_1);
      *(bool *)(param_1 + 0x84) = cVar3 == '\0';
    }
    if (*(char *)(param_1 + 0x86) != '\0') {
      cVar3 = FUN_004781d0(param_1);
      *(bool *)(param_1 + 0x86) = cVar3 == '\0';
    }
    if (*(char *)(param_1 + 0x84) == '\0') {
      *(undefined1 *)(param_1 + 0x2d) = 1;
      *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) | 0x40000000;
    }
  }
  else if (cVar3 == '\x01') {
    if ((*(uint *)(param_1 + 0xc) & 0x40000000) != 0) {
      *(undefined2 *)(param_1 + 0x6c) = 0x18;
      *(undefined2 *)(param_1 + 0x74) = 100;
      *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) & 0xbfffffff;
      FUN_00478860(param_1);
    }
    if ((*(short *)(param_1 + 0x6c) != 0) &&
       (sVar4 = *(short *)(param_1 + 0x6c) + -1, *(short *)(param_1 + 0x6c) = sVar4, sVar4 == 0)) {
      *(undefined1 *)(param_1 + 0x87) = 1;
    }
    if (*(char *)(param_1 + 0x87) != '\0') {
      cVar3 = FUN_004780e0(param_1);
      *(bool *)(param_1 + 0x87) = cVar3 == '\0';
    }
    if ((((*(short *)(param_1 + 0x6c) == 0) && (*(char *)(param_1 + 0x87) == '\0')) &&
        (*(short *)(param_1 + 0x74) != 0)) &&
       (sVar4 = *(short *)(param_1 + 0x74) + -1, *(short *)(param_1 + 0x74) = sVar4, sVar4 == 0)) {
      *(undefined1 *)(param_1 + 0x2d) = 2;
      *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) | 0x40000000;
    }
  }
  else if (cVar3 == '\x02') {
    if ((*(uint *)(param_1 + 0xc) & 0x40000000) != 0) {
      *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) & 0xbfffffff;
      uVar6 = game_state.pseudo_random_val * 0x24a1 + 0x24df;
      uVar5 = uVar6 >> 0xd;
      game_state.pseudo_random_val = uVar5 | uVar6 * 0x80000;
      *(undefined2 *)(param_1 + 0x7a) = 0x26;
      *(undefined2 *)(param_1 + 0x78) = 0x80;
      *(ushort *)(param_1 + 0x76) = ((ushort)uVar5 & 0x1f) + 0x20;
    }
    if ((*(short *)(param_1 + 0x7a) != 0) &&
       (sVar4 = *(short *)(param_1 + 0x7a) + -1, *(short *)(param_1 + 0x7a) = sVar4, sVar4 == 0)) {
      FUN_00478500(param_1);
      bVar2 = true;
    }
    if (*(short *)(param_1 + 0x7a) == 0) {
      FUN_00478610(param_1);
      if (*(short *)(param_1 + 0x78) != 0) {
        *(short *)(param_1 + 0x78) = *(short *)(param_1 + 0x78) + -1;
      }
    }
  }
  bVar1 = *(byte *)(param_1 + 0x88);
  if (((bVar1 != 0) && ((*(byte *)(param_1 + 0x2e) & 0x1f) == 0)) && (bVar1 < 4)) {
    *(byte *)(param_1 + 0x88) = bVar1 + 1;
  }
  iVar8 = 0;
  iVar10 = 0x89d1c8;
  if (game_state.num_tribes != 0) {
    do {
      cVar3 = FUN_00419480(iVar8);
      if (cVar3 == '\0') {
        if (*(char *)(param_1 + 0x2d) == '\x01') {
          iVar7 = (int)*(short *)(iVar10 + 0xa99);
          if (0 < iVar7) {
            if (iVar7 < 6) {
              uVar9 = 0x2d;
            }
            else {
              uVar9 = 0x2e;
              if (0x11 < iVar7) {
                uVar9 = 0x2f;
              }
            }
            iVar7 = *(int *)(iVar10 + 0x91d) - iVar7;
            uVar5 = (int)(iVar7 + (iVar7 >> 0x1f & 3U)) >> 2;
            if ((int)uVar5 < 2) {
              uVar5 = 2;
            }
            uVar6 = game_state.pseudo_random_val * 0x24a1 + 0x24df;
            game_state.pseudo_random_val = uVar6 >> 0xd | uVar6 * 0x80000;
            if (game_state.pseudo_random_val % uVar5 == 1) {
              FUN_0048a050(*(undefined4 *)(iVar10 + 0x881),uVar9,0);
            }
          }
        }
        else if ((((*(char *)(param_1 + 0x2d) == '\x02') && (*(short *)(param_1 + 0x7a) == 0)) &&
                 (*(short *)(param_1 + 0x78) != 0)) &&
                (uVar6 = game_state.pseudo_random_val * 0x24a1 + 0x24df, uVar5 = uVar6 >> 0xd,
                game_state.pseudo_random_val = uVar5 | uVar6 * 0x80000, (uVar5 & 1) == 0)) {
          bVar2 = true;
        }
        if (bVar2) {
          FUN_0048a050(*(undefined4 *)(iVar10 + 0x881),0x30,0);
        }
      }
      iVar8 = iVar8 + 1;
      iVar10 = iVar10 + 0xc65;
    } while (iVar8 < (int)(uint)game_state.num_tribes);
  }
  if ((*(byte *)(param_1 + 0x2e) & 7) == 0) {
    iVar8 = 0;
    if (game_state.num_tribes != 0) {
      do {
        FUN_00419480(iVar8);
        iVar8 = iVar8 + 1;
      } while (iVar8 < (int)(uint)game_state.num_tribes);
    }
    if ((((byte)land_flags_1 & 8) == 0) && ((land_flags_1._3_1_ & 2) != 0)) {
      *(undefined1 *)(param_1 + 0x8a) = 1;
    }
  }
  if ((*(char *)(param_1 + 0x8a) != '\0') &&
     (FUN_00477780(0), game_state.some_unit != (unit_struct *)0x0)) {
    update_after_unit_alloc(game_state.some_unit);
    game_state.some_unit = (unit_struct *)0x0;
  }
  return;
}
