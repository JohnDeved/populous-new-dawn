/* Ghidra 12.1.3 pseudocode; entry 00495520; FUN_00495520.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


char FUN_00495520(int param_1,undefined1 *param_2)

{
  ushort uVar1;
  unit_struct *puVar2;
  char cVar3;
  short sVar4;
  int iVar5;
  undefined4 uVar6;
  uint uVar7;
  unit_struct *puVar8;
  unit_struct *puVar9;
  char local_d;
  uint local_c;
  uint local_8;
  char local_4 [4];

  local_d = '\0';
  if (*(char *)(param_1 + 0x2d) == '\0') {
    cVar3 = FUN_00436b90(param_1,*param_2);
    if (cVar3 == '\0') {
      local_d = '\x01';
    }
    else {
      *(undefined1 *)(param_1 + 0xaa) = 0;
      *(undefined2 *)(param_1 + 0x89) = 0;
      puVar9 = unit_land_array[*(ushort *)(param_2 + 6)];
      puVar8 = puVar9;
      if ((puVar9->unit_class == '\x02') &&
         (sVar4 = puVar9->loc_2_y, puVar8 = (unit_struct *)0x0, sVar4 != 0)) {
        puVar8 = unit_land_array[sVar4];
        *(short *)(param_2 + 6) = sVar4;
      }
      if (((puVar8 != (unit_struct *)0x0) &&
          (local_8 = (uint)(ushort)puVar8->unit_index,
          *(char *)(param_1 + 0x2f) == puVar8->tribe_index)) &&
         (cVar3 = FUN_004b9cc0(param_1,puVar8), cVar3 != '\0')) {
        *(undefined2 *)(param_1 + 0x89) = (undefined2)local_8;
        FUN_004b9fc0(puVar8,&local_c);
        FUN_00402e70(param_1,&local_c);
      }
      if (*(short *)(param_1 + 0x89) == 0) {
        sVar4 = FUN_00436c20();
        if (sVar4 != 0) {
          cVar3 = FUN_00436be0(param_1);
          local_8 = (uint)cVar3;
          if (-1 < (int)local_8) {
            if (puVar9->unit_class == '\t') {
              FUN_004b9fc0();
            }
            else {
              FUN_004044b0(puVar9,local_4);
            }
            FUN_00438730(sVar4,3,local_4,0);
            FUN_00436d00(param_1,sVar4,local_8);
          }
        }
      }
      *(undefined1 *)(param_1 + 0x2d) = 1;
      *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) | 0x40000000;
    }
  }
  uVar1 = *(ushort *)(param_1 + 0x89);
  puVar9 = (unit_struct *)0x0;
  if (((uVar1 != 0) && (puVar8 = unit_land_array[uVar1], (*(byte *)&puVar8->flags_2 & 1) == 0)) &&
     (puVar8->unit_class != '\0')) {
    puVar9 = puVar8;
  }
  if (puVar9 == (unit_struct *)0x0) {
    local_d = '\x01';
  }
  if (local_d == '\0') {
    uVar7 = *(uint *)(param_1 + 0xc) & 0x40000000;
    if (uVar7 != 0) {
      *(uint *)(param_1 + 0x10) = *(uint *)(param_1 + 0x10) & 0xfffefff8;
    }
    switch(*(undefined1 *)(param_1 + 0x2d)) {
    case 1:
      local_4[0] = '\0';
      if (uVar7 != 0) {
        *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) & 0xbfffffff;
        puVar8 = unit_land_array[uVar1];
        FUN_00409dd0(puVar8,&local_c);
        local_8 = local_c;
        FUN_00432520(param_1,&local_8);
        FUN_00402e70(param_1,&local_8);
        if (*(short *)(param_1 + 0x78) == 0) {
          sVar4._0_1_ = puVar8->num_points;
          sVar4._1_1_ = puVar8->tex_size_type;
          if (sVar4 == 0) {
            FUN_004982e0(puVar8,&local_c);
          }
          else {
            puVar2 = unit_land_array[sVar4];
            if (((unit_type_array_building[(byte)puVar2->unit_type].field_0x49 & 1) == 0) ||
               (iVar5 = FUN_00405050(param_1 + 0x3d),
               (*(ushort *)(iVar5 + 8) & 0x3ff) != puVar2->unit_index)) {
              FUN_004b9fc0(puVar8,&local_c);
            }
            else {
              FUN_004ba130();
              FUN_004e9b40(param_1);
            }
            uVar7 = *(uint *)(param_1 + 0x10) & 0xfffefff8;
            *(uint *)(param_1 + 0x10) = uVar7;
            *(uint *)(param_1 + 0x10) = uVar7 | 1;
          }
        }
        else {
          FUN_004b9fc0(puVar8,&local_c);
        }
        FUN_004e9d80(param_1,&local_c);
        uVar6 = FUN_004324c0(param_1 + 0x3d,&local_c);
        FUN_00401ae0(param_1,uVar6);
        FUN_004958d0(param_1,0xf);
        cVar3 = FUN_00432da0(param_1 + 0x3d,0x70,&local_c,0x600);
        if (cVar3 == '\0') {
          *(byte *)(param_1 + 0x76) = *(byte *)(param_1 + 0x76) | 8;
        }
      }
      if ((*(char *)(param_1 + 0xa8) == '\x0f') && (cVar3 = FUN_00439480(param_1), cVar3 != '\0')) {
        FUN_004d58c0(param_1,0);
        local_4[0] = '\x02';
      }
      break;
    case 2:
      local_4[0] = FUN_004958f0(param_1,param_2);
      break;
    case 3:
      local_4[0] = FUN_00495d70(param_1,param_2);
      break;
    case 4:
      local_4[0] = FUN_00496220(param_1,param_2);
      break;
    case 5:
      local_4[0] = '\x02';
      break;
    case 6:
      local_4[0] = '\x02';
      break;
    case 7:
      local_4[0] = FUN_00496750(param_1,param_2);
      break;
    case 8:
      local_4[0] = FUN_00497030(param_1,param_2);
      break;
    case 9:
      local_4[0] = FUN_00497690(param_1,param_2);
      break;
    default:
      local_4[0] = (char)local_8;
    }
    if (local_4[0] != '\0') {
      *(ushort *)(param_1 + 0x76) = *(ushort *)(param_1 + 0x76) & 0xfff7;
      puVar9->field_0x9c = puVar9->field_0x9c | 1;
      *(char *)(param_1 + 0x2d) = local_4[0];
      *(uint *)(param_1 + 0xc) = *(uint *)(param_1 + 0xc) | 0x40000000;
    }
  }
  return local_d;
}
