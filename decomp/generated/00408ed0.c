/* Ghidra 12.1.3 pseudocode; entry 00408ed0; FUN_00408ed0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_00408ed0(int param_1)

{
  unit_struct *puVar1;
  uint uVar2;
  bool bVar3;
  ushort uVar4;
  bool bVar5;
  char cVar6;
  uint uVar7;
  int iVar8;
  undefined4 local_334;
  int local_32c;
  int local_328;
  int *local_324;
  int local_320 [200];

  if (((*(ushort *)(param_1 + 0x9c) & 0x10) != 0) && ((*(byte *)(param_1 + 0x2e) & 3) == 0)) {
    if (((*(ushort *)(param_1 + 0x9c) & 2) != 0) &&
       (uVar7 = pseudo_random * 0x24a1 + 0x24df, uVar2 = uVar7 >> 0xd,
       pseudo_random = uVar2 | uVar7 * 0x80000, (uVar2 & 3) == 0)) {
      FUN_0048a050(param_1,0x34,0);
    }
    iVar8 = (int)(char)(&objs0_mem[*(short *)(param_1 + 0x33)].shapes_index)
                       [(short)((int)((int)*(short *)(param_1 + 0x26) +
                                     ((int)*(short *)(param_1 + 0x26) >> 0x1f & 0x1ffU)) >> 9)];
    uVar4 = CONCAT11((char)((ushort)*(undefined2 *)(param_1 + 0x7c) >> 8),
                     (char)((ushort)*(undefined2 *)(param_1 + 0x7a) >> 8));
    local_334._2_2_ = uVar4 & 0xfefe;
    local_334._0_1_ = (char)local_334._2_2_;
    local_334._1_1_ = (char)(local_334._2_2_ >> 8);
    local_334._0_2_ =
         CONCAT11(local_334._1_1_ - shapes_mem[iVar8].y2,(char)local_334 - shapes_mem[iVar8].x2);
    local_334 = CONCAT22(uVar4,(undefined2)local_334) & 0xfefeffff;
    bVar5 = false;
    FUN_004b9d50(iVar8,local_334,local_320,&local_32c);
    local_328 = 0;
    if (0 < local_32c) {
      local_324 = local_320;
      do {
        if (bVar5) {
          return;
        }
        puVar1 = unit_land_array[*(short *)(*local_324 + 6)];
        while ((puVar1 != (unit_struct *)0x0 && (!bVar5))) {
          if ((puVar1->unit_class == '\x01') &&
             (((*(short *)&puVar1->field_0x9d == 0 && (puVar1->unit_land_array_index == 0)) &&
              ((unit_type_related_1_ARRAY_005a6f78[(byte)puVar1->state].field_0x2 & 4) == 0)))) {
            bVar3 = true;
            if (((*(short *)&puVar1->field_0x6e < 1) ||
                ((*(byte *)((int)&puVar1->flags_2 + 2) & 1) != 0)) ||
               (cVar6 = FUN_00416d70(puVar1,param_1), cVar6 != '\0')) {
LAB_004090e6:
              bVar3 = false;
            }
            else {
              if (((puVar1->tribe_index == *(char *)(param_1 + 0x2f)) || (puVar1->tribe_index == -1)
                  ) || ((iVar8 = FUN_004de7b0(puVar1,(int)*(char *)(param_1 + 0x2f)), iVar8 != 0 ||
                        ((iVar8 = FUN_004de7b0(param_1,(int)(char)puVar1->tribe_index), iVar8 != 0
                         || ((*(byte *)((int)&puVar1->flags_4 + 1) & 0x10) != 0))))))
              goto LAB_004090e6;
              cVar6 = *(char *)(param_1 + 0x2b);
              if (cVar6 == '\x04') {
                if ((((game_state.level_flags & 2) != 0) || (puVar1->unit_type == '\x04')) ||
                   (puVar1->unit_type == '\a')) goto LAB_004090e8;
                goto LAB_004090e6;
              }
              if (cVar6 == '\x06') {
                if (((game_state.level_flags & 2) != 0) && (puVar1->unit_type == '\a'))
                goto LAB_004090e6;
              }
              else if ((cVar6 != '\b') && (puVar1->unit_type == '\b')) goto LAB_004090e6;
            }
LAB_004090e8:
            if (bVar3) {
              bVar5 = true;
            }
          }
          puVar1 = unit_land_array[puVar1->next_unit_index];
        }
        local_324 = local_324 + 2;
        local_328 = local_328 + 1;
      } while (local_328 < local_32c);
    }
    if (!bVar5) {
      *(ushort *)(param_1 + 0x9c) = *(ushort *)(param_1 + 0x9c) & 0xffef;
    }
  }
  return;
}
