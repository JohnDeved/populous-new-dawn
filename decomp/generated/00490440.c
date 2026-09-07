/* Ghidra 12.1.3 pseudocode; entry 00490440; FUN_00490440.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_00490440(int param_1,int param_2)

{
  undefined4 uVar1;
  undefined4 *puVar2;
  undefined4 local_10 [4];

  *(int *)(param_2 + 0x3104) = *(int *)(param_2 + 0x3104) + 2;
  for (puVar2 = local_10; puVar2 < &stack0x00000000; puVar2 = puVar2 + 1) {
    uVar1 = get_tribe_data(param_1,param_2,
                           (uint)**(ushort **)(param_2 + 0x3104) * 8 + *(int *)(param_2 + 0x3100));
    *puVar2 = uVar1;
    *(int *)(param_2 + 0x3104) = *(int *)(param_2 + 0x3104) + 2;
  }
  FUN_004e6550(param_1,local_10[0],local_10[1],local_10[2],local_10[3],
               (*(uint *)(param_1 + 0x596) & 0x800) >> 0xb);
  *(uint *)(param_1 + 0x596) = *(uint *)(param_1 + 0x596) & 0xfffff7ff;
  return;
}
