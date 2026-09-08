/* Ghidra 12.1.3 pseudocode; entry 0042df80; add_3_vertices_2.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */
/* WARNING: Enum "_D3DRENDERSTATETYPE": Some values do not have unique names */

void __thiscall
add_3_vertices_2(int param_1,int param_2,uint param_3,uint param_4,uint param_5,uint param_6,
                uint param_7,uint param_8)

{
  longlong lVar1;
  uint uVar2;
  float fVar3;
  uint uVar4;
  sbyte sVar5;
  int *piVar6;
  uint uVar7;
  uint uVar8;
  uint uVar9;
  uint uVar10;
  int local_58;
  int local_54;
  uint local_50;
  uint local_4c;
  int local_48;
  int local_44;
  int local_40;
  uint local_3c;
  uint local_38;
  int local_34;
  int local_30;
  int local_2c;
  uint local_28;
  uint local_24;
  int local_20;
  undefined4 local_1c;
  float local_18;
  float local_14;
  float local_10;
  float local_c;
  float local_8;

  uVar9 = param_7 + param_3;
  uVar7 = param_8 + param_4;
  uVar2 = uVar7 | uVar9;
  while (uVar4 = param_7, ((int)uVar2 >> 1 & 1U) == 0) {
    uVar10 = (int)uVar9 >> 1;
    uVar8 = (int)uVar7 >> 1;
    if (*(char *)((uVar8 & 0x7f) * 0x100 + (uVar10 & 0x7f) + param_2) == '\0') break;
    add_3_vertices_2(param_2,param_5,param_6,uVar10,uVar8,param_3,param_4);
    uVar9 = uVar4 + param_5;
    uVar7 = param_8 + param_6;
    param_7 = param_5;
    param_3 = uVar4;
    param_4 = param_8;
    param_8 = param_6;
    param_6 = uVar8;
    param_5 = uVar10;
    uVar2 = uVar7 | uVar9;
  }
  sVar5 = 0x13;
  if (DAT_0059c96c != 0) {
    sVar5 = (-(DAT_0059c96c == 1) & 2U) + 0x10;
  }
  local_28 = param_3 << sVar5;
  local_24 = param_4 << sVar5;
  local_3c = param_5 << sVar5;
  local_38 = param_6 << sVar5;
  local_50 = uVar4 << sVar5;
  local_4c = param_8 << sVar5;
  if (((int)uVar4 <= (int)param_3) && ((int)param_5 <= (int)param_3)) {
    local_28 = local_28 - 1;
  }
  if (((int)uVar4 <= (int)param_5) && ((int)param_3 <= (int)param_5)) {
    local_3c = local_3c - 1;
  }
  if (((int)param_3 <= (int)uVar4) && ((int)param_5 <= (int)uVar4)) {
    local_50 = local_50 - 1;
  }
  if (((int)param_8 <= (int)param_4) && ((int)param_6 <= (int)param_4)) {
    local_24 = local_24 - 1;
  }
  if (((int)param_8 <= (int)param_6) && ((int)param_4 <= (int)param_6)) {
    local_38 = local_38 - 1;
  }
  if (((int)param_4 <= (int)param_8) && ((int)param_6 <= (int)param_8)) {
    local_4c = local_4c - 1;
  }
  local_28 = local_28 & 0xffffff;
  local_24 = local_24 & 0xffffff;
  local_3c = local_3c & 0xffffff;
  local_38 = local_38 & 0xffffff;
  local_50 = local_50 & 0xffffff;
  local_4c = local_4c & 0xffffff;
  tex_struct_convert_to_tex_coords(param_3 << 9,param_4 << 9,&local_30,&local_2c);
  tex_struct_convert_to_tex_coords(param_5 << 9,param_6 << 9,&local_44,&local_40);
  tex_struct_convert_to_tex_coords(uVar4 << 9,param_8 << 9,&local_58,&local_54);
  local_20 = __ftol();
  if (0x3f0000 < local_20) {
    local_20 = 0x3f0000;
  }
  if (local_20 < 0x140000) {
    local_20 = 0x140000;
  }
  if (*(int *)(param_1 + 0x20) != 0) {
    lVar1 = (longlong)(*(int *)(param_1 + 0x20) << 8) * (longlong)(0x200000 - local_20);
    local_20 = local_20 + ((uint)lVar1 >> 0x10 | (int)((ulonglong)lVar1 >> 0x20) << 0x10);
  }
  local_34 = __ftol();
  if (0x3f0000 < local_34) {
    local_34 = 0x3f0000;
  }
  if (local_34 < 0x140000) {
    local_34 = 0x140000;
  }
  if (*(int *)(param_1 + 0x20) != 0) {
    lVar1 = (longlong)(*(int *)(param_1 + 0x20) << 8) * (longlong)(0x200000 - local_34);
    local_34 = local_34 + ((uint)lVar1 >> 0x10 | (int)((ulonglong)lVar1 >> 0x20) << 0x10);
  }
  local_48 = __ftol();
  if (0x3f0000 < local_48) {
    local_48 = 0x3f0000;
  }
  if (local_48 < 0x140000) {
    local_48 = 0x140000;
  }
  if (*(int *)(param_1 + 0x20) != 0) {
    lVar1 = (longlong)(*(int *)(param_1 + 0x20) << 8) * (longlong)(0x200000 - local_48);
    local_48 = local_48 + ((uint)lVar1 >> 0x10 | (int)((ulonglong)lVar1 >> 0x20) << 0x10);
  }
  if (*(int *)(param_1 + 0x108) == 0) {
    FUN_00d0e000(&local_30,&local_44,&local_58,5);
  }
  else if (*(int *)(param_1 + 0x108) == 1) {
    if (landscape_palette_class_ptr->field1_0x4 == 0) {
      _DAT_0059c950 = _DAT_0059c950 + 1;
    }
    add_sprite_to_landscape_storage(landscape_palette_class_ptr,&local_1c,1,0);
    fVar3 = uv_3;
    if (texture_min_mag_value != 0) {
      fVar3 = uv_2;
    }
    fVar3 = fVar3 * local_8;
    D3DTLVERTEX_0067ace8.sx.sx = (D3DVALUE)local_30;
    D3DTLVERTEX_0067ace8.sy.sy = (D3DVALUE)local_2c;
    uVar7 = 0;
    uVar9 = local_20 >> 0xd;
    D3DTLVERTEX_0067ace8.sz.sz = 0.0;
    if ((int)uVar9 < 0) {
      uVar9 = 0;
    }
    if (0xff < (int)uVar9) {
      uVar7 = 0;
      if (0x160 < (int)uVar9) {
        uVar7 = (int)((uVar9 - 0x160) * (uVar9 - 0x160)) / 200;
      }
      uVar9 = 0xff;
      if (0xff < (int)uVar7) {
        uVar7 = 0xff;
      }
      if ((int)uVar7 < 0) {
        uVar7 = 0;
      }
    }
    D3DTLVERTEX_0067ace8.color.color = (uVar9 | 0xffff0000) << 8 | uVar9 << 0x10 | uVar9;
    piVar6 = (int *)(ui_struct->d3 + 0x88);
    if (*piVar6 != 0) {
      D3DTLVERTEX_0067ace8.specular.specular = uVar7 << 0x10 | uVar7 << 8 | uVar7;
    }
    local_10 = local_10 - fVar3;
    D3DTLVERTEX_0067ace8.tu.tu =
         (float)((local_28 & 0x1f0000) >> 0x10) * local_10 * _DAT_0058f288 + fVar3 + local_18;
    local_c = local_c - fVar3;
    uVar7 = 0;
    D3DTLVERTEX_0067aca8.sz.sz = 0.0;
    D3DTLVERTEX_0067ace8.tv.tv =
         (float)((local_24 & 0x1f0000) >> 0x10) * local_c * _DAT_0058f288 + fVar3 + local_14;
    uVar9 = local_34 >> 0xd;
    D3DTLVERTEX_0067aca8.sx.sx = (D3DVALUE)local_44;
    D3DTLVERTEX_0067aca8.sy.sy = (D3DVALUE)local_40;
    if ((int)uVar9 < 0) {
      uVar9 = 0;
    }
    if (0xff < (int)uVar9) {
      uVar7 = 0;
      if (0x160 < (int)uVar9) {
        uVar7 = (int)((uVar9 - 0x160) * (uVar9 - 0x160)) / 200;
      }
      uVar9 = 0xff;
      if (0xff < (int)uVar7) {
        uVar7 = 0xff;
      }
      if ((int)uVar7 < 0) {
        uVar7 = 0;
      }
    }
    D3DTLVERTEX_0067aca8.color.color = (uVar9 | 0xffff0000) << 8 | uVar9 << 0x10 | uVar9;
    if (*piVar6 != 0) {
      D3DTLVERTEX_0067aca8.specular.specular = uVar7 << 0x10 | uVar7 << 8 | uVar7;
    }
    D3DTLVERTEX_0067aca8.tu.tu =
         (float)((local_3c & 0x1f0000) >> 0x10) * local_10 * _DAT_0058f288 + fVar3 + local_18;
    uVar7 = 0;
    D3DTLVERTEX_0067ad48.sz.sz = 0.0;
    D3DTLVERTEX_0067aca8.tv.tv =
         (float)((local_38 & 0x1f0000) >> 0x10) * local_c * _DAT_0058f288 + fVar3 + local_14;
    uVar9 = local_48 >> 0xd;
    D3DTLVERTEX_0067ad48.sx.sx = (D3DVALUE)local_58;
    D3DTLVERTEX_0067ad48.sy.sy = (D3DVALUE)local_54;
    if ((int)uVar9 < 0) {
      uVar9 = 0;
    }
    if (0xff < (int)uVar9) {
      uVar7 = 0;
      if (0x160 < (int)uVar9) {
        uVar7 = (int)((uVar9 - 0x160) * (uVar9 - 0x160)) / 200;
      }
      uVar9 = 0xff;
      if (0xff < (int)uVar7) {
        uVar7 = 0xff;
      }
      if ((int)uVar7 < 0) {
        uVar7 = 0;
      }
    }
    D3DTLVERTEX_0067ad48.color.color = (uVar9 | 0xffff0000) << 8 | uVar9 << 0x10 | uVar9;
    if (*piVar6 != 0) {
      D3DTLVERTEX_0067ad48.specular.specular = uVar7 << 0x10 | uVar7 << 8 | uVar7;
    }
    D3DTLVERTEX_0067ad48.tu.tu =
         (float)((local_50 & 0x1f0000) >> 0x10) * local_10 * _DAT_0058f288 + fVar3 + local_18;
    D3DTLVERTEX_0067ad48.tv.tv =
         (float)((local_4c & 0x1f0000) >> 0x10) * local_c * _DAT_0058f288 + fVar3 + local_14;
    add_polygon_triangle_texture_80
              (&D3DTLVERTEX_0067ace8,&D3DTLVERTEX_0067aca8,&D3DTLVERTEX_0067ad48,local_1c,0,
               globe_vertex_index);
    globe_vertex_index = globe_vertex_index + 1;
  }
  *(int *)(param_1 + 0x28) = *(int *)(param_1 + 0x28) + 1;
  return;
}
