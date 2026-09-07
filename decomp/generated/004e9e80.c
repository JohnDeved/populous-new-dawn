/* Ghidra 12.1.3 pseudocode; entry 004e9e80; FUN_004e9e80.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


/* WARNING: Type propagation algorithm not settling */

int FUN_004e9e80(int param_1,undefined4 *param_2)

{
  undefined1 *puVar1;
  char cVar2;
  bool bVar3;
  bool bVar4;
  bool bVar5;
  ushort uVar6;
  short sVar7;
  uint uVar8;
  ushort uVar9;
  uint uVar10;
  int iVar11;
  int iVar12;
  undefined4 local_16;
  undefined4 local_10;
  undefined4 local_c;
  int local_8;
  undefined1 local_4;
  undefined1 local_3;

  bVar3 = false;
  iVar11 = 0;
  bVar5 = false;
  local_8 = 0;
  *(undefined4 *)(param_1 + 0x4f) = *param_2;
  if (game_state._755272_1_ == '\0') {
    if (((level_flags_2._2_1_ & 0x40) == 0) && ((*(byte *)(param_1 + 0xf) & 2) != 0)) {
      if ((*(short *)(param_1 + 0x9f) == 0) || (bVar4 = true, (*(byte *)(param_1 + 0x13) & 2) == 0))
      {
        bVar4 = false;
      }
      if (!bVar4) {
        bVar5 = true;
        bVar3 = true;
      }
    }
  }
  else {
    game_state._755272_1_ = 0;
  }
  *(uint *)(param_1 + 0x10) = *(uint *)(param_1 + 0x10) & 0xefffffff;
  if (bVar3) {
    iVar12 = (int)*(char *)(param_1 + 0x2f);
    bVar3 = true;
    cVar2 = game_state.tribes_array[iVar12].field_0xc1f;
    if (cVar2 == '\x01') {
      if ((DAT_0089ce5d != 0) &&
         ((short)(ushort)DAT_0089ce5d < *(short *)(&game_state.field_0xb863e + iVar12 * 2)))
      goto LAB_004e9f4e;
    }
    else if ((cVar2 == '\x02') &&
            ((DAT_0089ce5f != 0 &&
             ((short)(ushort)DAT_0089ce5f < *(short *)(&game_state.field_0xb863e + iVar12 * 2))))) {
LAB_004e9f4e:
      bVar3 = false;
    }
    if (bVar3) {
      uVar6 = CONCAT11((char)((ushort)*(undefined2 *)(param_1 + 0x3f) >> 8),
                       (char)((ushort)*(undefined2 *)(param_1 + 0x3d) >> 8));
      uVar10 = (uVar6 & 0xfe) * 2 | uVar6 & 0xfe00;
      iVar12 = uVar10 * 4;
      uVar6 = CONCAT11((char)((ushort)*(undefined2 *)((int)param_2 + 2) >> 8),
                       (char)((ushort)*(undefined2 *)param_2 >> 8));
      local_16._2_2_ = uVar6 & 0xfefe;
      uVar9 = local_16._2_2_;
      uVar8 = (uint)local_16._2_2_;
      local_16 = CONCAT22(uVar6,uVar6) & 0xfefefefe;
      uVar8 = (uVar8 & 0xfe) * 2 | uVar9 & 0xfe00;
      uVar6 = (&game_state.level_data[0].unit_index_2)[uVar10 * 2];
      uVar9 = uVar6 & 0x3ff;
      if ((uVar9 == 0) ||
         ((((&game_state.level_data[0].unit_index_2)[uVar8 * 2] ^ uVar6) & 0x3ff) != 0)) {
        if ((*(byte *)((int)&game_state.level_data[0].flags + iVar12 + 1) & 2) == 0) {
          local_10 = *(undefined4 *)(param_1 + 0x3d);
        }
        else {
          FUN_004044b0(unit_land_array[uVar9],&local_10);
        }
        local_c = *(undefined4 *)(param_1 + 0x4f);
        if ((*(byte *)((int)&game_state.level_data[0].flags + uVar8 * 4 + 1) & 2) != 0) {
          game_state._755280_4_ = param_1;
          iVar11 = FUN_00518070(local_16);
          if (iVar11 != 0) {
            local_8 = 1;
            FUN_004044b0(unit_land_array
                         [(ushort)(&game_state.level_data[0].unit_index_2)[uVar8 * 2] & 0x3ff],
                         &local_c);
          }
        }
        if (*(ushort *)(param_1 + 0x9f) == 0) {
          if ((*(byte *)(landscape_height_array + ((&game_state.level_data[0].c_3)[iVar12] & 0xf)) &
              0x3c) != 0) {
            sVar7 = FUN_004655f0(&local_10);
            uVar6 = sVar7 * 0x100 + 0x400U & 0x7ff;
            local_10 = CONCAT22(local_10._2_2_ + (short)((uint)(maybe_cos[uVar6] << 9) >> 0x10),
                                (short)local_10 + (short)((uint)(maybe_sin[uVar6] << 9) >> 0x10));
          }
          if ((*(byte *)(landscape_height_array + ((&game_state.level_data[0].c_3)[uVar8 * 4] & 0xf)
                        ) & 0x3c) != 0) {
            local_8 = 1;
            sVar7 = FUN_004655f0(&local_c);
            uVar6 = sVar7 * 0x100 + 0x400U & 0x7ff;
            local_c = CONCAT22(local_c._2_2_ + (short)((uint)(maybe_cos[uVar6] << 9) >> 0x10),
                               (short)local_c + (short)((uint)(maybe_sin[uVar6] << 9) >> 0x10));
          }
        }
        else {
          local_10._0_2_ = (unit_land_array[*(ushort *)(param_1 + 0x9f)]->pos).x;
          local_10._2_2_ = (unit_land_array[*(ushort *)(param_1 + 0x9f)]->pos).y;
        }
        if (local_8 != 0) {
          *(undefined4 *)(param_1 + 0x4f) = local_c;
        }
        local_4 = (undefined1)((uint)local_10 >> 8);
        local_3 = (undefined1)((uint)local_10 >> 0x18);
        local_16 = CONCAT13((char)((uint)local_c >> 0x18),
                            CONCAT12((char)((uint)local_c >> 8),(undefined2)local_16));
        sVar7 = FUN_004ea550(param_1,&local_4,(int)&local_16 + 2);
        iVar11 = (int)sVar7;
        if (iVar11 == 0) {
          sVar7 = FUN_004ea970(param_1,&local_4,(int)&local_16 + 2,0);
          iVar11 = (int)sVar7;
        }
        *(undefined1 *)(param_1 + 0x65) = 0;
        if (local_8 != 0) {
          *(uint *)(param_1 + 0x10) = *(uint *)(param_1 + 0x10) | 0x4000000;
        }
        if (iVar11 == 0) goto LAB_004ea291;
        *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) & 0x7fffffff;
        iVar12 = (int)*(short *)(param_1 + 99);
        if (iVar12 != 0) {
          *(undefined2 *)(param_1 + 99) = 0;
          *(undefined1 *)(param_1 + 0x67) = 0;
          sVar7 = game_state.unit_related_array_1[iVar12].counter;
          if (((0 < sVar7) &&
              (sVar7 = sVar7 + -1, game_state.unit_related_array_1[iVar12].counter = sVar7,
              sVar7 < 1)) &&
             (game_state._755256_2_ = game_state._755256_2_ + -1,
             (game_state.unit_related_array_1[iVar12].flag & 4) == 0)) {
            game_state.unit_related_array_1[iVar12].flag = 0;
          }
        }
        sVar7 = (short)iVar11;
        if (game_state.unit_related_array_1[sVar7].counter < 1) {
          game_state._755256_2_ = game_state._755256_2_ + 1;
        }
        game_state._755254_2_ = sVar7;
        game_state.unit_related_array_1[sVar7].counter =
             game_state.unit_related_array_1[sVar7].counter + 1;
        *(short *)(param_1 + 99) = sVar7;
        *(undefined1 *)(param_1 + 0x67) = 0;
        puVar1 = &game_state.unit_related_array_1[sVar7].flag;
        *puVar1 = *puVar1 & 0xfb;
        get_gc_coords_unit_related_struct
                  ((int)*(short *)(param_1 + 99),(int)*(char *)(param_1 + 0x67),param_1 + 0x53);
        FUN_004ea300(param_1);
        FUN_004eadc0(param_1);
      }
    }
  }
  else if (bVar5) {
    *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) | 0x80000000;
  }
  if (iVar11 != 0) {
    return iVar11;
  }
LAB_004ea291:
  if (*(short *)(param_1 + 99) != 0) {
    iVar11 = (int)*(short *)(param_1 + 99);
    puVar1 = &game_state.unit_related_array_1[iVar11].flag;
    if (((*puVar1 & 4) == 0) && (iVar11 != 0)) {
      *(undefined2 *)(param_1 + 99) = 0;
      *(undefined1 *)(param_1 + 0x67) = 0;
      sVar7 = game_state.unit_related_array_1[iVar11].counter;
      if ((0 < sVar7) &&
         ((sVar7 = sVar7 + -1, game_state.unit_related_array_1[iVar11].counter = sVar7, sVar7 < 1 &&
          (game_state._755256_2_ = game_state._755256_2_ + -1, (*puVar1 & 4) == 0)))) {
        *puVar1 = 0;
      }
    }
  }
  *(undefined4 *)(param_1 + 0x53) = *(undefined4 *)(param_1 + 0x4f);
  return 0;
}
