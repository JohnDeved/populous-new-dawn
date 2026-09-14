/* Ghidra 12.1.3 pseudocode; entry 004c8910; FUN_004c8910.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_004c8910(int param_1,int param_2)

{
  undefined4 *puVar1;
  byte bVar2;
  ushort uVar3;
  unit_struct *puVar4;
  unit_struct *puVar5;
  ushort *puVar6;
  unit_struct *puVar7;
  int iVar8;
  undefined4 local_4;

  uVar3 = *(ushort *)(param_2 * 0x52 + 0x68 + param_1);
  puVar7 = (unit_struct *)0x0;
  puVar1 = (undefined4 *)(param_2 * 0x52 + 0x36 + param_1);
  if (((uVar3 != 0) && (puVar5 = unit_land_array[uVar3], (*(byte *)&puVar5->flags_2 & 1) == 0)) &&
     (puVar5->unit_class != '\0')) {
    puVar7 = puVar5;
  }
  if ((puVar7 == (unit_struct *)0x0) || ((*(byte *)((int)puVar1 + 0x3e) & 2) != 0)) {
    FUN_004f6840(param_1,puVar1);
    FUN_00462770(puVar1);
  }
  else {
    switch(*(undefined2 *)((int)puVar1 + 0x42)) {
    case 0:
      *puVar1 = 0;
      *(undefined2 *)((int)puVar1 + 0x42) = 2;
      if (*(int *)((int)puVar1 + 0x36) == 0) {
        puVar1[1] = 6;
        puVar1[2] = 4;
      }
      else {
        puVar1[1] = *(int *)((int)puVar1 + 0x36);
        puVar1[2] = *(undefined4 *)((int)puVar1 + 0x36);
      }
      local_4 = 0;
      if (unit_type_array_building[4].field31_0x20 != 0) {
        puVar6 = &puVar7->loc_3_x;
        do {
          puVar5 = (unit_struct *)0x0;
          if (((*puVar6 != 0) &&
              (puVar4 = unit_land_array[*puVar6], (*(byte *)&puVar4->flags_2 & 1) == 0)) &&
             (puVar4->unit_class != '\0')) {
            puVar5 = puVar4;
          }
          if (puVar5 != (unit_struct *)0x0) {
            bVar2 = puVar5->unit_type;
            if (((puVar1[1] == (uint)bVar2) || (puVar1[2] == (uint)bVar2)) || (bVar2 == 7)) {
              *(undefined2 *)((int)puVar1 + 0x42) = 7;
              return;
            }
            remove_person_from_hut(puVar7,puVar5);
          }
          puVar6 = puVar6 + 1;
          local_4 = local_4 + 1;
        } while ((int)local_4 < (int)(uint)unit_type_array_building[4].field31_0x20);
      }
    case 2:
      FUN_004f5c80(param_1,puVar1,3);
      return;
    case 3:
      local_4 = CONCAT31(local_4._1_3_,(char)((ushort)(puVar7->pos).x >> 8)) & 0xfffffffe;
      local_4 = CONCAT22(local_4._2_2_,
                         CONCAT11((char)((ushort)(puVar7->pos).y >> 8),(undefined1)local_4)) &
                0xfffffeff;
      iVar8 = FUN_004f7dc0(param_1,puVar1[1],puVar1[2],puVar7->unit_index,1,local_4,0x4a);
      if (iVar8 == 0) {
        FUN_004f6440(param_1,puVar1);
        *(undefined2 *)((int)puVar1 + 0x42) = 7;
        return;
      }
      if ((*(byte *)(iVar8 + 0xe) & 0x10) == 0) {
        *(undefined1 *)(iVar8 + 0x7d) = *(undefined1 *)(iVar8 + 0x2c);
        empty_unit_function(iVar8);
        *(undefined1 *)(iVar8 + 0x2c) = 0xe;
        init_unit_class(iVar8);
      }
      *(undefined2 *)((int)puVar1 + 0x42) = 4;
      *(undefined1 *)(param_1 + 0x5b1) = 0x14;
      return;
    case 4:
      FUN_004f5d10(param_1,puVar1,5);
      return;
    case 5:
      if ((*(char *)(param_1 + 0xc22) != puVar7->tribe_index) || (puVar7->state == '\x01')) {
        FUN_004f6440(param_1,puVar1);
        FUN_004f65e0(param_1);
        *(undefined2 *)((int)puVar1 + 0x42) = 7;
        return;
      }
      FUN_00435730(param_1,8,puVar7->unit_index,0);
      for (iVar8 = *(int *)(param_1 + 0x881); iVar8 != 0; iVar8 = *(int *)(iVar8 + 8)) {
        if (*(char *)(iVar8 + 0x2c) == '\x0e') {
          *(uint *)(iVar8 + 0x14) = *(uint *)(iVar8 + 0x14) | 1;
        }
      }
      FUN_004f6440(param_1,puVar1);
      FUN_004359b0(param_1,0xffffffff,0xffffffff,0xffffffff);
      iVar8 = 0;
      FUN_00418ce0(param_1,0xe);
      *(undefined2 *)((int)puVar1 + 0x42) = 6;
      if (unit_type_array_building[4].field31_0x20 != 0) {
        puVar6 = &puVar7->loc_3_x;
        do {
          puVar5 = (unit_struct *)0x0;
          if (((*puVar6 != 0) &&
              (puVar4 = unit_land_array[*puVar6], (*(byte *)&puVar4->flags_2 & 1) == 0)) &&
             (puVar4->unit_class != '\0')) {
            puVar5 = puVar4;
          }
          if (puVar5 != (unit_struct *)0x0) {
            bVar2 = puVar5->unit_type;
            if (((puVar1[1] != (uint)bVar2) && (puVar1[2] != (uint)bVar2)) && (bVar2 != 7)) {
              remove_person_from_hut(puVar7,puVar5);
            }
          }
          puVar6 = puVar6 + 1;
          iVar8 = iVar8 + 1;
        } while (iVar8 < (int)(uint)unit_type_array_building[4].field31_0x20);
        return;
      }
      break;
    case 6:
      *(undefined2 *)((int)puVar1 + 0x42) = 7;
      return;
    case 7:
      FUN_004f6840(param_1,puVar1);
      FUN_00462770(puVar1);
      return;
    }
  }
  return;
}
