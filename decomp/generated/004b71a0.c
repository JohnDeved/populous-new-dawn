/* Ghidra 12.1.3 pseudocode; entry 004b71a0; free_anibl0_derivative_3.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void free_anibl0_derivative_3(void)

{
  temp_sprite_struct *ptVar1;
  IDirectDrawSurface *This;
  temp_sprite_struct **pptVar2;
  IDirectDrawSurface **ppIVar3;

  ppIVar3 = anibl0_surfaces_array;
  pptVar2 = bl320_sprite_bank_1;
  do {
    ptVar1 = *pptVar2;
    if (ptVar1 != (temp_sprite_struct *)0x0) {
      ptVar1->add_to_surface = &PTR_blit_sprite_to_surface_0058f784;
      free_2(ptVar1);
    }
    This = *ppIVar3;
    *pptVar2 = (temp_sprite_struct *)0x0;
    if (This != (IDirectDrawSurface *)0x0) {
      (*This->lpVtbl->Release)(This);
      *ppIVar3 = (IDirectDrawSurface *)0x0;
    }
    ppIVar3 = ppIVar3 + 1;
    pptVar2 = pptVar2 + 1;
  } while (pptVar2 < bl320_sprite_bank_2);
  free_landscape_texture_storage_dyn_mem();
  return;
}
