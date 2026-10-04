# Retained command 14 failure

The rendered ground helper rejected Blast before any spell input was sent. A later detached-clone range check found the target distance approximately 10.77 scene units against native Blast range 10.3125. The Shaman had quantized to (101,123), outside range of (91,119). No charge was spent. This is a legitimate rejected target and a checker/strategy assumption, not a verified application defect. Command 16 moved the Shaman normally to (97,123), then a normal Blast succeeded and reduced the Green Shaman to 55 HP. Both attempts remain recorded.
