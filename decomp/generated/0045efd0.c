/* Ghidra 12.1.3 pseudocode; entry 0045efd0; set_human_anim_no_tribe.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void set_human_anim_no_tribe(uint param_1,short param_2,short param_3,byte param_4)

{
  short sVar1;
  byte bVar2;
  int iVar3;
  int iVar4;
  short sVar5;
  vele_struct *pvVar6;
  uint uVar7;
  bool bVar8;
  uint local_14;
  uint local_10;
  int local_c;
  int local_8;
  int local_4;

  bVar8 = (param_4 & 2) == 0;
  bVar2 = (param_4 & 4) * '\x02';
  if ((param_4 & 1) == 0) {
    pvVar6 = vele_0_mem + (ushort)vfra_related_2[param_1 & 0xffff].vele_index;
    if (vele_0_mem < pvVar6) {
      do {
        if ((((bVar8) || ((pvVar6->flags & 0x1f0) != 0)) ||
            (((byte)(pvVar6->flags >> 8) & 0xfe) != 2)) &&
           (uVar7 = pvVar6->hspr_index + hspr_0_addr, hspr_0_addr < uVar7)) {
          vertices_flags = (uint)(ushort)(pvVar6->flags & 0xf | (ushort)bVar2);
          sVar1 = pvVar6->y;
          sVar5 = pvVar6->x;
          if (human_anim_draw_mode == '\x01') {
            local_8 = (int)sVar5;
            local_c = (int)sVar1;
            convert_sprite_coords(DAT_0089bc86,&local_8,&local_c);
            local_10 = (uint)*(ushort *)(uVar7 + 4);
            local_14 = (uint)*(ushort *)(uVar7 + 6);
            convert_sprite_coords(DAT_0089bc86,&local_10,&local_14);
            add_polygon_rect_sprite_2(param_2 + local_8,param_3 + local_c,uVar7,local_10,local_14);
          }
          else if ((human_anim_draw_mode == '\x02') && (0x280 < screen_width)) {
            iVar4 = (((int)screen_width << 8) / 0x280) * 0x1e;
            local_4 = (int)(iVar4 + (iVar4 >> 0x1f & 0x1fU)) >> 5;
            iVar4 = (((int)screen_height << 8) / 0x1e0) * 0x1e;
            iVar3 = (int)(iVar4 + (iVar4 >> 0x1f & 0x1fU)) >> 5;
            local_8 = (int)(sVar5 * local_4 + (sVar5 * local_4 >> 0x1f & 0xffU)) >> 8;
            iVar4 = sVar1 * iVar3;
            local_c = (int)(iVar4 + (iVar4 >> 0x1f & 0xffU)) >> 8;
            iVar4 = (uint)*(ushort *)(uVar7 + 4) * local_4;
            local_10 = (int)(iVar4 + (iVar4 >> 0x1f & 0xffU)) >> 8;
            iVar3 = (uint)*(ushort *)(uVar7 + 6) * iVar3;
            local_14 = (int)(iVar3 + (iVar3 >> 0x1f & 0xffU)) >> 8;
            add_polygon_rect_sprite_2(param_2 + local_8,param_3 + local_c,uVar7,local_10,local_14);
          }
          else {
            add_polygon_rect_sprite((int)sVar5 + (int)param_2,(int)sVar1 + (int)param_3,uVar7);
          }
        }
        pvVar6 = vele_0_mem + pvVar6->next_vele_index;
      } while (vele_0_mem < pvVar6);
    }
  }
  else {
    pvVar6 = vele_0_mem + (ushort)vfra_related_2[param_1 & 0xffff].vele_index;
    if (vele_0_mem < pvVar6) {
      do {
        if ((((bVar8) || ((pvVar6->flags & 0x1f0) != 0)) ||
            (((byte)(pvVar6->flags >> 8) & 0xfe) != 2)) &&
           (uVar7 = pvVar6->hspr_index + hspr_0_addr, hspr_0_addr < uVar7)) {
          vertices_flags = (uint)(byte)(((byte)pvVar6->flags & 0xf | bVar2) ^ 1);
          sVar1 = pvVar6->y;
          sVar5 = -(pvVar6->x + *(short *)(uVar7 + 4));
          if (human_anim_draw_mode == '\x01') {
            local_8 = (int)sVar5;
            local_c = (int)sVar1;
            convert_sprite_coords(DAT_0089bc86,&local_8,&local_c);
            local_10 = (uint)*(ushort *)(uVar7 + 4);
            local_14 = (uint)*(ushort *)(uVar7 + 6);
            convert_sprite_coords(DAT_0089bc86,&local_10,&local_14);
            add_polygon_rect_sprite_2(param_2 + local_8,param_3 + local_c,uVar7,local_10,local_14);
          }
          else if ((human_anim_draw_mode == '\x02') && (0x280 < screen_width)) {
            iVar4 = (((int)screen_width << 8) / 0x280) * 0x1e;
            local_4 = (int)(iVar4 + (iVar4 >> 0x1f & 0x1fU)) >> 5;
            iVar4 = (((int)screen_height << 8) / 0x1e0) * 0x1e;
            iVar3 = (int)(iVar4 + (iVar4 >> 0x1f & 0x1fU)) >> 5;
            local_8 = (int)(sVar5 * local_4 + (sVar5 * local_4 >> 0x1f & 0xffU)) >> 8;
            iVar4 = sVar1 * iVar3;
            local_c = (int)(iVar4 + (iVar4 >> 0x1f & 0xffU)) >> 8;
            iVar4 = (uint)*(ushort *)(uVar7 + 4) * local_4;
            local_10 = (int)(iVar4 + (iVar4 >> 0x1f & 0xffU)) >> 8;
            iVar3 = (uint)*(ushort *)(uVar7 + 6) * iVar3;
            local_14 = (int)(iVar3 + (iVar3 >> 0x1f & 0xffU)) >> 8;
            add_polygon_rect_sprite_2(param_2 + local_8,param_3 + local_c,uVar7,local_10,local_14);
          }
          else {
            add_polygon_rect_sprite((int)sVar5 + (int)param_2,(int)sVar1 + (int)param_3,uVar7);
          }
        }
        pvVar6 = vele_0_mem + pvVar6->next_vele_index;
      } while (vele_0_mem < pvVar6);
    }
  }
  vertices_flags = 0;
  human_anim_draw_mode = 0;
  return;
}
