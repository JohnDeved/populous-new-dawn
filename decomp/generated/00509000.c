/* Ghidra 12.1.3 pseudocode; entry 00509000; FUN_00509000.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_00509000(int param_1,int param_2)

{
  char cVar1;
  short sVar2;
  int iVar3;

  *(undefined2 *)(param_1 + 8) = 0;
  if (*(char *)(param_2 + 0x2a) == '\x02') {
    if (*(char *)(param_2 + 0x2b) == '\x13') {
      *(undefined2 *)(param_1 + 8) = 0x140;
      return;
    }
  }
  else {
    if (*(char *)(param_2 + 0x2a) != '\t') {
      cVar1 = obj_related_array[*(byte *)(param_2 + 0x3a) + 3].type;
      if (cVar1 == '\x01') {
        *(short *)(param_1 + 8) = *(short *)(hfx_0_addr + 6 + *(short *)(param_2 + 0x33) * 8) << 3;
        return;
      }
      if (cVar1 != '\x03') {
        if (cVar1 != '\n') {
          return;
        }
        iVar3 = get_human_anim_sprite((int)*(short *)(param_2 + 0x33));
        *(short *)(param_1 + 8) = *(short *)(iVar3 + 6) << 3;
        return;
      }
      sVar2 = *(short *)(param_2 + 0x33);
      if ((*(byte *)(param_2 + 0x36) & 2) != 0) {
        *(short *)(param_1 + 8) =
             (short)(((int)(objs0_mem[sVar2].f8 / 2) * objs0_mem[sVar2].maybe_coord_scale) /
                    (int)objs0_mem[sVar2].maybe_coord_scale);
        return;
      }
      *(short *)(param_1 + 8) = objs0_mem[sVar2].f8 / 2;
      return;
    }
    *(undefined2 *)(param_1 + 8) = 0x40;
  }
  return;
}
