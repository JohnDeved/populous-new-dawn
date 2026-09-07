/* Ghidra 12.1.3 pseudocode; entry 004a1f50; draw_hfx_ingame_window.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


/* WARNING: Enum "_D3DRENDERSTATETYPE": Some values do not have unique names */

void draw_hfx_ingame_window(int *param_1,ushort *param_2)

{
  undefined4 *puVar1;
  ushort uVar2;
  ushort uVar3;
  ushort uVar4;
  ushort uVar5;
  int iVar6;
  float fVar7;
  texture_mem_struct *ptVar8;
  uint uVar9;
  uint uVar10;
  uint uVar11;
  uint uVar12;
  int iVar13;
  uint uVar14;
  int iVar15;
  int iVar16;
  uint uVar17;
  uint uVar18;
  int iVar19;
  uint local_1c;

  ptVar8 = texture_mem_start;
  iVar15 = param_1[2];
  iVar16 = param_1[3] - param_1[1];
  iVar19 = (uint)*param_2 * 8 + hfx_0_addr;
  uVar9 = (uint)*(ushort *)(iVar19 + 4);
  uVar10 = (uint)*(ushort *)(iVar19 + 6);
  iVar19 = (uint)param_2[6] * 8 + hfx_0_addr;
  uVar2 = *(ushort *)(iVar19 + 4);
  uVar11 = (uint)*(ushort *)(iVar19 + 6);
  uVar14 = (uint)*(ushort *)(hfx_0_addr + 6 + (uint)param_2[1] * 8);
  uVar12 = (uint)*(ushort *)(hfx_0_addr + 4 + (uint)param_2[3] * 8);
  if (param_2[7] == 0) {
    local_1c = 0;
  }
  else {
    local_1c = (uint)*(ushort *)(hfx_0_addr + 6 + (uint)param_2[7] * 8);
  }
  if (((int)uVar9 <= iVar15 - *param_1) && ((int)uVar10 <= iVar16)) {
    uVar3 = param_2[4];
    if (uVar3 != 0) {
      iVar19 = param_1[1];
      iVar6 = *param_1;
      iVar16 = (param_1[3] - (iVar19 + uVar14)) - local_1c;
      iVar13 = (uint)uVar3 * 8 + hfx_0_addr;
      uVar4 = *(ushort *)(iVar13 + 4);
      uVar5 = *(ushort *)(iVar13 + 6);
      if (uVar3 != 0) {
        puVar1 = &texture_mem_start->vertex_shift_x;
        *puVar1 = (float)(iVar6 + uVar12);
        vertex_shift_y = (float)(iVar19 + uVar14);
        ptVar8->vertex_shift_y = vertex_shift_y;
        vertex_shift_x = *puVar1;
        fVar7 = (float)(int)(iVar15 + (-uVar12 - (iVar6 + uVar12)));
        add_polygon_quad_sprite_5a
                  (0,0,fVar7,(float)iVar16,fVar7 / (float)uVar4,(float)iVar16 / (float)uVar5,
                   &hfx_0_sprite_bank,uVar3,vertices_flags,0xc);
        ptVar8 = texture_mem_start;
        puVar1 = &texture_mem_start->vertex_shift_x;
        *puVar1 = 0;
        ptVar8->vertex_shift_y = 0;
        vertex_shift_x = *puVar1;
        vertex_shift_y = 0.0;
      }
    }
    uVar3 = param_2[1];
    uVar17 = CONCAT22((short)((uint)iVar16 >> 0x10),uVar3);
    uVar18 = uVar17;
    if (uVar3 != 0) {
      iVar15 = uVar9 + *param_1;
      if (iVar15 < (int)(param_1[2] - uVar9)) {
        fVar7 = (float)(int)((param_1[2] + uVar9 * -2) - *param_1);
        uVar18 = (uint)uVar3;
        add_polygon_quad_sprite_5a
                  ((float)iVar15,(float)param_1[1],fVar7,
                   (float)*(ushort *)(hfx_0_addr + 6 + uVar18 * 8),fVar7 / (float)uVar14,0x3f800000,
                   &hfx_0_sprite_bank,uVar17,vertices_flags,4);
      }
    }
    uVar3 = param_2[7];
    if (uVar3 != 0) {
      iVar15 = uVar9 + *param_1;
      if (iVar15 < (int)(param_1[2] - uVar9)) {
        fVar7 = (float)(int)((param_1[2] + uVar9 * -2) - *param_1);
        add_polygon_quad_sprite_5a
                  ((float)iVar15,(float)(int)(param_1[3] - local_1c),fVar7,
                   (float)*(ushort *)(hfx_0_addr + 6 + (uint)uVar3 * 8),fVar7 / (float)uVar14,
                   0x3f800000,&hfx_0_sprite_bank,CONCAT22((short)(uVar18 >> 0x10),uVar3),
                   vertices_flags,4);
      }
    }
    uVar3 = param_2[3];
    iVar15 = param_1[3] - uVar11;
    if (uVar3 != 0) {
      iVar16 = uVar10 + param_1[1];
      if (iVar16 < iVar15) {
        fVar7 = (float)(int)((iVar15 - param_1[1]) - uVar10);
        add_polygon_quad_sprite_5a
                  ((float)*param_1,(float)iVar16,
                   (float)*(ushort *)(hfx_0_addr + 4 + (uint)uVar3 * 8),fVar7,0x3f800000,
                   fVar7 / (float)uVar12,&hfx_0_sprite_bank,uVar3,vertices_flags,8);
      }
    }
    uVar3 = param_2[5];
    if (uVar3 != 0) {
      iVar16 = uVar10 + param_1[1];
      if (iVar16 < iVar15) {
        fVar7 = (float)(int)((iVar15 - param_1[1]) - uVar10);
        add_polygon_quad_sprite_5a
                  ((float)(int)(param_1[2] - uVar12),(float)iVar16,
                   (float)*(ushort *)(hfx_0_addr + 4 + (uint)uVar3 * 8),fVar7,0x3f800000,
                   fVar7 / (float)uVar12,&hfx_0_sprite_bank,uVar3,vertices_flags,8);
      }
    }
    add_polygon_rect_sprite(*param_1,param_1[1],(uint)*param_2 * 8 + hfx_0_addr);
    add_polygon_rect_sprite(param_1[2] - uVar9,param_1[1],(uint)param_2[2] * 8 + hfx_0_addr);
    add_polygon_rect_sprite(*param_1,param_1[3] - uVar11,(uint)param_2[6] * 8 + hfx_0_addr);
    add_polygon_rect_sprite
              (param_1[2] - (uint)uVar2,param_1[3] - uVar11,(uint)param_2[8] * 8 + hfx_0_addr);
  }
  return;
}
