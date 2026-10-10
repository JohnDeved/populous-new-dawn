
/workspace/scratch/69fd8163d94e/training-static-recovery-20261009/game/d3dpoptb.exe:     file format pei-i386


Disassembly of section .text:

004980a0 <.text+0x970a0>:
  4980a0:	53                   	push   ebx
  4980a1:	56                   	push   esi
  4980a2:	8b 74 24 0c          	mov    esi,DWORD PTR [esp+0xc]
  4980a6:	57                   	push   edi
  4980a7:	55                   	push   ebp
  4980a8:	33 ff                	xor    edi,edi
  4980aa:	56                   	push   esi
  4980ab:	e8 90 00 00 00       	call   0x498140
  4980b0:	66 8b 86 82 00 00 00 	mov    ax,WORD PTR [esi+0x82]
  4980b7:	83 c4 04             	add    esp,0x4
  4980ba:	66 3b c7             	cmp    ax,di
  4980bd:	74 18                	je     0x4980d7
  4980bf:	0f b7 c0             	movzx  eax,ax
  4980c2:	8b 04 85 90 03 89 00 	mov    eax,DWORD PTR [eax*4+0x890390]
  4980c9:	f6 40 0c 01          	test   BYTE PTR [eax+0xc],0x1
  4980cd:	75 08                	jne    0x4980d7
  4980cf:	80 78 2a 00          	cmp    BYTE PTR [eax+0x2a],0x0
  4980d3:	74 02                	je     0x4980d7
  4980d5:	8b f8                	mov    edi,eax
  4980d7:	85 ff                	test   edi,edi
  4980d9:	74 55                	je     0x498130
  4980db:	0f bf 9f 96 00 00 00 	movsx  ebx,WORD PTR [edi+0x96]
  4980e2:	33 ed                	xor    ebp,ebp
  4980e4:	39 6c 24 18          	cmp    DWORD PTR [esp+0x18],ebp
  4980e8:	7e 32                	jle    0x49811c
  4980ea:	85 db                	test   ebx,ebx
  4980ec:	7e 2e                	jle    0x49811c
  4980ee:	8d 46 3d             	lea    eax,[esi+0x3d]
  4980f1:	50                   	push   eax
  4980f2:	68 ff 00 00 00       	push   0xff
  4980f7:	6a 0b                	push   0xb
  4980f9:	6a 05                	push   0x5
  4980fb:	e8 a0 57 05 00       	call   0x4ed8a0
  498100:	83 c4 10             	add    esp,0x10
  498103:	85 c0                	test   eax,eax
  498105:	74 0e                	je     0x498115
  498107:	83 eb 64             	sub    ebx,0x64
  49810a:	6a 9c                	push   0xffffff9c
  49810c:	57                   	push   edi
  49810d:	e8 ae 21 02 00       	call   0x4ba2c0
  498112:	83 c4 08             	add    esp,0x8
  498115:	45                   	inc    ebp
  498116:	39 6c 24 18          	cmp    DWORD PTR [esp+0x18],ebp
  49811a:	7f ce                	jg     0x4980ea
  49811c:	66 83 bf 96 00 00 00 	cmp    WORD PTR [edi+0x96],0x0
  498123:	00 
  498124:	7f 0a                	jg     0x498130
  498126:	56                   	push   esi
  498127:	57                   	push   edi
  498128:	e8 03 30 f7 ff       	call   0x40b130
  49812d:	83 c4 08             	add    esp,0x8
  498130:	5d                   	pop    ebp
  498131:	5f                   	pop    edi
  498132:	5e                   	pop    esi
  498133:	5b                   	pop    ebx
  498134:	c3                   	ret
  498135:	cc                   	int3
  498136:	cc                   	int3
  498137:	cc                   	int3
  498138:	cc                   	int3
  498139:	cc                   	int3
  49813a:	cc                   	int3
  49813b:	cc                   	int3
  49813c:	cc                   	int3
  49813d:	cc                   	int3
  49813e:	cc                   	int3
  49813f:	cc                   	int3
