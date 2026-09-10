/* Ghidra 12.1.3 pseudocode; entry 0048c230; FUN_0048c230.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


uint __thiscall FUN_0048c230(int param_1,uint param_2)

{
  uint uVar1;
  int iVar2;
  undefined4 uVar3;
  undefined1 local_98 [12];
  uint local_8c;

  FUN_0056ccf0();
  if (interface_state != '\a') {
    FUN_0056cdb0(param_1);
  }
  if ((*(uint *)(param_1 + 4) & 2) == 0) {
    FUN_0056ce40(DAT_00895dc0);
    FUN_0056ce50(DAT_005ae2ac);
    FUN_0056cdf0(9999);
    if (interface_state != '\a') {
      local_8c = local_8c | 0x400;
      FUN_0056cd70(0);
    }
    FUN_0056cdd0(param_1);
    local_8c = local_8c | 0x21001;
    FUN_0056cd90(0x25800);
    FUN_0056ce30(DAT_00895db5);
  }
  else {
    if ((*(uint *)(param_1 + 4) & 4) == 0) {
      iVar2 = *(int *)(param_1 + 8);
      if (iVar2 == 0) {
        DAT_005ae2f8 = '\0';
        if ((*(uint *)(param_1 + 4) & 8) == 0) {
          FUN_0056ce40(1);
        }
        else {
          *(uint *)(param_1 + 4) = *(uint *)(param_1 + 4) & 0xfffffff7;
          FUN_0056ce40(2);
          *(uint *)(param_1 + 4) = *(uint *)(param_1 + 4) | 4;
        }
      }
      else if (iVar2 == 1) {
        DAT_005ae2f8 = '\0';
        FUN_0056ce40(2);
      }
      else if (iVar2 == 2) {
        DAT_005ae2f8 = DAT_005ae2f8 + '\x01';
        if ((DAT_005ae2f8 == '\x04') && (iVar2 = FUN_0056e030(DAT_005ae2b4), iVar2 == 4)) {
          uVar3 = 4;
        }
        else {
          uVar3 = 3;
        }
        FUN_0056ce40(uVar3);
        if (DAT_005ae2f8 == '\x04') {
          DAT_005ae2f8 = '\0';
        }
        *(uint *)(param_1 + 4) = *(uint *)(param_1 + 4) | 8;
      }
    }
    else {
      FUN_0056ce40(1);
      *(uint *)(param_1 + 4) = *(uint *)(param_1 + 4) & 0xfffffffb;
    }
    FUN_0056ce50(DAT_005ae2b4);
  }
  uVar1 = (**(code **)(*sound_related + 0x1c))(param_2,local_98);
  if (uVar1 != 0) {
    param_2 = uVar1;
  }
  if ((*(uint *)(param_1 + 4) & 2) != 0) {
    iVar2 = (**(code **)(*sound_related + 0x18))(param_2,&stack0xffffff60);
    return (iVar2 == 0) - 1 & param_2;
  }
  *(uint *)(param_1 + 4) = *(uint *)(param_1 + 4) | 2;
  uVar1 = (**(code **)(*sound_related + 0x18))(param_2,&stack0xffffff60);
  return uVar1;
}
