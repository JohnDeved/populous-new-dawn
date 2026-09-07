/* Ghidra 12.1.3 pseudocode; entry 0045ef70; get_human_anim_sprite.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


int get_human_anim_sprite(int param_1)

{
  int iVar1;
  vele_struct *pvVar2;

  iVar1 = 0;
  pvVar2 = vele_0_mem + (ushort)vfra_related_2[param_1].vele_index;
  if (vele_0_mem < pvVar2) {
    while ((pvVar2->flags & 0xfff0) != 0) {
      pvVar2 = vele_0_mem + pvVar2->next_vele_index;
      if (pvVar2 <= vele_0_mem) {
        return iVar1;
      }
    }
    iVar1 = (uint)pvVar2->hspr_index + hspr_0_addr;
  }
  return iVar1;
}
