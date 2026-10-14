# Retained native passenger positions after route retirement

## Native owner

Static-only original data examination; no execution or emulation. Verified EXE
SHA256 and indexed export hashes are in `m16-seat-sync-evidence/source-hashes.txt`.
`00465ea0` resolves each physical vehicle slot through `unit_land_array`, computes
its seat position, then calls `add_unit_to_cell(actualPerson, &position)` and sets
flags2 `0x4000`. Route-group/map membership is not a precondition for this update.
`004659d0` voluntary departure retains that person's current position/height and
writes launch velocity. Thus the settled seat's actual person coordinates must
remain current even after its command/route is retired.

Static command provenance:
`objdump -d -Mintel --start-address=0x465ea0 --stop-address=0x466220 D3DPopTB.exe`.
Tool version and raw disassembly retained alongside hashes. Existing browser
settled-seat geometry is reused; this change does not add the native countdown
interpolation or broaden deletion/class0 admission parity.

## Genuine failure

M16 ordinary actual-clock campaign on `9c2cf2ef`: checkpoint10183 has three
manufactured Balloons, pilots603/569/673 and later-boarded passengers112/113/114.
All six lack `pathfinding.people` entries after commands retire, but each retains
`unit.native === objectCells.objects.get(id)`. Browser coordinates follow the
craft while native passengers112–114 still hold home boarding positions.
Public panel unload publishes those stale native objects as flight owners. On
turn10187 passenger112 moves114.6124 wrapped units; the other two later-boarded
passengers also return near home. No actor mutation produced this witness.

`syncLiveVehiclePassengers` looked only in the transient route map. Its fallback
updated browser positions without the existing native owner. Resolve the same
fallback already used by the public unload consumer (`map ?? unit.native`) before
seat synchronization, retaining existing registry relocation and map precedence.
Do not reinsert routes, allocate actors or repair coordinates only at departure.

## Qualification

Historical10183 gzip fixture uncompressed SHA256:
`c8414664eaf3a65b7d8cc653134bab8af87f21a38d5d5bd460e28d90b1f5906c`.
The regression starts there, advances ordinary simulation/animation frames,
checks exact native/browser/seat XYZ and cell membership, uses public ObjectPanels
unload, and verifies continuous healthy dry landing with Save/Load twins.
Active flight keeps the existing native owner; existing no-order landing may
retire that wrapper. Supplied Boat/Balloon controls separately cover map
precedence, unregistered native fallback and browser-only legacy passengers.
This checkpoint-local proof cannot qualify earlier corrupted native positions;
independent player replay must start at actual preboarding9396 before campaign
continuation. Standard gates and that public replay are pending at first commit.
