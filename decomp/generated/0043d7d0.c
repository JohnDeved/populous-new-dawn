/* Ghidra 12.1.3 pseudocode; entry 0043d7d0; FUN_0043d7d0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


char FUN_0043d7d0(int param_1,byte param_2)

{
  unit_struct *puVar1;
  ushort uVar2;
  byte bVar3;
  int iVar4;
  uint uVar5;
  undefined2 uVar6;
  int iVar7;
  uint *puVar8;
  char local_327;
  char local_326;
  char cStack_325;
  undefined2 uStack_324;
  undefined2 uStack_322;
  uint local_320 [200];

  local_327 = '\0';
  if (*(char *)(param_1 + 0x2a) == '\x02') {
    uVar5 = (uint)(char)(&objs0_mem[*(short *)(param_1 + 0x33)].shapes_index)
                        [(short)((int)((int)*(short *)(param_1 + 0x26) +
                                      ((int)*(short *)(param_1 + 0x26) >> 0x1f & 0x1ffU)) >> 9)];
    uVar2 = CONCAT11((char)((ushort)*(undefined2 *)(param_1 + 0x7c) >> 8),
                     (char)((ushort)*(undefined2 *)(param_1 + 0x7a) >> 8)) & 0xfefe;
    local_326 = (char)uVar2;
    cStack_325 = (char)(uVar2 >> 8);
    uVar6 = CONCAT11(cStack_325 - shapes_mem[uVar5].y2,local_326 - shapes_mem[uVar5].x2);
  }
  else {
    uVar6 = *(undefined2 *)(param_1 + 0x68);
    uVar5 = (uint)*(byte *)(param_1 + 0x9b);
  }
  iVar7 = 0;
  FUN_004b9d50(uVar5,uVar6,local_320,&uStack_324);
  if (0 < CONCAT22(uStack_322,uStack_324)) {
    puVar8 = local_320;
    do {
      if (local_327 != '\0') {
        return local_327;
      }
      for (puVar1 = unit_land_array[*(short *)(*puVar8 + 6)]; puVar1 != (unit_struct *)0x0;
          puVar1 = unit_land_array[puVar1->next_unit_index]) {
        if (((((puVar1->unit_class == '\x01') && (bVar3 = puVar1->tribe_index, bVar3 != 0xff)) &&
             (param_2 != bVar3)) &&
            ((puVar1->unit_land_array_index == 0 && (puVar1->unit_type != '\b')))) &&
           (((*(byte *)((int)&puVar1->flags_2 + 2) & 1) == 0 &&
            ((*(byte *)((int)&puVar1->flags_4 + 1) & 0x10) == 0)))) {
          if (((param_2 == 0xff) || (bVar3 == 0xff)) || (param_2 == bVar3)) {
            bVar3 = 1;
          }
          else {
            bVar3 = *(byte *)((int)game_state.start_n1 + (char)param_2 + 0x9c) &
                    '\x01' << (bVar3 & 0x1f);
          }
          if ((bVar3 == 0) && (iVar4 = FUN_004de7b0(puVar1,(int)(char)param_2), iVar4 == 0)) {
            local_327 = '\x01';
            break;
          }
        }
      }
      puVar8 = puVar8 + 2;
      iVar7 = iVar7 + 1;
    } while (iVar7 < CONCAT22(uStack_322,uStack_324));
  }
  return local_327;
}
