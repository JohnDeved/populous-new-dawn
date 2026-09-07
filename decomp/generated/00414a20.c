/* Ghidra 12.1.3 pseudocode; entry 00414a20; FUN_00414a20.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

int FUN_00414a20(undefined4 *param_1,uint param_2)

{
  int *piVar1;
  int *piVar2;
  uint uVar3;
  int iVar4;
  int *piVar5;
  int local_c;
  undefined1 local_8;
  uint local_7;

  local_c = 0;
  EnterCriticalSection((LPCRITICAL_SECTION)&critical_section);
  piVar2 = DAT_00599c24;
  while ((piVar2 != (int *)0x0 && (local_c == 0))) {
    uVar3 = piVar2[2];
    if (param_2 == uVar3) {
      local_c = 1;
      if (param_1 != (undefined4 *)0x0) {
        piVar5 = piVar2 + 3;
        iVar4 = 0;
        if (piVar5 < piVar2 + 0x12) {
          do {
            param_1[1] = *piVar5;
            param_1[2] = piVar5[1];
            *(char *)(param_1 + 3) = (char)piVar5[2];
            *(undefined1 *)((int)param_1 + 0xd) = *(undefined1 *)((int)piVar5 + 9);
            if (((land_flags_1._1_1_ & 0x10) == 0) && (*(char *)((int)piVar5 + 0xe) != '\0')) {
              EnterCriticalSection((LPCRITICAL_SECTION)&critical_section_3);
              FUN_00414bf0(piVar5,iVar4);
              LeaveCriticalSection((LPCRITICAL_SECTION)&critical_section_3);
            }
            *param_1 = *(undefined4 *)((int)piVar5 + 10);
            *(undefined1 *)((int)param_1 + 0xe) = *(undefined1 *)((int)piVar5 + 0xe);
            piVar5 = (int *)((int)piVar5 + 0xf);
            param_1 = (undefined4 *)((int)param_1 + 0xf);
            iVar4 = iVar4 + 1;
          } while (piVar5 < piVar2 + 0x12);
        }
      }
      piVar5 = (int *)piVar2[1];
      if (*piVar2 == 0) {
        DAT_00599c24 = piVar5;
        if (piVar5 != (int *)0x0) {
          *piVar5 = 0;
        }
      }
      else {
        *(int **)(*piVar2 + 4) = piVar5;
        if ((int *)piVar2[1] != (int *)0x0) {
          *(int *)piVar2[1] = *piVar2;
        }
      }
      free_2(piVar2);
      piVar2 = piVar5;
    }
    else if (uVar3 < param_2) {
      piVar5 = (int *)piVar2[1];
      if (*piVar2 == 0) {
        DAT_00599c24 = piVar5;
        if (piVar5 != (int *)0x0) {
          *piVar5 = 0;
        }
      }
      else {
        *(int **)(*piVar2 + 4) = piVar5;
        piVar1 = (int *)piVar2[1];
        if (piVar1 != (int *)0x0) {
          *piVar1 = *piVar2;
        }
      }
      free_2(piVar2);
      piVar2 = piVar5;
    }
    else {
      if ((param_2 + 3 < uVar3) &&
         (uVar3 = (uint)DAT_0089d161, iVar4 = GetCurrentMs(),
         (uint)(1000 / (ulonglong)(longlong)(int)uVar3) < (uint)(iVar4 - _DAT_00599c3c))) {
        _DAT_00599c3c = GetCurrentMs();
        local_7 = param_2;
        local_8 = 0xb;
        mld_function_2(0xfffffffe,&local_8,5,0,0);
      }
      piVar2 = (int *)piVar2[1];
    }
  }
  LeaveCriticalSection((LPCRITICAL_SECTION)&critical_section);
  return local_c;
}
