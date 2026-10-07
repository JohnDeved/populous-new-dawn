# Exact setup5 command-buffer write declaration

Attempt01 at77839a91 is preserved at34016b86. Calls1–4 returned; call5 stopped
before its first command-buffer store. No result from the later loader is claimed.

The already-frozen original setup function0042b7f0 executes0042b7f1
`mov ecx,0089798d`,0042b7f7 `xor eax,eax`, then clears DWORD+0 at0042b7fe,
DWORD+4 at0042b800, and WORD+8 at0042b803. Thus the exact native-owned field is
10 bytes `[0089798d,00897997)`. Indexed export00479dd0 identifies its navigation/
input command-buffer role. No neighbouring00897997 command array is admitted.

The sole native-access correction adds this10-byte write range, constrained by
entry5, stage setup-5, the three exact PC/address/width triples and value zero.
There is no supplied memory write, instruction/closure change, initializer change,
extra native call, allocation policy, state/expectation change or wider range.
The failed attempt01 and its unchanged source/input identities remain intact.

Host-only checks exercise these three admitted zero stores and reject wrong PC,
width, value, stage and adjacent-field writes. The case remains2,011 top-level
entries,86 allocation attempts/depth2 and the same30s+5s/25CPU/1GiB envelope.
A new fresh attempt02 location is declared; no corrected native run is authorized
by this document. Independent exact review and a separate grant are required.
