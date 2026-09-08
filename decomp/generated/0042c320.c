/* Ghidra 12.1.3 pseudocode; entry 0042c320; load_vele.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


bool load_vele(void)

{
  ushort *puVar1;
  vfra_struct_2 *pvVar2;
  vstart_struct *pvVar3;
  bool bVar4;
  vfra_struct *pvVar5;
  char cVar6;
  ushort uVar7;
  vfra_struct *pvVar8;
  int iVar9;
  vstart_struct *pvVar10;
  int iVar11;
  ushort *puVar12;
  vele_struct *pvVar13;
  ushort *puVar14;
  bool bVar15;
  ushort *local_c;
  ushort *local_8;
  int local_4;

  cVar6 = load_sprite(&DATA_VELE_0_ANI_sprite);
  bVar15 = cVar6 == '\0';
  if (!bVar15) {
    cVar6 = load_sprite(&DATA_VSPR_0_INF_sprite);
    bVar15 = cVar6 == '\0';
  }
  puVar1 = big_temp_buffer;
  puVar12 = local_c;
  puVar14 = local_c;
  if (!bVar15) {
    reset_global_palettes();
    no_file_message();
    file_name_validation(global_string_buffer,s_DATA_VSTART_0_ANI_0059c930);
    read_file_to_mem(global_string_buffer,puVar1,0xfffffff,&local_4);
    puVar12 = puVar1;
    if (local_4 == 0) {
      bVar15 = true;
    }
    else {
      local_8 = (ushort *)(local_4 + (int)puVar1);
      reset_global_palettes();
      no_file_message();
      file_name_validation(global_string_buffer,s_DATA_VFRA_0_ANI_0059c920);
      read_file_to_mem(global_string_buffer,local_8,0xfffffff,&local_4);
      puVar14 = local_8;
      if (local_4 == 0) {
        bVar15 = true;
      }
      else {
        local_c = (ushort *)((int)local_8 + local_4);
      }
    }
  }
  if (bVar15) goto LAB_0042c5ee;
  iVar11 = (int)local_c - (int)puVar14 >> 3;
  iVar9 = (int)local_8 - (int)puVar12 >> 2;
  vfra_related = (undefined2 *)malloc_1(iVar11 * 2);
  if (vfra_related == (undefined2 *)0x0) {
LAB_0042c4a6:
    bVar15 = true;
  }
  else {
    vfra_related_tail = vfra_related + iVar11;
    vfra_related_2 = (vfra_struct_2 *)malloc_1(iVar11 * 6);
    if (vfra_related_2 == (vfra_struct_2 *)0x0) goto LAB_0042c4a6;
    vfra_related_2_tail = (vfra_struct *)(vfra_related_2 + iVar11);
    vstart_related = (vstart_struct *)malloc_1(iVar9 * 6);
    if (vstart_related == (vstart_struct *)0x0) goto LAB_0042c4a6;
    vstart_related_tail = (vfra_struct *)(vstart_related + iVar9);
  }
  puVar1 = puVar14;
  pvVar2 = vfra_related_2;
  if (!bVar15) {
    for (; pvVar3 = vstart_related, pvVar13 = vele_0_mem, pvVar8 = (vfra_struct *)vfra_related,
        puVar1 < local_c; puVar1 = puVar1 + 4) {
      pvVar2->vele_index = *puVar1;
      pvVar2->width = (char)puVar1[1];
      pvVar2->height = *(undefined1 *)((int)puVar1 + 3);
      pvVar2->f3 = (char)puVar1[2];
      pvVar2->f4 = *(undefined1 *)((int)puVar1 + 5);
      pvVar2 = pvVar2 + 1;
    }
    for (; vele_0_mem = pvVar13, puVar12 < local_8; puVar12 = puVar12 + 2) {
      bVar4 = false;
      pvVar3->index_2 = (char)puVar12[1];
      pvVar10 = vstart_related;
      if (vstart_related < pvVar3) {
        do {
          if (pvVar10->vfra_ptr->index == *puVar12) {
            bVar4 = true;
            break;
          }
          pvVar10 = pvVar10 + 1;
        } while (pvVar10 < pvVar3);
      }
      if (bVar4) {
        pvVar3->frame_counter = pvVar10->frame_counter;
        pvVar3->vfra_ptr = pvVar10->vfra_ptr;
      }
      else {
        pvVar3->vfra_ptr = pvVar8;
        uVar7 = *puVar12;
        pvVar3->frame_counter = 0;
        pvVar5 = pvVar8;
        do {
          puVar1 = puVar14 + (uint)uVar7 * 4;
          pvVar8 = pvVar5;
          if (puVar1 <= puVar14) break;
          pvVar8 = (vfra_struct *)&pvVar5->index_vfra;
          pvVar5->index = (short)((int)puVar1 - (int)puVar14 >> 3);
          pvVar3->frame_counter = pvVar3->frame_counter + '\x01';
          uVar7 = puVar1[3];
          pvVar5 = pvVar8;
        } while (*puVar12 != uVar7);
      }
      pvVar3 = pvVar3 + 1;
      pvVar13 = vele_0_mem;
    }
    if (pvVar13 < vele_0_end) {
      do {
        uVar7 = (pvVar13->hspr_index / 6) * 8;
        pvVar13->hspr_index = uVar7;
        pvVar13->hspr_index = uVar7 - 8;
        uVar7 = pvVar13->flags;
        pvVar13->flags = uVar7 & 0xfff0;
        if ((uVar7 & 1) != 0) {
          pvVar13->flags = uVar7 & 0xfff0 | 1;
        }
        if ((uVar7 & 2) != 0) {
          *(byte *)&pvVar13->flags = (byte)pvVar13->flags | 2;
        }
        if ((uVar7 & 4) != 0) {
          *(byte *)&pvVar13->flags = (byte)pvVar13->flags | 8;
        }
        pvVar13 = pvVar13 + 1;
      } while (pvVar13 < vele_0_end);
    }
  }
LAB_0042c5ee:
  if (bVar15) {
    if (vstart_related != (vstart_struct *)0x0) {
      free_1(vstart_related);
      vstart_related = (vstart_struct *)0x0;
      vstart_related_tail = (vfra_struct *)0x0;
    }
    if (vfra_related_2 != (vfra_struct_2 *)0x0) {
      free_1(vfra_related_2);
      vfra_related_2 = (vfra_struct_2 *)0x0;
      vfra_related_2_tail = (vfra_struct *)0x0;
    }
    if (vfra_related != (undefined2 *)0x0) {
      free_1(vfra_related);
      vfra_related = (undefined2 *)0x0;
      vfra_related_tail = (undefined2 *)0x0;
    }
    if (vspr_0_loaded != 0) {
      free_sprite_2(&DATA_VSPR_0_INF_sprite);
      vspr_0_loaded = 0;
      vspr_related = 0;
    }
    if (vele_0_mem != (vele_struct *)0x0) {
      free_sprite_2(&DATA_VELE_0_ANI_sprite);
      vele_0_mem = (vele_struct *)0x0;
      vele_0_end = (vele_struct *)0x0;
    }
  }
  return !bVar15;
}
