/* Ghidra 12.1.3 pseudocode; entry 004049d0; FUN_004049d0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_004049d0(int param_1)

{
  short *psVar1;
  byte bVar2;
  unit_struct *puVar3;
  uint uVar4;
  char cVar5;
  undefined2 uVar6;
  short sVar7;
  unit_struct *puVar8;
  int iVar9;
  int iVar10;
  char local_326;
  char cStack_325;
  undefined2 uStack_324;
  undefined2 uStack_322;
  undefined4 local_320;

  psVar1 = (short *)(param_1 + 0x33);
  *(undefined1 *)(param_1 + 0x78) = 4;
  puVar8 = (unit_struct *)0x0;
  *(byte *)(param_1 + 0x9c) = *(byte *)(param_1 + 0x9c) | 8;
  unit_set_object(psVar1,unit_type_array_building[*(byte *)(param_1 + 0x2b)].some_index,
                  *(undefined2 *)(param_1 + 99));
  if (((*(ushort *)(param_1 + 0x94) != 0) &&
      (puVar3 = unit_land_array[*(ushort *)(param_1 + 0x94)], (*(byte *)&puVar3->flags_2 & 1) == 0))
     && (puVar3->unit_class != '\0')) {
    puVar8 = puVar3;
  }
  if (puVar8 != (unit_struct *)0x0) {
    puVar8->field_0x78 = 4;
    unit_set_object(&puVar8->object,
                    *(undefined4 *)
                     &unit_type_building_2_ARRAY_005a7818[(byte)puVar8->state_2].field_0x4,
                    *(undefined4 *)(unit_type_building_2_ARRAY_005a7818 + (byte)puVar8->state_2));
    if (((puVar8->object).flags & 8) != 0) {
      (puVar8->object).morph_index = objs0_mem[(short)(puVar8->object).obj_index].morph_index;
    }
  }
  cVar5 = (&objs0_mem[*psVar1].shapes_index)
          [(short)((int)((int)*(short *)(param_1 + 0x26) +
                        ((int)*(short *)(param_1 + 0x26) >> 0x1f & 0x1ffU)) >> 9)];
  local_320 = CONCAT31(local_320._1_3_,
                       (char)((ushort)(((short)(char)shapes_mem[cVar5].field6_0x6 +
                                       (ushort)(byte)shapes_mem[cVar5].x2 * -4) * 0x40 +
                                      *(short *)(param_1 + 0x7a)) >> 8)) & 0xfffffffe;
  local_320 = CONCAT22(local_320._2_2_,
                       CONCAT11((char)((ushort)(((short)(char)shapes_mem[cVar5].field7_0x7 +
                                                (ushort)(byte)shapes_mem[cVar5].y2 * -4) * 0x40 +
                                               *(short *)(param_1 + 0x7c)) >> 8),
                                (undefined1)local_320)) & 0xfffffeff;
  FUN_00493770(param_1 + 0x66,local_320);
  bVar2 = *(byte *)(param_1 + 0x2b);
  if (((bVar2 != 4) && (0xc < bVar2)) && (bVar2 < 0xf)) {
    iVar9 = (int)(short)((int)((int)*(short *)(param_1 + 0x26) +
                              ((int)*(short *)(param_1 + 0x26) >> 0x1f & 0x1ffU)) >> 9);
    iVar10 = (int)(char)(&objs0_mem[*psVar1].shapes_index)[iVar9];
    uVar6 = FUN_00404c50((short *)(param_1 + 0x7a));
    local_326 = (char)uVar6;
    cStack_325 = (char)((ushort)uVar6 >> 8);
    FUN_004b9ef0(iVar10,CONCAT22(uStack_324,
                                 CONCAT11(cStack_325 - shapes_mem[iVar10].y2,
                                          local_326 - shapes_mem[iVar10].x2)),&local_320,&uStack_324
                );
    cVar5 = FUN_0040b860(&local_320,CONCAT22(uStack_322,uStack_324),iVar9);
    if (cVar5 == '\0') {
      alloc_unit(7,0x53,*(undefined1 *)(param_1 + 0x2f),param_1 + 0x3d);
    }
    FUN_0048a050(param_1,0xd7,0);
  }
  FUN_0040afd0(param_1);
  landscape_move_1(param_1,1);
  *(undefined2 *)(param_1 + 0xa0) = 0;
  uVar4 = *(uint *)&unit_type_array_building[*(byte *)(param_1 + 0x2b)].field_0x48;
  if ((uVar4 & 0x400) != 0) {
    sVar7 = FUN_0041b3f0(CONCAT31((int3)(uVar4 >> 8),*(undefined1 *)(param_1 + 0x2f)),
                         *(byte *)(param_1 + 0x2b));
    *(short *)(param_1 + 0xa4) = sVar7 + -0x36;
    return;
  }
  if ((uVar4 & 0x40) != 0) {
    *(undefined2 *)(param_1 + 0xa4) = 0;
  }
  return;
}
