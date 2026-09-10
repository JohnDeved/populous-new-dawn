/* Ghidra 12.1.3 pseudocode; entry 0051df90; FUN_0051df90.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


int FUN_0051df90(int param_1)

{
  byte bVar1;
  byte bVar2;
  ushort uVar3;
  unit_struct *puVar4;
  char cVar5;
  char cVar6;
  uint uVar7;
  int iVar8;
  unit_struct *puVar9;
  char local_14;
  char local_13;
  unit_struct *local_10;
  byte abStack_8 [4];
  unit_struct *local_4;

  local_13 = -1;
  iVar8 = 0;
  local_14 = -1;
  bVar1 = *(byte *)(param_1 + 0x69);
  bVar2 = *(byte *)(param_1 + 0x6a);
  uVar7 = (uint)bVar1;
  cVar6 = '\0';
  abStack_8[uVar7] = 0;
  abStack_8[bVar2] = 0;
  do {
    uVar3 = *(ushort *)(param_1 + 0x70 + cVar6 * 2);
    if (uVar3 != 0) {
      abStack_8[(char)unit_land_array[uVar3]->tribe_index] =
           abStack_8[(char)unit_land_array[uVar3]->tribe_index] + 1;
    }
    cVar6 = cVar6 + '\x01';
  } while (cVar6 < '\x06');
  if ((1 < abStack_8[uVar7]) && (1 < abStack_8[bVar2])) {
    cVar6 = '\0';
    do {
      uVar3 = *(ushort *)(param_1 + 0x70 + cVar6 * 2);
      puVar9 = local_4;
      cVar5 = local_13;
      if (uVar3 != 0) {
        puVar4 = unit_land_array[uVar3];
        puVar9 = puVar4;
        cVar5 = cVar6;
        if (((int)(char)puVar4->tribe_index != uVar7) &&
           (puVar9 = local_4, cVar5 = local_13, (int)(char)puVar4->tribe_index == (uint)bVar2)) {
          local_14 = cVar6;
          local_10 = puVar4;
        }
      }
      local_13 = cVar5;
      cVar6 = cVar6 + '\x01';
      local_4 = puVar9;
    } while (cVar6 < '\x06');
    iVar8 = alloc_unit(10,8,0xff,param_1 + 0x3d);
    if (iVar8 == 0) {
      FUN_004a3920(puVar9);
      FUN_004a3920(local_10);
    }
    else {
      *(undefined1 *)(iVar8 + 0x68) = 2;
      *(byte *)(iVar8 + 0x69) = bVar1;
      *(byte *)(iVar8 + 0x6a) = bVar2;
      *(undefined2 *)(iVar8 + 0x70) = *(undefined2 *)(param_1 + 0x70 + local_13 * 2);
      *(undefined2 *)(iVar8 + 0x72) = *(undefined2 *)(param_1 + 0x70 + local_14 * 2);
      *(undefined2 *)(param_1 + 0x6c) = 0;
      *(undefined2 *)&puVar9->field_0x9d = *(undefined2 *)(iVar8 + 0x24);
      *(undefined2 *)&local_10->field_0x9d = *(undefined2 *)(iVar8 + 0x24);
      puVar9->state_2 = 0;
      puVar9->flags_2 = puVar9->flags_2 | 0x40000000;
      local_10->state_2 = 0;
      local_10->flags_2 = local_10->flags_2 | 0x40000000;
      uVar7 = game_state.pseudo_random_val * 0x24a1 + 0x24df;
      game_state.pseudo_random_val = uVar7 >> 0xd | uVar7 * 0x80000;
      *(short *)(iVar8 + 0x26) = (short)((ulonglong)game_state.pseudo_random_val % 0x168);
    }
    *(char *)(param_1 + 0x68) = *(char *)(param_1 + 0x68) + -2;
    *(undefined2 *)(param_1 + 0x70 + local_13 * 2) = 0;
    *(undefined2 *)(param_1 + 0x70 + local_14 * 2) = 0;
  }
  return iVar8;
}
