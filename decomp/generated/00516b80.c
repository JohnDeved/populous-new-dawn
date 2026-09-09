/* Ghidra 12.1.3 pseudocode; entry 00516b80; FUN_00516b80.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


/* WARNING: Unknown calling convention */

void FUN_00516b80(int param_1,uint *param_2,int param_3)

{
  int iVar1;

  iVar1 = param_1 + param_3 * 8;
  *param_2 = (uint)*(ushort *)(iVar1 + -0xfc);
  param_2[1] = (uint)*(ushort *)(iVar1 + -0xfa);
  return;
}
