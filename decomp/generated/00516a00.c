/* Ghidra 12.1.3 pseudocode; entry 00516a00; add_vertex_ghost_index.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


/* WARNING: Enum "_D3DRENDERSTATETYPE": Some values do not have unique names */

void add_vertex_ghost_index(int *param_1,uint param_2,undefined4 param_3)

{
  uint uVar1;
  uint uVar2;
  uint uVar3;
  int iVar4;
  undefined4 uVar5;

  uVar1 = param_2 >> 0x10 & 0xff;
  uVar2 = param_2 >> 8 & 0xff;
  uVar3 = param_2 & 0xff;
  iVar4 = 0xff;
  if (DAT_005da078 != 0) {
    FUN_00527e50(param_1,param_2,param_3);
    return;
  }
  uVar5 = 0;
  if (((byte)vertices_flags & 8) == 0) {
    if (((byte)vertices_flags & 0x10) == 0) goto LAB_00516ad6;
    iVar4 = 0x100 - DAT_005da07c;
  }
  else {
    iVar4 = DAT_005da07c;
    if (ghost_mem_ptr_2 != &ghost0_mem) {
      uVar1 = (uint)(byte)ghost_mem_ptr_2[(uint)((byte)param_3 | 0xf) * 0x100];
      uVar2 = (uint)*(byte *)((int)system_palette_mem + uVar1 * 4 + 1);
      uVar3 = (uint)*(byte *)((int)system_palette_mem + uVar1 * 4 + 2);
      uVar1 = (uint)*(byte *)(system_palette_mem + uVar1);
      iVar4 = (uint)((byte)param_3 & 0xf) << 4;
    }
  }
  uVar5 = 0x40;
LAB_00516ad6:
  D3DTLVERTEX_005da170.sx.sx = (D3DVALUE)*param_1;
  D3DTLVERTEX_005da170.sy.sy = (D3DVALUE)param_1[1];
  D3DTLVERTEX_005da190.sx.sx = (D3DVALUE)param_1[2];
  D3DTLVERTEX_005da1b0.sy.sy = (D3DVALUE)param_1[3];
  D3DTLVERTEX_005da170.color.color = (iVar4 << 0x10 | uVar2) << 8 | uVar1 << 0x10 | uVar3;
  D3DTLVERTEX_005da190.sy.sy = D3DTLVERTEX_005da170.sy.sy;
  D3DTLVERTEX_005da190.color.color = D3DTLVERTEX_005da170.color.color;
  D3DTLVERTEX_005da1b0.sx.sx = D3DTLVERTEX_005da190.sx.sx;
  D3DTLVERTEX_005da1b0.color.color = D3DTLVERTEX_005da170.color.color;
  D3DTLVERTEX_005da1d0.sx.sx = D3DTLVERTEX_005da170.sx.sx;
  D3DTLVERTEX_005da1d0.sy.sy = D3DTLVERTEX_005da1b0.sy.sy;
  D3DTLVERTEX_005da1d0.color.color = D3DTLVERTEX_005da170.color.color;
  add_polygon_quad_texture_a0
            (&D3DTLVERTEX_005da170,&D3DTLVERTEX_005da190,&D3DTLVERTEX_005da1b0,&D3DTLVERTEX_005da1d0
             ,0,uVar5);
  return;
}
