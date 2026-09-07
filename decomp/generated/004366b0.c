/* Ghidra 12.1.3 pseudocode; entry 004366b0; FUN_004366b0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


char FUN_004366b0(int param_1)

{
  int iVar1;
  ushort uVar2;
  char cVar3;
  uint uVar4;
  undefined1 uVar5;
  int iVar6;
  int iVar7;
  char local_5;
  int local_4;

  local_5 = '\0';
  if (((&DAT_005a7dcb)[(uint)*(byte *)(param_1 + 0xa7) * 0x16] & 0x80) == 0) {
    local_4 = 0;
    iVar6 = *(byte *)(param_1 + 0xa6) + 1;
    do {
      if (7 < iVar6) {
        iVar6 = 0;
      }
      uVar2 = *(ushort *)(param_1 + 0x8b + iVar6 * 2);
      if (uVar2 != 0) {
        if ((*(byte *)((int)(game_state.sunlight_array + 0x32) + (uint)uVar2 * 10 + 1) & 1) == 0) {
          local_5 = '\x01';
          break;
        }
        FUN_004364d0(param_1,iVar6);
      }
      iVar6 = iVar6 + 1;
      local_4 = local_4 + 1;
    } while (local_4 < 8);
    uVar5 = (undefined1)iVar6;
    if (local_5 == '\0') {
      cVar3 = FUN_0043d2f0(param_1);
      if (cVar3 != '\0') {
        local_5 = '\x01';
        uVar5 = 0;
      }
      if (local_5 != '\0') goto LAB_0043676b;
      cVar3 = FUN_0043d0e0(param_1);
      if (cVar3 != '\0') {
        local_5 = '\x01';
        uVar5 = 0;
      }
    }
    if (local_5 != '\0') {
LAB_0043676b:
      *(undefined1 *)(param_1 + 0xa6) = uVar5;
      FUN_00436870(param_1);
      FUN_00432df0(param_1);
      FUN_004d4f40(param_1);
      return local_5;
    }
  }
  else {
    iVar7 = 0;
    iVar6 = *(byte *)(param_1 + 0xa6) + 1;
    do {
      if (7 < iVar6) {
        iVar6 = 0;
      }
      uVar4 = (uint)*(ushort *)(param_1 + 0x8b + iVar6 * 2);
      if (uVar4 != 0) {
        iVar1 = uVar4 * 10;
        if ((*(byte *)((int)(game_state.sunlight_array + 0x32) + iVar1 + 1) & 1) == 0) {
          if (*(char *)(param_1 + 0xa7) ==
              *(char *)((int)(game_state.sunlight_array + 0x32) + iVar1)) {
            local_5 = '\x01';
            break;
          }
        }
        else {
          FUN_004364d0(param_1,iVar6);
        }
      }
      iVar7 = iVar7 + 1;
      iVar6 = iVar6 + 1;
    } while (iVar7 < 8);
    if (local_5 != '\0') {
      *(char *)(param_1 + 0xa6) = (char)iVar6;
      FUN_00432df0(param_1);
      FUN_004d4f40(param_1);
      return local_5;
    }
    iVar6 = 0;
    *(undefined1 *)(param_1 + 0xa6) = 0;
    do {
      if (*(short *)(param_1 + 0x8b + iVar6 * 2) != 0) {
        FUN_004364d0(param_1,iVar6);
      }
      iVar6 = iVar6 + 1;
    } while (iVar6 < 8);
    if (*(short *)(param_1 + 0x9b) != 0) {
      FUN_004364d0(param_1,0xffffffff);
    }
    *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) & 0xf7ffffff;
    *(uint *)(param_1 + 0x10) = *(uint *)(param_1 + 0x10) & 0xfffffdff;
  }
  return local_5;
}
