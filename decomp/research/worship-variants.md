# Worship structure variants — mode-3 Obelisk slice

Issue #22 restores distinct original worship structures without taking ownership of Stone Head animation (#21). This slice covers only the native mode-3 presentation and admission discriminator.

## Source bank decision

Mission 15 requests object bank 0, which native resolver `0x40c670` maps to bank 2. Mission 22 requests bank 6. The earlier research note mentioned bank 4 as a source candidate. Using the existing `decode_original_model` decoder, object 8 is byte-equivalent at the decoded model/topology level in banks 2, 4, and 6: canonical decoded SHA-256 `acc56278fabe2b45cd9f2642824d06394b6758e462fe06e5b22b67c677f231fc`. The repository's established original-model baseline is bank 2, so `scripts/import-worship-models.py` imports only model 8 from hash-pinned bank-2 files. No claim depends on bank 4.

Bank-2 inputs: `objs0-2.dat e1af6bdf050608d7c1832700826bece72ca592abdff3ee9c2138c50ed8a8607d`, `facs0-2.dat 01a9a6d02efa0d35f7026cd97f8e01f72cbfb72e94217efe8256e8fe43597e9a`, `pnts0-2.dat 09ebbdc9496d2ebd3a932be96af3fd27e6701a41105a5154aec4abe39e50b911`.

## Native contract and live ownership

`004851e0` resolves class-6/model-6 head links, derives reward-presentation bits, finds colocated class-5/model-9 scenery and calls `004fbd20`. The retained canonical selector job `08b82309-9c3b-4519-89bc-fda212fba046` executes `004fbd20` and proves mode 3 selects object 8 regardless of reward-presentation bits. Separate retained mode-3 controller evidence proves only model-7 Shaman worshippers are admitted/count toward these heads.

The browser already owns both consumers: `app/live-worship.ts` asks `head.mode === 3` during command-27 admission, and `app/world-turn.ts` filters reward counting to model 7 when `shrine.mode === 3`. Before this repair, generic root shrine construction dropped `settings[0]`, leaving these consumers unreachable, and all non-Vault heads used model 45.

This implementation therefore restores the authored mode field and uses object 8 for mode 3 through `app/worship-appearance.ts`. It does not alter worship timing, rewards, RNG, world-turn logic, the generic renderer, or model-45 animation.

## Authored coverage and boundary

Mission 22 heads 139, 141, and 159 are all mode 3; Mission 15 head 142 is another authored mode-3 example. Mission 22 remains the focused acceptance mission because its mana/inert reward paths and 51-visit completion delay already have native and browser coverage. A Brave injected by the test is only a supporting admission fixture; it is not authored Mission 22 population.

Static object-8 restoration does not claim full original Obelisk animation timing. Other proved worship presentation objects (149/157 and matrix-only 147) remain later issue-22 variants.
