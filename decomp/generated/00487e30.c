/* Ghidra 12.1.3 pseudocode; entry 00487e30; add_sprite_to_landscape_storage.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


int __thiscall
add_sprite_to_landscape_storage
          (int param_1,int param_2,undefined4 *param_3,undefined4 param_4,undefined4 param_5)

{
  int iVar1;
  undefined4 *puVar2;

  *(int *)(param_1 + 0x44) = *(int *)(param_1 + 0x44) + 1;
  iVar1 = add_sprite_to_storage_internal(param_2,param_4,param_5);
  if (iVar1 == 0) {
    puVar2 = (undefined4 *)(param_2 + 8);
    for (iVar1 = 7; iVar1 != 0; iVar1 = iVar1 + -1) {
      *param_3 = *puVar2;
      puVar2 = puVar2 + 1;
      param_3 = param_3 + 1;
    }
    iVar1 = 0;
  }
  return iVar1;
}
