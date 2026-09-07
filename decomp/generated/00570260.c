/* Ghidra 12.1.3 pseudocode; entry 00570260; FUN_00570260.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


int * __thiscall FUN_00570260(int param_1,int param_2,int param_3,int *param_4)

{
  void *pvVar1;
  int iVar2;
  int *piVar3;
  int *piVar4;
  undefined4 *unaff_FS_OFFSET;
  undefined4 local_10;
  undefined1 *puStack_c;
  undefined4 local_8;

  local_10 = *unaff_FS_OFFSET;
  local_8 = 0xffffffff;
  puStack_c = &LAB_0057056e;
  *unaff_FS_OFFSET = &local_10;
  if ((*(byte *)(param_2 + 0x16) & 2) != 0) {
    piVar4 = (int *)0x0;
    pvVar1 = operator_new(0x30);
    local_8 = 0;
    if (pvVar1 != (void *)0x0) {
      piVar4 = (int *)FUN_005774e0();
    }
    local_8 = 0xffffffff;
    if (param_4 != (int *)0x0) {
      (**(code **)*piVar4)(param_4);
      iVar2 = FUN_00577500(*(undefined4 *)(param_2 + 0x90));
      if (iVar2 != 0) {
        (**(code **)(*piVar4 + 0x10))();
        piVar4 = (int *)0x0;
        goto LAB_0057055b;
      }
      (**(code **)(*piVar4 + 0x10))();
    }
  }
  piVar4 = param_4;
  if (((*(byte *)(param_2 + 0x14) & 0x40) != 0) && (1 < *(uint *)(param_2 + 0x80))) {
    if ((*(int *)(param_3 + 0x20) == 0) || (*(int *)(param_3 + 0x24) == 0)) {
      piVar4 = (int *)0x0;
      pvVar1 = operator_new(0x34);
      local_8 = 2;
      if (pvVar1 != (void *)0x0) {
        piVar4 = (int *)FUN_005771c0();
      }
    }
    else {
      pvVar1 = operator_new(0x3c);
      local_8 = 1;
      if (pvVar1 == (void *)0x0) {
        piVar4 = (int *)0x0;
      }
      else {
        piVar4 = (int *)FUN_00577330(param_3);
      }
    }
    local_8 = 0xffffffff;
    if ((param_4 != (int *)0x0) && (piVar4 != (int *)0x0)) {
      (**(code **)*piVar4)(param_4);
    }
  }
  if ((*(uint *)(param_2 + 0xc) & 0x800) == 0) {
    piVar3 = piVar4;
    if ((*(uint *)(param_2 + 0xc) & 0x400) != 0) {
      piVar3 = (int *)0x0;
      pvVar1 = operator_new(0x3c3c);
      local_8 = 4;
      if (pvVar1 != (void *)0x0) {
        piVar3 = (int *)FUN_00576d00();
      }
      local_8 = 0xffffffff;
      if (piVar4 != (int *)0x0) {
        (**(code **)*piVar3)(piVar4);
      }
      iVar2 = (**(code **)(*piVar4 + 0x30))(2);
      goto joined_r0x00570487;
    }
  }
  else {
    pvVar1 = operator_new(0x3c48);
    local_8 = 3;
    if (pvVar1 == (void *)0x0) {
      piVar3 = (int *)0x0;
    }
    else {
      piVar3 = (int *)FUN_00577030();
    }
    local_8 = 0xffffffff;
    if (piVar4 != (int *)0x0) {
      (**(code **)*piVar3)(piVar4);
    }
    iVar2 = (**(code **)(*piVar4 + 0x30))(2);
joined_r0x00570487:
    if (iVar2 != 0) {
      piVar4[0xc] = param_1;
    }
  }
  piVar4 = piVar3;
  if ((*(byte *)(param_2 + 0xd) & 0x10) != 0) {
    pvVar1 = operator_new(0x3c);
    local_8 = 5;
    if (pvVar1 == (void *)0x0) {
      piVar4 = (int *)0x0;
    }
    else {
      piVar4 = (int *)FUN_00573c80();
    }
    local_8 = 0xffffffff;
    if (piVar3 != (int *)0x0) {
      (**(code **)*piVar4)(piVar3);
    }
    *(uint *)(param_2 + 0xc) = *(uint *)(param_2 + 0xc) & 0xffffefff;
  }
  piVar3 = piVar4;
  if ((*(byte *)(param_2 + 0xd) & 0x20) != 0) {
    pvVar1 = operator_new(0x48);
    local_8 = 6;
    if (pvVar1 == (void *)0x0) {
      piVar3 = (int *)0x0;
    }
    else {
      piVar3 = (int *)FUN_00576b70();
    }
    local_8 = 0xffffffff;
    if (piVar4 != (int *)0x0) {
      (**(code **)*piVar3)(piVar4);
    }
  }
  piVar4 = piVar3;
  if ((*(byte *)(param_2 + 0xe) & 1) != 0) {
    pvVar1 = operator_new(0x7834);
    local_8 = 7;
    if (pvVar1 == (void *)0x0) {
      piVar4 = (int *)0x0;
    }
    else {
      piVar4 = (int *)FUN_00576980();
    }
    local_8 = 0xffffffff;
    if (piVar3 != (int *)0x0) {
      (**(code **)*piVar4)(piVar3);
    }
  }
LAB_0057055b:
  *unaff_FS_OFFSET = local_10;
  return piVar4;
}
