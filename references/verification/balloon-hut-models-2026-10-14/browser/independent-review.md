# Independent supplied Balloon Hut renderer review

> Historical run artifacts referenced below are [retained at the pre-cleanup commit](https://github.com/JohnDeved/populous-new-dawn/tree/bc9cabf404240ad99b2aab8c26e9b0137cdd7702/references/verification/balloon-hut-models-2026-10-14/browser), not in the current checkout. Source probes, fixtures, and findings remain tracked where applicable.

Decision: ACCEPT supplied-layout geometry comparison only. Reviewer: review_browser_checkpoint.
Before source7da254e1cbbb8c8be64d266b35f3993f816c657c; after235c94c85a00cd4f1b0c5159a896c9ecd50b8cb6, independently confirmed runtime-equivalent to f7a2c22a7707e84107aa820a98d1a1449165230b. Both source receipts clean and identical before/after execution.

Inspected external script before execution and minimal CSS-repositioning delta. Public M1 startup/pause followed by explicitly supplied completed Balloon Hut, removal of prior supplied fixture, scene.focus camera and visible pause-badge relocation. These are declared fixture mutations, not ordinary acquisition. Normal RAF remains active; no direct ticks or forced rendering. Both paired runs use script27278180c11e467a73411843c4478267798f9c1b13e06f3dae896e055dbfbe5b and unchanged atlasfdb5c2af7ca43debb5d943036969df29949773b6b94c0b7ce99ffc5d946b27b0. Original badge-obscured before01 and original script retained.

Independently viewed all eight paired PNGs. Before all four requested owner variants87–90 use fallback83,606vertices. After uses actual87/88/89/90,552vertices each with visible ring/platform and owner appearance. All have visible projected primitives, no context loss; normal RAF frame counters advance with frozen simulation turn. Actual addBuilding positioning snaps supplied0,0 to(-0.9921875,-0.7421875), identical in both runs. Pause turns128/125 and camera angles1448/1450 differ, so this is comparable geometry evidence, not exact pixel correspondence.

Both receipts passed, errors empty; sandbox true, ignoreDefaultArgs true, only remote-debugging-pipe. Headless154/ANGLE SwiftShader1440x1000. Existing software-WebGL/readpixels/texture warnings remain in receipts. No claim of construction, acquisition, destruction, M16 victory, original-game pixel parity, hardware performance or full PR acceptance. Asset provenance/code tests/gates require the assigned code reviewer.

## Evidence SHA256
27278180c11e467a73411843c4478267798f9c1b13e06f3dae896e055dbfbe5b  supplied-geometry.mjs
5863fa6a85728b65a3a065f859320bbbdc62c92a7ba56e329e72a8f240c03894  supplied-geometry-original.mjs
5dfec3f6b58b256989ada350d829a82778eb8985fc3d96ebd34782acfa7bc4b6  before-02/receipt.json
019cef48960b741725fc040963b5f8021fd8d432dcd833c60ac8fd97b127551a  before-02/supplied-geometry.json
6af3b9bf7df2a957fbe2a311467028a9ba615ac8161cf9f038c364c5ab8180dd  before-02/balloon-hut-blue.png
55f4e88d8f865e86b674fa1c4c45d5bd6cc1bc0c72fcaca4affdbfd76809ec59  before-02/balloon-hut-red.png
31030473a0913851fdc6d0ec6c887b21ba93d2b662e9fc15d75449a92471ece7  before-02/balloon-hut-yellow.png
13457b38ed704f8781832d662df2eec50ba42230379d684e23469027879e4d6f  before-02/balloon-hut-green.png
6bf712347d3dc0af10568339a2f46397853b147e6e28b5fb5eb82f84a88567b7  after-01/receipt.json
0e6916e9360c13b0eab9ca8a1d1c827b80948424a0ea2656745fce0cd5c0de74  after-01/supplied-geometry.json
3bd996c7c373607d3a14d84352b0302cf0f5b58c5d2ce334cabdf00f25cd9ff9  after-01/balloon-hut-blue.png
8744213cf19c772008ae3150d501d4fd55d3ce07ca22c7938bf1637f498bc803  after-01/balloon-hut-red.png
06a9ec07db1a9916baded2eff83517f8d64eb3b7ce1d3a928d8340255c63639f  after-01/balloon-hut-yellow.png
dea4160787fe47d41a31d7536e7eb303191b6052b75e5ab97bec69e9abe0d799  after-01/balloon-hut-green.png
