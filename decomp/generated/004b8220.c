/* Ghidra 12.1.3 pseudocode; entry 004b8220; FUN_004b8220.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_004b8220(int param_1)

{
  char cVar1;
  byte bVar2;
  unit_struct *puVar3;
  bool bVar4;
  uint3 uVar5;
  short sVar6;
  undefined2 extraout_var;
  ushort uVar7;
  uint uVar8;
  shape_entry *psVar9;
  uint uVar10;
  short *psVar11;
  unit_struct *puVar12;
  byte local_332;
  byte bStack_331;
  short sStack_330;
  short local_32e;
  undefined2 uStack_32c;
  undefined2 local_328;
  undefined2 uStack_326;
  undefined2 uStack_324;
  undefined2 uStack_322;
  undefined2 local_320;

  bVar4 = false;
  local_320 = CONCAT11(*(undefined1 *)(param_1 + 0x40),*(undefined1 *)(param_1 + 0x3e));
  uVar7 = (&game_state.level_data[0].unit_index_2)
          [((local_320 & 0xfe) * 2 | local_320 & 0xfe00) * 2] & 0x3ff;
  if (uVar7 != 0) {
    puVar3 = unit_land_array[uVar7];
    puVar12 = (unit_struct *)0x0;
    if (((*(byte *)&puVar3->flags_2 & 1) == 0) && (puVar3->unit_class != '\0')) {
      puVar12 = puVar3;
    }
    if (puVar12 != (unit_struct *)0x0) {
      if (puVar12->unit_class == '\x02') {
        cVar1 = puVar12->unit_type;
      }
      else {
        if ((puVar12->unit_class != '\t') ||
           (sVar6._0_1_ = puVar12->num_points, sVar6._1_1_ = puVar12->tex_size_type, sVar6 == 0))
        goto LAB_004b82c4;
        cVar1 = unit_land_array[sVar6]->unit_type;
      }
      if (cVar1 == '\n') {
        bVar4 = true;
      }
    }
  }
LAB_004b82c4:
  if ((*(char *)(param_1 + 0x9e) == '\n') && (!bVar4)) {
    FUN_0042cfc0(CONCAT22(sStack_330,
                          CONCAT11(*(undefined1 *)(param_1 + 0x40),*(undefined1 *)(param_1 + 0x3e)))
                 & 0xfffffefe);
  }
  *(undefined2 *)(param_1 + 0x49) = *(undefined2 *)(param_1 + 0x3d);
  *(undefined2 *)(param_1 + 0x4d) = *(undefined2 *)(param_1 + 0x3f);
  local_332 = (byte)*(undefined2 *)(param_1 + 0x68);
  bStack_331 = (byte)((ushort)*(undefined2 *)(param_1 + 0x68) >> 8);
  sStack_330 = (ushort)(local_332 & 0xfe) << 8;
  psVar9 = shapes_mem + *(byte *)(param_1 + 0x9b);
  uVar5 = CONCAT21(local_32e,local_332);
  local_32e = (ushort)(bStack_331 & 0xfe) << 8;
  uStack_32c = calc_point_height((uint)(uVar5 & 0xfffffe) << 8,
                                 (uint)(CONCAT21(uStack_32c,bStack_331) & 0xfffffe) << 8);
  sStack_330 = sStack_330 + (short)(((uint)(byte)psVar9->x1 * 0x100) / 2) * 2;
  local_32e = local_32e + (short)(((uint)(byte)psVar9->y1 * 0x100) / 2) * 2;
  add_unit_to_cell(param_1,&sStack_330);
  FUN_004b9e20(CONCAT22((short)((uint)&uStack_324 >> 0x10),(ushort)*(byte *)(param_1 + 0x9b)),
               CONCAT22(extraout_var,*(undefined2 *)(param_1 + 0x68)),&local_320,&uStack_324);
  bVar2 = *(byte *)(param_1 + 0x9e);
  if (bVar2 != 10) {
    if ((bVar2 < 0xd) || (0xe < bVar2)) {
      if ((level_flags_1._1_1_ & 0x40) == 0) {
        sVar6 = FUN_0044fd80(&local_320,CONCAT22(uStack_322,uStack_324));
      }
      else {
        FUN_004b9fc0(param_1,&local_328);
        sVar6 = calc_point_height(CONCAT22(uStack_326,local_328),CONCAT22(uStack_324,uStack_326));
      }
      psVar11 = (short *)(param_1 + 0x41);
      *psVar11 = sVar6;
      uVar8 = (uint)*psVar11;
      uVar10 = uVar8 + 0x3f & 0xffffffc0;
      if ((int)(uVar8 - (uVar8 & 0xffffffc0)) <= (int)(uVar10 - uVar8)) {
        uVar10 = uVar8 & 0xffffffc0;
      }
      if ((int)uVar10 < 0x40) {
        uVar10 = 0x40;
      }
      if (0x400 < (int)uVar10) {
        uVar10 = 0x400;
      }
      *psVar11 = (short)uVar10;
      return;
    }
    *(undefined2 *)(param_1 + 0x41) = 1;
  }
  return;
}
