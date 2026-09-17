/* Ghidra 12.1.3 pseudocode; entry 00478610; FUN_00478610.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_00478610(int param_1)

{
  char cVar1;
  short sVar2;
  uint uVar3;
  uint uVar4;
  uint *puVar5;
  int iVar6;
  int iVar7;
  int iVar8;
  int iVar9;
  int local_2c;
  int local_28;
  int local_20 [4];
  int aiStack_10 [4];

  local_2c = -1;
  local_28 = -1;
  sVar2 = *(short *)(param_1 + 0x76) + -1;
  *(short *)(param_1 + 0x76) = sVar2;
  if (sVar2 < 1) {
    uVar3 = game_state.pseudo_random_val * 0x24a1 + 0x24df;
    uVar4 = uVar3 >> 0xd;
    game_state.pseudo_random_val = uVar4 | uVar3 * 0x80000;
    puVar5 = (uint *)0x0;
    iVar7 = 0x89d1c8;
    iVar6 = 0;
    *(ushort *)(param_1 + 0x76) = ((ushort)uVar4 & 0x1f) + 0x20;
    if (game_state.num_tribes != 0) {
      iVar8 = 0;
      do {
        cVar1 = FUN_00419480(puVar5);
        iVar9 = iVar8;
        if ((cVar1 == '\0') && (*(int *)(iVar7 + 0x89d) != 0)) {
          *(int *)((int)local_20 + iVar8) = *(int *)(iVar7 + 0x89d);
          iVar9 = iVar8 + 4;
          iVar6 = iVar6 + 1;
          *(undefined4 *)((int)aiStack_10 + iVar8) = *(undefined4 *)(iVar7 + 0x91d);
        }
        puVar5 = (uint *)((int)puVar5 + 1);
        iVar7 = iVar7 + 0xc65;
        iVar8 = iVar9;
      } while ((int)puVar5 < (int)(uint)game_state.num_tribes);
    }
    if (1 < iVar6) {
      if (0 < iVar6) {
        iVar8 = 0;
        iVar7 = iVar6;
        do {
          iVar9 = *(int *)((int)local_20 + iVar8);
          if (*(int *)((int)aiStack_10 + iVar8) < 2) {
            *(undefined1 *)(iVar9 + 0xa5) = 0;
          }
          else {
            *(undefined1 *)(iVar9 + 0xa5) = 100;
          }
          iVar9 = *(int *)((int)local_20 + iVar8);
          if (*(char *)(iVar9 + 0xa5) == '\0') {
            if ((*(byte *)(iVar9 + 0x15) & 0x80) != 0) {
              *(undefined2 *)(iVar9 + 0x6e) = 1;
            }
            if (*(char *)(iVar9 + 0xa5) != '\0') goto LAB_0047872e;
            uVar4 = *(uint *)(iVar9 + 0x14);
            *(uint *)(iVar9 + 0x14) = uVar4 & 0xfffdffff;
            uVar4 = uVar4 & 0xfffd7fff;
          }
          else {
LAB_0047872e:
            uVar4 = *(uint *)(iVar9 + 0x14);
            *(uint *)(iVar9 + 0x14) = uVar4 | 0x20000;
            uVar4 = uVar4 | 0x28000;
          }
          puVar5 = (uint *)(iVar9 + 0x14);
          iVar8 = iVar8 + 4;
          *puVar5 = uVar4;
          iVar7 = iVar7 + -1;
        } while (iVar7 != 0);
      }
      iVar8 = 0;
      iVar7 = 2000;
      if (0 < iVar6) {
        do {
          if (aiStack_10[iVar8] < iVar7) {
            iVar7 = aiStack_10[iVar8];
            local_2c = iVar8;
          }
          iVar8 = iVar8 + 1;
        } while (iVar8 < iVar6);
      }
      iVar9 = 0;
      iVar8 = (int)*(char *)(param_1 + 0x89);
      iVar7 = local_28;
      if (0 < iVar6) {
        do {
          iVar8 = iVar8 + 1;
          if (iVar6 <= iVar8) {
            iVar8 = 0;
          }
          iVar7 = iVar8;
        } while ((iVar8 == local_2c) && (iVar9 = iVar9 + 1, iVar7 = local_28, iVar9 < iVar6));
      }
      local_28 = iVar7;
      if ((-1 < local_28) && (-1 < local_2c)) {
        iVar6 = local_20[local_2c];
        uVar4 = *(uint *)(iVar6 + 0x14);
        ptr_unit_related_20B->field0_0x0 = 0;
        ptr_unit_related_20B->field1_0x4 = (uint)*(ushort *)(iVar6 + 0x24);
        ptr_unit_related_20B->unit_ptr = (unit_struct *)0x0;
        ptr_unit_related_20B->field3_0xc = 0;
        ptr_unit_related_20B->field4_0x10 = 0;
        ptr_unit_related_20B = ptr_unit_related_20B + 1;
        unit_allocation_flag = 1;
        alloc_unit(0xb,((uVar4 & 0x20000) == 0) + '\x02',
                   CONCAT31((int3)((uint)puVar5 >> 8),*(undefined1 *)(local_20[local_28] + 0x2f)),
                   iVar6 + 0x3d);
      }
    }
  }
  return;
}
