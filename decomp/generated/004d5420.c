/* Ghidra 12.1.3 pseudocode; entry 004d5420; FUN_004d5420.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


undefined1 FUN_004d5420(unit_struct *param_1,ushort *param_2)

{
  short *psVar1;
  ushort uVar2;
  byte bVar3;
  short sVar4;
  unit_struct *puVar5;
  ushort uVar6;
  bool bVar7;
  char cVar8;
  uint uVar9;
  int iVar10;
  undefined4 local_6;
  short local_2;

  uVar9 = (*param_2 & 0xfe) * 2 | *param_2 & 0xfe00;
  cVar8 = FUN_004d55a0(uVar9 * 4 + 0x8a03e4);
  if (cVar8 != '\0') {
    bVar7 = false;
    local_6._0_2_ = *param_2 & 0xfefe;
    uVar6 = (ushort)local_6 >> 8;
    bVar3 = (byte)param_2[1];
    iVar10 = DAT_00895ef1;
    if ((bVar3 & 0xf0) != 0) {
      iVar10 = *(int *)(&DAT_00895ed9 + (uint)(bVar3 >> 4) * 4);
    }
    psVar1 = (short *)(iVar10 + (uint)(bVar3 & 0xf) * 4);
    uVar2 = ((*param_2 & 0xfe) + 1) * 0x100 + *psVar1;
    local_6 = (uint)uVar2 << 0x10;
    local_2 = (uVar6 + 1) * 0x100 + psVar1[1];
    local_6 = CONCAT31(local_6._1_3_,(char)(uVar2 >> 8)) & 0xfffffffe;
    local_6 = CONCAT22(local_6._2_2_,CONCAT11((char)((ushort)local_2 >> 8),(undefined1)local_6)) &
              0xfffffeff;
    sVar4 = *(short *)&unit_related_struct_26B_ARRAY_005a7b90[(byte)param_1->some_index].field_0x10;
    iVar10 = FUN_0044f600(local_6);
    if ((iVar10 <= sVar4) && (cVar8 = FUN_0044f980((int)&local_6 + 2), cVar8 != '\0')) {
      bVar7 = true;
    }
    if (bVar7) {
      puVar5 = unit_land_array[(short)(&game_state.level_data[0].unit_index)[uVar9 * 2]];
      while( true ) {
        if (puVar5 == (unit_struct *)0x0) {
          return 1;
        }
        if ((((puVar5->unit_class == '\x01') && ((puVar5->obj_index_anim_prev_2 & 1U) != 0)) &&
            (param_1 != puVar5)) &&
           ((((*(byte *)&puVar5->loc_2_y ^ (byte)param_2[1]) & 0xf) == 0 &&
            (puVar5->loc_2_x == *param_2)))) break;
        puVar5 = unit_land_array[puVar5->next_unit_index];
      }
    }
  }
  return 0;
}
