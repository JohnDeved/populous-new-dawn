/* Ghidra 12.1.3 pseudocode; entry 0048cc60; interpret_script.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


undefined4 interpret_script(int param_1,int param_2)

{
  ushort uVar1;
  short sVar2;
  undefined1 uVar3;
  undefined2 uVar4;
  ushort *puVar5;
  undefined4 uVar6;
  undefined4 uVar7;
  byte bVar8;
  int iVar9;
  int iVar10;

  iVar10 = *(int *)(param_2 + 0x3104);
  *(ushort **)(param_2 + 0x3104) = (ushort *)(iVar10 + 2);
  uVar1 = *(ushort *)(iVar10 + 2);
  iVar9 = uVar1 - 0x404;
  switch(iVar9) {
  case 0:
  case 1:
  case 2:
  case 3:
  case 4:
  case 5:
  case 6:
  case 7:
  case 8:
  case 9:
  case 0xb:
  case 0xc:
  case 0xd:
  case 0xe:
  case 0xf:
  case 0x10:
  case 0x11:
  case 0x12:
  case 0x13:
  case 0x14:
  case 0x16:
  case 0x17:
    bVar8 = (char)uVar1 - 4;
    *(short **)(param_2 + 0x3104) = (short *)(iVar10 + 4);
    sVar2 = *(short *)(iVar10 + 4);
    if (sVar2 == 0x3fe) {
      *(uint *)(param_1 + 0x59a) = *(uint *)(param_1 + 0x59a) | 1 << (bVar8 & 0x1f);
    }
    else if (sVar2 == 0x3ff) {
      *(uint *)(param_1 + 0x59a) = *(uint *)(param_1 + 0x59a) & ~(1 << (bVar8 & 0x1f));
    }
    *(int *)(param_2 + 0x3104) = *(int *)(param_2 + 0x3104) + 2;
    return 1;
  case 10:
    FUN_00492c30(param_1,param_2);
    return 1;
  case 0x1f:
    FUN_0048fc50(param_1,param_2);
    return 1;
  case 0x24:
    FUN_00492b40(param_1,param_2);
    return 1;
  case 0x25:
    *(int *)(param_2 + 0x3104) = iVar10 + 4;
    FUN_004f52c0(param_1);
    return 1;
  case 0x26:
    *(ushort **)(param_2 + 0x3104) = (ushort *)(iVar10 + 4);
    uVar7 = get_tribe_data(param_1,param_2,
                           (uint)*(ushort *)(iVar10 + 4) * 8 + *(int *)(param_2 + 0x3100));
    *(int *)(param_2 + 0x3104) = *(int *)(param_2 + 0x3104) + 2;
    FUN_004f52d0(param_1,uVar7);
    return 1;
  case 0x27:
    *(ushort **)(param_2 + 0x3104) = (ushort *)(iVar10 + 4);
    uVar7 = get_tribe_data(param_1,param_2,
                           (uint)*(ushort *)(iVar10 + 4) * 8 + *(int *)(param_2 + 0x3100));
    *(int *)(param_2 + 0x3104) = *(int *)(param_2 + 0x3104) + 2;
    FUN_004f52f0(param_1,uVar7);
    return 1;
  case 0x28:
    FUN_00492680(param_1,param_2);
    return 1;
  case 0x29:
    *(ushort **)(param_2 + 0x3104) = (ushort *)(iVar10 + 4);
    uVar7 = get_tribe_data(param_1,param_2,
                           (uint)*(ushort *)(iVar10 + 4) * 8 + *(int *)(param_2 + 0x3100));
    puVar5 = (ushort *)(*(int *)(param_2 + 0x3104) + 2);
    *(ushort **)(param_2 + 0x3104) = puVar5;
    uVar6 = get_tribe_data(param_1,param_2,(uint)*puVar5 * 8 + *(int *)(param_2 + 0x3100));
    *(int *)(param_2 + 0x3104) = *(int *)(param_2 + 0x3104) + 2;
    FUN_004f5280(param_1,uVar7,uVar6);
    return 1;
  case 0x2d:
    *(ushort **)(param_2 + 0x3104) = (ushort *)(iVar10 + 4);
    uVar7 = get_tribe_data(param_1,param_2,
                           (uint)*(ushort *)(iVar10 + 4) * 8 + *(int *)(param_2 + 0x3100));
    *(int *)(param_2 + 0x3104) = *(int *)(param_2 + 0x3104) + 2;
    FUN_004f44b0(param_1,uVar7);
    return 1;
  case 0x2e:
    *(ushort **)(param_2 + 0x3104) = (ushort *)(iVar10 + 4);
    uVar7 = get_tribe_data(param_1,param_2,
                           (uint)*(ushort *)(iVar10 + 4) * 8 + *(int *)(param_2 + 0x3100));
    *(int *)(param_2 + 0x3104) = *(int *)(param_2 + 0x3104) + 2;
    FUN_004f4520(param_1,uVar7);
    return 1;
  case 0x2f:
    *(ushort **)(param_2 + 0x3104) = (ushort *)(iVar10 + 4);
    uVar7 = get_tribe_data(param_1,param_2,
                           (uint)*(ushort *)(iVar10 + 4) * 8 + *(int *)(param_2 + 0x3100));
    *(int *)(param_2 + 0x3104) = *(int *)(param_2 + 0x3104) + 2;
    FUN_004f44d0(param_1,uVar7);
    return 1;
  case 0x30:
    FUN_00492790(param_1,param_2);
    return 1;
  case 0x31:
    FUN_00492860(param_1,param_2);
    return 1;
  case 0x35:
    *(int *)(param_2 + 0x3104) = iVar10 + 4;
    uVar1 = *(ushort *)(iVar10 + 4);
    *(int *)(param_2 + 0x3104) = iVar10 + 6;
    *(short *)(param_1 + 0x5a8) =
         (short)*(undefined4 *)(*(int *)(param_2 + 0x3100) + 4 + (uint)uVar1 * 8);
    return 1;
  case 0x36:
    *(ushort **)(param_2 + 0x3104) = (ushort *)(iVar10 + 4);
    uVar7 = get_tribe_data(param_1,param_2,
                           (uint)*(ushort *)(iVar10 + 4) * 8 + *(int *)(param_2 + 0x3100));
    puVar5 = (ushort *)(*(int *)(param_2 + 0x3104) + 2);
    *(ushort **)(param_2 + 0x3104) = puVar5;
    uVar6 = get_tribe_data(param_1,param_2,(uint)*puVar5 * 8 + *(int *)(param_2 + 0x3100));
    *(int *)(param_2 + 0x3104) = *(int *)(param_2 + 0x3104) + 2;
    FUN_004e5530(param_1,uVar7,uVar6);
    return 1;
  case 0x37:
    FUN_004929c0(param_1,param_2,1);
    return 1;
  case 0x38:
    FUN_004929c0(param_1,param_2,2);
    return 1;
  case 0x39:
    FUN_00492920(param_1,param_2);
    return 1;
  case 0x3a:
    *(ushort **)(param_2 + 0x3104) = (ushort *)(iVar10 + 4);
    uVar7 = get_tribe_data(param_1,param_2,
                           (uint)*(ushort *)(iVar10 + 4) * 8 + *(int *)(param_2 + 0x3100));
    *(int *)(param_2 + 0x3104) = *(int *)(param_2 + 0x3104) + 2;
    FUN_004e6440(param_1,uVar7);
    return 1;
  case 0x3d:
    *(int *)(param_2 + 0x3104) = iVar10 + 4;
    return 1;
  case 0x3e:
    *(ushort **)(param_2 + 0x3104) = (ushort *)(iVar10 + 4);
    get_tribe_data(param_1,param_2,(uint)*(ushort *)(iVar10 + 4) * 8 + *(int *)(param_2 + 0x3100));
    *(int *)(param_2 + 0x3104) = *(int *)(param_2 + 0x3104) + 2;
    return 1;
  case 0x3f:
    FUN_0048ff60(param_1,param_2);
    return 1;
  case 0x40:
    FUN_00490440(param_1,param_2);
    return 1;
  case 0x41:
    FUN_00492090(param_1,param_2);
    return 1;
  case 0x42:
    *(ushort **)(param_2 + 0x3104) = (ushort *)(iVar10 + 4);
    uVar7 = get_tribe_data(param_1,param_2,
                           (uint)*(ushort *)(iVar10 + 4) * 8 + *(int *)(param_2 + 0x3100));
    *(int *)(param_2 + 0x3104) = *(int *)(param_2 + 0x3104) + 2;
    FUN_004f3db0(param_1,uVar7);
    return 1;
  case 0x43:
    *(ushort **)(param_2 + 0x3104) = (ushort *)(iVar10 + 4);
    uVar7 = get_tribe_data(param_1,param_2,
                           (uint)*(ushort *)(iVar10 + 4) * 8 + *(int *)(param_2 + 0x3100));
    puVar5 = (ushort *)(*(int *)(param_2 + 0x3104) + 2);
    *(ushort **)(param_2 + 0x3104) = puVar5;
    uVar6 = get_tribe_data(param_1,param_2,(uint)*puVar5 * 8 + *(int *)(param_2 + 0x3100));
    *(int *)(param_2 + 0x3104) = *(int *)(param_2 + 0x3104) + 2;
    FUN_004e6640(param_1,uVar7,uVar6);
    return 1;
  case 0x44:
    *(ushort **)(param_2 + 0x3104) = (ushort *)(iVar10 + 4);
    uVar7 = get_tribe_data(param_1,param_2,
                           (uint)*(ushort *)(iVar10 + 4) * 8 + *(int *)(param_2 + 0x3100));
    puVar5 = (ushort *)(*(int *)(param_2 + 0x3104) + 2);
    *(ushort **)(param_2 + 0x3104) = puVar5;
    uVar6 = get_tribe_data(param_1,param_2,(uint)*puVar5 * 8 + *(int *)(param_2 + 0x3100));
    *(int *)(param_2 + 0x3104) = *(int *)(param_2 + 0x3104) + 2;
    FUN_004e66e0(param_1,uVar7,uVar6);
    return 1;
  case 0x45:
    place_drum_tower(param_1,param_2);
    return 1;
  case 0x46:
    FUN_00492500(param_1,param_2);
    return 1;
  case 0x49:
    FUN_004923b0(param_1,param_2);
    return 1;
  case 0x4a:
    *(ushort **)(param_2 + 0x3104) = (ushort *)(iVar10 + 4);
    uVar7 = get_tribe_data(param_1,param_2,
                           (uint)*(ushort *)(iVar10 + 4) * 8 + *(int *)(param_2 + 0x3100));
    *(int *)(param_2 + 0x3104) = *(int *)(param_2 + 0x3104) + 2;
    FUN_004e68e0(param_1,uVar7);
    return 1;
  case 0x4b:
    *(int *)(param_2 + 0x3104) = iVar10 + 4;
    FUN_004f3280(param_1);
    return 1;
  case 0x4e:
    FUN_00492240(param_1,param_2);
    return 1;
  case 0x4f:
    FUN_00492160(param_1,param_2);
    return 1;
  case 0x50:
    FUN_004902e0(param_1,param_2);
    return 1;
  case 0x51:
    *(int *)(param_2 + 0x3104) = iVar10 + 4;
    FUN_004f2e30(param_1);
    return 1;
  case 0x52:
    *(int *)(param_2 + 0x3104) = iVar10 + 4;
    FUN_004f2e20(param_1);
    return 1;
  case 0x53:
    FUN_004901e0(param_1,param_2);
    return 1;
  case 0x54:
    *(int *)(param_2 + 0x3104) = iVar10 + 4;
    if ((level_flags_1 & 0x1000000) == 0) {
      level_flags_1 = level_flags_1 | 0x20000000;
      FUN_004af0a0(0x80);
      return 1;
    }
    break;
  case 0x55:
    *(int *)(param_2 + 0x3104) = iVar10 + 4;
    if ((level_flags_1 & 0x1000000) == 0) {
      level_flags_1 = level_flags_1 & 0xdfffffff;
      FUN_004af1c0(0x80);
      return 1;
    }
    break;
  case 0x56:
    *(ushort **)(param_2 + 0x3104) = (ushort *)(iVar10 + 4);
    iVar9 = get_tribe_data(param_1,param_2,
                           (uint)*(ushort *)(iVar10 + 4) * 8 + *(int *)(param_2 + 0x3100));
    *(int *)(param_2 + 0x3104) = *(int *)(param_2 + 0x3104) + 2;
    if ((level_flags_1 & 0x1000000) == 0) {
      FUN_004af440(0,*(undefined2 *)(&DAT_005ae310 + iVar9 * 2));
      return 1;
    }
    break;
  case 0x57:
    FUN_00490150(param_1,param_2);
    return 1;
  case 0x58:
    *(int *)(param_2 + 0x3104) = iVar10 + 4;
    FUN_004f2520(param_1,99);
    return 1;
  case 0x59:
    *(int *)(param_2 + 0x3104) = iVar10 + 4;
    *(uint *)(param_1 + 0x596) = *(uint *)(param_1 + 0x596) | 0x800;
    return 1;
  case 0x5e:
    FUN_00491db0(param_1,param_2);
    return 1;
  case 0x5f:
    *(int *)(param_2 + 0x3104) = iVar10 + 4;
    FUN_004f2a60(param_1);
    return 1;
  case 0x60:
    *(int *)(param_2 + 0x3104) = iVar10 + 4;
    FUN_004f2a70(param_1);
    return 1;
  case 0x61:
    *(int *)(param_2 + 0x3104) = iVar10 + 4;
    FUN_004f2a80(param_1);
    return 1;
  case 0x62:
    *(int *)(param_2 + 0x3104) = iVar10 + 4;
    FUN_004f2a90(param_1);
    return 1;
  case 99:
    *(int *)(param_2 + 0x3104) = iVar10 + 4;
    FUN_004f2aa0(param_1);
    return 1;
  case 100:
    *(int *)(param_2 + 0x3104) = iVar10 + 4;
    FUN_004f2ab0(param_1);
    return 1;
  case 0x65:
    iVar9 = *(int *)(param_2 + 0x3100);
    *(ushort **)(param_2 + 0x3104) = (ushort *)(iVar10 + 4);
    uVar1 = *(ushort *)(iVar10 + 4);
    *(int *)(param_2 + 0x3104) = iVar10 + 6;
    uVar7 = FUN_004f2a40();
    *(undefined4 *)(param_2 + 0x3000 + *(int *)(iVar9 + 4 + (uint)uVar1 * 8) * 4) = uVar7;
    return 1;
  case 0x66:
    FUN_00491cd0(param_1,param_2);
    return 1;
  case 0x67:
    FUN_00491c30(param_1,param_2);
    return 1;
  case 0x68:
    *(ushort **)(param_2 + 0x3104) = (ushort *)(iVar10 + 4);
    uVar7 = get_tribe_data(param_1,param_2,
                           (uint)*(ushort *)(iVar10 + 4) * 8 + *(int *)(param_2 + 0x3100));
    *(int *)(param_2 + 0x3104) = *(int *)(param_2 + 0x3104) + 2;
    if ((level_flags_1 & 0x1000000) == 0) {
      FUN_004f2890(0x89d1c8,uVar7);
      return 1;
    }
    break;
  case 0x69:
    FUN_00491b60(param_1,param_2);
    return 1;
  case 0x6a:
    FUN_00491a90(param_1,param_2);
    return 1;
  case 0x6b:
    iVar9 = *(int *)(param_2 + 0x3100);
    *(ushort **)(param_2 + 0x3104) = (ushort *)(iVar10 + 4);
    uVar1 = *(ushort *)(iVar10 + 4);
    *(int *)(param_2 + 0x3104) = iVar10 + 6;
    uVar7 = FUN_004f2840(param_1);
    *(undefined4 *)(param_2 + 0x3000 + *(int *)(iVar9 + 4 + (uint)uVar1 * 8) * 4) = uVar7;
    return 1;
  case 0x6c:
    *(int *)(param_2 + 0x3104) = iVar10 + 4;
    *(uint *)(param_1 + 0x596) = *(uint *)(param_1 + 0x596) | 0x10000;
    return 1;
  case 0x6d:
    *(ushort **)(param_2 + 0x3104) = (ushort *)(iVar10 + 4);
    uVar7 = get_tribe_data(param_1,param_2,
                           (uint)*(ushort *)(iVar10 + 4) * 8 + *(int *)(param_2 + 0x3100));
    *(int *)(param_2 + 0x3104) = *(int *)(param_2 + 0x3104) + 2;
    FUN_004f27c0(0x89d1c8,uVar7);
    return 1;
  case 0x6e:
    FUN_004919e0(param_1,param_2);
    return 1;
  case 0x6f:
    *(ushort **)(param_2 + 0x3104) = (ushort *)(iVar10 + 4);
    uVar1 = *(ushort *)(iVar10 + 4);
    *(int *)(param_2 + 0x3104) = iVar10 + 6;
    *(uint *)(param_2 + 0x3000 + *(int *)(*(int *)(param_2 + 0x3100) + 4 + (uint)uVar1 * 8) * 4) =
         (uint)(draw_mode == 2);
    return 1;
  case 0x70:
    *(short **)(param_2 + 0x3104) = (short *)(iVar10 + 4);
    sVar2 = *(short *)(iVar10 + 4);
    if (sVar2 == 0x3fe) {
      game_state._4_4_ = game_state._4_4_ & 0xfffffffb;
    }
    else if (sVar2 == 0x3ff) {
      game_state._4_4_ = game_state._4_4_ | 4;
    }
    *(int *)(param_2 + 0x3104) = *(int *)(param_2 + 0x3104) + 2;
    return 1;
  case 0x71:
    *(int *)(param_2 + 0x3104) = iVar10 + 4;
    FUN_004f27a0();
    return 1;
  case 0x72:
    FUN_00491810(param_1,param_2);
    return 1;
  case 0x73:
    *(ushort **)(param_2 + 0x3104) = (ushort *)(iVar10 + 4);
    uVar7 = get_tribe_data(param_1,param_2,
                           (uint)*(ushort *)(iVar10 + 4) * 8 + *(int *)(param_2 + 0x3100));
    *(int *)(param_2 + 0x3104) = *(int *)(param_2 + 0x3104) + 2;
    FUN_00492d20(uVar7);
    return 1;
  case 0x74:
    FUN_004916f0(param_1,param_2);
    return 1;
  case 0x75:
    *(ushort **)(param_2 + 0x3104) = (ushort *)(iVar10 + 4);
    uVar1 = *(ushort *)(iVar10 + 4);
    *(int *)(param_2 + 0x3104) = iVar10 + 6;
    *(uint *)(param_2 + 0x3000 + *(int *)(*(int *)(param_2 + 0x3100) + 4 + (uint)uVar1 * 8) * 4) =
         (game_state.tribes_array[0]._2365_4_ & 0x400) >> 10;
    return 1;
  case 0x76:
    *(ushort **)(param_2 + 0x3104) = (ushort *)(iVar10 + 4);
    uVar1 = *(ushort *)(iVar10 + 4);
    *(int *)(param_2 + 0x3104) = iVar10 + 6;
    iVar10 = (uint)uVar1 * 8 + *(int *)(param_2 + 0x3100);
    iVar9 = tribe_get_shaman(0x89d1c8);
    if (iVar9 != 0) {
      *(uint *)(param_2 + 0x3000 + *(int *)(iVar10 + 4) * 4) =
           (uint)((*(byte *)(iVar9 + 0x7a) & 0x80) != 0);
      return 1;
    }
    *(undefined4 *)(param_2 + 0x3000 + *(int *)(iVar10 + 4) * 4) = 0;
    return 1;
  case 0x77:
    *(int *)(param_2 + 0x3104) = iVar10 + 4;
    game_state.tribes_array[0]._2365_4_ = game_state.tribes_array[0]._2365_4_ & 0xfffff7ff;
    return 1;
  case 0x78:
    *(int *)(param_2 + 0x3104) = iVar10 + 4;
    game_state.tribes_array[0]._2365_4_ = game_state.tribes_array[0]._2365_4_ & 0xffffefff;
    return 1;
  case 0x79:
    *(ushort **)(param_2 + 0x3104) = (ushort *)(iVar10 + 4);
    uVar1 = *(ushort *)(iVar10 + 4);
    *(int *)(param_2 + 0x3104) = iVar10 + 6;
    *(uint *)(param_2 + 0x3000 + *(int *)(*(int *)(param_2 + 0x3100) + 4 + (uint)uVar1 * 8) * 4) =
         (game_state.tribes_array[0]._2365_4_ & 0x800) >> 0xb;
    return 1;
  case 0x7a:
    *(ushort **)(param_2 + 0x3104) = (ushort *)(iVar10 + 4);
    uVar1 = *(ushort *)(iVar10 + 4);
    *(int *)(param_2 + 0x3104) = iVar10 + 6;
    *(uint *)(param_2 + 0x3000 + *(int *)(*(int *)(param_2 + 0x3100) + 4 + (uint)uVar1 * 8) * 4) =
         (game_state.tribes_array[0]._2365_4_ & 0x1000) >> 0xc;
    return 1;
  case 0x7b:
    *(ushort **)(param_2 + 0x3104) = (ushort *)(iVar10 + 4);
    iVar9 = get_tribe_data(param_1,param_2,
                           (uint)*(ushort *)(iVar10 + 4) * 8 + *(int *)(param_2 + 0x3100));
    *(int *)(param_2 + 0x3104) = *(int *)(param_2 + 0x3104) + 2;
    FUN_004fbf40(level_hdr_mem.pos_array[iVar9]);
    return 1;
  case 0x7c:
    FUN_004904d0(param_1,param_2);
    return 1;
  case 0x7d:
    *(ushort **)(param_2 + 0x3104) = (ushort *)(iVar10 + 4);
    uVar7 = get_tribe_data(param_1,param_2,
                           (uint)*(ushort *)(iVar10 + 4) * 8 + *(int *)(param_2 + 0x3100));
    *(int *)(param_2 + 0x3104) = *(int *)(param_2 + 0x3104) + 2;
    if ((level_flags_1 & 0x1000000) == 0) {
      FUN_00417c00(uVar7);
      return 1;
    }
    break;
  case 0x7e:
    *(int *)(param_2 + 0x3104) = iVar10 + 4;
    if ((level_flags_1 & 0x1000000) == 0) {
      FUN_00417c00(0);
      return 1;
    }
    break;
  case 0x7f:
    iVar9 = *(int *)(param_2 + 0x3100);
    *(int *)(param_2 + 0x3104) = iVar10 + 4;
    uVar1 = *(ushort *)(iVar10 + 4);
    *(int *)(param_2 + 0x3104) = iVar10 + 6;
    uVar7 = FUN_004f2720(0x89d1c8);
    *(undefined4 *)(param_2 + 0x3000 + *(int *)(iVar9 + 4 + (uint)uVar1 * 8) * 4) = uVar7;
    return 1;
  case 0x80:
    iVar9 = *(int *)(param_2 + 0x3100);
    *(int *)(param_2 + 0x3104) = iVar10 + 4;
    uVar1 = *(ushort *)(iVar10 + 4);
    *(int *)(param_2 + 0x3104) = iVar10 + 6;
    uVar7 = FUN_004f2670(0x89d1c8);
    *(undefined4 *)(param_2 + 0x3000 + *(int *)(iVar9 + 4 + (uint)uVar1 * 8) * 4) = uVar7;
    return 1;
  case 0x81:
    *(ushort **)(param_2 + 0x3104) = (ushort *)(iVar10 + 4);
    uVar1 = *(ushort *)(iVar10 + 4);
    *(int *)(param_2 + 0x3104) = iVar10 + 6;
    *(uint *)(param_2 + 0x3000 + *(int *)(*(int *)(param_2 + 0x3100) + 4 + (uint)uVar1 * 8) * 4) =
         (game_state.tribes_array[0]._2365_4_ & 0x2000) >> 0xd;
    return 1;
  case 0x82:
    *(int *)(param_2 + 0x3104) = iVar10 + 4;
    game_state.tribes_array[0]._2365_4_ = game_state.tribes_array[0]._2365_4_ & 0xffffdfff;
    return 1;
  case 0x83:
    *(short **)(param_2 + 0x3104) = (short *)(iVar10 + 4);
    sVar2 = *(short *)(iVar10 + 4);
    if (sVar2 == 0x3fe) {
      game_state._4_4_ = game_state._4_4_ & 0xfffffff7;
    }
    else if (sVar2 == 0x3ff) {
      game_state._4_4_ = game_state._4_4_ | 8;
    }
    *(int *)(param_2 + 0x3104) = *(int *)(param_2 + 0x3104) + 2;
    return 1;
  case 0x84:
    iVar9 = *(int *)(param_2 + 0x3100);
    *(int *)(param_2 + 0x3104) = iVar10 + 4;
    uVar1 = *(ushort *)(iVar10 + 4);
    *(int *)(param_2 + 0x3104) = iVar10 + 6;
    uVar7 = FUN_004f25f0(0x89d1c8);
    *(undefined4 *)(param_2 + 0x3000 + *(int *)(iVar9 + 4 + (uint)uVar1 * 8) * 4) = uVar7;
    return 1;
  case 0x85:
    *(short **)(param_2 + 0x3104) = (short *)(iVar10 + 4);
    sVar2 = *(short *)(iVar10 + 4);
    if (sVar2 == 0x3fe) {
      game_state._4_4_ = game_state._4_4_ | 0x10;
    }
    else if (sVar2 == 0x3ff) {
      game_state._4_4_ = game_state._4_4_ & 0xffffffef;
    }
    *(int *)(param_2 + 0x3104) = *(int *)(param_2 + 0x3104) + 2;
    return 1;
  case 0x86:
    FUN_00491690(param_1,param_2);
    return 1;
  case 0x87:
    FUN_00491570(param_1,param_2);
    return 1;
  case 0x88:
    *(short **)(param_2 + 0x3104) = (short *)(iVar10 + 4);
    sVar2 = *(short *)(iVar10 + 4);
    if (sVar2 == 0x3fe) {
      *(uint *)(param_1 + 0x93d) = *(uint *)(param_1 + 0x93d) & 0xfffeffff;
    }
    else if (sVar2 == 0x3ff) {
      *(uint *)(param_1 + 0x93d) = *(uint *)(param_1 + 0x93d) | 0x10000;
      FUN_0044ff80(param_1 + 0x911,0xffffffff,0);
    }
    *(int *)(param_2 + 0x3104) = *(int *)(param_2 + 0x3104) + 2;
    return 1;
  case 0x89:
    *(short **)(param_2 + 0x3104) = (short *)(iVar10 + 4);
    sVar2 = *(short *)(iVar10 + 4);
    if (sVar2 == 0x3fe) {
      FUN_004f2270(param_1);
    }
    else if (sVar2 == 0x3ff) {
      FUN_004f2280(param_1);
    }
    *(int *)(param_2 + 0x3104) = *(int *)(param_2 + 0x3104) + 2;
    return 1;
  case 0x8a:
    FUN_00491490(param_1,param_2);
    return 1;
  case 0x8b:
    FUN_00490fa0(param_1,param_2);
    return 1;
  case 0x8c:
    FUN_004913f0(param_1,param_2);
    return 1;
  case 0x8d:
    *(int *)(param_2 + 0x3104) = iVar10 + 4;
    FUN_0049a1f0();
    return 1;
  case 0x8e:
    *(int *)(param_2 + 0x3104) = iVar10 + 4;
    FUN_0049a1c0();
    return 1;
  case 0x8f:
    *(ushort **)(param_2 + 0x3104) = (ushort *)(iVar10 + 4);
    uVar7 = get_tribe_data(param_1,param_2,
                           (uint)*(ushort *)(iVar10 + 4) * 8 + *(int *)(param_2 + 0x3100));
    puVar5 = (ushort *)(*(int *)(param_2 + 0x3104) + 2);
    *(ushort **)(param_2 + 0x3104) = puVar5;
    uVar6 = get_tribe_data(param_1,param_2,(uint)*puVar5 * 8 + *(int *)(param_2 + 0x3100));
    *(int *)(param_2 + 0x3104) = *(int *)(param_2 + 0x3104) + 2;
    FUN_004f2160(uVar7,uVar6);
    return 1;
  case 0x90:
    *(short **)(param_2 + 0x3104) = (short *)(iVar10 + 4);
    sVar2 = *(short *)(iVar10 + 4);
    if (sVar2 == 0x3fe) {
      FUN_004f20e0(param_1);
    }
    else if (sVar2 == 0x3ff) {
      FUN_004f20f0(param_1);
    }
    *(int *)(param_2 + 0x3104) = *(int *)(param_2 + 0x3104) + 2;
    return 1;
  case 0x91:
    *(ushort **)(param_2 + 0x3104) = (ushort *)(iVar10 + 4);
    iVar9 = get_tribe_data(param_1,param_2,
                           (uint)*(ushort *)(iVar10 + 4) * 8 + *(int *)(param_2 + 0x3100));
    puVar5 = (ushort *)(*(int *)(param_2 + 0x3104) + 2);
    *(ushort **)(param_2 + 0x3104) = puVar5;
    uVar3 = get_tribe_data(param_1,param_2,(uint)*puVar5 * 8 + *(int *)(param_2 + 0x3100));
    *(int *)(param_2 + 0x3104) = *(int *)(param_2 + 0x3104) + 2;
    *(undefined1 *)(param_1 + 0x53f + iVar9 * 4) = uVar3;
    return 1;
  case 0x92:
    *(ushort **)(param_2 + 0x3104) = (ushort *)(iVar10 + 4);
    iVar9 = get_tribe_data(param_1,param_2,
                           (uint)*(ushort *)(iVar10 + 4) * 8 + *(int *)(param_2 + 0x3100));
    *(int *)(param_2 + 0x3104) = *(int *)(param_2 + 0x3104) + 2;
    if ((level_flags_1 & 0x1000000) == 0) {
      FUN_0048ea80(*(undefined2 *)(&DAT_005ae310 + iVar9 * 2));
      return 1;
    }
    break;
  case 0x93:
    *(ushort **)(param_2 + 0x3104) = (ushort *)(iVar10 + 4);
    iVar9 = get_tribe_data(param_1,param_2,
                           (uint)*(ushort *)(iVar10 + 4) * 8 + *(int *)(param_2 + 0x3100));
    *(int *)(param_2 + 0x3104) = *(int *)(param_2 + 0x3104) + 2;
    if ((level_flags_1 & 0x1000000) == 0) {
      FUN_0048eab0(*(undefined2 *)(&DAT_005ae310 + iVar9 * 2));
      return 1;
    }
    break;
  case 0x94:
    *(ushort **)(param_2 + 0x3104) = (ushort *)(iVar10 + 4);
    iVar9 = get_tribe_data(param_1,param_2,
                           (uint)*(ushort *)(iVar10 + 4) * 8 + *(int *)(param_2 + 0x3100));
    *(int *)(param_2 + 0x3104) = *(int *)(param_2 + 0x3104) + 2;
    if ((level_flags_1 & 0x1000000) == 0) {
      FUN_0048eae0(*(undefined2 *)(&DAT_005ae310 + iVar9 * 2));
      return 1;
    }
    break;
  case 0x95:
    FUN_00491040(param_1,param_2);
    return 1;
  case 0x96:
    FUN_00491240(param_1,param_2);
    return 1;
  case 0x97:
    *(ushort **)(param_2 + 0x3104) = (ushort *)(iVar10 + 4);
    uVar7 = get_tribe_data(param_1,param_2,
                           (uint)*(ushort *)(iVar10 + 4) * 8 + *(int *)(param_2 + 0x3100));
    *(int *)(param_2 + 0x3104) = *(int *)(param_2 + 0x3104) + 2;
    if (((level_flags_1 & 0x1000000) == 0) && (DAT_006841e7 != -1)) {
      FUN_00430f30(DAT_006841e7,uVar7);
      return 1;
    }
    break;
  case 0x98:
    *(int *)(param_2 + 0x3104) = iVar10 + 4;
    if ((level_flags_1 & 0x1000000) == 0) {
      FUN_0048eb10(1);
      return 1;
    }
    break;
  case 0x99:
    *(int *)(param_2 + 0x3104) = iVar10 + 4;
    if ((level_flags_1 & 0x1000000) == 0) {
      FUN_0048eb50(1);
      return 1;
    }
    break;
  case 0x9a:
    *(int *)(param_2 + 0x3104) = iVar10 + 4;
    if ((level_flags_1 & 0x1000000) == 0) {
      FUN_0048eb90(1);
      return 1;
    }
    break;
  case 0x9b:
    *(int *)(param_2 + 0x3104) = iVar10 + 4;
    if ((level_flags_1 & 0x1000000) == 0) {
      FUN_0048ebd0(1);
      return 1;
    }
    break;
  case 0x9c:
    *(int *)(param_2 + 0x3104) = iVar10 + 4;
    if ((level_flags_1 & 0x1000000) == 0) {
      FUN_0048ec10(1);
      return 1;
    }
    break;
  case 0x9d:
    *(int *)(param_2 + 0x3104) = iVar10 + 4;
    if ((level_flags_1 & 0x1000000) == 0) {
      FUN_0048ec50(1);
      return 1;
    }
    break;
  case 0x9e:
    *(int *)(param_2 + 0x3104) = iVar10 + 4;
    if ((level_flags_1 & 0x1000000) == 0) {
      FUN_0048ec90(1);
      return 1;
    }
    break;
  case 0x9f:
    *(int *)(param_2 + 0x3104) = iVar10 + 4;
    if ((level_flags_1 & 0x1000000) == 0) {
      FUN_0048ecd0(1);
      return 1;
    }
    break;
  case 0xa0:
    *(short **)(param_2 + 0x3104) = (short *)(iVar10 + 4);
    sVar2 = *(short *)(iVar10 + 4);
    if (sVar2 == 0x3fe) {
      FUN_0049a130();
    }
    else if (sVar2 == 0x3ff) {
      FUN_0049a160();
    }
    *(int *)(param_2 + 0x3104) = *(int *)(param_2 + 0x3104) + 2;
    return 1;
  case 0xa1:
    *(int *)(param_2 + 0x3104) = iVar10 + 4;
    if ((level_flags_1 & 0x1000000) == 0) {
      FUN_0048ed10(1);
      return 1;
    }
    break;
  case 0xa2:
    FUN_00491350(param_1,param_2);
    return 1;
  case 0xa3:
    FUN_00490ed0(param_1,param_2);
    return 1;
  case 0xa4:
    FUN_00490e40(param_1,param_2);
    return 1;
  case 0xa5:
    *(int *)(param_2 + 0x3104) = iVar10 + 4;
    game_state.tribes_array[0]._2365_4_ = game_state.tribes_array[0]._2365_4_ | 0x10000;
    FUN_0044ff80(0x89dad9,0xffffffff,0);
    return 1;
  case 0xa6:
    FUN_00490d40(param_1,param_2);
    return 1;
  case 0xa7:
    FUN_00490c40(param_1,param_2);
    return 1;
  case 0xa8:
    *(ushort **)(param_2 + 0x3104) = (ushort *)(iVar10 + 4);
    uVar3 = get_tribe_data(param_1,param_2,
                           (uint)*(ushort *)(iVar10 + 4) * 8 + *(int *)(param_2 + 0x3100));
    *(int *)(param_2 + 0x3104) = *(int *)(param_2 + 0x3104) + 2;
    *(undefined1 *)(param_1 + 0x5be) = uVar3;
    return 1;
  case 0xa9:
    *(int *)(param_2 + 0x3104) = iVar10 + 4;
    *(uint *)(param_1 + 0x941) = *(uint *)(param_1 + 0x941) | 2;
    return 1;
  case 0xaa:
    *(int *)(param_2 + 0x3104) = iVar10 + 4;
    FUN_0040bce0(CONCAT31((int3)((uint)iVar9 >> 8),*(undefined1 *)(param_1 + 0xc22)));
    return 1;
  case 0xab:
    FUN_00490ba0(param_1,param_2);
    return 1;
  case 0xac:
    *(ushort **)(param_2 + 0x3104) = (ushort *)(iVar10 + 4);
    iVar9 = get_tribe_data(param_1,param_2,
                           (uint)*(ushort *)(iVar10 + 4) * 8 + *(int *)(param_2 + 0x3100));
    *(int *)(param_2 + 0x3104) = *(int *)(param_2 + 0x3104) + 2;
    FUN_004a5d20((uint)DAT_0089d161 * iVar9,1);
    return 1;
  case 0xad:
    *(int *)(param_2 + 0x3104) = iVar10 + 4;
    FUN_004a5d20(0,0);
    FUN_004a5eb0();
    FUN_004a5ee0();
    return 1;
  case 0xae:
    iVar9 = *(int *)(param_2 + 0x3100);
    *(ushort **)(param_2 + 0x3104) = (ushort *)(iVar10 + 4);
    uVar1 = *(ushort *)(iVar10 + 4);
    *(int *)(param_2 + 0x3104) = iVar10 + 6;
    uVar7 = FUN_004a5ec0();
    *(undefined4 *)(param_2 + 0x3000 + *(int *)(iVar9 + 4 + (uint)uVar1 * 8) * 4) = uVar7;
    return 1;
  case 0xaf:
    *(int *)(param_2 + 0x3104) = iVar10 + 4;
    FUN_004f1b90(0x89d1c8);
    return 1;
  case 0xb0:
    *(short **)(param_2 + 0x3104) = (short *)(iVar10 + 4);
    sVar2 = *(short *)(iVar10 + 4);
    if (sVar2 == 0x3fe) {
      game_state._4_4_ = game_state._4_4_ & 0xffffffbf;
    }
    else if (sVar2 == 0x3ff) {
      game_state._4_4_ = game_state._4_4_ | 0x40;
    }
    *(int *)(param_2 + 0x3104) = *(int *)(param_2 + 0x3104) + 2;
    return 1;
  case 0xb1:
    *(int *)(param_2 + 0x3104) = iVar10 + 4;
    FUN_00448ec0();
    return 1;
  case 0xb2:
    *(int *)(param_2 + 0x3104) = iVar10 + 4;
    FUN_00448ee0();
    return 1;
  case 0xb3:
    *(int *)(param_2 + 0x3104) = iVar10 + 4;
    FUN_00449000();
    return 1;
  case 0xb4:
    *(short **)(param_2 + 0x3104) = (short *)(iVar10 + 4);
    sVar2 = *(short *)(iVar10 + 4);
    if (sVar2 == 0x3fe) {
      uVar7 = 1;
    }
    else {
      if (sVar2 != 0x3ff) goto LAB_0048e461;
      uVar7 = 0;
    }
    FUN_00449060(uVar7);
LAB_0048e461:
    *(int *)(param_2 + 0x3104) = *(int *)(param_2 + 0x3104) + 2;
    return 1;
  case 0xb5:
    FUN_00490590(param_1,param_2);
    return 1;
  case 0xb6:
    FUN_00490680(param_1,param_2);
    return 1;
  case 0xb7:
    FUN_00490730(param_1,param_2);
    return 1;
  case 0xb8:
    FUN_004907f0(param_1,param_2);
    return 1;
  case 0xb9:
    FUN_004908e0(param_1,param_2);
    return 1;
  case 0xba:
    FUN_00490ab0(param_1,param_2);
    return 1;
  case 0xbb:
    *(ushort **)(param_2 + 0x3104) = (ushort *)(iVar10 + 4);
    uVar7 = get_tribe_data(param_1,param_2,
                           (uint)*(ushort *)(iVar10 + 4) * 8 + *(int *)(param_2 + 0x3100));
    puVar5 = (ushort *)(*(int *)(param_2 + 0x3104) + 2);
    *(ushort **)(param_2 + 0x3104) = puVar5;
    uVar6 = get_tribe_data(param_1,param_2,(uint)*puVar5 * 8 + *(int *)(param_2 + 0x3100));
    *(int *)(param_2 + 0x3104) = *(int *)(param_2 + 0x3104) + 2;
    FUN_00449240(6,uVar7,uVar6,1,0);
    return 1;
  case 0xbc:
    FUN_00490a10(param_1,param_2);
    return 1;
  case 0xbd:
    *(int *)(param_2 + 0x3104) = iVar10 + 4;
    FUN_00431040();
    return 1;
  case 0xbe:
    *(ushort **)(param_2 + 0x3104) = (ushort *)(iVar10 + 4);
    uVar4 = get_tribe_data(param_1,param_2,
                           (uint)*(ushort *)(iVar10 + 4) * 8 + *(int *)(param_2 + 0x3100));
    *(int *)(param_2 + 0x3104) = *(int *)(param_2 + 0x3104) + 2;
    if (DAT_006841e7 != -1) {
      *(undefined2 *)&global_struct_45B_ARRAY_00683b92[DAT_006841e7].field_0x1c = uVar4;
      return 1;
    }
    break;
  case 0xbf:
    *(int *)(param_2 + 0x3104) = iVar10 + 4;
    uVar1 = *(ushort *)(iVar10 + 4);
    *(int *)(param_2 + 0x3104) = iVar10 + 6;
    iVar9 = (uint)uVar1 * 8 + *(int *)(param_2 + 0x3100);
    if (DAT_006841e7 != -1) {
      *(int *)(param_2 + 0x3000 + *(int *)(iVar9 + 4) * 4) =
           (int)*(short *)&global_struct_45B_ARRAY_00683b92[DAT_006841e7].field_0x1c;
      return 1;
    }
    *(undefined4 *)(param_2 + 0x3000 + *(int *)(iVar9 + 4) * 4) = 0;
    return 1;
  case 0xc0:
    *(ushort **)(param_2 + 0x3104) = (ushort *)(iVar10 + 4);
    uVar7 = get_tribe_data(param_1,param_2,
                           (uint)*(ushort *)(iVar10 + 4) * 8 + *(int *)(param_2 + 0x3100));
    *(int *)(param_2 + 0x3104) = *(int *)(param_2 + 0x3104) + 2;
    FUN_0048ed50(uVar7);
    return 1;
  case 0xc1:
    *(short **)(param_2 + 0x3104) = (short *)(iVar10 + 4);
    sVar2 = *(short *)(iVar10 + 4);
    if (sVar2 == 0x3fe) {
      *(uint *)(param_1 + 0x941) = *(uint *)(param_1 + 0x941) | 0x40;
      FUN_0041ca10(param_1);
    }
    else if (sVar2 == 0x3ff) {
      *(uint *)(param_1 + 0x941) = *(uint *)(param_1 + 0x941) & 0xffffffbf;
    }
    *(int *)(param_2 + 0x3104) = *(int *)(param_2 + 0x3104) + 2;
    return 1;
  case 0xc2:
    *(short **)(param_2 + 0x3104) = (short *)(iVar10 + 4);
    sVar2 = *(short *)(iVar10 + 4);
    if (sVar2 == 0x3fe) {
      level_flags_1 = level_flags_1 & 0xfeffffff;
    }
    else if (sVar2 == 0x3ff) {
      level_flags_1 = level_flags_1 | 0x1000000;
    }
    *(int *)(param_2 + 0x3104) = *(int *)(param_2 + 0x3104) + 2;
    return 1;
  case 0xc3:
    iVar9 = *(int *)(param_2 + 0x3100);
    *(ushort **)(param_2 + 0x3104) = (ushort *)(iVar10 + 4);
    uVar1 = *(ushort *)(iVar10 + 4);
    *(int *)(param_2 + 0x3104) = iVar10 + 6;
    uVar7 = FUN_00499960();
    *(undefined4 *)(param_2 + 0x3000 + *(int *)(iVar9 + 4 + (uint)uVar1 * 8) * 4) = uVar7;
  }
  return 1;
}
