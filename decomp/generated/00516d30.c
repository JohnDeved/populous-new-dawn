/* Ghidra 12.1.3 pseudocode; entry 00516d30; set_font_render_default.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void set_font_render_default(undefined *param_1,undefined4 param_2)

{
  bool bVar1;

  if ((DAT_005da078 == 0) && (bVar1 = param_1 != &DAT_00591698, param_1 = &DAT_005da1f0, bVar1)) {
    param_1 = &DAT_005da200;
  }
  set_text_render(param_1,param_2);
  return;
}
