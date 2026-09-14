/* Ghidra 12.1.3 pseudocode; entry 004f5280; FUN_004f5280.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_004f5280(int param_1,undefined1 param_2,undefined1 param_3)

{
  undefined2 local_2;

  local_2 = CONCAT11(param_3,param_2);
  *(uint *)(param_1 + 0x596) = *(uint *)(param_1 + 0x596) | 0x20;
  *(undefined2 *)(param_1 + 0x5a4) = local_2;
  return;
}
