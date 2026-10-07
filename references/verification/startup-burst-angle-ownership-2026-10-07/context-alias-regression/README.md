# Same bounded context assertion after named portable-check alias

Source8592c0049b720f568630db42d1b9b602a000b0b4 changes only package.json and
engineering/checks.json. The npm alias executes exactly the same three Node test
files in the same order, and package.json is declared as an input. Independent
source review accepted the delta. The unchanged Shaman appearance context test
passed1/1 in1.91s onCPU4, session2912/terminal9454d5, with a30s TERM+5s bound.
It still requires the24,000-byte budget, all14 check IDs/metadata, and all6 mapped
evidence references including Phase1 ground. Full check/build remains pending.
The prior failed full check and dependency-marker drift remain immutable.
