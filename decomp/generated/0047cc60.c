/* Ghidra 12.1.3 pseudocode; entry 0047cc60; init_texture_mem_struct.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */
/* WARNING: Enum "_D3DRENDERSTATETYPE": Some values do not have unique names */

void __fastcall init_texture_mem_struct(undefined4 *param_1)

{
  int *piVar1;
  code *pcVar2;
  HRESULT HVar3;
  uint uVar4;
  int iVar5;
  int *piVar6;
  undefined4 *puVar7;

  param_1[1] = 0;
  *param_1 = 0;
  param_1[5] = 0;
  *(undefined4 *)((int)param_1 + 0x24805e) = 0;
  *(undefined4 *)((int)param_1 + 0x248062) = 0;
  HVar3 = (*d3d_material_global->lpVtbl->GetHandle)
                    (d3d_material_global,*(LPDIRECT3DDEVICE2 *)((int)param_1 + 0x26),
                     (LPD3DMATERIALHANDLE)((int)param_1 + 0x22));
  if (HVar3 == 0) {
    (**(code **)(**(int **)((int)param_1 + 0x26) + 0x5c))(*(int **)((int)param_1 + 0x26),7,1);
    (**(code **)(**(int **)((int)param_1 + 0x26) + 0x5c))(*(int **)((int)param_1 + 0x26),0xe,1);
    (**(code **)(**(int **)((int)param_1 + 0x26) + 0x5c))(*(int **)((int)param_1 + 0x26),0x1b,0);
    (**(code **)(**(int **)((int)param_1 + 0x26) + 0x5c))(*(int **)((int)param_1 + 0x26),0x17,4);
    if (ui_struct->uv_related == 1) {
      iVar5 = 2 - (uint)(texture_min_mag_value == 0);
      (**(code **)(**(int **)((int)param_1 + 0x26) + 0x5c))
                (*(int **)((int)param_1 + 0x26),0x11,iVar5);
      (**(code **)(**(int **)((int)param_1 + 0x26) + 0x5c))
                (*(int **)((int)param_1 + 0x26),0x12,iVar5);
    }
    uVar4 = 0;
    puVar7 = (undefined4 *)((int)param_1 + 0x24402e);
    for (iVar5 = 0x400; iVar5 != 0; iVar5 = iVar5 + -1) {
      *puVar7 = 0;
      puVar7 = puVar7 + 1;
    }
    _DAT_005d56f0 = 0;
    piVar6 = (int *)((int)param_1 + 0x24502e);
    do {
      DAT_0059df84 = *piVar6;
      while (DAT_0059df84 != 0) {
        piVar1 = (int *)(DAT_0059df84 + 0x10);
        iVar5 = *(int *)(DAT_0059df84 + 4);
        *(int *)(DAT_0059df84 + 4) = *(int *)((int)param_1 + *piVar1 * 4 + 0x24402e);
        *(int *)((int)param_1 + *piVar1 * 4 + 0x24402e) = DAT_0059df84;
        *(int *)((int)param_1 + 0x24805e) = *(int *)((int)param_1 + 0x24805e) + 1;
        DAT_0059df84 = iVar5;
      }
      piVar6 = piVar6 + 1;
      uVar4 = uVar4 + 1;
    } while (uVar4 <= texture_objects_num);
    vertices_ptr_global = (D3DTLVERTEX *)((int)param_1 + 0x20002e);
    indices_ptr_global = (undefined4 *)((int)param_1 + 0x24002e);
    to_draw_num_global = 0;
    piVar6 = *(int **)((int)param_1 + 0x26);
    DAT_0059df8c = 0;
    pcVar2 = *(code **)(*piVar6 + 0x5c);
    vertices_ptr_global_prev = vertices_ptr_global;
    indices_ptr_global_prev = indices_ptr_global;
    (*pcVar2)(piVar6,0xf,0);
    (*pcVar2)(piVar6,0x18,0);
    (*pcVar2)(piVar6,0x29,0);
    (*pcVar2)(piVar6,9,2);
    (*pcVar2)(piVar6,0x1d,0);
    if (ui_struct->uv_related != 1) {
      (*pcVar2)(piVar6,0x11,2);
      (*pcVar2)(piVar6,0x12,2);
    }
    if (*(int *)(ui_struct->field34_0x6fc + 0x60c) != 0) {
      (*pcVar2)(piVar6,0x15,2);
    }
    (*pcVar2)(piVar6,3,3);
    *(uint *)((int)param_1 + 0x1e) = *(uint *)((int)param_1 + 0x1e) & 0xfffffffb;
    (*pcVar2)(piVar6,0x14,6);
    puVar7 = null_ARRAY_009848d0;
    for (iVar5 = 0x405; iVar5 != 0; iVar5 = iVar5 + -1) {
      *puVar7 = 0;
      puVar7 = puVar7 + 1;
    }
    param_1[3] = 0;
    param_1[2] = 0;
    _DAT_0059df88 = 0;
    DAT_009858f4 = 0;
    DAT_0059df90 = 0;
    _rdtsc_val_total_2 = 0;
    _rdtsc_val_total = 0;
  }
  return;
}
