/* Ghidra 12.1.3 pseudocode; entry 0042d390; add_colored_rect_global_storage.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


/* WARNING: Enum "_D3DRENDERSTATETYPE": Some values do not have unique names */

void add_colored_rect_global_storage(int param_1,int param_2,byte param_3)

{
  int iVar1;
  int iVar2;
  int local_50;
  int local_4c [4];
  int local_3c;
  int local_38 [4];
  int local_28;
  int local_24 [4];
  int local_14;
  int local_10 [4];

  param_2 = param_2 * 0x200;
  param_1 = param_1 * 0x200;
  tex_struct_fn_3(param_1,param_2,&local_3c,local_38);
  tex_struct_fn_3(param_1 + 0x200,param_2,&local_28,local_24);
  tex_struct_fn_3(param_1,param_2 + 0x200,&local_14,local_10);
  tex_struct_fn_3(param_1 + 0x200,param_2 + 0x200,&local_50,local_4c);
  iVar2 = (local_4c[0] - local_24[0]) * (local_28 - local_3c);
  iVar1 = (local_50 - local_28) * (local_24[0] - local_38[0]);
  if ((iVar2 - iVar1 == 0 || iVar2 < iVar1) &&
     ((local_10[0] - local_4c[0]) * (local_50 - local_3c) <=
      (local_14 - local_50) * (local_4c[0] - local_38[0]))) {
    iVar1 = (uint)(byte)al0_mem[(uint)(param_3 | 0xf) * 0x100] * 4;
    D3DTLVERTEX_0067ad08.sx.sx = (D3DVALUE)local_3c;
    D3DTLVERTEX_0067ad08.sy.sy = (D3DVALUE)local_38[0];
    D3DTLVERTEX_0067ac88.color.color =
         ((uint)*(byte *)((int)system_palette_mem + iVar1 + 1) | (uint)param_3 << 0x14) << 8 |
         (uint)*(byte *)(system_palette_mem + (byte)al0_mem[(uint)(param_3 | 0xf) * 0x100]) << 0x10
         | (uint)*(byte *)((int)system_palette_mem + iVar1 + 2);
    D3DTLVERTEX_0067ad08.sz.sz = 0.0;
    D3DTLVERTEX_0067ad08.specular.specular = 0;
    D3DTLVERTEX_0067ad08.tv.tv = 0.0;
    D3DTLVERTEX_0067ac88.sx.sx = (D3DVALUE)local_28;
    D3DTLVERTEX_0067ad08.tu.tu = 0.0;
    D3DTLVERTEX_0067ac88.sz.sz = 0.0;
    D3DTLVERTEX_0067ac88.specular.specular = 0;
    D3DTLVERTEX_0067ac88.tv.tv = 0.0;
    D3DTLVERTEX_0067ac88.sy.sy = (D3DVALUE)local_24[0];
    D3DTLVERTEX_0067ac88.tu.tu = 0.0;
    D3DTLVERTEX_0067acc8.sz.sz = 0.0;
    D3DTLVERTEX_0067acc8.specular.specular = 0;
    D3DTLVERTEX_0067acc8.tv.tv = 0.0;
    D3DTLVERTEX_0067acc8.tu.tu = 0.0;
    D3DTLVERTEX_0067acc8.sx.sx = (D3DVALUE)local_14;
    D3DTLVERTEX_0067acc8.sy.sy = (D3DVALUE)local_10[0];
    D3DTLVERTEX_0067ad28.sz.sz = 0.0;
    D3DTLVERTEX_0067ad28.sx.sx = (D3DVALUE)local_50;
    D3DTLVERTEX_0067ad28.sy.sy = (D3DVALUE)local_4c[0];
    D3DTLVERTEX_0067ad28.specular.specular = 0;
    D3DTLVERTEX_0067ad28.tv.tv = 0.0;
    D3DTLVERTEX_0067ad28.tu.tu = 0.0;
    D3DTLVERTEX_0067acc8.color.color = D3DTLVERTEX_0067ac88.color.color;
    D3DTLVERTEX_0067ad08.color.color = D3DTLVERTEX_0067ac88.color.color;
    D3DTLVERTEX_0067ad28.color.color = D3DTLVERTEX_0067ac88.color.color;
    add_polygon_quad_texture_a0
              (&D3DTLVERTEX_0067ad08,&D3DTLVERTEX_0067ac88,&D3DTLVERTEX_0067ad28,
               &D3DTLVERTEX_0067acc8,0,0x40);
  }
  return;
}
