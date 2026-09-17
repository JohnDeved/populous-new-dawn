/* Ghidra 12.1.3 pseudocode; entry 004780e0; FUN_004780e0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


undefined1 FUN_004780e0(int param_1)

{
  byte bVar1;
  int iVar2;
  bool bVar3;
  char cVar4;
  int iVar5;
  int iVar6;
  undefined1 local_9;
  undefined4 local_8;

  local_9 = 0;
  if (((byte)game_state.offset_counter_2 & 3) == 0) {
    local_8 = 0;
    local_9 = 1;
    if (game_state.num_tribes != 0) {
      iVar6 = 0x89d1c8;
      do {
        cVar4 = FUN_00419480(local_8);
        if ((cVar4 == '\0') && ((*(byte *)(iVar6 + 0x93e) & 1) == 0)) {
          iVar5 = 0;
          iVar2 = *(int *)(iVar6 + 0x881);
          local_9 = 0;
          bVar1 = *(byte *)(local_8 + 0x7c + param_1);
          bVar3 = false;
          while ((iVar2 != 0 && (iVar5 < (int)(uint)bVar1))) {
            if (*(char *)(iVar2 + 0x2c) != '\'') {
              bVar3 = true;
              iVar5 = iVar5 + 1;
              if ((*(byte *)(iVar2 + 0xe) & 0x10) == 0) {
                *(char *)(iVar2 + 0x7d) = *(char *)(iVar2 + 0x2c);
                empty_unit_function(iVar2);
                *(undefined1 *)(iVar2 + 0x2c) = 0x27;
                init_unit_class(iVar2);
              }
            }
            iVar2 = *(int *)(iVar2 + 8);
          }
          if (!bVar3) {
            *(uint *)(iVar6 + 0x93d) = *(uint *)(iVar6 + 0x93d) | 0x100;
          }
        }
        iVar6 = iVar6 + 0xc65;
        local_8 = local_8 + 1;
      } while (local_8 < (int)(uint)game_state.num_tribes);
    }
  }
  return local_9;
}
