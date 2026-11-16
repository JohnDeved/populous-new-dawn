/* Ghidra 12.1.3 pseudocode; entry 00503230; FUN_00503230.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_00503230(void)

{
  unit_struct *puVar1;

  DAT_0089c65d = 0;
  for (puVar1 = allocated_units_2; puVar1 != (unit_struct *)0x0; puVar1 = puVar1->next_unit_1) {
    if ((puVar1->unit_class == '\n') && (puVar1->unit_type == '\x10')) {
      DAT_0089c65d = DAT_0089c65d + 1;
    }
  }
  DAT_0089ce61 = 0;
  if (DAT_0089c65d < 0x21) {
    DAT_0089ce61 = 8;
  }
  if (DAT_0089c65d < 0x16) {
    DAT_0089ce61 = 4;
  }
  if (DAT_0089c65d < 0xd) {
    DAT_0089ce61 = 2;
  }
  return;
}
