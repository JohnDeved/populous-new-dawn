/* Ghidra 12.1.3 pseudocode; entry 004c6a20; cast_blast.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


undefined4 cast_blast(int param_1)

{
  int iVar1;
  int iVar2;
  int iVar3;
  int iVar4;
  ushort uVar5;
  int iVar6;
  int iVar7;
  int iVar8;
  undefined4 local_16;
  char local_12;
  char cStack_11;
  undefined2 uStack_10;
  int local_c;
  undefined4 local_4;

  local_4 = 0;
  if ((*(char *)(param_1 + 0xc22) + game_state.offset_counter_2 + 7U & 0x1f) == 0) {
    iVar6 = tribe_get_shaman(param_1);
    uStack_10 = (undefined2)iVar6;
    if ((iVar6 != 0) && (iVar7 = FUN_004f4d40(param_1,iVar6), iVar7 != 0)) {
      local_c = 0x18;
      local_16 = CONCAT31(local_16._1_3_,(char)((ushort)*(undefined2 *)(iVar6 + 0x3d) >> 8)) &
                 0xfffffffe;
      local_16 = CONCAT22(local_16._2_2_,
                          CONCAT11((char)((ushort)*(undefined2 *)(iVar6 + 0x3f) >> 8),
                                   (undefined1)local_16)) & 0xfffffeff;
      do {
        uVar5 = FUN_0049c890(local_16,local_c,0);
        local_16 = CONCAT22(uVar5,(undefined2)local_16);
        iVar7 = ((uVar5 & 0xfe) * 2 | uVar5 & 0xfe00) * 4;
        local_12 = (char)uVar5;
        cStack_11 = (char)(uVar5 >> 8);
        iVar1 = ((CONCAT11(cStack_11 + '\x02',local_12) & 0xfe) * 2 |
                CONCAT11(cStack_11 + '\x02',local_12) & 0xfe00) * 4;
        iVar2 = ((CONCAT11(cStack_11 + -2,local_12) & 0xfe) * 2 |
                CONCAT11(cStack_11 + -2,local_12) & 0xfe00) * 4;
        iVar3 = ((CONCAT11(cStack_11,local_12 + '\x02') & 0xfe) * 2 |
                CONCAT11(cStack_11,local_12 + '\x02') & 0xfe00) * 4;
        iVar4 = ((CONCAT11(cStack_11,local_12 + -2) & 0xfe) * 2 |
                CONCAT11(cStack_11,local_12 + -2) & 0xfe00) * 4;
        if ((*(byte *)(landscape_height_array + ((&game_state.level_data[0].c_3)[iVar7] & 0xf)) &
            0x3c) == 0) {
          if ((*(byte *)(landscape_height_array + ((&game_state.level_data[0].c_3)[iVar7] & 0xf)) &
              1) != 0) {
            iVar8 = -1;
            if ((*(byte *)(landscape_height_array + ((&game_state.level_data[0].c_3)[iVar1] & 0xf))
                & 0x3c) == 0) {
              if ((*(byte *)(landscape_height_array + ((&game_state.level_data[0].c_3)[iVar2] & 0xf)
                            ) & 0x3c) == 0) {
                if ((*(byte *)(landscape_height_array +
                              ((&game_state.level_data[0].c_3)[iVar3] & 0xf)) & 0x3c) == 0) {
                  if ((*(byte *)(landscape_height_array +
                                ((&game_state.level_data[0].c_3)[iVar4] & 0xf)) & 0x3c) != 0) {
                    iVar8 = 3;
                  }
                }
                else {
                  iVar8 = 2;
                }
              }
              else {
                iVar8 = 1;
              }
            }
            else {
              iVar8 = 0;
            }
            goto joined_r0x004c6ce5;
          }
        }
        else {
          iVar8 = -1;
          if ((*(byte *)(landscape_height_array + ((&game_state.level_data[0].c_3)[iVar1] & 0xf)) &
              2) == 0) {
            if ((*(byte *)(landscape_height_array + ((&game_state.level_data[0].c_3)[iVar2] & 0xf))
                & 2) == 0) {
              if ((*(byte *)(landscape_height_array + ((&game_state.level_data[0].c_3)[iVar3] & 0xf)
                            ) & 2) == 0) {
                if ((*(byte *)(landscape_height_array +
                              ((&game_state.level_data[0].c_3)[iVar4] & 0xf)) & 2) != 0) {
                  iVar8 = 3;
                }
              }
              else {
                iVar8 = 2;
              }
            }
            else {
              iVar8 = 1;
            }
          }
          else {
            iVar8 = 0;
          }
joined_r0x004c6ce5:
          if ((iVar8 != -1) && (iVar7 = FUN_004f45c0(param_1,iVar7 + 0x8a03e4), 0 < iVar7)) {
            switch(iVar8) {
            case 0:
              cStack_11 = cStack_11 + -2;
              break;
            case 1:
              cStack_11 = cStack_11 + '\x02';
              break;
            case 2:
              local_12 = local_12 + -2;
              break;
            case 3:
              local_12 = local_12 + '\x02';
            }
            iVar7 = FUN_004c2d80(iVar6);
            if ((iVar7 != 0) && (iVar7 = FUN_004f2100(iVar6,2), iVar7 != 0)) {
              alloc_spell_unit(param_1,2,CONCAT22(uStack_10,CONCAT11(cStack_11,local_12)));
              local_4 = 1;
            }
          }
        }
        local_c = local_c + 1;
      } while (local_c < 0x4f);
    }
  }
  return local_4;
}
