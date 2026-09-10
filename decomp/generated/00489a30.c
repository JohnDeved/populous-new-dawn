/* Ghidra 12.1.3 pseudocode; entry 00489a30; FUN_00489a30.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

void FUN_00489a30(void)

{
  uint uVar1;
  uint uVar2;
  uint uVar3;
  uint uVar4;
  undefined1 local_98 [152];

  _DAT_0098ce9c = 0x21;
  if (DAT_00895dcd == '\x10') {
    DAT_0098ce90 = 0x1d;
    DAT_0098ce94 = 0x1e;
    _DAT_0098ce98 = 0x1f;
    _DAT_0098cea0 = 0xd5;
  }
  else if (DAT_00895dcd == '\x1e') {
    DAT_0098ce90 = 199;
    DAT_0098ce94 = 200;
    _DAT_0098ce98 = 0xc9;
    _DAT_0098cea0 = 0xca;
  }
  else {
    DAT_0098ce90 = 0x1d;
    DAT_0098ce94 = 0x1e;
    _DAT_0098ce98 = 0x1f;
    _DAT_0098cea0 = 0x20;
  }
  DAT_0098cebc = 1;
  _DAT_0098cec0 = 2;
  _DAT_0098cec4 = 3;
  _DAT_0098cec8 = 4;
  DAT_0098ceb8 = 0;
  DAT_0098ce78 = 0;
  DAT_0098ce7c = 0;
  _DAT_0098ce80 = 0;
  _DAT_0098ce84 = 0;
  _DAT_0098ce88 = 0;
  FUN_0056e070();
  if (((draw_mode == 2) || (DAT_0089ce36 != '\0')) || (interface_state == '\n')) {
    if (DAT_005ae2fc != -1) {
      FUN_0056e0f0(&DAT_0098cea8);
      FUN_0056d200(local_98);
      DAT_005ae2fc = -1;
    }
    _DAT_0098ce84 = 0xff;
  }
  else {
    if (DAT_005ae2fc != '\x13') {
      FUN_0056e0d0(DAT_005e4bfc);
      FUN_0056d200(local_98);
      DAT_005ae2fc = '\x13';
    }
    if (DAT_00895dc1 != 0) {
      uVar1 = (uint)DAT_00895dc3;
      uVar3 = (uint)DAT_00895dc1;
      uVar4 = (uint)DAT_00895dc5;
      DAT_0098ce78 = (uVar1 << 8) / uVar3;
      uVar2 = (int)(uVar4 - uVar1) >> 0x1f;
      DAT_0098ce7c = (uVar4 - ((uVar4 - uVar1 ^ uVar2) - uVar2)) + uVar1;
      _DAT_0098ce80 = ((uint)DAT_00895dc7 << 8) / uVar3;
      _DAT_0098ce88 = (uVar4 << 8) / uVar3;
      return;
    }
  }
  return;
}
