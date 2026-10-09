
/workspace/scratch/69fd8163d94e/populous-recovery-20261009/work/orchestration/original-data-recovery-20261009/game/d3dpoptb.exe:     file format pei-i386


Disassembly of section .text:

00510cb0 <.text+0x10fcb0>:
  510cb0:	83 ec 08             	sub    esp,0x8
  510cb3:	53                   	push   ebx
  510cb4:	56                   	push   esi
  510cb5:	8b 74 24 14          	mov    esi,DWORD PTR [esp+0x14]
  510cb9:	57                   	push   edi
  510cba:	8a 4e 2d             	mov    cl,BYTE PTR [esi+0x2d]
  510cbd:	80 f9 04             	cmp    cl,0x4
  510cc0:	72 70                	jb     0x510d32
  510cc2:	66 8b 46 74          	mov    ax,WORD PTR [esi+0x74]
  510cc6:	33 d2                	xor    edx,edx
  510cc8:	66 3b c2             	cmp    ax,dx
  510ccb:	74 17                	je     0x510ce4
  510ccd:	0f b7 c0             	movzx  eax,ax
  510cd0:	8b 04 85 90 03 89 00 	mov    eax,DWORD PTR [eax*4+0x890390]
  510cd7:	f6 40 0c 01          	test   BYTE PTR [eax+0xc],0x1
  510cdb:	75 07                	jne    0x510ce4
  510cdd:	38 50 2a             	cmp    BYTE PTR [eax+0x2a],dl
  510ce0:	74 02                	je     0x510ce4
  510ce2:	8b d0                	mov    edx,eax
  510ce4:	80 f9 17             	cmp    cl,0x17
  510ce7:	74 45                	je     0x510d2e
  510ce9:	85 d2                	test   edx,edx
  510ceb:	74 41                	je     0x510d2e
  510ced:	8d 7e 3d             	lea    edi,[esi+0x3d]
  510cf0:	8d 5c 24 0c          	lea    ebx,[esp+0xc]
  510cf4:	8b 07                	mov    eax,DWORD PTR [edi]
  510cf6:	66 8b 7f 04          	mov    di,WORD PTR [edi+0x4]
  510cfa:	89 03                	mov    DWORD PTR [ebx],eax
  510cfc:	66 89 7b 04          	mov    WORD PTR [ebx+0x4],di
  510d00:	33 c0                	xor    eax,eax
  510d02:	8a c1                	mov    al,cl
  510d04:	8d 5c 24 0c          	lea    ebx,[esp+0xc]
  510d08:	83 e8 03             	sub    eax,0x3
  510d0b:	50                   	push   eax
  510d0c:	53                   	push   ebx
  510d0d:	52                   	push   edx
  510d0e:	e8 dd af f8 ff       	call   0x49bcf0
  510d13:	8d 5c 24 18          	lea    ebx,[esp+0x18]
  510d17:	83 c4 0c             	add    esp,0xc
  510d1a:	fe 46 2d             	inc    BYTE PTR [esi+0x2d]
  510d1d:	53                   	push   ebx
  510d1e:	56                   	push   esi
  510d1f:	e8 5c d8 fd ff       	call   0x4ee580
  510d24:	83 c4 08             	add    esp,0x8
  510d27:	5f                   	pop    edi
  510d28:	5e                   	pop    esi
  510d29:	5b                   	pop    ebx
  510d2a:	83 c4 08             	add    esp,0x8
  510d2d:	c3                   	ret
  510d2e:	c6 46 2d 00          	mov    BYTE PTR [esi+0x2d],0x0
  510d32:	5f                   	pop    edi
  510d33:	5e                   	pop    esi
  510d34:	5b                   	pop    ebx
  510d35:	83 c4 08             	add    esp,0x8
  510d38:	c3                   	ret
  510d39:	cc                   	int3
  510d3a:	cc                   	int3
  510d3b:	cc                   	int3
  510d3c:	cc                   	int3
  510d3d:	cc                   	int3
  510d3e:	cc                   	int3
  510d3f:	cc                   	int3
