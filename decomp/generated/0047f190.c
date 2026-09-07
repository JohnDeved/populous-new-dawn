/* Ghidra 12.1.3 pseudocode; entry 0047f190; init_pls_panel_texture.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


/* WARNING: Enum "_D3DRENDERSTATETYPE": Some values do not have unique names */

int init_pls_panel_texture(void)

{
  int *piVar1;
  texture_block *ptVar2;
  int iVar3;
  texture_block *ptVar4;
  int iVar5;
  int iVar6;
  undefined4 *unaff_FS_OFFSET;
  undefined4 local_10;
  undefined1 *puStack_c;
  undefined4 local_8;

  local_10 = *unaff_FS_OFFSET;
  local_8 = 0xffffffff;
  puStack_c = &LAB_0047f29d;
  *unaff_FS_OFFSET = &local_10;
  iVar3 = load_panel_texture_internal
                    (pls_panel_sprites.mem_start,pal0_mem,0x40,&PTR_0059e2f4,&PTR_0059e2fc);
  ptVar2 = PTR_0059e2fc;
  if (iVar3 == 0) {
    ptVar4 = operator_new((int)PTR_0059e2fc * 0x70);
    local_8 = 0;
    if (ptVar4 == (texture_block *)0x0) {
      ptVar4 = (texture_block *)0x0;
    }
    else {
      while (ptVar2 = (texture_block *)((int)&ptVar2[-1].texture_array_ptr + 3), -1 < (int)ptVar2) {
        init_texture_block_1();
      }
    }
    iVar5 = 0;
    iVar6 = 0;
    local_8 = 0xffffffff;
    PTR_0059e2f8 = ptVar4;
    if (0 < (int)PTR_0059e2fc) {
      do {
        iVar3 = d3d_create_material_for_texture_block
                          (*(undefined4 *)
                            ((int)&((texture_block *)(PTR_0059e2f4->array_4 + -2))->func_ptr + iVar5
                            ),0,0);
        piVar1 = *(int **)((int)&((texture_block *)(PTR_0059e2f4->array_4 + -2))->func_ptr + iVar5);
        if (piVar1 != (int *)0x0) {
          (**(code **)(*piVar1 + 8))(piVar1);
          *(undefined4 *)((int)&((texture_block *)(PTR_0059e2f4->array_4 + -2))->func_ptr + iVar5) =
               0;
        }
        if (iVar3 < 0) goto LAB_0047f287;
        iVar5 = iVar5 + 4;
        iVar6 = iVar6 + 1;
      } while (iVar6 < (int)PTR_0059e2fc);
    }
    iVar3 = 0;
  }
LAB_0047f287:
  *unaff_FS_OFFSET = local_10;
  return iVar3;
}
