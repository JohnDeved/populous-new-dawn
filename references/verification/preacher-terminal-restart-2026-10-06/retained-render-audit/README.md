# Retained ordinary restart render audit

The existing evidence records the ordinary cutoff and restart, but neither run
renders the one-visit phase4-to-2 interval where the native stop changes family.
No new browser run was used for this audit.

## Current application b2, accepted candidate 0ef attempt02

In original-phases.jsonl, line2291 is a genuine sample after the main renderer
returned at turn4173: substate4, timer840, source168/draw14, f2=4, visible mesh2968.
The relevant restart happens at turn4174. Lines2293–2294 retain its controller and
updated model state, source168/draw14 and f2=4→5, but there is no render at4174.
The mesh2968 values are unchanged from4173 and are stale for the later model state.
The next main render is line2296 at4175, already source160/draw19, f1=0/f2=0,
mesh2944. This later entry render does not fill the missing intermediate interval.

The same actor3160/world/native owner and sole order26/model17 remain stable with
zero listeners and no active gesture at cutoff. The current cutoff counter77 and
frame phase differ from the fixed supplied baseline case; they are not relabelled
as a new native execution case. Earlier ordinary screenshot/Save pauses occurred
in this same logical sermon, without actor/order replacement.

The only gesture image/pixel captures are at3412 (source176) and3505 (source184),
plus the earlier acquisition screenshot. No restart image or pixel buffer exists.
The loaded epoch spans3493–3721 and never reaches840; its maximum target timer is270.

## Historical application169b, accepted baseline9a

Baseline phases.jsonl line2299 renders turn4245/source168/draw14/f2=5, mesh2969.
Turns4246 (cutoff substate4) and4247 (phase4-to-2 restart) have only model samples,
lines2301–2304. The next genuine main-render sample is line2306 at4248:
source160/draw19/f1=1/f2=2, mesh2946/body piece3228. That is the historical entry
family, not the intermediate restart consumer or the current-b2 reset endpoint.
The three baseline PNGs cover acquisition, early entry and a later source168 pose;
none captures4246–4248.

## What the observer proves

The retained and hash-bound observer calls the original main renderer before
reading mesh state. It records the first render of each distinct turn, so deduping
same-turn renders cannot hide4174 or4247 between the adjacent recorded turns.
These intervals were skipped by the observed main-render stream. Their model-only
samples cannot establish visible source48-versus168 impact. Genuine adjacent
post-render mesh samples are retained, but there is no boundary image/material
capture to upgrade that claim.

The native component distinction remains independently accepted. Existing records
also establish current-b2 ordinary logical reachability. A rendered intermediate
family remains unobserved; any separate observation decision should target only
that missing witness, preserve the normal clock and report another skipped
interval honestly. This audit grants no new execution or gameplay repair.

candidate-audit.json and baseline-audit.json bind the original full streams,
observer source, image inventory and selected complete records. Candidate streams
were checked byte-for-byte against the accepted published raw archive.
