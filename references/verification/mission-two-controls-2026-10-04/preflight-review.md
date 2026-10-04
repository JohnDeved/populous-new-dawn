# Driver readiness review

Final disposition: **ACCEPT for safe isolated run readiness**, not full gameplay acceptance.

Application source: `ab6e857553fd2a534bbe34b4ba600df8a40872ff` (clean).
Final actual driver SHA-256: `cfae31661d7c4ec8335e8e6124fae2ee80e4080acbba805e136342be0b349a55`.
Source/input-bound `node --check` receipt: [driver-syntax-cfae316.json](driver-syntax-cfae316.json).

An independent read-only review checked actual startup, selection, pause/order gates, flyby controls, Save/IndexedDB/fresh Load, post-load continuity and terminal handling against shipped callers. It rejected the intermediate driver because `placementError` and `spellTargetError` can synchronize live terrain through their internal callees. The final driver passes a single detached `structuredClone(s.world)` to both validators; subsequent mouse input remains the only owner of live orders.

The review also corrected a non-blocking observation error: `getSnapshot()` returns a revision number, so campaign completion now reads `getCompletedMissions()`.

Reviewed boundaries:

- Startup waits for the existing actual Shaman-selectability observer.
- Nonunit/ground orders require unpaused play. Enemy-unit/raw clicks still require explicit ordinary Resume and acceptance observation in each command batch; shipped handlers reject paused orders.
- Save uses the actual Game settings dialog and explicitly awaited committed exact turn, statistics, stocks and follower identities before page reload.
- Load Game deliberately resumes. The driver re-pauses and checks bounded natural progression, retained actor identities and acquired state. Global construction counts may advance through normal enemy building completion.
- Failed command records are retained; explicit finish refuses earlier failures. The harness owns timeout/source-drift failure and cleanup. A passing process or `completed: true` alone does not establish victory.
- The outer receipt must bind the ignored actual driver and known inputs. Every later command and action log must be retained unchanged. A final claim requires actual gameplay/checkpoint/outcome evidence and zero browser errors.

No browser or application modification was performed during this preflight review. The original interrupted run's terminal/cleanup status remains unknown.
