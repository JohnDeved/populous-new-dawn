/* Ghidra 12.1.3 pseudocode; entry 004ea970; FUN_004ea970.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


undefined4 FUN_004ea970(int param_1,ushort *param_2,byte *param_3,undefined4 param_4)

{
  undefined1 *puVar1;
  bool bVar2;
  undefined1 uVar3;
  undefined2 uVar4;
  game_state_unit_struct_sub *pgVar5;
  undefined4 uVar6;
  short *psVar7;
  int iVar8;
  short *psVar9;
  uint uVar10;
  game_state_unit_struct_1 *pgVar11;
  game_state_unit_struct_sub *pgVar12;
  short local_26;
  undefined4 local_24;
  undefined4 local_20;
  short local_1c;
  short local_1a;
  int local_18;
  uint local_14;
  int local_10;
  int local_c;
  uint local_8;
  uint local_4;

  uVar10 = *(uint *)(param_1 + 0x10) & 0xefffffff;
  local_10 = *(char *)(param_1 + 0x2f) * 0xc65 + 0x89d1c8;
  pgVar5 = (game_state_unit_struct_sub *)0x0;
  local_26 = 0;
  local_18 = 0;
  local_c = 0;
  *(uint *)(param_1 + 0x10) = uVar10;
  local_14 = *(byte *)((int)param_2 + 1) & 0xfffffffe;
  bVar2 = false;
  local_8 = *param_3 & 0xfffffffe;
  psVar9 = (short *)&game_state.field_0xb8a61;
  local_4 = param_3[1] & 0xfffffffe;
  do {
    if ((((*psVar9 != 0) && (*(byte *)(psVar9 + 1) == ((byte)*param_2 & 0xfe))) &&
        (*(byte *)((int)psVar9 + 3) == local_14)) &&
       ((*(byte *)(psVar9 + 3) == local_8 && (*(byte *)((int)psVar9 + 7) == local_4)))) {
      bVar2 = true;
      break;
    }
    pgVar5 = (game_state_unit_struct_sub *)&pgVar5->field_0x1;
    psVar9 = psVar9 + 5;
  } while ((int)pgVar5 < 8);
  if (bVar2) {
    *(uint *)(param_1 + 0x10) = uVar10 | 0x10000000;
LAB_004eada0:
    local_26 = 0;
  }
  else {
    iVar8 = 0;
    pgVar5 = (game_state_unit_struct_sub *)((short)game_state._755252_2_ * 0x1b);
    pgVar11 = game_state.unit_related_array_1 + (short)game_state._755252_2_ + 1;
    do {
      if (&game_state.field_0xc3500 < pgVar11) {
        pgVar11 = (game_state_unit_struct_1 *)&game_state.field_0xb8b1e;
      }
      if (pgVar11->counter == 0) {
        iVar8 = ((int)(pgVar11 + -0x15ecc) + 0x46) / 0x6d;
        game_state._755252_2_ = (short)iVar8 + 1;
        pgVar5 = (game_state_unit_struct_sub *)
                 CONCAT22((short)((uint)iVar8 >> 0x10),game_state._755252_2_);
        local_26 = game_state._755252_2_;
        break;
      }
      iVar8 = iVar8 + 1;
      pgVar11 = pgVar11 + 1;
    } while (iVar8 < 400);
    if (local_26 == 0) goto LAB_004eada7;
    game_state._756320_1_ = 0;
    if ((((game_state.tribes_array[*(char *)(param_1 + 0x2f)].field_0x93d & 0x20) != 0) &&
        ((*(uint *)(param_1 + 0x10) & 8) == 0)) && ((*(byte *)(param_1 + 0x15) & 0x20) == 0)) {
      if ((*(short *)(param_1 + 0x9f) == 0) ||
         (bVar2 = true, (*(uint *)(param_1 + 0x10) & 0x2000000) != 0)) {
        bVar2 = false;
      }
      if (!bVar2) {
        local_14 = (uint)*param_2;
        iVar8 = FUN_00450590(local_14,*(undefined2 *)param_3);
        if (100 < iVar8) {
          local_24 = *param_2 & 0xfffffefe;
          local_1c = ((byte)local_24 + 1) * 0x100;
          local_1a = (local_24._1_1_ + 1) * 0x100;
          iVar8 = FUN_00466920(param_1,&local_1c,0,0x800);
          if (iVar8 != 0) {
            local_20._0_2_ =
                 CONCAT11((char)((ushort)*(undefined2 *)(iVar8 + 0x3f) >> 8),
                          (char)((ushort)*(undefined2 *)(iVar8 + 0x3d) >> 8));
            iVar8 = FUN_00420840(1,param_1,param_2,&local_20,param_4,0);
            if (iVar8 != 1) {
              local_c = 1;
              local_18 = 1;
              *(undefined4 *)param_3 = local_20;
            }
          }
        }
      }
    }
    if (local_18 == 0) {
      if ((((*(byte *)(local_10 + 0x93d) & 0x20) == 0) || ((*(byte *)(param_1 + 0x10) & 8) != 0)) ||
         (uVar6 = 1, (*(byte *)(param_1 + 0x15) & 0x20) != 0)) {
        uVar6 = 0;
      }
      iVar8 = FUN_00420840(0,param_1,param_2,param_3,param_4,uVar6);
      if (iVar8 == 1) {
        if ((((*(byte *)(local_10 + 0x93d) & 0x20) != 0) && ((*(byte *)(param_1 + 0x10) & 8) == 0))
           && ((*(byte *)(param_1 + 0x15) & 0x20) == 0)) {
          local_24 = *param_2 & 0xfffffefe;
          local_1c = ((byte)local_24 + 1) * 0x100;
          local_1a = (local_24._1_1_ + 1) * 0x100;
          iVar8 = FUN_00466920(param_1,&local_1c,0x800,0x2800);
          if (iVar8 != 0) {
            local_20._0_2_ =
                 CONCAT11((char)((ushort)*(undefined2 *)(iVar8 + 0x3f) >> 8),
                          (char)((ushort)*(undefined2 *)(iVar8 + 0x3d) >> 8));
            iVar8 = FUN_00420840(1,param_1,param_2,&local_20,param_4,0);
            if (iVar8 != 1) {
              local_c = 1;
              *(undefined4 *)param_3 = local_20;
              goto LAB_004eaccc;
            }
          }
        }
      }
      else {
LAB_004eaccc:
        local_18 = 1;
      }
      if (local_18 == 0) {
        psVar7 = (short *)&game_state.field_0xb8a61;
        iVar8 = 8;
        local_24 = 0xfffffff;
        psVar9 = (short *)0xfffffff;
        do {
          if ((int)*psVar7 < (int)local_24) {
            psVar9 = psVar7;
            local_24 = (int)*psVar7;
          }
          psVar7 = psVar7 + 5;
          iVar8 = iVar8 + -1;
        } while (iVar8 != 0);
        *psVar9 = 0x10;
        uVar10 = CONCAT31((int3)((uint)psVar7 >> 8),(byte)*param_2) & 0xfffffffe;
        *(char *)(psVar9 + 1) = (char)uVar10;
        uVar10 = CONCAT31((int3)(uVar10 >> 8),*(byte *)((int)param_2 + 1)) & 0xfffffffe;
        *(char *)((int)psVar9 + 3) = (char)uVar10;
        uVar10 = CONCAT31((int3)(uVar10 >> 8),*param_3) & 0xfffffffe;
        *(char *)(psVar9 + 3) = (char)uVar10;
        pgVar5 = (game_state_unit_struct_sub *)
                 (CONCAT31((int3)(uVar10 >> 8),param_3[1]) & 0xfffffffe);
        *(char *)((int)psVar9 + 7) = (char)pgVar5;
        *(uint *)(param_1 + 0x10) = *(uint *)(param_1 + 0x10) | 0x10000000;
        goto LAB_004eada0;
      }
    }
    puVar1 = &pgVar11->flag;
    uVar3 = game_state._755289_1_;
    uVar4 = game_state._755290_2_;
    pgVar11->coord_1 = game_state._755288_1_;
    pgVar11->coord_2 = uVar3;
    *(undefined2 *)&pgVar11->field_0x6 = uVar4;
    uVar3 = game_state._755293_1_;
    uVar4 = game_state._755294_2_;
    pgVar11->coord_3 = game_state._755292_1_;
    pgVar11->coord_4 = uVar3;
    *(undefined2 *)&pgVar11->field_0xa = uVar4;
    if (local_c == 0) {
      *puVar1 = *puVar1 & 0xfd;
    }
    else {
      *puVar1 = *puVar1 | 2;
    }
    *puVar1 = *puVar1 & 0xfe;
    uVar10 = (uint)(byte)game_state._756320_1_;
    if (0x17 < (byte)game_state._756320_1_) {
      uVar10 = 0x17;
    }
    pgVar11->sub_array_counter = (char)uVar10;
    pgVar5 = &game_state.unit_sub_array;
    pgVar12 = pgVar11->sub_array;
    for (; uVar10 != 0; uVar10 = uVar10 - 1) {
      *pgVar12 = *pgVar5;
      if (pgVar5->field_0x2 != '\0') {
        *puVar1 = *puVar1 | 1;
      }
      pgVar5 = pgVar5 + 1;
      pgVar12 = pgVar12 + 1;
    }
  }
LAB_004eada7:
  return CONCAT22((short)((uint)pgVar5 >> 0x10),local_26);
}
