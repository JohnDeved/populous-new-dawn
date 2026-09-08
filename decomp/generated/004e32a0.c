/* Ghidra 12.1.3 pseudocode; entry 004e32a0; FUN_004e32a0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


undefined1 FUN_004e32a0(int param_1)

{
  bool bVar1;
  int iVar2;

  bVar1 = false;
  if ((((byte)land_flags_1 & 8) == 0) && ((land_flags_1._3_1_ & 6) != 0)) {
    if ((land_flags_1._3_1_ & 4) == 0) {
      if (*(char *)(param_1 + 0x2f) != player_tribe_num) goto LAB_004e32db;
    }
    else {
      iVar2 = FUN_0041b5e0();
      if (1 < iVar2) goto LAB_004e32db;
    }
    bVar1 = true;
  }
LAB_004e32db:
  if (!bVar1) {
    return unit_type_array_person[*(byte *)(param_1 + 0x2b)].field_0x5;
  }
  return 0x29;
}
