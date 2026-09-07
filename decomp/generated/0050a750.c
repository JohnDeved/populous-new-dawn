/* Ghidra 12.1.3 pseudocode; entry 0050a750; unit_processing_class_7_effect.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void unit_processing_class_7_effect(int param_1)

{
  undefined2 uVar1;
  bool bVar2;
  int iVar3;
  char cVar4;
  short sVar5;
  int iVar6;
  undefined4 *puVar7;
  undefined1 local_48 [4];
  undefined4 local_44 [17];

  iVar3 = param_1;
  iVar6 = *(byte *)(param_1 + 0x2c) - 1;
  switch(iVar6) {
  case 0:
    FUN_0050b740(param_1);
    return;
  case 1:
    process_simple_blast(param_1);
    return;
  case 2:
    process_lightning_elem(param_1);
    return;
  case 3:
    FUN_004e7a80(param_1);
    sVar5 = *(short *)(iVar3 + 0x6c) + -1;
    *(short *)(iVar3 + 0x6c) = sVar5;
    if (sVar5 < 1) {
      FUN_004ef180(iVar3);
      return;
    }
    break;
  case 4:
    process_lightning_elem(param_1);
    return;
  case 5:
    process_burn_cell_obstacle(param_1);
    return;
  case 6:
    process_flatten_land(param_1);
    return;
  case 7:
    *(uint *)(param_1 + 0x10) = *(uint *)(param_1 + 0x10) & 0xffbfffff;
    if ((-1 < *(short *)(param_1 + 0x6c)) &&
       (sVar5 = *(short *)(param_1 + 0x6c) + -1, *(short *)(param_1 + 0x6c) = sVar5, sVar5 < 1)) {
      FUN_004ef180(param_1);
      return;
    }
    break;
  case 8:
    process_lightning_elem(param_1);
    return;
  case 9:
    process_sphere_explode(param_1);
    return;
  case 10:
    if ((*(short *)(param_1 + 0x6e) != 0) &&
       (iVar6 = FUN_004077e0(CONCAT22((short)((uint)iVar6 >> 0x10),*(short *)(param_1 + 0x6e))),
       iVar6 == 0)) {
      update_after_unit_alloc(iVar3);
      return;
    }
    break;
  case 0xb:
    process_firecloud(param_1);
    return;
  case 0xc:
    process_ghost_army(param_1);
    return;
  case 0xd:
    iVar6 = FUN_00515e30(*(undefined1 *)(param_1 + 0x2f),param_1 + 0x3d,DAT_005aa4d8,3,FUN_0050d890,
                         &LAB_0050d8c0);
    if (0 < iVar6) {
      FUN_0048a050(iVar3,0x31,0);
    }
    update_after_unit_alloc(iVar3);
    return;
  case 0xe:
    process_explode_building(param_1);
    return;
  case 0xf:
    process_volcano(param_1);
    return;
  case 0x10:
    process_hypnotism(param_1);
    return;
  case 0x11:
    process_lightning_bolt(param_1);
    return;
  case 0x12:
    process_swamp(param_1);
    return;
  case 0x13:
    effect_aod(param_1);
    return;
  case 0x14:
    process_whirlwind(param_1);
    return;
  case 0x15:
    process_insect_plague(param_1);
    return;
  case 0x16:
    process_firestorm(param_1);
    return;
  case 0x17:
    process_erosion(param_1);
    return;
  case 0x18:
    process_land_bridge(param_1);
    return;
  case 0x1b:
    *(uint *)(param_1 + 0x10) = *(uint *)(param_1 + 0x10) & 0xffbfffff;
    if ((-1 < *(short *)(param_1 + 0x6c)) &&
       (sVar5 = *(short *)(param_1 + 0x6c) + -1, *(short *)(param_1 + 0x6c) = sVar5, sVar5 < 1)) {
      FUN_004ef180(param_1);
      return;
    }
    break;
  case 0x1c:
    *(uint *)(param_1 + 0x10) = *(uint *)(param_1 + 0x10) & 0xffbfffff;
    if ((*(byte *)(param_1 + 0xc) & 4) != 0) {
      FUN_00445c20(param_1);
      *(uint *)(iVar3 + 0xc) = *(uint *)(iVar3 + 0xc) & 0xfffffffb;
    }
    if ((-1 < *(short *)(iVar3 + 0x6c)) &&
       (sVar5 = *(short *)(iVar3 + 0x6c) + -1, *(short *)(iVar3 + 0x6c) = sVar5, sVar5 < 1)) {
      FUN_004ef180(iVar3);
      return;
    }
    break;
  case 0x1d:
    FUN_00511ae0(param_1);
    return;
  case 0x1e:
    process_lightning(param_1);
    return;
  case 0x20:
    set_landscape_pos_fields_3(param_1);
    return;
  case 0x22:
    process_lava_flow(param_1);
    return;
  case 0x23:
    *(uint *)(param_1 + 0x10) = *(uint *)(param_1 + 0x10) & 0xffbfffff;
    if ((-1 < *(short *)(param_1 + 0x6c)) &&
       (sVar5 = *(short *)(param_1 + 0x6c) + -1, *(short *)(param_1 + 0x6c) = sVar5, sVar5 < 1)) {
      FUN_004ef180(param_1);
      return;
    }
    break;
  case 0x24:
    *(uint *)(param_1 + 0x10) = *(uint *)(param_1 + 0x10) & 0xffbfffff;
    if ((-1 < *(short *)(param_1 + 0x6c)) &&
       (sVar5 = *(short *)(param_1 + 0x6c) + -1, *(short *)(param_1 + 0x6c) = sVar5, sVar5 < 1)) {
      FUN_004ef180(param_1);
      return;
    }
    break;
  case 0x25:
    FUN_00513570(param_1);
    return;
  case 0x26:
    *(uint *)(param_1 + 0x10) = *(uint *)(param_1 + 0x10) & 0xffbfffff;
    if ((-1 < *(short *)(param_1 + 0x6c)) &&
       (sVar5 = *(short *)(param_1 + 0x6c) + -1, *(short *)(param_1 + 0x6c) = sVar5, sVar5 < 1)) {
      FUN_004ef180(param_1);
      return;
    }
    break;
  case 0x27:
    *(uint *)(param_1 + 0x10) = *(uint *)(param_1 + 0x10) & 0xffbfffff;
    if ((-1 < *(short *)(param_1 + 0x6c)) &&
       (sVar5 = *(short *)(param_1 + 0x6c) + -1, *(short *)(param_1 + 0x6c) = sVar5, sVar5 < 1)) {
      FUN_004ef180(param_1);
      return;
    }
    break;
  case 0x28:
    FUN_00513bb0(param_1);
    return;
  case 0x29:
    *(uint *)(param_1 + 0x10) = *(uint *)(param_1 + 0x10) & 0xffbfffff;
    if ((-1 < *(short *)(param_1 + 0x6c)) &&
       (sVar5 = *(short *)(param_1 + 0x6c) + -1, *(short *)(param_1 + 0x6c) = sVar5, sVar5 < 1)) {
      FUN_004ef180(param_1);
      return;
    }
    break;
  case 0x2a:
    FUN_0050b340(param_1);
    return;
  case 0x2b:
    FUN_00513930(param_1);
    return;
  case 0x2c:
    process_raise_or_lower_land(param_1);
    return;
  case 0x2d:
    process_raise_or_lower_land(param_1);
    return;
  case 0x2e:
    *(uint *)(param_1 + 0x10) = *(uint *)(param_1 + 0x10) & 0xffbfffff;
    if ((-1 < *(short *)(param_1 + 0x6c)) &&
       (sVar5 = *(short *)(param_1 + 0x6c) + -1, *(short *)(param_1 + 0x6c) = sVar5, sVar5 < 1)) {
      FUN_004ef180(param_1);
      return;
    }
    break;
  case 0x2f:
    *(uint *)(param_1 + 0x10) = *(uint *)(param_1 + 0x10) & 0xffbfffff;
    if ((-1 < *(short *)(param_1 + 0x6c)) &&
       (sVar5 = *(short *)(param_1 + 0x6c) + -1, *(short *)(param_1 + 0x6c) = sVar5, sVar5 < 1)) {
      FUN_004ef180(param_1);
      return;
    }
    break;
  case 0x30:
    *(uint *)(param_1 + 0x10) = *(uint *)(param_1 + 0x10) & 0xffbfffff;
    if ((-1 < *(short *)(param_1 + 0x6c)) &&
       (sVar5 = *(short *)(param_1 + 0x6c) + -1, *(short *)(param_1 + 0x6c) = sVar5, sVar5 < 1)) {
      FUN_004ef180(param_1);
      return;
    }
    break;
  case 0x31:
    *(uint *)(param_1 + 0x10) = *(uint *)(param_1 + 0x10) & 0xffbfffff;
    if ((-1 < *(short *)(param_1 + 0x6c)) &&
       (sVar5 = *(short *)(param_1 + 0x6c) + -1, *(short *)(param_1 + 0x6c) = sVar5, sVar5 < 1)) {
      FUN_004ef180(param_1);
      return;
    }
    break;
  case 0x32:
    *(uint *)(param_1 + 0x10) = *(uint *)(param_1 + 0x10) & 0xffbfffff;
    if ((-1 < *(short *)(param_1 + 0x6c)) &&
       (sVar5 = *(short *)(param_1 + 0x6c) + -1, *(short *)(param_1 + 0x6c) = sVar5, sVar5 < 1)) {
      FUN_004ef180(param_1);
      return;
    }
    break;
  case 0x33:
    bVar2 = false;
    if (((uint)*(byte *)(param_1 + 0x2e) * 3 == 0) &&
       (cVar4 = FUN_0044f980(param_1 + 0x3d), cVar4 != '\0')) {
      bVar2 = true;
    }
    if (!bVar2) {
      FUN_0050bdd0();
      return;
    }
    FUN_004ef180(iVar3);
    return;
  case 0x34:
    *(uint *)(param_1 + 0x10) = *(uint *)(param_1 + 0x10) & 0xffbfffff;
    if ((-1 < *(short *)(param_1 + 0x6c)) &&
       (sVar5 = *(short *)(param_1 + 0x6c) + -1, *(short *)(param_1 + 0x6c) = sVar5, sVar5 < 1)) {
      FUN_004ef180(param_1);
      return;
    }
    break;
  case 0x35:
    *(uint *)(param_1 + 0x10) = *(uint *)(param_1 + 0x10) & 0xffbfffff;
    if ((-1 < *(short *)(param_1 + 0x6c)) &&
       (sVar5 = *(short *)(param_1 + 0x6c) + -1, *(short *)(param_1 + 0x6c) = sVar5, sVar5 < 1)) {
      FUN_004ef180(param_1);
      return;
    }
    break;
  case 0x36:
    *(uint *)(param_1 + 0x10) = *(uint *)(param_1 + 0x10) & 0xffbfffff;
    if ((-1 < *(short *)(param_1 + 0x6c)) &&
       (sVar5 = *(short *)(param_1 + 0x6c) + -1, *(short *)(param_1 + 0x6c) = sVar5, sVar5 < 1)) {
      FUN_004ef180(param_1);
      return;
    }
    break;
  case 0x37:
    process_building_smoke(param_1);
    return;
  case 0x38:
    FUN_00514d00(param_1);
    return;
  case 0x39:
    *(uint *)(param_1 + 0x10) = *(uint *)(param_1 + 0x10) & 0xffbfffff;
    if ((-1 < *(short *)(param_1 + 0x6c)) &&
       (sVar5 = *(short *)(param_1 + 0x6c) + -1, *(short *)(param_1 + 0x6c) = sVar5, sVar5 < 1)) {
      FUN_004ef180(param_1);
      return;
    }
    break;
  case 0x3a:
    FUN_00514f60(param_1);
    return;
  case 0x3b:
    FUN_00512350(param_1);
    return;
  case 0x3c:
    process_sparkle(param_1);
    return;
  case 0x3d:
    process_small_sparkle(param_1);
    return;
  case 0x3e:
    FUN_00515110(param_1);
    return;
  case 0x3f:
    if (0 < *(short *)(param_1 + 0x6c)) {
      FUN_00445c20(param_1);
      if ((*(ushort *)(iVar3 + 0x37) == 0) || (0x3b < *(ushort *)(iVar3 + 0x37))) {
        *(byte *)(iVar3 + 0x35) = *(byte *)(iVar3 + 0x35) | 0x10;
      }
      sVar5 = *(short *)(iVar3 + 0x6c) + -1;
      *(short *)(iVar3 + 0x6c) = sVar5;
      if (sVar5 < 1) {
        update_after_unit_alloc(iVar3);
        return;
      }
    }
    break;
  case 0x40:
    update_after_unit_alloc(param_1);
    return;
  case 0x41:
    if (((byte)level_flags & 4) != 0) {
      FUN_0050b110(param_1 + 0x3d,local_48);
      puVar7 = local_44;
      do {
        uVar1 = *(undefined2 *)puVar7;
        puVar7 = puVar7 + 2;
        FUN_00450610(2,uVar1);
      } while (puVar7 < &param_1);
    }
    update_after_unit_alloc(iVar3);
    return;
  case 0x42:
    FUN_00510cb0(param_1);
    return;
  case 0x43:
    FUN_00515e30(*(undefined1 *)(param_1 + 0x2f),param_1 + 0x3d,DAT_005aa4dc,3,FUN_005156b0,
                 FUN_005156f0);
    update_after_unit_alloc(iVar3);
    return;
  case 0x44:
    FUN_00515710(param_1);
    return;
  case 0x46:
    FUN_004772e0(param_1);
    return;
  case 0x47:
    FUN_00515e30(*(undefined1 *)(param_1 + 0x2f),param_1 + 0x3d,DAT_005aa4e0,3,FUN_00515650,
                 FUN_00515690);
    update_after_unit_alloc(iVar3);
    return;
  case 0x48:
    FUN_00515180(param_1);
    return;
  case 0x49:
    process_convert_wild(param_1);
    return;
  case 0x4b:
    FUN_00479890(param_1);
    return;
  case 0x4c:
    if (*(char *)(param_1 + 0x2f) != -1) {
      FUN_0041aeb0(*(char *)(param_1 + 0x2f) * 0xc65 + 0x89d1c8);
    }
    FUN_004ef180(iVar3);
    return;
  case 0x4d:
    FUN_00479ce0(param_1);
  }
  return;
}
