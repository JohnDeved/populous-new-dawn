/* Ghidra 12.1.3 pseudocode; entry 0041efb0; add_tribe_unit_to_globe_2.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void add_tribe_unit_to_globe_2(int param_1,int param_2)

{
  undefined4 uVar1;
  int iVar2;
  uint uVar3;
  int iVar4;
  int iVar5;
  uint uVar6;
  int iVar7;
  undefined2 local_2c;
  short local_28;
  short sStack_26;
  undefined1 local_24 [4];
  undefined1 local_20 [4];
  int local_1c;
  undefined4 local_18;
  undefined4 local_14;
  undefined4 local_10;
  undefined4 local_c;
  undefined4 local_8;
  undefined4 local_4;

  if ((((byte)level_flags & 4) != 0) &&
     (local_2c = CONCAT11((char)((ushort)*(undefined2 *)(param_2 + 0x3f) >> 8),
                          (char)((ushort)*(undefined2 *)(param_2 + 0x3d) >> 8)),
     (*(byte *)(&game_state.level_data[0].flags + ((local_2c & 0xfe) * 2 | local_2c & 0xfe00)) & 8)
     == 0)) {
    return;
  }
  uVar1 = *(undefined4 *)(param_2 + 0x3d);
  tex_struct_convert_to_tex_coords
            ((int)*(short *)(param_2 + 0x3d),(int)*(short *)(param_2 + 0x3f),&local_4,&local_8);
  iVar2 = tex_struct_is_point_visible
                    ((int)*(short *)(param_2 + 0x3d),(int)*(short *)(param_2 + 0x3f));
  uVar3 = 0;
  do {
    uVar6 = uVar3 + 1;
    convert_from_polar(0x400,0x20,uVar3,local_24,local_20);
    local_28 = (short)uVar1;
    iVar7 = (int)(short)(local_24._0_2_ + local_28);
    sStack_26 = (short)((uint)uVar1 >> 0x10);
    local_1c = (int)(short)(local_20._0_2_ + sStack_26);
    tex_struct_convert_to_tex_coords(iVar7,local_1c,&local_c,&local_10);
    uVar3 = (int)uVar6 >> 0x1f;
    convert_from_polar(0x400,0x20,((uVar6 ^ uVar3) - uVar3 & 0x1f ^ uVar3) - uVar3,local_24,local_20
                      );
    iVar5 = (int)(short)(local_24._0_2_ + local_28);
    iVar4 = (int)(short)(local_20._0_2_ + sStack_26);
    tex_struct_convert_to_tex_coords(iVar5,iVar4,&local_14,&local_18);
    if (iVar2 == 0) {
      iVar7 = tex_struct_is_point_visible(iVar7,local_1c);
      if (iVar7 != 0) goto LAB_0041f10c;
      iVar4 = tex_struct_is_point_visible(iVar5,iVar4);
      if (iVar4 != 0) goto LAB_0041f10c;
    }
    else {
LAB_0041f10c:
      add_3_vertices(local_4,local_8,local_c,local_10,local_14,local_18,
                     tribe_icon_offset[*(char *)(param_1 + 0xc22) * 4]);
    }
    uVar3 = uVar6;
    if (0x1f < (int)uVar6) {
      return;
    }
  } while( true );
}
