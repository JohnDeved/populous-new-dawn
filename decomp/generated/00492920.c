/* Ghidra 12.1.3 pseudocode; entry 00492920; FUN_00492920.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_00492920(undefined4 param_1,int param_2)

{
  ushort uVar1;
  int iVar2;
  ushort *puVar3;
  int iVar4;

  puVar3 = (ushort *)(*(int *)(param_2 + 0x3104) + 2);
  *(ushort **)(param_2 + 0x3104) = puVar3;
  iVar4 = get_tribe_data(param_1,param_2,(uint)*puVar3 * 8 + *(int *)(param_2 + 0x3100));
  iVar2 = *(int *)(param_2 + 0x3104);
  puVar3 = (ushort *)(iVar2 + 2);
  *(ushort **)(param_2 + 0x3104) = puVar3;
  uVar1 = *puVar3;
  *(int *)(param_2 + 0x3104) = iVar2 + 4;
  *(int *)(param_2 + 0x3000 + *(int *)(*(int *)(param_2 + 0x3100) + 4 + (uint)uVar1 * 8) * 4) =
       (int)(short)(&game_state.level_data[0].height)
                   [(((ushort)level_hdr_mem.pos_array[iVar4] & 0xfe) * 2 |
                    (ushort)level_hdr_mem.pos_array[iVar4] & 0xfe00) * 2];
  return;
}
