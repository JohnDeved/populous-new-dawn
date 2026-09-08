/* Ghidra 12.1.3 pseudocode; entry 00466190; FUN_00466190.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


undefined4 FUN_00466190(int param_1,undefined2 *param_2)

{
  uint *puVar1;
  ushort uVar2;
  char cVar3;
  ushort uVar4;
  ushort uVar5;
  short sVar6;
  uint uVar7;
  int iVar8;
  uint uVar9;
  undefined1 local_b;
  undefined2 local_a;
  undefined4 local_8;
  undefined2 local_4;

  local_b = 1;
  local_4 = *(undefined2 *)(param_1 + 0x41);
  puVar1 = (uint *)(param_1 + 0x3d);
  uVar9 = (uint)*(short *)(param_1 + 0x26);
  local_8 = *puVar1;
  local_a = CONCAT11((char)((ushort)*(undefined2 *)(param_1 + 0x3f) >> 8),(char)(local_8 >> 8));
  iVar8 = ((local_a & 0xfe) * 2 | local_a & 0xfe00) * 4;
  uVar2 = *(ushort *)&unit_type_array_vehicle[*(byte *)(param_1 + 0x2b)].field_0x15;
  if ((*(byte *)(landscape_height_array + ((&game_state.level_data[0].c_3)[iVar8] & 0xf)) & 0x3c) ==
      0) {
    move_pos_angle_length(&local_8,uVar9,(-(uint)((uVar2 & 1) == 0) & 0xfffffe00) + 0x400);
  }
  else {
    uVar4 = (ushort)local_8 & 0xfe00;
    local_8._2_2_ = (ushort)(local_8 >> 0x10);
    uVar5 = local_8._2_2_ & 0xfe00;
    sVar6 = uVar5 + 0x100;
    local_8 = CONCAT22(sVar6,uVar4 + 0x100);
    switch((int)(char)landscape_height_array[(&game_state.level_data[0].c_3)[iVar8] & 0xf].field_0x1
          ) {
    case 1:
      local_8 = CONCAT22(uVar5 - 0x80,uVar4 - 0x80);
      break;
    case 2:
      local_8 = CONCAT22(sVar6,uVar4 - 0x80);
      break;
    case 3:
      local_8 = CONCAT22(uVar5 + 0x280,uVar4 - 0x80);
      break;
    case 4:
      local_8 = CONCAT22(uVar5 + 0x280,uVar4 + 0x100);
      break;
    case 5:
      local_8 = CONCAT22(uVar5 + 0x280,uVar4 + 0x280);
      break;
    case 6:
      local_8 = CONCAT22(sVar6,uVar4 + 0x280);
      break;
    case 7:
      local_8 = CONCAT22(sVar6,uVar4 + 0x280);
    case 0:
      local_8 = CONCAT22(local_8._2_2_ + -0x180,(ushort)local_8);
    }
    uVar9 = ((int)(char)landscape_height_array[(&game_state.level_data[0].c_3)[iVar8] & 0xf].
                        field_0x1 + 4U & 7) << 8;
  }
  uVar7 = FUN_00518200(&local_8,1);
  if ((char)uVar7 != '\0') {
    iVar8 = 0;
    uVar7 = 0;
    do {
      if (uVar7 != 0) goto LAB_0046637d;
      local_4 = *(undefined2 *)(param_1 + 0x41);
      uVar9 = uVar9 + 0x100 & 0x7ff;
      local_8 = *puVar1;
      move_pos_angle_length(&local_8,uVar9,(-(uint)((uVar2 & 1) == 0) & 0xffffff00) + 0x400);
      cVar3 = FUN_00518200(&local_8,1);
      uVar7 = (uint)(cVar3 == '\0');
      iVar8 = iVar8 + 1;
    } while (iVar8 < 7);
    if (uVar7 == 0) {
      local_b = 0;
      uVar7 = *puVar1;
      local_8 = uVar7;
    }
  }
LAB_0046637d:
  *param_2 = (ushort)local_8;
  param_2[1] = local_8._2_2_;
  return CONCAT31((int3)(CONCAT22((short)(uVar7 >> 0x10),(ushort)local_8) >> 8),local_b);
}
