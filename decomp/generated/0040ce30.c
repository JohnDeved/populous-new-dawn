/* Ghidra 12.1.3 pseudocode; entry 0040ce30; process_morph0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void process_morph0(void)

{
  unit_struct *puVar1;
  ushort uVar2;
  objs0_struct *poVar3;
  int iVar4;
  morph0_struct *pmVar5;
  undefined4 *puVar6;
  int iVar7;
  ushort *puVar8;

  poVar3 = objs0_mem;
  if (objs0_mem < obj_mem_end) {
    do {
      poVar3->flags = poVar3->flags & 0xff7f;
      poVar3 = poVar3 + 1;
    } while (poVar3 < obj_mem_end);
  }
  iVar4 = 0;
  pmVar5 = morph0_mem;
  do {
    puVar1 = allocated_units;
    if ((undefined4 *)pmVar5->obj_index_1 != (undefined4 *)0xffffffff) {
      if (pmVar5->field1_0x4 == 0) {
        pmVar5->obj_index_1 = (undefined4 *)0xffffffff;
        for (; puVar1 != (unit_struct *)0x0; puVar1 = puVar1->next_unit_1) {
          uVar2 = (puVar1->object).flags;
          if (((((uVar2 & 2) == 0) &&
               (obj_related_array[(byte)(puVar1->object).obj_related_index + 3].type == '\x03')) &&
              ((uVar2 & 8) != 0)) && ((char)(puVar1->object).morph_index == iVar4)) {
            (puVar1->object).flags = uVar2 & 0xfff7;
            (puVar1->object).flags = uVar2 & 0xfff7 | 2;
          }
        }
      }
      else {
        iVar7 = 0;
        if (0 < (int)pmVar5->field1_0x4) {
          puVar8 = &pmVar5[1].field71_0x52;
          puVar6 = &pmVar5->field76_0x58;
          do {
            puVar8[-3] = (ushort)puVar6[-0x14];
            if (pmVar5->field1_0x4 - iVar7 == 1) {
              uVar2 = (ushort)pmVar5->field2_0x8;
            }
            else {
              uVar2 = (ushort)puVar6[-0x13];
            }
            puVar8[-2] = uVar2;
            puVar8[-1] = (short)*puVar6 + 1;
            if (iVar7 == 0) {
              *puVar8 = 0;
              puVar8[1] = (short)pmVar5->field76_0x58;
            }
            else {
              *puVar8 = puVar8[-4] + 1;
              puVar8[1] = (short)*puVar6 + puVar8[-4] + 1;
            }
            puVar8 = puVar8 + 5;
            puVar6 = puVar6 + 1;
            iVar7 = iVar7 + 1;
          } while (iVar7 < (int)pmVar5->field1_0x4);
        }
        objs0_mem[(int)pmVar5->obj_index_1].morph_index = (char)iVar4;
        *(byte *)&objs0_mem[(int)pmVar5->obj_index_1].flags =
             *(byte *)&objs0_mem[(int)pmVar5->obj_index_1].flags | 0x80;
      }
    }
    pmVar5 = pmVar5 + 4;
    iVar4 = iVar4 + 1;
  } while (pmVar5 < &pal0_mem);
  return;
}
