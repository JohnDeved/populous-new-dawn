/* Ghidra 12.1.3 pseudocode; entry 004030c0; init_unit_class_2.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void init_unit_class_2(int param_1)

{
  unit_struct *puVar1;
  uint uVar2;
  int iVar3;
  undefined2 extraout_var;
  unit_struct *puVar4;

  if (*(byte *)(param_1 + 0x2c) != 0) {
    *(ushort *)(param_1 + 0x9c) = *(ushort *)(param_1 + 0x9c) & 0xfff7;
  }
  iVar3 = *(byte *)(param_1 + 0x2c) - 1;
  switch(iVar3) {
  case 0:
    if (*(char *)(param_1 + 0x2b) != '\n') {
      unit_set_object(param_1 + 0x33,10,
                      CONCAT22((short)((uint)iVar3 >> 0x10),*(undefined2 *)(param_1 + 99)));
    }
    puVar4 = (unit_struct *)0x0;
    *(ushort *)(param_1 + 0x9c) = *(ushort *)(param_1 + 0x9c) & 0xfffd;
    *(undefined2 *)(param_1 + 0x6c) = 0;
    *(byte *)(param_1 + 0x35) = *(byte *)(param_1 + 0x35) | 0x20;
    *(undefined2 *)(param_1 + 0x6e) = 0;
    if (((*(ushort *)(param_1 + 0x94) != 0) &&
        (puVar1 = unit_land_array[*(ushort *)(param_1 + 0x94)], (*(byte *)&puVar1->flags_2 & 1) == 0
        )) && (puVar1->unit_class != '\0')) {
      puVar4 = puVar1;
    }
    if (puVar4 != (unit_struct *)0x0) {
      unit_set_object(&puVar4->object,10,
                      *(undefined4 *)(unit_type_building_2_ARRAY_005a7818 + (byte)puVar4->state_2));
      if (((puVar4->object).flags & 8) != 0) {
        (puVar4->object).morph_index = objs0_mem[(short)(puVar4->object).obj_index].morph_index;
      }
    }
    FUN_00498140(param_1);
    break;
  case 1:
    FUN_004049d0(param_1);
    break;
  case 2:
    *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) | 0x100000;
    *(undefined1 *)(param_1 + 0x67) = 2;
    break;
  case 3:
    FUN_00408840(param_1);
    break;
  case 4:
    uVar2 = *(uint *)(param_1 + 0xc);
    *(uint *)(param_1 + 0xc) = uVar2 | 0x2000000;
    *(uint *)(param_1 + 0xc) = uVar2 | 0x2100000;
    break;
  case 5:
    FUN_004f1500(param_1,param_1 + 0xa4);
    unit_set_object(param_1 + 0x33,unit_type_array_building[*(byte *)(param_1 + 0x2b)].some_index,
                    CONCAT22(extraout_var,*(undefined2 *)(param_1 + 99)));
  }
  if ((*(char *)(param_1 + 0x2c) != '\x02') && (*(short *)(param_1 + 0x84) != 0)) {
    FUN_004ef180(unit_land_array[*(short *)(param_1 + 0x84)]);
    *(undefined2 *)(param_1 + 0x84) = 0;
  }
  if ((*(short *)(param_1 + 0x92) != 0) &&
     ((*(char *)(param_1 + 0x2c) != '\x02' || (*(char *)(param_1 + 0x2f) != player_tribe_num)))) {
    FUN_004ef180(unit_land_array[*(short *)(param_1 + 0x92)]);
    *(undefined2 *)(param_1 + 0x92) = 0;
  }
  return;
}
