# PR254 clean delivery source review

Source `8f50dda281ec6338bdb84e21473879f29a0282f9`, base
`e3a7a06a4250457502288d5b4c4e4ad8f3b40b53`. The nine-file maintained change is
separate from this research inventory. [Correspondence](correspondence.json) binds
all changed files and exact35 full original records,48 authored candidate positions
and32 enabled positions. [Loader diff](loader-only.patch) changes only two fixture
URLs and the checksum of the compact native file. Every regression assertion and
observation remains byte-identical after those substitutions.

[Observer diff](observer-only.patch) adds two passive values at the existing actual
render boundary: existing terrainPointHeight at particle animation XY and existing
effect.height. Sampling, image readbacks, identity/ownership and public controls
are unchanged. Existing same-call observer coverage now checks these reads and
world non-mutation. Values describe post-motion presented particles, not unseen
births. A later pair must compare shared actual world turns/IDs/ages, preserve
position/ground and rendered images, and disclose sampling and software-renderer
limits. A constant screen-pixel shift is not assumed.

No clean-source test, package/browser launch or new native execution occurred.
The original accepted caller green remains linked proof; its loader adaptation
will be rerun with the final integrated gates. PR247's accepted successor main
will be normally adopted before final gate/ordinary packet freeze. Browser and
package lanes remain queued under coordinator control. The accepted angle driver
and host are being reused; this is not a new game or native harness.

Independent [clean-source ACCEPT](source-review.json) verifies the compact fixture,
loader and passive observer correspondence. Final integrated and rendered gates
remain pending; this verdict does not grant execution.
