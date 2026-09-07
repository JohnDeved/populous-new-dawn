/* Ghidra 12.1.3 pseudocode; entry 0044db60; FUN_0044db60.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


undefined1 FUN_0044db60(void)

{
  unit_struct *puVar1;
  bool bVar2;
  unit_struct *puVar3;

  bVar2 = false;
  if (DAT_0068c6bd == 0) {
    return 0;
  }
  DAT_0068c6bd = DAT_0068c6bd + -1;
  if (DAT_0068c6bd < 1) {
LAB_0044dbe6:
    bVar2 = true;
  }
  else {
    if ((DAT_0068c6c0 & 8) == 0) {
      puVar3 = (unit_struct *)0x0;
      if (((DAT_0068c6bb != 0) &&
          (puVar1 = unit_land_array[DAT_0068c6bb], (*(byte *)&puVar1->flags_2 & 1) == 0)) &&
         (puVar1->unit_class != '\0')) {
        puVar3 = puVar1;
      }
      if ((puVar3 == (unit_struct *)0x0) || ((DAT_0068c6c0 & 4) == 0)) goto LAB_0044dbe6;
    }
    DAT_0068b69d = 1;
    DAT_0068c6b7 = 0;
    DAT_0068c6b3 = maybe_framerate * 2;
  }
  if (bVar2) {
    DAT_0068c6a5 = 0;
    DAT_0068c6af = 0;
    DAT_0068b6a1 = 0;
    DAT_0068c6c0 = 0;
    DAT_0068c6bb = 0;
    DAT_0068c6a1 = 0;
    DAT_0068c6bd = 0;
    DAT_0068c6bf = 0;
  }
  return 1;
}
