/* Ghidra 12.1.3 pseudocode; entry 0047dda0; add_polygon_quad_sprite_5a_3.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void __thiscall
add_polygon_quad_sprite_5a_3
          (int param_1,float param_2,float param_3,int param_4,ushort param_5,uint param_6,
          undefined4 param_7)

{
  undefined4 *puVar1;
  int iVar2;
  int iVar3;
  ushort *puVar4;

  if ((param_2 < (float)*(int *)(param_1 + 0x248052)) &&
     (param_3 < (float)*(int *)(param_1 + 0x248056))) {
    puVar4 = (ushort *)(*(int *)(param_4 + 4) + (uint)param_5 * 0x24);
    if (((float)*(int *)(param_1 + 0x24804a) <= (float)*puVar4 + param_2) &&
       (((float)*(int *)(param_1 + 0x24804e) <= (float)puVar4[1] + param_3 &&
        (puVar1 = *(undefined4 **)(param_1 + 0x20002a),
        puVar1 <= (undefined4 *)(param_1 + 0x1ff82aU))))) {
      if (puVar1 != (undefined4 *)0x0) {
        puVar1[7] = 0;
        *puVar1 = &vertices_mem_vtable_invalid;
        puVar1[1] = 0;
        *puVar1 = &vertices_mem_vtable_0058f528;
        puVar1[8] = 0;
        *(undefined4 *)((int)puVar1 + 0x56) = 0;
      }
      iVar2 = *(int *)(param_1 + 0x20002a);
      *(uint *)(iVar2 + 0x20) = *(uint *)(iVar2 + 0x20) | 0x10;
      puVar4 = (ushort *)((uint)param_5 * 0x24 + *(int *)(param_4 + 4));
      iVar3 = init_polygon_quad_with_sprite_5a
                        (param_2,param_3,(float)*puVar4,(float)puVar4[1],param_4,param_5,param_7,
                         0xbf800000,0xbf800000);
      *(uint *)(iVar2 + 0x4e) =
           (*(uint *)(iVar2 + 0x4e) ^ param_6) & 0xffffff ^ *(uint *)(iVar2 + 0x4e);
      *(short *)(param_1 + 0x1c) = *(short *)(param_1 + 0x1c) + 1;
      *(int *)(param_1 + 0x20002a) = *(int *)(param_1 + 0x20002a) + iVar3;
    }
  }
  return;
}
