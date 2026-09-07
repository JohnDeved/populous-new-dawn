/* Ghidra 12.1.3 pseudocode; entry 0048f350; get_tribe_data.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


uint get_tribe_data(int param_1,int param_2,int *param_3)

{
  short sVar1;
  undefined2 uVar2;
  undefined2 uVar3;
  uint uVar4;
  int iVar5;
  int iVar6;

  uVar4 = 0;
  iVar6 = *param_3;
  if (iVar6 == 0) {
    return param_3[1];
  }
  if (iVar6 == 1) {
    return *(uint *)(param_2 + 0x3000 + param_3[1] * 4);
  }
  if (iVar6 != 2) {
    return uVar4;
  }
  iVar6 = param_3[1];
  if (999 < iVar6) {
    switch(iVar6) {
    case 1000:
    case 0x3e9:
    case 0x3ea:
    case 0x3eb:
    case 0x3ec:
    case 0x3ed:
    case 0x3ee:
    case 0x3ef:
    case 0x3f0:
    case 0x3f1:
    case 0x3f2:
    case 0x3f3:
    case 0x3f4:
    case 0x3f5:
    case 0x3f6:
    case 0x3f7:
    case 0x3f8:
    case 0x3f9:
    case 0x3fa:
    case 0x3fb:
    case 0x3fc:
    case 0x3fd:
    case 0x3fe:
    case 0x3ff:
    case 0x400:
    case 0x401:
    case 0x402:
    case 0x403:
    case 0x404:
    case 0x405:
    case 0x406:
    case 0x407:
    case 0x408:
    case 0x409:
    case 0x40a:
    case 0x40b:
    case 0x40c:
    case 0x40d:
    case 0x40e:
    case 0x40f:
    case 0x410:
    case 0x411:
    case 0x412:
    case 0x413:
    case 0x414:
    case 0x415:
    case 0x416:
    case 0x417:
      return (uint)*(byte *)(*(char *)(param_1 + 0xc22) * 0x30 + 0x960402 + iVar6);
    case 0x418:
      return *(uint *)(param_1 + 0x94d);
    case 0x419:
    case 0x41a:
    case 0x41b:
    case 0x41c:
    case 0x41d:
    case 0x41e:
    case 0x41f:
    case 0x420:
    case 0x421:
    case 0x422:
    case 0x423:
    case 0x424:
    case 0x425:
    case 0x426:
    case 0x427:
    case 0x428:
      return *(uint *)(&DAT_00598304 + iVar6 * 0x3e);
    case 0x429:
      return DAT_005a8530;
    case 0x42a:
    case 0x42b:
    case 0x42c:
    case 0x42d:
    case 0x42e:
    case 0x42f:
    case 0x430:
    case 0x431:
    case 0x432:
    case 0x433:
    case 0x434:
    case 0x435:
    case 0x436:
    case 0x437:
    case 0x438:
    case 0x439:
      goto switchD_0048f3b9_caseD_42a;
    case 0x43a:
    case 0x43b:
    case 0x43c:
    case 0x43d:
    case 0x43e:
    case 0x43f:
    case 0x440:
    case 0x441:
    case 0x442:
    case 0x443:
    case 0x444:
    case 0x445:
    case 0x446:
    case 0x447:
    case 0x448:
    case 0x449:
      if ((*(uint *)(param_1 + 0x596) & 0x10000) == 0) {
        return (int)*(short *)(&game_state.tribes_array[0].sub_struct_1[8].field_0x7 + iVar6 * 2);
      }
      sVar1 = *(short *)(&game_state.tribes_array[0].sub_struct_1[8].field_0x39 + iVar6 * 2);
      *(uint *)(param_1 + 0x596) = *(uint *)(param_1 + 0x596) & 0xfffeffff;
      return (int)sVar1;
    case 0x44a:
    case 1099:
    case 0x44c:
    case 0x44d:
    case 0x44e:
    case 0x44f:
    case 0x450:
    case 0x451:
    case 0x452:
    case 0x453:
    case 0x454:
    case 0x455:
    case 0x456:
    case 0x457:
    case 0x458:
    case 0x459:
      if ((*(uint *)(param_1 + 0x596) & 0x10000) == 0) {
        return (int)*(short *)(&game_state.tribes_array[1].sub_struct_1[7].field_0x39 + iVar6 * 2);
      }
      sVar1 = *(short *)(&game_state.tribes_array[1].sub_struct_1[8].field_0x19 + iVar6 * 2);
      *(uint *)(param_1 + 0x596) = *(uint *)(param_1 + 0x596) & 0xfffeffff;
      return (int)sVar1;
    case 0x45a:
    case 0x45b:
    case 0x45c:
    case 0x45d:
    case 0x45e:
    case 0x45f:
    case 0x460:
    case 0x461:
    case 0x462:
    case 0x463:
    case 0x464:
    case 0x465:
    case 0x466:
    case 0x467:
    case 0x468:
    case 0x469:
      if ((*(uint *)(param_1 + 0x596) & 0x10000) == 0) {
        return (int)*(short *)(&game_state.tribes_array[2].sub_struct_1[7].field_0x19 + iVar6 * 2);
      }
      sVar1 = *(short *)((int)&game_state.tribes_array[2].sub_struct_1[7].field56_0x4a +
                        iVar6 * 2 + 1);
      *(uint *)(param_1 + 0x596) = *(uint *)(param_1 + 0x596) & 0xfffeffff;
      return (int)sVar1;
    case 0x46a:
    case 0x46b:
    case 0x46c:
    case 0x46d:
    case 0x46e:
    case 0x46f:
    case 0x470:
    case 0x471:
    case 0x472:
    case 0x473:
    case 0x474:
    case 0x475:
    case 0x476:
    case 0x477:
    case 0x478:
    case 0x479:
      if ((*(uint *)(param_1 + 0x596) & 0x10000) == 0) {
        return (int)*(short *)((int)&game_state.tribes_array[3].sub_struct_1[6].field56_0x4a +
                              iVar6 * 2 + 1);
      }
      sVar1 = *(short *)((int)&game_state.tribes_array[3].sub_struct_1[7].field29_0x28 +
                        iVar6 * 2 + 3);
      *(uint *)(param_1 + 0x596) = *(uint *)(param_1 + 0x596) & 0xfffeffff;
      return (int)sVar1;
    case 0x47a:
    case 0x47b:
    case 0x47c:
    case 0x47d:
    case 0x47e:
    case 0x47f:
      return (int)*(short *)(param_1 + 0x137 + iVar6 * 2);
    case 0x480:
    case 0x481:
    case 0x482:
    case 0x483:
    case 0x484:
    case 0x485:
      return (int)*(short *)(&game_state.tribes_array[0].sub_struct_1[2].field_0x13 + iVar6 * 2);
    case 0x486:
    case 0x487:
    case 0x488:
    case 0x489:
    case 0x48a:
    case 0x48b:
      return (int)*(short *)(&game_state.tribes_array[1].sub_struct_1[2].field_0x7 + iVar6 * 2);
    case 0x48c:
    case 0x48d:
    case 0x48e:
    case 0x48f:
    case 0x490:
    case 0x491:
      return (int)*(short *)((int)&game_state.tribes_array[2].sub_struct_1[1].field56_0x4a +
                            iVar6 * 2 + 3);
    case 0x492:
    case 0x493:
    case 0x494:
    case 0x495:
    case 0x496:
    case 0x497:
      return (int)*(short *)(&game_state.tribes_array[3].sub_struct_1[1].field_0x41 + iVar6 * 2);
    case 0x498:
    case 0x499:
    case 0x49a:
    case 0x49b:
      return (uint)*(ushort *)(*(char *)(param_1 + 0xc22) * 0xc65 + 0x89d2b7 + iVar6 * 2);
    case 0x49c:
    case 0x49d:
    case 0x49e:
    case 0x49f:
      return (uint)*(ushort *)(iVar6 * 0xc65 + 0x50ba5b + *(char *)(param_1 + 0xc22) * 2);
    case 0x4a0:
      return 1;
    case 0x4a1:
      return 2;
    case 0x4a2:
      return 3;
    case 0x4a3:
      return 4;
    case 0x4a4:
      return 5;
    case 0x4a5:
      return 6;
    case 0x4a6:
      return 7;
    case 0x4a7:
      return 8;
    case 0x4a8:
      return 9;
    case 0x4a9:
      return 10;
    case 0x4aa:
      return 0xb;
    case 0x4ab:
      return 0xc;
    case 0x4ac:
      return 0xd;
    case 0x4ad:
      return 0xe;
    case 0x4ae:
      return 0xf;
    case 0x4af:
      return 0x10;
    case 0x4b0:
      return 0x12;
    case 0x4b1:
    case 0x4b2:
    case 0x4b3:
    case 0x4b4:
    case 0x4b5:
    case 0x4b6:
      return iVar6 - 0x4af;
    case 0x4b7:
      return 1;
    case 0x4b8:
      return 2;
    case 0x4b9:
      return 3;
    case 0x4ba:
      return 4;
    case 0x4bb:
      return 5;
    case 0x4bc:
      return 6;
    case 0x4bd:
      return 7;
    case 0x4be:
      return 8;
    default:
      return 0;
    case 0x4c0:
      return 10;
    case 0x4c1:
      return 0xb;
    case 0x4c2:
      return 0xd;
    case 0x4c3:
      return 0xe;
    case 0x4c4:
      return 0xf;
    case 0x4c5:
      return 0x10;
    case 0x4c6:
      return 0;
    case 0x4c7:
      return 0;
    case 0x4c8:
      return 0;
    case 0x4c9:
      return 999;
    case 0x4ca:
      uVar4 = get_airship_or_boat_num(param_1,1);
      return uVar4;
    case 0x4cb:
      return (int)*(short *)(param_1 + 0xbab);
    case 0x4cc:
      return (int)game_state.tribes_array[0].field1447_0xba5._2_2_;
    case 0x4cd:
      return (int)game_state.tribes_array[0].field1448_0xba9._2_2_;
    case 0x4ce:
      return (int)game_state.tribes_array[1].field1447_0xba5._2_2_;
    case 0x4cf:
      return (int)game_state.tribes_array[1].field1448_0xba9._2_2_;
    case 0x4d0:
      return (int)game_state.tribes_array[2].field1447_0xba5._2_2_;
    case 0x4d1:
      return (int)game_state.tribes_array[2].field1448_0xba9._2_2_;
    case 0x4d2:
      return (int)game_state.tribes_array[3].field1447_0xba5._2_2_;
    case 0x4d3:
      return (int)game_state.tribes_array[3].field1448_0xba9._2_2_;
    case 0x4d4:
      iVar6 = get_num_tribe_sub_struct_flag_1_set(param_1);
      return 10 - iVar6;
    case 0x4d5:
      uVar4 = game_state.pseudo_random_val * 0x24a1 + 0x24df;
      game_state.pseudo_random_val = uVar4 >> 0xd | uVar4 * 0x80000;
      return game_state.pseudo_random_val % 100;
    case 0x4d6:
      uVar4 = FUN_004f3350(param_1);
      return uVar4;
    case 0x4d7:
      return (int)(short)game_state.tribes_array[player_tribe_num].angle_1;
    case 0x4d8:
      uVar2 = game_state.tribes_array[player_tribe_num].x;
      return (uint)((byte)((ushort)uVar2 >> 8) & 0xfe);
    case 0x4d9:
      uVar3 = game_state.tribes_array[player_tribe_num].y;
      return (uint)((byte)((ushort)uVar3 >> 8) & 0xfe);
    case 0x4da:
      return DAT_005a856e;
    case 0x4db:
      return 0x13;
    case 0x4dc:
      return 0x11;
    case 0x4dd:
      return 0x15;
    case 0x4de:
      return 0x14;
    }
  }
  if (iVar6 == 1) {
    iVar5 = *(char *)(param_1 + 0xc22) + 1;
  }
  else {
    if (iVar6 != 6) goto LAB_0048f999;
    iVar5 = (int)*(char *)(param_1 + 0xc22);
  }
  iVar6 = iVar6 + iVar5;
LAB_0048f999:
  switch(*(undefined4 *)(&DAT_005ae494 + iVar6 * 8)) {
  case 0:
    return *(uint *)(&PTR_offset_counter_2_005ae490)[iVar6 * 2];
  case 1:
    return *(uint *)(&PTR_offset_counter_2_005ae490)[iVar6 * 2];
  case 2:
    return (uint)*(ushort *)(&PTR_offset_counter_2_005ae490)[iVar6 * 2];
  case 3:
    return (int)*(short *)(&PTR_offset_counter_2_005ae490)[iVar6 * 2];
  case 4:
    return (uint)(byte)*(&PTR_offset_counter_2_005ae490)[iVar6 * 2];
  case 5:
    uVar4 = (uint)(char)*(&PTR_offset_counter_2_005ae490)[iVar6 * 2];
  }
  return uVar4;
switchD_0048f3b9_caseD_42a:
  if ((*(uint *)(param_1 + 0x596) & 0x10000) == 0) {
    return (int)*(short *)(param_1 + 0x32b + iVar6 * 2);
  }
  sVar1 = *(short *)(param_1 + 0x35d + iVar6 * 2);
  *(uint *)(param_1 + 0x596) = *(uint *)(param_1 + 0x596) & 0xfffeffff;
  return (int)sVar1;
}
