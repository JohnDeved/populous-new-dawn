/* Ghidra 12.1.3 pseudocode; entry 004174b0; FUN_004174b0.
 * See ../README.md and ../exports.json. Types/names may be inferred. Not compilable original source. */


int FUN_004174b0(void)

{
  DAT_0089d172 = (byte)((int)(maybe_framerate * 3 + (maybe_framerate * 3 >> 0x1f & 3U)) >> 2) & 0xfe
  ;
  if ((char)DAT_0089d172 < '\b') {
    DAT_0089d172 = 8;
  }
  if (' ' < (char)DAT_0089d172) {
    DAT_0089d172 = 0x20;
  }
  if ((level_flags_1._2_1_ & 0x10) != 0) {
    DAT_0089d172 = (byte)(((int)(char)DAT_0089d172 << 8) / DAT_0089c6a9);
  }
  return (int)(char)DAT_0089d172;
}
