/* Ghidra 12.1.3 pseudocode; entry 004c23e0; spell_unit_processing_2.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void spell_unit_processing_2(int param_1)

{
  undefined4 *puVar1;
  unit_struct *puVar2;
  bool bVar3;
  int iVar4;
  int iVar5;
  unit_struct *puVar6;
  int iVar7;

  bVar3 = false;
  iVar5 = (uint)*(byte *)(param_1 + 0x2b) * 0x3e;
  if (*(char *)(param_1 + 0x2d) == '\x01') {
    puVar6 = (unit_struct *)0x0;
    if (((*(ushort *)(param_1 + 0x68) != 0) &&
        (puVar2 = unit_land_array[*(ushort *)(param_1 + 0x68)], (*(byte *)&puVar2->flags_2 & 1) == 0
        )) && (puVar2->unit_class != '\0')) {
      puVar6 = puVar2;
    }
    if (puVar6 != (unit_struct *)0x0) goto LAB_004c24ce;
    iVar7 = 0;
    do {
      if (((&DAT_005a80f8)[iVar7 + iVar5] != '\0') &&
         (iVar4 = alloc_unit(7,(&DAT_005a80f8)[iVar7 + iVar5],*(undefined1 *)(param_1 + 0x2f),
                             param_1 + 0x6c), iVar4 != 0)) {
        *(undefined4 *)(iVar4 + 0x57) = *(undefined4 *)(param_1 + 0x57);
        *(undefined2 *)(iVar4 + 0x5b) = *(undefined2 *)(param_1 + 0x5b);
      }
      iVar7 = iVar7 + 1;
    } while (iVar7 < 5);
  }
  else {
    if (*(char *)(param_1 + 0x2d) != '\x05') goto LAB_004c24ce;
    puVar1 = (undefined4 *)(param_1 + 0x6c);
    iVar5 = alloc_unit(8,CONCAT31((int3)((uint)iVar5 >> 8),(&DAT_005a80f6)[iVar5]),
                       *(undefined1 *)(param_1 + 0x2f),puVar1);
    if (iVar5 != 0) {
      *(undefined4 *)(iVar5 + 0x76) = *puVar1;
      *(undefined2 *)(iVar5 + 0x7a) = *(undefined2 *)(param_1 + 0x70);
      *(undefined4 *)(iVar5 + 0x70) = *puVar1;
      *(undefined2 *)(iVar5 + 0x74) = *(undefined2 *)(param_1 + 0x70);
      *(short *)(iVar5 + 0x74) = *(short *)(iVar5 + 0x74) + 0x800;
      *(undefined1 *)(param_1 + 0x2d) = 1;
      *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) | 0x40000000;
      *(undefined2 *)(param_1 + 0x68) = *(undefined2 *)(iVar5 + 0x24);
      goto LAB_004c24ce;
    }
  }
  bVar3 = true;
LAB_004c24ce:
  if (bVar3) {
    update_after_unit_alloc(param_1);
  }
  return;
}
