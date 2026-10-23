004a96f0 83ec0c                   sub      esp, 0xc
004a96f3 53                       push     ebx
004a96f4 56                       push     esi
004a96f5 57                       push     edi
004a96f6 33f6                     xor      esi, esi
004a96f8 55                       push     ebp
004a96f9 8b3dece79800             mov      edi, dword ptr [0x98e7ec]
004a96ff 33ed                     xor      ebp, ebp
004a9701 8b1df4e79800             mov      ebx, dword ptr [0x98e7f4]
004a9707 0fbf05d1c68900           movsx    eax, word ptr [0x89c6d1]
004a970e 3bc7                     cmp      eax, edi
004a9710 0f8ea9020000             jle      0x4a99bf
004a9716 85db                     test     ebx, ebx
004a9718 0f84a1020000             je       0x4a99bf
004a971e 33c0                     xor      eax, eax
004a9720 668b03                   mov      ax, word ptr [ebx]
004a9723 89442410                 mov      dword ptr [esp + 0x10], eax
004a9727 3bc5                     cmp      eax, ebp
004a9729 0f8427010000             je       0x4a9856
004a972f 83c71e                   add      edi, 0x1e
004a9732 e8d99afeff               call     0x493210
004a9737 85c0                     test     eax, eax
004a9739 7419                     je       0x4a9754
004a973b e8d09afeff               call     0x493210
004a9740 85c0                     test     eax, eax
004a9742 a1dccb8700               mov      eax, dword ptr [0x87cbdc]
004a9747 50                       push     eax
004a9748 7423                     je       0x4a976d
004a974a e8f183faff               call     0x451b40
004a974f 83c404                   add      esp, 4
004a9752 eb26                     jmp      0x4a977a
004a9754 e8b79afeff               call     0x493210
004a9759 85c0                     test     eax, eax
004a975b a1f4cb8700               mov      eax, dword ptr [0x87cbf4]
004a9760 50                       push     eax
004a9761 740a                     je       0x4a976d
004a9763 e8d883faff               call     0x451b40
004a9768 83c404                   add      esp, 4
004a976b eb0d                     jmp      0x4a977a
004a976d 6888165900               push     0x591688
004a9772 e8b9d50600               call     0x516d30
004a9777 83c408                   add      esp, 8
004a977a 8b442410                 mov      eax, dword ptr [esp + 0x10]
004a977e 8b0c85a82b9700           mov      ecx, dword ptr [eax*4 + 0x972ba8]
004a9785 890df8e89800             mov      dword ptr [0x98e8f8], ecx
004a978b 890dfce89800             mov      dword ptr [0x98e8fc], ecx
004a9791 3bcd                     cmp      ecx, ebp
004a9793 0f84bd000000             je       0x4a9856
004a9799 6880000000               push     0x80
004a979e 8b0df8e89800             mov      ecx, dword ptr [0x98e8f8]
004a97a4 68f8e79800               push     0x98e7f8
004a97a9 8b15fce89800             mov      edx, dword ptr [0x98e8fc]
004a97af 0fbf05cfc68900           movsx    eax, word ptr [0x89c6cf]
004a97b6 50                       push     eax
004a97b7 51                       push     ecx
004a97b8 52                       push     edx
004a97b9 e85254fbff               call     0x45ec10
004a97be 83c414                   add      esp, 0x14
004a97c1 a3f8e89800               mov      dword ptr [0x98e8f8], eax
004a97c6 83ffec                   cmp      edi, -0x14
004a97c9 7c63                     jl       0x4a982e
004a97cb 0fbf35cfc68900           movsx    esi, word ptr [0x89c6cf]
004a97d2 68f8e79800               push     0x98e7f8
004a97d7 e8540effff               call     0x49a630
004a97dc 83c404                   add      esp, 4
004a97df 2bf0                     sub      esi, eax
004a97e1 c1fe01                   sar      esi, 1
004a97e4 e8279afeff               call     0x493210
004a97e9 85c0                     test     eax, eax
004a97eb 7417                     je       0x4a9804
004a97ed a09c489800               mov      al, byte ptr [0x98489c]
004a97f2 50                       push     eax
004a97f3 68f8e79800               push     0x98e7f8
004a97f8 57                       push     edi
004a97f9 56                       push     esi
004a97fa e8a183faff               call     0x451ba0
004a97ff 83c410                   add      esp, 0x10
004a9802 eb25                     jmp      0x4a9829
004a9804 83ec08                   sub      esp, 8
004a9807 a09c489800               mov      al, byte ptr [0x98489c]
004a980c 8964241c                 mov      dword ptr [esp + 0x1c], esp
004a9810 50                       push     eax
004a9811 8b4c2420                 mov      ecx, dword ptr [esp + 0x20]
004a9815 e856c7f6ff               call     0x415f70
004a981a 68f8e79800               push     0x98e7f8
004a981f 57                       push     edi
004a9820 56                       push     esi
004a9821 e83ae10700               call     0x527960
004a9826 83c414                   add      esp, 0x14
004a9829 be01000000               mov      esi, 1
004a982e e8dd99feff               call     0x493210
004a9833 6a41                     push     0x41
004a9835 85c0                     test     eax, eax
004a9837 7407                     je       0x4a9840
004a9839 e8b28ffaff               call     0x4527f0
004a983e eb05                     jmp      0x4a9845
004a9840 e8fbe20700               call     0x527b40
004a9845 83c404                   add      esp, 4
004a9848 03f8                     add      edi, eax
004a984a 392df8e89800             cmp      dword ptr [0x98e8f8], ebp
004a9850 0f8543ffffff             jne      0x4a9799
004a9856 396b02                   cmp      dword ptr [ebx + 2], ebp
004a9859 0f842f010000             je       0x4a998e
004a985f e8ac99feff               call     0x493210
004a9864 85c0                     test     eax, eax
004a9866 742e                     je       0x4a9896
004a9868 833d6abc89000b           cmp      dword ptr [0x89bc6a], 0xb
004a986f 740c                     je       0x4a987d
004a9871 8b4302                   mov      eax, dword ptr [ebx + 2]
004a9874 50                       push     eax
004a9875 e8169ffaff               call     0x453790
004a987a 83c404                   add      esp, 4
004a987d e88e99feff               call     0x493210
004a9882 85c0                     test     eax, eax
004a9884 a1e0cb8700               mov      eax, dword ptr [0x87cbe0]
004a9889 50                       push     eax
004a988a 7423                     je       0x4a98af
004a988c e8af82faff               call     0x451b40
004a9891 83c404                   add      esp, 4
004a9894 eb26                     jmp      0x4a98bc
004a9896 e87599feff               call     0x493210
004a989b 85c0                     test     eax, eax
004a989d a1dccb8700               mov      eax, dword ptr [0x87cbdc]
004a98a2 50                       push     eax
004a98a3 740a                     je       0x4a98af
004a98a5 e89682faff               call     0x451b40
004a98aa 83c404                   add      esp, 4
004a98ad eb0d                     jmp      0x4a98bc
004a98af 6888165900               push     0x591688
004a98b4 e877d40600               call     0x516d30
004a98b9 83c408                   add      esp, 8
004a98bc 8b4302                   mov      eax, dword ptr [ebx + 2]
004a98bf a3f8e89800               mov      dword ptr [0x98e8f8], eax
004a98c4 a3fce89800               mov      dword ptr [0x98e8fc], eax
004a98c9 3bc5                     cmp      eax, ebp
004a98cb 0f84bd000000             je       0x4a998e
004a98d1 6880000000               push     0x80
004a98d6 8b0df8e89800             mov      ecx, dword ptr [0x98e8f8]
004a98dc 68f8e79800               push     0x98e7f8
004a98e1 8b15fce89800             mov      edx, dword ptr [0x98e8fc]
004a98e7 0fbf05cfc68900           movsx    eax, word ptr [0x89c6cf]
004a98ee 50                       push     eax
004a98ef 51                       push     ecx
004a98f0 52                       push     edx
004a98f1 e81a53fbff               call     0x45ec10
004a98f6 83c414                   add      esp, 0x14
004a98f9 a3f8e89800               mov      dword ptr [0x98e8f8], eax
004a98fe 83ffec                   cmp      edi, -0x14
004a9901 7c63                     jl       0x4a9966
004a9903 0fbf35cfc68900           movsx    esi, word ptr [0x89c6cf]
004a990a 68f8e79800               push     0x98e7f8
004a990f e81c0dffff               call     0x49a630
004a9914 83c404                   add      esp, 4
004a9917 2bf0                     sub      esi, eax
004a9919 c1fe01                   sar      esi, 1
004a991c e8ef98feff               call     0x493210
004a9921 85c0                     test     eax, eax
004a9923 7417                     je       0x4a993c
004a9925 a09c489800               mov      al, byte ptr [0x98489c]
004a992a 50                       push     eax
004a992b 68f8e79800               push     0x98e7f8
004a9930 57                       push     edi
004a9931 56                       push     esi
004a9932 e86982faff               call     0x451ba0
004a9937 83c410                   add      esp, 0x10
004a993a eb25                     jmp      0x4a9961
004a993c 83ec08                   sub      esp, 8
004a993f a09c489800               mov      al, byte ptr [0x98489c]
004a9944 89642420                 mov      dword ptr [esp + 0x20], esp
004a9948 50                       push     eax
004a9949 8b4c2424                 mov      ecx, dword ptr [esp + 0x24]
004a994d e81ec6f6ff               call     0x415f70
004a9952 68f8e79800               push     0x98e7f8
004a9957 57                       push     edi
004a9958 56                       push     esi
004a9959 e802e00700               call     0x527960
004a995e 83c414                   add      esp, 0x14
004a9961 be01000000               mov      esi, 1
004a9966 e8a598feff               call     0x493210
004a996b 6a41                     push     0x41
004a996d 85c0                     test     eax, eax
004a996f 7407                     je       0x4a9978
004a9971 e87a8efaff               call     0x4527f0
004a9976 eb05                     jmp      0x4a997d
004a9978 e8c3e10700               call     0x527b40
004a997d 83c404                   add      esp, 4
004a9980 03f8                     add      edi, eax
004a9982 392df8e89800             cmp      dword ptr [0x98e8f8], ebp
004a9988 0f8543ffffff             jne      0x4a98d1
004a998e 8b5b06                   mov      ebx, dword ptr [ebx + 6]
004a9991 85db                     test     ebx, ebx
004a9993 751b                     jne      0x4a99b0
004a9995 0fbf05d1c68900           movsx    eax, word ptr [0x89c6d1]
004a999c 8b1df4e79800             mov      ebx, dword ptr [0x98e7f4]
004a99a2 85f6                     test     esi, esi
004a99a4 8d7c3814                 lea      edi, [eax + edi + 0x14]
004a99a8 7506                     jne      0x4a99b0
004a99aa 40                       inc      eax
004a99ab a3ece79800               mov      dword ptr [0x98e7ec], eax
004a99b0 0fbf05d1c68900           movsx    eax, word ptr [0x89c6d1]
004a99b7 3bc7                     cmp      eax, edi
004a99b9 0f8f57fdffff             jg       0x4a9716
004a99bf 5d                       pop      ebp
004a99c0 5f                       pop      edi
004a99c1 5e                       pop      esi
004a99c2 5b                       pop      ebx
004a99c3 83c40c                   add      esp, 0xc
004a99c6 c3                       ret
