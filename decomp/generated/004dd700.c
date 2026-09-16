/* Ghidra 12.1.3 pseudocode; entry 004dd700; create_aod.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void create_aod(int param_1,undefined1 param_2)

{
  unit_struct *puVar1;
  unit_struct *puVar2;
  int iVar3;

  iVar3 = alloc_unit(1,8,*(undefined1 *)(param_1 + 0x2f),param_1 + 0x3d);
  if (iVar3 != 0) {
    FUN_004ede10(iVar3,param_1);
    *(undefined1 *)(iVar3 + 0x2d) = 0xd;
    *(uint *)(iVar3 + 0xc) = *(uint *)(iVar3 + 0xc) | 0x40000000;
    *(undefined2 *)(iVar3 + 0x89) = 0;
    *(undefined1 *)(iVar3 + 0x7c) = param_2;
    add_unit_to_cell(iVar3,param_1 + 0x3d);
    FUN_004db980(iVar3);
    if (*(ushort *)(iVar3 + 0x89) != 0) {
      puVar1 = unit_land_array[*(ushort *)(iVar3 + 0x89)];
      puVar2 = unit_land_array[*(ushort *)(param_1 + 0x89)];
      FUN_004ede10(puVar2,puVar1);
      add_unit_to_cell(puVar2,&puVar1->pos);
    }
  }
  return;
}
