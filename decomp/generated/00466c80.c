/* Ghidra 12.1.3 pseudocode; entry 00466c80; FUN_00466c80.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


undefined1 FUN_00466c80(int param_1,char param_2)

{
  unit_struct *puVar1;
  char cVar2;
  undefined1 uVar3;
  unit_struct *puVar4;
  undefined1 local_4 [4];

  uVar3 = 0;
  puVar4 = (unit_struct *)0x0;
  if (((*(ushort *)(param_1 + 0x9f) != 0) &&
      (puVar1 = unit_land_array[*(ushort *)(param_1 + 0x9f)], (*(byte *)&puVar1->flags_2 & 1) == 0))
     && (puVar1->unit_class != '\0')) {
    puVar4 = puVar1;
  }
  if (puVar4 != (unit_struct *)0x0) {
    cVar2 = FUN_00466190(puVar4,local_4);
    if ((param_2 != '\0') || (cVar2 != '\0')) {
      uVar3 = 1;
      FUN_004659d0(puVar4,param_1,local_4);
    }
  }
  return uVar3;
}
