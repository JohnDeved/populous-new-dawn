/* Ghidra 12.1.3 pseudocode; entry 004673b0; draw_polygons.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */
/* WARNING: Enum "_D3DRENDERSTATETYPE": Some values do not have unique names */

void draw_polygons(void)

{
  int iVar1;
  byte bVar2;
  undefined1 uVar3;
  ushort uVar4;
  short sVar5;
  polygon_drawn *ppVar6;
  float fVar7;
  byte bVar8;
  char cVar9;
  uint uVar10;
  uv_polygon_struct *puVar11;
  int iVar12;
  int iVar13;
  undefined4 uVar14;
  bool bVar15;
  int iVar16;
  int iVar17;
  int iVar18;
  undefined2 extraout_var;
  uint uVar19;
  int iVar20;
  int iVar21;
  undefined2 extraout_var_00;
  undefined1 *puVar22;
  uint uVar23;
  obj_related *poVar24;
  float *pfVar25;
  ushort *puVar26;
  short *psVar27;
  texture_block_long *ptVar28;
  undefined4 *puVar29;
  uint uVar30;
  float *pfVar31;
  byte bVar32;
  bool bVar33;
  ushort auStackY_5037e [163251];
  undefined4 *puVar34;
  undefined4 *puVar35;
  undefined4 *puVar36;
  char local_7e6 [2];
  polygon_drawn *local_7e4;
  int local_7e0;
  int local_7dc;
  int local_7d8;
  uint local_7d4;
  uint local_7d0;
  float *local_7cc;
  uint local_7c8;
  float *local_7c4;
  float *local_7c0;
  int local_7bc;
  float *local_7b8;
  int local_7b4;
  int *local_7b0;
  int *local_7ac;
  uint local_7a8;
  _union_3453 local_7a4;
  _union_3453 local_7a0;
  _union_3453 local_79c;
  _union_3453 local_798;
  _union_3453 local_794;
  _union_3453 local_790;
  uint local_78c;
  int *local_788;
  int *local_784;
  int *local_780;
  char *local_77c;
  uint local_778;
  float local_774;
  float local_770;
  float local_76c;
  float local_768;
  float local_764;
  float local_760;
  float local_75c;
  undefined1 local_758 [4];
  short *local_754;
  int *local_750;
  int local_74c;
  float local_748;
  float local_744;
  float local_740;
  float local_73c;
  float local_738;
  undefined4 *local_734;
  float local_730;
  float local_72c;
  float local_728;
  float local_724;
  int local_720;
  float local_71c;
  float local_718;
  float local_714;
  float local_710;
  int local_70c;
  int local_708;
  int local_704;
  int local_700;
  float local_6fc;
  float local_6f8;
  float local_6f4;
  float local_6f0;
  float local_6ec;
  float local_6e8;
  float local_6e4;
  float local_6e0;
  float local_6dc;
  float local_6d8;
  float local_6d4;
  float local_6d0;
  uint local_6cc;
  uint local_6c8;
  uint local_6c4;
  uint local_6c0;
  uint local_6bc;
  uint local_6b8;
  int local_6b4;
  float local_6b0;
  float local_6ac;
  polygon_drawn **local_6a8;
  float local_6a4;
  float local_6a0;
  float local_69c;
  float local_698;
  float local_694;
  float local_690;
  float local_68c;
  float local_688;
  float local_684;
  float local_680;
  float local_67c;
  uint local_678;
  uint local_674;
  uint local_670;
  int local_66c;
  int local_668;
  uint local_664;
  uint local_660;
  uint local_65c;
  byte local_658;
  undefined1 *local_63c;
  undefined1 *local_638;
  undefined1 *local_634;
  undefined1 *local_610;
  undefined1 *local_60c;
  undefined1 *local_608;
  undefined1 *local_5a4;
  undefined1 *local_5a0;
  undefined1 *local_59c;
  uint local_598;
  float local_594;
  undefined1 *local_590;
  float local_58c;
  undefined1 *local_588;
  float local_584;
  undefined1 *local_580;
  float local_57c;
  undefined1 *local_578;
  float local_574;
  undefined1 *local_570;
  float local_56c;
  undefined1 *local_568;
  undefined1 *local_564;
  undefined1 *local_560;
  undefined4 local_544;
  undefined2 local_540;
  undefined2 local_53e;
  undefined2 local_53c;
  undefined4 local_538;
  undefined2 local_534;
  uint local_530;
  undefined4 uStack_52c;
  uint local_528;
  undefined4 uStack_524;
  uint local_520;
  undefined4 uStack_51c;
  uint local_518;
  undefined4 uStack_514;
  uint local_510;
  undefined4 uStack_50c;
  uint local_508;
  undefined4 uStack_504;
  undefined1 local_500 [4];
  undefined1 local_4fc [4];
  undefined1 local_4f8 [4];
  undefined1 local_4f4 [4];
  undefined1 local_4f0 [4];
  undefined1 local_4ec [4];
  int local_4e8;
  undefined4 local_4e4;
  int local_4e0;
  int local_4dc;
  int local_4d8;
  int local_4d4;
  int local_4d0;
  int local_4cc;
  float local_4c8 [2];
  int local_4c0;
  int local_4bc;
  uint local_4b8;
  float local_4b4 [4];
  uint local_4a4;
  float local_4a0 [2];
  int local_498;
  int local_494;
  float local_48c [4];
  uint local_47c;
  undefined **local_478;
  undefined4 local_474;
  undefined4 local_470;
  int local_464;
  undefined4 local_460;
  float local_45c;
  float local_458;
  float local_454;
  float local_450;
  float local_44c;
  undefined4 local_444;
  float local_440;
  float local_43c;
  float local_438;
  float local_434;
  float local_430;
  undefined4 local_428;
  float local_424;
  float local_420;
  float local_41c;
  float local_418;
  float local_414;
  undefined4 local_40c;
  float local_408;
  float local_404;
  float local_400;
  float local_3fc;
  float local_3f8;
  undefined4 local_3f0;
  float local_3ec;
  float local_3e8;
  float local_3e4;
  float local_3e0;
  float local_3dc;
  undefined4 local_3d4;
  float local_3d0;
  float local_3cc;
  float local_3c8;
  float local_3c4;
  float local_3c0;
  undefined4 local_3b8;
  float local_3b4;
  float local_3b0;
  float local_3ac;
  float local_3a8;
  float local_3a4;
  undefined4 local_39c [7];
  short local_380;
  ushort local_37e [15];
  undefined4 local_360;
  undefined4 local_35c;
  uint local_350;
  uint local_34c;
  float local_348;
  float local_344;
  undefined4 local_340;
  undefined4 local_33c;
  uint local_330;
  uint local_32c;
  float local_328;
  float local_324;
  undefined4 local_320;
  undefined4 local_31c;
  uint local_310;
  uint local_30c;
  float local_308;
  float local_304;
  undefined4 local_300;
  undefined4 local_2fc;
  uint local_2f0;
  uint local_2ec;
  float local_2e8;
  float local_2e4;
  undefined4 local_2e0;
  undefined4 local_2dc;
  uint local_2d0;
  uint local_2cc;
  float local_2c8;
  float local_2c4;
  undefined4 local_2c0;
  undefined4 local_2bc;
  uint local_2b0;
  uint local_2ac;
  float local_2a8;
  float local_2a4;
  undefined4 local_2a0;
  undefined4 local_29c;
  uint local_290;
  uint local_28c;
  float local_288;
  float local_284;
  undefined4 local_280;
  undefined4 local_27c;
  uint local_270;
  uint local_26c;
  float local_268;
  float local_264;
  undefined4 local_260;
  undefined4 local_25c;
  uint local_250;
  uint local_24c;
  float local_248;
  float local_244;
  float local_240;
  undefined4 local_23c;
  uint local_230;
  undefined4 local_22c;
  float local_228;
  float local_224;
  _union_3447 local_220;
  undefined4 local_21c;
  uint local_210;
  undefined4 local_20c;
  float local_208;
  float local_204;
  float local_200;
  undefined4 local_1fc;
  uint local_1f0;
  undefined4 local_1ec;
  float local_1e8;
  float local_1e4;
  undefined1 local_1e0 [24];
  float local_1c8;
  float local_1c4;
  float local_1c0;
  float local_1bc;
  uint local_1b0;
  uint local_1ac;
  float local_1a8;
  float local_1a4;
  float local_1a0;
  float local_19c;
  uint local_190;
  uint local_18c;
  float local_188;
  float local_184;
  float local_180;
  float local_17c;
  uint local_170;
  uint local_16c;
  float local_168;
  float local_164;
  undefined1 local_160 [24];
  float local_148;
  float local_144;
  float local_140;
  float local_13c;
  uint local_130;
  uint local_12c;
  float local_128;
  float local_124;
  float local_120;
  undefined4 local_11c;
  uint local_110;
  uint local_10c;
  float local_108;
  float local_104;
  undefined1 local_100 [24];
  float local_e8;
  float local_e4;
  undefined4 local_e0;
  undefined4 local_dc;
  uint local_d0;
  uint local_cc;
  float local_c8;
  float local_c4;
  undefined4 local_c0;
  undefined4 local_bc;
  uint local_b0;
  uint local_ac;
  float local_a8;
  float local_a4;
  undefined4 local_a0;
  undefined4 local_9c;
  uint local_90;
  uint local_8c;
  float local_88;
  float local_84;
  undefined1 local_80 [24];
  float local_68;
  float local_64;
  undefined4 local_60;
  undefined4 local_5c;
  uint local_50;
  undefined4 local_4c;
  undefined4 local_40;
  undefined4 local_3c;
  uint local_30;
  undefined4 local_2c;
  undefined4 local_20 [8];

  framerate_or_lowres_textures = 0;
  psVar27 = &local_380;
  for (iVar16 = 8; iVar16 != 0; iVar16 = iVar16 + -1) {
    psVar27[0] = 0;
    psVar27[1] = 0;
    psVar27 = psVar27 + 2;
  }
  unit_index_2 = 0;
  if ((land_flags_1._2_1_ & 0x40) == 0) {
    unit_index_1 = 0;
  }
  local_7c8 = 0xe01;
  local_6a8 = polygons_to_draw + 0xe00;
  do {
    ppVar6 = *local_6a8;
    uVar23 = vertices_flags;
    uVar14 = DAT_005da07c;
    while (vertices_flags = uVar23, DAT_005da07c = uVar14, ppVar6 != (polygon_drawn *)0x0) {
      cVar9 = ppVar6->type;
      local_7e4 = ppVar6;
      switch(cVar9) {
      case '\0':
        palette_index_fill_textures = 0x43;
        uVar23 = ((uint)(max_point_depth - min_point_depth) >> 1) + min_point_depth;
        if (local_7c8 < uVar23) {
          DAT_0087cb74 = DAT_0087cb74 + 1;
        }
        local_7a8 = (uint)(ushort)ppVar6->tex_index_2;
        local_658 = polygon_related_8B_ARRAY_0076108c[local_7a8].x;
        bVar32 = local_658 >> 1;
        uVar30 = (uint)bVar32;
        ptVar28 = (texture_block_long *)0x0;
        local_74c = -1;
        bVar8 = (byte)polygon_related_8B_ARRAY_0076108c[local_7a8].y >> 1;
        uVar19 = (uint)bVar8;
        if (((byte)level_flags & 8) != 0) {
          if (((*(byte *)&ppVar6->point_1_color < 2) && (*(byte *)&ppVar6->point_2_color < 2)) &&
             (*(byte *)&ppVar6->point_3_color < 2)) {
            ppVar6->point_3_color = 0;
            ppVar6->point_2_color = 0;
            ppVar6->point_1_color = 0;
            local_39c[0] = 0;
          }
          else {
            add_sprite_to_landscape_storage
                      (*(undefined4 *)
                        (&DAT_005ce0e8 +
                        (uint)*(ushort *)(DAT_009bcfcc + (uVar19 * 0x80 + uVar30) * 2) * 4),
                       local_39c);
          }
          if ((level_flags_2._3_1_ & 0x80) == 0) {
            puVar11 = uv_polygon_mapping + (byte)local_7e4->tex_size_type + 8;
          }
          else {
            puVar11 = uv_polygon_mapping + (byte)local_7e4->tex_size_type;
          }
          puVar34 = &local_7e4->point_1_u;
          puVar29 = &local_7e4->point_1_v;
          *puVar34 = puVar11->point_1_u;
          puVar35 = &local_7e4->point_2_u;
          *puVar29 = puVar11->point_1_v;
          puVar36 = &local_7e4->point_2_v;
          *puVar35 = puVar11->point_2_u;
          *puVar36 = puVar11->point_2_v;
          local_7ac = &local_7e4->point_3_u;
          *local_7ac = (int)puVar11->point_3_u;
          local_7b0 = &local_7e4->point_3_v;
          *local_7b0 = (int)puVar11->point_3_v;
          local_544 = local_39c[0];
          if (*(int *)(ui_struct->d3 + 0x80) == 0) {
            fVar7 = uv_3;
            if (texture_min_mag_value != 0) {
              fVar7 = uv_2;
            }
            local_790.tu = fVar7 * _DAT_0058f46c;
          }
          else {
            local_790.tu = 0.0;
          }
          if (*(int *)(ui_struct->d3 + 0x80) == 0) {
            fVar7 = uv_1;
            if (texture_min_mag_value != 0) {
              fVar7 = uv_4;
            }
            local_794.tu = fVar7 * _DAT_0058f46c + _DAT_0058f470;
          }
          else {
            local_794.tu = 1.0;
          }
          local_7cc = (float *)&local_7e4->point_1_x;
          copy_vertex_and_specular(local_7cc);
          _D3DTLVERTEX_ARRAY_00d0a7b0[0].tu = local_794;
          if (*puVar34 == 0) {
            _D3DTLVERTEX_ARRAY_00d0a7b0[0].tu = local_790;
          }
          _D3DTLVERTEX_ARRAY_00d0a7b0[0].tv.tv = local_794.tu;
          if (*puVar29 == 0) {
            _D3DTLVERTEX_ARRAY_00d0a7b0[0].tv.tv = local_790.tu;
          }
          local_7c4 = (float *)&local_7e4->point_2_x;
          _D3DTLVERTEX_ARRAY_00d0a7b0[1].sx.sx = *local_7c4;
          local_7c0 = (float *)&local_7e4->point_2_y;
          _D3DTLVERTEX_ARRAY_00d0a7b0[1].sy.sy = *local_7c0;
          _D3DTLVERTEX_ARRAY_00d0a7b0[1].color = (_union_3451)local_7e4->point_2_color;
          if ((_D3DTLVERTEX_ARRAY_00d0a7b0[1].color.color & 0xff000000) == 0) {
            _D3DTLVERTEX_ARRAY_00d0a7b0[1].specular.specular = 0;
            if ((int)_D3DTLVERTEX_ARRAY_00d0a7b0[1].color.color < 0x20) {
              uVar23 = _D3DTLVERTEX_ARRAY_00d0a7b0[1].color.color * 8;
            }
            else {
              uVar23 = 0xff;
              uVar30 = _D3DTLVERTEX_ARRAY_00d0a7b0[1].color.color * 5 - 0xa0;
              if (0x100 < uVar30) {
                uVar30 = 0x100;
              }
              _D3DTLVERTEX_ARRAY_00d0a7b0[1].specular.specular =
                   (uVar30 * 0xfd & 0xffff00) << 8 | uVar30 * 0xb9 & 0xffffff00 | uVar30 * 0x35 >> 8
              ;
            }
            _D3DTLVERTEX_ARRAY_00d0a7b0[1].color.color =
                 (uVar23 | 0xffffff00) << 0x10 | uVar23 << 8 | uVar23;
          }
          else {
            _D3DTLVERTEX_ARRAY_00d0a7b0[1].specular.specular = 0;
          }
          _D3DTLVERTEX_ARRAY_00d0a7b0[1].tu = local_794;
          if (*puVar35 == 0) {
            _D3DTLVERTEX_ARRAY_00d0a7b0[1].tu = local_790;
          }
          _D3DTLVERTEX_ARRAY_00d0a7b0[1].tv.tv = local_794.tu;
          if (*puVar36 == 0) {
            _D3DTLVERTEX_ARRAY_00d0a7b0[1].tv.tv = local_790.tu;
          }
          _D3DTLVERTEX_ARRAY_00d0a7b0[2].sx = (_union_3447)local_7e4->point_3_x;
          pfVar25 = (float *)&local_7e4->point_3_x;
          local_7b8 = (float *)&local_7e4->point_3_y;
          _D3DTLVERTEX_ARRAY_00d0a7b0[2].sy.sy = *local_7b8;
          _D3DTLVERTEX_ARRAY_00d0a7b0[2].color = (_union_3451)local_7e4->point_3_color;
          if ((_D3DTLVERTEX_ARRAY_00d0a7b0[2].color.color & 0xff000000) == 0) {
            _D3DTLVERTEX_ARRAY_00d0a7b0[2].specular.specular = 0;
            if ((int)_D3DTLVERTEX_ARRAY_00d0a7b0[2].color.color < 0x20) {
              uVar23 = _D3DTLVERTEX_ARRAY_00d0a7b0[2].color.color * 8;
            }
            else {
              uVar23 = 0xff;
              uVar30 = _D3DTLVERTEX_ARRAY_00d0a7b0[2].color.color * 5 - 0xa0;
              if (0x100 < uVar30) {
                uVar30 = 0x100;
              }
              _D3DTLVERTEX_ARRAY_00d0a7b0[2].specular.specular =
                   (uVar30 * 0xfd & 0xffff00) << 8 | uVar30 * 0xb9 & 0xffffff00 | uVar30 * 0x35 >> 8
              ;
            }
            _D3DTLVERTEX_ARRAY_00d0a7b0[2].color.color =
                 (uVar23 | 0xffff0000) << 8 | uVar23 << 0x10 | uVar23;
          }
          else {
            _D3DTLVERTEX_ARRAY_00d0a7b0[2].specular.specular = 0;
          }
          _D3DTLVERTEX_ARRAY_00d0a7b0[2].tu = local_794;
          if (*local_7ac == 0) {
            _D3DTLVERTEX_ARRAY_00d0a7b0[2].tu = local_790;
          }
          _D3DTLVERTEX_ARRAY_00d0a7b0[2].tv.tv = local_794.tu;
          if (*local_7b0 == 0) {
            _D3DTLVERTEX_ARRAY_00d0a7b0[2].tv.tv = local_790.tu;
          }
          add_polygon_triangle_texture_80(_D3DTLVERTEX_ARRAY_00d0a7b0,0xd0a7d0,0xd0a7f0,local_544);
          goto LAB_00468561;
        }
        local_540 = CONCAT11(polygon_related_8B_ARRAY_0076108c[local_7a8].y,local_658);
        local_53c = local_540;
        local_53e = local_540;
        uVar10 = (local_540 & 0xfe) * 2 | local_540 & 0xfe00;
        iVar16 = uVar10 * 4;
        local_6b4 = iVar16 + 0x8a03e4;
        if ((((byte)level_flags & 4) == 0) &&
           ((*(byte *)(landscape_height_array + ((&game_state.level_data[0].c_3)[iVar16] & 0xf)) & 2
            ) != 0)) {
          if (local_7c8 < uVar23) {
            DAT_0087cbc0 = DAT_0087cbc0 + 1;
          }
          bVar2 = ppVar6->tex_size_type;
          local_780 = &ppVar6->point_1_v;
          ppVar6->point_1_u = uv_polygon_mapping[bVar2].point_1_u;
          *local_780 = (int)uv_polygon_mapping[bVar2].point_1_v;
          local_784 = &ppVar6->point_2_u;
          *local_784 = (int)uv_polygon_mapping[bVar2].point_2_u;
          local_788 = &ppVar6->point_2_v;
          local_7ac = &ppVar6->point_3_u;
          *local_788 = (int)uv_polygon_mapping[bVar2].point_2_v;
          local_508 = bVar32 & 7;
          *local_7ac = (int)uv_polygon_mapping[bVar2].point_3_u;
          local_7b0 = &ppVar6->point_3_v;
          local_510 = bVar8 & 7;
          *local_7b0 = (int)uv_polygon_mapping[bVar2].point_3_v;
          local_7cc = (float *)&ppVar6->point_1_x;
          local_240 = *local_7cc;
          local_23c = ppVar6->point_1_y;
          local_230 = ppVar6->point_1_color;
          if ((local_230 & 0xff000000) == 0) {
            uVar23 = 0xff;
            if ((int)local_230 < 0x20) {
              uVar23 = local_230 * 8;
            }
            local_230 = (uVar23 | 0xffffff00) << 0x10 | uVar23 << 8 | uVar23;
          }
          local_22c = 0;
          uStack_504 = 0;
          uStack_50c = 0;
          local_6ac = (float)local_508 * _DAT_0058f474;
          local_228 = (float)(int)ppVar6->point_1_u * _DAT_0058f478 + local_6ac;
          local_7c4 = (float *)&ppVar6->point_2_x;
          local_6b0 = (float)local_510 * _DAT_0058f474;
          local_224 = (float)*local_780 * _DAT_0058f478 + local_6b0;
          local_220.sx = *local_7c4;
          local_7c0 = (float *)&ppVar6->point_2_y;
          local_21c = *local_7c0;
          local_210 = ppVar6->point_2_color;
          if ((local_210 & 0xff000000) == 0) {
            uVar23 = 0xff;
            if ((int)local_210 < 0x20) {
              uVar23 = local_210 * 8;
            }
            local_210 = (uVar23 | 0xffffff00) << 0x10 | uVar23 << 8 | uVar23;
          }
          local_20c = 0;
          pfVar25 = (float *)&ppVar6->point_3_x;
          local_208 = (float)*local_784 * _DAT_0058f478 + local_6ac;
          local_204 = (float)*local_788 * _DAT_0058f478 + local_6b0;
          local_200 = *pfVar25;
          local_7b8 = (float *)&ppVar6->point_3_y;
          local_1fc = *local_7b8;
          local_1f0 = ppVar6->point_3_color;
          if ((local_1f0 & 0xff000000) == 0) {
            uVar23 = 0xff;
            if ((int)local_1f0 < 0x20) {
              uVar23 = local_1f0 * 8;
            }
            local_1f0 = (uVar23 | 0xffffff00) << 0x10 | uVar23 << 8 | uVar23;
          }
          local_1ec = 0;
          local_1e8 = (float)*local_7ac * _DAT_0058f478 + local_6ac;
          local_1e4 = (float)*local_7b0 * _DAT_0058f478 + local_6b0;
          add_polygon_triangle_texture_80(&local_240,&local_220,&local_200,&water_texture_block);
          goto LAB_00468561;
        }
        if (local_7c8 < uVar23) {
          if ((short)(&game_state.level_data[0].height)[uVar10 * 2] < 0x201) {
            DAT_0074a2f4 = DAT_0074a2f4 + 1;
          }
          else {
            DAT_0087cb48 = DAT_0087cb48 + 1;
          }
        }
        uVar23 = 0x20;
        if ((((level_flags_2._3_1_ & 0x40) == 0) &&
            (iVar16 = (int)*(short *)(res_array_3 + (uVar19 * 0x80 + uVar30) * 2), iVar16 != -1)) &&
           ((*(byte *)(res_array_1 + 2 + iVar16 * 8) & 4) != 0)) {
          ptVar28 = landscape_coords_global[0].texture_block_ptr;
          if (DAT_00749b60 == 0) {
            ptVar28 = landscape_coords_global[iVar16].texture_block_ptr;
          }
          if ((level_flags_2._3_1_ & 0x80) == 0) {
            puVar22 = &ppVar6->tex_size_type;
            uVar23 = 0x10;
            puVar11 = uv_polygon_mapping + (byte)*puVar22 + 8;
          }
          else {
            puVar22 = &ppVar6->tex_size_type;
            puVar11 = uv_polygon_mapping + (byte)*puVar22;
          }
        }
        else {
          local_478 = &PTR_set_texture_memory_0058f4a8;
          local_74c = uVar19 * 0x80 + 1 + uVar30;
          local_474 = 8;
          local_470 = 8;
          local_464 = (uVar30 & 0xffffffe0) * 0x800 + (uVar19 & 0xffffffe0) * 0x2000 +
                      (bVar32 & 0x1f) * 8 + (bVar8 & 0x1f) * 0x800 + landscape_texture_storage_big;
          add_sprite_to_texture_cache();
          puVar22 = &local_7e4->tex_size_type;
          puVar11 = uv_polygon_mapping + (byte)local_7e4->tex_size_type + 0x10;
        }
        local_750 = &local_7e4->point_1_u;
        *local_750 = (int)puVar11->point_1_u;
        local_780 = &local_7e4->point_1_v;
        *local_780 = (int)puVar11->point_1_v;
        local_784 = &local_7e4->point_2_u;
        *local_784 = (int)puVar11->point_2_u;
        local_788 = &local_7e4->point_2_v;
        *local_788 = (int)puVar11->point_2_v;
        local_7ac = &local_7e4->point_3_u;
        *local_7ac = (int)puVar11->point_3_u;
        local_7b0 = &local_7e4->point_3_v;
        *local_7b0 = (int)puVar11->point_3_v;
        if (DAT_00749bec != 0) break;
        iVar16 = *(int *)(ui_struct->d3 + 0x80);
        if (local_74c < 0) {
          if (iVar16 == 0) {
            if (texture_min_mag_value == 0) {
              uStack_51c = 0;
              local_520 = uVar23;
              fVar7 = uv_3;
            }
            else {
              uStack_514 = 0;
              local_518 = uVar23;
              fVar7 = uv_2;
            }
            local_798.tu = fVar7 / (float)uVar23;
          }
          else {
            local_798.tu = 0.0;
          }
          if (iVar16 == 0) {
            if (texture_min_mag_value == 0) {
              uStack_52c = 0;
              local_530 = uVar23;
              fVar7 = uv_1;
            }
            else {
              uStack_524 = 0;
              local_528 = uVar23;
              fVar7 = uv_4;
            }
            local_79c.tu = fVar7 / (float)uVar23 + _DAT_0058f470;
          }
          else {
            local_79c.tu = 1.0;
          }
          local_7cc = (float *)&local_7e4->point_1_x;
          copy_vertex_and_specular(local_7cc);
          ppVar6 = local_7e4;
          _D3DTLVERTEX_ARRAY_00d0a7b0[0].tu = local_79c;
          if (*local_750 == 0) {
            _D3DTLVERTEX_ARRAY_00d0a7b0[0].tu = local_798;
          }
          _D3DTLVERTEX_ARRAY_00d0a7b0[0].tv.tv = local_79c.tu;
          if (*local_780 == 0) {
            _D3DTLVERTEX_ARRAY_00d0a7b0[0].tv.tv = local_798.tu;
          }
          local_7c4 = (float *)&local_7e4->point_2_x;
          _D3DTLVERTEX_ARRAY_00d0a7b0[1].sx = (_union_3447)*local_7c4;
          local_7c0 = (float *)&local_7e4->point_2_y;
          _D3DTLVERTEX_ARRAY_00d0a7b0[1].sy = (_union_3448)*local_7c0;
          _D3DTLVERTEX_ARRAY_00d0a7b0[1].color = (_union_3451)local_7e4->point_2_color;
          if ((_D3DTLVERTEX_ARRAY_00d0a7b0[1].color.color & 0xff000000) == 0) {
            _D3DTLVERTEX_ARRAY_00d0a7b0[1].specular.specular = 0;
            if ((int)_D3DTLVERTEX_ARRAY_00d0a7b0[1].color.color < 0x20) {
              uVar23 = _D3DTLVERTEX_ARRAY_00d0a7b0[1].color.color * 8;
            }
            else {
              uVar23 = 0xff;
              uVar30 = _D3DTLVERTEX_ARRAY_00d0a7b0[1].color.color * 5 - 0xa0;
              if (0x100 < uVar30) {
                uVar30 = 0x100;
              }
              _D3DTLVERTEX_ARRAY_00d0a7b0[1].specular.specular =
                   (uVar30 * 0xfd & 0xffff00) << 8 | uVar30 * 0xb9 & 0xffffff00 | uVar30 * 0x35 >> 8
              ;
            }
            _D3DTLVERTEX_ARRAY_00d0a7b0[1].color.color =
                 (uVar23 | 0xffffff00) << 0x10 | uVar23 << 8 | uVar23;
          }
          else {
            _D3DTLVERTEX_ARRAY_00d0a7b0[1].specular.specular = 0;
          }
          _D3DTLVERTEX_ARRAY_00d0a7b0[1].tu = local_79c;
          if (*local_784 == 0) {
            _D3DTLVERTEX_ARRAY_00d0a7b0[1].tu = local_798;
          }
          _D3DTLVERTEX_ARRAY_00d0a7b0[1].tv.tv = local_79c.tu;
          if (*local_788 == 0) {
            _D3DTLVERTEX_ARRAY_00d0a7b0[1].tv.tv = local_798.tu;
          }
          _D3DTLVERTEX_ARRAY_00d0a7b0[2].sx = (_union_3447)local_7e4->point_3_x;
          local_7b8 = (float *)&local_7e4->point_3_y;
          _D3DTLVERTEX_ARRAY_00d0a7b0[2].sy = (_union_3448)*local_7b8;
          _D3DTLVERTEX_ARRAY_00d0a7b0[2].color = (_union_3451)local_7e4->point_3_color;
          if ((_D3DTLVERTEX_ARRAY_00d0a7b0[2].color.color & 0xff000000) == 0) {
            _D3DTLVERTEX_ARRAY_00d0a7b0[2].specular.specular = 0;
            if ((int)_D3DTLVERTEX_ARRAY_00d0a7b0[2].color.color < 0x20) {
              uVar23 = _D3DTLVERTEX_ARRAY_00d0a7b0[2].color.color * 8;
            }
            else {
              uVar23 = 0xff;
              uVar30 = _D3DTLVERTEX_ARRAY_00d0a7b0[2].color.color * 5 - 0xa0;
              if (0x100 < uVar30) {
                uVar30 = 0x100;
              }
              _D3DTLVERTEX_ARRAY_00d0a7b0[2].specular.specular =
                   (uVar30 * 0xfd & 0xffff00) << 8 | uVar30 * 0xb9 & 0xffffff00 | uVar30 * 0x35 >> 8
              ;
            }
            _D3DTLVERTEX_ARRAY_00d0a7b0[2].color.color =
                 (uVar23 | 0xffff0000) << 8 | uVar23 << 0x10 | uVar23;
          }
          else {
            _D3DTLVERTEX_ARRAY_00d0a7b0[2].specular.specular = 0;
          }
          _D3DTLVERTEX_ARRAY_00d0a7b0[2].tu = local_79c;
          if (*local_7ac == 0) {
            _D3DTLVERTEX_ARRAY_00d0a7b0[2].tu = local_798;
          }
          _D3DTLVERTEX_ARRAY_00d0a7b0[2].tv.tv = local_79c.tu;
          if (*local_7b0 == 0) {
            _D3DTLVERTEX_ARRAY_00d0a7b0[2].tv.tv = local_798.tu;
          }
          add_polygon_triangle_texture_80(_D3DTLVERTEX_ARRAY_00d0a7b0,0xd0a7d0,0xd0a7f0,ptVar28);
        }
        else {
          if (iVar16 == 0) {
            fVar7 = uv_3;
            if (texture_min_mag_value != 0) {
              fVar7 = uv_2;
            }
            local_7a0.tu = fVar7 * _DAT_0058f474;
          }
          else {
            local_7a0.tu = 0.0;
          }
          if (iVar16 == 0) {
            fVar7 = uv_1;
            if (texture_min_mag_value != 0) {
              fVar7 = uv_4;
            }
            local_7a4.tu = fVar7 * _DAT_0058f474 + _DAT_0058f470;
          }
          else {
            local_7a4.tu = 1.0;
          }
          local_7cc = (float *)&local_7e4->point_1_x;
          copy_vertex_and_specular(local_7cc);
          ppVar6 = local_7e4;
          _D3DTLVERTEX_ARRAY_00d0a7b0[3].tu = local_7a4;
          if (*local_750 == 0) {
            _D3DTLVERTEX_ARRAY_00d0a7b0[3].tu = local_7a0;
          }
          _D3DTLVERTEX_ARRAY_00d0a7b0[3].tv.tv = local_7a4.tu;
          if (*local_780 == 0) {
            _D3DTLVERTEX_ARRAY_00d0a7b0[3].tv.tv = local_7a0.tu;
          }
          local_7c4 = (float *)&local_7e4->point_2_x;
          _D3DTLVERTEX_ARRAY_00d0a7b0[4].sx = (_union_3447)*local_7c4;
          local_7c0 = (float *)&local_7e4->point_2_y;
          _D3DTLVERTEX_ARRAY_00d0a7b0[4].sy = (_union_3448)*local_7c0;
          _D3DTLVERTEX_ARRAY_00d0a7b0[4].color = (_union_3451)local_7e4->point_2_color;
          if ((_D3DTLVERTEX_ARRAY_00d0a7b0[4].color.color & 0xff000000) == 0) {
            _D3DTLVERTEX_ARRAY_00d0a7b0[4].specular.specular = 0;
            if ((int)_D3DTLVERTEX_ARRAY_00d0a7b0[4].color.color < 0x20) {
              uVar23 = _D3DTLVERTEX_ARRAY_00d0a7b0[4].color.color * 8;
            }
            else {
              uVar23 = 0xff;
              uVar30 = _D3DTLVERTEX_ARRAY_00d0a7b0[4].color.color * 5 - 0xa0;
              if (0x100 < uVar30) {
                uVar30 = 0x100;
              }
              _D3DTLVERTEX_ARRAY_00d0a7b0[4].specular.specular =
                   (uVar30 * 0xfd & 0xffff00) << 8 | uVar30 * 0xb9 & 0xffffff00 | uVar30 * 0x35 >> 8
              ;
            }
            _D3DTLVERTEX_ARRAY_00d0a7b0[4].color.color =
                 (uVar23 | 0xffffff00) << 0x10 | uVar23 << 8 | uVar23;
          }
          else {
            _D3DTLVERTEX_ARRAY_00d0a7b0[4].specular.specular = 0;
          }
          _D3DTLVERTEX_ARRAY_00d0a7b0[4].tu = local_7a4;
          if (*local_784 == 0) {
            _D3DTLVERTEX_ARRAY_00d0a7b0[4].tu = local_7a0;
          }
          _D3DTLVERTEX_ARRAY_00d0a7b0[4].tv.tv = local_7a4.tu;
          if (*local_788 == 0) {
            _D3DTLVERTEX_ARRAY_00d0a7b0[4].tv.tv = local_7a0.tu;
          }
          _D3DTLVERTEX_ARRAY_00d0a7b0[5].sx = (_union_3447)local_7e4->point_3_x;
          local_7b8 = (float *)&local_7e4->point_3_y;
          _D3DTLVERTEX_ARRAY_00d0a7b0[5].sy = (_union_3448)*local_7b8;
          _D3DTLVERTEX_ARRAY_00d0a7b0[5].color = (_union_3451)local_7e4->point_3_color;
          if ((_D3DTLVERTEX_ARRAY_00d0a7b0[5].color.color & 0xff000000) == 0) {
            _D3DTLVERTEX_ARRAY_00d0a7b0[5].specular.specular = 0;
            if ((int)_D3DTLVERTEX_ARRAY_00d0a7b0[5].color.color < 0x20) {
              uVar23 = _D3DTLVERTEX_ARRAY_00d0a7b0[5].color.color * 8;
            }
            else {
              uVar23 = 0xff;
              uVar30 = _D3DTLVERTEX_ARRAY_00d0a7b0[5].color.color * 5 - 0xa0;
              if (0x100 < uVar30) {
                uVar30 = 0x100;
              }
              _D3DTLVERTEX_ARRAY_00d0a7b0[5].specular.specular =
                   (uVar30 * 0xfd & 0xffff00) << 8 | uVar30 * 0xb9 & 0xffffff00 | uVar30 * 0x35 >> 8
              ;
            }
            _D3DTLVERTEX_ARRAY_00d0a7b0[5].color.color =
                 (uVar23 | 0xffff0000) << 8 | uVar23 << 0x10 | uVar23;
          }
          else {
            _D3DTLVERTEX_ARRAY_00d0a7b0[5].specular.specular = 0;
          }
          _D3DTLVERTEX_ARRAY_00d0a7b0[5].tu = local_7a4;
          if (*local_7ac == 0) {
            _D3DTLVERTEX_ARRAY_00d0a7b0[5].tu = local_7a0;
          }
          _D3DTLVERTEX_ARRAY_00d0a7b0[5].tv.tv = local_7a4.tu;
          if (*local_7b0 == 0) {
            _D3DTLVERTEX_ARRAY_00d0a7b0[5].tv.tv = local_7a0.tu;
          }
          add_vertex_1(0xd0a810,0xd0a830,0xd0a850);
        }
        pfVar25 = (float *)&ppVar6->point_3_x;
        if ((*(byte *)(local_6b4 + 2) & 4) == 0) goto LAB_00468561;
        local_65c = (byte)local_540 & 0xffffff02;
        DAT_00d1c004 = (void *)(((uint)(local_540._1_1_ & 2) * 0x100 + local_65c) * 0x10 +
                                (game_state.offset_counter & 1) * 0x80 +
                                (game_state.offset_counter & 6) * 0x4000 + alavaa_mem);
        switch(*puVar22) {
        case 0:
          local_53e = CONCAT11(local_53e._1_1_ + '\x02',(byte)local_53e);
          local_53c = CONCAT11(local_53c._1_1_,(byte)local_53c + '\x02');
          goto LAB_00468438;
        case 1:
          local_540 = CONCAT11(local_540._1_1_ + 2,(byte)local_540);
          local_53e = CONCAT11(local_53e._1_1_ + '\x02',(byte)local_53e + '\x02');
          local_53c = CONCAT11(local_53c._1_1_,(byte)local_53c + '\x02');
          break;
        case 2:
          local_540 = CONCAT11(local_540._1_1_ + 2,(byte)local_540 + 2);
          local_53e = CONCAT11(local_53e._1_1_,(byte)local_53e + '\x02');
          break;
        case 3:
          local_540 = CONCAT11(local_540._1_1_,(byte)local_540 + 2);
LAB_00468438:
          local_53c = CONCAT11(local_53c._1_1_ + '\x02',(byte)local_53c);
        }
        iVar16 = (game_state.offset_counter & 0x3f) * 0x80;
        *local_750 = *local_750 +
                     *(int *)((int)maybe_sin +
                             (((byte)local_540 & 0xfffffffe) * 0x200 + iVar16 & 0x1ffc)) * 8 +
                     0x200000;
        *local_780 = *local_780 +
                     *(int *)((int)maybe_cos +
                             ((local_540._1_1_ & 0xfffffffe) * 0x200 + iVar16 & 0x1ffc)) * 8 +
                     0x200000;
        *local_784 = *local_784 +
                     *(int *)((int)maybe_sin +
                             (((byte)local_53e & 0xfffffffe) * 0x200 + iVar16 & 0x1ffc)) * 8 +
                     0x200000;
        *local_788 = *local_788 +
                     *(int *)((int)maybe_cos +
                             ((local_53e._1_1_ & 0xfffffffe) * 0x200 + iVar16 & 0x1ffc)) * 8 +
                     0x200000;
        *local_7ac = *local_7ac +
                     *(int *)((int)maybe_sin +
                             (((byte)local_53c & 0xfffffffe) * 0x200 + iVar16 & 0x1ffc)) * 8 +
                     0x200000;
        *local_7b0 = *local_7b0 +
                     *(int *)((int)maybe_cos +
                             ((local_53c._1_1_ & 0xfffffffe) * 0x200 + iVar16 & 0x1ffc)) * 8 +
                     0x200000;
        (*global_data_2)(local_7cc,local_7c4);
LAB_00468561:
        if (DAT_0087cae9 != '\0') {
          local_560 = &stack0xfffff800;
          palette_index_fill_textures = DAT_0089c6fe;
          set_indexed_value_from_system_palette(DAT_0089c6fe);
          uVar14 = __ftol();
          uVar14 = __ftol(uVar14);
          uVar14 = __ftol(uVar14);
          uVar14 = __ftol(uVar14);
          set_texture_4(uVar14);
          local_564 = &stack0xfffff800;
          set_indexed_value_from_system_palette(palette_index_fill_textures);
          uVar14 = __ftol();
          uVar14 = __ftol(uVar14);
          uVar14 = __ftol(uVar14);
          uVar14 = __ftol(uVar14);
          set_texture_4(uVar14);
        }
        local_568 = local_500;
        local_56c = *local_7cc;
        iVar16 = (int)ROUND(local_56c);
        local_570 = local_4f4;
        local_574 = (float)local_7e4->point_1_y;
        iVar20 = (int)ROUND(local_574);
        local_578 = local_4fc;
        local_57c = *local_7c4;
        iVar18 = (int)ROUND(local_57c);
        local_580 = local_4f0;
        local_584 = *local_7c0;
        iVar12 = (int)ROUND(local_584);
        local_58c = *pfVar25;
        local_588 = local_4f8;
        iVar13 = (int)ROUND(local_58c);
        local_590 = local_4ec;
        local_594 = *local_7b8;
        iVar1 = (int)ROUND(local_594);
        iVar21 = (int)DAT_0087caa0;
        iVar17 = (int)DAT_0087caa2;
        if ((iVar12 - iVar20) * (iVar18 - iVar21) + (iVar17 - iVar12) * (iVar18 - iVar16) < 0) {
          bVar33 = false;
        }
        else {
          bVar33 = false;
          if (-1 < (iVar1 - iVar12) * (iVar13 - iVar21) + (iVar17 - iVar1) * (iVar13 - iVar18)) {
            bVar33 = -1 < (iVar20 - iVar1) * (iVar16 - iVar21) +
                          (iVar17 - iVar20) * (iVar16 - iVar13);
          }
        }
        if (bVar33) {
          unit_index_2 = 0;
          if ((land_flags_1._2_1_ & 0x40) == 0) {
            unit_index_1 = 0;
          }
          _render_state_flags = _render_state_flags | 4;
          globe_coord_centre_inc_x = polygon_related_8B_ARRAY_0076108c[local_7a8].x;
          globe_coord_centre_inc_y = polygon_related_8B_ARRAY_0076108c[local_7a8].y;
          minimap_interpolation_mode = local_7e4->tex_index;
          switch(polygon_related_8B_ARRAY_0076108c[local_7a8].type) {
          case 0:
            _DAT_0087caac = __ftol();
            _DAT_0087caae = __ftol();
            break;
          case 1:
            _DAT_0087caac = __ftol();
            _DAT_0087caae = __ftol();
            break;
          case 2:
            _DAT_0087caac = __ftol();
            _DAT_0087caae = __ftol();
            break;
          case 3:
            _DAT_0087caac = polygon_related_8B_ARRAY_0076108c[local_7a8].pnts_related_1;
            _DAT_0087caae = polygon_related_8B_ARRAY_0076108c[local_7a8].pnts_related_2;
          }
          minimap_base_1 = __ftol();
          minimap_offset_1 = __ftol();
          minimap_offset_3 = __ftol();
          _DAT_0087ca18 = polygon_related_8B_ARRAY_0076108c[local_7a8].pnts_related_1;
          minimap_base_2 = __ftol();
          minimap_offset_2 = __ftol();
          minimap_offset_4 = __ftol();
          _DAT_0087ca1a = polygon_related_8B_ARRAY_0076108c[local_7a8].pnts_related_2;
        }
        break;
      case '\x01':
      case '\r':
      case '\x1a':
        local_7bc = 0;
        local_7d8 = ppVar6->point_1_x;
        local_6cc = (uint)*(ushort *)(local_7d8 + 0x24);
        poVar24 = (obj_related *)((uint)*(byte *)(local_7d8 + 0x3a) * 0xb + 0x5a6af8);
        if (cVar9 == '\x01') {
LAB_004689a4:
          if ((char)obj_related_array[*(byte *)(local_7d8 + 0x3a) + 3].f1 < '\x02') {
            iVar16 = (int)*(short *)(local_7d8 + 0x33);
          }
          else {
            iVar16 = (int)*(short *)(local_7d8 + 0x33) + (uint)(*(ushort *)(local_7d8 + 0x37) >> 2);
          }
          local_754 = (short *)(local_7d8 + 0x33);
          iVar16 = iVar16 * 8;
          local_7d0 = (uint)*(ushort *)(hfx_0_addr + iVar16 + 4);
          local_7d4 = (uint)*(ushort *)(hfx_0_addr + iVar16 + 6);
          if (cVar9 == '\x01') {
            if ((level_flags_1 & 0x380) != 0) {
              local_7bc = 1;
              convert_sprite_coords(local_7c8);
            }
          }
          else if (cVar9 == '\x1a') {
            local_7bc = 1;
            iVar20 = local_7d0 * 0x10;
            iVar18 = local_7d4 * 0x10;
            if ((int)local_7c8 < 0x690) {
              if ((int)local_7c8 < 0x541) {
                iVar20 = local_7d0 * 0x1500;
                iVar18 = local_7d4 * 0x1500;
              }
              else {
                iVar20 = iVar20 + (int)((0x690 - local_7c8) * iVar20 * 0x32) / 0x150;
                iVar18 = iVar18 + (int)((0x690 - local_7c8) * iVar18 * 0x32) / 0x150;
              }
            }
            local_7d0 = iVar20 >> 4;
            local_7d4 = iVar18 >> 4;
            if (200 < (int)local_7d0) {
              local_7d0 = 200;
            }
            if (200 < (int)local_7d4) {
              local_7d4 = 200;
            }
          }
          local_7e0 = (int)*(short *)&local_7e4->point_1_y - (int)local_7d0 / 2;
          iVar20 = -local_7d4;
          if (*local_754 == 0x518) {
            iVar20 = (int)(local_7d4 * -0x14 + ((int)(local_7d4 * -0x14) >> 0x1f & 0x1fU)) >> 5;
          }
          local_7dc = *(short *)((int)&local_7e4->point_1_y + 2) + iVar20;
          if ((*(byte *)(local_7d8 + 0x36) & 0x40) != 0) {
            vertices_flags = vertices_flags | 8;
          }
          if (*(char *)(local_7d8 + 0x3c) < -0xf) {
            if (local_7bc == 0) {
              add_polygon_rect_sprite(local_7e0);
            }
            else {
              add_polygon_rect_sprite_2(local_7e0,local_7dc,hfx_0_addr + iVar16);
            }
          }
          else if (*(char *)(local_7d8 + 0x3c) < '\x10') {
            set_vertex_palette_color();
            vertices_flags = vertices_flags | 8;
            if (local_7bc == 0) {
              add_polygon_rect_sprite(local_7e0);
            }
            else {
              add_polygon_rect_sprite_2(local_7e0,local_7dc,hfx_0_addr + iVar16);
            }
            set_vertex_palette_color();
            vertices_flags = vertices_flags & 0xfffffff7;
          }
          vertices_flags = vertices_flags & 0xfffffff7;
        }
        else if (cVar9 == '\r') {
          if ((*(uint *)(local_7d8 + 0x10) & 0x400000) == 0) {
            iVar16 = (int)*(short *)(local_7d8 + 0x33);
            local_660 = (uint)*(byte *)(local_7d8 + 0x39);
          }
          else {
            local_660 = 0;
            iVar16 = 0x60;
          }
          uVar4 = *(ushort *)(local_7d8 + 0x35);
          iVar16 = iVar16 + ((((int)(short)tribe_ptr->angle_1 - (int)*(short *)(local_7d8 + 0x26)) -
                              0x380U & 0x700) >> 8);
          if ((*(uint *)(local_7d8 + 0x10) & 0x20) == 0) {
            local_7b4 = (int)*(char *)(local_7d8 + 0x2f);
            local_77c = (char *)(local_7d8 + 0x2f);
          }
          else {
            iVar20 = FUN_004de700();
            if ((iVar20 == 0) || (((byte)game_state.offset_counter_2 & 2) == 0)) {
              local_7b4 = FUN_004de740();
            }
            else {
              local_7b4 = (int)*(char *)(local_7d8 + 0x2f);
            }
            local_77c = (char *)(local_7d8 + 0x2f);
            if (*local_77c != player_tribe_num) {
              poVar24 = obj_related_array + *(byte *)(local_7d8 + 0x3a);
            }
          }
          bVar15 = false;
          bVar33 = false;
          if (((*(char *)(local_7d8 + 0x2a) == '\x01') && (*(char *)(local_7d8 + 0x2b) == '\a')) ||
             ((*(char *)(local_7d8 + 0x2a) == '\n' &&
              (((*(char *)(local_7d8 + 0x2b) == '\f' && (*(char *)(local_7d8 + 0x74) == '\a')) &&
               (bVar15 = true, *(char *)(local_7d8 + 0x78) == '\0')))))) {
            bVar15 = true;
            bVar33 = true;
            iVar16 = iVar16 + local_7b4 * 8;
          }
          bVar32 = vstart_related[iVar16].index_2 != '\0';
          if ((uVar4 & 0xa000) != 0) {
            bVar32 = bVar32 | 2;
          }
          if ((uVar4 & 0x4000) != 0) {
            bVar32 = bVar32 | 4;
          }
          uVar23 = (uint)(ushort)(&(vstart_related[iVar16].vfra_ptr)->index)[local_660];
          local_7d0 = (uint)(byte)vfra_related_2[uVar23].width;
          local_7d4 = (uint)(byte)vfra_related_2[uVar23].height;
          local_7e0 = (int)*(short *)&local_7e4->point_1_y;
          local_7dc = (int)*(short *)((int)&local_7e4->point_1_y + 2);
          if (bVar15) {
            DAT_0089bc86 = -local_7c8;
LAB_00468e14:
            local_7bc = 1;
            human_anim_draw_mode = 1;
            convert_sprite_coords(DAT_0089bc86);
          }
          else if ((level_flags_1 & 0x380) != 0) {
            DAT_0089bc86 = local_7c8;
            goto LAB_00468e14;
          }
          if ((((_render_state_flags & 8) != 0) && ((*(byte *)(local_7d8 + 0x15) & 0x10) == 0)) &&
             ((*(byte *)(local_7d8 + 0x11) & 8) == 0)) {
            bVar15 = true;
            if (((*(char *)(local_7d8 + 0x2a) != '\x01') || (*local_77c != player_tribe_num)) ||
               (*(short *)(local_7d8 + 0x6c) <= *(short *)(local_7d8 + 0x6e))) {
              bVar15 = false;
            }
            if (bVar15) {
              FUN_00525450(local_7d8);
            }
          }
          iVar16 = -1;
          if (!bVar33) {
            iVar16 = local_7b4;
          }
          if (iVar16 == -1) {
            set_human_anim_no_tribe(uVar23,local_7e0);
          }
          else if (poVar24->person_type_1 == '\0') {
            set_human_anim_tribe(uVar23,local_7e0,local_7dc);
          }
          else {
            set_human_anim_tribe_person(uVar23,local_7e0,local_7dc,bVar32,iVar16);
          }
          uVar23 = local_7d4;
          if ((*(byte *)(local_7d8 + 0x15) & 0x10) == 0) {
            if ((*(byte *)(local_7d8 + 0x10) & 0x10) != 0) {
              FUN_0048a770();
            }
          }
          else {
            if ((*(byte *)(local_7d8 + 0x10) & 0x10) == 0) {
              FUN_0048a050(local_7d8);
            }
            set_vertex_palette_color();
            vertices_flags = vertices_flags | 8;
            iVar16 = hfx_0_addr + 0x2e88 + (sprite_animation_counter % 10) * 8;
            if (local_7bc == 0) {
              add_polygon_rect_sprite(local_7e0 - (uint)(*(ushort *)(iVar16 + 4) >> 1));
            }
            else {
              local_6b8 = (uint)*(ushort *)(iVar16 + 4);
              local_664 = (uint)*(ushort *)(iVar16 + 6);
              convert_sprite_coords(DAT_0089bc86);
              add_polygon_rect_sprite_2
                        (local_7e0 - (int)local_6b8 / 2,local_7dc - (int)(uVar23 * 0x28) / 0x24,
                         iVar16);
            }
            set_vertex_palette_color();
            vertices_flags = vertices_flags & 0xfffffff7;
          }
          uVar23 = local_7d4;
          if ((*(byte *)(local_7d8 + 0x15) & 0x80) != 0) {
            bVar33 = true;
            if ((*(byte *)(local_7d8 + 0xa5) < 0x10) && ((*(byte *)(local_7d8 + 0x2e) & 2) != 0)) {
              bVar33 = false;
            }
            iVar16 = 0;
            if (bVar33) {
              set_vertex_palette_color();
              vertices_flags = vertices_flags | 8;
              local_778 = (int)(uVar23 * 0x1c + ((int)(uVar23 * 0x1c) >> 0x1f & 0x1fU)) >> 5;
              local_668 = (int)(uVar23 + ((int)uVar23 >> 0x1f & 7U)) >> 3;
              local_66c = 0;
              local_598 = *(ushort *)(local_7d8 + 0x24) + sprite_animation_counter & 0xf;
              do {
                iVar20 = local_598 - local_66c;
                if (iVar20 < 0) {
                  iVar20 = iVar20 + 0x10;
                }
                iVar18 = (*(short *)(&DAT_0059d9d8 + iVar20 * 4) + iVar16) * 8 + hfx_0_addr;
                if (local_7bc == 0) {
                  add_polygon_rect_sprite(local_7e0 - (uint)(*(ushort *)(iVar18 + 4) >> 1));
                }
                else {
                  local_6bc = (uint)*(ushort *)(iVar18 + 4);
                  local_778 = (uint)*(ushort *)(iVar18 + 6);
                  convert_sprite_coords(DAT_0089bc86);
                  add_polygon_rect_sprite_2
                            (local_7e0 - (int)local_6bc / 2,
                             (local_7dc -
                             ((int)((int)*(short *)(&DAT_0059d9da + iVar20 * 4) * local_778 +
                                   ((int)((int)*(short *)(&DAT_0059d9da + iVar20 * 4) * local_778)
                                    >> 0x1f & 0xffU)) >> 8)) - local_668,iVar18);
                }
                iVar16 = iVar16 + 5;
                local_66c = local_66c + 1;
              } while (iVar16 < 0xf);
              set_vertex_palette_color();
              vertices_flags = vertices_flags & 0xfffffff7;
            }
          }
          uVar23 = local_7d4;
          if ((*(byte *)(local_7d8 + 0x16) & 8) != 0) {
            bVar33 = true;
            if ((*(byte *)(local_7d8 + 0xb1) < 0x10) && ((*(byte *)(local_7d8 + 0x2e) & 2) != 0)) {
              bVar33 = false;
            }
            if (bVar33) {
              set_vertex_palette_color();
              vertices_flags = vertices_flags | 8;
              iVar16 = hfx_0_addr + 0x2e30 + (sprite_animation_counter % 10) * 8;
              if (local_7bc == 0) {
                add_polygon_rect_sprite(local_7e0 - (uint)(*(ushort *)(iVar16 + 4) >> 1));
              }
              else {
                local_6c0 = (uint)*(ushort *)(iVar16 + 4);
                local_670 = (uint)*(ushort *)(iVar16 + 6);
                convert_sprite_coords(DAT_0089bc86);
                add_polygon_rect_sprite_2
                          (local_7e0 - (int)local_6c0 / 2,local_7dc - (int)(uVar23 * 0x28) / 0x24,
                           iVar16);
              }
              set_vertex_palette_color();
              vertices_flags = vertices_flags & 0xfffffff7;
            }
          }
          uVar23 = local_7d4;
          if ((*(byte *)(local_7d8 + 0x11) & 0x40) != 0) {
            set_vertex_palette_color();
            vertices_flags = vertices_flags | 8;
            iVar16 = hfx_0_addr + 0x3088 + (sprite_animation_counter % 0xb) * 8;
            if (local_7bc == 0) {
              add_polygon_rect_sprite(local_7e0 - (uint)(*(ushort *)(iVar16 + 4) >> 1));
            }
            else {
              local_6c4 = (uint)*(ushort *)(iVar16 + 4);
              local_674 = (uint)*(ushort *)(iVar16 + 6);
              convert_sprite_coords(DAT_0089bc86);
              add_polygon_rect_sprite_2
                        (local_7e0 - (int)local_6c4 / 2,
                         local_7dc -
                         ((int)(uVar23 * 0x28 + ((int)(uVar23 * 0x28) >> 0x1f & 0x1fU)) >> 5),iVar16
                        );
            }
            set_vertex_palette_color();
            vertices_flags = vertices_flags & 0xfffffff7;
          }
          iVar16 = local_7b4;
          if ((*(byte *)(local_7d8 + 0x10) & 0x20) != 0) {
            iVar16 = (int)*local_77c;
          }
          if (((player_tribe_num == iVar16) && (*(char *)(local_7d8 + 0x2a) == '\x01')) &&
             ((*(byte *)(local_7d8 + 0x7a) & 0x80) != 0)) {
            iVar16 = local_7d4 * 0x20;
            iVar20 = hfx_0_addr + 0x1a8;
            if (local_7bc == 0) {
              add_polygon_rect_sprite(local_7e0 - (uint)(*(ushort *)(hfx_0_addr + 0x1ac) >> 1));
            }
            else {
              local_6c8 = (uint)*(ushort *)(hfx_0_addr + 0x1ac);
              local_678 = (uint)*(ushort *)(hfx_0_addr + 0x1ae);
              convert_sprite_coords(DAT_0089bc86);
              add_polygon_rect_sprite_2
                        (local_7e0 - (int)local_6c8 / 2,
                         local_7dc - ((int)(iVar16 + (iVar16 >> 0x1f & 0x1fU)) >> 5),iVar20);
            }
          }
          uVar23 = local_7d4;
          if ((((player_tribe_num == local_7b4) && (*(char *)(local_7d8 + 0x2a) == '\x01')) &&
              (bVar32 = *(byte *)(local_7d8 + 0x7a), (bVar32 & 0x7e) != 0)) &&
             (((DAT_0089d168 != '\0' || (DAT_0089d169 != '\0')) ||
              ((DAT_0089d16a != '\0' ||
               (((DAT_0089d16b != '\0' || ((char)DAT_0089d16c != '\0')) ||
                (DAT_0089d16c._1_1_ != '\0')))))))) {
            iVar16 = 0;
            local_78c = (uint)bVar32;
            local_538 = 0;
            local_534 = 0;
            if ((DAT_0089d16c._1_1_ != '\0') && ((bVar32 & 0x40) != 0)) {
              local_538 = 6;
              iVar16 = 1;
            }
            if (((char)DAT_0089d16c != '\0') && ((bVar32 & 0x20) != 0)) {
              *(undefined1 *)((int)&local_538 + iVar16) = 5;
              iVar16 = iVar16 + 1;
            }
            if ((DAT_0089d16b != '\0') && ((bVar32 & 0x10) != 0)) {
              *(undefined1 *)((int)&local_538 + iVar16) = 4;
              iVar16 = iVar16 + 1;
            }
            if ((DAT_0089d16a != '\0') && ((bVar32 & 8) != 0)) {
              *(undefined1 *)((int)&local_538 + iVar16) = 3;
              iVar16 = iVar16 + 1;
            }
            if ((DAT_0089d169 != '\0') && ((bVar32 & 4) != 0)) {
              *(undefined1 *)((int)&local_538 + iVar16) = 2;
              iVar16 = iVar16 + 1;
            }
            if ((DAT_0089d168 != '\0') && ((bVar32 & 2) != 0)) {
              *(undefined1 *)((int)&local_538 + iVar16) = 1;
              iVar16 = iVar16 + 1;
            }
            if (iVar16 != 0) {
              FUN_0046c2e0();
              set_font_render_default();
              iVar18 = local_7dc;
              iVar12 = get_font_sprite_width_in_poly_func_2();
              iVar20 = local_7e0;
              if ((local_78c & 0x80) == 0) {
                iVar13 = uVar23 * -0x18;
                iVar13 = (int)(iVar13 + (iVar13 >> 0x1f & 0x1fU)) >> 5;
              }
              else {
                iVar13 = uVar23 * 0x20;
                iVar13 = -((int)(iVar13 + (iVar13 >> 0x1f & 0x1fU)) >> 5);
              }
              iVar13 = (iVar18 - iVar12) + iVar13;
              iVar12 = 0;
              iVar18 = get_font_sprite_width_in_poly_func_1();
              iVar20 = iVar20 - iVar18 / 2;
              if (iVar16 != 0) {
                local_5a0 = global_palette_indexes_2 + local_7b4 * 5;
                do {
                  _sprintf(local_7e6,s__d_0059da18);
                  copy_wchar();
                  palette_index_1 = DAT_0089c6f5;
                  iVar18 = get_font_type();
                  if (iVar18 == 0) {
                    local_59c = &stack0xfffff800;
                    set_indexed_value_from_system_palette(palette_index_1);
                    render_text_unicode(iVar20,iVar13,local_758);
                  }
                  else {
                    render_text_unicode_2(iVar20,iVar13);
                  }
                  palette_index_1 = *local_5a0;
                  iVar18 = get_font_type();
                  if (iVar18 == 0) {
                    local_5a4 = &stack0xfffff800;
                    set_indexed_value_from_system_palette(palette_index_1);
                    render_text_unicode(iVar20,iVar13,local_758);
                  }
                  else {
                    render_text_unicode_2(iVar20,iVar13);
                  }
                  iVar12 = iVar12 + 1;
                  iVar18 = get_font_sprite_width_in_poly_func_2();
                  iVar13 = iVar13 + ((int)(iVar18 * -0x18 + (iVar18 * -0x18 >> 0x1f & 0x1fU)) >> 5);
                } while (iVar12 < iVar16);
              }
            }
          }
          local_7e0 = local_7e0 - (int)local_7d0 / 2;
          local_7dc = local_7dc - local_7d4;
        }
        else if (cVar9 == '\x1a') goto LAB_004689a4;
        if ((land_flags_1._2_1_ & 0x40) == 0) {
          if ((*(byte *)(local_7d8 + 0x35) & 0x80) != 0) {
            iVar20 = (int)DAT_0087caa0;
            iVar16 = (int)DAT_0087caa2;
            cVar9 = FUN_004de610();
            if ((((cVar9 == '\0') && (local_7e0 <= iVar20)) &&
                (iVar20 <= (int)(local_7d0 + local_7e0))) &&
               ((local_7dc <= iVar16 && (iVar16 <= (int)(local_7d4 + local_7dc))))) {
              unit_index_2 = 0;
              unit_index_1 = (ushort)local_6cc;
              DAT_0087cac4 = (undefined2)local_7e0;
              DAT_0087cac6 = (undefined2)local_7dc;
              DAT_0087cac8 = (undefined2)local_7d0;
              DAT_0087caca = (undefined2)local_7d4;
            }
          }
        }
        else if (unit_index_1 == local_6cc) {
          unit_index_2 = 0;
          _render_state_flags = _render_state_flags | 0x100;
          unit_index_1 = (ushort)local_6cc;
          DAT_0087cac4 = (undefined2)local_7e0;
          DAT_0087cac6 = (undefined2)local_7dc;
          DAT_0087cac8 = (undefined2)local_7d0;
          DAT_0087caca = (undefined2)local_7d4;
        }
        break;
      case '\x04':
        local_7e0 = (int)*(short *)&ppVar6->point_1_x;
        local_7dc = (int)*(short *)((int)&ppVar6->point_1_x + 2) -
                    (uint)*(ushort *)(hfx_0_addr + 0x5e + *(char *)&ppVar6->point_1_y * 8);
        break;
      case '\x05':
        local_7e0 = (int)*(short *)&ppVar6->point_1_x;
        local_7dc = (int)*(short *)((int)&ppVar6->point_1_x + 2) -
                    (uint)*(ushort *)(*(char *)&ppVar6->point_1_y * 8 + hfx_0_addr + 0x5e);
        add_polygon_rect_sprite(local_7e0);
        break;
      case '\x06':
        switch(ppVar6->tex_size_type) {
        case 0:
          goto switchD_0046995d_caseD_0;
        case 1:
          local_60 = ppVar6->point_1_x;
          local_5c = ppVar6->point_1_y;
          local_50 = ppVar6->point_1_color;
          if ((local_50 & 0xff000000) == 0) {
            uVar23 = 0xff;
            if ((int)local_50 < 0x20) {
              uVar23 = local_50 * 8;
            }
            local_50 = (uVar23 | 0xffffff00) << 0x10 | uVar23 << 8 | uVar23;
          }
          local_4c = 0;
          local_40 = ppVar6->point_2_x;
          local_3c = ppVar6->point_2_y;
          local_30 = ppVar6->point_2_color;
          if ((local_30 & 0xff000000) == 0) {
            uVar23 = 0xff;
            if ((int)local_30 < 0x20) {
              uVar23 = local_30 * 8;
            }
            local_30 = (uVar23 | 0xffff0000) << 8 | uVar23 << 0x10 | uVar23;
          }
          local_2c = 0;
          copy_vertex_and_specular(&ppVar6->point_3_x);
          puVar36 = local_20;
          puVar35 = &local_40;
          puVar34 = &local_60;
          uVar14 = 0;
          break;
        default:
          switch(ppVar6->tex_size_type) {
          case 3:
            bVar15 = false;
            bVar33 = true;
            break;
          case 4:
          case 0x20:
            bVar15 = false;
            bVar33 = true;
            break;
          default:
            bVar15 = false;
            bVar33 = false;
            break;
          case 6:
            bVar15 = false;
            bVar33 = false;
            break;
          case 0x16:
            bVar15 = true;
            bVar33 = false;
          }
          add_sprite_to_landscape_storage
                    (bl320_sprite_bank_1[(byte)ppVar6->tex_index + 0xff],&local_3b8);
          local_75c = uv_3;
          if (texture_min_mag_value != 0) {
            local_75c = uv_2;
          }
          local_75c = local_75c * local_3a4;
          local_67c = uv_1;
          if (texture_min_mag_value != 0) {
            local_67c = uv_4;
          }
          local_67c = local_67c * local_3a4;
          local_6d0 = (local_3ac + (local_67c - local_75c)) * _DAT_0058f47c;
          local_6d8 = ((local_67c - local_75c) + local_3a8) * _DAT_0058f47c;
          local_6d4 = local_75c + local_3b4;
          local_6dc = local_75c + local_3b0;
          local_360 = local_7e4->point_1_x;
          local_35c = local_7e4->point_1_y;
          local_350 = local_7e4->point_1_color;
          if ((local_350 & 0xff000000) == 0) {
            local_34c = 0;
            if ((int)local_350 < 0x20) {
              uVar23 = local_350 * 8;
            }
            else {
              uVar23 = 0xff;
              uVar30 = local_350 * 5 - 0xa0;
              if (0x100 < uVar30) {
                uVar30 = 0x100;
              }
              local_34c = (uVar30 * 0xfd & 0xffff00) << 8 | uVar30 * 0xb9 & 0xffffff00 |
                          uVar30 * 0x35 >> 8;
            }
            local_350 = (uVar23 | 0xffff0000) << 8 | uVar23 << 0x10 | uVar23;
          }
          else {
            local_34c = 0;
          }
          local_348 = (float)(int)local_7e4->point_1_u * local_6d0 + local_6d4;
          local_344 = (float)(int)local_7e4->point_1_v * local_6d8 + local_6dc;
          local_340 = local_7e4->point_2_x;
          local_33c = local_7e4->point_2_y;
          local_330 = local_7e4->point_2_color;
          if ((local_330 & 0xff000000) == 0) {
            local_32c = 0;
            if ((int)local_330 < 0x20) {
              uVar23 = local_330 * 8;
            }
            else {
              uVar23 = 0xff;
              uVar30 = local_330 * 5 - 0xa0;
              if (0x100 < uVar30) {
                uVar30 = 0x100;
              }
              local_32c = (uVar30 * 0xfd & 0xffff00) << 8 | uVar30 * 0xb9 & 0xffffff00 |
                          uVar30 * 0x35 >> 8;
            }
            local_330 = (uVar23 | 0xffffff00) << 0x10 | uVar23 << 8 | uVar23;
          }
          else {
            local_32c = 0;
          }
          local_328 = (float)(int)local_7e4->point_2_u * local_6d0 + local_6d4;
          local_324 = (float)(int)local_7e4->point_2_v * local_6d8 + local_6dc;
          local_320 = local_7e4->point_3_x;
          local_31c = local_7e4->point_3_y;
          local_310 = local_7e4->point_3_color;
          if ((local_310 & 0xff000000) == 0) {
            local_30c = 0;
            if ((int)local_310 < 0x20) {
              uVar23 = local_310 * 8;
            }
            else {
              uVar23 = 0xff;
              uVar30 = local_310 * 5 - 0xa0;
              if (0x100 < uVar30) {
                uVar30 = 0x100;
              }
              local_30c = (uVar30 * 0xfd & 0xffff00) << 8 | uVar30 * 0xb9 & 0xffffff00 |
                          uVar30 * 0x35 >> 8;
            }
            local_310 = (uVar23 | 0xffff0000) << 8 | uVar23 << 0x10 | uVar23;
          }
          else {
            local_30c = 0;
          }
          local_308 = (float)(int)local_7e4->point_3_u * local_6d0 + local_6d4;
          local_304 = (float)(int)local_7e4->point_3_v * local_6d8 + local_6dc;
          if (bVar33) {
            local_310 = 0xffffffff;
            local_330 = 0xffffffff;
            local_350 = 0xffffffff;
          }
          if (bVar15) {
            local_350 = local_350 & 0xffffff | 0xaa000000;
            local_330 = local_330 & 0xffffff | 0xaa000000;
            local_310 = local_310 & 0xffffff | 0xaa000000;
          }
          puVar36 = &local_320;
          puVar35 = &local_340;
          puVar34 = &local_360;
          uVar14 = local_3b8;
          break;
        case 7:
          add_sprite_to_landscape_storage
                    (bl320_sprite_bank_1[(byte)ppVar6->tex_index + 0xff],&local_3d4);
          local_760 = uv_3;
          if (texture_min_mag_value != 0) {
            local_760 = uv_2;
          }
          local_760 = local_760 * local_3c0;
          local_680 = uv_1;
          if (texture_min_mag_value != 0) {
            local_680 = uv_4;
          }
          local_680 = local_680 * local_3c0;
          local_6e0 = (local_3c8 + (local_680 - local_760)) * _DAT_0058f47c;
          local_6e8 = ((local_680 - local_760) + local_3c4) * _DAT_0058f47c;
          local_6e4 = local_760 + local_3d0;
          local_6ec = local_760 + local_3cc;
          local_2a0 = local_7e4->point_1_x;
          local_29c = local_7e4->point_1_y;
          local_290 = local_7e4->point_1_color;
          if ((local_290 & 0xff000000) == 0) {
            local_28c = 0;
            if ((int)local_290 < 0x20) {
              uVar23 = local_290 * 8;
            }
            else {
              uVar23 = 0xff;
              uVar30 = local_290 * 5 - 0xa0;
              if (0x100 < uVar30) {
                uVar30 = 0x100;
              }
              local_28c = (uVar30 * 0xfd & 0xffff00) << 8 | uVar30 * 0xb9 & 0xffffff00 |
                          uVar30 * 0x35 >> 8;
            }
            local_290 = (uVar23 | 0xffffff00) << 0x10 | uVar23 << 8 | uVar23;
          }
          else {
            local_28c = 0;
          }
          local_288 = (float)(int)local_7e4->point_1_u * local_6e0 + local_6e4;
          local_284 = (float)(int)local_7e4->point_1_v * local_6e8 + local_6ec;
          local_280 = local_7e4->point_2_x;
          local_27c = local_7e4->point_2_y;
          local_270 = local_7e4->point_2_color;
          if ((local_270 & 0xff000000) == 0) {
            local_26c = 0;
            if ((int)local_270 < 0x20) {
              uVar23 = local_270 * 8;
            }
            else {
              uVar23 = 0xff;
              uVar30 = local_270 * 5 - 0xa0;
              if (0x100 < uVar30) {
                uVar30 = 0x100;
              }
              local_26c = (uVar30 * 0xfd & 0xffff00) << 8 | uVar30 * 0xb9 & 0xffffff00 |
                          uVar30 * 0x35 >> 8;
            }
            local_270 = (uVar23 | 0xffffff00) << 0x10 | uVar23 << 8 | uVar23;
          }
          else {
            local_26c = 0;
          }
          local_268 = (float)(int)local_7e4->point_2_u * local_6e0 + local_6e4;
          local_264 = (float)(int)local_7e4->point_2_v * local_6e8 + local_6ec;
          local_260 = local_7e4->point_3_x;
          local_25c = local_7e4->point_3_y;
          local_250 = local_7e4->point_3_color;
          if ((local_250 & 0xff000000) == 0) {
            local_24c = 0;
            if ((int)local_250 < 0x20) {
              uVar23 = local_250 * 8;
            }
            else {
              uVar23 = 0xff;
              uVar30 = local_250 * 5 - 0xa0;
              if (0x100 < uVar30) {
                uVar30 = 0x100;
              }
              local_24c = (uVar30 * 0xfd & 0xffff00) << 8 | uVar30 * 0xb9 & 0xffffff00 |
                          uVar30 * 0x35 >> 8;
            }
            local_250 = (uVar23 | 0xffff0000) << 8 | uVar23 << 0x10 | uVar23;
          }
          else {
            local_24c = 0;
          }
          local_248 = (float)(int)local_7e4->point_3_u * local_6e0 + local_6e4;
          puVar36 = &local_260;
          puVar35 = &local_280;
          puVar34 = &local_2a0;
          local_244 = (float)(int)local_7e4->point_3_v * local_6e8 + local_6ec;
          uVar14 = local_3d4;
          break;
        case 8:
        case 9:
          add_sprite_to_landscape_storage
                    (bl320_sprite_bank_1[(byte)ppVar6->tex_index + 0xff],&local_3f0);
          local_764 = uv_3;
          if (texture_min_mag_value != 0) {
            local_764 = uv_2;
          }
          local_764 = local_764 * local_3dc;
          local_684 = uv_1;
          if (texture_min_mag_value != 0) {
            local_684 = uv_4;
          }
          local_684 = local_684 * local_3dc;
          local_6f0 = (local_3e4 + (local_684 - local_764)) * _DAT_0058f47c;
          local_6f8 = ((local_684 - local_764) + local_3e0) * _DAT_0058f47c;
          local_6f4 = local_764 + local_3ec;
          local_6fc = local_764 + local_3e8;
          local_300 = local_7e4->point_1_x;
          local_2fc = local_7e4->point_1_y;
          local_2f0 = local_7e4->point_1_color;
          if ((local_2f0 & 0xff000000) == 0) {
            local_2ec = 0;
            if ((int)local_2f0 < 0x20) {
              uVar23 = local_2f0 * 8;
            }
            else {
              uVar23 = 0xff;
              uVar30 = local_2f0 * 5 - 0xa0;
              if (0x100 < uVar30) {
                uVar30 = 0x100;
              }
              local_2ec = (uVar30 * 0xfd & 0xffff00) << 8 | uVar30 * 0xb9 & 0xffffff00 |
                          uVar30 * 0x35 >> 8;
            }
            local_2f0 = (uVar23 | 0xffffff00) << 0x10 | uVar23 << 8 | uVar23;
          }
          else {
            local_2ec = 0;
          }
          local_2e8 = (float)(int)local_7e4->point_1_u * local_6f0 + local_6f4;
          local_2e4 = (float)(int)local_7e4->point_1_v * local_6f8 + local_6fc;
          local_2e0 = local_7e4->point_2_x;
          local_2dc = local_7e4->point_2_y;
          local_2d0 = local_7e4->point_2_color;
          if ((local_2d0 & 0xff000000) == 0) {
            local_2cc = 0;
            if ((int)local_2d0 < 0x20) {
              uVar23 = local_2d0 * 8;
            }
            else {
              uVar23 = 0xff;
              uVar30 = local_2d0 * 5 - 0xa0;
              if (0x100 < uVar30) {
                uVar30 = 0x100;
              }
              local_2cc = (uVar30 * 0xfd & 0xffff00) << 8 | uVar30 * 0xb9 & 0xffffff00 |
                          uVar30 * 0x35 >> 8;
            }
            local_2d0 = (uVar23 | 0xffffff00) << 0x10 | uVar23 << 8 | uVar23;
          }
          else {
            local_2cc = 0;
          }
          local_2c8 = (float)(int)local_7e4->point_2_u * local_6f0 + local_6f4;
          local_2c4 = (float)(int)local_7e4->point_2_v * local_6f8 + local_6fc;
          local_2c0 = local_7e4->point_3_x;
          local_2bc = local_7e4->point_3_y;
          local_2b0 = local_7e4->point_3_color;
          if ((local_2b0 & 0xff000000) == 0) {
            local_2ac = 0;
            if ((int)local_2b0 < 0x20) {
              uVar23 = local_2b0 * 8;
            }
            else {
              uVar23 = 0xff;
              uVar30 = local_2b0 * 5 - 0xa0;
              if (0x100 < uVar30) {
                uVar30 = 0x100;
              }
              local_2ac = (uVar30 * 0xfd & 0xffff00) << 8 | uVar30 * 0xb9 & 0xffffff00 |
                          uVar30 * 0x35 >> 8;
            }
            local_2b0 = (uVar23 | 0xffffff00) << 0x10 | uVar23 << 8 | uVar23;
          }
          else {
            local_2ac = 0;
          }
          local_2a8 = (float)(int)local_7e4->point_3_u * local_6f0 + local_6f4;
          puVar36 = &local_2c0;
          puVar35 = &local_2e0;
          puVar34 = &local_300;
          local_2a4 = (float)(int)local_7e4->point_3_v * local_6f8 + local_6fc;
          uVar14 = local_3f0;
        }
        add_polygon_triangle_texture_80(puVar34,puVar35,puVar36,uVar14);
switchD_0046995d_caseD_0:
        uVar4 = local_7e4->tex_index_2;
        if (((uint)unit_index_2 != (int)(short)uVar4) &&
           (((iVar16 = 0, local_37e[0] == uVar4 || (iVar16 = 1, local_37e[5] == uVar4)) ||
            (iVar16 = 2, local_37e[10] == uVar4)))) {
          local_700 = __ftol();
          local_70c = __ftol();
          iVar12 = (int)DAT_0087caa2;
          iVar20 = __ftol();
          local_708 = __ftol();
          iVar18 = (int)DAT_0087caa0;
          if ((local_700 - local_70c) * (iVar12 - iVar20) +
              (local_708 - iVar20) * (iVar18 - local_700) < 0) {
            bVar33 = false;
          }
          else {
            local_704 = __ftol();
            iVar13 = __ftol();
            if ((local_704 - local_700) * (iVar12 - iVar13) +
                (iVar20 - iVar13) * (iVar18 - local_704) < 0) {
              bVar33 = false;
            }
            else {
              bVar33 = -1 < (local_70c - local_704) * (iVar12 - local_708) +
                            (iVar13 - local_708) * (iVar18 - local_70c);
            }
          }
          if (bVar33) {
            unit_index_1 = 0;
            _DAT_0087cad0 = local_37e[iVar16 * 5 + 1];
            _DAT_0087cad2 = local_37e[iVar16 * 5 + 2];
            unit_index_2 = local_37e[iVar16 * 5];
            _DAT_0087cad4 = local_37e[iVar16 * 5 + 3];
            _DAT_0087cad6 = local_37e[iVar16 * 5 + 4];
            local_37e[iVar16 * 5] = 0;
          }
        }
        break;
      case '\b':
        add_sprite_to_landscape_storage
                  (bl320_sprite_bank_2[*(byte *)&ppVar6->tex_index_2],&local_40c);
        local_768 = uv_3;
        if (texture_min_mag_value != 0) {
          local_768 = uv_2;
        }
        local_768 = local_3f8 * local_768;
        local_688 = uv_1;
        if (texture_min_mag_value != 0) {
          local_688 = uv_4;
        }
        local_688 = local_3f8 * local_688;
        local_710 = (local_400 + (local_688 - local_768)) * _DAT_0058f47c;
        local_718 = ((local_688 - local_768) + local_3fc) * _DAT_0058f47c;
        local_714 = local_768 + local_408;
        local_71c = local_768 + local_404;
        local_c0 = local_7e4->point_1_x;
        local_bc = local_7e4->point_1_y;
        local_b0 = local_7e4->point_1_color;
        if ((local_b0 & 0xff000000) == 0) {
          local_ac = 0;
          if ((int)local_b0 < 0x20) {
            uVar23 = local_b0 * 8;
          }
          else {
            uVar23 = 0xff;
            uVar30 = local_b0 * 5 - 0xa0;
            if (0x100 < uVar30) {
              uVar30 = 0x100;
            }
            local_ac = (uVar30 * 0xfd & 0xffff00) << 8 | uVar30 * 0xb9 & 0xffffff00 |
                       uVar30 * 0x35 >> 8;
          }
          local_b0 = (uVar23 | 0xffffff00) << 0x10 | uVar23 << 8 | uVar23;
        }
        else {
          local_ac = 0;
        }
        local_a8 = (float)(int)local_7e4->point_1_u * local_710 + local_714;
        local_a4 = (float)(int)local_7e4->point_1_v * local_718 + local_71c;
        local_a0 = local_7e4->point_2_x;
        local_9c = local_7e4->point_2_y;
        local_90 = local_7e4->point_2_color;
        if ((local_90 & 0xff000000) == 0) {
          local_8c = 0;
          if ((int)local_90 < 0x20) {
            uVar23 = local_90 * 8;
          }
          else {
            uVar23 = 0xff;
            uVar30 = local_90 * 5 - 0xa0;
            if (0x100 < uVar30) {
              uVar30 = 0x100;
            }
            local_8c = (uVar30 * 0xfd & 0xffff00) << 8 | uVar30 * 0xb9 & 0xffffff00 |
                       uVar30 * 0x35 >> 8;
          }
          local_90 = (uVar23 | 0xffff0000) << 8 | uVar23 << 0x10 | uVar23;
        }
        else {
          local_8c = 0;
        }
        local_88 = (float)(int)local_7e4->point_2_u * local_710 + local_714;
        local_84 = (float)(int)local_7e4->point_2_v * local_718 + local_71c;
        copy_vertex_and_specular(&local_7e4->point_3_x);
        local_68 = (float)(int)local_7e4->point_3_u * local_710 + local_714;
        local_64 = (float)(int)local_7e4->point_3_v * local_718 + local_71c;
        add_polygon_triangle_texture_80(&local_c0,&local_a0,local_80,local_40c);
        break;
      case '\t':
        local_7e0 = *(short *)&ppVar6->point_1_y + -5;
        sVar5 = *(short *)((int)&ppVar6->point_1_y + 2);
        local_4cc = (int)sVar5;
        local_7dc = local_4cc + -10;
        local_4d0 = *(short *)&ppVar6->point_1_y + 5;
        local_608 = &stack0xfffff800;
        local_4d8 = local_7e0;
        local_4d4 = local_7dc;
        set_indexed_value_from_system_palette
                  (CONCAT31((int3)(char)((ushort)sVar5 >> 8),
                            (&DAT_0089c6f3)[*(byte *)(ppVar6->point_1_x + 0x2b)]));
        FUN_00516890(&local_4d8);
        break;
      case '\n':
        local_7e0 = *(short *)&ppVar6->point_1_y + -5;
        local_7dc = *(short *)((int)&ppVar6->point_1_y + 2) + -10;
        local_7d0 = (uint)(*(short *)(ppVar6->point_1_x + 0x6c) >> (DAT_0089c67d & 0x1f));
        FUN_005255b0(local_7e0,local_7dc,local_7d0);
        break;
      case '\v':
        uVar23 = (uint)*(ushort *)(ppVar6->point_1_x + 0x68);
        *(short *)(&DAT_00895fc7 + uVar23 * 0x9e) =
             *(short *)&ppVar6->point_1_y - ((short)(&DAT_00895fcb)[uVar23 * 0x4f] >> 1);
        *(short *)(&DAT_00895fc9 + uVar23 * 0x9e) =
             *(short *)((int)&ppVar6->point_1_y + 2) - (&DAT_00895fcd)[uVar23 * 0x4f];
        FUN_00504b70();
        break;
      case '\f':
        local_7d0 = 0x12;
        local_7dc = (int)*(short *)((int)&ppVar6->point_1_y + 2);
        local_7e0 = *(short *)&ppVar6->point_1_y + -9;
        iVar20 = 0;
        iVar18 = 0;
        uVar3 = *(undefined1 *)(ppVar6->point_1_x + 0x76);
        vertices_flags = uVar23 | 8;
        iVar16 = local_7e0;
        do {
          local_4e0 = local_7d0 - iVar18;
          local_60c = &stack0xfffff800;
          iVar18 = iVar18 + 2;
          local_4e0 = local_4e0 + local_7e0;
          local_4e4 = 0;
          local_4dc = local_7dc + iVar20;
          iVar20 = iVar20 + 1;
          local_4e8 = iVar16;
          set_indexed_value_from_system_palette(uVar3);
          FUN_00516890(&local_4e8);
          iVar16 = iVar16 + 2;
        } while (iVar18 < 8);
        goto LAB_0046c185;
      case '\x0e':
        local_610 = &stack0xfffff800;
        set_indexed_value_from_system_palette
                  (CONCAT31((int3)((uint)ppVar6 >> 8),*(undefined1 *)&ppVar6->point_1_u));
        set_texture_4((int)*(short *)&ppVar6->point_1_x,(int)*(short *)((int)&ppVar6->point_1_x + 2)
                      ,(int)*(short *)&ppVar6->point_1_y,
                      (int)*(short *)((int)&ppVar6->point_1_y + 2));
        break;
      case '\x0f':
      case '\x10':
      case '\x19':
        if (cVar9 == '\x0f') {
          local_720 = 0x16;
        }
        else if (cVar9 == '\x10') {
          local_720 = 0x47;
        }
        else if (cVar9 == '\x19') {
          local_720 = 0x46;
        }
        iVar20 = local_720 * 8;
        iVar16 = hfx_0_addr + iVar20;
        local_7d0 = (uint)*(ushort *)(iVar16 + 4);
        local_7d4 = (uint)*(ushort *)(iVar16 + 6);
        if ((level_flags_1 & 0x380) == 0) {
          local_7e0 = (int)*(short *)&ppVar6->point_1_x - local_7d0 / 2;
          vertices_flags = uVar23 | 8;
          local_7dc = ((int)*(short *)((int)&ppVar6->point_1_x + 2) - local_7d4) + 2;
          add_polygon_rect_sprite(local_7e0);
        }
        else {
          convert_sprite_coords(local_7c8);
          local_7e0 = (int)*(short *)&local_7e4->point_1_x - (int)local_7d0 / 2;
          local_7dc = ((int)*(short *)((int)&local_7e4->point_1_x + 2) - local_7d4) + 2;
          vertices_flags = vertices_flags | 8;
          add_polygon_rect_sprite_2(local_7e0,local_7dc,hfx_0_addr + iVar20);
        }
        goto LAB_0046c185;
      case '\x11':
        local_7e0 = *(short *)&ppVar6->point_1_y + -5;
        local_7d0 = 2;
        local_7dc = *(short *)((int)&ppVar6->point_1_y + 2) + -10;
        draw_insect((float)local_7e0,(float)local_7dc,0x40e00000);
        break;
      case '\x12':
        iVar16 = ppVar6->point_1_x;
        uVar4 = *(ushort *)(iVar16 + 0x24);
        if ((char)obj_related_array[*(byte *)(iVar16 + 0x3a) + 3].f1 < '\x02') {
          iVar20 = (int)*(short *)(iVar16 + 0x33);
        }
        else {
          iVar20 = (uint)(*(ushort *)(iVar16 + 0x37) >> 2) + (int)*(short *)(iVar16 + 0x33);
        }
        iVar20 = iVar20 * 8;
        local_7d0 = (int)((uint)*(ushort *)(hfx_0_addr + iVar20 + 4) *
                         (int)*(short *)&ppVar6->point_1_y) >> 8;
        local_7d4 = (int)((uint)*(ushort *)(hfx_0_addr + iVar20 + 6) *
                         (int)*(short *)((int)&ppVar6->point_1_y + 2)) >> 8;
        if ((level_flags_1 & 0x380) != 0) {
          convert_sprite_coords(local_7c8);
        }
        local_7e0 = (int)*(short *)&local_7e4->point_1_u - (int)local_7d0 / 2;
        local_7dc = (int)*(short *)((int)&local_7e4->point_1_u + 2) - local_7d4;
        if ((*(byte *)(iVar16 + 0x36) & 0x40) != 0) {
          vertices_flags = vertices_flags | 8;
        }
        if (*(char *)(iVar16 + 0x3c) < -0xf) {
          add_polygon_rect_sprite_2(local_7e0,local_7dc,hfx_0_addr + iVar20);
        }
        else {
          set_vertex_palette_color();
          vertices_flags = vertices_flags | 8;
          add_polygon_rect_sprite_2(local_7e0,local_7dc,hfx_0_addr + iVar20);
          set_vertex_palette_color();
        }
        vertices_flags = vertices_flags & 0xfffffff7;
        if ((land_flags_1._2_1_ & 0x40) == 0) {
          if ((*(byte *)(iVar16 + 0x35) & 0x80) != 0) {
            iVar20 = (int)DAT_0087caa0;
            iVar16 = (int)DAT_0087caa2;
            cVar9 = FUN_004de610();
            if (((cVar9 == '\0') && (local_7e0 <= iVar20)) &&
               ((iVar20 <= (int)(local_7d0 + local_7e0) &&
                ((local_7dc <= iVar16 && (iVar16 <= (int)(local_7d4 + local_7dc))))))) {
              unit_index_2 = 0;
              DAT_0087cac4 = (undefined2)local_7e0;
              DAT_0087cac6 = (undefined2)local_7dc;
              DAT_0087cac8 = (undefined2)local_7d0;
              DAT_0087caca = (undefined2)local_7d4;
              unit_index_1 = uVar4;
            }
          }
        }
        else if (unit_index_1 == uVar4) {
          unit_index_2 = 0;
          _render_state_flags = _render_state_flags | 0x100;
          DAT_0087cac4 = (undefined2)local_7e0;
          DAT_0087cac6 = (undefined2)local_7dc;
          DAT_0087cac8 = (undefined2)local_7d0;
          DAT_0087caca = (undefined2)local_7d4;
          unit_index_1 = uVar4;
        }
        break;
      case '\x13':
        vertices_flags = 8;
        psVar27 = (short *)((int)&ppVar6->point_1_x + 2);
        DAT_005da07c = 200;
        set_texture_5((int)*(short *)&ppVar6->point_1_x,(int)*psVar27,
                      (int)*(short *)&ppVar6->point_1_y,(int)*(short *)((int)&ppVar6->point_1_y + 2)
                      ,0xc8ffffff,3);
        FUN_00475350(CONCAT22(extraout_var_00,*(undefined2 *)&ppVar6->point_1_x),
                     CONCAT22(extraout_var,*psVar27));
        vertices_flags = uVar23;
        DAT_005da07c = uVar14;
        break;
      case '\x15':
        if ((((*(short *)&ppVar6->point_1_y <= DAT_0087caa0) &&
             (DAT_0087caa0 <= *(short *)&ppVar6->point_1_u)) &&
            (puVar26 = (ushort *)((int)&ppVar6->point_1_y + 2),
            *(short *)((int)&ppVar6->point_1_y + 2) <= DAT_0087caa2)) &&
           (DAT_0087caa2 <= *(short *)((int)&ppVar6->point_1_u + 2))) {
          local_37e[local_380 * 5] = *(ushort *)(ppVar6->point_1_x + 0x24);
          local_37e[local_380 * 5 + 1] = *(ushort *)&ppVar6->point_1_y;
          local_37e[local_380 * 5 + 2] = *puVar26;
          local_37e[local_380 * 5 + 3] = *(short *)&ppVar6->point_1_u - *(short *)&ppVar6->point_1_y
          ;
          local_37e[local_380 * 5 + 4] = *(short *)((int)&ppVar6->point_1_u + 2) - *puVar26;
          local_380 = local_380 + 1;
          if (2 < local_380) {
            local_380 = 0;
          }
        }
        break;
      case '\x17':
        FUN_00475860();
        break;
      case '\x18':
        iVar16 = hfx_0_addr + *(short *)&ppVar6->point_1_y * 8;
        local_7e0 = (int)*(short *)&ppVar6->point_1_x - (uint)(*(ushort *)(iVar16 + 4) >> 1);
        local_7dc = (int)*(short *)((int)&ppVar6->point_1_x + 2) - (uint)*(ushort *)(iVar16 + 6);
        set_vertex_palette_color();
        vertices_flags = vertices_flags | 8;
        add_polygon_rect_sprite(local_7e0);
LAB_0046c178:
        set_vertex_palette_color();
LAB_0046c185:
        vertices_flags = vertices_flags & 0xfffffff7;
        break;
      case '\x1b':
        if (*(char *)((int)&ppVar6->tex_index_2 + 1) == '\0') {
          add_sprite_to_landscape_storage
                    (bl320_sprite_bank_2[*(byte *)&ppVar6->tex_index_2],&local_428);
          local_76c = uv_3;
          if (texture_min_mag_value != 0) {
            local_76c = uv_2;
          }
          local_76c = local_76c * local_414;
          local_68c = uv_1;
          if (texture_min_mag_value != 0) {
            local_68c = uv_4;
          }
          local_68c = local_68c * local_414;
          local_724 = (local_41c + (local_68c - local_76c)) * _DAT_0058f47c;
          local_72c = ((local_68c - local_76c) + local_418) * _DAT_0058f47c;
          local_728 = local_76c + local_424;
          local_730 = local_76c + local_420;
          local_7cc = (float *)&local_7e4->point_1_x;
          local_120 = *local_7cc;
          local_734 = &local_7e4->point_1_y;
          local_11c = *local_734;
          local_110 = local_7e4->point_1_color;
          if ((local_110 & 0xff000000) == 0) {
            local_10c = 0;
            if ((int)local_110 < 0x20) {
              uVar23 = local_110 * 8;
            }
            else {
              uVar23 = 0xff;
              uVar30 = local_110 * 5 - 0xa0;
              if (0x100 < uVar30) {
                uVar30 = 0x100;
              }
              local_10c = (uVar30 * 0xfd & 0xffff00) << 8 | uVar30 * 0xb9 & 0xffffff00 |
                          uVar30 * 0x35 >> 8;
            }
            local_110 = (uVar23 | 0xffff0000) << 8 | uVar23 << 0x10 | uVar23;
          }
          else {
            local_10c = 0;
          }
          local_108 = (float)(int)local_7e4->point_1_u * local_724 + local_728;
          local_104 = (float)(int)local_7e4->point_1_v * local_72c + local_730;
          copy_vertex_and_specular(&local_7e4->point_2_x);
          local_e8 = (float)(int)local_7e4->point_2_u * local_724 + local_728;
          local_e4 = (float)(int)local_7e4->point_2_v * local_72c + local_730;
          local_e0 = local_7e4->point_3_x;
          local_dc = local_7e4->point_3_y;
          local_d0 = local_7e4->point_3_color;
          if ((local_d0 & 0xff000000) == 0) {
            local_cc = 0;
            if ((int)local_d0 < 0x20) {
              uVar23 = local_d0 * 8;
            }
            else {
              uVar23 = 0xff;
              uVar30 = local_d0 * 5 - 0xa0;
              if (0x100 < uVar30) {
                uVar30 = 0x100;
              }
              local_cc = (uVar30 * 0xfd & 0xffff00) << 8 | uVar30 * 0xb9 & 0xffffff00 |
                         uVar30 * 0x35 >> 8;
            }
            local_d0 = (uVar23 | 0xffffff00) << 0x10 | uVar23 << 8 | uVar23;
          }
          else {
            local_cc = 0;
          }
          local_c8 = (float)(int)local_7e4->point_3_u * local_724 + local_728;
          local_c4 = (float)(int)local_7e4->point_3_v * local_72c + local_730;
          add_polygon_triangle_texture_80(&local_120,local_100,&local_e0,local_428);
          if (DAT_0087cae9 != '\0') {
            local_634 = &stack0xfffff800;
            palette_index_fill_textures = global_palette_indexes;
            set_indexed_value_from_system_palette(global_palette_indexes);
            uVar14 = __ftol();
            uVar14 = __ftol(uVar14);
            uVar14 = __ftol(uVar14);
            uVar14 = __ftol(uVar14);
            set_texture_4(uVar14);
            local_638 = &stack0xfffff800;
            set_indexed_value_from_system_palette(palette_index_fill_textures);
            uVar14 = __ftol();
            uVar14 = __ftol(uVar14);
            uVar14 = __ftol(uVar14);
            uVar14 = __ftol(uVar14);
            set_texture_4(uVar14);
            local_63c = &stack0xfffff800;
            set_indexed_value_from_system_palette(palette_index_fill_textures);
            uVar14 = __ftol();
            uVar14 = __ftol(uVar14);
            uVar14 = __ftol(uVar14);
            uVar14 = __ftol(uVar14);
            set_texture_4(uVar14);
          }
        }
        break;
      case '\x1c':
        pfVar25 = (float *)&ppVar6->point_1_x;
        pfVar31 = local_4c8;
        for (iVar16 = 5; iVar16 != 0; iVar16 = iVar16 + -1) {
          *pfVar31 = *pfVar25;
          pfVar25 = pfVar25 + 1;
          pfVar31 = pfVar31 + 1;
        }
        if (*(char *)((int)&ppVar6->point_3_x + 1) == '\0') {
          pfVar25 = (float *)&ppVar6->point_2_x;
          pfVar31 = local_4a0;
          for (iVar16 = 5; iVar16 != 0; iVar16 = iVar16 + -1) {
            *pfVar31 = *pfVar25;
            pfVar25 = pfVar25 + 1;
            pfVar31 = pfVar31 + 1;
          }
          pfVar25 = local_4a0;
          pfVar31 = local_4b4;
          for (iVar16 = 5; iVar16 != 0; iVar16 = iVar16 + -1) {
            *pfVar31 = *pfVar25;
            pfVar25 = pfVar25 + 1;
            pfVar31 = pfVar31 + 1;
          }
          pfVar25 = local_4c8;
          pfVar31 = local_48c;
          for (iVar16 = 5; iVar16 != 0; iVar16 = iVar16 + -1) {
            *pfVar31 = *pfVar25;
            pfVar25 = pfVar25 + 1;
            pfVar31 = pfVar31 + 1;
          }
          palette_index_fill_textures = 0x17;
          switch(*(undefined1 *)&ppVar6->point_3_x) {
          case 0:
            local_4b4[1] = local_4a0[1];
LAB_0046b9b8:
            local_4b4[1] = local_4b4[1] + _DAT_0058f484;
            local_48c[1] = local_4c8[1] + _DAT_0058f484;
            break;
          case 1:
            local_4b4[0] = local_4a0[0] - _DAT_0058f484;
            local_48c[0] = local_4c8[0] - _DAT_0058f484;
            break;
          case 2:
            local_4b4[1] = local_4a0[1] - _DAT_0058f484;
            local_48c[1] = local_4c8[1] - _DAT_0058f484;
            break;
          case 3:
            local_4b4[0] = local_4a0[0] + _DAT_0058f484;
            local_48c[0] = local_4c8[0] + _DAT_0058f484;
          }
        }
        else {
          pfVar25 = local_4c8;
          pfVar31 = local_48c;
          for (iVar16 = 5; iVar16 != 0; iVar16 = iVar16 + -1) {
            *pfVar31 = *pfVar25;
            pfVar25 = pfVar25 + 1;
            pfVar31 = pfVar31 + 1;
          }
          pfVar25 = local_4c8;
          pfVar31 = local_4b4;
          for (iVar16 = 5; iVar16 != 0; iVar16 = iVar16 + -1) {
            *pfVar31 = *pfVar25;
            pfVar25 = pfVar25 + 1;
            pfVar31 = pfVar31 + 1;
          }
          pfVar25 = local_4c8;
          pfVar31 = local_4a0;
          for (iVar16 = 5; iVar16 != 0; iVar16 = iVar16 + -1) {
            *pfVar31 = *pfVar25;
            pfVar25 = pfVar25 + 1;
            pfVar31 = pfVar31 + 1;
          }
          palette_index_fill_textures = 0x1f;
          switch(*(undefined1 *)&ppVar6->point_3_x) {
          case 0:
            local_4a0[1] = local_4c8[1] + _DAT_0058f484;
            local_4b4[0] = local_4c8[0] - _DAT_0058f484;
            local_4b4[1] = local_4b4[1] + _DAT_0058f484;
            local_48c[0] = local_4b4[0];
            break;
          case 1:
            local_4b4[0] = local_4c8[0] - _DAT_0058f484;
            local_4b4[1] = local_4b4[1] - _DAT_0058f484;
            local_48c[1] = local_4c8[1] - _DAT_0058f484;
            local_4a0[0] = local_4b4[0];
            break;
          case 2:
            local_4a0[1] = local_4c8[1] - _DAT_0058f484;
            local_4b4[0] = local_4c8[0] + _DAT_0058f484;
            local_4b4[1] = local_4b4[1] - _DAT_0058f484;
            local_48c[0] = local_4b4[0];
            break;
          case 3:
            local_4b4[0] = local_4c8[0] + _DAT_0058f484;
            local_4a0[0] = local_4b4[0];
            goto LAB_0046b9b8;
          }
        }
        uVar30 = local_47c;
        uVar23 = local_4a4;
        local_4bc = 0xfffff;
        local_494 = 0xfffff;
        DAT_00d1c004 = bl320_sprite_pointers[palette_index_fill_textures];
        local_4c0 = 0;
        local_498 = 0x1fffff;
        add_sprite_to_landscape_storage(bl320_sprite_bank_2[palette_index_fill_textures],&local_444)
        ;
        local_770 = uv_3;
        if (texture_min_mag_value != 0) {
          local_770 = uv_2;
        }
        local_770 = local_430 * local_770;
        local_690 = uv_1;
        if (texture_min_mag_value != 0) {
          local_690 = uv_4;
        }
        local_690 = local_430 * local_690;
        local_738 = (local_438 + (local_690 - local_770)) * _DAT_0058f47c;
        local_740 = ((local_690 - local_770) + local_434) * _DAT_0058f47c;
        local_73c = local_770 + local_440;
        local_744 = local_770 + local_43c;
        local_180 = local_4c8[0];
        local_17c = local_4c8[1];
        if ((local_4b8 & 0xff000000) == 0) {
          local_16c = 0;
          if ((int)local_4b8 < 0x20) {
            local_170 = local_4b8 * 8;
          }
          else {
            local_170 = 0xff;
            uVar19 = local_4b8 * 5 - 0xa0;
            if (0x100 < uVar19) {
              uVar19 = 0x100;
            }
            local_16c = (uVar19 * 0xfd & 0xffff00) << 8 | uVar19 * 0xb9 & 0xffffff00 |
                        uVar19 * 0x35 >> 8;
          }
          local_170 = (local_170 | 0xffffff00) << 0x10 | local_170 << 8 | local_170;
        }
        else {
          local_16c = 0;
          local_170 = local_4b8;
        }
        local_168 = (float)local_4c0 * local_738 + local_73c;
        local_164 = (float)local_4bc * local_740 + local_744;
        copy_vertex_and_specular(local_4a0);
        local_140 = local_4b4[0];
        local_148 = (float)local_498 * local_738 + local_73c;
        local_13c = local_4b4[1];
        local_144 = (float)local_494 * local_740 + local_744;
        if ((uVar23 & 0xff000000) == 0) {
          local_12c = 0;
          if ((int)uVar23 < 0x20) {
            local_130 = uVar23 * 8;
          }
          else {
            local_130 = 0xff;
            uVar19 = uVar23 * 5 - 0xa0;
            if (0x100 < uVar19) {
              uVar19 = 0x100;
            }
            local_12c = (uVar19 * 0xfd & 0xffff00) << 8 | uVar19 * 0xb9 & 0xffffff00 |
                        uVar19 * 0x35 >> 8;
          }
          local_130 = (local_130 | 0xffff0000) << 8 | local_130 << 0x10 | local_130;
        }
        else {
          local_12c = 0;
          local_130 = uVar23;
        }
        local_128 = local_738 * _DAT_0058f488 + local_73c;
        local_124 = local_740 * _DAT_0058f488 + local_744;
        add_polygon_triangle_texture_80(&local_180,local_160,&local_140,local_444);
        add_sprite_to_landscape_storage(bl320_sprite_bank_2[palette_index_fill_textures],&local_460)
        ;
        local_774 = uv_3;
        if (texture_min_mag_value != 0) {
          local_774 = uv_2;
        }
        local_774 = local_774 * local_44c;
        local_694 = uv_1;
        if (texture_min_mag_value != 0) {
          local_694 = uv_4;
        }
        local_694 = local_694 * local_44c;
        local_698 = (local_454 + (local_694 - local_774)) * _DAT_0058f47c;
        local_69c = ((local_694 - local_774) + local_450) * _DAT_0058f47c;
        local_748 = local_774 + local_45c;
        local_6a0 = local_774 + local_458;
        copy_vertex_and_specular(local_4c8);
        local_1c8 = (float)local_4c0 * local_698 + local_748;
        local_1c4 = (float)local_4bc * local_69c + local_6a0;
        local_1c0 = local_4b4[0];
        local_1bc = local_4b4[1];
        if ((uVar23 & 0xff000000) == 0) {
          local_1ac = 0;
          if ((int)uVar23 < 0x20) {
            local_1b0 = uVar23 * 8;
          }
          else {
            local_1b0 = 0xff;
            uVar23 = uVar23 * 5 - 0xa0;
            if (0x100 < uVar23) {
              uVar23 = 0x100;
            }
            local_1ac = (uVar23 * 0xfd & 0xffff00) << 8 | uVar23 * 0xb9 & 0xffffff00 |
                        uVar23 * 0x35 >> 8;
          }
          local_1b0 = (local_1b0 | 0xffff0000) << 8 | local_1b0 << 0x10 | local_1b0;
        }
        else {
          local_1ac = 0;
          local_1b0 = uVar23;
        }
        local_1a8 = local_698 * _DAT_0058f488 + local_748;
        local_1a0 = local_48c[0];
        local_19c = local_48c[1];
        local_6a4 = local_69c * _DAT_0058f488 + local_6a0;
        if ((uVar30 & 0xff000000) == 0) {
          local_18c = 0;
          if ((int)uVar30 < 0x20) {
            local_190 = uVar30 * 8;
          }
          else {
            local_190 = 0xff;
            uVar23 = uVar30 * 5 - 0xa0;
            if (0x100 < uVar23) {
              uVar23 = 0x100;
            }
            local_18c = (uVar23 * 0xfd & 0xffff00) << 8 | uVar23 * 0xb9 & 0xffffff00 |
                        uVar23 * 0x35 >> 8;
          }
          local_190 = (local_190 | 0xffffff00) << 0x10 | local_190 << 8 | local_190;
        }
        else {
          local_18c = 0;
          local_190 = uVar30;
        }
        local_188 = local_748;
        local_1a4 = local_6a4;
        local_184 = local_6a4;
        add_polygon_triangle_texture_80(local_1e0,&local_1c0,&local_1a0,local_460);
        break;
      case '\x1e':
      case '\x1f':
        bVar33 = cVar9 != '\x1e';
        if (bVar33) {
          iVar16 = *(char *)&ppVar6->point_1_x + 0x219;
        }
        else {
          iVar16 = *(char *)&ppVar6->point_1_x + 0x626;
        }
        iVar20 = hfx_0_addr + iVar16 * 8;
        local_7d0 = (uint)*(ushort *)(iVar20 + 4);
        local_7d4 = (uint)*(ushort *)(iVar20 + 6);
        uVar23 = level_flags_1 & 0x380;
        if (uVar23 != 0) {
          convert_sprite_coords(local_7c8);
        }
        local_7e0 = (int)*(short *)((int)&local_7e4->point_1_x + 2) - (int)local_7d0 / 2;
        local_7dc = (int)*(short *)&local_7e4->point_1_y - local_7d4;
        if (!bVar33) {
          set_vertex_palette_color();
          vertices_flags = vertices_flags | 8;
        }
        if (uVar23 == 0) {
          add_polygon_rect_sprite(local_7e0);
        }
        else {
          add_polygon_rect_sprite_2(local_7e0,local_7dc,hfx_0_addr + iVar16 * 8);
        }
        if (!bVar33) goto LAB_0046c178;
      }
      uVar23 = vertices_flags;
      uVar14 = DAT_005da07c;
      ppVar6 = local_7e4->next;
    }
    local_6a8 = local_6a8 + -1;
    local_7c8 = local_7c8 - 1;
    if (local_7c8 == 0) {
      return;
    }
  } while( true );
}
