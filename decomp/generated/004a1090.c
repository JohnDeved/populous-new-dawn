/* Ghidra 12.1.3 pseudocode; entry 004a1090; FUN_004a1090.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


void FUN_004a1090(void)

{
  if (draw_mode != 2) {
    if (((DAT_009845bb != '\0') && (DAT_009846bb == '\0')) ||
       ((DAT_009845c7 != '\0' && (DAT_009846c7 == '\0')))) {
      func_0x00450f30(4,0,0,0);
      return;
    }
    if (((DAT_009845ae != '\0') && (DAT_009846ae == '\0')) ||
       ((DAT_0098462e != '\0' && (DAT_0098472e == '\0')))) {
      func_0x00450f30(5,0,0,0);
      return;
    }
    func_0x00450f30(0,0,0,0);
  }
  return;
}
