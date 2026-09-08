/* Ghidra 12.1.3 pseudocode; entry 004525d0; FUN_004525d0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


undefined1 * __thiscall FUN_004525d0(undefined1 *param_1,byte param_2)

{
  int iVar1;
  undefined1 uVar2;

  param_1[4] = param_2;
  iVar1 = (uint)param_2 * 4;
  param_1[2] = *(undefined1 *)(system_palette_mem + param_2);
  param_1[1] = *(undefined1 *)((int)system_palette_mem + iVar1 + 1);
  uVar2 = *(undefined1 *)((int)system_palette_mem + iVar1 + 2);
  param_1[3] = 0xff;
  *param_1 = uVar2;
  return param_1;
}
