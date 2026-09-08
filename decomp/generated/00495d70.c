/* Ghidra 12.1.3 pseudocode; entry 00495d70; FUN_00495d70.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


undefined1 FUN_00495d70(int param_1)

{
  unit_struct *puVar1;
  unit_type_scenery *puVar2;
  char cVar3;
  undefined1 uVar4;
  char cVar5;
  bool bVar6;
  short sVar7;
  uint uVar8;
  unit_struct *puVar9;
  int iVar10;
  uint uVar11;
  unit_struct **ppuVar12;
  int local_324;
  unit_struct *local_320 [200];

  cVar5 = '\0';
  uVar8 = *(uint *)(param_1 + 0xc);
  *(uint *)(param_1 + 0xc) = uVar8 & 0xffff7fff;
  if ((uVar8 & 0x40000000) != 0) {
    *(undefined1 *)(param_1 + 0xa8) = 4;
    *(byte *)(param_1 + 0x76) = *(byte *)(param_1 + 0x76) | 0x10;
    *(uint *)(param_1 + 0xc) = uVar8 & 0xbfff7fff;
    *(undefined1 *)(param_1 + 0xaa) = 0;
  }
  switch(*(undefined1 *)(param_1 + 0xa8)) {
  case 1:
    cVar5 = FUN_00438ca0(param_1,0x38);
    if (cVar5 == '\0') {
      return 0;
    }
    FUN_004d58c0(param_1,0);
    *(undefined1 *)(param_1 + 0xa8) = 4;
    break;
  default:
    goto switchD_00495dcf_caseD_2;
  case 4:
    if ((*(byte *)(param_1 + 0x76) & 0x10) != 0) {
      *(undefined2 *)(param_1 + 0x70) = 0x10;
      *(undefined2 *)(param_1 + 0x72) = 0;
    }
    cVar5 = FUN_004391a0(param_1);
    if (cVar5 == '\0') {
      return 0;
    }
    *(undefined1 *)(param_1 + 0xa8) = 10;
    break;
  case 10:
    if ((*(byte *)(param_1 + 0x2e) & 7) != 0) {
      return 0;
    }
    puVar9 = unit_land_array[*(ushort *)(param_1 + 0x89)];
    FUN_004b9d50(CONCAT22((short)((uint)puVar9 >> 0x10),(ushort)(byte)puVar9->field_0x9b),
                 (short)puVar9->coord_scale_4,local_320,&local_324);
    iVar10 = 0;
    bVar6 = false;
    if (0 < local_324) {
      ppuVar12 = local_320;
      do {
        if (bVar6) goto LAB_00495edb;
        for (local_320[0] = unit_land_array[*(short *)((int)&(*ppuVar12)->next_unit_1 + 2)];
            local_320[0] != (unit_struct *)0x0;
            local_320[0] = unit_land_array[local_320[0]->next_unit_index]) {
          if (((local_320[0]->unit_class == '\x05') &&
              (puVar2 = unit_type_array_scenery + (byte)local_320[0]->unit_type,
              uVar11._0_1_ = puVar2->flags_1, uVar11._1_1_ = puVar2->flags,
              uVar11._2_1_ = puVar2->field14_0x16, uVar11._3_1_ = puVar2->field15_0x17,
              (uVar11 & 0x40) != 0)) && ((*(byte *)(param_1 + 0x90) & 4) == 0)) {
            bVar6 = true;
            break;
          }
        }
        ppuVar12 = ppuVar12 + 2;
        iVar10 = iVar10 + 1;
      } while (iVar10 < local_324);
    }
    if (!bVar6) {
      return 2;
    }
LAB_00495edb:
    *(undefined1 *)(param_1 + 0xa8) = 0xb;
    *(byte *)(param_1 + 0x76) = *(byte *)(param_1 + 0x76) | 0x10;
    *(undefined2 *)(param_1 + 0x72) = local_320[0]->unit_index;
    return 0;
  case 0xb:
    cVar3 = FUN_004392a0(param_1);
    if (cVar3 == '\x01') {
      cVar5 = '\x15';
    }
    else if (cVar3 == '\x02') {
      cVar5 = '\x04';
    }
    goto joined_r0x004961a5;
  case 0xd:
    if ((*(byte *)(param_1 + 0x76) & 0x10) != 0) {
      *(undefined2 *)(param_1 + 0x70) = 5;
    }
    cVar5 = FUN_004393d0(param_1);
    if (cVar5 == '\0') {
      return 0;
    }
    *(undefined1 *)(param_1 + 0xa8) = 4;
    break;
  case 0x14:
    cVar5 = FUN_00432da0(param_1 + 0x3d,0x38,param_1 + 0x4f,0x38);
    if (cVar5 == '\0') {
      uVar4 = 10;
    }
    else {
      puVar9 = (unit_struct *)0x0;
      if (((*(ushort *)(param_1 + 0x72) != 0) &&
          (puVar1 = unit_land_array[*(ushort *)(param_1 + 0x72)],
          (*(byte *)&puVar1->flags_2 & 1) == 0)) && (puVar1->unit_class != '\0')) {
        puVar9 = puVar1;
      }
      if (puVar9 == (unit_struct *)0x0) {
        uVar4 = 4;
      }
      else {
        FUN_004a7b60(puVar9,0,0);
        uVar4 = 0xd;
      }
    }
    *(undefined1 *)(param_1 + 0xa8) = uVar4;
    break;
  case 0x15:
    if ((*(ushort *)(param_1 + 0x76) & 0x10) != 0) {
      *(undefined2 *)(param_1 + 0x70) = 6;
    }
    puVar9 = (unit_struct *)0x0;
    if (((*(ushort *)(param_1 + 0x72) != 0) &&
        (puVar1 = unit_land_array[*(ushort *)(param_1 + 0x72)], (*(byte *)&puVar1->flags_2 & 1) == 0
        )) && (puVar1->unit_class != '\0')) {
      puVar9 = puVar1;
    }
    if (puVar9 == (unit_struct *)0x0) {
      *(undefined1 *)(param_1 + 0xa8) = 4;
      *(ushort *)(param_1 + 0x76) = *(ushort *)(param_1 + 0x76) | 0x10;
      return 0;
    }
    cVar5 = FUN_00439240(param_1);
    if (cVar5 == '\0') {
      return 0;
    }
    puVar2 = unit_type_array_scenery + (byte)puVar9->unit_type;
    uVar8._0_1_ = puVar2->flags_1;
    uVar8._1_1_ = puVar2->flags;
    uVar8._2_1_ = puVar2->field14_0x16;
    uVar8._3_1_ = puVar2->field15_0x17;
    if ((uVar8 & 0x80) == 0) {
      if ((uVar8 & 0x10) == 0) {
        if (puVar9->unit_type != 0xb) {
          return 0;
        }
        *(undefined1 *)(param_1 + 0xa8) = 0x1d;
      }
      else {
        *(undefined1 *)(param_1 + 0xa8) = 0x33;
      }
    }
    else {
      *(undefined1 *)(param_1 + 0xa8) = 0x14;
    }
    break;
  case 0x1d:
    cVar5 = FUN_00432da0(param_1 + 0x3d,0x38,param_1 + 0x4f,0x38);
    if (cVar5 == '\0') {
      uVar4 = 10;
    }
    else {
      puVar9 = (unit_struct *)0x0;
      if (((*(ushort *)(param_1 + 0x72) != 0) &&
          (puVar1 = unit_land_array[*(ushort *)(param_1 + 0x72)],
          (*(byte *)&puVar1->flags_2 & 1) == 0)) && (puVar1->unit_class != '\0')) {
        puVar9 = puVar1;
      }
      if (puVar9 == (unit_struct *)0x0) {
        uVar4 = 4;
      }
      else {
        if (*(short *)(param_1 + 0x78) <
            (short)unit_type_array_person[*(byte *)(param_1 + 0x2b)].wood) {
          FUN_004a7860(puVar9,param_1,
                       (int)(short)unit_type_array_person[*(byte *)(param_1 + 0x2b)].wood);
        }
        uVar4 = 1;
      }
    }
    *(undefined1 *)(param_1 + 0xa8) = uVar4;
    break;
  case 0x33:
    if ((*(ushort *)(param_1 + 0x76) & 0x10) != 0) {
      *(ushort *)(param_1 + 0x76) = *(ushort *)(param_1 + 0x76) & 0xffef;
      FUN_004d50d0(param_1);
      FUN_0048a050(param_1,1,0x10);
      *(ushort *)(param_1 + 0x70) =
           (ushort)(byte)unit_type_array_person[*(byte *)(param_1 + 0x2b)].field_0x1d;
    }
    uVar8 = (int)*(short *)(param_1 + 0x4f) - (int)*(short *)(param_1 + 0x3d);
    uVar11 = (int)uVar8 >> 0x1f;
    if ((0x6f < (int)((uVar8 ^ uVar11) - uVar11)) ||
       (uVar8 = (int)*(short *)(param_1 + 0x51) - (int)*(short *)(param_1 + 0x3f),
       uVar11 = (int)uVar8 >> 0x1f, bVar6 = true, 0x6f < (int)((uVar8 ^ uVar11) - uVar11))) {
      bVar6 = false;
    }
    if (bVar6) {
      puVar9 = (unit_struct *)0x0;
      if (((*(ushort *)(param_1 + 0x72) != 0) &&
          (puVar1 = unit_land_array[*(ushort *)(param_1 + 0x72)],
          (*(byte *)&puVar1->flags_2 & 1) == 0)) && (puVar1->unit_class != '\0')) {
        puVar9 = puVar1;
      }
      if (puVar9 == (unit_struct *)0x0) {
        cVar5 = '\x04';
      }
      else if (*(short *)(param_1 + 0x78) <
               (short)unit_type_array_person[*(byte *)(param_1 + 0x2b)].wood) {
        sVar7 = *(short *)(param_1 + 0x70) + -1;
        *(short *)(param_1 + 0x70) = sVar7;
        if (sVar7 == 0) {
          cVar5 = '\x01';
          FUN_004a7860(puVar9,param_1,
                       (int)(short)unit_type_array_person[*(byte *)(param_1 + 0x2b)].wood);
        }
      }
      else {
        cVar5 = '\x01';
      }
    }
    else {
      cVar5 = '\n';
    }
joined_r0x004961a5:
    if (cVar5 == '\0') {
      return 0;
    }
    *(char *)(param_1 + 0xa8) = cVar5;
  }
  *(byte *)(param_1 + 0x76) = *(byte *)(param_1 + 0x76) | 0x10;
switchD_00495dcf_caseD_2:
  return 0;
}
