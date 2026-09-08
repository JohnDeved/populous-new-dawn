/* Ghidra 12.1.3 pseudocode; entry 0046eb80; add_polygon_type_8.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


union_polygon * add_polygon_type_8(int param_1,undefined1 param_2,undefined4 param_3,char param_4)

{
  byte bVar1;
  union_polygon *puVar2;
  int iVar3;
  undefined4 *puVar4;
  undefined4 *puVar5;

  puVar2 = empty_polygon;
  if (empty_polygon < polypool_mem_end_2) {
    empty_polygon = (union_polygon *)&(empty_polygon->field0).tex_index;
    (puVar2->field0).next = *(polygon_drawn **)(param_1 + 2);
    *(union_polygon **)(param_1 + 2) = puVar2;
    (puVar2->field0).type = 8;
    (puVar2->field0).unknown_1 = 0;
    *(undefined1 *)&(puVar2->field0).tex_index_2 = param_2;
    if (param_4 == '\x02') {
      *(undefined1 *)((int)&(puVar2->field0).tex_index_2 + 1) = 0x1f;
    }
    else {
      *(undefined1 *)((int)&(puVar2->field0).tex_index_2 + 1) = 6;
    }
    puVar4 = (undefined4 *)(param_1 + 6);
    puVar5 = &(puVar2->field0).point_1_x;
    for (iVar3 = 5; iVar3 != 0; iVar3 = iVar3 + -1) {
      *puVar5 = *puVar4;
      puVar4 = puVar4 + 1;
      puVar5 = puVar5 + 1;
    }
    puVar4 = (undefined4 *)(param_1 + 0x1a);
    puVar5 = &(puVar2->field0).point_2_x;
    for (iVar3 = 5; iVar3 != 0; iVar3 = iVar3 + -1) {
      *puVar5 = *puVar4;
      puVar4 = puVar4 + 1;
      puVar5 = puVar5 + 1;
    }
    puVar4 = (undefined4 *)(param_1 + 0x2e);
    puVar5 = &(puVar2->field0).point_3_x;
    for (iVar3 = 5; iVar3 != 0; iVar3 = iVar3 + -1) {
      *puVar5 = *puVar4;
      puVar4 = puVar4 + 1;
      puVar5 = puVar5 + 1;
    }
    bVar1 = *(byte *)(param_1 + 0x45);
    (puVar2->field0).point_1_u = uv_mapping_24B_ARRAY_005a2f30[bVar1].u1;
    (puVar2->field0).point_1_v = uv_mapping_24B_ARRAY_005a2f30[bVar1].v1;
    (puVar2->field0).point_2_u = uv_mapping_24B_ARRAY_005a2f30[bVar1].u2;
    (puVar2->field0).point_2_v = uv_mapping_24B_ARRAY_005a2f30[bVar1].v2;
    (puVar2->field0).point_3_u = uv_mapping_24B_ARRAY_005a2f30[bVar1].u3;
    (puVar2->field0).point_3_v = uv_mapping_24B_ARRAY_005a2f30[bVar1].v3;
    (puVar2->field0).point_3_color = 0x20;
    (puVar2->field0).point_2_color = 0x20;
    (puVar2->field0).point_1_color = 0x20;
    return puVar2;
  }
  return (union_polygon *)0x0;
}
