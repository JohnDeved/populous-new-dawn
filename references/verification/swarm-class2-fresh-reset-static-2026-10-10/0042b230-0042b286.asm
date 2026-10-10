
/workspace/scratch/69fd8163d94e/training-static-recovery-20261009/game/d3dpoptb.exe:     file format pei-i386


Disassembly of section .text:

0042b230 <.text+0x2a230>:
  42b230:	83 ec 04             	sub    esp,0x4
  42b233:	33 c0                	xor    eax,eax
  42b235:	b9 08 00 00 00       	mov    ecx,0x8
  42b23a:	53                   	push   ebx
  42b23b:	c6 44 24 07 00       	mov    BYTE PTR [esp+0x7],0x0
  42b240:	56                   	push   esi
  42b241:	57                   	push   edi
  42b242:	bf 80 f4 64 00       	mov    edi,0x64f480
  42b247:	6a 01                	push   0x1
  42b249:	f3 ab                	rep stos DWORD PTR es:[edi],eax
  42b24b:	bf e4 03 8a 00       	mov    edi,0x8a03e4
  42b250:	e8 2b c5 04 00       	call   0x477780
  42b255:	83 c4 04             	add    esp,0x4
  42b258:	e8 f3 3c 0c 00       	call   0x4eef50
  42b25d:	33 c0                	xor    eax,eax
  42b25f:	b9 00 00 01 00       	mov    ecx,0x10000
  42b264:	81 25 61 c6 89 00 ff 	and    DWORD PTR ds:0x89c661,0xfdffffff
  42b26b:	ff ff fd 
  42b26e:	81 25 61 c6 89 00 ff 	and    DWORD PTR ds:0x89c661,0xfbffffff
  42b275:	ff ff fb 
  42b278:	83 25 69 c6 89 00 df 	and    DWORD PTR ds:0x89c669,0xffffffdf
  42b27f:	f3 ab                	rep stos DWORD PTR es:[edi],eax
  42b281:	e8 fa d9 01 00       	call   0x448c80
