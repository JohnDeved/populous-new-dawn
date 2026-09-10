/* Ghidra 12.1.3 pseudocode; entry 0047b460; FUN_0047b460.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


/* WARNING: Control flow encountered bad instruction data */
/* WARNING: Removing unreachable block (ram,0x0047b9b8) */
/* WARNING: Removing unreachable block (ram,0x0047b9be) */
/* WARNING: Removing unreachable block (ram,0x0047b9da) */
/* WARNING: Removing unreachable block (ram,0x0047b9e2) */
/* WARNING: Removing unreachable block (ram,0x0047b65b) */
/* WARNING: Removing unreachable block (ram,0x0047ba64) */
/* WARNING: Removing unreachable block (ram,0x0047b7ce) */
/* WARNING: Removing unreachable block (ram,0x0047b7d4) */
/* WARNING: Removing unreachable block (ram,0x0047b7f0) */
/* WARNING: Removing unreachable block (ram,0x0047b7f8) */
/* WARNING: Removing unreachable block (ram,0x0047bb35) */

undefined1 FUN_0047b460(int param_1,byte param_2,int param_3)

{
  char *pcVar1;
  byte bVar2;
  ushort uVar3;
  undefined2 uVar4;
  undefined2 uVar5;
  unit_struct *puVar6;
  bool bVar7;
  bool bVar8;
  undefined1 uVar9;
  char cVar10;
  int iVar11;
  byte bVar12;
  undefined1 uVar14;
  unit_struct *puVar13;
  unit_struct *puVar15;
  uint uVar16;
  uint uVar17;
  bool bVar18;
  undefined4 local_8;
  int local_4;

  puVar15 = (unit_struct *)0x0;
  uVar16 = 0;
  bVar18 = false;
  bVar7 = false;
  bVar8 = false;
  if (DAT_00895fb0 == '\0') {
    DAT_00895faf = 0;
    return 0;
  }
  if (param_3 != 0) {
    DAT_00895faf = 0;
    return 1;
  }
  if ((param_1 != 0xf0) && (param_1 != 0xf1)) {
    DAT_00895faf = 0;
    return 1;
  }
  DAT_00895faf = 1;
  puVar13 = unit_land_array[DAT_00895fb3];
  switch(puVar13->unit_class) {
  case 1:
    if (param_1 != 0xf1) goto switchD_0047b4e3_caseD_3;
    pcVar1 = (char *)((int)(game_state.sunlight_array + 0x32) +
                     (uint)*(ushort *)((int)&puVar13->loc_3_z + DAT_00895fb5 * 2 + 1) * 10);
    puVar15 = (unit_struct *)FUN_00438950(pcVar1);
    if (puVar15 == (unit_struct *)0x0) {
      cVar10 = FUN_004389c0(pcVar1,&local_8);
      bVar18 = cVar10 != '\0';
      bVar8 = bVar18;
      if ((*pcVar1 == '\v') || (*pcVar1 == '\x19')) {
        uVar9 = (undefined1)((uint)local_8 >> 8);
        uVar14 = (undefined1)((uint)local_8 >> 0x18);
        puVar15 = (unit_struct *)0x0;
        for (puVar13 = unit_land_array
                       [(short)(&game_state.level_data[0].unit_index)
                               [((CONCAT11(uVar14,uVar9) & 0xfe) * 2 |
                                CONCAT11(uVar14,uVar9) & 0xfe00) * 2]];
            puVar13 != (unit_struct *)0x0; puVar13 = unit_land_array[puVar13->next_unit_index]) {
          if (puVar15 != (unit_struct *)0x0) goto LAB_0047b5c4;
          if ((puVar13->unit_class == '\n') && (puVar13->unit_type == '\x10')) {
            puVar15 = puVar13;
          }
        }
        if (puVar15 != (unit_struct *)0x0) {
LAB_0047b5c4:
          bVar7 = true;
        }
      }
      goto switchD_0047b4e3_caseD_3;
    }
    break;
  case 2:
  case 4:
  case 5:
  case 9:
    if ((puVar13->unit_class == '\x02') &&
       (iVar11 = FUN_0040b9c0(puVar13,(int)(char)player_tribe_num), iVar11 != 0)) {
      puVar15 = unit_land_array[DAT_00895fb5];
      if (param_1 == 0xf0) {
        bVar2 = *(byte *)&puVar15->loc_1_x;
        uVar4 = (puVar13->pos).x;
        uVar5 = (puVar13->pos).y;
        uVar16 = (uint)player_tribe_num;
        if (((land_flags_1._1_1_ & 8) == 0) && (temp_tribe_command_buffer[uVar16].cmd == '\0')) {
          temp_tribe_command_buffer[uVar16].cmd = 0x77;
          temp_tribe_command_buffer[uVar16].arg1 = (uint)((bVar2 & 0x80) == 0);
          temp_tribe_command_buffer[uVar16].arg2 =
               CONCAT11((char)((ushort)uVar5 >> 8),(char)((ushort)uVar4 >> 8)) & 0xfefe;
        }
        FUN_0048a050(0,0x6a,1);
      }
      else {
        local_8._0_2_ = (puVar15->pos).x;
        local_8._2_2_ = (puVar15->pos).y;
        bVar7 = true;
        bVar18 = true;
      }
    }
    else if (DAT_00895fb5 < 0) {
      if (param_1 == 0xf0) {
        if (DAT_00895fb5 == -1) {
          if (puVar13->unit_class == '\t') {
            uVar3._0_1_ = puVar13->num_points;
            uVar3._1_1_ = puVar13->tex_size_type;
            puVar13 = (unit_struct *)0x0;
            if (((uVar3 != 0) &&
                (puVar6 = unit_land_array[uVar3], (*(byte *)&puVar6->flags_2 & 1) == 0)) &&
               (puVar6->unit_class != '\0')) {
              puVar13 = puVar6;
            }
          }
          if ((puVar13 != (unit_struct *)0x0) &&
             (FUN_0048a050(0,0x6a,1), (land_flags_1._1_1_ & 8) == 0)) {
                    /* WARNING: Could not recover jumptable at 0x0047b9b1. Too many branches */
                    /* WARNING: Treating indirect jump as call */
            uVar9 = (*(code *)(&PTR_LAB_0047bd80)[DAT_0047bdd0])();
            return uVar9;
          }
        }
        else if ((DAT_00895fb5 == -2) &&
                (cVar10 = FUN_00466f30(unit_land_array[DAT_00895fb3],1,1), cVar10 != '\0')) {
          FUN_0048a050(0,0x6a,1);
          uVar16 = (uint)player_tribe_num;
          uVar17 = (uint)DAT_00895fb3;
          if (((land_flags_1._1_1_ & 8) == 0) && (temp_tribe_command_buffer[uVar16].cmd == '\0')) {
            temp_tribe_command_buffer[uVar16].cmd = 0x60;
            temp_tribe_command_buffer[uVar16].arg1 = uVar17;
            temp_tribe_command_buffer[uVar16].arg2 = 1;
          }
        }
      }
      else {
        DAT_00895faf = 0;
      }
    }
    else {
      switch(puVar13->unit_class) {
      case 2:
        uVar16 = (uint)(short)(&puVar13->loc_3_x)[DAT_00895fb5];
        break;
      case 4:
        uVar16 = (uint)(ushort)(&puVar13->loc_1_x)[DAT_00895fb5];
        break;
      case 5:
        local_4 = (int)DAT_00895fb5;
        iVar11 = FUN_0043c600(puVar13,&local_4,player_tribe_num);
        if (iVar11 != 0) {
          uVar16 = (uint)*(ushort *)(iVar11 + 0x24);
        }
        break;
      case 9:
        uVar16 = (uint)*(ushort *)((int)&puVar13->coord_scale_4 + DAT_00895fb5 * 2 + 2);
      }
      if (uVar16 != 0) {
        if (param_1 == 0xf0) {
          if ((param_2 & 1) == 0) {
            if ((land_flags_1._1_1_ & 8) == 0) {
                    /* WARNING: Could not recover jumptable at 0x0047b7c7. Too many branches */
                    /* WARNING: Treating indirect jump as call */
              uVar9 = (*(code *)(&PTR_LAB_0047bcb8)[DAT_0047bcf2])();
              return uVar9;
            }
          }
          else {
            bVar2 = *(byte *)&unit_land_array[uVar16]->loc_1_x;
            uVar17 = (uint)DAT_00895fb3;
            bVar12 = -(puVar13->unit_class == '\x05') & 0x10;
            uVar16 = (uint)player_tribe_num;
            if ((land_flags_1._1_1_ & 8) == 0) {
              if ((byte)(bVar12 + 0x55) < 0x47) {
                switch(bVar12) {
                case 0:
                    /* WARNING: Bad instruction - Truncating control flow here */
                  halt_baddata();
                }
              }
              if (temp_tribe_command_buffer[uVar16].cmd == '\0') {
                temp_tribe_command_buffer[uVar16].cmd = bVar12 + 0x61;
                temp_tribe_command_buffer[uVar16].arg1 = (uint)((bVar2 & 0x80) == 0);
                temp_tribe_command_buffer[uVar16].arg2 = uVar17;
              }
            }
          }
          FUN_0048a050(0,0x6a,1);
        }
        else if (param_1 == 0xf1) {
          puVar15 = unit_land_array[uVar16];
          local_8._0_2_ = (puVar15->pos).x;
          local_8._2_2_ = (puVar15->pos).y;
          bVar7 = true;
          if (puVar13->unit_class != '\x04') {
            bVar18 = true;
          }
        }
      }
    }
  default:
    goto switchD_0047b4e3_caseD_3;
  case 10:
    puVar15 = unit_land_array[DAT_00895fb5];
    if (param_1 == 0xf0) {
      bVar2 = *(byte *)&puVar15->loc_1_x;
      uVar4 = (puVar13->pos).x;
      uVar5 = (puVar13->pos).y;
      uVar16 = (uint)player_tribe_num;
      if (((land_flags_1._1_1_ & 8) == 0) && (temp_tribe_command_buffer[uVar16].cmd == '\0')) {
        temp_tribe_command_buffer[uVar16].cmd = 0x66;
        temp_tribe_command_buffer[uVar16].arg1 = (uint)((bVar2 & 0x80) == 0);
        temp_tribe_command_buffer[uVar16].arg2 =
             CONCAT11((char)((ushort)uVar5 >> 8),(char)((ushort)uVar4 >> 8)) & 0xfefe;
      }
      FUN_0048a050(0,0x6a,1);
      goto switchD_0047b4e3_caseD_3;
    }
  }
  local_8._0_2_ = (puVar15->pos).x;
  local_8._2_2_ = (puVar15->pos).y;
  bVar18 = true;
  bVar7 = true;
switchD_0047b4e3_caseD_3:
  if (bVar18) {
    FUN_0048a050(0,0x6a,1);
    FUN_00417ca0(&local_8,0xffffffff,0);
  }
  if (bVar7) {
    FUN_00504590(puVar15,1);
    bVar8 = false;
  }
  if (bVar8) {
    FUN_004afff0(&local_8,0);
  }
  return 1;
}
