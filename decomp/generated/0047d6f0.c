/* Ghidra 12.1.3 pseudocode; entry 0047d6f0; set_renderer_state.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


/* WARNING: Enum "_D3DRENDERSTATETYPE": Some values do not have unique names */

uint __thiscall set_renderer_state(int param_1,int *param_2,uint *param_3,uint param_4)

{
  code *pcVar1;
  uint uVar2;
  undefined4 uVar3;

  uVar2 = *param_3;
  if (uVar2 == param_4) {
    return 0;
  }
  *param_3 = param_4;
  uVar2 = param_4 ^ uVar2;
  if ((uVar2 & 0x3ff) == 0) {
    return 0;
  }
  if ((uVar2 & 2) != 0) {
    pcVar1 = *(code **)(*param_2 + 0x5c);
    if ((param_4 & 2) == 0) {
      (*pcVar1)(param_2,0xf,0);
      (*pcVar1)(param_2,0x18,0);
    }
    else {
      (*pcVar1)(param_2,0xf,1);
      (*pcVar1)(param_2,0x18,0x7f);
    }
  }
  if ((uVar2 & 4) != 0) {
    (**(code **)(*param_2 + 0x5c))(param_2,0x29,(param_4 & 4) >> 2);
  }
  if ((uVar2 & 0x10) != 0) {
    if ((param_4 & 0x10) == 0) {
      uVar3 = 2;
    }
    else {
      uVar3 = 1;
    }
    (**(code **)(*param_2 + 0x5c))(param_2,9,uVar3);
  }
  if ((uVar2 & 8) != 0) {
    (**(code **)(*param_2 + 0x5c))(param_2,0x1d,(param_4 & 8) >> 3);
  }
  if ((ui_struct->uv_related != 1) && ((uVar2 & 0x20) != 0)) {
    pcVar1 = *(code **)(*param_2 + 0x5c);
    if ((param_4 & 0x20) == 0) {
      (*pcVar1)(param_2,0x11,2);
      uVar3 = 2;
    }
    else {
      (*pcVar1)(param_2,0x11,1);
      uVar3 = 1;
    }
    (*pcVar1)(param_2,0x12,uVar3);
  }
  if ((uVar2 & 0x40) != 0) {
    if ((param_4 & 0x40) == 0) {
      if (*(int *)(ui_struct->field34_0x6fc + 0x60c) == 0) goto LAB_0047d82d;
      uVar3 = 2;
    }
    else {
      if (*(int *)(ui_struct->field34_0x6fc + 0x60c) == 0) goto LAB_0047d82d;
      uVar3 = 4;
    }
    (**(code **)(*param_2 + 0x5c))(param_2,0x15,uVar3);
  }
LAB_0047d82d:
  if ((uVar2 & 0x80) != 0) {
    if ((param_4 & 0x80) == 0) {
      uVar3 = 3;
    }
    else {
      uVar3 = 1;
    }
    (**(code **)(*param_2 + 0x5c))(param_2,3,uVar3);
  }
  if ((uVar2 & 0x100) != 0) {
    if ((param_4 & 0x100) == 0) {
      *(uint *)(param_1 + 0x1e) = *(uint *)(param_1 + 0x1e) & 0xfffffffb;
    }
    else {
      *(uint *)(param_1 + 0x1e) = *(uint *)(param_1 + 0x1e) | 4;
    }
  }
  if ((uVar2 & 0x200) != 0) {
    if ((param_4 & 0x200) == 0) {
      uVar3 = 6;
    }
    else {
      uVar3 = 2;
    }
    (**(code **)(*param_2 + 0x5c))(param_2,0x14,uVar3);
  }
  return uVar2 & 0x3ff;
}
