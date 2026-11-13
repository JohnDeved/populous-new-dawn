# Injected media failure cleanup checkpoint

Derived from reviewed cleanup checkpoint c43e27c. First injected 404 scenario previously removed its route only after successful scenario completion. Candidate always attempts removal of exactly its registered handler, retaining original and cleanup errors including falsey values.

Syntax check passed. Exact extracted block passed 36 supplied-callback cases (five failure sites, success, falsey errors and cleanup failure). No Playwright/browser execution, no full checks, no active runner/PR changes. Previous held-key fix remains intact. Unbounded route arrival and hanging cleanup calls are unchanged. This is preservation, not acceptance of #952.
