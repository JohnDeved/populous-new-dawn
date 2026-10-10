# Independent review: finite phase16 Spy/Shaman release contract

Verdict: ACCEPT the bounded static contract. This is not implementation readiness or authorization to activate admission.

Reviewed packet: `issue248-phase16-specialist-release-static-20261010`.

- `findings.md`: `aa40dc8f11f64b15e7d9ed0069c806135860fdb2a43bb7d3a29ee6484b00ae41`
- `provenance.json`: `228cb0bc0b2d3750c2e1239085639fc5a5eae8b90d2b9bf54cd4ee5c3a1ec0ce`
- `SHA256SUMS`: `4cafef8871d0a5daa5d3d6071ffbbd9f4adacc214cc8f250c541ab72b2cfcbf8`

The 18 inventory entries verify. The review checked the 16 source inputs, including 12 immutable repository inputs and four byte-identical accepted inputs; all five native exports match the exact production export registry. The canonical executable's size and SHA256 agree with the accepted identity. Existing caller and maintenance excerpts were read independently. This review performed no new disassembly, native execution, port execution, tests, or production edits.

## Accepted contract

The phase16 caller supplies the ordered hostile building/person lists collected with radius7 and cap10. The ordinary maintenance path requires exact assignment ownership, no deletion flag, and person+0x7f bit0 clear. Its separate special-bit branch is outside this contract.

Model5 is Spy. Its local count is incremented before the release decision. Release at004ce7f3 requires the flags4 mask0x40 latch already set, state-table mask8 set, and the actual collected building-list head zero. The unlatched/no-resolved-entity/empty-building branch sets the latch and leaves membership intact for that visit. A later eligible visit releases. The optional disguise prefix and general live-target producer0043b8e0 retain their explicit source/input limits.

Model7 is Shaman. Its local count is likewise incremented first. Release at004ceab8 depends on a zero result from004f4f60 over the three task spell bytes; later cast refusals are different paths. The known [0,0,0] case uses the previously accepted selector/ATTACK-operand contract. The selector is not a newly registered or independently completed body in this packet; absent legacy spell bytes remain unknown. State10, whose table mask8 is clear, skips the optional pre-selection move.

Both release paths obtain the home point through004f6020, attempt0043b2a0, discard its returned value, and call004f2440(person,0) unconditionally. The complete membership leaf clears person+0x7f bit0, writes assignment zero, and clears flags3 mask0x2000, preserving unrelated bits. It does not subtract the already-counted visit; the next visit excludes the released person.

The full-pool supplied positives are closed only with allocator cursor in1..799 and all799 usable order records occupied. That explicit cursor correction matters: a zero cursor with a free sentinel is not the same no-mutation case. With the corrected inputs, return-order allocation fails before cleanup/attachment, yet membership clears. A one-person chain and elapsed value not divisible by4 avoid unrelated visits and the optional coordinate helper. These are source-backed supplied cases, not executed campaign observations.

## Boundaries and disposition

Successful return allocation stops at0043b2a0→00438730 and then the applicable existing-order cleanup004364d0 and attachment00436d00. The earlier command19/no0x20/object0 cleanup proof cannot stand in for arbitrary specialist queues. The general Spy target/disguise producers and live Shaman selector inputs also remain explicitly bounded.

The model7 known-zero/full-pool case supports a proposed actual-dispatcher failure-first regression; none was run or newly authorized by this verdict. A meaningful Spy producer/release regression requires the two visits and the actual collector/entity inputs. Injecting an already-set latch alone does not establish general Spy ownership maintenance.

Spy5/Shaman7 maintenance is a prerequisite of universal admission activation. The accepted M6 selected-member list instead contains three Warriors3 and one Preacher4. This packet does not demonstrate that those specialist release branches execute in that captured case. The selected list also does not establish the entire same-tribe state14 set scanned by original phase3 admission. Preacher4 has its separate previously uncomposed004f5770/0043b790 boundary, including a possible first-unlatch visit; absence of a direct004f2440 call in that caller branch is not a transitive preservation proof.

The general proposal remains held and the Warrior-only subset remains withdrawn for lack of an established useful current full-cohort case. No arbitrary3/4 gate, partial native full-set admission, or implementation release follows from this acceptance. The ten accepted actual-caller red tests and their separate results remain the existing regression checkpoint.
