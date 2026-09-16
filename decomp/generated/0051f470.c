/* Ghidra 12.1.3 pseudocode; entry 0051f470; FUN_0051f470.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


undefined4
FUN_0051f470(int param_1,undefined2 param_2,int param_3,int param_4,char param_5,char param_6)

{
  byte bVar1;
  char cVar2;
  unit_struct *puVar3;
  ushort uVar4;
  uint uVar5;
  bool bVar6;
  byte bVar7;
  uint uVar8;
  uint uVar9;
  int iVar10;
  uint uVar11;
  byte bVar12;
  char local_11;
  char local_10;
  char cStack_f;
  undefined2 local_e;

  local_11 = '\0';
  cStack_f = (char)((ushort)param_2 >> 8);
  cStack_f = cStack_f - (char)param_4;
  local_10 = (char)param_2;
  bVar1 = *(byte *)(param_1 + 0x2f);
  local_10 = local_10 - (char)param_3;
  uVar8 = param_3 + 1;
  param_4 = param_4 + 1;
  uVar9 = uVar8;
  do {
    uVar4 = CONCAT11(cStack_f,local_10);
    if ((param_4 == 0) || (uVar5 = uVar8, uVar11 = uVar8, local_11 != '\0')) {
      return CONCAT31((int3)(uVar9 >> 8),local_11);
    }
    while ((local_e._1_1_ = (char)(uVar4 >> 8), uVar5 != 0 && (local_11 == '\0'))) {
      uVar9 = (uVar4 & 0xfe) * 2 | uVar4 & 0xfe00;
      puVar3 = unit_land_array[(short)(&game_state.level_data[0].unit_index)[uVar9 * 2]];
      uVar11 = uVar9;
      while (puVar3 != (unit_struct *)0x0) {
        if ((puVar3->unit_class == '\x01') && ((puVar3->flags_2 & 0x800000) == 0)) {
          bVar6 = true;
          if ((*(short *)&puVar3->field_0x6e < 1) || ((puVar3->flags_2 & 0x10000) != 0)) {
LAB_0051f5ea:
            bVar6 = false;
          }
          else {
            bVar12 = *(byte *)(param_1 + 0x2f);
            if (((bVar12 == 0xff) || (bVar7 = puVar3->tribe_index, bVar7 == 0xff)) ||
               (bVar7 == bVar12)) {
              bVar7 = 1;
            }
            else {
              bVar7 = *(byte *)((int)game_state.start_n1 + (char)bVar12 + 0x9c) &
                      '\x01' << (bVar7 & 0x1f);
            }
            if ((((bVar7 != 0) || (puVar3->tribe_index == bVar12)) ||
                ((puVar3->tribe_index == 0xff ||
                 ((iVar10 = FUN_004de7b0(puVar3,(int)(char)bVar12), iVar10 != 0 ||
                  (iVar10 = FUN_004de7b0(param_1,(int)(char)puVar3->tribe_index), iVar10 != 0))))))
               || ((*(byte *)((int)&puVar3->flags_4 + 1) & 0x10) != 0)) goto LAB_0051f5ea;
            cVar2 = *(char *)(param_1 + 0x2b);
            if (cVar2 == '\x04') {
              if ((((game_state.level_flags & 2) != 0) || (puVar3->unit_type == '\x04')) ||
                 (puVar3->unit_type == '\a')) goto LAB_0051f5ef;
              goto LAB_0051f5ea;
            }
            if (cVar2 == '\x06') {
              if (((game_state.level_flags & 2) != 0) && (puVar3->unit_type == '\a'))
              goto LAB_0051f5ea;
            }
            else if ((cVar2 != '\b') && (puVar3->unit_type == '\b')) goto LAB_0051f5ea;
          }
LAB_0051f5ef:
          if (((bVar6) && (uVar11 = FUN_0051f990(param_1,puVar3,0), (char)uVar11 != '\0')) &&
             ((puVar3->state != '\x17' &&
              ((param_6 == '\0' ||
               (uVar11 = (uint)(byte)puVar3->unit_type,
               (unit_type_array_person[uVar11].field_0x31 & 0x10) != 0)))))) {
            local_11 = '\x02';
            break;
          }
        }
        uVar11 = (uint)puVar3->next_unit_index;
        puVar3 = unit_land_array[uVar11];
      }
      if ((local_11 == '\0') && (param_5 != '\0')) {
        if ((bVar1 == 0xff) ||
           ((bVar12 = ((&game_state.level_data[0].c_2)[uVar9 * 4] & 0xf) - 1, bVar12 == 0xff ||
            (bVar12 == bVar1)))) {
          uVar11 = CONCAT31((int3)(uVar11 >> 8),1);
        }
        else {
          uVar11 = CONCAT31((char)bVar1 >> 7,
                            *(byte *)((int)game_state.start_n1 + (char)bVar1 + 0x9c) &
                            '\x01' << (bVar12 & 0x1f));
        }
        if ((char)uVar11 == '\0') {
          uVar11 = (&game_state.level_data[0].flags)[uVar9];
          if ((((uVar11 & 0x200) != 0) || ((uVar11 & 0x400) != 0)) &&
             ((puVar3 = unit_land_array
                        [(ushort)(&game_state.level_data[0].unit_index_2)[uVar9 * 2] & 0x3ff],
              (uVar11 & 0x200) != 0 || (uVar11 = FUN_004baab0(puVar3,param_1), (char)uVar11 != '\0')
              ))) {
            uVar11 = FUN_0051f990(param_1,puVar3,0);
            bVar12 = (byte)uVar11;
joined_r0x0051f701:
            if (bVar12 != 0) {
              local_11 = '\x03';
            }
          }
        }
        else if ((*(byte *)((int)&game_state.level_data[0].flags + uVar9 * 4 + 1) & 2) != 0) {
          puVar3 = unit_land_array
                   [(ushort)(&game_state.level_data[0].unit_index_2)[uVar9 * 2] & 0x3ff];
          uVar11 = FUN_0051f990(param_1,puVar3,0);
          if ((char)uVar11 != '\0') {
            bVar12 = puVar3->field_0x9c & 0x10;
            goto joined_r0x0051f701;
          }
        }
      }
      local_e._0_1_ = (char)uVar4;
      local_e = CONCAT11(local_e._1_1_,(char)local_e + '\x02');
      uVar5 = uVar5 - 1;
      uVar4 = local_e;
    }
    uVar9 = CONCAT31((int3)(uVar11 >> 8),local_10);
    param_4 = param_4 + -1;
    cStack_f = local_e._1_1_ + '\x02';
  } while( true );
}
