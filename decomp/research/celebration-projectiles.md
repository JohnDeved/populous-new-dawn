# Firewarrior celebration point projectiles

Static research only: original EXE was never executed or emulated. See the
adjacent celebration-projectile-evidence packet for pinned source/assembly hashes.

The genuine M17 CPU actual-clock campaign won at turn6784, then reached
celebration state41/substate2 and threw at6792 because the live projectile hook
was unimplemented. The original checkpoint remains immutable; its uncompressed
SHA256 is446756fc1241f1a0a52f2a87f096788321e6022b15ec48d4c4e181c191dc0538.

004e0af0 supplies the current person's heading-forward1280, height+3072 point to
0051fbf0 with null actor target. 0051fbf0 reveals invisibility, allocates two
class8/model6 shots, and updates source cooldown byte+b2. 004bbcf0 uses heading
side offsets +/-512, length96; clamps source height to terrain and adds actual
person supportHeight (+0x1c) plus16. The explicit destination overrides actor
height. The second side selects impact mode2. Both shots play cue161.

004bbf30 moves at512, uses15/16 of remaining distance on the final visit, emits
class7/model3 trails, clamps terrain, and retires at arrival. Mode2 plays cue178;
only mode1 dispatches target damage. There is no16-visit timeout in this path.
The live point marker preserves that distinction across checkpoint persistence.
Ordinary actor-target projectile behavior is unchanged.

Scope: the live consumer reuses browser effect allocation, sprite presentation,
existing nativeStep3D and nativeDistance (integer Euclidean approximation), and
existing trail controller. Native allocation failure/order, lighting, LOS,
nearby friendly reaction flags, tower/vehicle-specific launch side effects and
full original class8 rendering parity remain unqualified. The actual ground
celebrants have supportHeight0, no tower or vehicle. This is a source-backed
post-victory lifecycle repair, not full projectile parity or rendered proof.
