/* Ghidra 12.1.3 pseudocode; entry 00460680; process_texture_2.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

void __thiscall process_texture_2(int param_1,undefined4 *param_2)

{
  int *piVar1;
  void *pvVar2;
  int iVar3;
  undefined4 *puVar4;
  uint *puVar5;
  undefined4 *puVar6;
  int *piVar7;
  uint local_d8 [25];
  uint auStack_74 [15];
  byte bStack_38;
  undefined4 auStack_2c [8];
  undefined4 uStack_c;

  if (0xff < *(uint *)(param_1 + 0xc)) {
    return;
  }
  puVar5 = local_d8;
  for (iVar3 = 0x1b; iVar3 != 0; iVar3 = iVar3 + -1) {
    *puVar5 = 0;
    puVar5 = puVar5 + 1;
  }
  local_d8[0] = 0x6c;
  piVar7 = (int *)*param_2;
  iVar3 = (**(code **)(*piVar7 + 0x58))(piVar7,local_d8);
  if (-1 < iVar3) {
    if (*(int *)(param_1 + 0xc) == 0) {
      piVar1 = *(int **)(param_1 + 83000);
      *(uint *)(param_1 + 0x1446c) = local_d8[1];
      *(uint *)(param_1 + 0x14470) = local_d8[0];
      puVar5 = auStack_74;
      for (iVar3 = 0x1b; iVar3 != 0; iVar3 = iVar3 + -1) {
        *puVar5 = 0;
        puVar5 = puVar5 + 1;
      }
      auStack_74[1] = 0x1007;
      auStack_74[0] = 0x6c;
      puVar4 = (undefined4 *)(param_1 + 0x14418);
      puVar6 = auStack_2c;
      for (iVar3 = 8; iVar3 != 0; iVar3 = iVar3 + -1) {
        *puVar6 = *puVar4;
        puVar4 = puVar4 + 1;
        puVar6 = puVar6 + 1;
      }
      uStack_c = 0x1800;
      auStack_74[3] = local_d8[1] & 0xffff;
      auStack_74[2] = local_d8[0] & 0xffff;
      iVar3 = (**(code **)(*piVar1 + 0x18))(piVar1,auStack_74,&stack0xffffff1c,0);
      if ((-1 < iVar3) &&
         (((bStack_38 & 0x28) == 0 || (iVar3 = (**(code **)(*piVar7 + 0x7c))(piVar7,0), -1 < iVar3))
         )) {
        *(int **)(param_1 + 0x14440) = piVar7;
      }
      (**(code **)**(undefined4 **)(param_1 + 0x14440))
                (*(undefined4 **)(param_1 + 0x14440),&IID_IDirectDrawSurface4,
                 (undefined4 *)(param_1 + 0x14444));
      if (landscape_surface_page_locked != 0) {
        piVar7 = *(int **)(param_1 + 0x14444);
        (**(code **)(*piVar7 + 0x94))(piVar7,0);
      }
      pvVar2 = operator_new(*(int *)(param_1 + 0x1446c) * 4 + 4);
      *(void **)(param_1 + 0x14488) = pvVar2;
    }
    if (*(int *)(param_1 + 0x14460) != 0) {
      (**(code **)(*(int *)*param_2 + 0x74))((int *)*param_2,8,param_1 + 0x14464);
    }
    puVar4 = (undefined4 *)(*(int *)(param_1 + 0xc) * 0x24 + 0x12018 + param_1);
    for (iVar3 = 9; iVar3 != 0; iVar3 = iVar3 + -1) {
      *puVar4 = *param_2;
      param_2 = param_2 + 1;
      puVar4 = puVar4 + 1;
    }
    *(int *)(*(int *)(param_1 + 0xc) * 0x24 + 0x1202c + param_1) = *(int *)(param_1 + 0xc);
    *(undefined4 *)(*(int *)(param_1 + 0xc) * 0x24 + 0x12030 + param_1) = 0;
    *(undefined4 *)(*(int *)(param_1 + 0xc) * 0x24 + 0x12034 + param_1) = 0;
    *(float *)(*(int *)(param_1 + 0xc) * 0x24 + 0x12028 + param_1) =
         _DAT_0058f440 / (float)*(uint *)(param_1 + 0x1446c);
    *(int *)(param_1 + 0xc) = *(int *)(param_1 + 0xc) + 1;
    return;
  }
  return;
}
