# Reviewed backlog: combined focused validation

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

Passed: 61 focused test cases across 12 selected files; lint on the FPS source,
three added tests and browser scenario; 135 structural checks; 78 retained static
evidence hashes. Raw command output and original/published receipt hashes are
included, with private source-root prefixes redacted. Local runtime was Node
24.18.0 on macOS. A zero-exit legacy pause assertion file is included alongside the
reported node:test cases. The planner leaves 119 imported paths unclassified;
manual scope follows the explicitly accepted frozen backlog and is recorded in
the manifest. No source or classification mapping was regenerated.

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
