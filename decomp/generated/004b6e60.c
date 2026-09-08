/* Ghidra 12.1.3 pseudocode; entry 004b6e60; init_objs_d3d.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


/* WARNING: Enum "_D3DRENDERSTATETYPE": Some values do not have unique names */

int init_objs_d3d(void)

{
  ushort uVar1;
  LPDIRECTDRAWSURFACE pIVar2;
  int iVar3;
  uint uVar4;
  ushort uVar5;
  temp_sprite_struct *ptVar6;
  ushort uVar7;
  ushort *puVar8;
  ushort *puVar9;
  _DDSURFACEDESC *p_Var10;
  sprite_geom_params *psVar11;
  undefined4 *unaff_FS_OFFSET;
  _DDSURFACEDESC local_ac;
  undefined4 local_40;
  undefined4 local_3c;
  undefined4 local_38;
  int local_34;
  temp_sprite_struct **local_30;
  temp_sprite_struct **local_2c;
  void **local_28;
  int *local_24;
  int local_20;
  undefined4 local_1c;
  ushort *local_18;
  IDirectDrawSurface **local_14;
  undefined4 local_10;
  undefined1 *puStack_c;
  undefined4 local_8;

  local_10 = *unaff_FS_OFFSET;
  local_8 = 0xffffffff;
  puStack_c = &LAB_004b7183;
  *unaff_FS_OFFSET = &local_10;
  debug_log(s_Initialising_Objects____005d4454);
  local_38 = 0x40;
  local_40 = 0;
  local_3c = 0;
  iVar3 = init_texture_cache_2
                    (ui_struct->direct_draw,ui_struct->ef1,*(undefined4 *)(ui_struct->d3 + 0x6c),1,
                     0x20,&local_38,-(uint)(*(int *)(ui_struct->d3 + 0x7c) == 1) & (uint)&local_40);
  if (iVar3 == 0) {
    local_30 = bl320_sprite_bank_1;
    local_2c = bl320_sprite_bank_2;
    local_28 = bl320_sprite_pointers;
    local_24 = null_ARRAY_005d2910;
    for (local_14 = anibl0_surfaces_array; local_14 < &dsky_filename_template_x1;
        local_14 = local_14 + 1) {
      iVar3 = create_dd_surface(ui_struct->direct_draw,0x20,0x20,
                                *(undefined4 *)(ui_struct->d3 + 0x6c),ui_struct->ef1,0x1800,local_14
                               );
      if (iVar3 != 0) goto LAB_004b7172;
      create_clipper(ui_struct->direct_draw,*local_28,0x20,0x20,0x100,
                     *(undefined4 *)(ui_struct->d3 + 0x6c),*local_14,0,0,
                     (*local_24 == 0) - 1 & 0x87f000,0);
      p_Var10 = &local_ac;
      for (iVar3 = 0x1b; iVar3 != 0; iVar3 = iVar3 + -1) {
        p_Var10->dwSize = 0;
        p_Var10 = (_DDSURFACEDESC *)&p_Var10->dwFlags;
      }
      local_ac.dwSize = 0x6c;
      iVar3 = (*(*local_14)->lpVtbl->Lock)(*local_14,(LPRECT)0x0,&local_ac,1,(HANDLE)0x0);
      if (iVar3 != 0) goto LAB_004b7172;
      uVar4 = local_ac.field4_0x10.dwLinearSize /
              (local_ac.ddpfPixelFormat.field3_0xc.dwRGBBitCount >> 3);
      local_18 = local_ac.lpSurface;
      local_34 = 0x20;
      uVar5 = ~(ushort)local_ac.ddpfPixelFormat.field7_0x1c.dwRGBAlphaBitMask;
      local_1c = (temp_sprite_struct *)CONCAT22(uVar5,(undefined2)local_1c);
      do {
        iVar3 = 0x1f;
        puVar9 = local_18;
        uVar7 = *local_18;
        do {
          puVar8 = puVar9 + 1;
          if ((puVar9[1] != 0) && (uVar7 == 0)) {
            *puVar9 = uVar5 & puVar9[1];
          }
          uVar1 = *puVar8;
          if ((uVar1 == 0) && (uVar7 != 0)) {
            *puVar8 = uVar5 & uVar7;
          }
          iVar3 = iVar3 + -1;
          puVar9 = puVar8;
          uVar7 = uVar1;
        } while (iVar3 != 0);
        local_18 = local_18 + uVar4;
        local_34 = local_34 + -1;
      } while (local_34 != 0);
      local_20 = 0x20;
      local_18 = local_ac.lpSurface;
      do {
        iVar3 = 0x1f;
        puVar9 = local_18;
        uVar7 = *local_18;
        do {
          puVar9 = puVar9 + uVar4;
          if ((*puVar9 != 0) && (uVar7 == 0)) {
            puVar9[-uVar4] = uVar5 & *puVar9;
          }
          uVar1 = *puVar9;
          if ((uVar1 == 0) && (uVar7 != 0)) {
            *puVar9 = uVar5 & uVar7;
          }
          iVar3 = iVar3 + -1;
          uVar7 = uVar1;
        } while (iVar3 != 0);
        local_18 = local_18 + 1;
        local_20 = local_20 + -1;
      } while (local_20 != 0);
      iVar3 = (*(*local_14)->lpVtbl->Unlock)(*local_14,(LPVOID)0x0);
      if (iVar3 != 0) goto LAB_004b7172;
      pIVar2 = *local_14;
      local_1c = operator_new(0x40);
      ptVar6 = (temp_sprite_struct *)0x0;
      if (local_1c != (temp_sprite_struct *)0x0) {
        local_1c->add_to_surface = &PTR_wrong_method_exit_0058f78c;
        local_1c->field1_0x4 = 0;
        local_1c->field3_0x24 = 0;
        local_1c->field4_0x28 = 0;
        local_1c->sum = 0x20;
        local_1c->max_lines = 0x20;
        psVar11 = &local_1c->geom;
        for (iVar3 = 7; iVar3 != 0; iVar3 = iVar3 + -1) {
          psVar11->f1 = 0.0;
          psVar11 = (sprite_geom_params *)&psVar11->f2;
        }
        local_1c->add_to_surface = &PTR_blit_sprite_to_surface_0058f784;
        local_1c->dd_surface = pIVar2;
        local_1c->sprite = (sprite_entry *)0x0;
        local_1c->wdith = 0;
        ptVar6 = local_1c;
      }
      local_8 = 0xffffffff;
      *local_2c = ptVar6;
      *local_30 = ptVar6;
      local_2c = local_2c + 1;
      local_28 = local_28 + 1;
      local_24 = local_24 + 1;
      local_30 = local_30 + 1;
    }
    debug_log(s_OK_005d4450);
    iVar3 = 0;
  }
LAB_004b7172:
  *unaff_FS_OFFSET = local_10;
  return iVar3;
}
