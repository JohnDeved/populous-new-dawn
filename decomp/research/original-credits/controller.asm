004a9380 83ec04                   sub      esp, 4
004a9383 33c0                     xor      eax, eax
004a9385 a002f08800               mov      al, byte ptr [0x88f002]
004a938a 53                       push     ebx
004a938b 56                       push     esi
004a938c 83f801                   cmp      eax, 1
004a938f 57                       push     edi
004a9390 0f84ee000000             je       0x4a9484
004a9396 83f804                   cmp      eax, 4
004a9399 0f84d7010000             je       0x4a9576
004a939f 83f805                   cmp      eax, 5
004a93a2 0f84b5010000             je       0x4a955d
004a93a8 8b3584c7d000             mov      esi, dword ptr [0xd0c784]
004a93ae 803d02f0880005           cmp      byte ptr [0x88f002], 5
004a93b5 0f842a030000             je       0x4a96e5
004a93bb 803d02f0880004           cmp      byte ptr [0x88f002], 4
004a93c2 0f841d030000             je       0x4a96e5
004a93c8 6a00                     push     0
004a93ca a0f5c68900               mov      al, byte ptr [0x89c6f5]
004a93cf 83ec08                   sub      esp, 8
004a93d2 89642418                 mov      dword ptr [esp + 0x18], esp
004a93d6 50                       push     eax
004a93d7 8b4c241c                 mov      ecx, dword ptr [esp + 0x1c]
004a93db e890cbf6ff               call     0x415f70
004a93e0 6a00                     push     0
004a93e2 e869920000               call     0x4b2650
004a93e7 50                       push     eax
004a93e8 e853050800               call     0x529940
004a93ed 83c414                   add      esp, 0x14
004a93f0 ff0544a45c00             inc      dword ptr [0x5ca444]
004a93f6 e8653e0500               call     0x4fd260
004a93fb 6a00                     push     0
004a93fd e84e920000               call     0x4b2650
004a9402 50                       push     eax
004a9403 e8c8090800               call     0x529dd0
004a9408 83c408                   add      esp, 8
004a940b 83f801                   cmp      eax, 1
004a940e 1ac0                     sbb      al, al
004a9410 f6d8                     neg      al
004a9412 a240df5900               mov      byte ptr [0x59df40], al
004a9417 e834920000               call     0x4b2650
004a941c 50                       push     eax
004a941d e89eed0700               call     0x5281c0
004a9422 83c404                   add      esp, 4
004a9425 e826920000               call     0x4b2650
004a942a 8b4824                   mov      ecx, dword ptr [eax + 0x24]
004a942d 66890dd5c68900           mov      word ptr [0x89c6d5], cx
004a9434 e817920000               call     0x4b2650
004a9439 8b4820                   mov      ecx, dword ptr [eax + 0x20]
004a943c 803d40df590000           cmp      byte ptr [0x59df40], 0
004a9443 66890dd7c68900           mov      word ptr [0x89c6d7], cx
004a944a 0f8495020000             je       0x4a96e5
004a9450 bf10000000               mov      edi, 0x10
004a9455 e8a66cfdff               call     0x480100
004a945a 33db                     xor      ebx, ebx
004a945c 391d98489800             cmp      dword ptr [0x984898], ebx
004a9462 0f8441010000             je       0x4a95a9
004a9468 a198489800               mov      eax, dword ptr [0x984898]
004a946d 83f801                   cmp      eax, 1
004a9470 0f841d010000             je       0x4a9593
004a9476 83f839                   cmp      eax, 0x39
004a9479 0f841b010000             je       0x4a959a
004a947f e91b010000               jmp      0x4a959f
004a9484 e8879dfeff               call     0x493210
004a9489 85c0                     test     eax, eax
004a948b 7419                     je       0x4a94a6
004a948d 33c0                     xor      eax, eax
004a948f a0d4288900               mov      al, byte ptr [0x8928d4]
004a9494 8b0c85d0cb8700           mov      ecx, dword ptr [eax*4 + 0x87cbd0]
004a949b 51                       push     ecx
004a949c e89f86faff               call     0x451b40
004a94a1 83c404                   add      esp, 4
004a94a4 eb1c                     jmp      0x4a94c2
004a94a6 33c0                     xor      eax, eax
004a94a8 a0d4288900               mov      al, byte ptr [0x8928d4]
004a94ad 8b0c85d0cb8700           mov      ecx, dword ptr [eax*4 + 0x87cbd0]
004a94b4 51                       push     ecx
004a94b5 6888165900               push     0x591688
004a94ba e871d80600               call     0x516d30
004a94bf 83c408                   add      esp, 8
004a94c2 e85907f8ff               call     0x429c20
004a94c7 68f4c68900               push     0x89c6f4
004a94cc a1f8ef8700               mov      eax, dword ptr [0x87eff8]
004a94d1 50                       push     eax
004a94d2 33db                     xor      ebx, ebx
004a94d4 e8e718f8ff               call     0x42adc0
004a94d9 83c408                   add      esp, 8
004a94dc a0f6c68900               mov      al, byte ptr [0x89c6f6]
004a94e1 a29c489800               mov      byte ptr [0x98489c], al
004a94e6 53                       push     ebx
004a94e7 e8d49c0700               call     0x5231c0
004a94ec 83c404                   add      esp, 4
004a94ef 8b0df8ef8700             mov      ecx, dword ptr [0x87eff8]
004a94f5 51                       push     ecx
004a94f6 e8259fffff               call     0x4a3420
004a94fb 83c404                   add      esp, 4
004a94fe e82da0ffff               call     0x4a3530
004a9503 6a03                     push     3
004a9505 e8d695f9ff               call     0x442ae0
004a950a 891de8e79800             mov      dword ptr [0x98e7e8], ebx
004a9510 83c404                   add      esp, 4
004a9513 891dece79800             mov      dword ptr [0x98e7ec], ebx
004a9519 b8e8e79800               mov      eax, 0x98e7e8
004a951e e8ad040000               call     0x4a99d0
004a9523 8b3584c7d000             mov      esi, dword ptr [0xd0c784]
004a9529 ffd6                     call     esi
004a952b 53                       push     ebx
004a952c a300e99800               mov      dword ptr [0x98e900], eax
004a9531 0fbe0533ce8900           movsx    eax, byte ptr [0x89ce33]
004a9538 53                       push     ebx
004a9539 a304e99800               mov      dword ptr [0x98e904], eax
004a953e 53                       push     ebx
004a953f e8bc340500               call     0x4fca00
004a9544 83c40c                   add      esp, 0xc
004a9547 881d92459800             mov      byte ptr [0x984592], bl
004a954d 881d92469800             mov      byte ptr [0x984692], bl
004a9553 e8d803ffff               call     0x499930
004a9558 e951feffff               jmp      0x4a93ae
004a955d 6a00                     push     0
004a955f e85c9c0700               call     0x5231c0
004a9564 83c404                   add      esp, 4
004a9567 e8c49fffff               call     0x4a3530
004a956c 6a04                     push     4
004a956e e86d95f9ff               call     0x442ae0
004a9573 83c404                   add      esp, 4
004a9576 803d24048e0000           cmp      byte ptr [0x8e0424], 0
004a957d 7505                     jne      0x4a9584
004a957f e82c95f9ff               call     0x442ab0
004a9584 a05ed18900               mov      al, byte ptr [0x89d15e]
004a9589 a290459800               mov      byte ptr [0x984590], al
004a958e e915feffff               jmp      0x4a93a8
004a9593 bb01000000               mov      ebx, 1
004a9598 eb05                     jmp      0x4a959f
004a959a bf04000000               mov      edi, 4
004a959f c7059848980000000000     mov      dword ptr [0x984898], 0
004a95a9 85db                     test     ebx, ebx
004a95ab 753e                     jne      0x4a95eb
004a95ad 803d8146980000           cmp      byte ptr [0x984681], 0
004a95b4 7409                     je       0x4a95bf
004a95b6 803d8147980000           cmp      byte ptr [0x984781], 0
004a95bd 742c                     je       0x4a95eb
004a95bf 803d8346980000           cmp      byte ptr [0x984683], 0
004a95c6 7409                     je       0x4a95d1
004a95c8 803d8347980000           cmp      byte ptr [0x984783], 0
004a95cf 741a                     je       0x4a95eb
004a95d1 803d8246980000           cmp      byte ptr [0x984682], 0
004a95d8 0f84be000000             je       0x4a969c
004a95de 803d8247980000           cmp      byte ptr [0x984782], 0
004a95e5 0f85b1000000             jne      0x4a969c
004a95eb 6a07                     push     7
004a95ed e86e94f9ff               call     0x442a60
004a95f2 83c404                   add      esp, 4
004a95f5 e876900000               call     0x4b2670
004a95fa f60570a8d00001           test     byte ptr [0xd0a870], 1
004a9601 8bd8                     mov      ebx, eax
004a9603 750d                     jne      0x4a9612
004a9605 800d70a8d00001           or       byte ptr [0xd0a870], 1
004a960c 891d74a8d000             mov      dword ptr [0xd0a874], ebx
004a9612 391d74a8d000             cmp      dword ptr [0xd0a874], ebx
004a9618 7509                     jne      0x4a9623
004a961a f605fc9d740040           test     byte ptr [0x749dfc], 0x40
004a9621 7415                     je       0x4a9638
004a9623 6a00                     push     0
004a9625 6a00                     push     0
004a9627 6a00                     push     0
004a9629 e8d2330500               call     0x4fca00
004a962e 8325fc9d7400bf           and      dword ptr [0x749dfc], 0xffffffbf
004a9635 83c40c                   add      esp, 0xc
004a9638 891d74a8d000             mov      dword ptr [0xd0a874], ebx
004a963e e82d900000               call     0x4b2670
004a9643 f60570a8d00001           test     byte ptr [0xd0a870], 1
004a964a 8bd8                     mov      ebx, eax
004a964c 750d                     jne      0x4a965b
004a964e 800d70a8d00001           or       byte ptr [0xd0a870], 1
004a9655 891d74a8d000             mov      dword ptr [0xd0a874], ebx
004a965b 3b1d74a8d000             cmp      ebx, dword ptr [0xd0a874]
004a9661 7509                     jne      0x4a966c
004a9663 f605fc9d740040           test     byte ptr [0x749dfc], 0x40
004a966a 7519                     jne      0x4a9685
004a966c 6a00                     push     0
004a966e a1949d7400               mov      eax, dword ptr [0x749d94]
004a9673 6a00                     push     0
004a9675 50                       push     eax
004a9676 e885330500               call     0x4fca00
004a967b 830dfc9d740040           or       dword ptr [0x749dfc], 0x40
004a9682 83c40c                   add      esp, 0xc
004a9685 33c0                     xor      eax, eax
004a9687 891d74a8d000             mov      dword ptr [0xd0a874], ebx
004a968d a292459800               mov      byte ptr [0x984592], al
004a9692 a292469800               mov      byte ptr [0x984692], al
004a9697 e89402ffff               call     0x499930
004a969c ffd6                     call     esi
004a969e 3b0500e99800             cmp      eax, dword ptr [0x98e900]
004a96a4 7616                     jbe      0x4a96bc
004a96a6 ff0dece79800             dec      dword ptr [0x98e7ec]
004a96ac 013d00e99800             add      dword ptr [0x98e900], edi
004a96b2 ffd6                     call     esi
004a96b4 3b0500e99800             cmp      eax, dword ptr [0x98e900]
004a96ba 77ea                     ja       0x4a96a6
004a96bc e82f000000               call     0x4a96f0
004a96c1 e8fa68fdff               call     0x47ffc0
004a96c6 e8556efdff               call     0x480520
004a96cb e8808f0000               call     0x4b2650
004a96d0 50                       push     eax
004a96d1 e88a070800               call     0x529e60
004a96d6 c60540df590000           mov      byte ptr [0x59df40], 0
004a96dd 83c404                   add      esp, 4
004a96e0 e80b3c0500               call     0x4fd2f0
004a96e5 5f                       pop      edi
004a96e6 5e                       pop      esi
004a96e7 5b                       pop      ebx
004a96e8 83c404                   add      esp, 4
004a96eb c3                       ret
