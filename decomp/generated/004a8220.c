/* Ghidra 12.1.3 pseudocode; entry 004a8220; FUN_004a8220.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


undefined4 FUN_004a8220(int param_1,ushort param_2)

{
  byte bVar1;
  unit_struct *puVar2;
  uint uVar3;
  uint uVar4;
  unit_struct *puVar5;
  undefined4 local_8;
  undefined2 local_4;

  puVar5 = (unit_struct *)0x0;
  if (((param_2 != 0) && (puVar2 = unit_land_array[param_2], (*(byte *)&puVar2->flags_2 & 1) == 0))
     && (puVar2->unit_class != '\0')) {
    puVar5 = puVar2;
  }
  bVar1 = *(byte *)(param_1 + 0x2d);
  if (bVar1 == 0x13) {
    if (puVar5 != (unit_struct *)0x0) goto LAB_004a82e0;
  }
  else if (puVar5 != (unit_struct *)0x0) {
    if (bVar1 < 0x13) {
      local_8 = *(undefined4 *)(param_1 + 0x3d);
      *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) | 0x4000;
      local_4 = *(undefined2 *)(param_1 + 0x41);
      FUN_0049bcf0(puVar5,&local_8,bVar1);
      *(char *)(param_1 + 0x2d) = *(char *)(param_1 + 0x2d) + '\x01';
      add_unit_to_cell(param_1,&local_8);
    }
    return 1;
  }
  uVar4 = game_state.pseudo_random_val * 0x24a1 + 0x24df;
  uVar3 = uVar4 >> 0xd;
  game_state.pseudo_random_val = uVar3 | uVar4 * 0x80000;
  *(byte *)(param_1 + 0x2d) = (byte)uVar3 & 7;
LAB_004a82e0:
  uVar3 = *(uint *)(param_1 + 0xc);
  *(uint *)(param_1 + 0xc) = uVar3 | 0x2000;
  *(uint *)(param_1 + 0xc) = uVar3 | 0x82000;
  uVar4 = game_state.pseudo_random_val * 0x24a1 + 0x24df;
  uVar3 = uVar4 >> 0xd;
  game_state.pseudo_random_val = uVar3 | uVar4 * 0x80000;
  *(undefined2 *)(param_1 + 0x49) = 0;
  *(undefined2 *)(param_1 + 0x4d) = 0;
  FUN_004e93f0((undefined2 *)(param_1 + 0x49),param_1 + 0x3d,0xc0,uVar3 & 0x7ff);
  *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) & 0xffffbfff;
  *(undefined2 *)(param_1 + 0x4b) = 0xe6;
  *(char *)(param_1 + 0x2d) = *(char *)(param_1 + 0x2d) + '\x01';
  return 0;
}
