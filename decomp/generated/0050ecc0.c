/* Ghidra 12.1.3 pseudocode; entry 0050ecc0; FUN_0050ecc0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_0050ecc0(int param_1,ushort param_2,undefined4 param_3,int param_4,int param_5)

{
  undefined4 uVar1;
  byte bVar2;
  ushort uVar3;
  short sVar4;
  uint uVar5;
  int iVar6;
  uint uVar7;
  undefined2 local_a;
  short local_8;
  short sStack_6;
  undefined2 local_4;

  local_a = param_2 & 0xfffe;
  uVar3 = local_a;
  uVar5 = (param_2 & 0xfe) * 2 | param_2 & 0xfe00;
  bVar2 = (byte)(local_a >> 8);
  local_a._1_1_ = bVar2 & 0xfe;
  local_8 = uVar3 << 8;
  uVar1 = CONCAT22(sStack_6,local_8);
  sStack_6 = (ushort)local_a._1_1_ << 8;
  local_4 = calc_point_height(uVar1,(uint)(CONCAT21(local_4,bVar2) & 0xfffffe) << 8);
  iVar6 = alloc_unit(7,3,param_3,&local_8);
  if (iVar6 != 0) {
    *(undefined2 *)(iVar6 + 0x6c) = 2;
  }
  if (param_5 < 0x5a) {
    param_5 = 0x5a;
  }
  iVar6 = (int)(short)(&game_state.level_data[0].height)[uVar5 * 2];
  uVar7 = param_5 - iVar6;
  if (DAT_005aa518 < (int)((uVar7 ^ (int)uVar7 >> 0x1f) - ((int)uVar7 >> 0x1f))) {
    if ((int)uVar7 < 1) {
      param_5 = iVar6 - DAT_005aa518;
    }
    else {
      param_5 = DAT_005aa518 + iVar6;
    }
  }
  if ((param_5 != iVar6) &&
     ((*(char *)(param_1 + 0x8e) != '\0' ||
      (1 < (short)(&game_state.level_data[0].height)[uVar5 * 2])))) {
    sVar4 = (short)((param_5 - iVar6) / (DAT_005aa5a8 - param_4)) +
            (&game_state.level_data[0].height)[uVar5 * 2];
    (&game_state.level_data[0].height)[uVar5 * 2] = sVar4;
    if (sVar4 < 0) {
      (&game_state.level_data[0].height)[uVar5 * 2] = 0;
    }
    if (0x400 < (short)(&game_state.level_data[0].height)[uVar5 * 2]) {
      (&game_state.level_data[0].height)[uVar5 * 2] = 0x400;
    }
    land_level_processing_1(param_2,2,1);
    FUN_0044f2f0(1,param_2,2,0xffffffff);
  }
  return;
}
