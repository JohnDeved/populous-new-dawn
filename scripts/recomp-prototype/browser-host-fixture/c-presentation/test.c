#include "capture.h"
#include <assert.h>
#include <stdio.h>
#include <string.h>
static void put(uint8_t *d,size_t o,uint32_t n){for(unsigned i=0;i<4;i++)d[o+i]=(uint8_t)(n>>(8*i));}
int main(void){
 GuestMemoryPort *m=gm_create(2);assert(m);assert(gm_map_page(m,0xfe000000)==GM_OK);assert(gm_map_page(m,0xfe010000)==GM_OK);
 uint8_t d[108]={0};put(d,0,108);put(d,4,0x180f);put(d,8,2);put(d,12,1);put(d,16,4);put(d,36,0xfe00ffff);put(d,72,32);put(d,76,0x60);put(d,84,8);
 uint32_t palette[256]={0};palette[1]=0xff0000;palette[2]=0x0000ff;uint8_t a=1,b=2;
 assert(gm_copy_in(m,0xfe00ffff,&a,1)==GM_OK);assert(gm_copy_in(m,0xfe010003,&b,1)==GM_OK);
 CapturedSurface out={0};assert(capture_surface(m,d,sizeof d,1,1,1,palette,256,&out)==0);uint8_t expected[]={255,0,0,255,0,0,255,255};assert(out.length==8&&!memcmp(out.rgba,expected,8));
 palette[1]=0;assert(out.rgba[0]==255);assert(capture_surface(m,d,sizeof d,1,1,1,palette,256,&out)==1);captured_surface_free(&out);assert(!out.rgba&&!out.length);
 assert(capture_surface(m,d,sizeof d,0,1,1,palette,256,&out)==1);assert(capture_surface(m,d,sizeof d,1,0,1,palette,256,&out)==1);assert(capture_surface(m,d,sizeof d,1,1,0,palette,256,&out)==1);
 put(d,36,0xfd000000);assert(capture_surface(m,d,sizeof d,1,1,1,palette,256,&out)==3);assert(!out.rgba&&!out.length);
 put(d,36,0xffffffff);assert(capture_surface(m,d,sizeof d,1,1,1,palette,256,&out)==1);
 put(d,36,0xfe00ffff);put(d,76,0x40);put(d,84,16);put(d,88,0xf800);put(d,92,0x7e0);put(d,96,0x1f);uint8_t r[]={0,248},blue[]={31,0};assert(gm_copy_in(m,0xfe00ffff,r,2)==GM_OK);assert(gm_copy_in(m,0xfe010003,blue,2)==GM_OK);
 assert(capture_surface(m,d,sizeof d,1,1,1,NULL,0,&out)==0);assert(!memcmp(out.rgba,expected,8));captured_surface_free(&out);
 /* Valid first row followed by unmapped second row must not publish output. */
 GuestMemoryPort *one=gm_create(1);assert(one);assert(gm_map_page(one,0x10000)==GM_OK);
 put(d,36,0x1fffe);assert(gm_copy_in(one,0x1fffe,r,2)==GM_OK);
 assert(capture_surface(one,d,sizeof d,1,1,1,NULL,0,&out)==3);
 assert(!out.rgba&&!out.length&&!out.width&&!out.height);gm_destroy(one);
 /* Extended descriptor and maximum width remain accepted, cap+1 rejected. */
 uint8_t extended[124]={0};memcpy(extended,d,108);put(extended,0,124);
 put(extended,8,1);put(extended,12,1024);put(extended,16,2048);put(extended,36,0xfe000000);
 assert(capture_surface(m,extended,sizeof extended,1,1,1,NULL,0,&out)==0);
 assert(out.width==1024&&out.height==1&&out.length==4096);captured_surface_free(&out);
 put(extended,12,1025);assert(capture_surface(m,extended,sizeof extended,1,1,1,NULL,0,&out)==1);assert(!out.rgba);
 /* Max height uses a mapped 2048-byte column; height+1 is rejected. */
 put(extended,12,1);put(extended,8,1024);put(extended,16,2);
 assert(capture_surface(m,extended,sizeof extended,1,1,1,NULL,0,&out)==0);
 assert(out.width==1&&out.height==1024&&out.length==4096);captured_surface_free(&out);
 put(extended,8,1025);assert(capture_surface(m,extended,sizeof extended,1,1,1,NULL,0,&out)==1);
 gm_destroy(m);puts("PASS authored C descriptor/sparse capture: indexed palette, RGB565 crosspage, ownership/path/overflow rejection and no partial output");
}
