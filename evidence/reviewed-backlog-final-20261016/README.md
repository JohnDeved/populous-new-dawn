# Reviewed backlog: combined focused validation

> Historical run artifacts referenced below are [retained at the pre-cleanup commit](https://github.com/JohnDeved/populous-new-dawn/tree/bc9cabf404240ad99b2aab8c26e9b0137cdd7702/evidence/reviewed-backlog-final-20261016), not in the current checkout. Source probes, fixtures, and findings remain tracked where applicable.

Tested source: `6f5d5c168d265dab4d2341940eb76f4d1e1eb813`.
Tested tree: `c6dc2cd27dabd7666d23689aa0cf7ea34b490371`.
Main base: `52aacab7e17a12090b9158649b373427d439f234`.

The four frozen PR merges and single resource-conflict resolution are recorded in
`evidence/reviewed-backlog-integration-20261016`. Main merge `8ed4d440d0b72c56c71d96fdd9e614974cb1798a`
produced zero tree diff against accepted backlog `b1a0101c`. The next commit changes
only productionSha256 using the independently reviewed real Linux install tuple.
All other policy fields, including #494's test digest, remain unchanged. No Mac
fingerprint was generated. The manifest binds the complete policy and expected
hosted installed lock; hosted verification is still required.

The retained command reported **61 passing node:test cases**. It requested 12 paths,
but only **11 are tracked files at the tested source**. The requested path
`tests/pause-menu.test.mjs` does not exist at `6f5d5c16` and **was not executed**.
The earlier claim of 12-file coverage and a zero-exit legacy pause assertion file
was incorrect and is withdrawn. The original attempted command, exit status and
61 results remain unchanged; no tests were rerun to conceal the mistake.
`focused-file-inventory.json` records every requested path, source blob/hash for
existing files, the missing path and the reported counts. No coverage is claimed
for the nonexistent file. Existing pause coverage comes from the verified
`pause-save-notice.test.mjs` and `pause-menu-ownership.test.mjs` files.

Other passed checks: lint on the FPS source, three added tests and browser
scenario; 135 structural checks; 78 retained static evidence hashes. Raw command
output and original/published receipt hashes are included, with private source-root
prefixes redacted. Local runtime was Node 24.18.0 on macOS. The planner leaves 119
imported paths unclassified; manual scope follows the accepted frozen backlog and
is recorded in the manifest. No source or classification mapping was regenerated.
The same legacy-file claim in retained historical FPS notes is not evidence of an
existing or executed file in this candidate.

Historical evidence limits remain:
- #495 is a narrow repeated FPS-overlay reset fix; no new performance benchmark.
- #498 retains static startup/movie/input findings; no original executable or
  extractor was run, and static evidence does not establish runtime equivalence.
- #499's Home loss/restart tests use synthetic boundaries. Its separately retained
  browser evidence is historical; no combined-candidate browser run or settled
  post-Restart gameplay claim is made here.
- #501 connects restored profile/older checkpoint to the real selector launch
  handler using synthetic storage/hooks. It does not prove naturally earned
  progression, pointer/layout behavior or browser-process persistence.

Not run: full suite, production build, browser, native executable or performance
measurement for this combined candidate. #503 is not integrated. Its eventual main
merge must be reviewed before the driver refresh-before-ready pilot and one genuine
hosted Full gate. This evidence-only publication changes no tested implementation.
