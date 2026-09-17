/* Ghidra 12.1.3 pseudocode; entry 00477b90; FUN_00477b90.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_00477b90(void)

{
  byte bVar1;
  char cVar2;
  short sVar3;
  unit_struct *puVar4;
  uint uVar5;
  bool bVar6;
  bool bVar7;
  unit_type_scenery *puVar8;
  unit_struct *puVar9;
  unit_struct *puVar10;
  undefined4 local_4;

  puVar4 = allocated_units;
  while (puVar9 = puVar4, puVar10 = unit_array_ptr_1, puVar4 = allocated_units_2,
        puVar9 != (unit_struct *)0x0) {
    puVar4 = puVar9->next_unit_1;
    bVar6 = false;
    bVar7 = false;
    switch(puVar9->unit_class) {
    case 1:
      bVar6 = true;
      if ((puVar9->unit_type == '\x01') || (puVar9->unit_type == '\b')) {
        bVar7 = true;
      }
      break;
    case 2:
      cVar2 = puVar9->hut_people_inside;
      while (cVar2 != '\0') {
        remove_person_from_hut(puVar9,0);
        cVar2 = puVar9->hut_people_inside;
      }
      break;
    default:
      bVar7 = true;
      break;
    case 5:
      bVar6 = true;
      bVar1 = puVar9->unit_type;
      puVar8 = unit_type_array_scenery + bVar1;
      uVar5._0_1_ = puVar8->flags_1;
      uVar5._1_1_ = puVar8->flags;
      uVar5._2_1_ = puVar8->field14_0x16;
      uVar5._3_1_ = puVar8->field15_0x17;
      if ((((uVar5 & 0x10) == 0) && (bVar1 != 10)) && (bVar1 != 0xc)) {
        bVar7 = true;
      }
      break;
    case 7:
      if ((puVar9->unit_type != 'V') && (puVar9->unit_type != '\x05')) {
        bVar7 = true;
      }
      break;
    case 9:
      sVar3._0_1_ = puVar9->num_points;
      sVar3._1_1_ = puVar9->tex_size_type;
      if (sVar3 == 0) {
        local_4._2_2_ = (undefined2)(local_4 >> 0x10);
        local_4 = CONCAT22(local_4._2_2_,
                           CONCAT11((char)((ushort)(puVar9->pos).y >> 8),
                                    (char)((ushort)(puVar9->pos).x >> 8))) & 0xfffffefe;
        FUN_004b9190(local_4,0,0,puVar9->tribe_index,3);
      }
    }
    if (bVar7) {
      if (bVar6) {
        FUN_004d4d10(puVar9,1);
      }
      FUN_004ef180(puVar9);
    }
  }
  while (puVar9 = puVar4, unit_array_ptr_1 = puVar10, puVar9 != (unit_struct *)0x0) {
    puVar4 = puVar9->next_unit_1;
    if ((puVar9->unit_class == '\n') && (puVar9->unit_type == '\x10')) {
      FUN_004ef180(puVar9);
      puVar10 = unit_array_ptr_1;
    }
  }
  if (puVar10 < unit_array_ptr_end_1) {
    do {
      if ((*(byte *)&puVar10->flags_2 & 1) != 0) {
        puVar10->unit_class = 0;
        puVar10->flags_2 = puVar10->flags_2 & 0xfffffffe;
      }
      puVar10 = puVar10 + 1;
    } while (puVar10 < unit_array_ptr_end_1);
  }
  update_unit_lists();
  return;
}
