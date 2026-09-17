/* Ghidra 12.1.3 pseudocode; entry 00477890; FUN_00477890.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


undefined4 FUN_00477890(int param_1)

{
  byte *pbVar1;
  unit_struct *puVar2;
  unit_struct *puVar3;
  char cVar4;
  short sVar5;
  unit_struct *puVar6;
  int iVar7;
  short *psVar8;
  int iVar9;
  int iVar10;
  short *psVar11;
  int local_54;
  int local_50;
  int local_4c;
  short local_48 [36];

  iVar9 = 0;
  iVar10 = 1;
  if (game_state.num_tribes != 0) {
    psVar11 = local_48;
    iVar7 = 0x89d1c8;
    do {
      cVar4 = FUN_00419480(iVar9);
      if ((cVar4 == '\0') && (iVar10 < *(int *)(iVar7 + 0x91d))) {
        iVar10 = *(int *)(iVar7 + 0x91d);
      }
      iVar9 = iVar9 + 1;
      *(undefined4 *)psVar11 = *(undefined4 *)(iVar7 + 0xa27);
      *(undefined4 *)(psVar11 + 2) = *(undefined4 *)(iVar7 + 0xa2b);
      *(undefined4 *)(psVar11 + 4) = *(undefined4 *)(iVar7 + 0xa2f);
      *(undefined4 *)(psVar11 + 6) = *(undefined4 *)(iVar7 + 0xa33);
      psVar11[8] = *(short *)(iVar7 + 0xa37);
      psVar11 = psVar11 + 9;
      iVar7 = iVar7 + 0xc65;
    } while (iVar9 < (int)(uint)game_state.num_tribes);
  }
  if (iVar10 < 0x79) {
    iVar10 = 0x1000;
  }
  else {
    iVar10 = (int)(0x78000 / (longlong)iVar10);
  }
  iVar9 = 0;
  puVar2 = allocated_units;
  puVar6 = unit_array_ptr_1;
  if (game_state.num_tribes != 0) {
    psVar11 = local_48 + 1;
    do {
      cVar4 = FUN_00419480(iVar9);
      if (cVar4 == '\0') {
        iVar7 = 1;
        psVar8 = psVar11;
        do {
          if (((iVar7 == 1) || (iVar7 == 7)) || (iVar7 == 8)) {
            *psVar8 = 0;
          }
          else if ((0 < *psVar8) &&
                  (sVar5 = (short)(*psVar8 * iVar10 >> 0xc), *psVar8 = sVar5, sVar5 < 1)) {
            *psVar8 = 1;
          }
          psVar8 = psVar8 + 1;
          iVar7 = iVar7 + 1;
        } while (iVar7 < 9);
      }
      psVar11 = psVar11 + 9;
      iVar9 = iVar9 + 1;
      puVar2 = allocated_units;
      puVar6 = unit_array_ptr_1;
    } while (iVar9 < (int)(uint)game_state.num_tribes);
  }
  while (puVar3 = puVar2, unit_array_ptr_1 = puVar6, puVar3 != (unit_struct *)0x0) {
    puVar2 = puVar3->next_unit_1;
    if (((puVar3->unit_class == '\x01') && (puVar3->tribe_index != -1)) &&
       (puVar3->unit_type != '\a')) {
      FUN_004ef180(puVar3);
      puVar6 = unit_array_ptr_1;
    }
  }
  if (puVar6 < unit_array_ptr_end_1) {
    do {
      if ((*(byte *)&puVar6->flags_2 & 1) != 0) {
        puVar6->unit_class = 0;
        puVar6->flags_2 = puVar6->flags_2 & 0xfffffffe;
      }
      puVar6 = puVar6 + 1;
    } while (puVar6 < unit_array_ptr_end_1);
  }
  update_unit_lists();
  init_tribe_struct();
  local_4c = 0x89d1c8;
  local_54 = 0;
  if (game_state.num_tribes != 0) {
    local_50 = 0;
    do {
      cVar4 = FUN_00419480(local_54);
      if (cVar4 == '\0') {
        iVar10 = 1;
        do {
          iVar9 = (int)local_48[local_50 + iVar10];
          if (0 < iVar9) {
            do {
              iVar7 = alloc_unit(1,iVar10,local_54,local_4c + 0x911);
              if (iVar7 != 0) {
                *(uint *)(iVar7 + 0x10) = *(uint *)(iVar7 + 0x10) | 0x80;
                FUN_00445750(iVar7,0,0);
                *(byte *)(iVar7 + 0x35) = *(byte *)(iVar7 + 0x35) | 0x10;
                *(uint *)(iVar7 + 0xc) = *(uint *)(iVar7 + 0xc) | 0x4000;
              }
              iVar9 = iVar9 + -1;
            } while (iVar9 != 0);
          }
          iVar10 = iVar10 + 1;
        } while (iVar10 < 9);
      }
      local_54 = local_54 + 1;
      local_50 = local_50 + 9;
      local_4c = local_4c + 0xc65;
    } while (local_54 < (int)(uint)game_state.num_tribes);
  }
  iVar10 = 0;
  init_tribe_struct();
  iVar9 = 0x89d1c8;
  if (game_state.num_tribes != 0) {
    do {
      cVar4 = FUN_00419480(iVar10);
      if (cVar4 == '\0') {
        cVar4 = (char)(*(int *)(iVar9 + 0x91d) / 0xb4);
        *(char *)(param_1 + 0x7c + iVar10) = cVar4;
        if (cVar4 == '\0') {
          *(undefined1 *)(param_1 + 0x7c + iVar10) = 1;
        }
        if (*(int *)(iVar9 + 0x89d) == 0) {
          iVar7 = FUN_004da0f0(7,iVar10,iVar9 + 0x911,0);
          *(int *)(iVar9 + 0x89d) = iVar7;
          if (iVar7 != 0) {
            *(undefined2 *)(iVar7 + 0x5d) = 0;
          }
        }
        iVar7 = *(int *)(iVar9 + 0x89d);
        if (iVar7 != 0) {
          if (*(short *)(iVar7 + 0x9f) != 0) {
            FUN_00466c80(iVar7,1);
          }
          add_unit_to_cell(*(undefined4 *)(iVar9 + 0x89d),iVar9 + 0x911);
          pbVar1 = (byte *)(*(int *)(iVar9 + 0x89d) + 0x35);
          *pbVar1 = *pbVar1 | 0x10;
          pbVar1 = (byte *)(*(int *)(iVar9 + 0x89d) + 0x36);
          *pbVar1 = *pbVar1 | 0x40;
          FUN_004d4d10(*(undefined4 *)(iVar9 + 0x89d),0);
        }
      }
      iVar10 = iVar10 + 1;
      iVar9 = iVar9 + 0xc65;
    } while (iVar10 < (int)(uint)game_state.num_tribes);
  }
  return 1;
}
