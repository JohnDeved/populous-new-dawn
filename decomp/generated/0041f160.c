/* Ghidra 12.1.3 pseudocode; entry 0041f160; add_tribe_unit_to_globe.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void add_tribe_unit_to_globe(int param_1,int param_2)

{
  unit_struct *puVar1;
  short sVar2;
  short sVar3;
  int iVar4;
  short sVar5;
  uint uVar6;
  unit_struct *puVar7;
  uint uVar8;
  int local_30;
  undefined4 local_2c;
  short local_28 [2];
  short local_24 [2];
  int local_20;
  int local_1c;
  undefined4 local_18;
  undefined4 local_14;
  undefined4 local_10;
  undefined4 local_c;
  undefined4 local_8;
  undefined4 local_4;

  local_30 = FUN_0040b450(param_2);
  if (local_30 == 0) {
    local_30 = 2;
  }
  local_2c = *(undefined4 *)(param_2 + 0x3d);
  tex_struct_convert_to_tex_coords
            ((int)*(short *)(param_2 + 0x3d),(int)*(short *)(param_2 + 0x3f),&local_4,&local_8);
  local_1c = tex_struct_is_point_visible
                       ((int)*(short *)(param_2 + 0x3d),(int)*(short *)(param_2 + 0x3f));
  uVar6 = 0;
  do {
    uVar8 = uVar6 + 1;
    convert_from_polar(local_30 << 9,0x20,uVar6,local_28,local_24);
    sVar2 = (short)local_2c + local_28[0];
    local_20 = (int)(short)(local_2c._2_2_ + local_24[0]);
    tex_struct_convert_to_tex_coords((int)sVar2,local_20,&local_c,&local_10);
    uVar6 = (int)uVar8 >> 0x1f;
    convert_from_polar(local_30 << 9,0x20,((uVar8 ^ uVar6) - uVar6 & 0x1f ^ uVar6) - uVar6,local_28,
                       local_24);
    sVar5 = (short)local_2c + local_28[0];
    sVar3 = local_2c._2_2_ + local_24[0];
    tex_struct_convert_to_tex_coords((int)sVar5,(int)sVar3,&local_14,&local_18);
    if (((local_1c != 0) || (iVar4 = tex_struct_is_point_visible((int)sVar2,local_20), iVar4 != 0))
       || (iVar4 = tex_struct_is_point_visible((int)sVar5,(int)sVar3), iVar4 != 0)) {
      add_3_vertices(local_4,local_8,local_c,local_10,local_14,local_18,
                     CONCAT31(*(char *)(param_1 + 0xc22) >> 7,
                              tribe_icon_offset[*(char *)(param_1 + 0xc22) * 4]));
    }
    uVar6 = uVar8;
  } while ((int)uVar8 < 0x20);
  iVar4 = 0;
  puVar7 = (unit_struct *)0x0;
  if (((*(ushort *)(param_2 + 0x86) != 0) &&
      (puVar1 = unit_land_array[*(ushort *)(param_2 + 0x86)], (*(byte *)&puVar1->flags_2 & 1) == 0))
     && (puVar1->unit_class != '\0')) {
    puVar7 = puVar1;
  }
  if (puVar7 != (unit_struct *)0x0) {
    if (puVar7->unit_type == '\x04') {
      iVar4 = 0x500;
    }
    else if (puVar7->unit_type == '\x06') {
      iVar4 = get_unit_circle_length(puVar7);
      iVar4 = iVar4 << 8;
    }
  }
  if (iVar4 != 0) {
    add_circle(iVar4,0x20,&local_2c,
               CONCAT31((int3)(char)((ushort)sVar5 >> 8),
                        (&DAT_0059bc19)[*(char *)(param_1 + 0xc22) * 4]),0);
  }
  return;
}
