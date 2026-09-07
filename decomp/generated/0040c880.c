/* Ghidra 12.1.3 pseudocode; entry 0040c880; read_shapes.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


undefined4 read_shapes(void)

{
  int *piVar1;
  char cVar2;
  shape_entry *psVar3;
  int iVar4;
  int iVar5;

  cVar2 = read_obj_hdr(s_objects_shapes_ver_005998b0,2);
  if (cVar2 != '\0') {
    cVar2 = load_sprite_array(&objects_shapes_dat_sprite);
    if (cVar2 != '\0') {
      iVar5 = 0;
      psVar3 = shapes_mem + shapes_offset;
      if (0 < shapes_offset) {
        iVar4 = 0;
        do {
          iVar5 = iVar5 + 1;
          piVar1 = (int *)((int)&shapes_mem->ptr + iVar4);
          *piVar1 = (int)(&psVar3->x1 + *piVar1);
          iVar4 = iVar4 + 0x30;
        } while (iVar5 < shapes_offset);
      }
    }
  }
  return 1;
}
