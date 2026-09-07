/* Ghidra 12.1.3 pseudocode; entry 00575420; FUN_00575420.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


undefined4 __fastcall FUN_00575420(int param_1)

{
  if (*(undefined4 **)(param_1 + 8) != (undefined4 *)0x0) {
    return **(undefined4 **)(param_1 + 8);
  }
  return 0xffffffff;
}
