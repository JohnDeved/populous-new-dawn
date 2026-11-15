#include "capture.h"
#include <stdlib.h>
#include <string.h>
static uint32_t u32(const uint8_t *p){return (uint32_t)p[0]|(uint32_t)p[1]<<8|(uint32_t)p[2]<<16|(uint32_t)p[3]<<24;}
void captured_surface_free(CapturedSurface *out){if(out){free(out->rgba);memset(out,0,sizeof *out);}}
int capture_surface(GuestMemoryPort *memory,const uint8_t *d,size_t n,int full,int owner,int software,const uint32_t *palette,size_t palette_n,CapturedSurface *out){
 if(!out||out->rgba||out->length||out->width||out->height)return 1;
 if(!memory||!d||!full||!owner||!software||(n!=108&&n!=124))return 1;
 if(u32(d)!=n||u32(d+72)!=32||(u32(d+4)&0x180e)!=0x180e)return 1;
 uint32_t w=u32(d+12),h=u32(d+8),pitch=u32(d+16),base=u32(d+36),flags=u32(d+76),bits=u32(d+84);
 if(!w||!h||w>1024||h>1024||base<65536)return 1;
 if(bits==8){if(flags!=0x60||!palette||palette_n!=256)return 1;}
 else if(bits==16){if(flags!=0x40||u32(d+88)!=0xf800||u32(d+92)!=0x7e0||u32(d+96)!=0x1f||u32(d+100))return 1;}
 else return 1;
 size_t row_bytes=(size_t)w*(bits/8);
 if(pitch<row_bytes||pitch>65536||(uint64_t)base+(uint64_t)(h-1)*pitch+row_bytes>UINT64_C(0x100000000))return 1;
 uint32_t pal[256];if(bits==8)memcpy(pal,palette,sizeof pal);
 size_t length=(size_t)w*h*4;uint8_t *rgba=malloc(length);if(!rgba)return 2;
 uint8_t row[2048];
 for(uint32_t y=0;y<h;y++){
  if(gm_copy_out(memory,base+y*pitch,row,row_bytes)!=GM_OK){free(rgba);return 3;}
  for(uint32_t x=0;x<w;x++){
   uint8_t *p=rgba+((size_t)y*w+x)*4;
   if(bits==8){uint32_t c=pal[row[x]];p[0]=(uint8_t)(c>>16);p[1]=(uint8_t)(c>>8);p[2]=(uint8_t)c;}
   else{uint32_t c=(uint32_t)row[x*2]|(uint32_t)row[x*2+1]<<8,r=c>>11,g=(c>>5)&63,b=c&31;p[0]=(uint8_t)((r<<3)|(r>>2));p[1]=(uint8_t)((g<<2)|(g>>4));p[2]=(uint8_t)((b<<3)|(b>>2));}
   p[3]=255;
  }
 }
 *out=(CapturedSurface){rgba,length,w,h};return 0;
}
