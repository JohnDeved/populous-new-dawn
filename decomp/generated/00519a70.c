/* Ghidra 12.1.3 pseudocode; entry 00519a70; FUN_00519a70.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


undefined4 FUN_00519a70(int param_1,int *param_2)

{
  undefined1 uVar1;
  ushort uVar2;
  unit_struct *puVar3;
  bool bVar4;
  bool bVar5;
  char cVar6;
  int *piVar7;
  int iVar8;
  undefined3 uVar9;
  int iVar10;
  int *piVar11;
  unit_struct *puVar12;
  ushort *puVar13;
  undefined1 local_9;
  undefined2 *local_8;
  int local_4;

  uVar2 = *(ushort *)(param_1 + 0x24);
  piVar7 = (int *)0x0;
  local_9 = 1;
  bVar5 = true;
  piVar11 = param_2;
  for (iVar10 = 6; iVar10 != 0; iVar10 = iVar10 + -1) {
    *piVar11 = 0;
    piVar11 = piVar11 + 1;
  }
  local_8 = (undefined2 *)0x6;
  puVar13 = (ushort *)(param_1 + 0x70);
  piVar11 = param_2;
  do {
    if (*puVar13 != 0) {
      puVar3 = unit_land_array[*puVar13];
      puVar12 = (unit_struct *)0x0;
      if (((*(byte *)&puVar3->flags_2 & 1) == 0) && (puVar3->unit_class != '\0')) {
        puVar12 = puVar3;
      }
      *piVar11 = (int)puVar12;
      if (puVar12 == (unit_struct *)0x0) {
        *puVar13 = 0;
      }
      else {
        bVar4 = false;
        if ((((int)*(short *)&puVar12->field_0x9d == (uint)uVar2) &&
            ((unit_type_related_1_ARRAY_005a6f78[(byte)puVar12->state].field_0x1 & 0x10) != 0)) &&
           (0 < *(short *)&puVar12->field_0x6e)) {
          piVar11 = piVar11 + 1;
          piVar7 = (int *)((int)piVar7 + 1);
        }
        else {
          bVar4 = true;
        }
        if (bVar4) {
          *puVar13 = 0;
          *(undefined2 *)&puVar12->field_0x9d = 0;
          *piVar11 = 0;
        }
      }
      if (*puVar13 == 0) {
        *(uint *)(param_1 + 0x10) = *(uint *)(param_1 + 0x10) & 0xffefffff;
        if (*(char *)(param_1 + 0x31) != '\0') {
          *(char *)(param_1 + 0x31) = *(char *)(param_1 + 0x31) + -1;
        }
      }
    }
    puVar13 = puVar13 + 1;
    local_8 = (undefined2 *)((int)local_8 + -1);
  } while (local_8 != (undefined2 *)0x0);
  cVar6 = (char)piVar7;
  *(char *)(param_1 + 0x68) = cVar6;
  if (cVar6 < '\x02') {
    local_9 = 0;
    if ('\0' < cVar6) {
LAB_00519c75:
      local_9 = 0;
      uVar1 = *(undefined1 *)(*param_2 + 0x2f);
      piVar7 = (int *)CONCAT31((int3)((uint)*param_2 >> 8),uVar1);
      *(undefined1 *)(param_1 + 0x6b) = uVar1;
    }
  }
  else {
    local_4 = (int)cVar6;
    if (0 < local_4) {
      local_8 = (undefined2 *)(param_1 + 0x70);
      piVar7 = param_2;
      do {
        iVar10 = *piVar7;
        if ((iVar10 != 0) &&
           (iVar8 = calc_squared_distance_toroidal(iVar10 + 0x3d,param_1 + 0x3d), 0x400000 < iVar8))
        {
          bVar5 = false;
          *(undefined2 *)(iVar10 + 0x9d) = 0;
          *local_8 = 0;
          *(char *)(param_1 + 0x68) = *(char *)(param_1 + 0x68) + -1;
          *piVar7 = 0;
        }
        local_8 = local_8 + 1;
        piVar7 = piVar7 + 1;
        local_4 = local_4 + -1;
      } while (local_4 != 0);
    }
    if (*(char *)(param_1 + 0x68) < '\x02') {
      piVar7 = (int *)0x0;
      local_9 = 0;
      if ('\0' < *(char *)(param_1 + 0x68)) {
        do {
          if (*param_2 != 0) goto LAB_00519c75;
          piVar7 = (int *)((int)piVar7 + 1);
          param_2 = param_2 + 1;
        } while ((int)piVar7 < 6);
      }
    }
    else {
      iVar10 = 6;
      *(undefined1 *)(param_1 + 0x69) = 0xff;
      *(undefined1 *)(param_1 + 0x6a) = 0xff;
      piVar7 = param_2;
      do {
        iVar8 = *piVar7;
        uVar9 = 0;
        if (iVar8 != 0) {
          cVar6 = *(char *)(iVar8 + 0x2f);
          uVar9 = (undefined3)((uint)iVar8 >> 8);
          if (*(char *)(param_1 + 0x69) == -1) {
            *(char *)(param_1 + 0x69) = cVar6;
          }
          else if (*(char *)(param_1 + 0x69) != cVar6) {
            *(char *)(param_1 + 0x6a) = cVar6;
          }
        }
        piVar7 = piVar7 + 1;
        iVar10 = iVar10 + -1;
      } while (iVar10 != 0);
      cVar6 = *(char *)(param_1 + 0x69);
      piVar7 = (int *)CONCAT31(uVar9,cVar6);
      if (cVar6 != -1) {
        if (*(char *)(param_1 + 0x6a) != -1) {
          if (!bVar5) {
            iVar10 = 0;
            do {
              if (*param_2 == 0) {
                piVar11 = param_2;
                for (iVar8 = 6 - iVar10; iVar8 != 0; iVar8 = iVar8 + -1) {
                  piVar7 = piVar11 + 1;
                  *piVar11 = *piVar7;
                  piVar11 = piVar7;
                }
              }
              iVar10 = iVar10 + 1;
              param_2 = param_2 + 1;
            } while (iVar10 < 5);
          }
          goto LAB_00519c7d;
        }
        if (cVar6 != -1) {
          local_9 = 0;
          *(char *)(param_1 + 0x6b) = cVar6;
          goto LAB_00519c7d;
        }
      }
      local_9 = 0;
      piVar7 = (int *)CONCAT31(uVar9,*(undefined1 *)(param_1 + 0x6a));
      *(undefined1 *)(param_1 + 0x6b) = *(undefined1 *)(param_1 + 0x6a);
    }
  }
LAB_00519c7d:
  return CONCAT31((int3)((uint)piVar7 >> 8),local_9);
}
