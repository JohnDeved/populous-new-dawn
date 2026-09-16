/* Ghidra 12.1.3 pseudocode; entry 00512240; effect_aod.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void effect_aod(int param_1)

{
  short sVar1;
  unit_struct *puVar2;
  undefined4 in_EAX;
  int iVar3;
  unit_struct *puVar4;

  sVar1 = *(short *)(param_1 + 0x6c);
  iVar3 = CONCAT22((short)((uint)in_EAX >> 0x10),sVar1) + 1;
  *(short *)(param_1 + 0x6c) = (short)iVar3;
  if (sVar1 == 0) {
    iVar3 = alloc_unit(7,0x48,CONCAT31((int3)((uint)iVar3 >> 8),*(undefined1 *)(param_1 + 0x2f)),
                       param_1 + 0x3d);
    if (iVar3 != 0) {
      FUN_0048a050(iVar3,0xd9,0);
      *(undefined2 *)(param_1 + 0x6e) = *(undefined2 *)(iVar3 + 0x24);
      return;
    }
  }
  else {
    puVar4 = (unit_struct *)0x0;
    if (((*(ushort *)(param_1 + 0x6e) != 0) &&
        (puVar2 = unit_land_array[*(ushort *)(param_1 + 0x6e)], (*(byte *)&puVar2->flags_2 & 1) == 0
        )) && (puVar2->unit_class != '\0')) {
      puVar4 = puVar2;
    }
    if (puVar4 == (unit_struct *)0x0) {
      alloc_unit(1,8,*(undefined1 *)(param_1 + 0x2f),param_1 + 0x3d);
      update_after_unit_alloc(param_1);
    }
  }
  return;
}
