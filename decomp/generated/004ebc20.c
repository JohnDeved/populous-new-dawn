/* Ghidra 12.1.3 pseudocode; entry 004ebc20; FUN_004ebc20.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_004ebc20(undefined4 *param_1,undefined4 *param_2)

{
  short sVar1;
  short local_30;
  short sStack_2e;
  undefined2 local_2c;
  short local_2a;
  short sStack_28;
  undefined2 local_26;
  short local_24;
  short sStack_22;
  undefined2 local_20;
  short local_1e;
  short sStack_1c;
  undefined2 local_1a;
  undefined1 local_18 [4];
  short local_14;
  short local_12 [3];
  undefined1 local_c [4];
  short local_8;
  short local_6 [3];

  local_2c = *(undefined2 *)(param_1 + 1);
  sStack_2e = (short)((uint)*param_1 >> 0x10);
  sVar1 = sStack_2e;
  local_30 = (short)*param_1;
  _local_30 = CONCAT22(sStack_2e + 0x4c,local_30);
  _local_2a = CONCAT22(sVar1,local_30 + 0x4c);
  _local_24 = CONCAT22(sVar1 + -0x4c,local_30);
  _local_1e = CONCAT22(sVar1,local_30 + -0x4c);
  local_26 = local_2c;
  local_20 = local_2c;
  local_1a = local_2c;
  FUN_004ebd10(&local_30,local_18);
  FUN_004ebd10(&local_2a,local_12);
  FUN_004ebd10(&local_24,local_c);
  FUN_004ebd10(&local_1e,local_6);
  *param_2 = 0;
  *(undefined2 *)(param_2 + 1) = 0;
  FUN_004ebd10(param_1,param_2);
  if ((local_12[0] < 0) && (0 < local_6[0])) {
    *(undefined2 *)param_2 = 0;
  }
  if ((local_14 < 0) && (0 < local_8)) {
    *(undefined2 *)(param_2 + 1) = 0;
  }
  return;
}
