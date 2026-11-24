# Function review coverage

[Function progress](../FUNCTION-PROGRESS.md) tracks implementation status. This companion tracks which of the unassessed functions received a bounded source review and were left on hold. A hold is not a missing function, evidence of complete native equivalence, or a measurement of new implementation work.

From the repository root, read coverage at a commit that contains the snapshot:

```sh
node scripts/review-coverage.mjs "$(git rev-parse HEAD^{commit})"
```

This optional report does not change the default progress page or its counts. It reports **checked and held** and **no conclusive hold record** within the existing unassessed count. Later ledger classifications supersede earlier holds. When source, inventory, or ancestry differs, it reports a historical reason rather than current counts. The reader uses committed objects, not local edits. Pass a full commit ID; branches, tags, and abbreviated IDs are not accepted.

[The snapshot](function-review-coverage.json) records the reviewed commit, its app tree, the export inventory digest, and one reason code per held address. Codes come from the reviews that identified the unresolved evidence. Each address appears in exactly one group. Only include conclusive hold decisions, not queued proposals or address references alone. The export inventory is the known, exported subset of the original executable; this snapshot does not estimate any extra functions outside it.
