/* Ghidra 12.1.3 pseudocode; entry 004fd7c0; init_font_array.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void init_font_array(void)

{
  undefined *puVar1;
  int iVar2;
  sprite_file_ext *psVar3;
  uint uVar4;
  uint uVar5;
  int iVar6;
  font_struct *pfVar7;
  undefined4 *unaff_FS_OFFSET;
  undefined4 local_10;
  undefined1 *puStack_c;
  undefined4 local_8;

  local_10 = *unaff_FS_OFFSET;
  local_8 = 0xffffffff;
  puStack_c = &LAB_004fda7f;
  *unaff_FS_OFFSET = &local_10;
  font_num = 0;
  do {
    iVar2 = font_num;
    font_num = font_num + 1;
  } while (*font_struct_ARRAY_005d5b08[iVar2].field0_0x0 != '#');
  pfVar7 = font_struct_ARRAY_005d5b08;
  iVar6 = 0;
  font_num = iVar2;
  if (0 < iVar2) {
    do {
      if (font_type == 7) {
        puVar1 = pfVar7->field1_0x4;
      }
      else if (font_type == 8) {
        puVar1 = pfVar7->field2_0x8;
      }
      else {
        puVar1 = pfVar7->field0_0x0;
      }
      iVar2 = get_font_type();
      if (iVar2 == 0) {
        psVar3 = operator_new(0x18);
        if (psVar3 == (sprite_file_ext *)0x0) {
          psVar3 = (sprite_file_ext *)0x0;
        }
        else {
          (psVar3->base).vtable = (sprite_file_base_vtable *)&sprite_file_def_vtable;
          (psVar3->base).mem = (void *)0x0;
          (psVar3->base).size = 0;
          (psVar3->base).vtable = (sprite_file_base_vtable *)&sprite_file_ext_vtable;
          (psVar3->base).mem = (void *)0x0;
          psVar3->mem_start = 0;
          psVar3->file_size = 0;
          psVar3->sprite_num = 0;
        }
        local_8 = 0xffffffff;
        pfVar7->sprite = psVar3;
        reset_global_palettes();
        no_file_message();
        file_name_validation(global_string_buffer,puVar1);
        load_sprite_internal(global_string_buffer,0,pfVar7->sprite);
        pfVar7->sprite_type = 0;
        pfVar7->sprite_width = 0;
        pfVar7->sprite_height = 0;
        uVar5 = 0;
        if (pfVar7->sprite->sprite_num != 0) {
          iVar2 = 0;
          do {
            uVar4 = (uint)*(ushort *)(pfVar7->sprite->mem_start + 4 + iVar2);
            if ((int)pfVar7->sprite_width < (int)uVar4) {
              pfVar7->sprite_width = uVar4;
            }
            uVar4 = (uint)*(ushort *)(pfVar7->sprite->mem_start + 6 + iVar2);
            if ((int)pfVar7->sprite_height < (int)uVar4) {
              pfVar7->sprite_height = uVar4;
            }
            iVar2 = iVar2 + 8;
            uVar5 = uVar5 + 1;
          } while (uVar5 < (uint)pfVar7->sprite->sprite_num);
        }
      }
      else {
        psVar3 = operator_new(0x18);
        if (psVar3 == (sprite_file_ext *)0x0) {
          psVar3 = (sprite_file_ext *)0x0;
        }
        else {
          (psVar3->base).vtable = (sprite_file_base_vtable *)&sprite_file_def_vtable;
          (psVar3->base).mem = (void *)0x0;
          (psVar3->base).size = 0;
          (psVar3->base).vtable = (sprite_file_base_vtable *)&sprite_file_ext_vtable;
          (psVar3->base).mem = (void *)0x0;
          psVar3->mem_start = 0;
          psVar3->file_size = 0;
          psVar3->sprite_num = 0;
        }
        local_8 = 0xffffffff;
        pfVar7->sprite = psVar3;
        pfVar7->sprite_type = 1;
        switch(iVar6) {
        case 0:
        case 0xb:
          if (font_type == 0xb) {
            pfVar7->sprite->mem_start = font_4;
            pfVar7->sprite_height = 0xc;
            pfVar7->sprite_width = 0xc;
          }
          else {
            pfVar7->sprite->mem_start = font_2;
            pfVar7->sprite_height = 0x10;
            pfVar7->sprite_width = 0x10;
          }
          break;
        case 1:
        case 2:
        case 3:
        case 4:
        case 5:
          pfVar7->sprite->mem_start = font_2;
          pfVar7->sprite_height = 0x10;
          pfVar7->sprite_width = 0x10;
          break;
        case 6:
        case 7:
        case 8:
        case 9:
        case 10:
          pfVar7->sprite->mem_start = font_3;
          pfVar7->sprite_height = 0x18;
          pfVar7->sprite_width = 0x18;
        }
      }
      iVar6 = iVar6 + 1;
      pfVar7 = pfVar7 + 1;
    } while (iVar6 < font_num);
  }
  *unaff_FS_OFFSET = local_10;
  font_struct_ptr = font_struct_ARRAY_005d5b08;
  return;
}
