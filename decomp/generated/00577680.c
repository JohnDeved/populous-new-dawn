/* Ghidra 12.1.3 pseudocode; entry 00577680; FUN_00577680.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


undefined4 * __thiscall FUN_00577680(undefined4 *param_1,int param_2)

{
  FUN_00577460();
  *param_1 = &PTR_FUN_00594798;
  param_1[0xe] = 0;
  param_1[0xd] = param_2 + 0x28;
  param_1[0xf] = *(undefined4 *)(param_2 + 4);
  *(undefined2 *)(param_1 + 0x10) = *(undefined2 *)(param_2 + 0x18);
  *(undefined1 *)((int)param_1 + 0x42) = *(undefined1 *)(param_2 + 0x1a);
  *(byte *)((int)param_1 + 0x43) = *(byte *)(param_2 + 0x1b) & 1;
  return param_1;
}
