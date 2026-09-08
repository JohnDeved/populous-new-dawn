/* Ghidra 12.1.3 pseudocode; entry 00420f80; FUN_00420f80.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */

void FUN_00420f80(byte *param_1,byte param_2)

{
  undefined2 local_4;

  DAT_00650938 = param_1[2];
  DAT_00650942 = param_1[6];
  _DAT_00650930 = *param_1 + 0x1400;
  _DAT_00650934 = param_1[1] + 0x1400;
  _DAT_0065093a = param_1[4] + 0x1400 + *(int *)(&DAT_00651348 + (uint)param_2 * 10);
  DAT_0065138e = _DAT_0065093a & 0xfffffffe;
  DAT_00651370 = DAT_0065138e - 2;
  _DAT_0065093e = param_1[5] + 0x1400 + *(int *)(&DAT_0065134c + (uint)param_2 * 10);
  DAT_0065137e = _DAT_0065093e & 0xfffffffe;
  DAT_00651374 = DAT_0065137e - 2;
  DAT_00651378 = local_4;
  DAT_00651388 = DAT_0065137e + 2;
  DAT_0065137a = DAT_00651370;
  DAT_00651382 = local_4;
  DAT_00651384 = DAT_00651370;
  DAT_0065138c = local_4;
  DAT_00651392 = DAT_00651374;
  DAT_00651396 = local_4;
  DAT_006513a2 = DAT_0065138e + 2;
  DAT_00651398 = DAT_0065138e;
  DAT_0065139c = DAT_00651388;
  DAT_006513a0 = local_4;
  DAT_006513a6 = DAT_00651374;
  DAT_006513aa = local_4;
  DAT_006513ac = DAT_006513a2;
  DAT_006513b0 = DAT_0065137e;
  DAT_006513b4 = local_4;
  _DAT_006513b6 = DAT_006513a2;
  DAT_006513ba = DAT_00651388;
  DAT_006513be = local_4;
  return;
}
