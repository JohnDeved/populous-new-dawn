/* Ghidra 12.1.3 pseudocode; entry 004445d0; is_point_in_polygon.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


undefined1 is_point_in_polygon(ushort *param_1,short *param_2)

{
  int iVar1;
  bool bVar2;
  bool bVar3;
  undefined1 uVar4;
  uint uVar5;
  uint uVar6;
  int iVar7;
  int iVar8;
  int iVar9;
  int iVar10;
  int iVar11;
  char cVar12;
  bool bVar13;
  char local_37;
  int local_20;
  int local_c;

  uVar4 = 0;
  uVar5 = (uint)*param_1;
  uVar6 = (uint)param_1[1];
  if ((*(uint *)(param_2 + 2) == *(uint *)(param_2 + 8)) &&
     (*(uint *)(param_2 + 0xe) == *(uint *)(param_2 + 8))) {
    if ((*(uint *)(param_2 + 10) == *(uint *)(param_2 + 4)) &&
       (*(uint *)(param_2 + 0x10) == *(uint *)(param_2 + 10))) {
      if ((uVar5 == *(uint *)(param_2 + 2)) && (uVar6 == *(uint *)(param_2 + 4))) {
LAB_0044461e:
        uVar4 = 1;
      }
      return uVar4;
    }
  }
  if ((*param_2 == 0) && (param_2[0xc] == 0)) {
    bVar2 = false;
  }
  else {
    bVar2 = true;
  }
  if ((param_2[1] == 0) && (param_2[0xd] == 0)) {
    bVar3 = false;
  }
  else {
    bVar3 = true;
  }
  local_c = 0;
  do {
    if (local_c == 0) {
      iVar7 = 2;
      local_20 = 1;
      local_37 = (char)param_2[6];
      cVar12 = (char)param_2[7];
    }
    else {
      iVar7 = 3;
      local_20 = 2;
      local_37 = (char)param_2[0x12];
      cVar12 = (char)param_2[0x13];
    }
    iVar8 = *(int *)(param_2 + iVar7 * 6 + 2) - *(int *)(param_2 + 2);
    iVar9 = uVar6 - *(int *)(param_2 + iVar7 * 6 + 4);
    iVar10 = *(int *)(param_2 + 4) - *(int *)(param_2 + iVar7 * 6 + 4);
    iVar11 = uVar5 - *(int *)(param_2 + iVar7 * 6 + 2);
    if (iVar8 * iVar9 + iVar10 * iVar11 < 0) {
      bVar13 = false;
    }
    else {
      iVar1 = *(int *)(param_2 + local_20 * 6 + 4);
      bVar13 = false;
      if (-1 < (int)((uVar6 - iVar1) *
                     (*(int *)(param_2 + local_20 * 6 + 2) - *(int *)(param_2 + iVar7 * 6 + 2)) +
                    (uVar5 - *(int *)(param_2 + local_20 * 6 + 2)) *
                    (*(int *)(param_2 + iVar7 * 6 + 4) - iVar1))) {
        bVar13 = -1 < (int)((uVar6 - *(int *)(param_2 + 4)) *
                            (*(int *)(param_2 + 2) - *(int *)(param_2 + local_20 * 6 + 2)) +
                           (uVar5 - *(int *)(param_2 + 2)) * (iVar1 - *(int *)(param_2 + 4)));
      }
    }
    if (bVar13) goto LAB_0044461e;
    if (bVar2) {
LAB_004447b6:
      if ((iVar11 + 0x10000) * iVar10 + iVar8 * iVar9 < 0) {
        bVar13 = false;
      }
      else {
        iVar1 = *(int *)(param_2 + local_20 * 6 + 4);
        bVar13 = false;
        if (-1 < (int)(((uVar5 - *(int *)(param_2 + local_20 * 6 + 2)) + 0x10000) *
                       (*(int *)(param_2 + iVar7 * 6 + 4) - iVar1) +
                      (uVar6 - iVar1) *
                      (*(int *)(param_2 + local_20 * 6 + 2) - *(int *)(param_2 + iVar7 * 6 + 2)))) {
          bVar13 = -1 < (int)(((uVar5 - *(int *)(param_2 + 2)) + 0x10000) *
                              (iVar1 - *(int *)(param_2 + 4)) +
                             (uVar6 - *(int *)(param_2 + 4)) *
                             (*(int *)(param_2 + 2) - *(int *)(param_2 + local_20 * 6 + 2)));
        }
      }
      if (bVar13) goto LAB_0044461e;
LAB_0044484d:
      if ((bVar3) || (cVar12 != '\0')) {
        if ((iVar9 + 0x10000) * iVar8 + iVar10 * iVar11 < 0) {
          bVar13 = false;
        }
        else {
          iVar1 = *(int *)(param_2 + local_20 * 6 + 4);
          bVar13 = false;
          if (-1 < (int)(((uVar6 - iVar1) + 0x10000) *
                         (*(int *)(param_2 + local_20 * 6 + 2) - *(int *)(param_2 + iVar7 * 6 + 2))
                        + (uVar5 - *(int *)(param_2 + local_20 * 6 + 2)) *
                          (*(int *)(param_2 + iVar7 * 6 + 4) - iVar1))) {
            bVar13 = -1 < (int)(((uVar6 - *(int *)(param_2 + 4)) + 0x10000) *
                                (*(int *)(param_2 + 2) - *(int *)(param_2 + local_20 * 6 + 2)) +
                               (uVar5 - *(int *)(param_2 + 2)) * (iVar1 - *(int *)(param_2 + 4)));
          }
        }
        if (bVar13) goto LAB_0044461e;
      }
      if (((bVar2) || (local_37 != '\0')) && ((bVar3 || (cVar12 != '\0')))) {
        if ((iVar11 + 0x10000) * iVar10 + (iVar9 + 0x10000) * iVar8 < 0) {
          bVar13 = false;
        }
        else {
          iVar8 = *(int *)(param_2 + local_20 * 6 + 4);
          iVar9 = *(int *)(param_2 + local_20 * 6 + 2);
          bVar13 = false;
          if (-1 < (int)(((uVar6 - iVar8) + 0x10000) * (iVar9 - *(int *)(param_2 + iVar7 * 6 + 2)) +
                        ((uVar5 - iVar9) + 0x10000) * (*(int *)(param_2 + iVar7 * 6 + 4) - iVar8)))
          {
            bVar13 = -1 < (int)(((uVar6 - *(int *)(param_2 + 4)) + 0x10000) *
                                (*(int *)(param_2 + 2) - iVar9) +
                               ((uVar5 - *(int *)(param_2 + 2)) + 0x10000) *
                               (iVar8 - *(int *)(param_2 + 4)));
          }
        }
        if (bVar13) goto LAB_0044461e;
      }
    }
    else if (((bVar3) || (local_37 != '\0')) || (cVar12 != '\0')) {
      if (local_37 != '\0') goto LAB_004447b6;
      goto LAB_0044484d;
    }
    local_c = local_c + 1;
    if (1 < local_c) {
      return uVar4;
    }
  } while( true );
}
