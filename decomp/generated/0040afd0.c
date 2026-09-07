/* Ghidra 12.1.3 pseudocode; entry 0040afd0; FUN_0040afd0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_0040afd0(int param_1)

{
  undefined2 uVar1;
  unit_struct *puVar2;
  ushort uVar3;
  uint uVar4;
  uint uVar5;
  int iVar6;
  int *piVar7;
  shape_entry *psVar8;
  char local_326;
  char cStack_325;
  undefined2 uStack_324;
  undefined2 uStack_322;
  int local_320 [200];

  if (*(char *)(param_1 + 0x2a) == '\x02') {
    uVar4 = (uint)(char)(&objs0_mem[*(short *)(param_1 + 0x33)].shapes_index)
                        [(short)((int)((int)*(short *)(param_1 + 0x26) +
                                      ((int)*(short *)(param_1 + 0x26) >> 0x1f & 0x1ffU)) >> 9)];
    psVar8 = shapes_mem + uVar4;
    uVar3 = CONCAT11((char)((ushort)*(undefined2 *)(param_1 + 0x7c) >> 8),
                     (char)((ushort)*(undefined2 *)(param_1 + 0x7a) >> 8)) & 0xfefe;
    local_326 = (char)uVar3;
    cStack_325 = (char)(uVar3 >> 8);
    uVar1 = CONCAT11(cStack_325 - psVar8->y2,local_326 - psVar8->x2);
  }
  else {
    uVar1 = *(undefined2 *)(param_1 + 0x68);
    uVar4 = (uint)*(byte *)(param_1 + 0x9b);
    psVar8 = shapes_mem + uVar4;
  }
  FUN_004b9ef0(uVar4,uVar1,local_320,&uStack_324);
  iVar6 = 0;
  if (0 < CONCAT22(uStack_322,uStack_324)) {
    piVar7 = local_320;
    do {
      for (puVar2 = unit_land_array[*(short *)(*piVar7 + 6)]; puVar2 != (unit_struct *)0x0;
          puVar2 = unit_land_array[puVar2->next_unit_index]) {
        if (((puVar2->unit_class == '\a') && (puVar2->unit_type == 'L')) &&
           (0 < *(short *)&puVar2->field_0x6c)) {
          *(undefined2 *)&puVar2->field_0x6c = 0x10;
        }
      }
      piVar7 = piVar7 + 2;
      iVar6 = iVar6 + 1;
    } while (iVar6 < CONCAT22(uStack_322,uStack_324));
  }
  local_326 = (char)uVar1;
  cStack_325 = (char)((ushort)uVar1 >> 8);
  uVar4 = (int)((byte)psVar8->x1 + 1) >> 1;
  uVar5 = (int)((byte)psVar8->y1 + 1) >> 1;
  if (uVar4 <= uVar5) {
    uVar4 = uVar5;
  }
  land_level_processing_1
            (CONCAT22(uStack_324,CONCAT11(cStack_325 + psVar8->y2,local_326 + psVar8->x2)),uVar4,1);
  return;
}
