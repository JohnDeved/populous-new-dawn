# Player patrol producer bridge (#1003), 2026-11-13 07h

Source-only continuation of f71c961b at main 532cd9efb13acf0a36f2b9774c8892b18f918be6. No execution, tests or gameplay changes.

## Narrowed input route
- decomp/generated/004a9d90.c (blob d54a0b4137ba36c8e1c63d2e4e9db0b4d19a2aa2) maintains key-down at 00984591+code and key-up at 00984691+code. Thus 009845ae/009846ae and 0098462e/0098472e are the two Ctrl codes 1d/9d.
- decomp/generated/00437010.c (blob 474b7a094fdcb2a9b19bca4583b789009ad2908b) combines held Ctrl with state 0098e908 bit0x800. It sets context0x1000; if 004b98f0(point,playerTribe,1) accepts, adds0x800000.
- decomp/generated/00437750.c (blob acf2a0b5eb82000079c7529506059f202662ac73) selects model11 from context0x1000, subject to higher-priority contexts and eligibility.
- decomp/generated/004380f0.c (blob 37d215e208b2109d2f90feeac8da9a79fefe32b4) explicitly disables model11 unless both context0x1000 and0x800000 are present.
- process_cmd in 004aab80.c sets/clears state0x800 via actions0xbd/0xbe; 0xbb/0xbc control0x400. These are configurable action states, not yet proved Alt/Shift default bindings.
- The existing staged/final click route then uses this current model. app/person-orders.ts already normalizes consecutive model11/25 records to model25 with person flags2 bit16; do not duplicate that mechanism.

## Next evidence
Locate default binding records for actions0xbd/0xbe to establish the advertised Ctrl+Alt gesture, validate predicate004b98f0 and model11 payload, then trace N's action/scope and real completion/cycling behavior. No inference that generic order flag0x40 means patrol is justified. No claim of complete player patrol parity.
