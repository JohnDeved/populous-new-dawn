004d3ae1 8a461e               mov al, byte ptr [esi + 0x1e]
004d3ae4 84c0                 test al, al
004d3ae6 7405                 je 0x4d3aed
004d3ae8 fec8                 dec al
004d3aea 88461e               mov byte ptr [esi + 0x1e], al
004d3aed 807e2a00             cmp byte ptr [esi + 0x2a], 0
004d3af1 0f84f0010000         je 0x4d3ce7
004d3af7 84db                 test bl, bl
004d3af9 7421                 je 0x4d3b1c
004d3afb f6460e10             test byte ptr [esi + 0xe], 0x10
004d3aff 751b                 jne 0x4d3b1c
004d3b01 8a462c               mov al, byte ptr [esi + 0x2c]
004d3b04 56                   push esi
004d3b05 88467d               mov byte ptr [esi + 0x7d], al
004d3b08 e8e39b0100           call 0x4ed6f0
004d3b0d 83c404               add esp, 4
004d3b10 885e2c               mov byte ptr [esi + 0x2c], bl
004d3b13 56                   push esi
004d3b14 e8279b0100           call 0x4ed640
004d3b19 83c404               add esp, 4
