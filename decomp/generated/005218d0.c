/* Ghidra 12.1.3 pseudocode; entry 005218d0; FUN_005218d0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


/* WARNING: Enum "_D3DRENDERSTATETYPE": Some values do not have unique names */

void __fastcall FUN_005218d0(int param_1)

{
  uint uVar1;
  int iVar2;
  int *piVar3;

  uVar1 = *(uint *)(param_1 + 0x6c8);
  if ((uVar1 & 4) == 0) {
    if ((uVar1 & 2) == 0) {
      if ((uVar1 & 1) == 0) {
        *(undefined4 *)(param_1 + 0x6cc) = 0;
      }
      else {
        *(undefined4 *)(param_1 + 0x6cc) = 1;
      }
    }
    else {
      *(undefined4 *)(param_1 + 0x6cc) = 2;
    }
  }
  else {
    *(undefined4 *)(param_1 + 0x6cc) = 4;
  }
  piVar3 = (int *)(param_1 + 0x6cc);
  if ((*(int *)(ui_struct->field34_0x6fc + 0x60c) == 0) && ((uVar1 & 1) != 0)) {
    *piVar3 = 1;
  }
  *(undefined4 *)(param_1 + 0x1dac) = 0;
  if ((*piVar3 == 4) || (*piVar3 == 2)) {
    iVar2 = DAT_00afc2f8;
    if ((DAT_00afc2f8 != 0) || (iVar2 = DAT_00afc2e8, DAT_00afc2e8 != 0)) goto LAB_0052197f;
    *piVar3 = 1;
    if ((uVar1 & 1) == 0) {
      *piVar3 = 0;
    }
  }
  iVar2 = *(int *)(param_1 + 0x1da0);
LAB_0052197f:
  *(int *)(param_1 + 0x1dac) = iVar2;
  if ((uVar1 & 2) == 0) {
    if ((uVar1 & 4) == 0) {
      if ((uVar1 & 1) == 0) {
        *(undefined4 *)(param_1 + 0x6d0) = 0;
      }
      else {
        *(undefined4 *)(param_1 + 0x6d0) = 1;
      }
    }
    else {
      *(undefined4 *)(param_1 + 0x6d0) = 4;
    }
  }
  else {
    *(undefined4 *)(param_1 + 0x6d0) = 2;
  }
  piVar3 = (int *)(param_1 + 0x6d0);
  if ((*piVar3 != 4) && (*piVar3 != 2)) {
    *(undefined4 *)(param_1 + 0x1da8) = *(undefined4 *)(param_1 + 0x1da0);
    return;
  }
  if (DAT_00afc2e8 != 0) {
    *(int *)(param_1 + 0x1da8) = DAT_00afc2e8;
    return;
  }
  if (DAT_00afc2f8 == 0) {
    *piVar3 = 1;
    if ((uVar1 & 1) == 0) {
      *piVar3 = 0;
    }
    *(undefined4 *)(param_1 + 0x1da8) = *(undefined4 *)(param_1 + 0x1da0);
    return;
  }
  *(int *)(param_1 + 0x1da8) = DAT_00afc2f8;
  return;
}
