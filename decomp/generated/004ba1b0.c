/* Ghidra 12.1.3 pseudocode; entry 004ba1b0; FUN_004ba1b0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_004ba1b0(int param_1)

{
  byte bVar1;
  short sVar2;
  ushort uVar3;
  unit_struct *puVar4;
  bool bVar5;
  int iVar6;
  ushort *puVar7;
  unit_struct *puVar8;

  sVar2 = *(short *)(param_1 + 0x24);
  bVar1 = *(byte *)(param_1 + 0x9a);
  if (bVar1 != 0) {
    iVar6 = 0;
    if (bVar1 != 0) {
      puVar7 = (ushort *)(param_1 + 0x6a);
      do {
        uVar3 = *puVar7;
        if (uVar3 != 0) {
          iVar6 = iVar6 + 1;
          bVar5 = false;
          puVar8 = (unit_struct *)0x0;
          if ((((uVar3 != 0) &&
               (puVar4 = unit_land_array[uVar3], (*(byte *)&puVar4->flags_2 & 1) == 0)) &&
              (puVar4->unit_class != '\0')) && (0 < *(short *)&puVar4->field_0x6e)) {
            puVar8 = puVar4;
          }
          if ((puVar8 == (unit_struct *)0x0) || (puVar8->state != '\n')) {
LAB_004ba231:
            bVar5 = true;
          }
          else if ((*(short *)((int)&puVar8->loc_3_y + 1) != sVar2) ||
                  (*(char *)(param_1 + 0x2f) != puVar8->tribe_index)) goto LAB_004ba231;
          if (bVar5) {
            *puVar7 = 0;
            *(char *)(param_1 + 0x9a) = *(char *)(param_1 + 0x9a) + -1;
          }
        }
        puVar7 = puVar7 + 1;
      } while (iVar6 < (int)(uint)bVar1);
    }
  }
  return;
}
