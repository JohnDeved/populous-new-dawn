/* Ghidra 12.1.3 pseudocode; entry 00477780; FUN_00477780.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_00477780(char param_1)

{
  char cVar1;
  short sVar2;
  int iVar3;
  int iVar4;
  undefined4 local_4;

  if ((game_state._4_4_ & 2) != 0) {
    game_state._4_4_ = game_state._4_4_ & 0xfffffffd;
    level_flags_2 = level_flags_2 & 0xfdafffff;
    FUN_00479f00(8,0,0xffffffff);
    FUN_004af1c0(0x100);
    if (param_1 == '\0') {
      iVar4 = 0;
      iVar3 = 0x89d1c8;
      if (game_state.num_tribes != 0) {
        do {
          cVar1 = FUN_00419480(iVar4);
          if (cVar1 == '\0') {
            if (*(int *)(iVar3 + 0x89d) != 0) {
              sVar2 = FUN_00436c20();
              if (sVar2 != 0) {
                local_4._0_2_ = ((game_state.some_unit)->pos).x;
                local_4._2_2_ = ((game_state.some_unit)->pos).y;
                FUN_00438730(sVar2,3,&local_4,0);
                FUN_00436d00(*(undefined4 *)(iVar3 + 0x89d),sVar2,0);
              }
            }
            FUN_00418ce0(iVar3,0x27);
          }
          iVar4 = iVar4 + 1;
          iVar3 = iVar3 + 0xc65;
        } while (iVar4 < (int)(uint)game_state.num_tribes);
      }
    }
    if (game_state.some_unit != (unit_struct *)0x0) {
      FUN_004ef180(game_state.some_unit);
    }
  }
  game_state.some_unit = (unit_struct *)0x0;
  return;
}
