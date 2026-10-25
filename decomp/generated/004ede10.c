/* Ghidra 12.1.3 pseudocode; entry 004ede10; FUN_004ede10.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_004ede10(undefined4 *param_1,undefined4 *param_2)

{
  undefined1 uVar1;
  undefined1 uVar2;
  undefined2 uVar3;
  undefined2 uVar4;
  undefined2 uVar5;
  undefined2 uVar6;
  undefined4 uVar7;
  undefined4 uVar8;
  undefined4 uVar9;
  uint uVar10;
  uint uVar11;
  uint uVar12;
  int iVar13;
  undefined4 *puVar14;

  uVar7 = param_1[1];
  uVar8 = *param_1;
  uVar3 = *(undefined2 *)(param_1 + 9);
  uVar4 = *(undefined2 *)((int)param_1 + 0x41);
  uVar9 = *(undefined4 *)((int)param_1 + 0x3d);
  uVar10 = param_1[3];
  uVar1 = *(undefined1 *)((int)param_1 + 0x2e);
  uVar11 = param_1[4];
  uVar12 = param_1[5];
  uVar5 = *(undefined2 *)(param_1 + 8);
  uVar6 = *(undefined2 *)((int)param_1 + 0x22);
  uVar2 = *(undefined1 *)(param_1 + 0xb);
  puVar14 = param_1;
  for (iVar13 = 0x2c; iVar13 != 0; iVar13 = iVar13 + -1) {
    *puVar14 = *param_2;
    param_2 = param_2 + 1;
    puVar14 = puVar14 + 1;
  }
  *(undefined2 *)puVar14 = *(undefined2 *)param_2;
  *(undefined1 *)((int)puVar14 + 2) = *(undefined1 *)((int)param_2 + 2);
  param_1[1] = uVar7;
  *param_1 = uVar8;
  *(undefined2 *)(param_1 + 9) = uVar3;
  *(undefined1 *)((int)param_1 + 0x2e) = uVar1;
  *(undefined2 *)(param_1 + 8) = uVar5;
  *(undefined1 *)(param_1 + 0xb) = uVar2;
  *(undefined2 *)((int)param_1 + 0x22) = uVar6;
  param_1[2] = 0;
  *(undefined4 *)((int)param_1 + 0x3d) = uVar9;
  *(undefined2 *)((int)param_1 + 0x41) = uVar4;
  if ((uVar10 & 1) == 0) {
    param_1[3] = param_1[3] & 0xfffffffe;
  }
  else {
    param_1[3] = param_1[3] | 1;
  }
  if ((uVar10 & 0x20000) == 0) {
    param_1[3] = param_1[3] & 0xfffdffff;
  }
  else {
    param_1[3] = param_1[3] | 0x20000;
  }
  if ((uVar11 & 0x20000000) == 0) {
    param_1[4] = param_1[4] & 0xdfffffff;
  }
  else {
    param_1[4] = param_1[4] | 0x20000000;
  }
  if ((uVar12 & 4) != 0) {
    param_1[5] = param_1[5] | 4;
    return;
  }
  param_1[5] = param_1[5] & 0xfffffffb;
  return;
}
