# Native source evidence

The reference PNG is a static source-art reconstruction, not a native-game capture.
The four result exports and `mission-title.asm` are the bounded raw proof used for
this presentation. Metadata and independent review files record input hashes,
geometry, labels, decoding and explicit limits.

`source-packet-sha256.txt` is the original research handoff manifest. It names the
complete external source packet, including research utilities not retained here;
it is provenance, not a runnable checksum list for this directory.
`retained-files.sha256` covers exactly the retained files and is runnable here:

```sh
cd evidence/result-ui-20261015/native
sha256sum -c retained-files.sha256
```

The production regeneration tool is `scripts/import-result-ui.py`; its generated
outputs and original input hashes are retained in `app/original-result-ui.json`.
Independent `generated-assets-review.json` verifies all panel pixels and all224
font glyphs using a separate decoder. No original executable was run.
