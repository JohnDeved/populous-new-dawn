/* Ghidra 12.1.3 pseudocode; entry 00523720; fill_sky_array.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void fill_sky_array(int param_1,int param_2,int param_3)

{
  longlong lVar1;
  longlong lVar2;
  longlong lVar3;
  longlong lVar4;
  sky_vertex_2d *psVar5;
  skylens_coords *psVar6;
  sky_vertex_2d *local_34;
  int local_30;

  local_34 = sky_array;
  psVar6 = skylens_mem;
  do {
    local_30 = 0x51;
    psVar5 = local_34;
    do {
      lVar1 = (longlong)((int)*psVar6 << 9) * (longlong)maybe_cos[param_1];
      lVar2 = (longlong)((int)psVar6[1] << 9) * (longlong)maybe_sin[param_1];
      lVar3 = (longlong)((int)*psVar6 << 9) * (longlong)maybe_sin[param_1];
      lVar4 = (longlong)((int)psVar6[1] << 9) * (longlong)maybe_cos[param_1];
      psVar6 = psVar6 + 2;
      local_30 = local_30 + -1;
      psVar5->x = ((uint)lVar1 >> 0x10 | (int)((ulonglong)lVar1 >> 0x20) << 0x10) +
                  ((uint)lVar2 >> 0x10 | (int)((ulonglong)lVar2 >> 0x20) << 0x10) + param_2;
      psVar5->y = (((uint)lVar4 >> 0x10 | (int)((ulonglong)lVar4 >> 0x20) << 0x10) -
                  ((uint)lVar3 >> 0x10 | (int)((ulonglong)lVar3 >> 0x20) << 0x10)) + param_3;
      psVar5 = psVar5 + 1;
    } while (local_30 != 0);
    local_34 = local_34 + 0x60;
  } while (local_34 < (sky_vertex_2d *)0xd00e41);
  return;
}
