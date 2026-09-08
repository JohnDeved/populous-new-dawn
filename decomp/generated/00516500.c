/* Ghidra 12.1.3 pseudocode; entry 00516500; set_texture_5.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


/* WARNING: Globals starting with '_' overlap smaller symbols at the same address */
/* WARNING: Enum "_D3DRENDERSTATETYPE": Some values do not have unique names */

void set_texture_5(int param_1,int param_2,int param_3,int param_4,_union_3451 param_5,byte param_6,
                  undefined4 param_7,undefined4 param_8)

{
  float fVar1;
  float fVar2;
  short sVar3;
  ushort uVar4;
  double dVar5;

  sVar3 = calc_angle_quadrant(param_3 - param_1,param_4 - param_2);
  uVar4 = sVar3 - 0x200U & 0x7ff;
  D3DTLVERTEX_005da150.color = param_5;
  D3DTLVERTEX_005da130.color = param_5;
  fVar1 = (float)(maybe_cos[uVar4] << (param_6 & 0x1f)) * _DAT_0058f8f8;
  D3DTLVERTEX_005da110.color = param_5;
  D3DTLVERTEX_005da0f0.color = param_5;
  fVar2 = (float)-(maybe_sin[uVar4] << (param_6 & 0x1f)) * _DAT_0058f8f8;
  dVar5 = _ceil((double)((float)param_1 + fVar2));
  D3DTLVERTEX_005da0f0.sx.sx = (D3DVALUE)dVar5;
  dVar5 = _ceil((double)((float)param_2 + fVar1));
  D3DTLVERTEX_005da0f0.sy.sy = (D3DVALUE)dVar5;
  dVar5 = _ceil((double)((float)param_3 + fVar2));
  D3DTLVERTEX_005da110.sx.sx = (D3DVALUE)dVar5;
  dVar5 = _ceil((double)((float)param_4 + fVar1));
  D3DTLVERTEX_005da110.sy.sy = (D3DVALUE)dVar5;
  dVar5 = _ceil((double)((float)param_3 - fVar2));
  D3DTLVERTEX_005da130.sx.sx = (D3DVALUE)dVar5;
  dVar5 = _ceil((double)((float)param_4 - fVar1));
  D3DTLVERTEX_005da130.sy.sy = (D3DVALUE)dVar5;
  dVar5 = _ceil((double)((float)param_1 - fVar2));
  D3DTLVERTEX_005da150.sx.sx = (D3DVALUE)dVar5;
  dVar5 = _ceil((double)((float)param_2 - fVar1));
  D3DTLVERTEX_005da150.sy.sy = (D3DVALUE)dVar5;
  add_polygon_quad_texture_a0
            (&D3DTLVERTEX_005da0f0,&D3DTLVERTEX_005da110,&D3DTLVERTEX_005da130,&D3DTLVERTEX_005da150
             ,param_7,param_8);
  return;
}
