/* Ghidra 12.1.3 pseudocode; entry 004ff570; create_sprite_bank.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


undefined4 __thiscall
create_sprite_bank(uint *param_1,undefined4 param_2,uint param_3,undefined4 param_4,uint param_5,
                  uint param_6,uint param_7)

{
  undefined4 *puVar1;
  int iVar2;
  uint uVar3;
  int iVar4;
  int iVar5;
  uint local_1c;
  int local_18;
  int local_14;
  int local_10;
  int local_c;
  int local_8;
  int local_4;

  uVar3 = *(uint *)(param_3 + 0x10);
  *param_1 = uVar3;
  debug_log(s_Creating_sprite_bank__containing_005d6a60,uVar3);
  param_1[3] = param_5;
  param_1[4] = param_6;
  param_1[5] = param_7;
  param_1[2] = param_3;
  puVar1 = operator_new(*param_1 * 0x24);
  param_1[1] = (uint)puVar1;
  for (uVar3 = *param_1 * 0x24 >> 2; uVar3 != 0; uVar3 = uVar3 - 1) {
    *puVar1 = 0;
    puVar1 = puVar1 + 1;
  }
  for (iVar4 = 0; iVar4 != 0; iVar4 = iVar4 + -1) {
    *(undefined1 *)puVar1 = 0;
    puVar1 = (undefined4 *)((int)puVar1 + 1);
  }
  local_14 = 0;
  local_18 = 0;
  local_1c = 0;
  if (*param_1 != 0) {
    iVar5 = 0;
    iVar4 = 0;
    do {
      iVar2 = *(int *)(param_3 + 0xc) + iVar4;
      if ((*(short *)(iVar2 + 4) != 0) && (*(short *)(iVar2 + 6) != 0)) {
        get_sprite_params(iVar2,&local_10);
        *(int *)(param_1[1] + 0xc + iVar5) = local_10;
        *(int *)(param_1[1] + 0x10 + iVar5) = local_c;
        *(int *)(param_1[1] + 0x14 + iVar5) = local_8 - local_10;
        *(int *)(param_1[1] + 0x18 + iVar5) = local_4 - local_c;
        iVar2 = param_1[1] + iVar5;
        if ((0x40 < *(uint *)(iVar2 + 0x14)) || (0x40 < *(uint *)(iVar2 + 0x18))) {
          local_14 = local_14 + 1;
          local_18 = local_18 + *(int *)(iVar2 + 0x18) * *(uint *)(iVar2 + 0x14);
        }
        *(undefined4 *)(iVar2 + 4) = 0;
        *(undefined4 *)(param_1[1] + 8 + iVar5) = 0;
        *(undefined4 *)(param_1[1] + 0x1c + iVar5) = 0;
        *(undefined4 *)(param_1[1] + 0x20 + iVar5) = 0;
      }
      iVar5 = iVar5 + 0x24;
      *(undefined2 *)((param_1[1] - 0x24) + iVar5) =
           *(undefined2 *)(*(int *)(param_3 + 0xc) + 4 + iVar4);
      iVar4 = iVar4 + 8;
      local_1c = local_1c + 1;
      *(undefined2 *)((param_1[1] - 0x22) + iVar5) =
           *(undefined2 *)(*(int *)(param_3 + 0xc) + -2 + iVar4);
    } while (local_1c < *param_1);
  }
  debug_log(s_There_are__d_over_64x64__area_____005d6a38,local_14,local_18);
  return 0;
}
