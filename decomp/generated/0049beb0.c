/* Ghidra 12.1.3 pseudocode; entry 0049beb0; load_sprite.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


undefined1 load_sprite(char *param_1)

{
  undefined4 *puVar1;
  int iVar2;
  undefined4 uVar3;
  int iVar4;
  int *piVar5;
  undefined1 uVar6;
  undefined4 *unaff_FS_OFFSET;
  undefined4 local_10;
  undefined1 *puStack_c;
  undefined4 local_8;

  local_10 = *unaff_FS_OFFSET;
  local_8 = 0xffffffff;
  puStack_c = &LAB_0049c039;
  *unaff_FS_OFFSET = &local_10;
  uVar6 = 0;
  reset_global_palettes();
  if (*param_1 == '*') {
    uVar3 = malloc_1(*(undefined4 *)(param_1 + 0x116));
    **(undefined4 **)(param_1 + 0x10e) = uVar3;
    iVar2 = **(int **)(param_1 + 0x10e);
    if (iVar2 == 0) goto LAB_0049c089;
    uVar6 = 1;
    piVar5 = *(int **)(param_1 + 0x112);
    if (piVar5 == (int *)0x0) goto LAB_0049c089;
    iVar4 = *(int *)(param_1 + 0x116);
  }
  else {
    if ((param_1[0x11a] & 1U) == 0) {
      puVar1 = operator_new(0xc);
      if (puVar1 == (undefined4 *)0x0) goto LAB_0049bf7b;
      *puVar1 = &sprite_file_def_vtable;
      puVar1[1] = 0;
      puVar1[2] = 0;
      *puVar1 = &sprite_file_base_vtable;
    }
    else {
      puVar1 = operator_new(0x18);
      if (puVar1 == (undefined4 *)0x0) {
LAB_0049bf7b:
        puVar1 = (undefined4 *)0x0;
      }
      else {
        *puVar1 = &sprite_file_def_vtable;
        puVar1[1] = 0;
        puVar1[2] = 0;
        *puVar1 = &sprite_file_ext_vtable;
        puVar1[1] = 0;
        puVar1[3] = 0;
        puVar1[5] = 0;
        puVar1[4] = 0;
      }
    }
    local_8 = 0xffffffff;
    *(undefined4 **)(param_1 + 0x11c) = puVar1;
    reset_global_palettes();
    no_file_message();
    file_name_validation(global_string_buffer,param_1);
    iVar2 = load_sprite_internal(global_string_buffer,0,*(undefined4 *)(param_1 + 0x11c));
    if (iVar2 != 0) goto LAB_0049c089;
    uVar6 = 1;
    **(undefined4 **)(param_1 + 0x10e) = *(undefined4 *)(*(int *)(param_1 + 0x11c) + 4);
    piVar5 = *(int **)(param_1 + 0x112);
    if (piVar5 == (int *)0x0) goto LAB_0049c089;
    if ((*(ushort *)(param_1 + 0x11a) & 1) != 0) {
      **(int **)(param_1 + 0x10e) = *(int *)(param_1 + 0x11c);
      *(undefined4 *)(param_1 + 0x116) = *(undefined4 *)(*(int *)(param_1 + 0x11c) + 0x14);
      **(undefined4 **)(param_1 + 0x112) = *(undefined4 *)(*(int *)(param_1 + 0x11c) + 0xc);
      goto LAB_0049c089;
    }
    iVar2 = *(int *)(*(int *)(param_1 + 0x11c) + 8);
    *(int *)(param_1 + 0x116) = iVar2;
    if ((*(ushort *)(param_1 + 0x11a) & 2) != 0) {
      *piVar5 = **(int **)(param_1 + 0x10e);
      goto LAB_0049c089;
    }
    iVar4 = **(int **)(param_1 + 0x10e);
  }
  uVar6 = 1;
  *piVar5 = iVar4 + iVar2;
LAB_0049c089:
  *unaff_FS_OFFSET = local_10;
  return uVar6;
}
