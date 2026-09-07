/* Ghidra 12.1.3 pseudocode; entry 0040bbe0; FUN_0040bbe0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_0040bbe0(int param_1)

{
  byte bVar1;
  unit_struct *puVar2;
  int iVar3;
  int iVar4;
  uint uVar5;
  ushort *puVar6;
  unit_struct *puVar7;
  int local_c;
  int local_8;
  uint local_4;

  bVar1 = *(byte *)(param_1 + 0x2b);
  local_c = 0;
  local_4 = (uint)(byte)unit_type_array_building[bVar1].unit_type1;
  local_8 = (int)(short)unit_type_array_person[local_4].conv;
  iVar4 = 0;
  iVar3 = 0;
  if (*(char *)(param_1 + 0xa6) != '\0') {
    if (unit_type_array_building[bVar1].field31_0x20 != 0) {
      puVar6 = (ushort *)(param_1 + 0x86);
      uVar5 = (uint)(byte)unit_type_array_building[bVar1].field31_0x20;
      do {
        puVar7 = (unit_struct *)0x0;
        if (((*puVar6 != 0) &&
            (puVar2 = unit_land_array[*puVar6], (*(byte *)&puVar2->flags_2 & 1) == 0)) &&
           (puVar2->unit_class != '\0')) {
          puVar7 = puVar2;
        }
        if ((puVar7 != (unit_struct *)0x0) &&
           (puVar7->unit_type != unit_type_array_building[bVar1].unit_type1)) {
          iVar4 = iVar4 + (short)unit_type_array_person[(byte)puVar7->unit_type].conv;
        }
        puVar6 = puVar6 + 1;
        uVar5 = uVar5 - 1;
      } while (uVar5 != 0);
    }
    if (local_8 <= iVar4) {
      iVar3 = iVar4;
    }
  }
  FUN_0041b0c0(param_1,&local_c,local_4,iVar3 / local_8);
  if (0xffff < local_c) {
    local_c = 0xffff;
  }
  *(short *)(param_1 + 0x96) = (short)local_c;
  return;
}
