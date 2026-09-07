/* Ghidra 12.1.3 pseudocode; entry 0040c4e0; FUN_0040c4e0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_0040c4e0(int param_1)

{
  unit_struct *puVar1;
  bool bVar2;
  char cVar3;
  shape_entry *psVar4;
  int iVar5;
  unit_struct *puVar6;
  uint uVar7;
  undefined4 uVar8;
  uint uVar9;
  short local_8;
  short local_6;
  undefined2 local_4;

  if (*(char *)(param_1 + 0x2f) != player_tribe_num) {
    return;
  }
  if ((unit_type_array_building[*(byte *)(param_1 + 0x2b)].field_0x49 & 0x10) == 0) {
    return;
  }
  bVar2 = false;
  uVar7 = (uint)(byte)unit_type_array_building[*(byte *)(param_1 + 0x2b)].field31_0x20;
  uVar9 = (uint)*(char *)(param_1 + 0xa6);
  if (*(ushort *)(param_1 + 0x92) == 0) goto LAB_0040c58b;
  puVar1 = unit_land_array[*(ushort *)(param_1 + 0x92)];
  puVar6 = (unit_struct *)0x0;
  if (((*(byte *)&puVar1->flags_2 & 1) == 0) && (puVar1->unit_class != '\0')) {
    puVar6 = puVar1;
  }
  if (puVar6 != (unit_struct *)0x0) {
    if (puVar6->unit_type == 'J') {
      if (uVar7 != uVar9) goto LAB_0040c570;
    }
    else if (((puVar6->unit_type != 'K') || ((int)uVar7 <= (int)uVar9)) || (uVar9 == 0)) {
LAB_0040c570:
      bVar2 = true;
    }
    if (!bVar2) goto LAB_0040c58b;
    FUN_004ef180(puVar6);
  }
  *(undefined2 *)(param_1 + 0x92) = 0;
LAB_0040c58b:
  if ((*(short *)(param_1 + 0x92) == 0) && (uVar9 != 0)) {
    uVar8 = 0x4b;
    if ((int)uVar7 <= (int)uVar9) {
      uVar8 = 0x4a;
    }
    cVar3 = FUN_004edae0(7,uVar8);
    if (cVar3 != '\0') {
      psVar4 = shapes_mem +
               (char)(&objs0_mem[*(short *)(param_1 + 0x33)].shapes_index)
                     [(short)((int)((int)*(short *)(param_1 + 0x26) +
                                   ((int)*(short *)(param_1 + 0x26) >> 0x1f & 0x1ffU)) >> 9)];
      local_4 = 0;
      local_6 = ((short)(char)psVar4->field_0x5 + (ushort)(byte)psVar4->y2 * -4) * 0x40 +
                *(short *)(param_1 + 0x7c);
      local_8 = ((short)(char)psVar4->field_0x4 + (ushort)(byte)psVar4->x2 * -4) * 0x40 +
                *(short *)(param_1 + 0x7a);
      iVar5 = alloc_unit_2(7,uVar8,CONCAT31((int3)(CONCAT22((short)((uint)psVar4 >> 0x10),
                                                            (ushort)(byte)psVar4->x2 * 4) >> 8),
                                            *(undefined1 *)(param_1 + 0x2f)),&local_8);
      if (iVar5 != 0) {
        *(undefined2 *)(param_1 + 0x92) = *(undefined2 *)(iVar5 + 0x24);
      }
    }
  }
  return;
}
