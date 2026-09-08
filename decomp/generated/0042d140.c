/* Ghidra 12.1.3 pseudocode; entry 0042d140; tex_struct_set_code_ptr.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void __thiscall tex_struct_set_code_ptr(int param_1,undefined4 param_2,undefined4 param_3)

{
  *(undefined4 *)(param_1 + 0x20) = param_2;
  *(undefined4 *)(param_1 + 0x24) = param_3;
  return;
}
