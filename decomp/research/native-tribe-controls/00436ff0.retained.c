/* Ghidra 12.1.3 pseudocode; entry 00436ff0; FUN_00436ff0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_00436ff0(int param_1)

{
  int iVar1;
  undefined4 *puVar2;

  puVar2 = (undefined4 *)(param_1 + 0x8bf);
  for (iVar1 = 0x14; iVar1 != 0; iVar1 = iVar1 + -1) {
    *puVar2 = 0;
    puVar2 = puVar2 + 1;
  }
  *(undefined2 *)puVar2 = 0;
  return;
}
