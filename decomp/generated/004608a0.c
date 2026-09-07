/* Ghidra 12.1.3 pseudocode; entry 004608a0; add_sprite_to_texture_cache.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void __thiscall add_sprite_to_texture_cache(int param_1,int param_2,int *param_3)

{
  undefined4 *puVar1;
  code *pcVar2;
  void *pvVar3;
  uint uVar4;
  int *piVar5;
  uint uVar6;
  int *piVar7;

  if (*(int *)(param_1 + 0x2014 + param_2 * 4) == 0) {
    uVar4 = *(uint *)(param_1 + 0x10);
    if (0x7ff < uVar4) {
      return;
    }
    pvVar3 = operator_new(0x44);
    *(void **)(param_1 + 0x14 + uVar4 * 4) = pvVar3;
    puVar1 = *(undefined4 **)(param_1 + 0x14 + *(int *)(param_1 + 0x10) * 4);
    *(undefined4 **)(param_1 + 0x2014 + param_2 * 4) = puVar1;
    puVar1[0xc] = param_2;
    *puVar1 = 0;
    pcVar2 = *(code **)(*param_3 + 4);
    uVar4 = (*pcVar2)();
    piVar5 = operator_new(uVar4);
    uVar4 = (*pcVar2)();
    piVar7 = piVar5;
    for (uVar6 = uVar4 >> 2; uVar6 != 0; uVar6 = uVar6 - 1) {
      *piVar7 = *param_3;
      param_3 = param_3 + 1;
      piVar7 = piVar7 + 1;
    }
    for (uVar4 = uVar4 & 3; uVar4 != 0; uVar4 = uVar4 - 1) {
      *(char *)piVar7 = (char)*param_3;
      param_3 = (int *)((int)param_3 + 1);
      piVar7 = (int *)((int)piVar7 + 1);
    }
    puVar1[0xd] = piVar5;
    uVar4 = piVar5[1];
    for (uVar6 = piVar5[2]; (0x40 < uVar4 || (0x40 < uVar6)); uVar6 = uVar6 + 1 >> 1) {
      uVar4 = uVar4 + 1 >> 1;
    }
    puVar1[7] = uVar4;
    puVar1[8] = uVar6;
    *(int *)(param_1 + 0x10) = *(int *)(param_1 + 0x10) + 1;
  }
  *(undefined4 *)(*(int *)(param_1 + 0x2014 + param_2 * 4) + 0x38) =
       *(undefined4 *)(param_1 + 0x1443c);
  return;
}
