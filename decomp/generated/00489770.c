/* Ghidra 12.1.3 pseudocode; entry 00489770; FUN_00489770.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_00489770(void)

{
  uint uVar1;
  bool bVar2;
  int iVar3;
  int *piVar4;
  uint *puVar5;
  uint uVar6;
  undefined4 *puVar7;
  uint *puVar8;
  undefined4 *puVar9;
  undefined4 *puVar10;
  undefined4 uVar11;
  int local_2c;
  undefined4 *local_1c;
  uint local_14 [5];

  iVar3 = FUN_004998b0();
  if (iVar3 != 0) {
    FUN_00489a30();
    puVar5 = &DAT_0098ce78;
    puVar8 = local_14;
    for (iVar3 = 5; iVar3 != 0; iVar3 = iVar3 + -1) {
      *puVar8 = *puVar5;
      puVar5 = puVar5 + 1;
      puVar8 = puVar8 + 1;
    }
    do {
      puVar7 = &DAT_0098ceb8;
      puVar5 = local_14;
      bVar2 = false;
      local_1c = &DAT_0098ce90;
      local_2c = 0;
      do {
        if (local_2c + 1U < 5) {
          puVar10 = &DAT_0098ce94 + local_2c;
          puVar9 = &DAT_0098cebc + local_2c;
          puVar8 = local_14 + local_2c + 1;
          do {
            uVar1 = *puVar8;
            if (*puVar5 < uVar1) {
              bVar2 = true;
              *puVar8 = *puVar5;
              uVar11 = *puVar9;
              *puVar5 = uVar1;
              *puVar9 = *puVar7;
              *puVar7 = uVar11;
              uVar11 = *puVar10;
              *puVar10 = *local_1c;
              *local_1c = uVar11;
            }
            puVar10 = puVar10 + 1;
            puVar9 = puVar9 + 1;
            puVar8 = puVar8 + 1;
          } while (puVar8 < &stack0x00000000);
        }
        puVar7 = puVar7 + 1;
        puVar5 = puVar5 + 1;
        local_2c = local_2c + 1;
        local_1c = local_1c + 1;
      } while (puVar5 < &stack0x00000000);
    } while (bVar2);
    iVar3 = 0;
    do {
      if (((&DAT_005acf69)[*(int *)((int)&DAT_0098ce90 + iVar3) * 0xc] == '\0') &&
         ((&DAT_0098ce78)[*(int *)((int)&DAT_0098ceb8 + iVar3)] != 0)) {
        FUN_0048a050(0,*(int *)((int)&DAT_0098ce90 + iVar3),5);
      }
      iVar3 = iVar3 + 4;
    } while (iVar3 < 0xc);
  }
  if (((draw_mode == 2) || (DAT_0089ce36 != '\0')) || (interface_state == '\n')) {
    uVar6 = pseudo_random * 0x24a1 + 0x24df;
    uVar1 = uVar6 >> 0xd;
    pseudo_random = uVar1 | uVar6 * 0x80000;
    if ((uVar1 & 0x7f) == 0) {
      FUN_0048a050(0,0x54,1);
    }
  }
  else {
    if (((DAT_00895dc5 == DAT_00895dc1) &&
        (uVar6 = pseudo_random * 0x24a1 + 0x24df, uVar1 = uVar6 >> 0xd,
        pseudo_random = uVar1 | uVar6 * 0x80000, (char)uVar1 == '\0')) && (DAT_00895dcd != '\x1e'))
    {
      FUN_0048a050(0,0x50,1);
    }
    uVar6 = pseudo_random * 0x24a1 + 0x24df;
    uVar1 = uVar6 >> 0xd;
    pseudo_random = uVar1 | uVar6 * 0x80000;
    if (((uVar1 & 0x7f) == 0) && (DAT_00895dc9 != 0)) {
      if (DAT_00895dcd == '\x16') {
        uVar11 = 0xc2;
      }
      else if (DAT_00895dcd == '\x1e') {
        uVar11 = 0xc6;
      }
      else {
        uVar11 = 0x1c;
      }
      FUN_0048a050(0,uVar11,1);
    }
    if (DAT_00895dcb == 0) {
      if ((DAT_005ad88d != '\0') && (piVar4 = DAT_0089ce6d, DAT_0089ce6d != (int *)0x0)) {
        do {
          if ((short)piVar4[4] == 0xc3) {
            FUN_0048b010(piVar4,1);
            return;
          }
          piVar4 = (int *)*piVar4;
        } while (piVar4 != (int *)0x0);
        return;
      }
    }
    else if (DAT_005ad88d == '\0') {
      FUN_0048a050(0,0xc3,3);
      return;
    }
  }
  return;
}
