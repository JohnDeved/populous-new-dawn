/* Ghidra 12.1.3 pseudocode; entry 004e4b40; landscape_init_1.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */
/* WARNING: Enum "_D3DRENDERSTATETYPE": Some values do not have unique names */

undefined4 landscape_init_1(void)

{
  float fVar1;
  float fVar2;
  int iVar3;
  landscape_coords *plVar4;
  texture_block_long *ptVar5;
  undefined4 *puVar6;

  debug_log(s__BEGIN__Initialising_landscape_005d54a8);
  ptVar5 = landscape_texture_blocks_mem;
  puVar6 = (undefined4 *)landscape_texture_array_indexes;
  for (iVar3 = 0x80; fVar2 = _DAT_0058f848, iVar3 != 0; iVar3 = iVar3 + -1) {
    *puVar6 = 0x1010101;
    puVar6 = puVar6 + 1;
  }
  plVar4 = landscape_coords_global;
  while( true ) {
    plVar4->texture_block_ptr = ptVar5;
    ptVar5 = ptVar5 + 1;
    plVar4->f2 = (fVar2 / (float)texture_size_global) * _DAT_0058f828;
    plVar4->f3 = (fVar2 / (float)texture_size_global) * _DAT_0058f828;
    plVar4->f4 = (fVar2 / (float)texture_size_global) * _DAT_0058f82c + fVar2;
    plVar4->f5 = (fVar2 / (float)texture_size_global) * _DAT_0058f82c + fVar2;
    plVar4->f6 = plVar4->f4 - plVar4->f2;
    fVar1 = plVar4->f5 - plVar4->f3;
    if ((landscape_coords *)((int)&landscape_coords_global[0x1ff].f7 + 3) < plVar4 + 1) break;
    plVar4->f7 = fVar1;
    plVar4 = plVar4 + 1;
  }
  plVar4->f7 = fVar1;
  debug_log(s__END__Initialising_landscape_005d5488);
  return 0;
}
