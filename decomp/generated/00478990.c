/* Ghidra 12.1.3 pseudocode; entry 00478990; FUN_00478990.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_00478990(void)

{
  char cVar1;
  uint uVar2;
  uint uVar3;
  int iVar4;
  int iVar5;
  int iVar6;
  int iVar7;
  int iVar8;
  int iVar9;
  int local_18;
  undefined4 local_8;
  undefined2 local_4;

  iVar7 = 0x89d1c8;
  iVar8 = 0;
  if (game_state.num_tribes != 0) {
    do {
      cVar1 = FUN_00419480(iVar8);
      if (cVar1 == '\0') {
        for (iVar9 = *(int *)(iVar7 + 0x881); iVar9 != 0; iVar9 = *(int *)(iVar9 + 8)) {
          if (*(char *)(iVar9 + 0x2b) != '\a') {
            FUN_004ef180(iVar9);
          }
        }
      }
      iVar8 = iVar8 + 1;
      iVar7 = iVar7 + 0xc65;
    } while (iVar8 < (int)(uint)game_state.num_tribes);
  }
  local_18 = 0x89d1c8;
  iVar7 = 0;
  if (game_state.num_tribes != 0) {
    do {
      cVar1 = FUN_00419480(iVar7);
      if (cVar1 == '\0') {
        local_8 = *(undefined4 *)(local_18 + 0x911);
        local_4 = *(undefined2 *)(local_18 + 0x915);
        uVar2 = game_state.pseudo_random_val * 0x24a1 + 0x24df;
        uVar2 = uVar2 >> 0xd | uVar2 * 0x80000;
        uVar3 = uVar2 * 0x24a1 + 0x24df;
        uVar3 = uVar3 >> 0xd | uVar3 * 0x80000;
        iVar5 = uVar3 % 10 + 10;
        uVar3 = uVar3 * 0x24a1 + 0x24df;
        uVar3 = uVar3 >> 0xd | uVar3 * 0x80000;
        iVar6 = uVar3 % 10 + 10;
        uVar3 = uVar3 * 0x24a1 + 0x24df;
        uVar3 = uVar3 >> 0xd | uVar3 * 0x80000;
        iVar8 = uVar3 % 10 + 10;
        uVar3 = uVar3 * 0x24a1 + 0x24df;
        game_state.pseudo_random_val = uVar3 >> 0xd | uVar3 * 0x80000;
        iVar9 = game_state.pseudo_random_val % 0x14 + 0x14;
        for (iVar4 = uVar2 % 0x28 + 0x28; iVar4 != 0; iVar4 = iVar4 + -1) {
          alloc_unit(1,2,iVar7,&local_8);
        }
        for (; iVar5 != 0; iVar5 = iVar5 + -1) {
          alloc_unit(1,3,iVar7,&local_8);
        }
        for (; iVar6 != 0; iVar6 = iVar6 + -1) {
          alloc_unit(1,5,iVar7,&local_8);
        }
        for (; iVar8 != 0; iVar8 = iVar8 + -1) {
          alloc_unit(1,4,iVar7,&local_8);
        }
        for (; iVar9 != 0; iVar9 = iVar9 + -1) {
          alloc_unit(1,6,iVar7,&local_8);
        }
      }
      iVar7 = iVar7 + 1;
      local_18 = local_18 + 0xc65;
    } while (iVar7 < (int)(uint)game_state.num_tribes);
  }
  init_tribe_struct();
  return;
}
