/* Ghidra 12.1.3 pseudocode; entry 0047d8a0; add_polygon_triangle_texture_80.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void __thiscall
add_polygon_triangle_texture_80
          (int param_1,undefined4 *param_2,float *param_3,float *param_4,undefined4 param_5,
          undefined4 param_6,undefined4 param_7)

{
  float *pfVar1;
  int iVar2;
  int iVar3;
  undefined4 *puVar4;
  float *pfVar5;
  float *pfVar6;

  puVar4 = *(undefined4 **)(param_1 + 0x20002a);
  if (puVar4 <= (undefined4 *)(param_1 + 0x1ff82aU)) {
    if (puVar4 != (undefined4 *)0x0) {
      puVar4[7] = 0;
      *puVar4 = &vertices_mem_vtable_invalid;
      puVar4[1] = 0;
      *puVar4 = &vertices_mem_vtable_0058f510;
    }
    iVar2 = *(int *)(param_1 + 0x20002a);
    puVar4 = (undefined4 *)(iVar2 + 0x20);
    for (iVar3 = 8; iVar3 != 0; iVar3 = iVar3 + -1) {
      *puVar4 = *param_2;
      param_2 = param_2 + 1;
      puVar4 = puVar4 + 1;
    }
    pfVar1 = (float *)(iVar2 + 0x40);
    pfVar5 = pfVar1;
    for (iVar3 = 8; iVar3 != 0; iVar3 = iVar3 + -1) {
      *pfVar5 = *param_3;
      param_3 = param_3 + 1;
      pfVar5 = pfVar5 + 1;
    }
    pfVar5 = (float *)(iVar2 + 0x60);
    pfVar6 = pfVar5;
    for (iVar3 = 8; iVar3 != 0; iVar3 = iVar3 + -1) {
      *pfVar6 = *param_4;
      param_4 = param_4 + 1;
      pfVar6 = pfVar6 + 1;
    }
    *(float *)(iVar2 + 0x20) = *(float *)(iVar2 + 0x20) + vertex_shift_x;
    *(float *)(iVar2 + 0x24) = *(float *)(iVar2 + 0x24) + vertex_shift_y;
    *pfVar1 = *pfVar1 + vertex_shift_x;
    *(float *)(iVar2 + 0x44) = *(float *)(iVar2 + 0x44) + vertex_shift_y;
    *pfVar5 = *pfVar5 + vertex_shift_x;
    *(float *)(iVar2 + 100) = *(float *)(iVar2 + 100) + vertex_shift_y;
    *(undefined4 *)(iVar2 + 0x18) = param_5;
    *(undefined4 *)(iVar2 + 0xc) = param_6;
    *(undefined4 *)(iVar2 + 0x1c) = param_7;
    *(int *)(param_1 + 0x20002a) = *(int *)(param_1 + 0x20002a) + 0x80;
    *(short *)(param_1 + 0x1c) = *(short *)(param_1 + 0x1c) + 1;
  }
  return;
}
