/* Ghidra 12.1.3 pseudocode; entry 00512700; process_lightning.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void process_lightning(int param_1)

{
  int iVar1;
  int iVar2;
  int *piVar3;
  short *psVar4;
  ushort uVar5;
  short sVar6;
  uint uVar7;
  unit_struct *puVar8;
  int local_334;
  uint local_330;
  short local_32c;
  short local_328;
  ushort local_326;
  int local_324;
  int local_320;
  ushort local_31c [398];

  local_334 = param_1;
  iVar2 = 0;
  FUN_0049c7a0(param_1 + 0x3d,&local_320,&local_324);
  if (*(char *)(param_1 + 0x2d) == '\0') {
    *(undefined2 *)(param_1 + 0x72) = 0x17c;
    *(undefined1 *)(param_1 + 0x2d) = 1;
    uVar5 = 0;
    local_330 = *(uint *)(param_1 + 0x3d);
    local_32c = *(short *)(param_1 + 0x41) + 200;
    do {
      iVar1 = alloc_unit(7,0x3c,*(undefined1 *)(param_1 + 0x2f),param_1 + 0x3d);
      if (iVar1 != 0) {
        if ((*(byte *)(iVar1 + 0xe) & 0x10) == 0) {
          empty_unit_function(iVar1);
          *(undefined1 *)(iVar1 + 0x2c) = 0xb;
        }
        if (iVar2 % 5 == 0) {
          sunlight_update_unit_landscape(iVar1,1,1,0);
        }
        *(ushort *)(iVar1 + 0x57) = uVar5;
        *(undefined2 *)(local_334 + 0x6e) = *(undefined2 *)(iVar1 + 0x24);
        local_334 = iVar1;
      }
      iVar2 = iVar2 + 1;
      uVar5 = uVar5 + 0x40 & 0x7ff;
    } while (iVar2 < 0x20);
  }
  sVar6 = *(short *)(param_1 + 0x72);
  iVar2 = 0;
  if (0 < local_324) {
    piVar3 = &local_320;
    do {
      uVar5 = *(ushort *)(piVar3 + 1);
      local_32c = 0;
      local_328 = (uVar5 & 0xfe) << 8;
      local_326 = uVar5 & 0xfe00;
      local_330 = CONCAT22(uVar5,local_328) & 0xfe00ffff;
      iVar1 = calc_squared_distance_toroidal(param_1 + 0x3d,&local_328);
      if (iVar1 <= (int)sVar6 * (int)sVar6) {
        iVar1 = (int)*(short *)(*piVar3 + 4);
        psVar4 = (short *)(*piVar3 + 4);
        if (iVar1 != *(int *)(param_1 + 0x76)) {
          *psVar4 = *psVar4 + (short)((*(int *)(param_1 + 0x76) - iVar1) /
                                     (int)*(short *)(param_1 + 0x6c));
          if (*(short *)(*piVar3 + 4) < 0) {
            *(short *)(*piVar3 + 4) = 0;
          }
          if (0x400 < *(short *)(*piVar3 + 4)) {
            *(short *)(*piVar3 + 4) = 0x400;
          }
        }
      }
      piVar3 = piVar3 + 2;
      iVar2 = iVar2 + 1;
    } while (iVar2 < local_324);
  }
  uVar7 = CONCAT22((short)((uint)iVar2 >> 0x10),
                   CONCAT11((char)((ushort)*(undefined2 *)(param_1 + 0x3f) >> 8),
                            (char)((ushort)*(undefined2 *)(param_1 + 0x3d) >> 8))) & 0xfffffefe;
  land_level_processing_1(uVar7,6,1);
  FUN_0044f2f0(1,uVar7,6,0xffffffff);
  puVar8 = unit_land_array[*(ushort *)(param_1 + 0x6e)];
  if (unit_land_array[0] < puVar8) {
    do {
      iVar2 = alloc_unit(7,0x3d,*(undefined1 *)(param_1 + 0x2f),&puVar8->pos);
      if (iVar2 != 0) {
        *(undefined2 *)(iVar2 + 0x5f) = 0x30;
        *(undefined2 *)(iVar2 + 0x57) = puVar8->pos_x1;
      }
      local_330 = *(uint *)(param_1 + 0x3d);
      local_32c = *(short *)(param_1 + 0x41);
      move_pos_angle_length
                (&local_330,CONCAT22((short)(local_330 >> 0x10),puVar8->pos_x1),
                 CONCAT22((short)((uint)&local_330 >> 0x10),*(undefined2 *)(param_1 + 0x74)));
      add_unit_to_cell(puVar8,&local_330);
      puVar8->pos_x1 = puVar8->pos_x1 + 0x5b & 0x7ff;
      puVar8->pos_y1 = puVar8->pos_y1 + 0xd8 & 0x7ff;
      puVar8 = unit_land_array[*(ushort *)&puVar8->field_0x6e];
    } while (unit_land_array[0] < puVar8);
  }
  iVar2 = *(int *)(param_1 + 0x7a) / (int)*(short *)(param_1 + 0x6c);
  sVar6 = (short)iVar2;
  *(short *)(param_1 + 0x72) = *(short *)(param_1 + 0x72) + sVar6;
  *(short *)(param_1 + 0x74) = *(short *)(param_1 + 0x74) + sVar6;
  *(int *)(param_1 + 0x7a) = *(int *)(param_1 + 0x7a) - iVar2;
  sVar6 = *(short *)(param_1 + 0x6c) + -1;
  *(short *)(param_1 + 0x6c) = sVar6;
  if (sVar6 == 0) {
    puVar8 = unit_land_array[*(ushort *)(param_1 + 0x6e)];
    if (unit_land_array[0] < puVar8) {
      do {
        update_after_unit_alloc(puVar8);
        puVar8 = unit_land_array[*(ushort *)&puVar8->field_0x6e];
      } while (unit_land_array[0] < puVar8);
    }
    *(undefined2 *)(param_1 + 0x6e) = 0;
    update_after_unit_alloc(param_1);
  }
  return;
}
