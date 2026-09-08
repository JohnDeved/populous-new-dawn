/* Ghidra 12.1.3 pseudocode; entry 004d5120; FUN_004d5120.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


/* WARNING: Removing unreachable block (ram,0x004d52af) */

char FUN_004d5120(unit_struct *param_1)

{
  short *psVar1;
  short sVar2;
  unit_struct *puVar3;
  bool bVar4;
  char cVar5;
  byte bVar6;
  byte bVar7;
  uint uVar8;
  int iVar9;
  uint uVar10;
  char local_25;
  undefined4 local_24;
  undefined2 local_1e;
  byte local_1a;
  undefined2 local_18;
  short local_14;
  short local_12;
  int local_10;
  uint local_c;
  undefined1 local_8 [4];
  undefined1 local_4 [4];

  local_25 = '\0';
  local_c = get_empty_indexed_xy(2,*(undefined2 *)&param_1->field_0x5d,0,0x10);
  local_c = local_c & 0xff;
  if (local_c != 0) {
    local_10 = param_1->coord_scale_4;
    local_18 = CONCAT11((char)((uint)local_10 >> 0x18),(char)((uint)local_10 >> 8));
    uVar8 = (local_18 & 0xfe) * 2 | local_18 & 0xfe00;
    if ((*(byte *)((int)&game_state.level_data[0].flags + uVar8 * 4 + 1) & 2) != 0) {
      FUN_004044b0(unit_land_array
                   [(ushort)(&game_state.level_data[0].unit_index_2)[uVar8 * 2] & 0x3ff],&local_10);
    }
    local_24 = (uint)(CONCAT11((char)((uint)local_10 >> 0x18),(char)((uint)local_10 >> 8)) & 0xfefe)
               << 0x10;
    do {
      cVar5 = get_indexed_xy(local_c,local_8,local_4);
      if (cVar5 == '\0') break;
      bVar6 = local_8[0] * '\x02' + local_24._2_1_;
      bVar7 = local_4[0] * '\x02' + local_24._3_1_;
      local_1e = CONCAT11(bVar7,bVar6);
      uVar8 = (local_1e & 0xfe) * 2 | local_1e & 0xfe00;
      local_1a = local_1a & 0xf;
      cVar5 = FUN_004d55a0(uVar8 * 4 + 0x8a03e4);
      if (cVar5 != '\0') {
        uVar10 = 1;
        do {
          bVar4 = false;
          local_1a = local_1a ^ ((byte)uVar10 ^ local_1a) & 0xf;
          psVar1 = (short *)(DAT_00895ef1 + (uint)local_1a * 4);
          local_14 = (bVar6 + 1) * 0x100 + *psVar1;
          local_12 = (bVar7 + 1) * 0x100 + psVar1[1];
          local_24 = CONCAT31(local_24._1_3_,(char)((ushort)local_14 >> 8)) & 0xfffffffe;
          local_24 = CONCAT22(local_24._2_2_,
                              CONCAT11((char)((ushort)local_12 >> 8),(undefined1)local_24)) &
                     0xfffffeff;
          sVar2 = *(short *)&unit_related_struct_26B_ARRAY_005a7b90[(byte)param_1->some_index].
                             field_0x10;
          iVar9 = FUN_0044f600(local_24);
          if ((iVar9 <= sVar2) && (cVar5 = FUN_0044f980(&local_14), cVar5 != '\0')) {
            bVar4 = true;
          }
          if (bVar4) {
            iVar9 = 1;
            local_25 = '\x01';
            for (puVar3 = unit_land_array[(short)(&game_state.level_data[0].unit_index)[uVar8 * 2]];
                puVar3 != (unit_struct *)0x0; puVar3 = unit_land_array[puVar3->next_unit_index]) {
              if ((((puVar3->unit_class == '\x01') && (param_1 != puVar3)) &&
                  ((puVar3->obj_index_anim_prev_2 & 1U) != 0)) &&
                 ((puVar3->loc_2_x == local_1e &&
                  (iVar9 = iVar9 + 1, (*(byte *)&puVar3->loc_2_y & 0xf) == uVar10)))) {
                local_25 = '\0';
                break;
              }
            }
            if (local_25 != '\0') {
              bVar6 = ((byte)uVar10 ^ *(byte *)&param_1->loc_2_y) & 0xf ^ *(byte *)&param_1->loc_2_y
              ;
              *(byte *)&param_1->loc_2_y = bVar6;
              *(byte *)&param_1->loc_2_y = bVar6 & 0xf ^ (iVar9 == 1) << 4;
              param_1->loc_2_x = local_1e;
              break;
            }
          }
          uVar10 = uVar10 + 1;
        } while ((int)uVar10 < 7);
      }
    } while (local_25 == '\0');
    clear_indexed_xy(local_c);
  }
  return local_25;
}
