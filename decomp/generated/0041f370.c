/* Ghidra 12.1.3 pseudocode; entry 0041f370; add_circle.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void add_circle(undefined4 param_1,int param_2,short *param_3,byte param_4,int param_5)

{
  int iVar1;
  short sVar2;
  int iVar3;
  int iVar4;
  short local_28 [2];
  short local_24 [2];
  int local_20;
  int local_1c;
  int local_18;
  uint local_14;
  undefined4 local_10;
  undefined4 local_c;
  undefined4 local_8;
  undefined4 local_4;

  local_14 = DAT_0059bc30;
  iVar3 = 0;
  if (0 < param_2) {
    do {
      iVar4 = iVar3 + 1;
      convert_from_polar(param_1,param_2,iVar3,local_28,local_24);
      sVar2 = *param_3 + local_28[0];
      local_20 = (int)(short)(param_3[1] + local_24[0]);
      tex_struct_convert_to_tex_coords((int)sVar2,local_20,&local_4,&local_8);
      convert_from_polar(param_1,param_2,iVar4 % param_2,local_28,local_24);
      local_18 = (int)(short)(*param_3 + local_28[0]);
      local_1c = (int)(short)(param_3[1] + local_24[0]);
      tex_struct_convert_to_tex_coords(local_18,local_1c,&local_c,&local_10);
      iVar3 = tex_struct_is_point_visible((int)sVar2,local_20);
      if ((iVar3 != 0) || (iVar3 = tex_struct_is_point_visible(local_18,local_1c), iVar3 != 0)) {
        iVar3 = 0xff;
        if (param_5 != 0) {
          iVar3 = ((maybe_sin[local_14 & 0x7ff] << 6) >> 0x10) + 0x80;
        }
        iVar1 = (uint)param_4 * 4;
        set_texture_5(local_4,local_8,local_c,local_10,
                      ((uint)*(byte *)((int)system_palette_mem + iVar1 + 1) | iVar3 << 0x10) << 8 |
                      (uint)*(byte *)(system_palette_mem + param_4) << 0x10 |
                      (uint)*(byte *)((int)system_palette_mem + iVar1 + 2),1,0,0x40);
      }
      iVar3 = iVar4;
    } while (iVar4 < param_2);
  }
  return;
}
