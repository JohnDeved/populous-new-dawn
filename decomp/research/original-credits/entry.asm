004c5af0 803d33ce890000           cmp      byte ptr [0x89ce33], 0
004c5af7 741c                     je       0x4c5b15
004c5af9 6a00                     push     0
004c5afb a110df5900               mov      eax, dword ptr [0x59df10]
004c5b00 0fbe0d33ce8900           movsx    ecx, byte ptr [0x89ce33]
004c5b07 6a00                     push     0
004c5b09 8d14c8                   lea      edx, [eax + ecx*8]
004c5b0c 52                       push     edx
004c5b0d e8ee6e0300               call     0x4fca00
004c5b12 83c40c                   add      esp, 0xc
004c5b15 6a0c                     push     0xc
004c5b17 e844cff7ff               call     0x442a60
004c5b1c 83c404                   add      esp, 4
004c5b1f c3                       ret
