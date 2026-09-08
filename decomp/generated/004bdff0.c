/* Ghidra 12.1.3 pseudocode; entry 004bdff0; set_landscape_globe_texture.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


/* WARNING: Enum "_D3DRENDERSTATETYPE": Some values do not have unique names */

void set_landscape_globe_texture(undefined2 param_1)

{
  byte *pbVar1;
  char *pcVar2;
  byte bVar3;
  int iVar4;
  uint uVar5;
  undefined1 uStack_5;
  undefined2 uStack_4;

  if (landscape_flags_1 == '\x03') {
    uVar5 = (uint)(byte)((byte)param_1 >> 1);
    bVar3 = (byte)((ushort)param_1 >> 9);
    uStack_4 = (ushort)bVar3;
    iVar4 = (int)*(short *)(res_array_3 + ((uint)bVar3 * 0x80 + uVar5) * 2);
    if (-1 < iVar4) {
      pbVar1 = (byte *)(res_array_1 + 2 + iVar4 * 8);
      *pbVar1 = *pbVar1 & 0xfd;
      pcVar2 = (char *)(res_array_1 + 3 + iVar4 * 8);
      *pcVar2 = *pcVar2 + '\x01';
    }
    if (((byte)level_flags & 4) == 0) {
      set_texture_globe((uint)CONCAT12(bVar3,param_1),
                        (uVar5 & 0xffffffe0) * 0x800 + (uStack_4 & 0xffffffe0) * 0x2000 +
                        (uVar5 & 0x1f) * 8 + (uStack_4 & 0x1f) * 0x800 +
                        landscape_texture_storage_big);
    }
    else {
      set_texture_globe_fade();
    }
    *(undefined1 *)(((int)uVar5 >> 2) + 0x9bc318 + (uStack_4 & 0xfffffffc) * 8) = 1;
  }
  return;
}
