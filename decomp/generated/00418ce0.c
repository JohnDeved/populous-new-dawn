/* Ghidra 12.1.3 pseudocode; entry 00418ce0; FUN_00418ce0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_00418ce0(int param_1,char param_2)

{
  byte bVar1;
  undefined1 uVar2;
  int iVar3;

  iVar3 = *(int *)(param_1 + 0x881);
  if (iVar3 != 0) {
    do {
      if (((uint)*(byte *)(iVar3 + 0x2c) == (int)param_2) &&
         (FUN_004e9b40(iVar3), (*(uint *)(iVar3 + 0xc) & 0x100000) == 0)) {
        *(undefined1 *)(iVar3 + 0x7d) = *(undefined1 *)(iVar3 + 0x2c);
        if ((game_state.level_flags & 2) == 0) {
          bVar1 = *(byte *)(iVar3 + 0x2b);
LAB_00418d44:
          uVar2 = unit_type_array_person[bVar1].next_state;
        }
        else {
          bVar1 = *(byte *)(iVar3 + 0x2b);
          if (bVar1 != 7) goto LAB_00418d44;
          uVar2 = 0x27;
        }
        empty_unit_function(iVar3);
        *(undefined1 *)(iVar3 + 0x2c) = uVar2;
        init_unit_class(iVar3);
      }
      iVar3 = *(int *)(iVar3 + 8);
    } while (iVar3 != 0);
  }
  return;
}
