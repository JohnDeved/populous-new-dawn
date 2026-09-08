/* Ghidra 12.1.3 pseudocode; entry 0042d1f0; FUN_0042d1f0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void __thiscall FUN_0042d1f0(int param_1,undefined4 param_2,undefined4 param_3)

{
  int iVar1;
  undefined1 local_8 [4];
  undefined1 local_4 [4];

  iVar1 = tex_use_sqrt(param_2,param_3,local_8,local_4);
  if (iVar1 != 0) {
    *(undefined4 *)(param_1 + 0x3c) = param_2;
    *(undefined4 *)(param_1 + 0x40) = param_3;
    *(undefined4 *)(param_1 + 0x44) = *(undefined4 *)(param_1 + 0x18);
    *(undefined4 *)(param_1 + 0x48) = *(undefined4 *)(param_1 + 0x1c);
    *(undefined4 *)(param_1 + 0x4c) = 1;
    *(undefined4 *)(param_1 + 0x50) = 0;
    *(undefined4 *)(param_1 + 0x54) = 0;
  }
  return;
}
