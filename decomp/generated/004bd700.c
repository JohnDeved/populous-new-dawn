/* Ghidra 12.1.3 pseudocode; entry 004bd700; alloc_mem_1.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void alloc_mem_1(int param_1)

{
  int iVar1;
  short sVar2;

  if (param_1 == 0) {
    if ((resource_flags & 8) != 0) {
      free_1(landscape_texture_storage_big);
      free_1(bigf0_mem);
      free_1(cliff0_mem);
      free_1(disp0_mem);
      free_1(static_landscape_array);
      resource_flags = resource_flags & 0xfffffff7;
    }
  }
  else if ((resource_flags & 8) == 0) {
    landscape_texture_storage_big = malloc_1(0x100000);
    bigf0_mem = malloc_1(0x48000);
    cliff0_mem = malloc_1(0x2000);
    disp0_mem = malloc_1(0x10000);
    static_landscape_array = malloc_1(0x900);
    sVar2 = 0xd3d;
    iVar1 = 0x8fe;
    do {
      if (iVar1 < 0x100) {
        *(undefined2 *)(static_landscape_array + iVar1) = 0x140;
      }
      else if (iVar1 < 0x2d5) {
        *(short *)(static_landscape_array + iVar1) = sVar2;
      }
      else {
        *(undefined2 *)(static_landscape_array + iVar1) = 0x400;
      }
      sVar2 = sVar2 + -3;
      iVar1 = iVar1 + -2;
    } while (-1 < iVar1);
    resource_flags = resource_flags | 8;
    return;
  }
  return;
}
