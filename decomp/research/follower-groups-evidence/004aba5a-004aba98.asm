004aba5a: b8ffffffff           mov eax, 0xffffffff
004aba5f: a268d18900           mov byte ptr [0x89d168], al
004aba64: a269d18900           mov byte ptr [0x89d169], al
004aba69: a26ad18900           mov byte ptr [0x89d16a], al
004aba6e: a26bd18900           mov byte ptr [0x89d16b], al
004aba73: a26cd18900           mov byte ptr [0x89d16c], al
004aba78: a26dd18900           mov byte ptr [0x89d16d], al
004aba7d: e960010000           jmp 0x4abbe2
004aba82: b868d18900           mov eax, 0x89d168
004aba87: c70000000000         mov dword ptr [eax], 0
004aba8d: 66c740040000         mov word ptr [eax + 4], 0
004aba93: e94a010000           jmp 0x4abbe2
