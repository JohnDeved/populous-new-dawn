# Historical supplied-focus Mission22 checkpoint

This is browser-port test data, not original-game execution or a fresh current
runtime run. The c44 campaign setup directly supplies spell charging masks, as
its maintained tests did; it then uses actual charging, casts, commands, travel,
worship and boarding. No actor position, counter, RNG, health or outcome is
injected. The complete recorded world is restored, never selected fields.

Reproduce from an existing clean source tree at
`c44dadfc91ba5bdca9b97552c84e42ebff63d62f`:

```
node scripts/capture-historical-mission22-balloon.mjs /path/to/c44/tree work/historical-m22
```

The producer checks source and dependency object hashes before/after capture.
The JSON metadata binds the producer, historical setup, compressed and decoded
bytes. The 40KB gzip contains Node V8-serialized checkpoint data and preserves
Map/typed-array/owner aliases. The loader verifies hashes and uses current public
in-session Save/Load. It does not establish rendered or persistent-browser storage.

Two strict historical continuations preserve the previous Tower105/Warrior11
and Preacher17-victory witnesses. Each has a separate fresh current-runtime
supplied-focus acquisition/combat case with its actual changed chronology.
The historical cases must never substitute for those current-route checks.
