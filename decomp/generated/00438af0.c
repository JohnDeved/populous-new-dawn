/* Ghidra 12.1.3 pseudocode; entry 00438af0; FUN_00438af0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


undefined4 FUN_00438af0(int param_1,byte *param_2)

{
  unit_struct *puVar1;
  bool bVar2;
  char cVar3;
  int iVar4;
  int iVar5;
  uint uVar6;
  unit_struct *puVar7;
  uint uVar8;
  ushort local_6;
  undefined4 local_4;

  bVar2 = true;
  if (((*(char *)(param_1 + 0x2b) != '\x06') && (*(ushort *)(param_1 + 0x9f) != 0)) &&
     (cVar3 = FUN_00465650(unit_land_array[*(ushort *)(param_1 + 0x9f)]), cVar3 == '\0')) {
    bVar2 = false;
  }
  if (bVar2) {
    if ((*(byte *)(param_1 + 0x12) & 8) == 0) {
      if (((&DAT_005a7dcb)[(uint)*param_2 * 0x16] & 8) == 0) {
        puVar7 = (unit_struct *)0x0;
        if (((*(ushort *)(param_2 + 6) != 0) &&
            (puVar1 = unit_land_array[*(ushort *)(param_2 + 6)],
            (*(byte *)&puVar1->flags_2 & 1) == 0)) && (puVar1->unit_class != '\0')) {
          puVar7 = puVar1;
        }
        if (puVar7 == (unit_struct *)0x0) {
          local_4 = *(undefined4 *)(param_1 + 0x3d);
        }
        else {
          local_4._0_2_ = (puVar7->pos).x;
          local_4._2_2_ = (puVar7->pos).y;
        }
      }
      else {
        local_6 = *(ushort *)(param_2 + 6) & 0xfefe;
        local_4 = CONCAT22(((local_6 >> 8) + 1) * 0x100,
                           ((*(ushort *)(param_2 + 6) & 0xfe) + 1) * 0x100);
      }
    }
    else {
      local_4 = *(undefined4 *)(param_1 + 0x4f);
    }
    if (*(char *)(param_1 + 0x2b) == '\x06') {
      iVar5 = get_unit_circle_length(param_1);
      iVar5 = (iVar5 * 0x200) / 2;
    }
    else {
      if ((param_2[1] & 4) == 0) {
        if (((&DAT_005a7dcb)[(uint)*param_2 * 0x16] & 8) == 0) {
          iVar4 = FUN_0051ff60(param_1);
          iVar5 = iVar4;
        }
        else if ((param_2[8] == 0) || (param_2[9] == 0)) {
          iVar4 = FUN_0051ff60(param_1);
          iVar5 = iVar4;
        }
        else {
          iVar4 = param_2[9] + 1;
          iVar5 = param_2[8] + 1;
        }
      }
      else {
        iVar4 = 0xc00;
        iVar5 = iVar4;
      }
      if (iVar5 <= iVar4) {
        iVar5 = iVar4;
      }
      iVar5 = (((iVar5 + 1) * 0x200) / 2) * 2;
    }
    uVar6 = (int)*(short *)(param_1 + 0x3d) - (int)(short)local_4;
    uVar8 = (int)uVar6 >> 0x1f;
    if (((int)((uVar6 ^ uVar8) - uVar8) < iVar5 + 0x38) &&
       (uVar6 = (int)*(short *)(param_1 + 0x3f) - (int)local_4._2_2_, uVar8 = (int)uVar6 >> 0x1f,
       (int)((uVar6 ^ uVar8) - uVar8) < iVar5 + 0x38)) {
      return 1;
    }
  }
  return 0;
}
