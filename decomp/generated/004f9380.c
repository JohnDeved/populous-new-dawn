/* Ghidra 12.1.3 pseudocode; entry 004f9380; add_triangle_to_draw.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


undefined4 __fastcall add_triangle_to_draw(int param_1)

{
  int iVar1;
  _union_3447 *p_Var2;
  D3DTLVERTEX *pDVar3;

  if (((int)indices_ptr_global_prev - (int)indices_ptr_global >> 1) + 3U < 0x2001) {
    *indices_ptr_global_prev = to_draw_num_global;
    indices_ptr_global_prev[1] = to_draw_num_global + 1;
    indices_ptr_global_prev[2] = to_draw_num_global + 2;
    indices_ptr_global_prev = indices_ptr_global_prev + 3;
    p_Var2 = (_union_3447 *)(param_1 + 0x20);
    pDVar3 = vertices_ptr_global;
    for (iVar1 = 0x18; iVar1 != 0; iVar1 = iVar1 + -1) {
      pDVar3->sx = *p_Var2;
      p_Var2 = p_Var2 + 1;
      pDVar3 = (D3DTLVERTEX *)&pDVar3->sy;
    }
    vertices_ptr_global[2].sz = *(_union_3449 *)(param_1 + 0x14);
    vertices_ptr_global[1].sz = vertices_ptr_global[2].sz;
    vertices_ptr_global->sz = vertices_ptr_global[1].sz;
    vertices_ptr_global[2].rhw.rhw = 1.0;
    vertices_ptr_global[1].rhw = vertices_ptr_global[2].rhw;
    vertices_ptr_global->rhw = vertices_ptr_global[1].rhw;
    vertices_ptr_global = vertices_ptr_global + 3;
    to_draw_num_global = to_draw_num_global + 3;
    return 0x80;
  }
  return 0x80;
}
