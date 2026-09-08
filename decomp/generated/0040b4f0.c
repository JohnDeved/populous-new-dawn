/* Ghidra 12.1.3 pseudocode; entry 0040b4f0; FUN_0040b4f0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


int FUN_0040b4f0(int param_1,uint *param_2,int *param_3,int *param_4,undefined1 *param_5)

{
  byte bVar1;
  char cVar2;
  unit_struct *puVar3;
  int iVar4;
  int iVar5;
  undefined1 uVar6;
  unit_struct *puVar7;
  uint uVar8;
  int iVar9;
  short local_4;
  short local_2;

  uVar8 = 0;
  iVar9 = 0;
  uVar6 = 1;
  if (*(char *)(param_1 + 0x2a) == '\x02') {
    if (*(char *)(param_1 + 0x2c) != '\x01') {
      bVar1 = *(byte *)(param_1 + 0x2b);
      if ((char)unit_type_array_building[bVar1].unit_type == 0) {
        if (((unit_type_array_building[bVar1].field_0x48 & 0x40) != 0) &&
           ((*(short *)(param_1 + 0x84) != 0 || ((*(byte *)(param_1 + 0x9c) & 0x20) != 0)))) {
          iVar9 = (int)*(short *)(param_1 + 0xa4);
          uVar8 = (uint)*(short *)&unit_type_array_vehicle
                                   [(byte)unit_type_array_building[bVar1].unit_type1].field_0x13;
        }
      }
      else {
        uVar6 = 3;
        uVar8 = (uint)*(ushort *)
                       &unit_type_array_building[(char)unit_type_array_building[bVar1].unit_type].
                        field_0x1a;
      }
      goto LAB_0040b5ec;
    }
    puVar7 = (unit_struct *)0x0;
    uVar8 = (uint)*(ushort *)&unit_type_array_building[*(byte *)(param_1 + 0x2b)].field_0x1a;
    if (((*(ushort *)(param_1 + 0x82) != 0) &&
        (puVar3 = unit_land_array[*(ushort *)(param_1 + 0x82)], (*(byte *)&puVar3->flags_2 & 1) == 0
        )) && (puVar3->unit_class != '\0')) {
      puVar7 = puVar3;
    }
    if (puVar7 == (unit_struct *)0x0) goto LAB_0040b5ec;
  }
  else {
    uVar8 = (uint)*(ushort *)&unit_type_array_building[*(byte *)(param_1 + 0x9e)].field_0x1a;
  }
  iVar9 = (int)*(short *)(param_1 + 0x96);
LAB_0040b5ec:
  if (*(char *)(param_1 + 0x2a) == '\t') {
    FUN_004b9fc0(param_1,&local_4);
  }
  else {
    cVar2 = (&objs0_mem[*(short *)(param_1 + 0x33)].shapes_index)
            [(short)((int)((int)*(short *)(param_1 + 0x26) +
                          ((int)*(short *)(param_1 + 0x26) >> 0x1f & 0x1ffU)) >> 9)];
    local_4 = *(short *)(param_1 + 0x7a) + (ushort)(byte)shapes_mem[cVar2].x2 * -0x100 +
              (char)shapes_mem[cVar2].field6_0x6 * 0x40;
    local_2 = *(short *)(param_1 + 0x7c) + (ushort)(byte)shapes_mem[cVar2].y2 * -0x100 +
              (char)shapes_mem[cVar2].field7_0x7 * 0x40;
  }
  iVar4 = FUN_004a77d0(&local_4);
  iVar5 = (uVar8 - iVar9) - iVar4;
  if (iVar5 < 0) {
    iVar5 = 0;
  }
  if (param_2 != (uint *)0x0) {
    *param_2 = uVar8;
  }
  if (param_3 != (int *)0x0) {
    *param_3 = iVar9;
  }
  if (param_4 != (int *)0x0) {
    *param_4 = iVar4;
  }
  if (param_5 != (undefined1 *)0x0) {
    *param_5 = uVar6;
  }
  return iVar5;
}
