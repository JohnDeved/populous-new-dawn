/* Ghidra 12.1.3 pseudocode; entry 00420dd0; FUN_00420dd0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

void FUN_00420dd0(byte *param_1)

{
  int iVar1;

  _DAT_00651352 = 0;
  DAT_0064f4a0 = 0;
  DAT_0064fee8 = 0;
  DAT_0065092b = 0;
  DAT_006513d9 = 0;
  DAT_006513da = 0;
  DAT_00650938 = param_1[2];
  DAT_00650942 = param_1[6];
  _DAT_00650930 = *param_1 + 0x1400;
  _DAT_00650934 = param_1[1] + 0x1400;
  _DAT_0065093a = param_1[4] + 0x1400;
  _DAT_0065093e = param_1[5] + 0x1400;
  if (*param_1 + 0x1480 < _DAT_0065093a) {
    _DAT_00651348 = -0x100;
  }
  else if (param_1[4] + 0x1480 < _DAT_00650930) {
    _DAT_00651348 = 0x100;
LAB_00420ea0:
    _DAT_00651352 = 0;
  }
  else if (_DAT_00650930 < _DAT_0065093a) {
    _DAT_00651348 = 0;
    _DAT_00651352 = -0x100;
  }
  else {
    if (_DAT_00650930 <= _DAT_0065093a) {
      _DAT_00651348 = 0;
      goto LAB_00420ea0;
    }
    _DAT_00651348 = 0;
    _DAT_00651352 = 0x100;
  }
  if (param_1[1] + 0x1480 < _DAT_0065093e) {
    _DAT_0065134c = -0x100;
  }
  else if (param_1[5] + 0x1480 < _DAT_00650934) {
    _DAT_0065134c = 0x100;
  }
  else {
    if (_DAT_00650934 < _DAT_0065093e) {
      _DAT_0065134c = 0;
      iVar1 = -0x100;
      goto LAB_00420f04;
    }
    if (_DAT_0065093e < _DAT_00650934) {
      _DAT_0065134c = 0;
      iVar1 = 0x100;
      goto LAB_00420f04;
    }
    _DAT_0065134c = 0;
  }
  iVar1 = 0;
LAB_00420f04:
  if ((_DAT_00651352 != _DAT_00651348) && (iVar1 != _DAT_0065134c)) {
    _DAT_00651356 = _DAT_0065134c;
    _DAT_0065135c = _DAT_00651348;
    _DAT_00651360 = iVar1;
    _DAT_00651366 = _DAT_00651352;
    _DAT_0065136a = iVar1;
    DAT_006513d5 = 4;
    return;
  }
  DAT_006513d5 = 2;
  if (_DAT_00651352 != _DAT_00651348) {
    _DAT_00651356 = _DAT_0065134c;
    return;
  }
  _DAT_00651352 = _DAT_00651348;
  _DAT_00651356 = iVar1;
  return;
}
