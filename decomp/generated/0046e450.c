/* Ghidra 12.1.3 pseudocode; entry 0046e450; calc_mesh_bounds_1.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void calc_mesh_bounds_1(ushort param_1)

{
  short sVar1;
  short sVar2;
  int iVar3;
  mesh_render_bounds *pmVar4;
  int iVar5;
  uint uVar6;
  mesh_render_bounds *pmVar7;

  uVar6 = (uint)(param_1 >> 1);
  iVar5 = 0;
  pmVar4 = mesh_render_bounds_related_array;
  for (iVar3 = 0xde; iVar3 != 0; iVar3 = iVar3 + -1) {
    pmVar4->start = 0;
    pmVar4->end = 0;
    pmVar4 = pmVar4 + 1;
  }
  pmVar4 = mesh_render_bounds_related_array + 0x6e;
  pmVar7 = mesh_render_bounds_related_array + 0x6e;
  if (uVar6 != 0) {
    do {
      iVar3 = fast_sqrt(uVar6 * uVar6 - iVar5 * iVar5);
      if (iVar3 < 3) {
        iVar3 = 0;
      }
      iVar5 = iVar5 + 1;
      sVar2 = 0x6e - (short)iVar3;
      pmVar4->start = sVar2;
      sVar1 = (short)iVar3 + 0x6e;
      pmVar7->start = sVar2;
      pmVar4->end = sVar1;
      pmVar7->end = sVar1;
      pmVar4 = pmVar4 + -1;
      pmVar7 = pmVar7 + 1;
    } while (iVar5 < (int)uVar6);
  }
  if (param_1 < 0xdc) {
    iVar3 = -uVar6;
    *(mesh_render_bounds *)(polygons_to_draw + iVar3 + 0xe6e) =
         mesh_render_bounds_related_array[iVar3 + 0x6e];
    mesh_render_bounds_related_array[iVar3 + 0x6e] = mesh_render_bounds_related_array[iVar3 + 0x6f];
  }
  return;
}
