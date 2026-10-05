# Software draw-cost sample is insufficient

**FAILED sampling requirement. No performance pass or speedup is claimed.**
Application `cfa86a32f03d021cd1ad725eed9f458ab239d56b`, checker
`463da5b11c11af2a0d14e3a74c118bc17e9cb622`. This exclusive diagnostic run uses real
M1 Bridge worship at 1440 × 1000 / DPR 1, sandboxed Chrome Headless Shell 154 /
SwiftShader, four CPU affinity slots on a shared AMD EPYC 9V74 cloud host.

After eight warmup calls, 32 idle samples were retained. Only six active samples
remained after the separate eight active warmups, below the unchanged requirement
of sixteen. Every retained original draw called geometry measurement exactly once
per distinct reference. Five retained active calls included the body. The real
ordinary gift paid once and fully retired by turn 406, without diagnostics.

All raw durations, command categories and reference counts remain in the report,
including zeros. The six active durations range from 0 to approximately 0.2 ms;
idle durations range from 0 to approximately 0.1 ms. Browser timer quantization
and the minimal measurement counter are included. Statistics were not accepted
because the required sample count failed. These data do not measure complete
frame time, hardware FPS, a frame budget or a before/after performance change.

The measured interval brackets only the original overlay draw method. Full state
snapshots, Canvas interception, PNG reads and summary calculations are outside it.
No competing owned browser/package/native measurement ran during this row; the
shared host itself is not represented as isolated benchmark hardware. The original
process exited 1 normally with verified cleanup and observer restoration.
