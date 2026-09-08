/* Ghidra 12.1.3 pseudocode; entry 0047ce50; draw_texture_mem.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

int __thiscall draw_texture_mem(int *param_1,int param_2)

{
  D3DTLVERTEX *pDVar1;
  undefined8 uVar2;
  bool bVar3;
  int iVar4;
  uint uVar5;
  int iVar6;
  uint uVar7;
  uint local_8;

  uVar7 = *(uint *)((int)param_1 + 0x24805a);
  if (uVar7 == 0) {
    return 0;
  }
  local_8 = (param_2 * uVar7) / 100 + *(uint *)((int)param_1 + 0x248062);
  if (uVar7 < local_8) {
    local_8 = uVar7;
  }
  if (*(uint *)((int)param_1 + 0x248062) < *(uint *)((int)param_1 + 0x24805e)) {
    if (measure_draw_rdtsc != 0) {
      uVar2 = rdtsc();
      rdtsc_val = (int)uVar2;
    }
    uVar7 = 0;
    do {
      DAT_0059df84 = *(int **)((int)param_1 + uVar7 * 4 + 0x24402e);
      if (DAT_0059df84 != (int *)0x0) {
        bVar3 = false;
        set_renderer_state(*(undefined4 *)((int)param_1 + 0x26),&DAT_0059df8c,uVar7);
        do {
          iVar6 = DAT_0059df84[6];
          if (((bVar3) && (DAT_0059df90 != iVar6)) &&
             (((int)vertices_ptr_global - (int)vertices_ptr_global_prev & 0xffffffe0U) != 0)) {
            if (DAT_0059df90 == 0) {
              (**(code **)(**(int **)((int)param_1 + 0x26) + 0x5c))
                        (*(int **)((int)param_1 + 0x26),1,0);
              (**(code **)(**(int **)((int)param_1 + 0x26) + 100))
                        (*(int **)((int)param_1 + 0x26),1,*(undefined4 *)((int)param_1 + 0x22));
            }
            else {
              d3d_set_light();
            }
            if ((uVar7 & 2) != 0) {
              null_ARRAY_009848d0[0x400] =
                   null_ARRAY_009848d0[0x400] +
                   ((int)vertices_ptr_global - (int)vertices_ptr_global_prev >> 5);
            }
            if ((uVar7 & 4) != 0) {
              null_ARRAY_009848d0[0x401] =
                   null_ARRAY_009848d0[0x401] +
                   ((int)vertices_ptr_global - (int)vertices_ptr_global_prev >> 5);
            }
            if ((uVar7 & 0x10) != 0) {
              null_ARRAY_009848d0[0x402] =
                   null_ARRAY_009848d0[0x402] +
                   ((int)vertices_ptr_global - (int)vertices_ptr_global_prev >> 5);
            }
            if ((uVar7 & 8) != 0) {
              null_ARRAY_009848d0[0x403] =
                   null_ARRAY_009848d0[0x403] +
                   ((int)vertices_ptr_global - (int)vertices_ptr_global_prev >> 5);
            }
            if ((uVar7 & 0x20) != 0) {
              null_ARRAY_009848d0[0x404] =
                   null_ARRAY_009848d0[0x404] +
                   ((int)vertices_ptr_global - (int)vertices_ptr_global_prev >> 5);
            }
            iVar4 = (int)vertices_ptr_global - (int)vertices_ptr_global_prev >> 5;
            null_ARRAY_009848d0[uVar7 & 0x3f] = null_ARRAY_009848d0[uVar7 & 0x3f] + iVar4;
            param_1[1] = param_1[1] + iVar4;
            *param_1 = *param_1 + 1;
            iVar4 = draw_vertices_indexed
                              ((int)param_1 + 0x20002e,
                               (int)vertices_ptr_global - (int)vertices_ptr_global_prev >> 5,
                               (int)param_1 + 0x24002e,
                               (int)indices_ptr_global_prev - (int)indices_ptr_global >> 1);
            if (iVar4 != 0) {
              return iVar4;
            }
            vertices_ptr_global = (D3DTLVERTEX *)((int)param_1 + 0x20002e);
            indices_ptr_global = (undefined4 *)((int)param_1 + 0x24002e);
            to_draw_num_global = 0;
            vertices_ptr_global_prev = vertices_ptr_global;
            indices_ptr_global_prev = indices_ptr_global;
          }
          (**(code **)(*DAT_0059df84 + 4))();
          bVar3 = true;
          uVar5 = *(int *)((int)param_1 + 0x248062) + 1;
          DAT_0059df90 = iVar6;
          *(uint *)((int)param_1 + 0x248062) = uVar5;
        } while ((uVar5 < *(uint *)((int)param_1 + 0x24805e)) &&
                (DAT_0059df84 = (int *)DAT_0059df84[1], DAT_0059df84 != (int *)0x0));
        if (((int)vertices_ptr_global - (int)vertices_ptr_global_prev & 0xffffffe0U) != 0) {
          if (DAT_0059df90 == 0) {
            (**(code **)(**(int **)((int)param_1 + 0x26) + 0x5c))
                      (*(int **)((int)param_1 + 0x26),1,0);
            (**(code **)(**(int **)((int)param_1 + 0x26) + 100))
                      (*(int **)((int)param_1 + 0x26),1,*(undefined4 *)((int)param_1 + 0x22));
          }
          else {
            d3d_set_light();
          }
          update_vertices_counters
                    (uVar7,(int)vertices_ptr_global - (int)vertices_ptr_global_prev >> 5);
          iVar6 = (int)vertices_ptr_global - (int)vertices_ptr_global_prev;
          pDVar1 = (D3DTLVERTEX *)((int)param_1 + 0x20002e);
          *param_1 = *param_1 + 1;
          param_1[1] = param_1[1] + (iVar6 >> 5);
          iVar6 = draw_vertices_indexed
                            (pDVar1,(int)vertices_ptr_global - (int)vertices_ptr_global_prev >> 5,
                             (int)param_1 + 0x24002e,
                             (int)indices_ptr_global_prev - (int)indices_ptr_global >> 1);
          if (iVar6 != 0) {
            return iVar6;
          }
          indices_ptr_global = (undefined4 *)((int)param_1 + 0x24002e);
          to_draw_num_global = 0;
          vertices_ptr_global = pDVar1;
          vertices_ptr_global_prev = pDVar1;
          indices_ptr_global_prev = indices_ptr_global;
        }
        if (*(uint *)((int)param_1 + 0x24805e) <= *(uint *)((int)param_1 + 0x248062)) break;
      }
      uVar7 = uVar7 + 1;
    } while (uVar7 < 0x400);
    if (measure_draw_rdtsc != 0) {
      uVar2 = rdtsc();
      rdtsc_val = (int)uVar2 - rdtsc_val;
    }
    _rdtsc_val_total_2 = _rdtsc_val_total_2 + rdtsc_val;
  }
  if (*(uint *)((int)param_1 + 0x24805e) <= *(uint *)((int)param_1 + 0x248062)) {
    if (measure_draw_rdtsc != 0) {
      uVar2 = rdtsc();
      rdtsc_val = (int)uVar2;
    }
    if (DAT_009858f4 == 0) {
      (**(code **)(**(int **)((int)param_1 + 0x26) + 0x5c))(*(int **)((int)param_1 + 0x26),0x1b,1);
      (**(code **)(**(int **)((int)param_1 + 0x26) + 0x5c))(*(int **)((int)param_1 + 0x26),0xe,0);
      DAT_0059df84 = *(int **)((int)param_1 + 0x248036);
      vertices_ptr_global = (D3DTLVERTEX *)((int)param_1 + 0x20002e);
      to_draw_num_global = 0;
      indices_ptr_global = (undefined4 *)((int)param_1 + 0x24002e);
      DAT_009858f0 = 0;
      DAT_009858f4 = 1;
      vertices_ptr_global_prev = vertices_ptr_global;
      indices_ptr_global_prev = indices_ptr_global;
    }
    do {
      if (DAT_0059df84 == (int *)0x0) break;
      param_1[5] = param_1[5] + 1;
      iVar6 = DAT_0059df84[6];
      if ((DAT_009858f0 != 0) && ((DAT_0059df84[4] != DAT_0059df8c || (DAT_0059df90 != iVar6)))) {
        *param_1 = *param_1 + 1;
        if ((DAT_0059df8c & 2) != 0) {
          null_ARRAY_009848d0[0x400] =
               null_ARRAY_009848d0[0x400] +
               ((int)vertices_ptr_global - (int)vertices_ptr_global_prev >> 5);
        }
        if ((DAT_0059df8c & 4) != 0) {
          null_ARRAY_009848d0[0x401] =
               null_ARRAY_009848d0[0x401] +
               ((int)vertices_ptr_global - (int)vertices_ptr_global_prev >> 5);
        }
        if ((DAT_0059df8c & 0x10) != 0) {
          null_ARRAY_009848d0[0x402] =
               null_ARRAY_009848d0[0x402] +
               ((int)vertices_ptr_global - (int)vertices_ptr_global_prev >> 5);
        }
        if ((DAT_0059df8c & 8) != 0) {
          null_ARRAY_009848d0[0x403] =
               null_ARRAY_009848d0[0x403] +
               ((int)vertices_ptr_global - (int)vertices_ptr_global_prev >> 5);
        }
        if ((DAT_0059df8c & 0x20) != 0) {
          null_ARRAY_009848d0[0x404] =
               null_ARRAY_009848d0[0x404] +
               ((int)vertices_ptr_global - (int)vertices_ptr_global_prev >> 5);
        }
        iVar4 = (int)vertices_ptr_global - (int)vertices_ptr_global_prev >> 5;
        null_ARRAY_009848d0[DAT_0059df8c & 0x3f] = null_ARRAY_009848d0[DAT_0059df8c & 0x3f] + iVar4;
        param_1[1] = param_1[1] + iVar4;
        uVar7 = (int)indices_ptr_global_prev - (int)indices_ptr_global >> 1;
        uVar5 = (int)vertices_ptr_global - (int)vertices_ptr_global_prev >> 5;
        if (*(int *)((int)param_1 + 0x248042) == 0) {
          if ((uint)param_1[2] < uVar5) {
            param_1[2] = uVar5;
          }
          if ((uint)param_1[3] < uVar7) {
            param_1[3] = uVar7;
          }
          iVar4 = (**(code **)(**(int **)((int)param_1 + 0x26) + 0x78))
                            (*(int **)((int)param_1 + 0x26),4,3,(int)param_1 + 0x20002e,uVar5,
                             (int)param_1 + 0x24002e,uVar7,*(undefined4 *)((int)param_1 + 0x1e));
          if (iVar4 == -0x7789fe3e) {
            debug_log(s_Surface_lost_in_drawip_0059dfd4);
          }
        }
        else {
          iVar4 = (**(code **)(**(int **)((int)param_1 + 0x26) + 0x78))
                            (*(int **)((int)param_1 + 0x26),2,3,(int)param_1 + 0x20002e,uVar5,
                             (int)param_1 + 0x24002e,uVar7,*(undefined4 *)((int)param_1 + 0x1e));
        }
        if (iVar4 != 0) {
          return iVar4;
        }
        indices_ptr_global = (undefined4 *)((int)param_1 + 0x24002e);
        to_draw_num_global = 0;
        vertices_ptr_global = (D3DTLVERTEX *)((int)param_1 + 0x20002e);
        vertices_ptr_global_prev = (D3DTLVERTEX *)((int)param_1 + 0x20002e);
        indices_ptr_global_prev = indices_ptr_global;
      }
      (**(code **)(*DAT_0059df84 + 4))();
      set_renderer_state(*(undefined4 *)((int)param_1 + 0x26),&DAT_0059df8c,DAT_0059df84[4]);
      if ((DAT_0059df90 != iVar6) || (DAT_009858f0 == 0)) {
        if (iVar6 == 0) {
          (**(code **)(**(int **)((int)param_1 + 0x26) + 0x5c))(*(int **)((int)param_1 + 0x26),1,0);
          (**(code **)(**(int **)((int)param_1 + 0x26) + 100))
                    (*(int **)((int)param_1 + 0x26),1,*(undefined4 *)((int)param_1 + 0x22));
        }
        else {
          d3d_set_light();
        }
      }
      DAT_009858f0 = 1;
      DAT_0059df84 = (int *)DAT_0059df84[2];
      uVar7 = *(int *)((int)param_1 + 0x248062) + 1;
      DAT_0059df90 = iVar6;
      *(uint *)((int)param_1 + 0x248062) = uVar7;
    } while (uVar7 < local_8);
    if (((int)vertices_ptr_global - (int)vertices_ptr_global_prev & 0xffffffe0U) != 0) {
      *param_1 = *param_1 + 1;
      if ((DAT_0059df8c & 2) != 0) {
        null_ARRAY_009848d0[0x400] =
             null_ARRAY_009848d0[0x400] +
             ((int)vertices_ptr_global - (int)vertices_ptr_global_prev >> 5);
      }
      if ((DAT_0059df8c & 4) != 0) {
        null_ARRAY_009848d0[0x401] =
             null_ARRAY_009848d0[0x401] +
             ((int)vertices_ptr_global - (int)vertices_ptr_global_prev >> 5);
      }
      if ((DAT_0059df8c & 0x10) != 0) {
        null_ARRAY_009848d0[0x402] =
             null_ARRAY_009848d0[0x402] +
             ((int)vertices_ptr_global - (int)vertices_ptr_global_prev >> 5);
      }
      if ((DAT_0059df8c & 8) != 0) {
        null_ARRAY_009848d0[0x403] =
             null_ARRAY_009848d0[0x403] +
             ((int)vertices_ptr_global - (int)vertices_ptr_global_prev >> 5);
      }
      if ((DAT_0059df8c & 0x20) != 0) {
        null_ARRAY_009848d0[0x404] =
             null_ARRAY_009848d0[0x404] +
             ((int)vertices_ptr_global - (int)vertices_ptr_global_prev >> 5);
      }
      iVar6 = (int)vertices_ptr_global - (int)vertices_ptr_global_prev >> 5;
      null_ARRAY_009848d0[DAT_0059df8c & 0x3f] = null_ARRAY_009848d0[DAT_0059df8c & 0x3f] + iVar6;
      param_1[1] = param_1[1] + iVar6;
      uVar7 = (int)indices_ptr_global_prev - (int)indices_ptr_global >> 1;
      uVar5 = (int)vertices_ptr_global - (int)vertices_ptr_global_prev >> 5;
      if (*(int *)((int)param_1 + 0x248042) == 0) {
        if ((uint)param_1[2] < uVar5) {
          param_1[2] = uVar5;
        }
        if ((uint)param_1[3] < uVar7) {
          param_1[3] = uVar7;
        }
        iVar6 = (**(code **)(**(int **)((int)param_1 + 0x26) + 0x78))
                          (*(int **)((int)param_1 + 0x26),4,3,(int)param_1 + 0x20002e,uVar5,
                           (int)param_1 + 0x24002e,uVar7,*(undefined4 *)((int)param_1 + 0x1e));
        if (iVar6 == -0x7789fe3e) {
          debug_log(s_Surface_lost_in_drawip_0059dfd4);
        }
      }
      else {
        iVar6 = (**(code **)(**(int **)((int)param_1 + 0x26) + 0x78))
                          (*(int **)((int)param_1 + 0x26),2,3,(int)param_1 + 0x20002e,uVar5,
                           (int)param_1 + 0x24002e,uVar7,*(undefined4 *)((int)param_1 + 0x1e));
      }
      if (iVar6 != 0) {
        return iVar6;
      }
    }
    if (measure_draw_rdtsc != 0) {
      uVar2 = rdtsc();
      rdtsc_val = (int)uVar2 - rdtsc_val;
    }
    _rdtsc_val_total = _rdtsc_val_total + rdtsc_val;
    if (local_8 <= *(uint *)((int)param_1 + 0x248062)) {
      (**(code **)(**(int **)((int)param_1 + 0x26) + 0x5c))(*(int **)((int)param_1 + 0x26),0x1b,0);
      (**(code **)(**(int **)((int)param_1 + 0x26) + 0x5c))(*(int **)((int)param_1 + 0x26),0xe,0);
    }
  }
  return 0;
}
