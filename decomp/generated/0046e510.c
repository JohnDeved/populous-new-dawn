/* Ghidra 12.1.3 pseudocode; entry 0046e510; calc_mesh_bounds_2.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void calc_mesh_bounds_2(int param_1)

{
  short sVar1;
  uint uVar2;
  int *piVar3;
  int iVar4;
  int iVar5;
  short sVar6;
  int *piVar7;
  int iVar8;
  int iVar9;
  int iVar10;
  int iVar11;
  mesh_render_bounds *pmVar12;
  undefined4 local_18;
  undefined4 local_14;
  undefined4 local_10;
  undefined4 local_c;
  int local_8 [2];

  pmVar12 = mesh_render_bounds_related_array;
  for (iVar4 = 0xde; iVar4 != 0; iVar4 = iVar4 + -1) {
    pmVar12->start = 0;
    pmVar12->end = 0;
    pmVar12 = pmVar12 + 1;
  }
  local_18 = *(int *)(param_1 + 0x44);
  local_14 = *(undefined4 *)(param_1 + 0x48);
  local_10 = *(undefined4 *)(param_1 + 0x4c);
  local_c = *(undefined4 *)(param_1 + 0x50);
  if (tribe_ptr->angle_1 == 0) {
    piVar3 = &local_18;
    do {
      *(short *)piVar3 = (short)*piVar3 + 0x6e;
      piVar7 = piVar3 + 1;
      *(short *)((int)piVar3 + 2) = *(short *)((int)piVar3 + 2) + 0x6e;
      piVar3 = piVar7;
    } while (piVar7 < local_8);
  }
  else {
    uVar2 = -(int)(short)tribe_ptr->angle_1 & 0x7ff;
    iVar4 = maybe_sin[uVar2];
    iVar5 = maybe_cos[uVar2];
    piVar3 = &local_18;
    do {
      iVar9 = *piVar3;
      piVar7 = piVar3 + 1;
      *(short *)piVar3 =
           (short)((uint)(iVar5 * (short)iVar9 - iVar4 * *(short *)((int)piVar3 + 2)) >> 0x10) +
           0x6e;
      *(short *)((int)piVar3 + 2) =
           (short)((uint)(iVar4 * (short)iVar9 + iVar5 * *(short *)((int)piVar3 + 2)) >> 0x10) +
           0x6e;
      piVar3 = piVar7;
    } while (piVar7 < local_8);
  }
  piVar3 = &local_18;
  do {
    if ((short)*piVar3 < 1) {
      *(short *)piVar3 = 1;
    }
    else if (0xdc < (short)*piVar3) {
      *(short *)piVar3 = 0xdc;
    }
    if (*(short *)((int)piVar3 + 2) < 1) {
      *(short *)((int)piVar3 + 2) = 1;
    }
    else if (0xdc < *(short *)((int)piVar3 + 2)) {
      *(short *)((int)piVar3 + 2) = 0xdc;
    }
    piVar3 = piVar3 + 1;
  } while (piVar3 < local_8);
  iVar4 = 0;
  do {
    if (iVar4 < 3) {
      iVar5 = iVar4 + 1;
      iVar9 = iVar4;
    }
    else {
      iVar9 = 0;
      iVar5 = iVar4;
    }
    sVar6 = *(short *)(&local_18 + iVar5);
    sVar1 = *(short *)(&local_18 + iVar9);
    iVar8 = (int)*(short *)((int)&local_18 + iVar5 * 4 + 2);
    iVar5 = (int)sVar1;
    iVar11 = (int)*(short *)((int)&local_18 + iVar9 * 4 + 2);
    iVar9 = iVar8 - iVar11;
    if (iVar9 == 0) {
      if (sVar1 < sVar6) {
        mesh_render_bounds_related_array[iVar11].start = sVar1;
        mesh_render_bounds_related_array[iVar11].end = sVar6;
      }
      else {
        mesh_render_bounds_related_array[iVar11].start = sVar6;
        mesh_render_bounds_related_array[iVar11].end = sVar1;
      }
    }
    else {
      iVar10 = iVar9;
      if (iVar8 < iVar11) {
        iVar10 = -iVar9;
      }
      local_8[0] = ((sVar6 - iVar5) * 0x100) / iVar10;
      iVar8 = 1;
      if (iVar9 < 1) {
        iVar8 = -1;
      }
      iVar9 = 0;
      if (-1 < iVar10) {
        pmVar12 = mesh_render_bounds_related_array + iVar11;
        iVar10 = iVar10 + 1;
        iVar11 = iVar5;
        do {
          sVar6 = (short)iVar11;
          if (pmVar12->start == 0) {
            pmVar12->start = sVar6;
LAB_0046e69b:
            pmVar12->end = sVar6;
          }
          else if (iVar11 < pmVar12->start) {
            pmVar12->start = sVar6;
          }
          else if (pmVar12->end < iVar11) goto LAB_0046e69b;
          iVar9 = iVar9 + local_8[0];
          pmVar12 = pmVar12 + iVar8;
          iVar10 = iVar10 + -1;
          iVar11 = iVar5 + ((int)(iVar9 + (iVar9 >> 0x1f & 0xffU)) >> 8);
        } while (iVar10 != 0);
      }
    }
    iVar4 = iVar4 + 1;
    if (3 < iVar4) {
      return;
    }
  } while( true );
}
