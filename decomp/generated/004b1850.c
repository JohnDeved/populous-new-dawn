/* Ghidra 12.1.3 pseudocode; entry 004b1850; ui_struct_set_palettes_2.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


int __thiscall ui_struct_set_palettes_2(int param_1,undefined4 *param_2,uint param_3,uint param_4)

{
  int iVar1;
  uint uVar2;
  undefined1 *puVar3;
  undefined4 *puVar4;
  undefined4 *puVar5;

  puVar4 = (undefined4 *)(param_1 + 0x10c + param_3 * 4);
  for (uVar2 = param_4 & 0x3fffffff; uVar2 != 0; uVar2 = uVar2 - 1) {
    *puVar4 = *param_2;
    param_2 = param_2 + 1;
    puVar4 = puVar4 + 1;
  }
  if (display_created == 0) {
    puVar3 = (undefined1 *)(param_1 + 0x10f);
    iVar1 = 10;
    do {
      *puVar3 = 0x40;
      puVar3 = puVar3 + 4;
      iVar1 = iVar1 + -1;
    } while (iVar1 != 0);
    puVar3 = (undefined1 *)(param_1 + 0x137);
    iVar1 = 0xec;
    do {
      *puVar3 = 0x41;
      puVar3 = puVar3 + 4;
      iVar1 = iVar1 + -1;
    } while (iVar1 != 0);
    puVar3 = (undefined1 *)(param_1 + 0x4e7);
    iVar1 = 10;
    do {
      *puVar3 = 0x40;
      puVar3 = puVar3 + 4;
      iVar1 = iVar1 + -1;
    } while (iVar1 != 0);
  }
  else {
    puVar3 = (undefined1 *)(param_1 + 0x113);
    iVar1 = 0xfe;
    *(undefined1 *)(param_1 + 0x10f) = 0x40;
    do {
      *puVar3 = 0x41;
      puVar3 = puVar3 + 4;
      iVar1 = iVar1 + -1;
    } while (iVar1 != 0);
    *(undefined1 *)(param_1 + 0x50b) = 0x40;
  }
  puVar4 = (undefined4 *)(param_1 + 0x10c);
  puVar5 = system_palette_mem;
  for (iVar1 = 0x100; iVar1 != 0; iVar1 = iVar1 + -1) {
    *puVar5 = *puVar4;
    puVar4 = puVar4 + 1;
    puVar5 = puVar5 + 1;
  }
  param_4 = (param_3 - 1) + param_4;
  if (display_created == 0) {
    if (0xf5 < param_3) {
      return 0;
    }
    if (param_4 < 10) {
      return 0;
    }
    if (param_3 < 10) {
      param_3 = 10;
    }
    if (0xf5 < param_4) {
      param_4 = 0xf5;
    }
  }
  if (*(int *)(param_1 + 0xc0) != 0) {
    iVar1 = (**(code **)(**(int **)(param_1 + 0xb4) + 0x18))
                      (*(int **)(param_1 + 0xb4),0,param_3,(param_4 - param_3) + 1,
                       param_1 + param_3 * 4 + 0x10c);
    if (iVar1 != 0) {
      return iVar1;
    }
    *(undefined4 *)(param_1 + 0xc4) = 1;
  }
  return 0;
}
