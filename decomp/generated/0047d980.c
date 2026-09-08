/* Ghidra 12.1.3 pseudocode; entry 0047d980; add_polygon_quad_texture_a0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void __thiscall
add_polygon_quad_texture_a0
          (int param_1,undefined4 *param_2,float *param_3,float *param_4,undefined4 *param_5,
          undefined4 param_6,undefined4 param_7)

{
  float *pfVar1;
  int iVar2;
  int iVar3;
  float *pfVar4;
  float *pfVar5;
  undefined4 *puVar6;

  puVar6 = *(undefined4 **)(param_1 + 0x20002a);
  if (puVar6 <= (undefined4 *)(param_1 + 0x1ff82aU)) {
    if (puVar6 != (undefined4 *)0x0) {
      puVar6[7] = 0;
      *puVar6 = &vertices_mem_vtable_invalid;
      puVar6[1] = 0;
      *puVar6 = &vertices_mem_vtable_quad_160;
    }
    iVar2 = *(int *)(param_1 + 0x20002a);
    puVar6 = (undefined4 *)(iVar2 + 0x20);
    for (iVar3 = 8; iVar3 != 0; iVar3 = iVar3 + -1) {
      *puVar6 = *param_2;
      param_2 = param_2 + 1;
      puVar6 = puVar6 + 1;
    }
    pfVar1 = (float *)(iVar2 + 0x40);
    pfVar4 = pfVar1;
    for (iVar3 = 8; iVar3 != 0; iVar3 = iVar3 + -1) {
      *pfVar4 = *param_3;
      param_3 = param_3 + 1;
      pfVar4 = pfVar4 + 1;
    }
    pfVar4 = (float *)(iVar2 + 0x60);
    pfVar5 = pfVar4;
    for (iVar3 = 8; iVar3 != 0; iVar3 = iVar3 + -1) {
      *pfVar5 = *param_4;
      param_4 = param_4 + 1;
      pfVar5 = pfVar5 + 1;
    }
    puVar6 = (undefined4 *)(iVar2 + 0x80);
    for (iVar3 = 8; iVar3 != 0; iVar3 = iVar3 + -1) {
      *puVar6 = *param_5;
      param_5 = param_5 + 1;
      puVar6 = puVar6 + 1;
    }
    *(float *)(iVar2 + 0x20) = *(float *)(iVar2 + 0x20) + vertex_shift_x;
    *(float *)(iVar2 + 0x24) = *(float *)(iVar2 + 0x24) + vertex_shift_y;
    *pfVar1 = *pfVar1 + vertex_shift_x;
    *(float *)(iVar2 + 0x44) = *(float *)(iVar2 + 0x44) + vertex_shift_y;
    *pfVar4 = *pfVar4 + vertex_shift_x;
    *(float *)(iVar2 + 100) = *(float *)(iVar2 + 100) + vertex_shift_y;
    *(float *)(iVar2 + 0x80) = *(float *)(iVar2 + 0x80) + vertex_shift_x;
    *(float *)(iVar2 + 0x84) = *(float *)(iVar2 + 0x84) + vertex_shift_y;
    *(undefined4 *)(iVar2 + 0x18) = param_6;
    *(undefined4 *)(iVar2 + 0xc) = param_7;
    *(int *)(param_1 + 0x20002a) = *(int *)(param_1 + 0x20002a) + 0xa0;
    *(short *)(param_1 + 0x1c) = *(short *)(param_1 + 0x1c) + 1;
  }
  return;
}
