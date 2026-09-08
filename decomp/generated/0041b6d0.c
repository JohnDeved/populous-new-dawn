/* Ghidra 12.1.3 pseudocode; entry 0041b6d0; FUN_0041b6d0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_0041b6d0(void)

{
  bool bVar1;
  undefined2 extraout_var;

  if (DAT_0089bb77 != '\0') {
    switch(DAT_0089bb76) {
    case 0:
      if (DAT_0089bb75 != '\0') {
        DAT_0089bb75 = '\0';
        FUN_004af0a0(4);
        bVar1 = true;
        if (((DAT_0089bc17 != '\0') && (DAT_0089bb69 == DAT_0089bbff)) &&
           ((DAT_0089bb6b == DAT_0089bc01 && (cam_1_angle_related == DAT_0089bb71)))) {
          bVar1 = false;
        }
        if (bVar1) {
          DAT_0089bc17 = '\0';
          FUN_00417d80(&DAT_0089bb69,CONCAT22(extraout_var,DAT_0089bb71));
        }
        FUN_00448fa0();
        game_state._838943_1_ = game_state._838943_1_ & 0xfd;
        DAT_0089c6e3 = 0;
        game_state._838940_1_ = 0;
      }
      if (DAT_0089bc17 == '\0') {
        DAT_0089bb76 = 3;
      }
      break;
    case 1:
      if (DAT_0089bb75 == '\0') {
        DAT_0089bb75 = '\x01';
        DAT_0089bb76 = 2;
      }
      else if (DAT_0089d163 != '\0') {
        DAT_0089bb75 = DAT_0089bb75 + -1;
      }
      break;
    case 2:
      if (DAT_0089bb75 != '\0') {
        bVar1 = true;
        DAT_0089bb75 = '\0';
        if ((((DAT_0089bc17 != '\0') && (DAT_0089bb6d == DAT_0089bbff)) &&
            (DAT_0089bb6f == DAT_0089bc01)) && (DAT_0089bb73 == cam_1_angle_related)) {
          bVar1 = false;
        }
        if (bVar1) {
          DAT_0089bc17 = '\0';
          FUN_00417d80(&DAT_0089bb6d,DAT_0089bb73);
        }
        FUN_00448fa0();
        game_state._838943_1_ = game_state._838943_1_ & 0xfd;
        DAT_0089c6e3 = 0;
        game_state._838940_1_ = 0;
      }
      if (DAT_0089bc17 == '\0') {
        DAT_0089bb76 = 3;
      }
      break;
    case 3:
      FUN_004af1c0(4);
      DAT_0089bb77 = '\0';
    }
  }
  if ((sky_counter != 0) && (sky_counter = sky_counter - 1, (sky_counter & 0xf) == 0)) {
    FUN_0048a050(0,0xa2,1);
  }
  return;
}
