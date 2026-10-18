# Painter depth distribution prototype

Only the second sort changes. The first cell/phase/object/face sort still runs,
then assigns each local command its unique ascending array-index order. The
original second comparator is `b.bucket - a.bucket || b.order - a.order`.
For integer buckets0..3584 and exact order===index, descending bucket distribution
with reverse input traversal therefore produces the same original command object
references at every output position. It does not combine meshes, alter alpha,
or change transparent cross-mesh/per-triangle interleaving.

Producer domain: polygonBucket clamps to0..3584; spriteBucket returns1..3585 and
Painter subtracts1. Selection command buckets can be arbitrary, so admission
checks every bucket and unique order. Noninteger, nonnumber, NaN, infinite,
out-of-range or ambiguous order values use the original comparison sort. Changed
array sort methods also preserve original dispatch.

Painter creates records locally with own plain data fields, and copies selection
values before sorting. It exposes records only after these sorts. The helper is
internal to this producer, not a public sorter for proxy/accessor command records.
No userData flag grants trusted record ownership.

Provisional threshold4096 and hard cap65536 are fixed before measurement, not
claimed optimal. Smaller/larger inputs retain the original sort. Lazy3585 Uint32
counters cost14340 bytes; reference scratch grows by powers of two to at most65536
slots. Slots are cleared after use, retaining capacity but not prior commands.
Texture disposal clears both scratch and counters; no additional scene ownership.
This work adds no IO, timers or processes. Tests remain serial. Work-count/order
proof is not browser/frame-rate evidence; measure independently before admission.
