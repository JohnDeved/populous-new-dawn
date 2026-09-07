/* Ghidra 12.1.3 pseudocode; entry 0045f4a0; set_human_anim_tribe.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void set_human_anim_tribe(uint param_1,short param_2,short param_3,byte param_4,char param_5)

{
  ushort uVar1;
  short sVar2;
  byte bVar3;
  bool bVar4;
  ushort uVar5;
  int iVar6;
  int iVar7;
  short sVar8;
  vele_struct *pvVar9;
  uint uVar10;
  bool bVar11;
  uint local_14;
  uint local_10;
  int local_c;
  int local_8;
  int local_4;

  bVar11 = (param_4 & 2) == 0;
  bVar3 = (param_4 & 4) * '\x02';
  if ((param_4 & 1) == 0) {
    pvVar9 = vele_0_mem + (ushort)vfra_related_2[param_1 & 0xffff].vele_index;
    if (vele_0_mem < pvVar9) {
      do {
        uVar1 = pvVar9->flags;
        bVar4 = false;
        uVar5 = (uVar1 & 0x1f0) >> 4;
        if (uVar5 == 0) {
          if ((((byte)(uVar1 >> 8) & 0xfe) != 2) || (bVar11)) goto LAB_0045f541;
        }
        else if ((uVar5 == 1) && ((int)param_5 == (uint)(uVar1 >> 9))) {
LAB_0045f541:
          bVar4 = true;
        }
        if ((bVar4) && (uVar10 = pvVar9->hspr_index + hspr_0_addr, hspr_0_addr < uVar10)) {
          vertices_flags = (uint)(ushort)(uVar1 & 0xf | (ushort)bVar3);
          sVar2 = pvVar9->y;
          sVar8 = pvVar9->x;
          if (human_anim_draw_mode == '\x01') {
            local_8 = (int)sVar8;
            local_c = (int)sVar2;
            convert_sprite_coords(DAT_0089bc86,&local_8,&local_c);
            local_10 = (uint)*(ushort *)(uVar10 + 4);
            local_14 = (uint)*(ushort *)(uVar10 + 6);
            convert_sprite_coords(DAT_0089bc86,&local_10,&local_14);
            add_polygon_rect_sprite_2(param_2 + local_8,param_3 + local_c,uVar10,local_10,local_14);
          }
          else if ((human_anim_draw_mode == '\x02') && (0x280 < screen_width)) {
            iVar7 = (((int)screen_width << 8) / 0x280) * 0x1e;
            local_4 = (int)(iVar7 + (iVar7 >> 0x1f & 0x1fU)) >> 5;
            iVar7 = (((int)screen_height << 8) / 0x1e0) * 0x1e;
            iVar6 = (int)(iVar7 + (iVar7 >> 0x1f & 0x1fU)) >> 5;
            local_8 = (int)(sVar8 * local_4 + (sVar8 * local_4 >> 0x1f & 0xffU)) >> 8;
            iVar7 = sVar2 * iVar6;
            local_c = (int)(iVar7 + (iVar7 >> 0x1f & 0xffU)) >> 8;
            iVar7 = (uint)*(ushort *)(uVar10 + 4) * local_4;
            local_10 = (int)(iVar7 + (iVar7 >> 0x1f & 0xffU)) >> 8;
            iVar6 = (uint)*(ushort *)(uVar10 + 6) * iVar6;
            local_14 = (int)(iVar6 + (iVar6 >> 0x1f & 0xffU)) >> 8;
            add_polygon_rect_sprite_2(param_2 + local_8,param_3 + local_c,uVar10,local_10,local_14);
          }
          else {
            add_polygon_rect_sprite((int)param_2 + (int)sVar8,(int)param_3 + (int)sVar2,uVar10);
          }
        }
        pvVar9 = vele_0_mem + pvVar9->next_vele_index;
      } while (vele_0_mem < pvVar9);
    }
  }
  else {
    pvVar9 = vele_0_mem + (ushort)vfra_related_2[param_1 & 0xffff].vele_index;
    if (vele_0_mem < pvVar9) {
      do {
        uVar1 = pvVar9->flags;
        bVar4 = false;
        uVar5 = (uVar1 & 0x1f0) >> 4;
        if (uVar5 == 0) {
          if ((((byte)(uVar1 >> 8) & 0xfe) != 2) || (bVar11)) goto LAB_0045f7b0;
        }
        else if ((uVar5 == 1) && ((int)param_5 == (uint)(uVar1 >> 9))) {
LAB_0045f7b0:
          bVar4 = true;
        }
        if ((bVar4) && (uVar10 = pvVar9->hspr_index + hspr_0_addr, hspr_0_addr < uVar10)) {
          vertices_flags = (uint)(byte)(((byte)uVar1 & 0xf | bVar3) ^ 1);
          sVar2 = pvVar9->y;
          sVar8 = -(pvVar9->x + *(short *)(uVar10 + 4));
          if (human_anim_draw_mode == '\x01') {
            local_8 = (int)sVar8;
            local_c = (int)sVar2;
            convert_sprite_coords(DAT_0089bc86,&local_8,&local_c);
            local_10 = (uint)*(ushort *)(uVar10 + 4);
            local_14 = (uint)*(ushort *)(uVar10 + 6);
            convert_sprite_coords(DAT_0089bc86,&local_10,&local_14);
            add_polygon_rect_sprite_2(param_2 + local_8,param_3 + local_c,uVar10,local_10,local_14);
          }
          else if ((human_anim_draw_mode == '\x02') && (0x280 < screen_width)) {
            iVar7 = (((int)screen_width << 8) / 0x280) * 0x1e;
            local_4 = (int)(iVar7 + (iVar7 >> 0x1f & 0x1fU)) >> 5;
            iVar7 = (((int)screen_height << 8) / 0x1e0) * 0x1e;
            iVar6 = (int)(iVar7 + (iVar7 >> 0x1f & 0x1fU)) >> 5;
            local_8 = (int)(sVar8 * local_4 + (sVar8 * local_4 >> 0x1f & 0xffU)) >> 8;
            iVar7 = sVar2 * iVar6;
            local_c = (int)(iVar7 + (iVar7 >> 0x1f & 0xffU)) >> 8;
            iVar7 = (uint)*(ushort *)(uVar10 + 4) * local_4;
            local_10 = (int)(iVar7 + (iVar7 >> 0x1f & 0xffU)) >> 8;
            iVar6 = (uint)*(ushort *)(uVar10 + 6) * iVar6;
            local_14 = (int)(iVar6 + (iVar6 >> 0x1f & 0xffU)) >> 8;
            add_polygon_rect_sprite_2(param_2 + local_8,param_3 + local_c,uVar10,local_10,local_14);
          }
          else {
            add_polygon_rect_sprite((int)param_2 + (int)sVar8,(int)param_3 + (int)sVar2,uVar10);
          }
        }
        pvVar9 = vele_0_mem + pvVar9->next_vele_index;
      } while (vele_0_mem < pvVar9);
    }
  }
  vertices_flags = 0;
  human_anim_draw_mode = 0;
  return;
}
