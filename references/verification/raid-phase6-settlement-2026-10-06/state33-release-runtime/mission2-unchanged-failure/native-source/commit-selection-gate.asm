
/workspace/scratch/69fd8163d94e/cloud-dev-20261004/prerequisites/game/d3dpoptb.exe:     file format pei-i386


Disassembly of section .text:

00435a8a <.text+0x34a8a>:
  435a8a:	83 7c 24 18 00       	cmp    DWORD PTR [esp+0x18],0x0
  435a8f:	0f 84 60 01 00 00    	je     0x435bf5
  435a95:	8b 44 24 48          	mov    eax,DWORD PTR [esp+0x48]
  435a99:	8b a8 81 08 00 00    	mov    ebp,DWORD PTR [eax+0x881]
  435a9f:	85 ed                	test   ebp,ebp
  435aa1:	0f 84 4e 01 00 00    	je     0x435bf5
  435aa7:	f6 45 7a 80          	test   BYTE PTR [ebp+0x7a],0x80
  435aab:	0f 84 39 01 00 00    	je     0x435bea
  435ab1:	83 7c 24 4c ff       	cmp    DWORD PTR [esp+0x4c],0xffffffff
  435ab6:	74 1b                	je     0x435ad3
  435ab8:	33 c0                	xor    eax,eax
  435aba:	8a 45 2b             	mov    al,BYTE PTR [ebp+0x2b]
  435abd:	39 44 24 4c          	cmp    DWORD PTR [esp+0x4c],eax
  435ac1:	74 10                	je     0x435ad3
  435ac3:	39 44 24 50          	cmp    DWORD PTR [esp+0x50],eax
  435ac7:	74 0a                	je     0x435ad3
  435ac9:	39 44 24 54          	cmp    DWORD PTR [esp+0x54],eax
  435acd:	0f 85 17 01 00 00    	jne    0x435bea
