/* Ghidra 12.1.3 pseudocode; entry 0049d690; FUN_0049d690.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_0049d690(int param_1)

{
  int iVar1;
  int iVar2;
  int iVar3;
  int iVar4;
  int iVar5;
  undefined4 uVar6;
  uint uVar7;
  int iVar8;
  uint uVar9;

  iVar1 = parameterize_by_screen_width(*(undefined4 *)(param_1 + 0x37));
  iVar2 = parameterize_by_screen_height(*(undefined4 *)(param_1 + 0x3b));
  iVar3 = parameterize_by_screen_width(*(int *)(param_1 + 0x47) + *(int *)(param_1 + 0x37));
  iVar4 = parameterize_by_screen_height(*(int *)(param_1 + 0x4b) + *(int *)(param_1 + 0x3b));
  if (*(int *)(param_1 + 0x10) != 0) {
    if (*(int *)(param_1 + 8) == 0) {
      vertices_flags = vertices_flags | 8;
    }
    else {
      vertices_flags = vertices_flags & 0xfffffff7;
    }
    FUN_004a1dd0(param_1,&DAT_005cac80,&DAT_005cac98,&DAT_005cacb0);
    if ((*(int *)(param_1 + 0x5f) != 0) && (iVar8 = *(int *)(param_1 + 0x4f), iVar8 != 0)) {
      if (*(int *)(param_1 + 8) == 0) {
        uVar7 = (uint)*(ushort *)(hfx_0_addr + 0x4e + iVar8 * 8);
        uVar9 = (uint)*(ushort *)(hfx_0_addr + 0x4c + iVar8 * 8);
        iVar8 = hfx_0_addr + 0x48 + iVar8 * 8;
        if (screen_width != 0x280) {
          if (DAT_005ca944 != screen_width) {
            DAT_005ca944 = screen_width;
            DAT_005ca948 = ((int)screen_width << 0x10) / 0x280;
          }
          uVar7 = (int)(uVar7 * DAT_005ca948) >> 0x10;
          uVar9 = (int)(uVar9 * DAT_005ca948) >> 0x10;
        }
        iVar5 = (iVar2 + iVar4) / 2 - (int)uVar7 / 2;
      }
      else {
        if ((*(int *)(param_1 + 0x18) != 0) || (iVar5 = 0, *(int *)(param_1 + 0x1c) != 0)) {
          iVar5 = 1;
        }
        iVar8 = (iVar5 * 0x12 + iVar8) * 8 + hfx_0_addr;
        uVar7 = (uint)*(ushort *)(iVar8 + 6);
        uVar9 = (uint)*(ushort *)(iVar8 + 4);
        if (screen_width != 0x280) {
          if (DAT_005ca944 != screen_width) {
            DAT_005ca944 = screen_width;
            DAT_005ca948 = ((int)screen_width << 0x10) / 0x280;
          }
          uVar7 = (int)(uVar7 * DAT_005ca948) >> 0x10;
          uVar9 = (int)(uVar9 * DAT_005ca948) >> 0x10;
        }
        iVar5 = (iVar2 + iVar4) / 2 - (int)uVar7 / 2;
      }
      add_polygon_rect_sprite_2((iVar3 + iVar1) / 2 - (int)uVar9 / 2,iVar5,iVar8,uVar9,uVar7);
    }
    iVar8 = hfx_0_addr;
    if (*(char *)(param_1 + 0x5a) == '\x03') {
      if (((byte)sprite_animation_counter & 2) != 0) {
        uVar6 = parameterize_by_screen_height
                          ((uint)(*(ushort *)(hfx_0_addr + 0xaf6) >> 1) + *(int *)(param_1 + 0x3b),
                           hfx_0_addr + 0xaf0);
        uVar6 = parameterize_by_screen_width
                          ((uint)(*(ushort *)(iVar8 + 0xaf4) >> 1) + *(int *)(param_1 + 0x37),uVar6)
        ;
        add_polygon_rect_sprite(uVar6);
      }
    }
    else if (*(char *)(param_1 + 0x5a) == '\x04') {
      uVar9 = (uint)*(ushort *)(hfx_0_addr + 0x20fe);
      uVar7 = (uint)*(ushort *)(hfx_0_addr + 0x20fc);
      if (screen_width != 0x280) {
        if (DAT_005ca944 != screen_width) {
          DAT_005ca944 = screen_width;
          DAT_005ca948 = ((int)screen_width << 0x10) / 0x280;
        }
        uVar9 = (int)(uVar9 * DAT_005ca948) >> 0x10;
        uVar7 = (int)(uVar7 * DAT_005ca948) >> 0x10;
      }
      add_polygon_rect_sprite_2
                ((iVar3 + iVar1) / 2 - (int)uVar7 / 2,(iVar2 + iVar4) / 2 - (int)uVar9 / 2,
                 hfx_0_addr + 0x20f8,uVar7,uVar9);
    }
    vertices_flags = vertices_flags & 0xfffffff7;
  }
  return;
}
