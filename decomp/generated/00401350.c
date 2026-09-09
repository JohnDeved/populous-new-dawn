/* Ghidra 12.1.3 pseudocode; entry 00401350; sunlight_update_landscape.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void sunlight_update_landscape(void)

{
  char cVar1;
  byte bVar2;
  ushort uVar3;
  undefined4 uVar4;
  undefined1 uVar5;
  int iVar6;
  uint uVar7;
  uint uVar8;
  uint uVar9;
  uint uVar10;
  int iVar11;
  sunlight_struct *psVar12;
  int iVar13;
  int iVar14;
  undefined1 local_22;
  undefined1 uStack_21;
  undefined2 uStack_20;
  ushort local_1e;
  uint local_1c;
  int local_18;
  int local_14;
  int local_8;

  local_1c = game_state.pseudo_random_val;
  if (((level_flags_2._1_1_ & 8) != 0) && (((byte)game_state.offset_counter_2 & 7) == 7)) {
    game_state.sunlight[0] = game_state.sunlight[0] + 1;
    game_state.sunlight_var_1 =
         (undefined2)
         (maybe_cos[(uint)game_state.sunlight[0] * 4] +
          (maybe_cos[(uint)game_state.sunlight[0] * 4] >> 0x1f & 0xffU) >> 8);
    game_state.sunlight_var_3 =
         (undefined2)
         (maybe_sin[(uint)game_state.sunlight[0] * 4] +
          (maybe_sin[(uint)game_state.sunlight[0] * 4] >> 0x1f & 0xffU) >> 8);
    sunlight_init_2();
    set_landscape_c_4_and_texture(0,0x40);
  }
  if (((((byte)land_flags_1 & 2) == 0) && ((level_flags_2._1_1_ & 0x10) != 0)) &&
     (iVar6 = (int)(short)game_state._841988_2_, iVar6 != 0)) {
    landscape_modification_sunlight();
    local_18 = 0;
    local_8 = 0;
    psVar12 = game_state.sunlight_array;
    do {
      if (iVar6 <= local_8) {
        return;
      }
      if (psVar12->enabled != '\0') {
        psVar12->x = game_state.unit_array[(ushort)psVar12->unit_index].pos.x;
        uVar3 = game_state.unit_array[(ushort)psVar12->unit_index].pos.y;
        psVar12->y = uVar3;
        uVar8 = (uint)(ushort)psVar12->x - (uint)(ushort)game_state.tribes_array[player_tribe_num].x
        ;
        uVar7 = uVar8;
        if ((int)uVar8 < 0) {
          uVar7 = -uVar8;
        }
        uVar9 = uVar8;
        if (((uVar7 & 0x8000) != 0) && (uVar9 = uVar7 - 0x10000, (int)uVar8 < 1)) {
          uVar9 = 0x10000 - uVar7;
        }
        uVar8 = (uint)uVar3 - (uint)(ushort)game_state.tribes_array[player_tribe_num].y;
        uVar7 = uVar8;
        if ((int)uVar8 < 0) {
          uVar7 = -uVar8;
        }
        uVar10 = uVar8;
        if (((uVar7 & 0x8000) != 0) && (uVar10 = uVar7 - 0x10000, (int)uVar8 < 1)) {
          uVar10 = 0x10000 - uVar7;
        }
        if ((int)(uVar9 * uVar9 + uVar10 * uVar10) < 0x6910000) {
          local_8 = local_8 + 1;
          iVar13 = 0;
          psVar12->z = game_state.unit_array[(ushort)psVar12->unit_index].pos.z;
          local_1e = CONCAT11((char)((ushort)psVar12->y >> 8),(char)((ushort)psVar12->x >> 8)) &
                     0xfefe;
          uStack_20._0_1_ = (char)local_1e;
          cVar1 = (char)uStack_20 + -6;
          uStack_20._1_1_ = (char)(local_1e >> 8);
          _local_22 = CONCAT13(uStack_20._1_1_ + -6,(uint3)CONCAT11(uStack_20._1_1_,cVar1) << 0x10);
          uVar7 = local_1c * 0x24a1 + 0x24df;
          local_1c = uVar7 >> 0xd | uVar7 * 0x80000;
          bVar2 = psVar12->f3;
          local_14 = 7;
          _local_22 = CONCAT22(uStack_20,uStack_20);
          do {
            iVar11 = 7;
            iVar14 = iVar13;
            do {
              uVar4 = _local_22;
              iVar11 = iVar11 + -1;
              iVar13 = iVar14 + 1;
              landscape_modification_sunlight_2
                        (_local_22,psVar12,iVar14,
                         (short)(local_1c % (uint)bVar2) - (ushort)(bVar2 >> 1));
              _local_22 = CONCAT31(_uStack_21,local_22 + '\x02');
              iVar14 = iVar13;
            } while (iVar11 != 0);
            uStack_20._0_1_ = SUB41(uVar4,2);
            uVar5 = (char)uStack_20;
            local_14 = local_14 + -1;
            uStack_21 = SUB41(uVar4,1);
            uStack_20 = SUB42(uVar4,2);
            _local_22 = CONCAT31(CONCAT21(uStack_20,uStack_21 + '\x02'),uVar5);
          } while (local_14 != 0);
        }
      }
      psVar12 = psVar12 + 1;
      local_18 = local_18 + 1;
    } while (local_18 < 0x32);
  }
  return;
}
