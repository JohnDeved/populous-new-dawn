/* Ghidra 12.1.3 pseudocode; entry 0040c3a0; FUN_0040c3a0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_0040c3a0(int param_1)

{
  short sVar1;
  unit_struct *puVar2;
  ushort uVar3;
  int iVar4;
  int *piVar5;
  int iVar6;
  char local_326;
  char cStack_325;
  undefined2 uStack_324;
  undefined2 uStack_322;
  int local_320 [200];

  sVar1 = *(short *)(param_1 + 0x24);
  iVar4 = (int)(char)(&objs0_mem[*(short *)(param_1 + 0x33)].shapes_index)
                     [(short)((int)((int)*(short *)(param_1 + 0x26) +
                                   ((int)*(short *)(param_1 + 0x26) >> 0x1f & 0x1ffU)) >> 9)];
  uVar3 = CONCAT11((char)((ushort)*(undefined2 *)(param_1 + 0x7c) >> 8),
                   (char)((ushort)*(undefined2 *)(param_1 + 0x7a) >> 8)) & 0xfefe;
  local_326 = (char)uVar3;
  cStack_325 = (char)(uVar3 >> 8);
  iVar6 = 0;
  FUN_004b9ef0(iVar4,CONCAT22(uStack_324,
                              CONCAT11(cStack_325 - shapes_mem[iVar4].y2,
                                       local_326 - shapes_mem[iVar4].x2)),local_320,&uStack_324);
  if (0 < CONCAT22(uStack_322,uStack_324)) {
    piVar5 = local_320;
    do {
      for (puVar2 = unit_land_array[*(short *)(*piVar5 + 6)]; puVar2 != (unit_struct *)0x0;
          puVar2 = unit_land_array[puVar2->next_unit_index]) {
        if ((((puVar2->unit_class == '\x01') && (puVar2->state == '\n')) &&
            (puVar2->field_0xa7 == '\x13')) && (*(short *)((int)&puVar2->loc_3_y + 1) == sVar1)) {
          FUN_00436ca0(puVar2);
          if ((*(byte *)((int)&puVar2->flags_2 + 2) & 0x10) == 0) {
            *(undefined1 *)((int)&puVar2->loc_1_y + 1) = puVar2->state;
            empty_unit_function(puVar2);
            puVar2->state = 0x29;
            init_unit_class(puVar2);
          }
          puVar2->flags_4 = puVar2->flags_4 & 0xffffff7f;
        }
      }
      piVar5 = piVar5 + 2;
      iVar6 = iVar6 + 1;
    } while (iVar6 < CONCAT22(uStack_322,uStack_324));
  }
  return;
}
