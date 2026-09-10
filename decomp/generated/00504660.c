/* Ghidra 12.1.3 pseudocode; entry 00504660; FUN_00504660.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_00504660(void)

{
  char cVar1;
  unit_struct *puVar2;
  bool bVar3;
  uint uVar4;
  int iVar5;
  unit_struct *puVar6;
  uint uVar7;
  ushort *puVar8;
  unit_struct *puVar9;
  unit_struct *puVar10;
  uint local_10;
  char *local_c;
  int local_8;

  uVar4 = (uint)DAT_00895fad;
  local_10 = 0;
  local_8 = 0;
  local_c = &DAT_00895fb9;
  if (uVar4 != 0) {
    puVar8 = &DAT_00895fc3;
    do {
      if (*local_c != '\0') {
        puVar9 = (unit_struct *)0x0;
        local_8 = local_8 + 1;
        bVar3 = false;
        if (((puVar8[1] != 0) &&
            (puVar10 = unit_land_array[puVar8[1]], (*(byte *)&puVar10->flags_2 & 1) == 0)) &&
           (puVar10->unit_class != '\0')) {
          puVar9 = puVar10;
        }
        if (puVar9 == (unit_struct *)0x0) {
LAB_00504827:
          bVar3 = true;
        }
        else {
          cVar1 = puVar9->unit_class;
          if (cVar1 == '\x02') {
            puVar10 = (unit_struct *)0x0;
            if (((*puVar8 != 0) &&
                (puVar2 = unit_land_array[*puVar8], (*(byte *)&puVar2->flags_2 & 1) == 0)) &&
               (puVar2->unit_class != '\0')) {
              puVar10 = puVar2;
            }
            if (puVar10 != (unit_struct *)0x0) {
              if (*(ushort *)&puVar10->field_0x6e == 0) {
                iVar5 = FUN_0040b9c0(puVar9,(int)player_tribe_num);
                if (iVar5 != 0) {
                  *(undefined2 *)&puVar10->field_0x6e = *(undefined2 *)(iVar5 + 0x24);
                }
              }
              else {
                puVar2 = unit_land_array[*(ushort *)&puVar10->field_0x6e];
                puVar6 = (unit_struct *)0x0;
                if (((*(byte *)&puVar2->flags_2 & 1) == 0) && (puVar2->unit_class != '\0')) {
                  puVar6 = puVar2;
                }
                if ((puVar6 == (unit_struct *)0x0) ||
                   (iVar5 = FUN_0040ba20(puVar6,puVar9), iVar5 == 0)) {
                  *(undefined2 *)&puVar10->field_0x6e = 0;
                  iVar5 = FUN_0040b9c0(puVar9,(int)player_tribe_num);
                  if (iVar5 != 0) {
                    *(undefined2 *)&puVar10->field_0x6e = *(undefined2 *)(iVar5 + 0x24);
                  }
                }
              }
            }
          }
          else if (cVar1 == '\x05') {
            if ((puVar9->unit_type == '\t') && (puVar9->state == '\f')) goto LAB_00504827;
          }
          else if (cVar1 == '\n') {
            puVar10 = (unit_struct *)0x0;
            if (((*puVar8 != 0) &&
                (puVar2 = unit_land_array[*puVar8], (*(byte *)&puVar2->flags_2 & 1) == 0)) &&
               (puVar2->unit_class != '\0')) {
              puVar10 = puVar2;
            }
            if ((puVar10 != (unit_struct *)0x0) && (*(ushort *)&puVar10->field_0x6c != 0)) {
              puVar2 = unit_land_array[*(ushort *)&puVar10->field_0x6c];
              puVar6 = (unit_struct *)0x0;
              if (((*(byte *)&puVar2->flags_2 & 1) == 0) && (puVar2->unit_class != '\0')) {
                puVar6 = puVar2;
              }
              if ((puVar6 == (unit_struct *)0x0) || ((*(byte *)&puVar6->loc_1_x & 0x80) == 0)) {
                *(undefined2 *)&puVar10->field_0x6c = 0;
                iVar5 = FUN_004daa30(puVar9,CONCAT31((int3)((uint)puVar2 >> 8),player_tribe_num));
                if (iVar5 != 0) {
                  *(undefined2 *)&puVar10->field_0x6c = *(undefined2 *)(iVar5 + 0x24);
                }
              }
            }
          }
        }
        if (bVar3) {
          uVar7 = local_10 & 0xff;
          cVar1 = (&DAT_00895fba)[uVar7 * 0x9e];
          if ((((-1 < cVar1) && (cVar1 < '\x03')) &&
              ((&DAT_00895fcf)[cVar1 * 4 + uVar7 * 0x9e] == '\x01')) &&
             ((&DAT_00895fdb)[uVar7 * 0x4f] != 0)) {
            FUN_00508ee0(CONCAT22(cVar1 >> 7,(&DAT_00895fdb)[uVar7 * 0x4f]));
            (&DAT_00895fdb)[uVar7 * 0x4f] = 0;
          }
          puVar9 = (unit_struct *)0x0;
          if ((((&DAT_00895fc5)[uVar7 * 0x4f] != 0) &&
              (puVar10 = unit_land_array[(ushort)(&DAT_00895fc5)[uVar7 * 0x4f]],
              (*(byte *)&puVar10->flags_2 & 1) == 0)) && (puVar10->unit_class != '\0')) {
            puVar9 = puVar10;
          }
          if (puVar9 != (unit_struct *)0x0) {
            puVar9->flags_3 = puVar9->flags_3 & 0xff7fffff;
          }
          puVar9 = (unit_struct *)0x0;
          (&DAT_00895fb9)[uVar7 * 0x9e] = 0;
          (&DAT_00895fbf)[uVar7 * 0x4f] = 0;
          (&DAT_00895fc5)[uVar7 * 0x4f] = 0;
          DAT_00895fad = DAT_00895fad - 1;
          if ((((&DAT_00895fc3)[uVar7 * 0x4f] != 0) &&
              (puVar10 = unit_land_array[(ushort)(&DAT_00895fc3)[uVar7 * 0x4f]],
              (*(byte *)&puVar10->flags_2 & 1) == 0)) && (puVar10->unit_class != '\0')) {
            puVar9 = puVar10;
          }
          if (puVar9 != (unit_struct *)0x0) {
            FUN_004ef180(puVar9);
          }
        }
      }
      puVar8 = puVar8 + 0x4f;
      local_c = local_c + 0x9e;
      local_10 = local_10 + 1;
    } while (local_8 < (int)uVar4);
  }
  return;
}
