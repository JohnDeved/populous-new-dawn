/* Ghidra 12.1.3 pseudocode; entry 00419880; process_tribe_1.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void process_tribe_1(int param_1)

{
  byte bVar1;
  int iVar2;
  short sVar3;
  int iVar4;
  undefined1 uVar5;
  undefined2 local_4;
  undefined2 local_2;

  iVar2 = *(int *)(param_1 + 0x89d);
  if (iVar2 == 0) {
    return;
  }
  sVar3 = FUN_00436c20();
  if (sVar3 == 0) {
    return;
  }
  FUN_00436ca0(iVar2);
  iVar4 = get_adjacent_unit(iVar2,0x13);
  if (iVar4 != 0) {
    if ((*(byte *)(iVar2 + 0xe) & 0x10) == 0) {
      *(undefined1 *)(iVar2 + 0x7d) = *(undefined1 *)(iVar2 + 0x2c);
      empty_unit_function(iVar2);
      *(undefined1 *)(iVar2 + 0x2c) = 0x2a;
      init_unit_class(iVar2);
    }
    *(uint *)(param_1 + 0x93d) = *(uint *)(param_1 + 0x93d) | 0x10000;
    FUN_0044ff80(param_1 + 0x911,0xffffffff,0);
    return;
  }
  local_4 = *(undefined2 *)(param_1 + 0x911);
  local_2 = *(undefined2 *)(param_1 + 0x913);
  FUN_00438730(sVar3,0x12,&local_4,0x20);
  FUN_00436d00(iVar2,sVar3,0);
  FUN_004e9b40(iVar2);
  if ((*(byte *)(iVar2 + 0xe) & 0x10) != 0) {
    return;
  }
  *(undefined1 *)(iVar2 + 0x7d) = *(undefined1 *)(iVar2 + 0x2c);
  if ((game_state.level_flags & 2) == 0) {
    bVar1 = *(byte *)(iVar2 + 0x2b);
  }
  else {
    bVar1 = *(byte *)(iVar2 + 0x2b);
    if (bVar1 == 7) {
      uVar5 = 0x27;
      goto LAB_00419945;
    }
  }
  uVar5 = unit_type_array_person[bVar1].next_state;
LAB_00419945:
  empty_unit_function(iVar2);
  *(undefined1 *)(iVar2 + 0x2c) = uVar5;
  init_unit_class(iVar2);
  return;
}
