/* Ghidra 12.1.3 pseudocode; entry 004a6fd0; FUN_004a6fd0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_004a6fd0(int param_1)

{
  undefined4 *puVar1;
  byte bVar2;
  short sVar3;
  undefined4 uVar4;
  int iVar5;
  short sVar6;
  int iVar7;
  undefined2 local_a;
  undefined4 local_8;
  undefined2 local_4;

  puVar1 = (undefined4 *)(param_1 + 0x3d);
  uVar4 = FUN_0044f980(puVar1);
  if ((char)uVar4 == '\0') {
    bVar2 = *(byte *)(param_1 + 0x2b);
    iVar5 = CONCAT31((int3)((uint)uVar4 >> 8),bVar2);
    sVar6 = unit_type_array_scenery[bVar2].field6_0xc + *(short *)(param_1 + 0x41);
    *(short *)(param_1 + 0x41) = sVar6;
    if (bVar2 == 9) {
      iVar5 = *(byte *)(param_1 + 0x97) - 1;
      switch(iVar5) {
      case 0:
        iVar7 = -700;
        break;
      case 1:
        iVar7 = -600;
        break;
      case 2:
        iVar7 = -0x226;
        break;
      case 3:
        iVar7 = -0x226;
        break;
      default:
        iVar7 = -0x226;
      }
    }
    else {
      iVar7 = (int)unit_type_array_scenery[bVar2].field7_0xe;
    }
    sVar3 = calc_point_height(*(undefined2 *)puVar1,
                              CONCAT22((short)((uint)iVar5 >> 0x10),*(undefined2 *)(param_1 + 0x3f))
                             );
    if ((int)sVar6 <= sVar3 + iVar7) {
      FUN_004a6e20(param_1);
    }
    iVar7 = 0;
    iVar5 = -1;
    do {
      if (iVar5 != -1) goto LAB_004a710d;
      local_4 = *(undefined2 *)(param_1 + 0x41);
      local_8 = *puVar1;
      move_pos_angle_length(&local_8,CONCAT22((short)((uint)iVar7 >> 0x10),(short)iVar7 << 8),0x200)
      ;
      local_a = CONCAT11((char)((uint)local_8 >> 0x18),(char)((uint)local_8 >> 8));
      if ((*(byte *)(landscape_height_array +
                    ((&game_state.level_data[0].c_3)[((local_a & 0xfe) * 2 | local_a & 0xfe00) * 4]
                    & 0xf)) & 2) != 0) {
        iVar5 = iVar7;
      }
      iVar7 = iVar7 + 1;
    } while (iVar7 < 8);
    if (iVar5 != -1) {
LAB_004a710d:
      FUN_00503e60(CONCAT22((short)((uint)iVar5 >> 0x10),(short)iVar5 << 8),param_1 + 0x6c,
                   param_1 + 0x6e);
      return;
    }
  }
  else {
    *(byte *)(param_1 + 0x35) = *(byte *)(param_1 + 0x35) | 0x20;
    *(uint *)(param_1 + 0x14) = *(uint *)(param_1 + 0x14) & 0xffdfffff;
    if ((*(byte *)(param_1 + 0xe) & 0x10) == 0) {
      empty_unit_function(param_1);
      *(undefined1 *)(param_1 + 0x2c) = 1;
      init_unit_class(param_1);
    }
  }
  return;
}
