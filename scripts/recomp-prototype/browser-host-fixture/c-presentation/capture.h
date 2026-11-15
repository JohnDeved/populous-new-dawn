#ifndef AUTHORED_CAPTURE_H
#define AUTHORED_CAPTURE_H
#include "guest_memory_port.h"
/* Newly authored single-owner boundary. No original runtime linkage. */
typedef struct {uint8_t *rgba; size_t length; uint32_t width,height;} CapturedSurface;
/* full_surface/owner/software are caller assertions, not synchronization. */
int capture_surface(GuestMemoryPort *,const uint8_t *descriptor,size_t descriptor_length,
 int full_surface,int owner,int software,const uint32_t *palette,size_t palette_length,CapturedSurface *out);
void captured_surface_free(CapturedSurface *);
#endif
