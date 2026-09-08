/* Ghidra 12.1.3 pseudocode; entry 004229a0; FUN_004229a0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

undefined4 FUN_004229a0(int param_1)

{
  int iVar1;
  undefined4 uVar2;
  int *piVar3;
  int *piVar4;
  int *piVar5;
  int iVar6;
  int iVar7;

  iVar7 = 0;
  param_1 = param_1 * 0xa43;
  uVar2 = 1;
  iVar1 = *(int *)((int)&DAT_0064fec8 + param_1);
  piVar3 = (int *)((int)&DAT_00650944 + _DAT_00651344 * 10);
  iVar6 = (int)(short)game_state._755270_2_;
  piVar4 = (int *)0x0;
  piVar5 = (int *)((int)&DAT_0064f4c8 + param_1);
  if (0 < iVar1) {
    do {
      if (iVar6 <= _DAT_00651344) {
        uVar2 = 0;
        break;
      }
      if (((piVar4 == (int *)0x0) || (*piVar4 != *piVar5)) || (piVar4[1] != piVar5[1])) {
        *piVar3 = *piVar5;
        _DAT_00651344 = _DAT_00651344 + 1;
        piVar3[1] = piVar5[1];
        *(short *)(piVar3 + 2) = (short)piVar5[2];
        piVar3 = (int *)((int)piVar3 + 10);
      }
      iVar7 = iVar7 + 1;
      piVar4 = piVar5;
      piVar5 = (int *)((int)piVar5 + 10);
    } while (iVar7 < iVar1);
  }
  DAT_0064f4a4 = *(undefined4 *)((int)&DAT_0064f4ae + param_1);
  return uVar2;
}
