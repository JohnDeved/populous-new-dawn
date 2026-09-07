/* Ghidra 12.1.3 pseudocode; entry 004e9160; FUN_004e9160.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_004e9160(int param_1,undefined2 *param_2)

{
  byte bVar1;
  uint uVar2;
  uint uVar3;
  unit_struct *puVar4;
  bool bVar5;
  char cVar6;
  int iVar7;
  unit_struct *puVar8;
  undefined1 uVar9;
  bool bVar10;
  undefined4 local_6;
  undefined2 local_2;

  local_2 = param_2[1];
  local_6 = CONCAT22(*param_2,(undefined2)local_6);
  uVar2 = local_6;
  bVar5 = false;
  if ((*(byte *)(param_1 + 0x11) & 4) == 0) {
    bVar1 = *(byte *)(param_1 + 0x30);
    if ((unit_related_struct_26B_ARRAY_005a7b90[bVar1].field_0x18 & 8) == 0) {
      local_2._1_1_ = (byte)((ushort)local_2 >> 8);
      local_6._3_1_ = (byte)((ushort)*param_2 >> 8);
      iVar7 = (uint)local_2._1_1_ * 0x100 + (uint)local_6._3_1_;
      bVar10 = (*(byte *)(game_state._841980_4_ + (iVar7 >> 3)) & '\x01' << ((byte)iVar7 & 7)) == 0;
      local_6 = uVar2;
    }
    else {
      iVar7 = FUN_0044f750((int)&local_6 + 2);
      bVar10 = *(short *)&unit_related_struct_26B_ARRAY_005a7b90[bVar1].field_0x10 < iVar7;
    }
    if ((!bVar10) &&
       (iVar7 = (int)*(short *)&unit_related_struct_26B_ARRAY_005a7b90[*(byte *)(param_1 + 0x30)].
                                field_0x4,
       (int)*(short *)(param_1 + 0x4d) * (int)*(short *)(param_1 + 0x4d) +
       (int)*(short *)(param_1 + 0x49) * (int)*(short *)(param_1 + 0x49) <=
       iVar7 * iVar7 + ((int)(iVar7 + (iVar7 >> 0x1f & 3U)) >> 2))) {
      bVar5 = true;
    }
  }
  if (!bVar5) {
    if ((*(byte *)(param_1 + 0x17) & 8) != 0) {
      local_6 = CONCAT31(local_6._1_3_,(char)(local_6 >> 0x18)) & 0xfffffffe;
      local_6 = CONCAT22(local_6._2_2_,CONCAT11((char)((ushort)local_2 >> 8),(undefined1)local_6)) &
                0xfffffeff;
      cVar6 = FUN_0044ebe0(local_6,1);
      if (cVar6 != '\0') {
        bVar5 = true;
      }
    }
    if (!bVar5) {
      return;
    }
  }
  uVar2 = *(uint *)(param_1 + 0xc);
  uVar3 = *(uint *)(param_1 + 0x14);
  *(uint *)(param_1 + 0xc) = uVar2 & 0xfff7ffff;
  *(uint *)(param_1 + 0x14) = uVar3 & 0xf7ffffff;
  if ((*(byte *)(param_1 + 0x11) & 0x20) != 0) {
    if (*(char *)(param_1 + 0x2a) == '\x01') {
      FUN_004d3ea0(param_1);
    }
    *(uint *)(param_1 + 0x10) = *(uint *)(param_1 + 0x10) & 0xffffdfff;
    return;
  }
  if ((uVar3 & 0x10000) != 0) {
    puVar8 = (unit_struct *)0x0;
    *(uint *)(param_1 + 0x14) = uVar3 & 0xf7feffff;
    if (((*(ushort *)(param_1 + 0x72) != 0) &&
        (puVar4 = unit_land_array[*(ushort *)(param_1 + 0x72)], (*(byte *)&puVar4->flags_2 & 1) == 0
        )) && (puVar4->unit_class != '\0')) {
      puVar8 = puVar4;
    }
    if (puVar8 == (unit_struct *)0x0) {
      return;
    }
    cVar6 = FUN_0051f990(param_1,puVar8,1);
    if (cVar6 == '\0') {
      return;
    }
    cVar6 = FUN_0051fcd0(param_1);
    if (cVar6 == '\0') {
      return;
    }
    if ((*(byte *)(param_1 + 0xe) & 0x10) != 0) {
      return;
    }
    *(undefined1 *)(param_1 + 0x7d) = *(undefined1 *)(param_1 + 0x2c);
    empty_unit_function(param_1);
    *(undefined1 *)(param_1 + 0x2c) = 0x24;
    init_unit_class(param_1);
    return;
  }
  if (*(char *)(param_1 + 0x2a) != '\x01') {
    if (*(char *)(param_1 + 0x2a) != '\x03') {
      return;
    }
    FUN_004465a0(param_1);
    return;
  }
  *(undefined2 *)(param_1 + 0x61) = 0;
  *(uint *)(param_1 + 0xc) = uVar2 & 0xfff7f7ff;
  *(undefined1 *)(param_1 + 0x66) = 0;
  *(uint *)(param_1 + 0xc) = uVar2 & 0xdff7f7ff;
  *(uint *)(param_1 + 0xc) = uVar2 & 0xdff7f7ff | 0x1000;
  if ((uVar2 & 0x100000) != 0) {
    return;
  }
  *(undefined1 *)(param_1 + 0x7d) = *(undefined1 *)(param_1 + 0x2c);
  if ((game_state.level_flags & 2) == 0) {
    bVar1 = *(byte *)(param_1 + 0x2b);
  }
  else {
    bVar1 = *(byte *)(param_1 + 0x2b);
    if (bVar1 == 7) {
      uVar9 = 0x27;
      goto LAB_004e932b;
    }
  }
  uVar9 = unit_type_array_person[bVar1].next_state;
LAB_004e932b:
  empty_unit_function(param_1);
  *(undefined1 *)(param_1 + 0x2c) = uVar9;
  init_unit_class(param_1);
  return;
}
