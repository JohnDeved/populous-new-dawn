/* Ghidra 12.1.3 pseudocode; entry 005166c0; set_texture_4.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void set_texture_4(undefined4 param_1,undefined4 param_2,undefined4 param_3,undefined4 param_4,
                  uint param_5,byte param_6)

{
  uint uVar1;
  uint uVar2;
  int iVar3;
  undefined4 uVar4;

  uVar1 = param_5 >> 0x10 & 0xff;
  uVar4 = 0;
  uVar2 = param_5 >> 8 & 0xff;
  param_5 = param_5 & 0xff;
  iVar3 = 0xff;
  if ((((byte)vertices_flags & 8) != 0) &&
     (uVar4 = 0x40, iVar3 = DAT_005da07c, ghost_mem_ptr_2 != &ghost0_mem)) {
    uVar1 = (uint)(byte)ghost_mem_ptr_2[(uint)(param_6 | 0xf) * 0x100];
    uVar2 = (uint)*(byte *)((int)system_palette_mem + uVar1 * 4 + 1);
    param_5 = (uint)*(byte *)((int)system_palette_mem + uVar1 * 4 + 2);
    uVar1 = (uint)*(byte *)(system_palette_mem + uVar1);
    iVar3 = (uint)(param_6 & 0xf) << 4;
  }
  set_texture_5(param_1,param_2,param_3,param_4,
                (iVar3 << 0x10 | uVar2) << 8 | uVar1 << 0x10 | param_5,0,0,uVar4);
  return;
}
