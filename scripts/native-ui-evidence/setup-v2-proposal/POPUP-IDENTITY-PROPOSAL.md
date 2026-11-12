# Inactive popup identity reconstruction

New proposal based on e62c78debed3cd5109b8f0782da05ff1fba5bb18. Prior local artifacts and test receipts were lost in a workspace reset. Prior 18/18 primitive results do not apply to these new bytes.

popup-identity.mjs is inactive, untested source groundwork. It retains a private browser reference bundle from before enumeration, verifies original World/Scene/detail/body ownership, observes requested open/layout visibility, and supplies an at-most-250-ms cleanup grace. Unsettled acquisition, observation or disposal sets trace.teardownRequired; that is a demand for caller-owned bounded context/process teardown, not evidence of cancellation. Late acquired handles are disposed rather than reused. No caller imports it yet on this incremental commit.

A prospective helper adaptation and new tests are still in progress. Independent review, test admission, real browser behavior, outer teardown and aggregate gates remain open. No production/workflow/ordinaryMission changes or dispatch acceptance. Locator clicks can race replacement: eventual rejection is not a guarantee that no uncertain input was delivered; never replay uncertain input.

## Prospective helper adaptation

The inactive browser-world-input helper now imports the lease in this isolated branch. It captures before initial enumeration, observes through the same private bundle after click/wait and focus, and closes the lease outside the input deadline with a separate at-most-250-ms cleanup grace. The operation can therefore take timeout plus cleanup grace. Eight new supplied-Playwright helper tests are unexecuted. This is reviewable source, not activation or outer context/process cleanup implementation. Existing production imports and workflow guard remain unchanged. The previously described no-caller-import condition applied only to the initial incremental commit.

Primitive evidence at evidence/popup-identity-primitives-01.json records16/16 for exactbf54d1fa; it does not cover this helper adaptation. Prior pre-reset18/18 remains historical only.
