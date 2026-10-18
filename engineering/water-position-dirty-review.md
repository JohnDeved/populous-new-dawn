# PR553 current-main eligibility repair

Base ancestry retains public efb8ab47 and merges current main a2cdba7f. The original
stored-Float32-bit comparison and all writes remain unchanged. Main's terrain
submission ownership integration is preserved. This is not the rejected water
point cache or any projection experiment.

Four failure-first regressions reproduced missing dirty increments for canonical-
returning getX/getZ/setY accessors and a replaced prototype setY that changes Z.
Eligibility now captures shipped method values once and inspects effective data
properties on the known attribute chain without invoking getters. A changed
intermediate prototype rejects eligibility. Checks occur once per changed-key
update, never per vertex. Custom methods/accessors use unconditional dirty marking.

Tests compare custom accessor/prototype callback order, actual position bits and
versions against the exact frozen current-main updateWater. Original rounding,
signed-zero/NaN-payload, shared/aliased/offset storage, update-range and authored
M1/M2 cache invalidation tests remain. The previously unavailable asset-dependent
water-animation-caller suite is now runnable in this cloud checkout.

The optimization still traverses/writes every vertex and creates one Uint32 view
on eligible updates. Comparison stops after the first stored Y-bit difference.
It does not claim an observed wet-gameplay frequency, speedup or fewer simulation
steps. Real wave changes still mark positions dirty; only byte-identical Y writes
can avoid the mark. Arbitrary callbacks mutating unrelated position storage and
external writes whose owners omit needsUpdate remain outside the original stated
contract. No browser/GPU or full-check/build acceptance is claimed here.

Independent executable review additionally found that metadata admission itself
invoked count/array/itemSize/normalized accessors. New failure-first cases preserve
that evidence. Eligibility now requires own data descriptors for these fields and
light/highlight array references before any extra reads. Captured TypedArray
buffer/byteOffset/length/type getters inspect intrinsic storage without invoking
shadowing properties. Unsupported intrinsic receivers fall back. Exact-parent
parity includes lighting-array accessor side effects; typed-array metadata hooks
receive zero extra calls. These remain once-per-update checks, with no per-vertex
descriptor inspection and no new cache or retained storage.
