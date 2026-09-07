/* Ghidra 12.1.3 pseudocode; entry 004657d0; FUN_004657d0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


undefined1 FUN_004657d0(int param_1,int param_2)

{
  bool bVar1;
  undefined1 uVar2;
  uint uVar3;
  undefined2 extraout_var;
  short *psVar4;
  uint uVar5;
  int iVar6;
  undefined1 local_5;
  byte local_4;

  bVar1 = false;
  local_5 = 0;
  iVar6 = 0;
  if (0 < (char)unit_type_array_vehicle[*(byte *)(param_2 + 0x2b)].field_0x8) {
    psVar4 = (short *)(param_2 + 0x7a);
    do {
      if (*psVar4 == 0) {
        bVar1 = true;
        break;
      }
      psVar4 = psVar4 + 1;
      iVar6 = iVar6 + 1;
    } while (iVar6 < (char)unit_type_array_vehicle[*(byte *)(param_2 + 0x2b)].field_0x8);
  }
  if (bVar1) {
    local_5 = 1;
    *(uint *)(param_2 + 0x92) = *(uint *)(param_2 + 0x92) & 0xfffffdff;
    if (*(short *)(param_1 + 0x78) == 0) {
      local_4 = *(byte *)(unit_type_to_obj_indexes_map + *(byte *)(param_1 + 0x2b) + 0x3f);
      unit_set_object_upper(param_1,local_4);
      *(undefined1 *)(param_1 + 0x39) = 0;
      *(short *)(param_1 + 0x37) = (short)(char)obj_related_array[*(byte *)(param_1 + 0x3a) + 3].f1;
    }
    else {
      local_4 = *(byte *)(unit_type_to_obj_indexes_map + *(byte *)(param_1 + 0x2b) + 0x24);
      unit_set_object_upper(param_1,local_4);
    }
    *(byte *)(param_1 + 0x76) = *(byte *)(param_1 + 0x76) | 0x80;
    *(char *)(param_1 + 0x7e) =
         vstart_related[(short)obj_indexes_table[(uint)local_4 * 2]].frame_counter *
         (obj_related_array[*(byte *)(param_1 + 0x3a) + 3]._f2 + '\x01');
    *(uint *)(param_1 + 0x10) = *(uint *)(param_1 + 0x10) | 0x400;
    *(undefined2 *)(param_1 + 0x9f) = *(undefined2 *)(param_2 + 0x24);
    FUN_004d8250(param_1,0);
    if ((unit_type_array_vehicle[*(byte *)(param_2 + 0x2b)].field_0x15 & 1) == 0) {
      *(uint *)(param_1 + 0x10) = *(uint *)(param_1 + 0x10) & 0xfdffffff;
    }
    else {
      *(uint *)(param_1 + 0x10) = *(uint *)(param_1 + 0x10) | 0x2000000;
    }
    *(undefined2 *)(param_2 + 0x7a + iVar6 * 2) = *(undefined2 *)(param_1 + 0x24);
    *(uint *)(param_2 + 0x92) = *(uint *)(param_2 + 0x92) | 2;
    *(undefined2 *)(param_2 + 0x9a) = 7;
    *(char *)(param_2 + 0x9e) = *(char *)(param_2 + 0x9e) + '\x01';
    *(undefined1 *)(param_2 + 0xa1) = *(undefined1 *)(param_1 + 0x2f);
    if (*(char *)(param_1 + 0x2b) == '\x05') {
      uVar2 = FUN_004de740(param_1);
    }
    else {
      uVar2 = *(undefined1 *)(param_1 + 0x2f);
    }
    *(undefined1 *)(param_2 + 0x2f) = uVar2;
    *(uint *)(param_1 + 0x10) = *(uint *)(param_1 + 0x10) & 0xefffffff;
    if ((iVar6 != 0) && (iVar6 = FUN_004668b0(param_2), iVar6 != param_1)) {
      if ((*(short *)(param_1 + 99) != 0) &&
         (((*(short *)(iVar6 + 99) != *(short *)(param_1 + 99) &&
           (uVar3 = (int)*(short *)(iVar6 + 0x4f) - (int)*(short *)(param_1 + 0x4f),
           uVar5 = (int)uVar3 >> 0x1f, (int)((uVar3 ^ uVar5) - uVar5) < 0x1b8)) &&
          (uVar3 = (int)*(short *)(iVar6 + 0x51) - (int)*(short *)(param_1 + 0x51),
          uVar5 = (int)uVar3 >> 0x1f, (int)((uVar3 ^ uVar5) - uVar5) < 0x1b8)))) {
        update_gs_unit_related_array_item(param_1);
        unit_struct_set_index_to_array(param_1,CONCAT22(extraout_var,*(undefined2 *)(iVar6 + 99)));
        *(undefined1 *)(param_1 + 0x67) = *(undefined1 *)(iVar6 + 0x67);
      }
    }
  }
  return local_5;
}
