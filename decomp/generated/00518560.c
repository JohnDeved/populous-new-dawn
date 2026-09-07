/* Ghidra 12.1.3 pseudocode; entry 00518560; FUN_00518560.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


uint FUN_00518560(int param_1)

{
  byte bVar1;
  unit_struct *puVar2;
  uint uVar3;
  unit_struct *puVar4;

  uVar3 = 0;
  puVar4 = (unit_struct *)0x0;
  if (((*(ushort *)(param_1 + 0x9d) != 0) &&
      (puVar2 = unit_land_array[*(ushort *)(param_1 + 0x9d)], (*(byte *)&puVar2->flags_2 & 1) == 0))
     && (puVar2->unit_class != '\0')) {
    puVar4 = puVar2;
  }
  if (puVar4 == (unit_struct *)0x0) {
    if ((game_state.level_flags & 2) != 0) {
      bVar1 = *(byte *)(param_1 + 0x2b);
      if (bVar1 == 7) {
        return 0x27;
      }
      return CONCAT31((int3)((uint)bVar1 * 5 >> 8),unit_type_array_person[bVar1].next_state);
    }
    uVar3 = (uint)(byte)unit_type_array_person[*(byte *)(param_1 + 0x2b)].next_state;
  }
  return uVar3;
}
