/* Ghidra 12.1.3 pseudocode; entry 0047def0; add_polygon_quad_sprite_5a_2.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void __thiscall
add_polygon_quad_sprite_5a_2
          (int param_1,undefined4 param_2,undefined4 param_3,float param_4,float param_5,int param_6
          ,ushort param_7,uint param_8,undefined4 param_9)

{
  undefined4 *puVar1;
  int iVar2;
  int iVar3;
  ushort *puVar4;

  puVar1 = *(undefined4 **)(param_1 + 0x20002a);
  if (puVar1 <= (undefined4 *)(param_1 + 0x1ff82aU)) {
    if (puVar1 != (undefined4 *)0x0) {
      puVar1[7] = 0;
      *puVar1 = &vertices_mem_vtable_invalid;
      puVar1[1] = 0;
      *puVar1 = &vertices_mem_vtable_0058f528;
      puVar1[8] = 0;
      *(undefined4 *)((int)puVar1 + 0x56) = 0;
    }
    iVar2 = *(int *)(param_1 + 0x20002a);
    puVar4 = (ushort *)((uint)param_7 * 0x24 + *(int *)(param_6 + 4));
    if (((float)*puVar4 != param_4) || ((float)puVar4[1] != param_5)) {
      *(uint *)(iVar2 + 0x20) = *(uint *)(iVar2 + 0x20) | 0x20;
    }
    iVar3 = init_polygon_quad_with_sprite_5a
                      (param_2,param_3,param_4,param_5,param_6,param_7,param_9,0xbf800000,0xbf800000
                      );
    *(uint *)(iVar2 + 0x4e) =
         (param_8 ^ *(uint *)(iVar2 + 0x4e)) & 0xffffff ^ *(uint *)(iVar2 + 0x4e);
    *(short *)(param_1 + 0x1c) = *(short *)(param_1 + 0x1c) + 1;
    *(int *)(param_1 + 0x20002a) = *(int *)(param_1 + 0x20002a) + iVar3;
  }
  return;
}
