/* Ghidra 12.1.3 pseudocode; entry 00517420; add_skylense_polygons_local.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */
/* WARNING: Enum "_D3DRENDERSTATETYPE": Some values do not have unique names */

void add_skylense_polygons_local(float param_1,undefined4 param_2,undefined4 param_3)

{
  int iVar1;
  float fVar2;
  float fVar3;
  bool bVar4;
  bool bVar5;
  int iVar6;
  uint uVar7;
  float *pfVar8;
  float *pfVar9;
  undefined4 *puVar10;
  int *piVar11;
  uint local_70;
  float local_60 [8];
  undefined1 local_40 [32];
  undefined1 local_20 [32];

  fill_sky_mem(3,param_2);
  local_70 = 0x180;
  if ((param_1 == 0.0) || (*(int *)(ui_struct->d3 + 0x90) == 0)) {
    bVar4 = false;
  }
  else {
    bVar4 = true;
  }
  if ((param_1 == 0.0) && (*(int *)(ui_struct->d3 + 0x8c) != 0)) {
    bVar5 = true;
  }
  else {
    bVar5 = false;
  }
  if ((!bVar4) && (!bVar5)) {
    local_70 = 400;
  }
  if (param_1 != 0.0) {
    local_70 = local_70 | 2;
  }
  if (bVar4) {
    local_70 = local_70 | 0x40;
  }
  puVar10 = sky_vertices;
  fVar2 = ((float)_screen_height_maybe / (float)(int)screen_height) * _DAT_0058fc10;
  do {
    if (((int *)((int)sky_vertices + 0x47) < puVar10) || (((byte)land_flags_1 & 4) != 0)) {
      pfVar8 = local_60 + 1;
      piVar11 = puVar10;
      do {
        iVar6 = *piVar11;
        pfVar8[-1] = (float)(int)(&sky_mem_start_1)[iVar6 * 2];
        *pfVar8 = (float)(int)(&DAT_005dd22c)[iVar6 * 2] * fVar2;
        iVar1 = geom_2_ARRAY_00afc180[iVar6].field1_0x4;
        pfVar8[5] = (float)(int)geom_2_ARRAY_00afc180[iVar6].field0_0x0 * _DAT_0058fc00;
        fVar3 = (float)iVar1 * _DAT_0058fc00;
        if (bVar4) {
          pfVar8[6] = fVar3;
        }
        else {
          pfVar8[6] = fVar3;
        }
        iVar6 = __ftol();
        uVar7 = __ftol();
        if (iVar6 < 0) {
          iVar6 = 0;
        }
        if ((int)uVar7 < 0) {
          uVar7 = 0;
        }
        pfVar9 = pfVar8 + 8;
        piVar11 = piVar11 + 1;
        pfVar8[3] = (float)((iVar6 << 0x10 | uVar7) << 8 | uVar7 << 0x10 | uVar7);
        pfVar8[4] = 0.0;
        pfVar8 = pfVar9;
      } while (pfVar9 < &param_1);
      add_polygon_triangle_texture_80(local_20,local_40,local_60,param_3,local_70,0);
    }
    puVar10 = puVar10 + 3;
  } while (puVar10 < &DAT_0058fc00);
  return;
}
