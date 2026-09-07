/* Ghidra 12.1.3 pseudocode; entry 00509c10; init_unit_type_7.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void init_unit_type_7(int param_1)

{
  uint uVar1;
  undefined4 uVar2;
  undefined2 uVar3;
  int iVar4;
  undefined1 *puVar5;
  undefined2 extraout_var;
  undefined1 uVar6;

  FUN_0050bcd0(param_1);
  iVar4 = *(byte *)(param_1 + 0x2b) - 1;
  uVar3 = (undefined2)((uint)iVar4 >> 0x10);
  switch(iVar4) {
  case 0:
    FUN_0050b630(param_1);
    return;
  case 1:
    unit_set_object(param_1 + 0x33,8,0);
    FUN_00445c20(param_1);
    *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) & 0xefffffff;
    *(short *)(param_1 + 0x41) = *(short *)(param_1 + 0x41) + 0x40;
    FUN_00401b10(param_1,2);
    FUN_0050bc90(param_1,global_palette_indexes,7,0x10,2,0xfffffffe);
    return;
  case 2:
    FUN_0050bf60(param_1);
    return;
  case 3:
    FUN_0050c380(param_1);
    return;
  case 4:
    FUN_00401b10(param_1,6);
    return;
  case 5:
    *(undefined2 *)(param_1 + 0x6c) = 8;
    FUN_00401b10(param_1,0xc);
    return;
  case 6:
    FUN_0050c690(param_1);
    return;
  case 7:
    FUN_0050c780(param_1);
    return;
  case 8:
    FUN_0050ccd0(param_1);
    return;
  case 9:
    FUN_0050c410(param_1);
    return;
  case 10:
    FUN_0050cea0(param_1);
    return;
  case 0xb:
    FUN_00401b10(param_1,0xd);
    *(undefined2 *)(param_1 + 0x6c) = 0;
    FUN_0048a050(param_1,0xa8,0);
    return;
  case 0xc:
    FUN_00401b10(param_1,0xe);
    return;
  case 0xd:
    FUN_0050fe60(param_1);
    return;
  case 0xe:
    FUN_00401b10(param_1,0x10);
    *(undefined2 *)(param_1 + 0x6c) = 0xa0;
    uVar3 = FUN_00404c50(param_1 + 0x3d);
    *(undefined2 *)(param_1 + 0x72) = uVar3;
    return;
  case 0xf:
    FUN_0050e9e0(param_1);
    return;
  case 0x10:
    FUN_00511ef0(param_1);
    return;
  case 0x11:
    FUN_00511340(param_1);
    return;
  case 0x12:
    FUN_005121c0(param_1);
    return;
  case 0x13:
    FUN_0050f270(param_1);
    return;
  case 0x14:
    FUN_00510020(param_1);
    return;
  case 0x15:
    FUN_00401b10(param_1,0x17);
    *(short *)(param_1 + 0x6c) = (short)DAT_005aa590;
    *(undefined4 *)(param_1 + 0x72) = *(undefined4 *)(param_1 + 0x3d);
    return;
  case 0x16:
    FUN_00401b10(param_1,0x18);
    *(undefined2 *)(param_1 + 0x6c) = 0x40;
    return;
  case 0x17:
    FUN_00401b10(param_1,0x19);
    *(undefined2 *)(param_1 + 0x6c) = 0;
    FUN_0048a050(param_1,0xab,0);
    FUN_0048a050(param_1,0x29,0);
    return;
  case 0x19:
    FUN_0050d910(param_1);
    return;
  case 0x1a:
    unit_set_object(param_1 + 0x33,0x1a,0);
    *(undefined1 *)(param_1 + 0x2c) = 0x43;
    FUN_00445c20(param_1);
    *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) & 0xefffffff;
    *(short *)(param_1 + 0x41) = *(short *)(param_1 + 0x41) + 0x32;
    return;
  case 0x1b:
    FUN_00511800(param_1);
    return;
  case 0x1c:
    FUN_00401b10(param_1,0x1d);
    FUN_00445c20(param_1);
    *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) & 0xefffffff;
    unit_set_object(param_1 + 0x33,0x1e,0x442);
    *(undefined2 *)(param_1 + 0x6c) = 0x40;
    sunlight_update_unit_landscape(param_1,4,4,0);
    return;
  case 0x1d:
    FUN_00401b10(param_1,0x1e);
    *(undefined2 *)(param_1 + 0x6c) = 0;
    uVar2 = game_state.pseudo_random_val;
    *(undefined1 *)(param_1 + 0x76) = 9;
    *(undefined4 *)(param_1 + 0x72) = uVar2;
    FUN_0048a050(param_1,0xa2,0);
    return;
  case 0x1e:
    FUN_005126a0(param_1);
    return;
  case 0x1f:
    *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) | 0x4000;
    return;
  case 0x21:
    FUN_00512a00(param_1);
    return;
  case 0x22:
    update_after_unit_alloc(param_1);
    return;
  case 0x23:
    FUN_00401b10(param_1,0x23);
    return;
  case 0x25:
    FUN_00401b10(param_1,0x24);
    FUN_00445c20(param_1);
    *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) & 0xefffffff;
    unit_set_object(param_1 + 0x33,0x1e,1099);
    *(undefined2 *)(param_1 + 0x6c) = 9;
    FUN_0048a050(param_1,0xb2,0);
    sunlight_update_unit_landscape(param_1,4,4,0);
    return;
  case 0x26:
    FUN_00401b10(param_1,0x25);
    FUN_00445c20(param_1);
    *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) & 0xefffffff;
    unit_set_object(param_1 + 0x33,0x1f,0x454);
    *(undefined2 *)(param_1 + 0x6c) = 0xc;
    FUN_0048a050(param_1,0xb2,0);
    sunlight_update_unit_landscape(param_1,4,4,0);
    return;
  case 0x27:
    FUN_005134c0(param_1);
    return;
  case 0x28:
    FUN_00463750(param_1 + 0x3d);
    FUN_00401b10(param_1,0xb);
    unit_set_object(param_1 + 0x33,0x22,0x470);
    *(undefined1 *)(param_1 + 0x3c) = 4;
    *(undefined2 *)(param_1 + 0x6c) = 1;
    *(undefined2 *)(param_1 + 0x5f) = 0;
    return;
  case 0x29:
    FUN_00511a60(param_1);
    return;
  case 0x2a:
    FUN_005136d0(param_1);
    return;
  case 0x2b:
    FUN_00513d20(param_1);
    return;
  case 0x2c:
    FUN_00513d20(param_1);
    return;
  case 0x2d:
    FUN_005139f0(param_1);
    return;
  case 0x2e:
    FUN_00513a60(param_1);
    return;
  case 0x2f:
    FUN_00513f10(param_1);
    return;
  case 0x30:
    FUN_00513ad0(param_1);
    return;
  case 0x31:
    FUN_00513b40(param_1);
    return;
  case 0x32:
    FUN_005137c0(param_1);
    return;
  case 0x33:
    clear_unit(param_1);
    return;
  case 0x34:
    place_shaman(param_1);
    return;
  case 0x35:
    effect_place_wild_man(param_1);
    return;
  case 0x36:
    FUN_0050bf60(param_1);
    return;
  case 0x37:
    FUN_0050b630(param_1);
    *(undefined4 *)(param_1 + 0x6c) = 0x100;
    FUN_00401b10(param_1,0x2b);
    return;
  case 0x38:
    uVar3 = calc_point_height(CONCAT22(extraout_var,*(undefined2 *)(param_1 + 0x3d)),
                              CONCAT22(uVar3,*(undefined2 *)(param_1 + 0x3f)));
    *(undefined2 *)(param_1 + 0x41) = uVar3;
    FUN_00401b10(param_1,0x2c);
    unit_set_object(param_1 + 0x33,0x26,0x630);
    uVar1 = *(uint *)(param_1 + 0x14);
    *(undefined2 *)(param_1 + 0x5f) = 0;
    *(uint *)(param_1 + 0x14) = uVar1 | 0x100;
    *(uint *)(param_1 + 0x14) = uVar1 | 0x300;
    return;
  case 0x39:
    uVar3 = calc_point_height(CONCAT22(extraout_var,*(undefined2 *)(param_1 + 0x3d)),
                              CONCAT22(uVar3,*(undefined2 *)(param_1 + 0x3f)));
    *(undefined2 *)(param_1 + 0x41) = uVar3;
    FUN_00401b10(param_1,0x2d);
    unit_set_object(param_1 + 0x33,0x2d,0x4d8);
    *(undefined2 *)(param_1 + 0x6c) = 8;
    *(undefined2 *)(param_1 + 0x5f) = 0;
    *(undefined2 *)(param_1 + 0x72) = 0;
    return;
  case 0x3a:
    uVar3 = calc_point_height(CONCAT22(extraout_var,*(undefined2 *)(param_1 + 0x3d)),
                              CONCAT22(uVar3,*(undefined2 *)(param_1 + 0x3f)));
    *(undefined2 *)(param_1 + 0x41) = uVar3;
    FUN_00401b10(param_1,0x2e);
    unit_set_object(param_1 + 0x33,0x2c,0x4f0);
    *(undefined2 *)(param_1 + 0x6c) = 0x10;
    *(undefined2 *)(param_1 + 0x5f) = 0;
    *(undefined2 *)(param_1 + 0x72) = 0;
    return;
  case 0x3b:
    uVar3 = calc_point_height(CONCAT22(extraout_var,*(undefined2 *)(param_1 + 0x3d)),
                              CONCAT22(uVar3,*(undefined2 *)(param_1 + 0x3f)));
    *(undefined2 *)(param_1 + 0x41) = uVar3;
    FUN_00401b10(param_1,0x2f);
    unit_set_object(param_1 + 0x33,0x2c,0x508);
    *(undefined2 *)(param_1 + 0x6c) = 0x10;
    *(undefined2 *)(param_1 + 0x5f) = 0;
    return;
  case 0x3c:
    uVar3 = calc_point_height(CONCAT22(extraout_var,*(undefined2 *)(param_1 + 0x3d)),
                              CONCAT22(uVar3,*(undefined2 *)(param_1 + 0x3f)));
    *(undefined2 *)(param_1 + 0x41) = uVar3;
    FUN_00401b10(param_1,0x30);
    unit_set_object(param_1 + 0x33,0x2e,0x50e);
    *(undefined2 *)(param_1 + 0x6c) = 6;
    *(undefined2 *)(param_1 + 0x5f) = 0;
    return;
  case 0x3d:
    FUN_00401b10(param_1,0x31);
    FUN_00445c20(param_1);
    *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) & 0xefffffff;
    unit_set_object(param_1 + 0x33,0x27,0x49c);
    *(undefined2 *)(param_1 + 0x6c) = 0xe;
    FUN_0048a050(param_1,0xb2,0);
    sunlight_update_unit_landscape(param_1,4,4,0);
    return;
  case 0x3e:
    FUN_00401b10(param_1,0x32);
    FUN_00445c20(param_1);
    *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) & 0xefffffff;
    unit_set_object(param_1 + 0x33,0x28,0x4aa);
    *(undefined2 *)(param_1 + 0x6c) = 0x10;
    FUN_0048a050(param_1,0xb2,0);
    sunlight_update_unit_landscape(param_1,4,4,0);
    return;
  case 0x3f:
    uVar3 = calc_point_height(CONCAT22(extraout_var,*(undefined2 *)(param_1 + 0x3d)),
                              CONCAT22(uVar3,*(undefined2 *)(param_1 + 0x3f)));
    *(undefined2 *)(param_1 + 0x41) = uVar3;
    FUN_00401b10(param_1,0x33);
    unit_set_object(param_1 + 0x33,0x29,0x500);
    *(undefined2 *)(param_1 + 0x6c) = 8;
    *(undefined2 *)(param_1 + 0x5f) = 0;
    return;
  case 0x40:
    FUN_00513830(param_1);
    return;
  case 0x41:
    FUN_00401b10(param_1,0x35);
    unit_set_object(param_1 + 0x33,0x2c,0x4c8);
    *(undefined2 *)(param_1 + 0x6c) = 0x10;
    *(undefined2 *)(param_1 + 0x5f) = 0;
    return;
  case 0x42:
    FUN_00401b10(param_1,0x36);
    unit_set_object(param_1 + 0x33,0x2b,0x4ba);
    *(undefined1 *)(param_1 + 0x3c) = 1;
    *(undefined2 *)(param_1 + 0x6c) = 0xe;
    *(undefined2 *)(param_1 + 0x5f) = 0;
    return;
  case 0x43:
    FUN_0050c490(param_1);
    return;
  case 0x44:
    FUN_00514970(param_1);
    return;
  case 0x45:
    FUN_00514c90(param_1);
    return;
  case 0x46:
    uVar3 = calc_point_height(CONCAT22(extraout_var,*(undefined2 *)(param_1 + 0x3d)),
                              CONCAT22(uVar3,*(undefined2 *)(param_1 + 0x3f)));
    *(undefined2 *)(param_1 + 0x41) = uVar3;
    FUN_00401b10(param_1,0x3a);
    unit_set_object(param_1 + 0x33,0x2f,0x508);
    *(undefined2 *)(param_1 + 0x6c) = 4;
    *(undefined2 *)(param_1 + 0x5f) = 0;
    return;
  case 0x47:
    FUN_00401b10(param_1,0x3b);
    FUN_00445c20(param_1);
    *(undefined1 *)(param_1 + 0x74) = 2;
    *(undefined2 *)(param_1 + 0x41) = 0x800;
    *(undefined2 *)(param_1 + 0x6c) = 0;
    *(undefined2 *)(param_1 + 0x72) = 0x100;
    return;
  case 0x48:
    FUN_005122e0(param_1);
    return;
  case 0x49:
    FUN_0050c150(param_1);
    return;
  case 0x4a:
    FUN_0050c150(param_1);
    return;
  case 0x4b:
    FUN_005119d0(param_1);
    return;
  case 0x4c:
    uVar6 = 0;
    puVar5 = (undefined1 *)FUN_0050a710(param_1);
    if (puVar5 != (undefined1 *)0x0) {
      uVar6 = *puVar5;
    }
    *(undefined1 *)(param_1 + 0x2d) = uVar6;
    *(undefined2 *)(param_1 + 0x70) = 7;
    FUN_00401b10(param_1,0x3f);
    return;
  case 0x4d:
    FUN_0050b630(param_1);
    *(undefined1 *)(param_1 + 0x7d) = 1;
    return;
  case 0x4e:
    *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) | 0x4000;
    *(undefined2 *)(param_1 + 0x6c) = 0;
    unit_set_object(param_1 + 0x33,0x1f,0x559);
    FUN_00401b10(param_1,0x40);
    return;
  case 0x4f:
    update_after_unit_alloc(param_1);
    return;
  case 0x50:
    FUN_00401b10(param_1,0x42);
    return;
  case 0x51:
    FUN_00405090(param_1 + 0x3d);
    FUN_00401b10(param_1,0x44);
    *(undefined2 *)(param_1 + 0x6c) = 0;
    return;
  case 0x52:
    *(undefined2 *)(param_1 + 0x6c) = 0;
    *(undefined2 *)(param_1 + 0x70) = 0x40;
    FUN_00401b10(param_1,0x45);
    return;
  case 0x53:
    FUN_00513620(param_1);
    return;
  case 0x54:
    FUN_0050c050(param_1);
    return;
  case 0x55:
    FUN_00477060(param_1);
    return;
  case 0x56:
    FUN_00405090(param_1 + 0x3d);
    FUN_00401b10(param_1,0x48);
    *(undefined2 *)(param_1 + 0x6c) = 0;
    return;
  case 0x57:
    FUN_00405090(param_1 + 0x3d);
    FUN_00401b10(param_1,0x49);
    *(undefined2 *)(param_1 + 0x6c) = 0;
    return;
  case 0x58:
    FUN_00478c00(param_1);
    return;
  case 0x59:
    FUN_00478c30(param_1);
    return;
  case 0x5a:
    FUN_00479840(param_1);
    return;
  case 0x5b:
    FUN_00401b10(param_1,0x4d);
    return;
  case 0x5c:
    FUN_00479cd0(param_1);
  }
  return;
}
