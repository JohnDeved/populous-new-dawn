/* Ghidra 12.1.3 pseudocode; entry 004f55d0; FUN_004f55d0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


undefined4 FUN_004f55d0(int param_1)

{
  char cVar1;
  ushort uVar2;
  int iVar3;
  undefined4 uVar4;
  uint uVar5;
  undefined2 unaff_retaddr;
  undefined4 local_4;

  cVar1 = FUN_004df0e0(param_1);
  if ((cVar1 == '\0') || (*(char *)(param_1 + 0xaf) != '\0')) {
    uVar4 = 0;
  }
  else {
    cVar1 = *(char *)(param_1 + 0x2f);
    if (game_state.tribes_array[cVar1].field_0x5b4 == '\0') {
      uVar2 = game_state.tribes_array[cVar1].maybe_shaman_location;
    }
    else {
      uVar2 = game_state.tribes_array[cVar1].sub_struct_1[9].field16_0x14;
    }
    local_4 = (uint)uVar2 << 0x10;
    local_4 = CONCAT31(local_4._1_3_,(char)((ushort)*(undefined2 *)(param_1 + 0x3d) >> 8)) &
              0xfffffffe;
    uVar4 = CONCAT22(unaff_retaddr,local_4._2_2_);
    local_4 = CONCAT22(local_4._2_2_,
                       CONCAT11((char)((ushort)*(undefined2 *)(param_1 + 0x3f) >> 8),
                                (undefined1)local_4)) & 0xfffffeff;
    iVar3 = FUN_0049c720(uVar4,local_4);
    uVar5 = (uint)*(byte *)&game_state.tribes_array[cVar1].sub_struct_1[9].field17_0x16;
    uVar4 = 1;
    if ((int)(uVar5 * uVar5) < iVar3) {
      return 0;
    }
  }
  return uVar4;
}
