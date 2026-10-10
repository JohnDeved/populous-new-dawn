# Ordinary shared Temple rendering

This QA-only addition extends the accepted world-theme helper at f6d293e7. It
uses the existing local-render guardian, fresh owned profiles and exact product
source. No application, asset, checkpoint, native archive or executable changes.

## Two finite ordinary routes

- `POPULOUS_TEMPLE_ROUTE=authored`: public All missions selects M10 then M17.
  Both have authored completed Temples. M10 covers supported p/2 Blue and Green;
  M17 covers supported c/2 Blue, Red, Yellow and Green. The existing reviewed
  minimap input inverse only computes a hit; a real pointer click moves the view.
  Distant targets use up to six shortest-wrap minimap waypoints, each no more than
  32 world units from the previous point; every view retains the existing strict
  input ownership and eight-unit endpoint tolerance. The final waypoint is the
  exact authored Temple position. A target requires two different naturally
  rendered shared tiles before moving on.
- `POPULOUS_TEMPLE_ROUTE=construction`: the existing ordinary M3 route earns
  Temple knowledge from its real Vault, returns home, selects five Braves,
  places and completes a Temple, and commits a genuine Save. Its existing
  observation-only hooks install/close this witness; there is no altered route,
  synthetic object, new time owner or checkpoint seeding. The route then uses
  public Load, Restart and Load again, checking saved level/turn/time plus typed actor, terrain and stock digests at
  Load, and the complete persisted checkpoint digest after Restart/final Load.
  Synchronous trusted-click store notifications establish Load phase reset and
  normal same-resource Restart retention. Later natural frames establish loaded
  completed-Temple material consumption; they are not counter-zero samples.

The bounded passive observer wraps the real renderer and the selected meshes'
`onAfterRender` callbacks. Original calls run once with unchanged receiver/arguments
and exceptions. After a submitted Temple's natural render returns, it copies
actual world-canvas pixels and actual position/UV/texture-mode arrays. Late digest
reads use those copies. Only in-view, submitted, settled, unpaused speed-one
samples count. First stage samples and two completed tiles per building are
retained, at most32 frame copies; exceeding the bound fails. Close restores only
owned callbacks and rejects replacement or stale ownership.

Actual shared snapshot identity must equal the store snapshot at the draw. The
strict host assertion checks selected full atlas response bytes; object95–98
geometry/mode hashes against unchanged imported models; construction cap modes
and UVs; alpha threshold and sidedness; shader variant; and completed mode32
uniform offset/epoch against that exact shared snapshot. These are composed
browser implementation checks, not a new original-data or raster oracle.

The authored route has a600000ms harness/660s outer ceiling. The M3 construction
route has the existing1500000ms harness ceiling plus its bounded lifecycle tail,
for a total1620000ms inner/1680s outer ceiling. Each two-tile visual wait has30s;
a missing target/frame is a failure, never success or synthetic replacement.
Fresh private output/profile/cache/dependency paths are mandatory for each run.

## Coverage and limits

The M3 route must retain at least one actual unfinished Temple construction-cap
frame, two completed shared tiles, synchronous Load continuity of level/turn/time
and typed actor/terrain/stock digests, complete persisted-Save integrity, Restart
resource retention and a post-Restart Load rendering. M10/M17 require every named
tribe's authored completed Temple to submit two live tiles. Different camera
samples may show different tribes, but every sample shares its actual per-Scene
resource epoch and exact current store snapshot; no simultaneous screenshot is
invented.

This does not re-run acquisition-overlay whole/flight art, unchanged reward
admission or nominal-clock logic; their focused product tests remain separate.
It does not establish original pixel equality, original cadence, campaign victory,
or hardware performance. Software rendering identity and source/runtime/helper
hashes are retained by the harness and enclosing command receipts. The world-theme
scenario separately supplies comparable baseline/candidate M1/M2/M3 images.

The Load boundary digest is intentionally scoped: the imported checkpoint migrator
may legitimately normalize other fields. Full graph identity is asserted for the
unchanged committed Save, not claimed for the migrated live World. The loaded
Temple itself must separately submit matching staged geometry and shared material.
