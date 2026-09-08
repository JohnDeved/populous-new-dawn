/* Ghidra 12.1.3 pseudocode; entry 004d55a0; FUN_004d55a0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


undefined4 FUN_004d55a0(uint *param_1)

{
  unit_struct *puVar1;
  bool bVar2;
  uint uVar3;
  int iVar4;
  undefined1 local_1;

  uVar3 = *param_1;
  bVar2 = false;
  local_1 = 0;
  if (((uVar3 & 0x4206) == 0) &&
     (uVar3 = (uint)((byte)param_1[3] & 0xf), (*(byte *)(landscape_height_array + uVar3) & 1) != 0))
  {
    uVar3 = (uint)*(short *)((int)param_1 + 6);
    puVar1 = unit_land_array[uVar3];
    while (puVar1 != (unit_struct *)0x0) {
      if (bVar2) goto LAB_004d563f;
      bVar2 = false;
      if (puVar1->unit_class == '\x01') {
        iVar4 = FUN_004f62c0(puVar1,0x18);
        if (iVar4 != 0) goto LAB_004d5623;
      }
      else if ((puVar1->unit_class == '\x04') &&
              ((unit_type_array_vehicle[(byte)puVar1->unit_type].field_0x15 & 1) == 0)) {
LAB_004d5623:
        bVar2 = true;
      }
      uVar3 = (uint)puVar1->next_unit_index;
      puVar1 = unit_land_array[uVar3];
    }
    if (!bVar2) {
      local_1 = 1;
    }
  }
LAB_004d563f:
  return CONCAT31((int3)(uVar3 >> 8),local_1);
}
