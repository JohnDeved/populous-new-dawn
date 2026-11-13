# Inactive fixture-only policy observer

Independent source review corrected the live symlink fixture before execution. The bounded11-test run uses newly-created private temporary fixture directories and caller-owned directory descriptors only. It exercises actual local descriptor reads/hashes, symlink/hardlink/directory/FIFO rejection and bounded read/error controls. Some change/error controls are supplied mocks; no adversarial race-free security claim follows.

No actual repository, installed profile, shared asset path or held resource was accessed. Root/ancestor pathname non-aliasing is not established and deliberately not fabricated in output. The caller must guarantee fresh-directory ownership and exclusive writer control. This is not a complete policy profile, installation admission, workflow integration, browser or production acceptance.

Exact source/test hashes and raw output digests are in receipt.json. Python unittest reports normal success on stderr, which is therefore not empty.
