# Authored C surface capture adapter

Synthetic test tooling for #1020. No original runtime headers, code or binaries are included. This is not an original-game renderer.

The adapter decodes a copied full-surface 108/124-byte DirectDraw-style descriptor, validates formats and 32-bit address ranges, and reads visible rows through the sparse memory adapter. It supports indexed8 with an explicitly resolved 256-entry XRGB palette and little-endian RGB565. Output is independently owned opaque RGBA. Bounds are 1024×1024 pixels, a 2048-byte row buffer and at most 4 MiB of RGBA output.

The caller must exclusively own memory and palette throughout capture. Boolean arguments assert these conditions but do not establish synchronization. Hybrid Direct3D and rectangle-relative captures are unsupported. Initialize CapturedSurface to zero, then free successful output with captured_surface_free before reuse. A nonempty output is rejected unchanged; failures release temporary storage without publishing partial output.

From this directory, compile and run in a scratch output location:

```sh
gcc -std=c11 -Wall -Wextra -Werror -fsanitize=undefined -I../../browser-boundary-fixture/c-memory capture.c test.c ../../browser-boundary-fixture/c-memory/guest_memory_port.c -o /tmp/recomp-capture-test
/tmp/recomp-capture-test
```

Synthetic tests cover high-address page crossing, indexed/RGB565 colors, snapshot independence, ownership/path rejection, overflow, unmapped second-row failure without partial output, 124-byte descriptors and dimension bounds. Native tests do not prove browser/WASM behavior, real renderer ownership or original framebuffer provenance.
