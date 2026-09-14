/* Ghidra 12.1.3 pseudocode; entry 004f3880; FUN_004f3880.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


int FUN_004f3880(int param_1,undefined4 param_2,int param_3)

{
  int iVar1;
  int iVar2;
  char cVar3;
  int iVar4;
  ushort local_8;
  undefined2 local_6;
  byte local_4;
  byte bStack_3;
  byte local_2;
  byte bStack_1;

  iVar4 = 0;
  if (param_3 != -1) {
    local_6 = (undefined2)param_3;
  }
  iVar2 = *(int *)(param_1 + 0x881);
  do {
    if (iVar2 == 0) {
      return iVar4;
    }
    cVar3 = FUN_004df1c0(iVar2);
    if (cVar3 != '\0') {
      iVar1 = (uint)*(ushort *)(iVar2 + 0x8b + (uint)*(byte *)(iVar2 + 0xa6) * 2) * 10;
      local_4 = (byte)param_2;
      bStack_3 = (byte)((uint)param_2 >> 8);
      if ((*(uint *)(&DAT_005a7dca +
                    (uint)*(byte *)((int)(game_state.sunlight_array + 0x32) + iVar1) * 0x16) & 0x800
          ) == 0) {
        if ((*(uint *)(&DAT_005a7dca +
                      (uint)*(byte *)((int)(game_state.sunlight_array + 0x32) + iVar1) * 0x16) & 1)
            != 0) {
          local_8 = CONCAT11((char)((ushort)*(undefined2 *)
                                             ((int)(game_state.sunlight_array + 0x32) + iVar1 + 8)
                                   >> 8),
                             (char)((ushort)*(undefined2 *)
                                             ((int)(game_state.sunlight_array + 0x32) + iVar1 + 6)
                                   >> 8)) & 0xfefe;
          bStack_1 = (byte)(local_8 >> 8);
          if ((((local_4 ^ (byte)local_8) & 0xfe) == 0) && (((bStack_3 ^ bStack_1) & 0xfe) == 0))
          goto LAB_004f39ae;
          if ((param_3 != -1) && ((((byte)local_6 ^ (byte)local_8) & 0xfe) == 0)) {
            bStack_3 = local_6._1_1_ ^ bStack_1;
            goto joined_r0x004f39ac;
          }
        }
      }
      else {
        local_2 = (byte)*(undefined2 *)((int)(game_state.sunlight_array + 0x32) + iVar1 + 6);
        if (((local_4 ^ local_2) & 0xfe) == 0) {
          bStack_1 = (byte)((ushort)*(undefined2 *)
                                     ((int)(game_state.sunlight_array + 0x32) + iVar1 + 6) >> 8);
          bStack_3 = bStack_3 ^ bStack_1;
joined_r0x004f39ac:
          if ((bStack_3 & 0xfe) == 0) {
LAB_004f39ae:
            iVar4 = iVar4 + 1;
          }
        }
      }
    }
    iVar2 = *(int *)(iVar2 + 8);
  } while( true );
}
