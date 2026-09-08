/* Ghidra 12.1.3 pseudocode; entry 004ee770; FUN_004ee770.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_004ee770(void)

{
  unit_struct *puVar1;
  unit_struct *puVar2;

  puVar1 = allocated_units;
  if (((byte)land_flags_1 & 2) == 0) {
    for (; puVar2 = allocated_units_2, puVar1 != (unit_struct *)0x0; puVar1 = puVar1->next_unit_1) {
      update_unit_animation(puVar1);
    }
    for (; puVar2 != (unit_struct *)0x0; puVar2 = puVar2->next_unit_1) {
      update_unit_animation(puVar2);
    }
  }
  return;
}
