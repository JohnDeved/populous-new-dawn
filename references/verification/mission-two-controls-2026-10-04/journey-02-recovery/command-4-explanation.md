# Retained input-order failure

Command 4 selected Hut placement mode and then called the ground helper with its default `focus: true`. That helper performed an ordinary minimap click before the ground click. The shipped `scene-camera-runtime.ts:478–492` focus path clears `world.mode`, so the final click ordered the five selected Braves to move instead of placing a Hut. They reached that point; no third Blue Hut existed. The 180-second completion assertion correctly failed at turn 4921.

This is a checker/input sequencing error, not a demonstrated application defect. The failed assertion, original command bytes, state and screenshot remain unchanged. Command 6 corrects the ordinary sequence: minimap first, choose Hut, ground click with `focus: false`, then immediately assert the new plan exists before waiting for construction. No world state is injected and no assertion/failure list is weakened. The outer run must remain failed even if later gameplay succeeds.
