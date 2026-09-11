/* Ghidra 12.1.3 pseudocode; entry 00493d50; FUN_00493d50.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


undefined1 FUN_00493d50(ushort param_1,char param_2)

{
  int iVar1;
  char cVar2;
  unit_struct *puVar3;
  byte bVar4;
  bool bVar5;
  unit_type_scenery *puVar6;
  byte bVar7;
  uint uVar8;
  uint uVar9;
  int *piVar10;
  uint uVar11;
  uint uVar12;
  unit_struct *puVar13;
  undefined2 local_12;
  int local_10 [4];

  bVar4 = (byte)param_1;
  local_12._1_1_ = (byte)(param_1 >> 8);
  bVar7 = local_12._1_1_;
  if (((bVar4 & 0xfe) == 0xfe) || ((local_12._1_1_ & 0xfe) == 0xfe)) {
    cVar2 = local_12._1_1_ + 2;
    local_12 = CONCAT11(cVar2,bVar4);
    uVar11 = (uint)local_12;
    uVar8 = (uint)local_12;
    local_10[0] = ((param_1 & 0xfe) * 2 | param_1 & 0xfe00) * 4 + 0x8a03e4;
    local_12 = CONCAT11(cVar2,bVar4 + 2);
    uVar12 = (uint)local_12;
    uVar9 = (uint)local_12;
    local_10[1] = ((uVar8 & 0xfe) * 2 | uVar11 & 0xfe00) * 4 + 0x8a03e4;
    local_12 = CONCAT11(bVar7,bVar4 + 2);
    local_10[2] = ((uVar9 & 0xfe) * 2 | uVar12 & 0xfe00) * 4 + 0x8a03e4;
    local_10[3] = ((local_12 & 0xfe) * 2 | local_12 & 0xfe00) * 4 + 0x8a03e4;
  }
  else {
    iVar1 = ((param_1 & 0xfe) * 2 | param_1 & 0xfe00) * 4;
    local_10[0] = iVar1 + 0x8a03e4;
    local_10[1] = iVar1 + 0x8a0be4;
    local_10[2] = iVar1 + 0x8a0bf4;
    local_10[3] = iVar1 + 0x8a03f4;
  }
  piVar10 = local_10;
  while( true ) {
    bVar5 = true;
    if (((((land_flags_1 & 8) == 0) && (player_tribe_num == param_2)) && ((level_flags & 4) != 0))
       && ((*(byte *)*piVar10 & 8) == 0)) {
      bVar5 = false;
    }
    puVar13 = (unit_struct *)0x0;
    if (bVar5) {
      puVar3 = unit_land_array[*(short *)(*piVar10 + 6)];
      while ((puVar13 = (unit_struct *)0x0, puVar3 != (unit_struct *)0x0 &&
             ((puVar3->unit_class != '\x05' ||
              (puVar6 = unit_type_array_scenery + (byte)puVar3->unit_type,
              uVar8._0_1_ = puVar6->flags_1, uVar8._1_1_ = puVar6->flags,
              uVar8._2_1_ = puVar6->field14_0x16, uVar8._3_1_ = puVar6->field15_0x17,
              puVar13 = puVar3, (uVar8 & 4) == 0))))) {
        puVar3 = unit_land_array[puVar3->next_unit_index];
      }
    }
    if (puVar13 != (unit_struct *)0x0) break;
    piVar10 = piVar10 + 1;
    if (&stack0x00000000 <= piVar10) {
      return 0;
    }
  }
  return 1;
}
