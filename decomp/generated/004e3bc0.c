/* Ghidra 12.1.3 pseudocode; entry 004e3bc0; d3d_set_render_state_5.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */
/* WARNING: Enum "_D3DRENDERSTATETYPE": Some values do not have unique names */

void d3d_set_render_state_5
               (int *param_1,float param_2,float param_3,float param_4,float param_5,float param_6)

{
  int *piVar1;
  undefined4 *puVar2;
  code *pcVar3;
  float fVar4;
  float fVar5;
  float fVar6;
  float fVar7;
  undefined1 uVar8;
  int iVar9;
  undefined4 uVar10;
  int iVar11;
  int iVar12;
  int iVar13;
  float *pfVar14;
  int iVar15;
  float10 fVar16;
  float10 fVar17;
  float fVar18;
  float fVar19;
  float local_140;
  int local_13c;
  float local_134;
  float *local_130;
  float local_12c;
  float local_128;
  float *local_10c;
  int local_104;
  float local_100 [39];
  undefined4 uStack_64;
  undefined4 uStack_60;
  float fStack_5c;
  undefined4 uStack_58;

  _DAT_00a0f2a4 = param_2;
  _DAT_00a0f2a0 = param_3;
  _DAT_00a1a718 = param_4;
  vertices_num = 0;
  DAT_005d488c = 0;
  vertices_indexes_num = 0;
  iVar9 = __ftol();
  if (iVar9 != 0) {
    iVar12 = 0x1e;
    iVar13 = iVar9;
    while (iVar13 = iVar13 * 2, -1 < iVar13) {
      iVar12 = iVar12 + -1;
    }
    if (iVar12 + 1 < 9) {
      iVar13 = iVar12 * 4;
      local_100[0] = (*(float *)(&DAT_005d489c + iVar13) - *(float *)(&DAT_005d4898 + iVar13)) *
                     ((float)((-1 << ((byte)iVar12 & 0x1f)) + iVar9) /
                     (float)(1 << ((byte)iVar12 & 0x1f))) + *(float *)(&DAT_005d4898 + iVar13);
      local_13c = __ftol();
      if (0x20 < local_13c) {
        local_13c = 0x20;
      }
      if (DAT_005d4884 != 0) {
        fVar16 = (float10)fsin((float10)local_100[0] * (float10)_DAT_0058f81c);
        _sprintf((char *)local_100,s_circle_pix_err____f_circle_radiu_005d48c0,
                 (double)(((fVar16 / (float10)local_100[0]) * (float10)_DAT_0058f820 +
                          (float10)_DAT_0058f7e4) * (float10)_DAT_0058f7b0 * (float10)param_4 *
                         (float10)param_4),iVar12);
        uVar8 = find_palette_min_element(system_palette_mem,0xff,0xff,0xff);
        FUN_00527eb0(0,300,local_100,0xffffffff,uVar8);
      }
      DAT_00a145e8 = vertices_num;
      fVar18 = (_DAT_0058f7b0 * _DAT_0058f81c) / (float)local_13c;
      DAT_00a1a698 = 1;
      FUN_004e36c0(param_2,param_3,param_5,_DAT_0058f7e4 / (param_5 + _DAT_0058f7e0),0,0x3f800000,0)
      ;
      local_104 = 1;
      if (1 < local_13c) {
        local_130 = (float *)&DAT_00a0f4a8;
        iVar9 = 4;
        local_140 = fVar18;
        do {
          fVar16 = (float10)fsin((float10)local_140);
          fVar19 = (float)(fVar16 * (float10)param_4);
          iVar12 = __ftol();
          if (0x80 < iVar12) {
            iVar12 = 0x80;
          }
          fVar5 = (_DAT_0058f7b0 / (float)iVar12) * _DAT_0058f818;
          iVar13 = 0;
          iVar15 = 0;
          local_100[0] = param_6 * (float)fVar16;
          *(int *)((int)&DAT_00a1a698 + iVar9) = iVar12;
          iVar12 = vertices_num;
          *(int *)((int)&DAT_00a145e8 + iVar9) = vertices_num;
          if (0x7ff < iVar12) {
            return;
          }
          fVar6 = param_5 + local_100[0];
          fVar7 = _DAT_0058f7e4 / (fVar6 + _DAT_0058f7e0);
          FUN_004e36c0(fVar19 + param_2,param_3,fVar6,fVar7,0,0x3f800000,local_140);
          fVar16 = (float10)fcos((float10)fVar5);
          local_12c = 1.0;
          local_128 = 0.0;
          *local_130 = 0.0;
          pfVar14 = local_130 + -0x80;
          local_10c = local_130;
          fVar17 = (float10)fsin((float10)fVar5);
          local_100[0] = (float)fVar17;
          local_134 = fVar5;
          while ((iVar12 = vertices_num, iVar11 = *(int *)(iVar9 + 0xa1a694) - iVar13, iVar11 != 1
                 || (*(int *)((int)&DAT_00a1a698 + iVar9) - iVar15 != 1))) {
            if (((*pfVar14 < local_134) && (iVar11 != 1)) ||
               (*(int *)((int)&DAT_00a1a698 + iVar9) - iVar15 == 1)) {
              pfVar14 = pfVar14 + 1;
              iVar12 = *(int *)(iVar9 + 0xa145e4) + iVar13;
              iVar13 = iVar13 + 1;
            }
            else {
              *local_10c = local_134;
              fVar4 = (float)fVar16 * local_12c - local_100[0] * local_128;
              local_128 = (float)fVar16 * local_128 + local_100[0] * local_12c;
              if (0x7ff < iVar12) {
                return;
              }
              FUN_004e36c0(fVar19 * fVar4 + param_2,param_3 - fVar19 * local_128,fVar6,fVar7,
                           local_128,fVar4,local_140);
              local_134 = local_134 + fVar5;
              iVar12 = *(int *)((int)&DAT_00a145e8 + iVar9) + iVar15;
              iVar15 = iVar15 + 1;
              local_10c = local_10c + 1;
              local_12c = fVar4;
            }
            if (0xfff < DAT_005d488c) goto LAB_004e40b8;
            FUN_004e3890(*(int *)(iVar9 + 0xa145e4) + iVar13,
                         *(int *)((int)&DAT_00a145e8 + iVar9) + iVar15,iVar12);
          }
          if ((0xfff < DAT_005d488c) ||
             (FUN_004e3890(*(int *)(iVar9 + 0xa145e4) + iVar13,
                           *(int *)((int)&DAT_00a145e8 + iVar9) + iVar15,*(int *)(iVar9 + 0xa145e4))
             , 0xfff < DAT_005d488c)) break;
          piVar1 = (int *)((int)&DAT_00a145e8 + iVar9);
          puVar2 = (undefined4 *)(iVar9 + 0xa145e4);
          iVar9 = iVar9 + 4;
          FUN_004e3890(*piVar1 + iVar15,*puVar2,*piVar1);
          local_140 = local_140 + fVar18;
          local_104 = local_104 + 1;
          local_130 = local_130 + 0x80;
        } while (local_104 < local_13c);
      }
LAB_004e40b8:
      if (DAT_005d4884 == 0) {
        iVar9 = *param_1;
        pcVar3 = *(code **)(iVar9 + 0x5c);
        (*pcVar3)(param_1,3,1);
        (*pcVar3)(param_1,0x11,2);
        (*pcVar3)(param_1,0x12,2);
        (*pcVar3)(param_1,0x1d,1);
        if ((vertices_indexes_num != 0) && (vertices_num != 0)) {
          (**(code **)(iVar9 + 0x78))
                    (param_1,4,3,&vertices_ptr,vertices_num,&vertices_indexes,vertices_indexes_num,8
                    );
        }
        (*pcVar3)(param_1,0x13,5);
        (*pcVar3)(param_1,0x14,6);
        (*pcVar3)(param_1,0x1b,1);
        fVar18 = 5.74532e-44;
        (*pcVar3)(param_1,0x29,0);
        (*pcVar3)(param_1,0xf,0);
        if (DAT_005d4894 != 0) {
          if (*(int *)(ui_struct->d3 + 0x90) == 0) {
            d3d_set_light();
            uVar10 = __ftol();
            fVar19 = fVar18 * _DAT_0058f808 + fStack_5c;
            d3d_draw_index_primitive_2
                      (param_1,uStack_64,uStack_60,uStack_58,fVar19,fVar18 + fStack_5c,0xff800000,
                       0xff800000,uVar10,0);
            d3d_draw_index_primitive_2
                      (param_1,uStack_64,uStack_60,uStack_58,fStack_5c - fVar18,fVar19,0xff800000,
                       0xff800000,uVar10,1);
          }
          else {
            (*pcVar3)(param_1,1,0);
            _DAT_00a14680 = fVar18;
            DAT_00a14670 = uStack_64;
            DAT_00a14674 = uStack_60;
            DAT_00a14678 = uStack_58;
            _DAT_00a1467c = fStack_5c;
            DAT_00a14684 = 0x800000;
            DAT_00a14688 = __ftol();
            DAT_00a1468c = 0;
            d3d_draw_indexed_primitive_3();
          }
        }
        (*pcVar3)(param_1,0x1b,0);
        (*pcVar3)(param_1,0x1d,0);
      }
    }
  }
  return;
}
