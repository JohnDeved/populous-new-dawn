/* Ghidra 12.1.3 pseudocode; entry 00409b10; FUN_00409b10.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


int FUN_00409b10(int param_1,int param_2)

{
  ushort uVar1;
  unit_struct *puVar2;
  int iVar3;
  unit_struct *puVar4;

  if (*(ushort *)(param_2 + 0xa2) == 0) {
    iVar3 = 0;
    *(undefined2 *)(param_2 + 0xa2) = *(undefined2 *)(param_1 + 0x24);
  }
  else {
    puVar2 = unit_land_array[*(ushort *)(param_2 + 0xa2)];
    puVar4 = (unit_struct *)0x0;
    if (((*(byte *)&puVar2->flags_2 & 1) == 0) && (puVar2->unit_class != '\0')) {
      puVar4 = puVar2;
    }
    iVar3 = 1;
    while (puVar4 != (unit_struct *)0x0) {
      uVar1 = *(ushort *)((int)&puVar4->loc_2_z + 1);
      if (uVar1 == 0) {
        *(undefined2 *)((int)&puVar4->loc_2_z + 1) = *(undefined2 *)(param_1 + 0x24);
        break;
      }
      puVar2 = unit_land_array[uVar1];
      puVar4 = (unit_struct *)0x0;
      if (((puVar2->flags_2 & 1) == 0) && (puVar2->unit_class != '\0')) {
        puVar4 = puVar2;
      }
      iVar3 = iVar3 + 1;
    }
  }
  *(uint *)(param_1 + 0x14) = *(uint *)(param_1 + 0x14) | 0x20;
  *(undefined2 *)(param_1 + 0x85) = 0;
  return iVar3;
}
