/* Ghidra 12.1.3 pseudocode; entry 004513e0; FUN_004513e0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


int FUN_004513e0(int param_1)

{
  unit_struct *puVar1;
  char cVar2;
  ushort uVar3;
  uint uVar4;
  unit_struct *puVar5;
  int iVar6;
  undefined2 local_2;

  if (*(short *)(param_1 + 0x9f) != 0) {
    if (*(char *)(unit_type_related_1_ARRAY_005a6f78 + *(byte *)(param_1 + 0x2c)) == '\x01') {
      return 1;
    }
    return 5;
  }
  uVar4 = (uint)*(byte *)(param_1 + 0x2c);
  if (uVar4 == 10) {
    iVar6 = (int)(char)(&DAT_005a7db8)[(uint)*(byte *)(param_1 + 0xa7) * 0x16];
  }
  else {
    if ((uVar4 == 0x15) && ((*(byte *)(param_1 + 0xe) & 0x80) != 0)) {
      local_2 = CONCAT11((char)((ushort)*(undefined2 *)(param_1 + 0x3f) >> 8),
                         (char)((ushort)*(undefined2 *)(param_1 + 0x3d) >> 8));
      puVar5 = (unit_struct *)0x0;
      uVar3 = (&game_state.level_data[0].unit_index_2)
              [((local_2 & 0xfe) * 2 | local_2 & 0xfe00) * 2] & 0x3ff;
      if ((uVar3 != 0) &&
         ((puVar1 = unit_land_array[uVar3], (*(byte *)&puVar1->flags_2 & 1) == 0 &&
          (puVar1->unit_class != '\0')))) {
        puVar5 = puVar1;
      }
      if (puVar5 != (unit_struct *)0x0) {
        iVar6 = (int)(char)unit_type_array_building[(byte)puVar5->unit_type].field_0x32;
        goto LAB_0045149e;
      }
    }
    iVar6 = (int)*(char *)(unit_type_related_1_ARRAY_005a6f78 + uVar4);
  }
LAB_0045149e:
  if ((((*(char *)(param_1 + 0x2b) == '\x04') && (cVar2 = FUN_004df0e0(param_1), cVar2 != '\0')) &&
      ((*(byte *)(param_1 + 0x76) & 0x40) == 0)) && ((*(byte *)(param_1 + 0xe) & 0x80) == 0)) {
    return 2;
  }
  return iVar6;
}
