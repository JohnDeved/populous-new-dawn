/* Ghidra 12.1.3 pseudocode; entry 004bc660; FUN_004bc660.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_004bc660(int param_1)

{
  char cVar1;
  bool bVar2;
  bool bVar3;
  int iVar4;
  short sVar5;
  int iVar6;
  short sVar7;
  undefined4 uVar8;
  short local_10;
  short sStack_e;
  short local_c;
  short local_8;
  short sStack_6;
  short local_4;

  bVar2 = false;
  bVar3 = false;
  cVar1 = *(char *)(param_1 + 0x2d);
  if (cVar1 == '\0') {
    *(undefined1 *)(param_1 + 0x2d) = 1;
  }
  else if (cVar1 != '\x01') {
    if (cVar1 == '\x02') {
      bVar3 = true;
    }
    goto LAB_004bc6fe;
  }
  sVar5 = *(short *)(param_1 + 0x4b) + -0x20;
  *(short *)(param_1 + 0x4b) = sVar5;
  local_10 = (short)*(undefined4 *)(param_1 + 0x3d);
  sStack_e = (short)((uint)*(undefined4 *)(param_1 + 0x3d) >> 0x10);
  local_10 = local_10 + *(short *)(param_1 + 0x49);
  sStack_e = sStack_e + *(short *)(param_1 + 0x4d);
  local_c = *(short *)(param_1 + 0x41) + sVar5;
  sVar5 = calc_point_height(CONCAT22(sStack_e,local_10),CONCAT22(local_c,sStack_e));
  bVar2 = local_c < sVar5;
  if (bVar2) {
    *(char *)(param_1 + 0x2d) = *(char *)(param_1 + 0x2d) + '\x01';
    local_c = sVar5;
  }
  add_unit_to_cell(param_1,&local_10);
LAB_004bc6fe:
  if (bVar3) {
    update_after_unit_alloc(param_1);
  }
  else {
    if (!bVar2) {
      sVar7 = 0;
      sVar5 = -(*(short *)(param_1 + 0x4b) / 2);
      local_8 = local_10;
      sStack_6 = sStack_e;
      iVar6 = 4;
      local_4 = local_c;
      do {
        local_4 = local_4 + sVar5;
        local_8 = local_8 - *(short *)(param_1 + 0x49) / 2;
        sStack_6 = sStack_6 - *(short *)(param_1 + 0x4d) / 2;
        if (*(char *)(param_1 + 0x2b) == '\a') {
          iVar4 = alloc_unit(7,3,*(undefined1 *)(param_1 + 0x2f),&local_8);
          if (iVar4 != 0) {
            *(undefined2 *)(iVar4 + 0x6c) = 0;
LAB_004bc7ae:
            *(uint *)(iVar4 + 0x14) = *(uint *)(iVar4 + 0x14) | 0x100;
            *(undefined4 *)(iVar4 + 0x43) = *(undefined4 *)(param_1 + 0x43);
            *(undefined2 *)(iVar4 + 0x47) = *(undefined2 *)(param_1 + 0x47);
          }
        }
        else {
          iVar4 = alloc_unit(7,0x42,*(undefined1 *)(param_1 + 0x2f),&local_8);
          if (iVar4 != 0) {
            *(undefined2 *)(iVar4 + 0x6c) = 0;
            *(short *)(iVar4 + 0x33) = *(short *)(iVar4 + 0x33) + sVar7;
            *(uint *)(iVar4 + 0x10) = *(uint *)(iVar4 + 0x10) | 0x400000;
            goto LAB_004bc7ae;
          }
        }
        sVar7 = sVar7 + 4;
        sVar5 = sVar5 + -0x10;
        iVar6 = iVar6 + -1;
        if (iVar6 == 0) {
          return;
        }
      } while( true );
    }
    alloc_unit(7,5,0,&local_10);
    if (*(char *)(param_1 + 0x2b) == '\a') {
      uVar8 = 3;
    }
    else {
      uVar8 = 0x42;
    }
    iVar6 = alloc_unit(7,uVar8,0,&local_10);
    if (iVar6 != 0) {
      *(uint *)(iVar6 + 0x10) = *(uint *)(iVar6 + 0x10) | 0x400000;
    }
    iVar6 = alloc_unit(7,1,*(undefined1 *)(param_1 + 0x2f),&local_10);
    if (iVar6 != 0) {
      FUN_0050b6f0(iVar6,3,2,5,0x62,0x8c,1,1);
    }
    if (*(char *)(param_1 + 0x2b) == '\a') {
      uVar8 = 0x3e;
    }
    else {
      uVar8 = 0x3f;
    }
    iVar6 = alloc_unit(7,uVar8,0,&local_10);
    if (iVar6 != 0) {
      *(uint *)(iVar6 + 0x10) = *(uint *)(iVar6 + 0x10) | 0x400000;
      return;
    }
  }
  return;
}
