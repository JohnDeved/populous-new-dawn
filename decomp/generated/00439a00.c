/* Ghidra 12.1.3 pseudocode; entry 00439a00; FUN_00439a00.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


undefined4 FUN_00439a00(int param_1,int param_2)

{
  undefined2 uVar1;
  unit_struct *puVar2;
  char cVar3;
  bool bVar4;
  short sVar5;
  int iVar6;
  uint uVar7;
  uint uVar8;
  unit_struct *puVar9;

  switch(*(undefined1 *)(param_1 + 0x2d)) {
  case 0:
    if ((*(uint *)(param_1 + 0xc) & 0x40000000) != 0) {
      *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) & 0xbfffffff;
      FUN_004d4f40(param_1);
    }
    if (((*(byte *)(param_1 + 0x2e) & 1) == 0) &&
       (cVar3 = FUN_0043bb60(param_1,param_2), cVar3 != '\0')) {
      *(undefined1 *)(param_1 + 0x2d) = 1;
      *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) | 0x40000000;
      return 0;
    }
    break;
  case 1:
    iVar6 = FUN_0044fe80(5,0xb,param_2 + 6,param_1 + 0x3d);
    if ((iVar6 == 0) && (iVar6 = FUN_004a7730(param_2 + 6), iVar6 == 0)) {
      *(undefined2 *)(param_1 + 0x72) = 0;
      return 1;
    }
    uVar1 = *(undefined2 *)(iVar6 + 0x24);
    *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) | 0x40000000;
    *(undefined2 *)(param_1 + 0x72) = uVar1;
    *(undefined1 *)(param_1 + 0x2d) = 2;
    return 0;
  case 2:
    puVar9 = (unit_struct *)0x0;
    if (((*(ushort *)(param_1 + 0x72) != 0) &&
        (puVar2 = unit_land_array[*(ushort *)(param_1 + 0x72)], (*(byte *)&puVar2->flags_2 & 1) == 0
        )) && (puVar2->unit_class != '\0')) {
      puVar9 = puVar2;
    }
    if (puVar9 == (unit_struct *)0x0) {
      *(undefined1 *)(param_1 + 0x2d) = 0;
      *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) | 0x40000000;
      return 0;
    }
    if ((*(uint *)(param_1 + 0xc) & 0x40000000) != 0) {
      *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) & 0xbfffffff;
      FUN_004e9d80(param_1,&puVar9->pos);
    }
    uVar7 = (int)*(short *)(param_1 + 0x4f) - (int)*(short *)(param_1 + 0x3d);
    uVar8 = (int)uVar7 >> 0x1f;
    if ((0x6f < (int)((uVar7 ^ uVar8) - uVar8)) ||
       (uVar7 = (int)*(short *)(param_1 + 0x51) - (int)*(short *)(param_1 + 0x3f),
       uVar8 = (int)uVar7 >> 0x1f, bVar4 = true, 0x6f < (int)((uVar7 ^ uVar8) - uVar8))) {
      bVar4 = false;
    }
    if (bVar4) {
      *(undefined1 *)(param_1 + 0x2d) = 3;
      *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) | 0x40000000;
      return 0;
    }
    break;
  case 3:
    puVar9 = (unit_struct *)0x0;
    if (((*(ushort *)(param_1 + 0x72) != 0) &&
        (puVar2 = unit_land_array[*(ushort *)(param_1 + 0x72)], (*(byte *)&puVar2->flags_2 & 1) == 0
        )) && (puVar2->unit_class != '\0')) {
      puVar9 = puVar2;
    }
    if (puVar9 == (unit_struct *)0x0) {
      *(undefined1 *)(param_1 + 0x2d) = 0;
      *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) | 0x40000000;
    }
    else {
      if ((*(uint *)(param_1 + 0xc) & 0x40000000) != 0) {
        *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) & 0xbfffffff;
        *(ushort *)(param_1 + 0x76) = *(ushort *)(param_1 + 0x76) & 0xfff7;
        *(undefined2 *)(param_1 + 0x5f) = 0;
        unit_set_object_upper(param_1,0x65);
        *(undefined1 *)(param_1 + 0x39) = 0;
        *(undefined2 *)(param_1 + 0x37) = 1;
        *(ushort *)(param_1 + 0x70) =
             ((char)obj_related_array[*(byte *)(param_1 + 0x3a) + 3]._f2 + 1) *
             (ushort)(byte)vstart_related[*(short *)(param_1 + 0x33)].frame_counter;
      }
      sVar5 = *(short *)(param_1 + 0x70) + -1;
      *(short *)(param_1 + 0x70) = sVar5;
      if (sVar5 < 1) {
        FUN_004a7b60(puVar9,1,0);
        return 1;
      }
    }
  }
  return 0;
}
