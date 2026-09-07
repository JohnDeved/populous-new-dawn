/* Ghidra 12.1.3 pseudocode; entry 00504060; FUN_00504060.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

char FUN_00504060(int param_1,undefined2 *param_2)

{
  char cVar1;
  short sVar2;
  unit_struct *puVar3;
  bool bVar4;
  char cVar5;
  undefined2 uVar6;
  int iVar7;
  int iVar8;
  uint uVar9;
  int iVar10;
  char *pcVar11;
  unit_struct *puVar12;
  char *pcVar13;
  char local_11;
  int local_10;

  iVar8 = game_state.pseudo_random_val;
  sVar2 = *(short *)(param_1 + 0x24);
  local_11 = '\0';
  local_10 = 0;
  iVar7 = FUN_00451370(2);
  if ((iVar7 == 0) && (((byte)level_flags_1 & 0x20) == 0)) {
    pcVar11 = &DAT_00895fb9;
    do {
      if ((*pcVar11 != '\0') && (*(short *)(pcVar11 + 0xc) == sVar2)) {
        local_11 = '\x01';
        break;
      }
      pcVar11 = pcVar11 + 0x9e;
    } while (pcVar11 < &DAT_00897379);
    if (local_11 == '\0') {
      pcVar11 = &DAT_00895fb9;
      cVar5 = *(char *)(param_1 + 0x2a);
      do {
        if ((*pcVar11 != '\0') && (pcVar11[1] < '\x02')) {
          puVar12 = (unit_struct *)0x0;
          if ((*(ushort *)(pcVar11 + 0xc) != 0) &&
             ((puVar3 = unit_land_array[*(ushort *)(pcVar11 + 0xc)],
              (*(byte *)&puVar3->flags_2 & 1) == 0 && (puVar3->unit_class != '\0')))) {
            puVar12 = puVar3;
          }
          if (puVar12 != (unit_struct *)0x0) {
            bVar4 = false;
            cVar1 = puVar12->unit_class;
            if ((cVar1 == '\a') && (cVar5 == '\a')) {
              bVar4 = true;
            }
            if ((cVar1 == '\x01') && (cVar5 == '\x01')) {
              bVar4 = true;
            }
            if ((cVar1 == '\x04') && (cVar5 == '\x04')) {
              bVar4 = true;
            }
            if ((cVar1 == '\n') && (cVar5 == '\n')) {
              bVar4 = true;
            }
            if ((cVar1 == '\t') && (cVar5 == '\t')) {
              bVar4 = true;
            }
            if (((((cVar1 == '\x02') && (cVar5 == '\x02')) && ((puVar12->field_0x9c & 0x80) == 0))
                && (((*(byte *)(param_1 + 0x9c) & 0x80) == 0 && (puVar12->unit_type != '\x12')))) &&
               (*(char *)(param_1 + 0x2b) != '\x12')) {
              bVar4 = true;
            }
            if (((cVar1 == '\x05') && (cVar5 == '\x05')) &&
               ((puVar12->unit_type != '\t' && (*(char *)(param_1 + 0x2b) != '\t')))) {
              bVar4 = true;
            }
            if (bVar4) {
              pcVar11[0x1c] = '\0';
              pcVar11[0x1d] = '\0';
              pcVar11[6] = '\0';
              pcVar11[7] = '\0';
            }
          }
        }
        pcVar11 = pcVar11 + 0x9e;
      } while (pcVar11 < &DAT_00897379);
      pcVar11 = &DAT_00895fb9;
LAB_005041cc:
      if (*pcVar11 != '\0') goto code_r0x005041d1;
      iVar7 = 0;
      cVar5 = FUN_004edae0(10,3);
      if (cVar5 != '\0') {
        ptr_unit_related_20B->field0_0x0 = (int)(pcVar11 + -0x895fb9) / 0x9e;
        ptr_unit_related_20B->field1_0x4 = 0;
        ptr_unit_related_20B->unit_ptr = (unit_struct *)0x0;
        ptr_unit_related_20B->field3_0xc = 0;
        ptr_unit_related_20B->field4_0x10 = 0;
        ptr_unit_related_20B = ptr_unit_related_20B + 1;
        unit_allocation_flag = 1;
        iVar7 = alloc_unit_2(10,3,player_tribe_num,param_1 + 0x3d);
      }
      if (iVar7 != 0) {
        pcVar13 = pcVar11;
        for (iVar10 = 0x27; iVar10 != 0; iVar10 = iVar10 + -1) {
          pcVar13[0] = '\0';
          pcVar13[1] = '\0';
          pcVar13[2] = '\0';
          pcVar13[3] = '\0';
          pcVar13 = pcVar13 + 4;
        }
        pcVar13[0] = '\0';
        pcVar13[1] = '\0';
        DAT_00895fad = DAT_00895fad + '\x01';
        _DAT_00895fb7 = (undefined2)((int)(pcVar11 + -0x895fb9) / 0x9e);
        *pcVar11 = '\x01';
        *(short *)(pcVar11 + 0xc) = sVar2;
        *(undefined2 *)(pcVar11 + 10) = *(undefined2 *)(iVar7 + 0x24);
        pcVar11[1] = -1;
        pcVar11[0x18] = '\x03';
        pcVar11[0x19] = '\0';
        pcVar11[0x1c] = '\x14';
        pcVar11[0x1d] = '\0';
        pcVar11[0x20] = '\x03';
        pcVar11[0x21] = '\0';
        DAT_00895fae = DAT_00895fae + 1;
        if (0xd < DAT_00895fae) {
          DAT_00895fae = 1;
        }
        pcVar11[0x17] = DAT_00895fae;
        pcVar11[0x1f] = DAT_00895fae;
        if (param_1 != 0) {
          cVar5 = *(char *)(param_1 + 0x2a);
          if (cVar5 == '\x02') {
            FUN_004a2530();
            pcVar11[0x1c] = '\x10';
            pcVar11[0x1d] = '\0';
            if (((unit_type_array_building[*(byte *)(param_1 + 0x2b)].field_0x48 & 0x20) != 0) &&
               (*(byte *)(param_1 + 0x2b) != 4)) {
              game_state.tribes_array[0]._2365_4_ = game_state.tribes_array[0]._2365_4_ | 0x2000;
            }
          }
          else {
            if (cVar5 != '\a') {
              if (cVar5 != '\t') goto LAB_00504335;
              FUN_004a2530();
            }
            pcVar11[0x1c] = '\x10';
            pcVar11[0x1d] = '\0';
          }
LAB_00504335:
          if (draw_mode != 2) {
            pcVar11[0x16] = '\x01';
            pcVar11[0x1e] = '\x01';
          }
          if (*(char *)(param_1 + 0x2a) == '\x02') {
            local_10 = FUN_0040b9c0(param_1,(int)player_tribe_num);
          }
          switch(*(byte *)(param_1 + 0x2a)) {
          case 1:
            *(ushort *)(pcVar11 + 4) = (ushort)(iVar8 * 0x24a1 + 0x24dfU >> 0xd) & 0x1ff;
            break;
          case 2:
            if (local_10 != 0) {
              *(undefined2 *)(iVar7 + 0x6e) = *(undefined2 *)(local_10 + 0x24);
            }
            break;
          case 5:
            uVar6 = FUN_004a77d0(iVar7 + 0x3d);
            *(undefined2 *)(iVar7 + 0x6a) = uVar6;
            break;
          case 10:
            iVar8 = FUN_004daa30(param_1,CONCAT31((int3)(*(byte *)(param_1 + 0x2a) - 1 >> 8),
                                                  player_tribe_num));
            if (iVar8 != 0) {
              *(undefined2 *)(iVar7 + 0x6c) = *(undefined2 *)(iVar8 + 0x24);
            }
          }
          switch(*(undefined1 *)(param_1 + 0x2a)) {
          case 1:
            *(undefined1 *)(iVar7 + 0x70) = 2;
            break;
          case 2:
            uVar9 = (uint)*(byte *)(param_1 + 0x2b);
            if (uVar9 == 0x12) {
              *(undefined1 *)(iVar7 + 0x70) = 0xd;
            }
            else if (uVar9 == 0x13) {
              *(undefined1 *)(iVar7 + 0x70) = 0xe;
            }
            else if (local_10 == 0) {
              if (*(char *)(param_1 + 0x2c) == '\x01') {
                *(undefined1 *)(iVar7 + 0x70) = 8;
              }
              else if ((*(uint *)&unit_type_array_building[uVar9].field_0x48 & 1) == 0) {
                if ((*(uint *)&unit_type_array_building[uVar9].field_0x48 & 0x40) == 0) {
                  *(undefined1 *)(iVar7 + 0x70) = 7;
                  if (unit_type_array_building[uVar9].unit_type != '\0') {
                    *(byte *)(iVar7 + 0x71) = *(byte *)(iVar7 + 0x71) | 1;
                  }
                  if ((unit_type_array_building[uVar9].field_0x49 & 4) != 0) {
                    *(byte *)(iVar7 + 0x71) = *(byte *)(iVar7 + 0x71) | 2;
                  }
                }
                else {
                  *(undefined1 *)(iVar7 + 0x70) = 6;
                }
              }
              else {
                *(undefined1 *)(iVar7 + 0x70) = 5;
              }
            }
            else {
              *(undefined1 *)(iVar7 + 0x70) = 0xb;
            }
            break;
          case 4:
            *(undefined1 *)(iVar7 + 0x70) = 9;
            FUN_00466f30(param_1,1,1);
            break;
          case 5:
            if (*(char *)(param_1 + 0x2b) == '\t') {
              *(undefined1 *)(iVar7 + 0x70) = 3;
            }
            else {
              *(undefined1 *)(iVar7 + 0x70) = 4;
            }
            break;
          case 7:
            *(undefined1 *)(iVar7 + 0x70) = 0xc;
            break;
          case 9:
            *(undefined1 *)(iVar7 + 0x70) = 1;
            break;
          case 10:
            *(undefined1 *)(iVar7 + 0x70) = 10;
          }
          draw_ui_panel(pcVar11,param_1,0,0,pcVar11 + 0x12,pcVar11 + 0x14,1,0);
          FUN_00509000(pcVar11,param_1);
        }
        if ((*(char *)(param_1 + 0x2a) == '\x01') &&
           (game_state._838930_2_ != *(short *)(param_1 + 0x24))) {
          game_state._838943_1_ = game_state._838943_1_ & 0xfd;
          game_state._838940_1_ = 0;
          game_state._838930_2_ = *(short *)(param_1 + 0x24);
        }
        local_11 = '\x01';
      }
      goto LAB_00504514;
    }
LAB_0050451b:
    if (param_2 != (undefined2 *)0x0) {
      *param_2 = (short)((int)(pcVar11 + -0x895fb9) / 0x9e);
    }
  }
  return local_11;
code_r0x005041d1:
  pcVar11 = pcVar11 + 0x9e;
  if ((char *)0x897378 < pcVar11) {
LAB_00504514:
    if (local_11 == '\0') {
      return '\0';
    }
    goto LAB_0050451b;
  }
  goto LAB_005041cc;
}
