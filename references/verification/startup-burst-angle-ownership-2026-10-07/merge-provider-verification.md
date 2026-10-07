# Startup-angle merge and provider readback

PR253 merged as `e3a7a06a4250457502288d5b4c4e4ad8f3b40b53`.
[Merge verification](merge-verification.json) confirms tree
`51dbcf5136e14fd744384996f5f90366ccfb315e` exactly matches the tested source
`8592c0049b720f568630db42d1b9b602a000b0b4`. The merge receipt's pending provider
status is its original point-in-time observation and remains unchanged.

The later [provider verification](provider-verification.json) records check
112602038820 completed successfully at2026-10-07T02:30:15Z for that exact merge,
with version `57b6174c-f320-4b0c-88ca-5b5478653caf`.
This records provider success only; it adds no production gameplay,
traffic-percentage or full original-parity claim.

The [independent review and ordinary paired images](final-integration-review.md)
retain their original scope. The five-seed/160-particle native probe received a
source-label correction, not a new native execution. The separate native
root-height limitation, QA style warnings and Fallow advisory findings remain
explicit, and earlier failed gates remain preserved.
