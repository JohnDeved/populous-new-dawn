/* Ghidra 12.1.3 pseudocode; entry 004077e0; FUN_004077e0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


unit_struct * FUN_004077e0(ushort param_1)

{
  unit_struct *puVar1;
  unit_struct *puVar2;

  puVar2 = (unit_struct *)0x0;
  if (((param_1 != 0) && (puVar1 = unit_land_array[param_1], (*(byte *)&puVar1->flags_2 & 1) == 0))
     && (puVar1->unit_class != '\0')) {
    puVar2 = puVar1;
  }
  return puVar2;
}
