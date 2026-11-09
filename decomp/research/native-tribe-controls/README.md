# Native tribe controls: input and alternate-frame authority

Read-only research at source commit `65a9e5dbaafb03ace96e6c26cf1e4893507c3d28`,2026-10-22. No game/controller implementation or execution. This supplements, and does not replace, `../ordinary-hud-controls/`.

## Provenance

`manifest.json` distinguishes the original EXE identity retained by prior research from newly selected byte-range hashes. The original was opened as data using `O_RDONLY | O_NOATIME`. No download, full-file hash, execution or re-extraction occurred. Two bounded static scans and selected ranges together read less than3,592,320 bytes, within4MiB. The full text scan is not included here. `*.retained.c` are exact copies of the named source commit's Ghidra exports, not reconstructed original source. `FINDINGS.txt` records the first stage; the two rendering gaps recorded there are resolved below.

## Mandatory input distinction

Default ordinary **left-button release** on a tribe icon dispatches Spy command16 through action0x7e. **Ctrl-left release** dispatches action0x7f and the native command-planning route. It is not equivalent to append=true on an existing execution queue. Slot0 clears prior queues, later planning slots add commands, and finalization occurs separately. Keep this distinction in future implementation and tests. Alt reverses configured selection retention; Shift contributes command flags. Saved user bindings can override defaults. See `FINDINGS.txt`, binding-range evidence, and retained004aa8b0/00444f60 pseudocode.

## loadFlags bit0x10: current Spy-disguise context command

00437010 finishes context selection by comparing `00895ea0[currentSlot00895e9d]` to0x10. At00437729 it sets loadFlags0089c665 bit0x10 if equal, otherwise clears it. Thus this is not generic hover, selected tribe, camera focus, or alliance state. It means the resolved current context command is Spy disguise16.00437750 derives that command from hovered tribe context0x2000 and descriptor16 eligibility mask0x20 (Spy model5).0047a550 also clears the bit when leaving relevant command modes10/12.

Ordinary single-player renderer0049d2a0 uses alternate art for a nonzero native interaction state ONLY while this flag is set, OR for casualty flash below. Merely hovering a tribe without eligible selected Spies does not brighten it.

## tribe+c24: credited casualty flash, victim tribe

Direct writer004a3960 receives `(creditedAttackerTribe, dyingPerson)`. It exits if the victim's tribe at person+0x2f is-1. It increments the credited attacker's per-victim-tribe kill counter at tribe+0xa1f and sets the **victim** tribe's byte+c24 to0x28(40), at004a39b4. Whether the attacker equals the player only gates an additional local counter; it does not gate the flash. Any non-neutral credited attacker can trigger this, including AI-versus-AI.

The only direct call to004a3960 found in the bounded .text scan is004d5fb6, in death-state handler004d5cf0. This caller invokes it only when dyingPerson+0xb0 is not-1.004d8e40 assigns this field from the source person's tribe, corroborating its credited-attacker meaning. Neutral/uncredited deaths do not trigger this writer; victim/attacker equality is not filtered here. Repeated eligible deaths reset40, not add40. The rendering counter is not an under-attack detector and must not start on arbitrary damage, selection, or camera focus.

004ec6f0 starts each unpaused simulation turn (landFlags mask 0x02 clear) by decrementing nonzero+c24 once for each configured tribe. Existing nonzero counters are paused with simulation. New same-turn death resets40 after that decrement phase. Ordinary renderer chooses alternate art while+c24 is nonzero AND display counter00897981 mask 0x04 is set; command16 interaction takes precedence and can hold alternate continuously. This display-frame phase is separate from simulation-turn expiry.

## Multiplayer renderer is different

0049d3e0 keeps the shared active/defeat visibility gate, but uses relation art when player-to-target relation bit is set; otherwise it chooses ordinary/alternate based on native interaction state without the command16 flag gate. It does not inspect+c24. Do not apply single-player casualty flashing or Spy-only interaction styling indiscriminately to multiplayer.

## Implementation attachment points and checks

Current `app/world-turn.ts` credited-death loop around1771 already increments `w.killCredits[attacker][victim]` with comparable attacker/victim gating: this is the natural integration point for a victim-tribe40-turn flash, not a new damage listener. Store/init/snapshot compatibility must be audited for the new field; do not infer it from total kill counts. Decrement at the start of unpaused native simulation turns, not per React render. Derive ordinary interaction highlight from eligible current Spy-disguise context, not merely nonempty selection.

Focused future tests: no-Spy hover remains normal; eligible Spy hover selects alternate; casualties reset40 on victim only, including AI-versus-AI; uncredited/neutral death does not start flash; second casualty resets rather than extends; pause freezes remaining simulation turns;40→0 returns normal unless command16 interaction remains; display mask 0x04 alternates only while countdown>0; defeat blink/hide takes precedence; multiplayer relation art does not use casualty countdown; Ctrl-left remains planning, never silent immediate/append disguise.

Unresolved: browser/render acceptance and modern compatibility work were not run or implemented. Native absolute wall-clock display-frame cadence was not measured; preserve the known display-counter phase distinction rather than claiming a measured animation duration.

Defeat drawing suppression uses display-counter mask `0x02`; casualty alternate-art selection uses mask `0x04`. These are hexadecimal masks, not zero-based bit indices 2 and 4.

Publication formatting removes trailing spaces and local directory prefixes from disassembly labels; selected raw byte files and exact retained C exports are unchanged. The local executor path is omitted from the public manifest.
