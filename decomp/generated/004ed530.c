/* Ghidra 12.1.3 pseudocode; entry 004ed530; FUN_004ed530.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_004ed530(int *param_1)

{
  int *piVar1;

  piVar1 = param_1 + 1;
  if (*param_1 == 0) {
    DAT_00890330 = *piVar1;
  }
  else {
    *(int *)(*param_1 + 4) = *piVar1;
  }
  if ((int *)*piVar1 != (int *)0x0) {
    *(int *)*piVar1 = *param_1;
  }
  *param_1 = 0;
  *piVar1 = (int)DAT_0089032c;
  DAT_0089032c = param_1;
  if ((undefined4 *)*piVar1 != (undefined4 *)0x0) {
    *(undefined4 *)*piVar1 = param_1;
  }
  return;
}
