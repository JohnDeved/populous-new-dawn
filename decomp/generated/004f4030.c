/* Ghidra 12.1.3 pseudocode; entry 004f4030; FUN_004f4030.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_004f4030(int param_1,int param_2,undefined2 param_3,int param_4,int param_5)

{
  byte bVar1;
  ushort uVar2;
  unit_struct *puVar3;
  byte bVar4;
  int iVar5;
  int iVar6;
  int iVar7;
  char local_c;
  char cStack_b;
  undefined2 local_a;

  *(undefined2 *)(param_2 + 0x12) = 0;
  *(undefined2 *)(param_2 + 0x14) = 0;
  *(undefined4 *)(param_2 + 4) = 0;
  *(undefined2 *)(param_2 + 0x18) = 0;
  *(undefined2 *)(param_2 + 0x16) = 0;
  *(undefined2 *)(param_2 + 0x22) = 0;
  local_c = (char)param_3;
  cStack_b = (char)((ushort)param_3 >> 8);
  cStack_b = cStack_b + (char)param_4 * -2;
  iVar6 = param_4 * 2 + 1;
  for (iVar5 = iVar6; local_a = CONCAT11(cStack_b,local_c + (char)param_4 * -2), iVar7 = iVar6,
      iVar5 != 0; iVar5 = iVar5 + -1) {
    for (; iVar7 != 0; iVar7 = iVar7 + -1) {
      for (puVar3 = unit_land_array
                    [(short)(&game_state.level_data[0].unit_index)
                            [((local_a & 0xfe) * 2 | local_a & 0xfe00) * 2]];
          puVar3 != (unit_struct *)0x0; puVar3 = unit_land_array[puVar3->next_unit_index]) {
        if (puVar3->unit_class == '\x01') {
          bVar4 = *(byte *)(param_1 + 0xc22);
          if (((bVar4 == 0xff) || (bVar1 = puVar3->tribe_index, bVar1 == 0xff)) || (bVar4 == bVar1))
          {
            bVar4 = 1;
          }
          else {
            bVar4 = *(byte *)((int)game_state.start_n1 + (char)bVar4 + 0x9c) &
                    '\x01' << (bVar1 & 0x1f);
          }
          if ((bVar4 == 0) && ((*(byte *)((int)&puVar3->flags_4 + 1) & 0x10) == 0)) {
            switch(puVar3->unit_type) {
            case 2:
            case 5:
              *(short *)(param_2 + 0x12) = *(short *)(param_2 + 0x12) + 1;
              break;
            case 3:
            case 7:
              *(short *)(param_2 + 0x14) = *(short *)(param_2 + 0x14) + 1;
              break;
            case 4:
              *(short *)(param_2 + 0x18) = *(short *)(param_2 + 0x18) + 1;
              break;
            case 6:
              *(short *)(param_2 + 0x16) = *(short *)(param_2 + 0x16) + 1;
            }
            bVar4 = unit_type_array_person[(byte)puVar3->unit_type].field_0x23;
            *(short *)(param_2 + 0x22) = *(short *)(param_2 + 0x22) + 1;
            *(int *)(param_2 + 4) = *(int *)(param_2 + 4) + (uint)bVar4;
          }
        }
      }
      local_a = CONCAT11(local_a._1_1_,(char)local_a + '\x02');
    }
    cStack_b = local_a._1_1_ + '\x02';
  }
  if ((param_5 != 0) && (uVar2 = *(ushort *)(param_2 + 0x18), uVar2 != 0)) {
    iVar6 = (int)*(short *)(param_1 + 0xa2f);
    if (iVar6 == 0) {
      if (*(short *)(param_1 + 0xa33) == 0) {
        *(undefined2 *)(param_2 + 0x22) = 0;
      }
      else {
        *(short *)(param_2 + 0x16) = *(short *)(param_2 + 0x16) + uVar2;
      }
    }
    if ((*(char *)((int)game_state.start_n1 + *(char *)(param_1 + 0xc22) * 0x30 + -2) == '\0') &&
       (iVar6 < (int)(uint)uVar2)) {
      iVar5 = FUN_004f2ac0(param_1,5,0xffffffff);
      iVar5 = ((uint)uVar2 - iVar6) - iVar5;
      if (iVar5 < 0) {
        iVar5 = 0;
      }
      iVar6 = *(short *)(param_1 + 0xa2b) + -10;
      if (iVar6 < 0) {
        iVar6 = 0;
      }
      if (iVar5 * 2 <= iVar6) {
        iVar6 = iVar5 * 2;
      }
      if (iVar6 != 0) {
        FUN_004e6640(param_1,iVar6,4);
      }
    }
  }
  *(undefined2 *)(param_2 + 0x1a) = 0;
  *(short *)(param_2 + 0x1c) =
       (short)((((uint)(*(ushort *)(param_2 + 0x12) >> 2) + (uint)*(ushort *)(param_2 + 0x14)) *
               0x85) / 100);
  *(short *)(param_2 + 0x1e) = (short)(((uint)*(ushort *)(param_2 + 0x16) * 0x85) / 100);
  *(short *)(param_2 + 0x20) =
       (short)((int)((uint)*(ushort *)(param_2 + 0x16) + (uint)*(ushort *)(param_2 + 0x14)) >> 2) +
       (short)(((uint)*(ushort *)(param_2 + 0x18) * 0x85) / 100);
  return;
}
